export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  /** T-47: URL gambar produk (pengganti emoji) */
  image?: string;
  variant?: string | null;
  stock?: number;
  slug?: string;
  variantId?: string | null;
  originalPrice?: number | null;
}

export function getCart(): CartItem[] {
  try {
    const data = localStorage.getItem("hera_cart");
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem("hera_cart", JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    stock?: number;
    slug?: string;
    originalPrice?: number | null;
  },
  qty: number,
  variant?: string | null,
  variantId?: string | null
): CartItem[] {
  const cart = getCart();
  const key = variantId ?? null;
  const existingIndex = cart.findIndex(
    (item) => item.id === product.id && (item.variantId ?? null) === key
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity = Math.min(
      product.stock ?? 99,
      cart[existingIndex].quantity + qty
    );
    if (product.image) cart[existingIndex].image = product.image;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      image: product.image,
      variant: variant ?? null,
      stock: product.stock,
      slug: product.slug,
      variantId: variantId ?? null,
      originalPrice: product.originalPrice ?? null,
    });
  }

  saveCart(cart);
  return cart;
}

export function getWishlist(): string[] {
  try {
    const data = localStorage.getItem("hera_wishlist");
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleWishlist(productId: string): string[] {
  const wish = getWishlist();
  const idx = wish.indexOf(productId);
  if (idx > -1) {
    wish.splice(idx, 1);
  } else {
    wish.push(productId);
  }
  localStorage.setItem("hera_wishlist", JSON.stringify(wish));
  window.dispatchEvent(new Event("wishlist-updated"));
  return wish;
}