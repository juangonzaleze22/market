import type { Repository } from 'typeorm';
import { BranchProductStock } from '../database/entities/branch-product-stock.entity.js';

export interface BranchStockInput {
  branchId: string;
  stock?: number;
  isActive?: boolean;
}

export interface NormalizedBranchStock {
  branchId: string;
  stock: number;
  isActive: boolean;
}

export function normalizeBranchStocks(
  entries: BranchStockInput[] | undefined,
): NormalizedBranchStock[] {
  if (!entries || entries.length === 0) return [];

  const byBranch = new Map<string, NormalizedBranchStock>();
  for (const entry of entries) {
    if (!entry?.branchId) continue;
    const value = Number(entry.stock);
    const stock = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    byBranch.set(entry.branchId, {
      branchId: entry.branchId,
      stock,
      isActive: entry.isActive !== false,
    });
  }

  return [...byBranch.values()];
}

export function sumBranchStocks(entries: NormalizedBranchStock[]): number {
  return entries.reduce((total, entry) => total + entry.stock, 0);
}

export async function replaceBranchStocks(
  repository: Repository<BranchProductStock>,
  productId: string,
  entries: BranchStockInput[],
): Promise<number> {
  const normalized = normalizeBranchStocks(entries);

  await repository.delete({ productId });

  if (normalized.length > 0) {
    await repository.save(
      normalized.map((entry) =>
        repository.create({
          productId,
          branchId: entry.branchId,
          stock: entry.stock,
          isActive: entry.isActive,
        }),
      ),
    );
  }

  return sumBranchStocks(normalized);
}
