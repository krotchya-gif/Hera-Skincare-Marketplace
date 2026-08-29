"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface AreaOption {
  id: string;
  label: string;
}

// T-54: pencarian area tujuan (RajaOngkir V2) — dipakai form alamat di
// checkout, profil, dan admin (area asal). Yang disimpan:
// destination_area_id + destination_area_label.
export default function AreaPicker({
  value,
  onSelect,
}: {
  value: { id: string; label: string } | null;
  onSelect: (area: { id: string; label: string } | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [available, setAvailable] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 3) {
        setAreas([]);
        setOpen(false);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/shipping/destination?search=${encodeURIComponent(q)}`);
        if (!res.ok) {
          if (res.status === 503) setAvailable(false);
          setAreas([]);
          return;
        }
        const data = await res.json();
        setAreas(Array.isArray(data?.areas) ? data.areas : []);
        setOpen(true);
      } catch {
        setAreas([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Area Tujuan (kecamatan/kota — untuk ongkir akurat)
      </label>
      {value ? (
        <div className="flex items-center justify-between border border-green-300 bg-green-50 rounded-xl px-3 py-2">
          <span className="text-sm text-green-800 flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{value.label || value.id}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            className="text-xs text-red-500 font-semibold shrink-0 ml-2"
          >
            Ganti
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 disabled:bg-gray-50"
            placeholder={
              available ? "Ketik nama kecamatan/kota (mis. Kebayoran)" : "Pencarian area belum tersedia"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!available}
          />
          {searching && (
            <Loader2 className="w-4 h-4 animate-spin text-green-600 absolute right-3 top-1/2 -translate-y-1/2" />
          )}
          {open && areas.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {areas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 transition-colors"
                  onClick={() => {
                    onSelect({ id: area.id, label: area.label });
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {area.label}
                </button>
              ))}
            </div>
          )}
          {open && !searching && query.trim().length >= 3 && areas.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">Tidak ada hasil. Coba kata kunci lain.</p>
          )}
        </div>
      )}
      {available && !value && (
        <p className="text-[10px] text-gray-400 mt-1">Opsional — bila kosong, ongkir memakai tarif flat.</p>
      )}
    </div>
  );
}
