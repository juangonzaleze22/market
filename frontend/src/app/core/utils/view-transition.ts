export function productTransitionName(id: string): string {
  return `product-image-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}
