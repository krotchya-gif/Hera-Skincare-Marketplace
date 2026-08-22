"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Eye, EyeOff, Leaf, Shield, Server, Activity, CheckCircle2, Lock, Terminal, Cpu } from "lucide-react";
import { STORE_NAME, getAdminEmail } from "@/utils/storeConfig";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email atau password salah. Coba lagi.");
      setLoading(false);
    } else {
      // Cek role user setelah login sukses
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile && profile.role === "customer") {
          // Customer tidak boleh login ke admin panel
          await supabase.auth.signOut();
          setError("Akses ditolak. Hanya admin yang bisa login.");
          setLoading(false);
          return;
        }
      }
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-zinc-950 relative overflow-hidden font-sans select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-600/[0.01] blur-[160px] pointer-events-none" />

      {/* Bento Grid Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">

        {/* Card 1: Main Login Form (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl relative flex flex-col justify-between overflow-hidden group">
          {/* Subtle top border illumination */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-11/12 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

          <div>
            {/* Header Branding */}
            <div className="flex items-center justify-between border-b border-zinc-800/50 pb-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <h1 className="text-base font-bold text-white tracking-wide">{STORE_NAME}</h1>
                  <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-widest">
                    Administrative Gateway
                  </p>
                </div>
              </div>

              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
                <Lock className="w-3 h-3" />
                Authorized Session
              </div>
            </div>

            {/* Login Form content */}
            <div className="max-w-md">
              <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight mb-2">
                Login Akun Admin
              </h2>
              <p className="text-zinc-400 text-xs mb-8">
                Masukkan alamat email dan kata sandi operasional untuk mengakses panel administrasi.
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Email Kredensial
                  </label>
                  <input
                    type="email"
                    id="admin-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={getAdminEmail("admin")}
                    required
                    className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-4 py-3 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300"
                  />
                </div>

                {/* Password input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="admin-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-4 py-3 pr-12 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Box */}
                {error && (
                  <div className="bg-red-500/5 border border-red-500/10 text-red-400 rounded-xl px-4 py-3 text-xs flex items-start gap-2.5">
                    <span className="text-sm leading-none shrink-0 mt-0.5">⚠️</span>
                    <p className="leading-relaxed">{error}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  id="btn-admin-login"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-emerald-800 disabled:to-teal-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Otentikasi Kredensial...
                    </>
                  ) : (
                    "Masuk Ke Dashboard"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer warning */}
          <div className="border-t border-zinc-800/40 pt-6 mt-8 flex justify-between items-center text-[10px] text-zinc-500">
            <p>© 2026 {STORE_NAME}. Secure admin portal.</p>
            <p>SSL Secured Session</p>
          </div>
        </div>

        {/* Column 2 / Right Side Cards on Desktop */}
        <div className="lg:col-span-1 flex flex-col gap-6">

          {/* Card 2: Server Operational Status */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl relative overflow-hidden group flex flex-col justify-between h-[210px] sm:h-auto lg:h-[220px]">
            {/* Ambient indicator line */}
            <div className="absolute top-0 right-0 w-[80px] h-[80px] rounded-full bg-emerald-500/5 blur-[35px] pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Status Server
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wide">Live</span>
                </div>
              </div>

              {/* Status List */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Node Cluster</span>
                  <span className="font-bold text-white text-right">Production-01</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-emerald-500" /> CPU Load
                    </span>
                    <span className="font-bold text-zinc-300">12%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-[12%] animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-teal-400" /> API Latency
                    </span>
                    <span className="font-bold text-zinc-300">24ms</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full w-[24%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800/40 pt-3 mt-4 text-[9px] text-zinc-500 flex justify-between items-center">
              <span>Uptime: 99.98%</span>
              <span>100% Operational</span>
            </div>
          </div>

          {/* Card 3: Security & Encryption */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl relative overflow-hidden group flex flex-col justify-between h-[210px] sm:h-auto lg:h-[220px]">
            {/* Ambient indicator line */}
            <div className="absolute bottom-0 left-0 w-[80px] h-[80px] rounded-full bg-teal-500/5 blur-[35px] pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-teal-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Gatekeeper Sec
                </span>
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-zinc-400 font-medium">AES-256 Bit Enforced</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-zinc-400 font-medium">Rate Limiting Active</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-zinc-400 font-medium">Secure Admin Cookie</span>
                </div>
              </div>
            </div>

            {/* Simulated Log Feed */}
            <div className="border-t border-zinc-800/40 pt-3 mt-4 flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono">
              <Terminal className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <span className="truncate">LOG: Waiting auth handshake...</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
