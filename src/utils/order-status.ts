export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  text: string;
  dot: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  menunggu:     { label: "Menunggu Bayar", color: "text-orange-600 bg-orange-50 border-orange-200", bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  diproses:     { label: "Diproses", color: "text-blue-600 bg-blue-50 border-blue-200", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  dikirim:      { label: "Dikirim", color: "text-purple-600 bg-purple-50 border-purple-200", bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400" },
  selesai:      { label: "Selesai", color: "text-green-600 bg-green-50 border-green-200", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  dibatalkan:   { label: "Dibatalkan", color: "text-red-600 bg-red-50 border-red-200", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
  aktif:        { label: "Aktif", color: "text-green-600 bg-green-50 border-green-200", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  nonaktif:     { label: "Nonaktif", color: "text-gray-500 bg-gray-100 border-gray-200", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  diblokir:     { label: "Diblokir", color: "text-red-600 bg-red-50 border-red-200", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  published:    { label: "Aktif", color: "text-green-600 bg-green-50 border-green-200", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  draft:        { label: "Draft", color: "text-gray-500 bg-gray-100 border-gray-200", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  habis:        { label: "Habis", color: "text-red-600 bg-red-50 border-red-200", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
  lunas:        { label: "Lunas", color: "text-green-600 bg-green-50 border-green-200", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  belum_bayar:  { label: "Belum Bayar", color: "text-yellow-600 bg-yellow-50 border-yellow-200", bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
};
