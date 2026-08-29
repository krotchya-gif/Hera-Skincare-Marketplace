"use client";

// T-74: lonceng notifikasi customer — dropdown panel (bukan sekadar link).
// Data via API customer yang sudah ada: GET /api/notifications (list +
// unreadCount) & PUT /api/notifications/read-all. Guest tetap diarahkan
// ke /profil seperti perilaku lama.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface NotificationItem {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean | null;
  created_at: string;
}

type AuthState = "loading" | "guest" | "user";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export default function NotificationBell({
  iconClass = "w-5 h-5",
  buttonClass = "",
}: {
  iconClass?: string;
  buttonClass?: string;
}) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>("loading");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const fetchNotif = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      /* senyap — badge menyusul poll berikutnya */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          setAuth("guest");
          return;
        }
        setAuth("user");
        fetchNotif();
      } catch {
        if (!cancelled) setAuth("guest");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchNotif]);

  // poll badge tiap 60 detik selama user login
  useEffect(() => {
    if (auth !== "user") return;
    const t = setInterval(fetchNotif, 60000);
    return () => clearInterval(t);
  }, [auth, fetchNotif]);

  // tutup panel saat klik di luar
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && auth === "user") {
      setLoadingList(true);
      fetchNotif().finally(() => setLoadingList(false));
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PUT" });
    fetchNotif();
  };

  const markOneAndGo = async (item: NotificationItem) => {
    try {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", item.id)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "");
    } catch {
      /* non-fatal */
    }
    setOpen(false);
    fetchNotif();
    if (item.link) router.push(item.link);
  };

  // guest / loading: perilaku lama (link ke /profil)
  if (auth !== "user") {
    return (
      <Link href="/profil" className={buttonClass} aria-label="Notifikasi">
        <Bell className={iconClass} />
      </Link>
    );
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifikasi"
        className={buttonClass}
      >
        <Bell className={iconClass} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[15px] h-3.5 bg-gradient-to-br from-rose-500 to-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold px-1 shadow-sm">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">Notifikasi</p>
            {items.length > 0 && unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-semibold text-green-600 hover:text-green-700"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
            {loadingList ? (
              <p className="text-sm text-gray-400 py-8 text-center flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
              </p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">Belum ada notifikasi.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markOneAndGo(item)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    item.is_read ? "opacity-70" : "bg-green-50/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    {!item.is_read && <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />}
                  </div>
                  {item.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.message}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(item.created_at)}</p>
                </button>
              ))
            )}
          </div>
          <Link
            href="/profil?tab=pesanan"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-semibold text-green-600 py-2.5 border-t border-gray-100 hover:bg-green-50"
          >
            Lihat semua di Profil
          </Link>
        </div>
      )}
    </div>
  );
}
