// Utilitas Konfigurasi Nama dan Info Toko
// Menggunakan Environment Variables dengan fallback default "Hera Skincare"

export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Hera Skincare";
export const STORE_EMAIL = process.env.NEXT_PUBLIC_STORE_EMAIL || "info@heraskincare.com";
export const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE || "+6281234567890";
export const STORE_DESCRIPTION = 
  process.env.NEXT_PUBLIC_STORE_DESCRIPTION || 
  `${STORE_NAME} adalah marketplace skincare & perawatan pribadi premium dengan berbagai pilihan produk berkualitas tinggi.`;
export const STORE_ADDRESS = 
  process.env.NEXT_PUBLIC_STORE_ADDRESS || 
  "Jl. Industri No. 45, Jakarta Selatan, DKI Jakarta 12345";
// URL situs (tanpa trailing slash) untuk link eksternal, mis. "Lihat Website" di admin
export const STORE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
// Untuk domain email dinamis yang menyesuaikan dengan email toko
export const getStoreDomain = () => {
  return STORE_EMAIL.split("@")[1] || "heraskincare.com";
};

// Format admin email berdasarkan nama toko
export const getAdminEmail = (username: string) => {
  return `${username}@${getStoreDomain()}`;
};
