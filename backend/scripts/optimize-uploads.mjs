import { existsSync, readFileSync } from 'node:fs';
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, extname, join, resolve } from 'node:path';
import sharp from 'sharp';
import pg from 'pg';

const { Client } = pg;

const DRY_RUN = process.argv.includes('--dry-run');
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif']);
const REMOTE_TIMEOUT_MS = 30_000;

const PROFILES = {
  products: { maxWidth: 1200, maxHeight: 1200, quality: 82 },
  categories: { maxWidth: 800, maxHeight: 800, quality: 82 },
  banners: { maxWidth: 1920, maxHeight: 1920, quality: 82 },
  receipts: { maxWidth: 2000, maxHeight: 2000, quality: 85 },
  chat: { maxWidth: 1600, maxHeight: 1600, quality: 80 },
};

const loadEnvFile = () => {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
};

const encode = async (buffer, profile, failOn) => {
  const { data, info } = await sharp(buffer, {
    failOn,
    limitInputPixels: 25_000_000,
  })
    .rotate()
    .resize({
      width: profile.maxWidth,
      height: profile.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: profile.quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return { data, info };
};

const optimize = async (buffer, profile) => {
  try {
    return { ...(await encode(buffer, profile, 'error')), warning: null };
  } catch (error) {
    return {
      ...(await encode(buffer, profile, 'none')),
      warning: error.message,
    };
  }
};

const isRemoteImageUrl = (url) =>
  /^https?:\/\//i.test(url) &&
  !/\/uploads\//i.test(url) &&
  !/\.pdf(\?|$)/i.test(url);

const downloadImage = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      throw new Error(
        `Content-Type no es imagen: ${contentType || 'desconocido'}`,
      );
    }

    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
};

const collectRemoteImages = async (client) => {
  const found = new Map();

  const add = (value, bucket) => {
    if (typeof value !== 'string') return;

    const url = value.trim();
    if (!isRemoteImageUrl(url) || found.has(url)) return;

    found.set(url, bucket);
  };

  const products = await client.query(
    'SELECT images, "featuredImage" FROM products',
  );
  for (const row of products.rows) {
    for (const url of (row.images ?? '').split(',')) add(url, 'products');
    add(row.featuredImage, 'products');
  }

  const categories = await client.query(
    'SELECT "imageUrl" FROM categories WHERE "imageUrl" IS NOT NULL',
  );
  for (const row of categories.rows) add(row.imageUrl, 'categories');

  const banners = await client.query(
    'SELECT "imageUrl" FROM banners WHERE "imageUrl" IS NOT NULL',
  );
  for (const row of banners.rows) add(row.imageUrl, 'banners');

  const orders = await client.query(
    'SELECT "receiptUrl" FROM orders WHERE "receiptUrl" IS NOT NULL',
  );
  for (const row of orders.rows) add(row.receiptUrl, 'receipts');

  const expenses = await client.query(
    'SELECT "receiptUrl" FROM expenses WHERE "receiptUrl" IS NOT NULL',
  );
  for (const row of expenses.rows) add(row.receiptUrl, 'receipts');

  const messages = await client.query(
    'SELECT attachments FROM order_messages WHERE jsonb_array_length(attachments) > 0',
  );
  for (const row of messages.rows) {
    for (const attachment of row.attachments ?? []) {
      add(attachment.url, 'chat');
    }
  }

  return found;
};

const replaceUrl = (value, changes) =>
  value ? (changes.get(value) ?? value) : value;

const updateDatabase = async (client, changes) => {
  const stats = {
    products: 0,
    categories: 0,
    banners: 0,
    orders: 0,
    expenses: 0,
    messages: 0,
  };

  const products = await client.query(
    'SELECT id, images, "featuredImage" FROM products',
  );
  for (const row of products.rows) {
    const nextImages = row.images
      ? row.images
          .split(',')
          .map((url) => replaceUrl(url.trim(), changes))
          .join(',')
      : row.images;
    const nextFeatured = replaceUrl(row.featuredImage, changes);

    if (nextImages !== row.images || nextFeatured !== row.featuredImage) {
      if (!DRY_RUN) {
        await client.query(
          'UPDATE products SET images = $1, "featuredImage" = $2 WHERE id = $3',
          [nextImages, nextFeatured, row.id],
        );
      }
      stats.products++;
    }
  }

  const categories = await client.query(
    'SELECT id, "imageUrl" FROM categories WHERE "imageUrl" IS NOT NULL',
  );
  for (const row of categories.rows) {
    const nextImage = replaceUrl(row.imageUrl, changes);
    if (nextImage !== row.imageUrl) {
      if (!DRY_RUN) {
        await client.query(
          'UPDATE categories SET "imageUrl" = $1 WHERE id = $2',
          [nextImage, row.id],
        );
      }
      stats.categories++;
    }
  }

  const banners = await client.query(
    'SELECT id, "imageUrl" FROM banners WHERE "imageUrl" IS NOT NULL',
  );
  for (const row of banners.rows) {
    const nextImage = replaceUrl(row.imageUrl, changes);
    if (nextImage !== row.imageUrl) {
      if (!DRY_RUN) {
        await client.query('UPDATE banners SET "imageUrl" = $1 WHERE id = $2', [
          nextImage,
          row.id,
        ]);
      }
      stats.banners++;
    }
  }

  const orders = await client.query(
    'SELECT id, "receiptUrl" FROM orders WHERE "receiptUrl" IS NOT NULL',
  );
  for (const row of orders.rows) {
    const nextReceipt = replaceUrl(row.receiptUrl, changes);
    if (nextReceipt !== row.receiptUrl) {
      if (!DRY_RUN) {
        await client.query(
          'UPDATE orders SET "receiptUrl" = $1 WHERE id = $2',
          [nextReceipt, row.id],
        );
      }
      stats.orders++;
    }
  }

  const expenses = await client.query(
    'SELECT id, "receiptUrl" FROM expenses WHERE "receiptUrl" IS NOT NULL',
  );
  for (const row of expenses.rows) {
    const nextReceipt = replaceUrl(row.receiptUrl, changes);
    if (nextReceipt !== row.receiptUrl) {
      if (!DRY_RUN) {
        await client.query(
          'UPDATE expenses SET "receiptUrl" = $1 WHERE id = $2',
          [nextReceipt, row.id],
        );
      }
      stats.expenses++;
    }
  }

  const messages = await client.query(
    'SELECT id, attachments FROM order_messages WHERE jsonb_array_length(attachments) > 0',
  );
  for (const row of messages.rows) {
    let changed = false;
    const nextAttachments = (row.attachments ?? []).map((attachment) => {
      const nextUrl = replaceUrl(attachment.url, changes);
      if (nextUrl === attachment.url) return attachment;

      changed = true;
      const isWebp = /\.webp(\?|$)/i.test(nextUrl);
      return {
        ...attachment,
        url: nextUrl,
        name: isWebp
          ? attachment.name.replace(/\.[^.]+$/, '.webp')
          : attachment.name,
        type: isWebp ? 'image/webp' : attachment.type,
      };
    });

    if (changed) {
      if (!DRY_RUN) {
        await client.query(
          'UPDATE order_messages SET attachments = $1 WHERE id = $2',
          [JSON.stringify(nextAttachments), row.id],
        );
      }
      stats.messages++;
    }
  }

  return stats;
};

const moveToBackup = async (originals, backupDir) => {
  for (const original of originals) {
    const destination = join(backupDir, original.relativePath);
    await mkdir(dirname(destination), { recursive: true });
    try {
      await rename(original.absolutePath, destination);
    } catch {
      await copyFile(original.absolutePath, destination);
      await unlink(original.absolutePath);
    }
  }
};

const formatMb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const main = async () => {
  loadEnvFile();

  const uploadDir = resolve(
    process.cwd(),
    process.env.UPLOAD_ROOT ?? 'uploads',
  );
  const publicUrl = (
    process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
  ).replace(/\/+$/, '');

  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'market_db',
  });

  const changes = new Map();
  const originals = [];
  const createdFiles = [];
  let converted = 0;
  let skipped = 0;
  let failed = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;
  let remoteConverted = 0;
  let remoteFailed = 0;
  let remoteBytesBefore = 0;
  let remoteBytesAfter = 0;
  let committed = false;

  try {
    await client.connect();

    const remoteImages = await collectRemoteImages(client);
    for (const [url, bucket] of remoteImages) {
      const profile = PROFILES[bucket];
      if (!profile) continue;

      try {
        const input = await downloadImage(url);
        const { data, info, warning } = await optimize(input, profile);
        const newFilename = `${Date.now()}-${randomUUID()}.webp`;
        const outputPath = join(uploadDir, bucket, newFilename);

        if (!DRY_RUN) {
          await mkdir(join(uploadDir, bucket), { recursive: true });
          await writeFile(outputPath, data, { flag: 'wx' });
          createdFiles.push(outputPath);
        }

        changes.set(url, `${publicUrl}/uploads/${bucket}/${newFilename}`);
        remoteConverted++;
        remoteBytesBefore += input.byteLength;
        remoteBytesAfter += info.size;

        const warningText = warning
          ? ` (aviso: ${warning}; convertida en modo tolerante)`
          : '';
        console.log(
          `remota ${url} (${formatMb(input.byteLength)}) -> ${bucket}/${newFilename} (${formatMb(info.size)})${warningText}`,
        );
      } catch (error) {
        remoteFailed++;
        console.warn(`Omitida remota ${url}: ${error.message}`);
      }
    }

    for (const [bucket, profile] of Object.entries(PROFILES)) {
      const bucketDir = join(uploadDir, bucket);
      if (!existsSync(bucketDir)) continue;

      const entries = await readdir(bucketDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;

        const extension = extname(entry.name).toLowerCase();
        if (!IMAGE_EXTENSIONS.has(extension)) {
          skipped++;
          continue;
        }

        const inputPath = join(bucketDir, entry.name);
        try {
          const input = await readFile(inputPath);
          const { data, info, warning } = await optimize(input, profile);
          const newFilename = `${Date.now()}-${randomUUID()}.webp`;
          const outputPath = join(bucketDir, newFilename);

          if (!DRY_RUN) {
            await writeFile(outputPath, data, { flag: 'wx' });
            createdFiles.push(outputPath);
          }

          const oldUrl = `${publicUrl}/uploads/${bucket}/${entry.name}`;
          const oldRelativeUrl = `/uploads/${bucket}/${entry.name}`;
          const newUrl = `${publicUrl}/uploads/${bucket}/${newFilename}`;

          changes.set(oldUrl, newUrl);
          changes.set(oldRelativeUrl, newUrl);
          originals.push({
            absolutePath: inputPath,
            relativePath: join(bucket, entry.name),
          });

          converted++;
          bytesBefore += input.byteLength;
          bytesAfter += info.size;

          const warningText = warning
            ? ` (aviso: ${warning}; convertida en modo tolerante)`
            : '';
          console.log(
            `${bucket}/${entry.name} (${formatMb(input.byteLength)}) -> ${newFilename} (${formatMb(info.size)})${warningText}`,
          );
        } catch (error) {
          failed++;
          console.warn(`Omitida ${bucket}/${entry.name}: ${error.message}`);
        }
      }
    }

    if (changes.size === 0) {
      console.log('No hay imágenes por migrar.');
      return;
    }

    if (!DRY_RUN) await client.query('BEGIN');
    const stats = await updateDatabase(client, changes);

    if (DRY_RUN) {
      await client.query('ROLLBACK');
    } else {
      await client.query('COMMIT');
      committed = true;
    }

    console.log(
      `\nReferencias actualizadas: ${stats.products} productos, ${stats.categories} categorías, ${stats.banners} banners, ${stats.orders} pedidos, ${stats.expenses} gastos, ${stats.messages} mensajes.`,
    );
    console.log(
      `Imágenes locales convertidas: ${converted}, omitidas: ${skipped}, fallidas: ${failed}.`,
    );
    if (converted > 0) {
      console.log(
        `Peso local: ${formatMb(bytesBefore)} -> ${formatMb(bytesAfter)} (${((1 - bytesAfter / bytesBefore) * 100).toFixed(1)}% menos).`,
      );
    }
    console.log(
      `Imágenes remotas convertidas: ${remoteConverted}, fallidas: ${remoteFailed}.`,
    );
    if (remoteConverted > 0) {
      console.log(
        `Peso remoto: ${formatMb(remoteBytesBefore)} -> ${formatMb(remoteBytesAfter)} (${((1 - remoteBytesAfter / remoteBytesBefore) * 100).toFixed(1)}% menos).`,
      );
    }

    if (!DRY_RUN && originals.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = resolve(
        process.cwd(),
        '.backups',
        `uploads-${timestamp}`,
      );
      await moveToBackup(originals, backupDir);
      console.log(`Originales respaldados en ${backupDir}`);
    }

    if (DRY_RUN) {
      console.log(
        '\nDry run: no se modificó ningún archivo ni la base de datos.',
      );
    }
  } catch (error) {
    if (!committed && !DRY_RUN) {
      await client.query('ROLLBACK').catch(() => undefined);
      await Promise.all(
        createdFiles.map((file) => unlink(file).catch(() => undefined)),
      );
    }
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
};

main().catch((error) => {
  console.error('No se pudo optimizar las imágenes:', error.message);
  process.exitCode = 1;
});
