import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { optimizeImageToWebp } from './image-optimizer.js';

const createPng = (width: number, height: number): Promise<Buffer> =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 20, g: 120, b: 200 },
    },
  })
    .png()
    .toBuffer();

const metadataOf = (buffer: Buffer) => sharp(buffer).metadata();

describe('optimizeImageToWebp', () => {
  it('convierte PNG a WebP y limita el ancho de productos a 1200px', async () => {
    const input = await createPng(2000, 1000);
    const result = await optimizeImageToWebp(input, 'products');
    const metadata = await metadataOf(result.buffer);

    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(600);
    expect(result.width).toBe(1200);
    expect(result.height).toBe(600);
    expect(result.size).toBe(result.buffer.byteLength);
  });

  it('usa el perfil de categorías y no agranda imágenes pequeñas', async () => {
    const input = await createPng(300, 200);
    const result = await optimizeImageToWebp(input, 'categories');
    const metadata = await metadataOf(result.buffer);

    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(300);
    expect(metadata.height).toBe(200);
  });

  it('reduce imágenes grandes de categorías a 800px', async () => {
    const input = await createPng(1600, 800);
    const result = await optimizeImageToWebp(input, 'categories');

    expect(result.width).toBe(800);
    expect(result.height).toBe(400);
  });

  it('limita comprobantes a 2000px y adjuntos de chat a 1600px', async () => {
    const receiptsInput = await createPng(3000, 1000);
    const receipts = await optimizeImageToWebp(receiptsInput, 'receipts');
    expect(receipts.width).toBe(2000);
    expect(receipts.height).toBe(667);

    const chatInput = await createPng(3000, 2000);
    const chat = await optimizeImageToWebp(chatInput, 'chat');
    expect(chat.width).toBe(1600);
    expect(chat.height).toBe(1067);
  });

  it('rechaza archivos que no son imágenes válidas', async () => {
    const invalid = Buffer.from('esto no es una imagen');

    await expect(
      optimizeImageToWebp(invalid, 'products'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
