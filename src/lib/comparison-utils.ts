// ─── Product Comparison (T-06.2) ────────────────────────────────────────────
// Port dari Hera Store React ComparisonContext.jsx — localStorage-based,
// maksimal 4 produk, sinkron antar komponen via event "compare-updated".

export interface CompareItem {
  id: string;
  name: string;
  price: number;
  discount_price?: number | null;
  emoji?: string;
  stock?: number;
  slug?: string;
}

const KEY = "hera_compare";
export const MAX_COMPARE = 4;

export function getCompare(): CompareItem[] {
  try {
    const data = localStorage.getItem(KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(items: CompareItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("compare-updated"));
}

export function toggleCompare(product: {
  id: string;
  name: string;
  price: number;
  discount_price?: number | null;
  emoji?: string;
  stock?: number;
  slug?: string;
}): { items: CompareItem[]; added: boolean; full: boolean } {
  const list = getCompare();
  if (list.some((i) => i.id === product.id)) {
    const next = list.filter((i) => i.id !== product.id);
    save(next);
    return { items: next, added: false, full: false };
  }
  if (list.length >= MAX_COMPARE) {
    return { items: list, added: false, full: true };
  }
  const next = [
    ...list,
    {
      id: product.id,
      name: product.name,
      price: product.price,
      discount_price: product.discount_price ?? null,
      emoji: product.emoji,
      stock: product.stock,
      slug: product.slug,
    },
  ];
  save(next);
  return { items: next, added: true, full: false };
}

export function removeFromCompare(productId: string): void {
  save(getCompare().filter((i) => i.id !== productId));
}

export function isInCompare(productId: string): boolean {
  return getCompare().some((i) => i.id === productId);
}

export function clearCompare(): void {
  save([]);
}
