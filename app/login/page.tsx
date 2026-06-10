"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAdmin, loginMuzakki, registerMuzakki, verifyMuzakkiProfileForReset, resetMuzakkiPasswordWithToken } from "@/lib/actions";
import { 
  ShieldCheck, 
  User, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Phone,
  HeartHandshake
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Role selection state: "muzakki" (payer) or "amil" (staff)
  const [role, setRole] = useState<"muzakki" | "amil">("muzakki");

  // Sub-mode for Muzakki: login vs register
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Amil / Shared Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Shared Form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Muzakki details
  const [muzakkiName, setMuzakkiName] = useState("");
  const [muzakkiPhone, setMuzakkiPhone] = useState("");

  const [error, setError] = useState("");

  // Forgot Password states
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetPhone, setResetPhone] = useState("");
  const [resetName, setResetName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
    const role = sessionStorage.getItem("userRole");
    const muzakkiId = sessionStorage.getItem("muzakkiId");
    if (isLoggedIn) {
      if (role === "amil") {
        router.push("/dashboard");
      } else if (role === "muzakki" && muzakkiId) {
        router.push("/muzakki-dashboard");
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    if (role === "amil") {
      const result = await loginAdmin({ username, password });

      if (result.success) {
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userRole", "amil");
        sessionStorage.setItem("adminName", result.user?.name || "Amil Petugas");
        router.push("/dashboard");
      } else {
        setIsLoading(false);
        setError(result.error || "Username atau Password salah");
      }
    } else {
      // Muzakki Role
      if (isRegisterMode) {
        // Register Muzakki with Password
        if (!muzakkiName.trim() || !muzakkiPhone.trim() || !password.trim()) {
          setIsLoading(false);
          setError("Semua kolom pendaftaran wajib diisi");
          return;
        }

        if (password !== confirmPassword) {
          setIsLoading(false);
          setError("Konfirmasi Kata Sandi tidak cocok");
          return;
        }

        const result = await registerMuzakki({
          name: muzakkiName,
          phone: muzakkiPhone,
          password
        });

        if (result.success && result.user) {
          sessionStorage.setItem("isLoggedIn", "true");
          sessionStorage.setItem("userRole", "muzakki");
          sessionStorage.setItem("muzakkiId", result.user.id.toString());
          sessionStorage.setItem("muzakkiName", result.user.name);
          sessionStorage.setItem("muzakkiPhone", result.user.phone || "");
          router.push("/muzakki-dashboard");
        } else {
          setIsLoading(false);
          setError(result.error || "Gagal mendaftar akun baru.");
        }
      } else {
        // Login Muzakki with Password
        if (!muzakkiPhone.trim() || !password.trim()) {
          setIsLoading(false);
          setError("Nomor WhatsApp dan Kata Sandi wajib diisi");
          return;
        }

        const result = await loginMuzakki({
          phone: muzakkiPhone,
          password
        });

        if (result.success && result.user) {
          sessionStorage.setItem("isLoggedIn", "true");
          sessionStorage.setItem("userRole", "muzakki");
          sessionStorage.setItem("muzakkiId", result.user.id.toString());
          sessionStorage.setItem("muzakkiName", result.user.name);
          sessionStorage.setItem("muzakkiPhone", result.user.phone || "");
          router.push("/muzakki-dashboard");
        } else {
          setIsLoading(false);
          setError(result.error || "Gagal masuk. Periksa kembali nomor WA dan Kata Sandi.");
        }
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    if (resetStep === 1) {
      if (!resetPhone.trim() || !resetName.trim()) {
        setIsLoading(false);
        setError("Nomor WhatsApp dan Nama Lengkap wajib diisi.");
        return;
      }

      const result = await verifyMuzakkiProfileForReset(resetPhone, resetName);

      if (result.success && result.resetToken) {
        setResetToken(result.resetToken);
        setResetStep(2);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setError(result.error || "Gagal melakukan verifikasi.");
      }
    } else {
      // Step 2: Reset Password
      if (!newPassword.trim() || !confirmNewPassword.trim()) {
        setIsLoading(false);
        setError("Semua kolom wajib diisi.");
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setIsLoading(false);
        setError("Konfirmasi Kata Sandi Baru tidak cocok.");
        return;
      }

      if (newPassword.length < 6) {
        setIsLoading(false);
        setError("Kata sandi harus minimal 6 karakter.");
        return;
      }

      const result = await resetMuzakkiPasswordWithToken(resetPhone, resetToken, newPassword);

      if (result.success) {
        setSuccessMessage("Kata sandi Anda berhasil diperbarui! Mengalihkan ke login...");
        setIsLoading(false);
        setTimeout(() => {
          setIsForgotPasswordMode(false);
          setResetStep(1);
          setResetPhone("");
          setResetName("");
          setNewPassword("");
          setConfirmNewPassword("");
          setResetToken("");
          setSuccessMessage("");
        }, 2000);
      } else {
        setIsLoading(false);
        setError(result.error || "Gagal memperbarui kata sandi.");
      }
    }
  };

  const resetForm = () => {
    setError("");
    setPassword("");
    setConfirmPassword("");
    setMuzakkiName("");
    setMuzakkiPhone("");
    setUsername("");
    setIsForgotPasswordMode(false);
    setResetStep(1);
    setResetPhone("");
    setResetName("");
    setNewPassword("");
    setConfirmNewPassword("");
    setResetToken("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full islamic-pattern pointer-events-none opacity-[0.05]" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-600 shadow-xl shadow-emerald-600/20 mb-1">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-emerald-900 tracking-tight">Linsharein Amal</h1>
            <p className="text-sm text-emerald-600/70 font-medium">Sistem Informasi Pengelolaan Zakat Digital</p>
          </div>
        </div>

        <div className="flex p-1 bg-emerald-50 rounded-2xl border border-emerald-100/50">
          <button
            type="button"
            onClick={() => {
              setRole("muzakki");
              resetForm();
            }}
            className={cn(
              "flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2",
              role === "muzakki" 
                ? "bg-white text-emerald-950 shadow-md border border-emerald-100" 
                : "text-emerald-600 hover:text-emerald-800"
            )}
          >
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            Muzakki (Donatur)
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("amil");
              resetForm();
            }}
            className={cn(
              "flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2",
              role === "amil" 
                ? "bg-white text-emerald-950 shadow-md border border-emerald-100" 
                : "text-emerald-600 hover:text-emerald-800"
            )}
          >
            <User className="w-4 h-4 text-emerald-600" />
            Amil (Petugas)
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-emerald-100/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {isForgotPasswordMode ? (
            <>
              <div className="flex justify-between items-center mb-5 border-b border-emerald-50 pb-3">
                <h3 className="text-sm font-black text-emerald-900 uppercase">
                  {resetStep === 1 ? "Verifikasi Profil" : "Atur Sandi Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordMode(false);
                    resetForm();
                  }}
                  className="text-xs font-black text-emerald-600 hover:text-emerald-800 hover:underline"
                >
                  Batal & Login
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleForgotPassword}>
                {resetStep === 1 ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest pl-1">No. WhatsApp Terdaftar</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="tel" 
                          required
                          placeholder="Contoh: 08123456789" 
                          value={resetPhone}
                          onChange={(e) => setResetPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xs font-bold text-emerald-900 placeholder:text-emerald-300/80"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest pl-1">Nama Lengkap Terdaftar</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="text" 
                          required
                          placeholder="Masukkan nama sesuai profil terdaftar" 
                          value={resetName}
                          onChange={(e) => setResetName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xs font-bold text-emerald-900 placeholder:text-emerald-300/80"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest pl-1">Kata Sandi Baru</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 group-focus-within:text-primary transition-colors" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required
                          placeholder="Minimal 6 karakter" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xs font-bold text-emerald-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-primary transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest pl-1">Konfirmasi Kata Sandi Baru</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 group-focus-within:text-primary transition-colors" />
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          required
                          placeholder="Ulangi Kata Sandi baru" 
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xs font-bold text-emerald-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-primary transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                    {error}
                  </p>
                )}

                {successMessage && (
                  <p className="text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    {successMessage}
                  </p>
                )}

                {resetStep === 1 && (
                  <div className="pt-2 border-t border-emerald-50 text-center">
                    <p className="text-[10px] font-semibold text-emerald-600/70">Lupa nama lengkap terdaftar?</p>
                    <a
                      href="https://wa.me/6281234567890?text=Halo%20Admin%20Linsharein%20Amal%2C%20saya%20lupa%20nama%20lengkap%20terdaftar%20dan%20kata%20sandi%20untuk%20akun%20WhatsApp%20saya.%20Mohon%20bantuannya%20untuk%20reset%20kata%20sandi."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-[10px] rounded-xl transition-all border border-emerald-100"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      Hubungi Petugas Amil via WA
                    </a>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{resetStep === 1 ? "Verifikasi Sekarang" : "Perbarui Kata Sandi"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-5 border-b border-emerald-50 pb-3">
                <h3 className="text-sm font-black text-emerald-900 uppercase">
                  {role === "amil" ? "Masuk Petugas Amil" : (isRegisterMode ? "Pendaftaran Muzakki" : "Masuk Portal Muzakki")}
                </h3>
                {role === "muzakki" && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      resetForm();
                    }}
                    className="text-xs font-black text-primary hover:underline"
                  >
                    {isRegisterMode ? "Sudah punya akun?" : "Daftar Akun Baru"}
                  </button>
                )}
              </div>

              <form className="space-y-4" onSubmit={handleLogin}>
                
                {role === "muzakki" ? (
                  <>
                    {isRegisterMode && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest pl-1">Nama Lengkap</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 group-focus-within:text-primary transition-colors" />
                          <input 
                            type="text" 
                            required
                            placeholder="Masukkan nama lengkap Anda" 
                            value={muzakkiName}
                            onChange={(e) => setMuzakkiName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xs font-bold text-emerald-900 placeholder:text-emerald-300/80"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest pl-1">No. WhatsApp / HP</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="tel" 
                          required
                          placeholder="Contoh: 08123456789" 
                          value={muzakkiPhone}
                          onChange={(e) => setMuzakkiPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xs font-bold text-emerald-900 placeholder:text-emerald-300/80"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest pl-1">Kata Sandi</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 group-focus-within:text-primary transition-colors" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required
                          placeholder={isRegisterMode ? "Buat Kata Sandi aman" : "••••••••"} 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xs font-bold text-emerald-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-primary transition-colors animate-in"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isRegisterMode && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest pl-1">Konfirmasi Kata Sandi</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 group-focus-within:text-primary transition-colors" />
                          <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            required
                            placeholder="Ulangi Kata Sandi" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xs font-bold text-emerald-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-primary transition-colors animate-in"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest pl-1">Username Petugas</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="text" 
                          required
                          placeholder="admin" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xs font-bold text-emerald-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest pl-1">Kata Sandi</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 group-focus-within:text-primary transition-colors" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required
                          placeholder="••••••••" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xs font-bold text-emerald-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-primary transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {role === "muzakki" && isRegisterMode && (
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100/80 text-[11px] text-emerald-800 leading-relaxed font-medium">
                    💡 <span className="font-bold text-emerald-950">Pernah berdonasi sebagai Tamu?</span> Gunakan nomor WhatsApp yang sama saat mendaftar untuk memindahkan riwayat donasi Anda secara otomatis.
                  </div>
                )}

                {error && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-between px-1">
                  <Link 
                    href="/" 
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali
                  </Link>
                  {role === "muzakki" && !isRegisterMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(true);
                        setResetStep(1);
                        setError("");
                      }}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Lupa Kata Sandi?
                    </button>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {role === "amil" ? "Masuk Ke Dashboard" : (isRegisterMode ? "Daftar Akun Baru" : "Masuk Portal Muzakki")}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-emerald-600/50 text-xs font-medium">
          © 2026 Linsharein Amal. Purifying Wealth, Empowering Ummah.
        </p>
      </div>
    </div>
  );
}
