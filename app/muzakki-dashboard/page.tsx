"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  getMuzakkiDashboardData, 
  updateMuzakkiProfile, 
  addTransaction,
  changeMuzakkiPassword,
  getPublicStats,
  getSession
} from "@/lib/actions";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { 
  Coins, 
  History, 
  CheckCircle, 
  User, 
  Phone, 
  Briefcase, 
  MapPin, 
  ShieldCheck,
  TrendingUp,
  Download,
  HelpCircle,
  FileText,
  Printer,
  ChevronRight,
  Info,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Module-level cache to persist data across Suspense-triggered remounts.
// When useSearchParams() changes (tab click), Suspense can remount this component,
// resetting all state. The cache prevents re-fetching and re-showing the loading spinner.
let _muzakkiCache: {
  muzakkiId: number;
  profileData: any;
  transactions: any[];
  distributions: any[];
  categoryAggregate: Record<string, number>;
  publicChartData: any[];
} | null = null;

function MuzakkiDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  // Initialize state from cache if available (survives Suspense remounts)
  const [loading, setLoading] = useState(!_muzakkiCache);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  
  // Muzakki Account State — pre-populated from cache on remount
  const [muzakkiId, setMuzakkiId] = useState<number | null>(_muzakkiCache?.muzakkiId ?? null);
  const [profileData, setProfileData] = useState<any>(_muzakkiCache?.profileData ?? null);
  const [transactions, setTransactions] = useState<any[]>(_muzakkiCache?.transactions ?? []);
  const [distributions, setDistributions] = useState<any[]>(_muzakkiCache?.distributions ?? []);
  const [categoryAggregate, setCategoryAggregate] = useState<Record<string, number>>(_muzakkiCache?.categoryAggregate ?? {});
  
  // Public Organization stats (for mirroring AreaChart)
  const [publicChartData, setPublicChartData] = useState<any[]>(_muzakkiCache?.publicChartData ?? []);

  // Receipt Modal (BSZ) State
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showBszModal, setShowBszModal] = useState(false);

  // Quick Pay State
  const [payValues, setPayValues] = useState({
    type: "Zakat Profesi",
    amount: 0,
    method: "qris",
    proofImage: "",
    note: ""
  });
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Change Password States
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Fetch Dashboard data
  const fetchDashboard = async (id: number) => {
    // Only show loading spinner on first fetch (no cache yet)
    if (!_muzakkiCache) setLoading(true);
    const [res, stats] = await Promise.all([
      getMuzakkiDashboardData(id),
      getPublicStats()
    ]);
    if (res.success && res.muzakki) {
      setProfileData(res.muzakki);
      setTransactions(res.muzakki.transactions || []);
      setDistributions(res.distributions || []);
      setCategoryAggregate(res.categoryAggregate || {});
    }
    if (stats && stats.chartData) {
      setPublicChartData(stats.chartData);
    }
    // Update module-level cache
    _muzakkiCache = {
      muzakkiId: id,
      profileData: res.success ? res.muzakki : _muzakkiCache?.profileData ?? null,
      transactions: res.success ? (res.muzakki?.transactions || []) : _muzakkiCache?.transactions ?? [],
      distributions: res.success ? (res.distributions || []) : _muzakkiCache?.distributions ?? [],
      categoryAggregate: res.success ? (res.categoryAggregate || {}) : _muzakkiCache?.categoryAggregate ?? {},
      publicChartData: stats?.chartData || _muzakkiCache?.publicChartData || [],
    };
    setLoading(false);
  };



  // Helper to navigate tabs via URL
  const navigateTab = (tab: string) => {
    router.push(`/muzakki-dashboard?tab=${tab}`);
  };

  useEffect(() => {
    const verifyAuth = async () => {
      // If cache exists, data is already loaded — skip network calls entirely
      // (this handles Suspense remounts from tab switching)
      if (_muzakkiCache) {
        setLoading(false);
        return;
      }

      const session = await getSession();
      if (!session || session.role !== "muzakki" || !session.userId) {
        _muzakkiCache = null; // Clear cache on auth failure
        sessionStorage.clear();
        router.push("/login");
        return;
      }

      setMuzakkiId(session.userId);
      fetchDashboard(session.userId);
    };
    verifyAuth();
  }, []);

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 1. Profile Update Handler
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!muzakkiId) return;

    setLoading(true);
    const res = await updateMuzakkiProfile(muzakkiId, {
      name: profileData.name,
      gender: profileData.gender || "Laki-laki",
      phone: profileData.phone || "",
      job: profileData.job || "",
      address: profileData.address || ""
    });

    if (res.success) {
      sessionStorage.setItem("muzakkiName", profileData.name);
      sessionStorage.setItem("muzakkiPhone", profileData.phone || "");
      triggerToast("Profil Anda berhasil diperbarui!");
      fetchDashboard(muzakkiId);
    } else {
      setLoading(false);
      triggerToast(res.error || "Gagal memperbarui profil.", "error");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!muzakkiId) return;

    setPassError("");
    setPassSuccess("");

    if (!currentPass || !newPass || !confirmNewPass) {
      setPassError("Semua kolom kata sandi wajib diisi");
      return;
    }

    if (newPass !== confirmNewPass) {
      setPassError("Konfirmasi Kata Sandi Baru tidak cocok");
      return;
    }

    setIsChangingPass(true);
    const result = await changeMuzakkiPassword(muzakkiId, currentPass, newPass);
    setIsChangingPass(false);

    if (result.success) {
      setPassSuccess("Kata Sandi berhasil diperbarui!");
      setCurrentPass("");
      setNewPass("");
      setConfirmNewPass("");
      triggerToast("Kata Sandi berhasil diperbarui!");
    } else {
      setPassError(result.error || "Gagal memperbarui Kata Sandi.");
    }
  };

  // 2. Quick Pay Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPayValues({ ...payValues, proofImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!muzakkiId || !profileData || payValues.amount <= 0) {
      triggerToast("Nominal pembayaran harus lebih dari Rp 0", "error");
      return;
    }

    // Manual validation for proof image
    if (!payValues.proofImage) {
      triggerToast("Silakan pilih dan unggah screenshot bukti transfer terlebih dahulu.", "error");
      return;
    }

    setIsPaying(true);
    
    const result = await addTransaction({
      muzakkiName: profileData.name,
      phone: profileData.phone || "",
      type: payValues.type,
      amount: payValues.amount,
      method: payValues.method,
      status: "Pending",
      proofImage: payValues.proofImage,
      anonymous: false
    });

    setIsPaying(false);
    if (result.success) {
      setPaySuccess(true);
      fetchDashboard(muzakkiId);
      // Reset form
      setPayValues({
        type: "Zakat Profesi",
        amount: 0,
        method: "qris",
        proofImage: "",
        note: ""
      });
    } else {
      triggerToast(result.error || "Gagal memproses transaksi. Silakan coba lagi.", "error");
    }
  };

  // Nisab gold reference
  const totalPaid = transactions
    .filter(tx => tx.status === "Success")
    .reduce((acc, tx) => acc + tx.amount, 0);

  const pendingCount = transactions.filter(tx => tx.status === "Pending").length;

  // Spell-out nominal (Terbilang) helper in Indonesian
  const terbilang = (amount: number): string => {
    const units = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    
    const count = (num: number): string => {
      if (num < 12) return units[num];
      if (num < 20) return units[num - 10] + " Belas";
      if (num < 100) return units[Math.floor(num / 10)] + " Puluh " + units[num % 10];
      if (num < 200) return "Seratus " + count(num - 100);
      if (num < 1000) return units[Math.floor(num / 100)] + " Ratus " + count(num % 100);
      if (num < 2000) return "Seribu " + count(num - 1000);
      if (num < 1000000) return count(Math.floor(num / 1000)) + " Ribu " + count(num % 1000);
      if (num < 1000000000) return count(Math.floor(num / 1000000)) + " Juta " + count(num % 1000000);
      return count(Math.floor(num / 1000000000)) + " Miliar " + count(num % 1000000000);
    };

    return amount > 0 ? (count(amount).trim() + " Rupiah").replace(/\s+/g, " ") : "Nol Rupiah";
  };

  // Niat Zakat text mapping
  const getNiatZakatText = (type: string) => {
    switch (type) {
      case "Zakat Maal":
        return {
          arabic: "نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ مَالِيْ فَرْضًا لِلَّهِ تَعَالَى",
          latin: "Nawaytu an ukhrija zakata maali fardhan lillahi ta'ala",
          meaning: "Niat saya mengeluarkan zakat maal saya, fardhu karena Allah Ta'ala."
        };
      case "Zakat Profesi":
        return {
          arabic: "نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ كَسْبِيْ فَرْضًا لِلَّهِ تَعَالَى",
          latin: "Nawaytu an ukhrija zakata kasbi fardhan lillahi ta'ala",
          meaning: "Niat saya mengeluarkan zakat profesi (penghasilan) saya, fardhu karena Allah Ta'ala."
        };
      case "Zakat Fitrah":
        return {
          arabic: "نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ الْفِطْرِ عَنْ نَفْسِيْ فَرْضًا لِلَّهِ تَعَالَى",
          latin: "Nawaytu an ukhrija zakatal fitri 'an nafsi fardhan lillahi ta'ala",
          meaning: "Niat saya mengeluarkan zakat fitrah untuk diri saya sendiri, fardhu karena Allah Ta'ala."
        };
      default:
        return {
          arabic: "نَوَيْتُ أَنْ أُتَصَدَّقَ لِلَّهِ تَعَالَى",
          latin: "Nawaytu an utashaddaqa lillahi ta'ala",
          meaning: "Niat saya bersedekah karena Allah Ta'ala."
        };
    }
  };

  // Calculate distributions stats for transparency
  const totalDistribution = Object.values(categoryAggregate).reduce((a, b) => a + b, 0);

  if (loading && !profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        <p className="text-emerald-700 font-bold">Memuat Dashboard Anda...</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Welcome Premium Header */}
        <div className="bg-emerald-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute inset-0 bg-white/[0.02] islamic-pattern pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-800 rounded-full blur-3xl opacity-50" />
          
          <div className="relative z-10 space-y-2">
            <span className="px-3 py-1 bg-white/10 text-emerald-300 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/5">
              Portal Pembayar Zakat (Muzakki)
            </span>
            <h2 className="text-3xl font-black md:text-4xl tracking-tight">
              Ahlan Wa Sahlan, {profileData.name}
            </h2>
            <p className="text-emerald-300/80 max-w-xl text-sm font-medium">
              Sucikan jiwa dan bersihkan harta dengan zakat digital terpercaya. Semua transaksi amanah dan terverifikasi secara hukum syariat.
            </p>
          </div>

          <div className="relative z-10 flex gap-3 shrink-0">
            <button
              onClick={() => {
                router.push("/calculator");
              }}
              className="px-6 py-3.5 bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Coins className="w-5 h-5" />
              Tunaikan Zakat
            </button>
            <button
              onClick={() => navigateTab("history")}
              className="px-6 py-3.5 bg-white/10 text-white border border-white/10 rounded-2xl font-black text-sm hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <History className="w-5 h-5 text-emerald-300" />
              Riwayat
            </button>
          </div>
        </div>

        {/* Navigation is now handled by the left Sidebar */}

        {/* Dynamic Tab Contents */}
        <div className="min-h-[50vh]">
          <AnimatePresence mode="wait">
            
            {/* 1. Tab Overview */}
            {(activeTab === "overview" || activeTab === null) && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Profile Completion Banner: muncul jika profil belum lengkap */}
                {profileData && (
                  !profileData.job?.trim() || 
                  profileData.job === "Pekerja" ||
                  !profileData.address?.trim() || 
                  profileData.address === "Belum diisi" ||
                  !profileData.gender?.trim()
                ) && (
                  <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 shrink-0">
                      <Info className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-amber-900">Profil Anda Belum Lengkap</p>
                      <p className="text-xs text-amber-700/80 font-medium mt-0.5">
                        Lengkapi Jenis Kelamin, Pekerjaan, dan Alamat agar data Anda tercatat lengkap di sistem Amil.
                      </p>
                    </div>
                    <button
                      onClick={() => navigateTab("settings")}
                      className="shrink-0 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-all whitespace-nowrap shadow-sm shadow-amber-500/20"
                    >
                      Lengkapi Sekarang
                    </button>
                  </div>
                )}

                {/* Stats Grid - Full Width like Admin */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-emerald-100 card-hover flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-emerald-600/60">Zakat Ditunaikan</p>
                      <p className="text-2xl font-black text-emerald-900 mt-1">{formatCurrency(totalPaid)}</p>
                      <p className="text-[10px] text-emerald-400 font-semibold mt-1 italic">Sukses terverifikasi</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-emerald-100 card-hover flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                        <History className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-emerald-600/60">Menunggu Konfirmasi</p>
                      <p className="text-2xl font-black text-emerald-900 mt-1">{pendingCount}</p>
                      <p className="text-[10px] text-emerald-400 font-semibold mt-1 italic">Sedang diverifikasi Amil</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-emerald-100 card-hover flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                        <FileText className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-emerald-600/60">Total Transaksi</p>
                      <p className="text-2xl font-black text-emerald-900 mt-1">{transactions.length}</p>
                      <p className="text-[10px] text-emerald-400 font-semibold mt-1 italic">Semua transaksi terdaftar</p>
                    </div>
                  </div>
                </div>

                {/* Charts Section - Mirroring Admin */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Public Tren Pemasukan & Penyaluran Chart */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-emerald-900">Statistik Keuangan Lembaga</h3>
                        <p className="text-xs text-emerald-500/70 mt-0.5">Tren pemasukan & penyaluran dana zakat nasional secara publik.</p>
                      </div>
                      <select className="text-xs bg-emerald-50 border-none rounded-lg px-3 py-2 outline-none text-emerald-700 font-bold">
                        <option>6 Bulan Terakhir</option>
                      </select>
                    </div>
                    <div className="h-[280px] w-full">
                      {publicChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={publicChartData}>
                            <defs>
                              <linearGradient id="colorPemasukanMuzakki" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#065f46', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#065f46', fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                            <Area type="monotone" dataKey="pemasukan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPemasukanMuzakki)" />
                            <Area type="monotone" dataKey="penyaluran" stroke="#d97706" strokeWidth={3} fillOpacity={0} fill="transparent" strokeDasharray="5 5" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-emerald-400 italic">
                          Belum ada data grafik yang terkumpul
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Distribusi Jenis Zakat Pribadi */}
                  <div className="bg-white p-6 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-emerald-900">Distribusi Jenis Zakat Anda</h3>
                      </div>
                      <div className="space-y-4">
                        {(() => {
                          // Calculate per-type breakdown from personal transactions
                          const typeBreakdown: Record<string, number> = {};
                          transactions
                            .filter((tx: any) => tx.status === "Success")
                            .forEach((tx: any) => {
                              typeBreakdown[tx.type] = (typeBreakdown[tx.type] || 0) + tx.amount;
                            });
                          const entries = Object.entries(typeBreakdown);

                          if (entries.length === 0) {
                            return (
                              <div className="text-center py-10">
                                <p className="text-xs text-emerald-500 italic">Belum ada transaksi terverifikasi</p>
                              </div>
                            );
                          }

                          return entries.map(([type, amount], idx) => {
                            const pct = Math.round((amount / totalPaid) * 100);
                            const colors = ["bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-purple-500"];
                            return (
                              <div key={type} className="space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className="text-emerald-800">{type}</span>
                                  <span className="text-emerald-600">{formatCurrency(amount)} ({pct}%)</span>
                                </div>
                                <div className="w-full h-2 bg-emerald-50 rounded-full overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full transition-all duration-1000", colors[idx % 4])}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] text-emerald-700/85 font-medium leading-relaxed">
                        Data menampilkan proporsi jenis zakat yang Anda bayarkan berdasarkan transaksi yang sudah terverifikasi oleh Amil.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Second Row: Recent Transactions (2/3) + Quotes (1/3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Transactions Table - Mirroring Admin */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-emerald-100 overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="p-6 border-b border-emerald-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-emerald-900">Transaksi Terbaru</h3>
                        <button
                          onClick={() => navigateTab("history")}
                          className="text-sm font-bold text-primary hover:underline"
                        >
                          Lihat Semua
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-medium">
                          <thead>
                            <tr className="bg-emerald-50/50 text-emerald-800 text-xs uppercase tracking-wider font-bold">
                              <th className="px-6 py-4 font-bold">Tanggal</th>
                              <th className="px-6 py-4 font-bold">Jenis Zakat</th>
                              <th className="px-6 py-4 font-bold">Nominal</th>
                              <th className="px-6 py-4 font-bold">Metode</th>
                              <th className="px-6 py-4 font-bold text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-50">
                            {transactions.slice(0, 5).map((tx: any) => (
                              <tr key={tx.id} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="text-sm font-bold text-emerald-900">
                                    {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    {tx.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm font-black text-emerald-900">{formatCurrency(tx.amount)}</p>
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-emerald-600 uppercase">
                                  {tx.method}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex justify-center">
                                    <span className={cn(
                                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                      tx.status === "Success" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                      {tx.status === "Success" ? "Terverifikasi" : "Pending"}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {transactions.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-6 py-16 text-center">
                                  <div className="flex flex-col items-center gap-3 text-emerald-400">
                                    <History className="w-12 h-12 opacity-20" />
                                    <p className="text-sm font-bold">Belum ada riwayat transaksi</p>
                                    <button
                                      onClick={() => router.push("/calculator")}
                                      className="px-5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                                    >
                                      Mulai Pembayaran Pertama
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Quotes */}
                  <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl shadow-xl relative overflow-hidden border border-emerald-700/50 p-8 flex flex-col justify-between min-h-[300px]">
                    <div className="absolute inset-0 bg-white/[0.01] islamic-pattern" />
                    <HelpCircle className="w-12 h-12 text-emerald-300 opacity-20 absolute -right-2 -bottom-2" />
                    
                    <div>
                      <h4 className="text-[10px] font-black tracking-widest uppercase opacity-60">Ayat Pengingat Zakat</h4>
                      <p className="mt-6 text-sm font-medium leading-relaxed italic">
                        "Ambillah zakat dari sebagian harta mereka, dengan zakat itu kamu membersihkan dan mensucikan mereka dan berdoalah untuk mereka..."
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-300 tracking-wider text-right uppercase mt-6">
                        — QS. At-Taubah: 103
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. Tab Riwayat Pembayaran */}
            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-[2.5rem] border border-emerald-100 overflow-hidden shadow-xl"
              >
                <div className="p-6 border-b border-emerald-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-emerald-50/20">
                  <div>
                    <h3 className="text-xl font-black text-emerald-900">Riwayat Pembayaran Zakat</h3>
                    <p className="text-xs text-emerald-600/70 mt-1">Daftar lengkap setoran zakat Anda serta bukti resmi (BSZ).</p>
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                    Akun Aktif: {profileData.phone}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-emerald-50/50 text-emerald-800 text-[10px] uppercase tracking-wider font-black">
                        <th className="px-6 py-4 font-black">ID Transaksi</th>
                        <th className="px-6 py-4 font-black">Tanggal</th>
                        <th className="px-6 py-4 font-black">Jenis Zakat</th>
                        <th className="px-6 py-4 font-black">Nominal</th>
                        <th className="px-6 py-4 font-black">Metode</th>
                        <th className="px-6 py-4 font-black text-center">Status</th>
                        <th className="px-6 py-4 font-black text-center">Kuitansi BSZ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-xs font-black text-emerald-900">{tx.txId}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-emerald-700">
                              {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-black text-emerald-900">{formatCurrency(tx.amount)}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-emerald-600 uppercase">
                            {tx.method}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                              tx.status === "Success" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                            )}>
                              {tx.status === "Success" ? "Terverifikasi" : "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {tx.status === "Success" ? (
                              <button
                                onClick={() => {
                                  setSelectedTx(tx);
                                  setShowBszModal(true);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 mx-auto hover:bg-emerald-700 shadow-md shadow-emerald-600/10 active:scale-95 transition-all"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Lihat Kuitansi
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-semibold italic">Menunggu Verifikasi</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center gap-3 text-emerald-400">
                              <History className="w-12 h-12 opacity-20" />
                              <p className="text-sm font-bold">Belum ada riwayat transaksi</p>
                              <button
                                onClick={() => router.push("/calculator")}
                                className="px-5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                              >
                                Mulai Pembayaran Pertama
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 3. Tab Bayar Zakat */}
            {activeTab === "pay" && (
              <motion.div
                key="pay"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
              >
                {/* Form Zakat */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-emerald-900">Form Pembayaran Zakat Cepat</h3>
                    <span className="px-3 py-1 bg-emerald-100/50 text-emerald-800 rounded-xl text-xs font-bold">
                      Amanah & Syar'i
                    </span>
                  </div>

                  {paySuccess ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in duration-300">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-emerald-950">Transaksi Berhasil Dicatat!</h4>
                        <p className="text-xs text-emerald-600/70 font-semibold max-w-sm mx-auto mt-2 leading-relaxed">
                          Alhamdulillah, bukti transfer Anda telah kami terima. Tim Amil akan segera memverifikasi transaksi Anda. Silakan cek menu **Riwayat & BSZ** secara berkala.
                        </p>
                      </div>
                      <div className="pt-4 flex gap-3">
                        <button
                          onClick={() => setPaySuccess(false)}
                          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all"
                        >
                          Kirim Pembayaran Lain
                        </button>
                        <button
                          onClick={() => navigateTab("history")}
                          className="px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all"
                        >
                          Cek Riwayat
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleQuickPaySubmit} className="space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-emerald-900 uppercase pl-1">Pilih Kategori Zakat</label>
                          <select
                            className="w-full px-4 py-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none text-xs font-bold text-emerald-900"
                            value={payValues.type}
                            onChange={(e) => {
                              setPayValues({ ...payValues, type: e.target.value });
                            }}
                          >
                            <option>Zakat Profesi</option>
                            <option>Zakat Maal</option>
                            <option>Zakat Fitrah</option>
                            <option>Sedekah / Infak</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-emerald-900 uppercase pl-1">Nominal Pembayaran</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">Rp</span>
                            <input
                              type="text"
                              required
                              value={payValues.amount.toLocaleString("id-ID")}
                              onChange={(e) => {
                                const num = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                                setPayValues({ ...payValues, amount: num });
                              }}
                              className="w-full pl-10 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none text-xs font-black text-emerald-900 focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        </div>
                      </div>


                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-emerald-900 uppercase pl-1">Metode Transfer</label>
                        <select
                          className="w-full px-4 py-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none text-xs font-bold text-emerald-900"
                          value={payValues.method}
                          onChange={(e) => setPayValues({ ...payValues, method: e.target.value })}
                        >
                          <option value="qris">QRIS Linsharein (Otomatis)</option>
                          <option value="transfer">Transfer Bank Syariah Indonesia (BSI)</option>
                        </select>
                      </div>

                      {/* Payment Destination visual helper */}
                      <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                        <p className="text-xs font-black text-emerald-950">
                          {payValues.method === "qris" ? "Scan QRIS Resmi Yayasan:" : "Rekening Bank Tujuan:"}
                        </p>
                        
                        {payValues.method === "qris" ? (
                          <div className="flex flex-col items-center py-2 gap-3">
                            <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden">
                              <div className="w-36 h-36 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=LinshareinZakatPortal')] bg-cover" />
                            </div>
                            <span className="text-[9px] text-emerald-500 font-bold">Terima semua m-banking & e-wallet (Gopay, OVO, Dana)</span>
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded-xl border border-emerald-100 relative overflow-hidden flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-bold text-emerald-400">BANK SYARIAH INDONESIA (BSI)</p>
                              <p className="text-lg font-black text-emerald-800 mt-0.5 tracking-wider">7123 4567 89</p>
                              <p className="text-[10px] font-bold text-emerald-600">a.n YAYASAN LINSHAREIN AMAL</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText("7123456789");
                                triggerToast("No. Rekening disalin!");
                              }}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-100 hover:bg-emerald-100"
                            >
                              Salin No.Rek
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Recite Niat Box */}
                      <div className="p-5 bg-gradient-to-br from-emerald-700/10 to-emerald-950/20 border border-emerald-600/20 rounded-2xl space-y-3 relative">
                        <Info className="w-6 h-6 text-emerald-600 absolute right-4 top-4 opacity-30" />
                        <p className="text-xs font-black text-emerald-900 uppercase tracking-widest pl-0.5">Recite Niat Zakat (Lafadz Niat):</p>
                        
                        <div className="text-center py-2 space-y-2">
                          <p className="text-xl font-bold text-emerald-950 font-arabic leading-relaxed">
                            {getNiatZakatText(payValues.type).arabic}
                          </p>
                          <p className="text-xs text-emerald-800 font-bold italic leading-relaxed">
                            "{getNiatZakatText(payValues.type).latin}"
                          </p>
                          <p className="text-[10px] text-emerald-700 font-semibold leading-relaxed">
                            Artinya: {getNiatZakatText(payValues.type).meaning}
                          </p>
                        </div>
                      </div>

                      {/* File Upload proof */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-emerald-900 uppercase pl-1">Unggah Bukti Transfer / Setor</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="dashboard-proof-upload"
                          />
                          <label
                            htmlFor="dashboard-proof-upload"
                            className="w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all cursor-pointer group"
                          >
                            {payValues.proofImage ? (
                              <div className="flex flex-col items-center gap-2">
                                <img src={payValues.proofImage} alt="Preview" className="h-28 object-contain rounded-lg shadow-sm" />
                                <span className="text-xs font-bold text-emerald-600">Klik untuk ganti bukti transfer</span>
                              </div>
                            ) : (
                              <>
                                <div className="p-3 bg-emerald-100 rounded-full group-hover:scale-110 transition-transform">
                                  <Download className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-bold text-emerald-900">Pilih Screenshot Bukti Pembayaran</p>
                                  <p className="text-[9px] text-emerald-500 mt-1">Format JPG, PNG (Maksimal 2MB)</p>
                                </div>
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isPaying || payValues.amount <= 0}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isPaying ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Memproses Pembayaran...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-6 h-6" />
                            Tunaikan Zakat
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* Right Column: Q&A Fiqih Zakat */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-emerald-100 shadow-xl space-y-4">
                  <h3 className="text-sm font-black text-emerald-950 uppercase tracking-widest pl-0.5">Panduan Singkat Zakat</h3>
                  
                  <div className="space-y-4 divide-y divide-emerald-50 text-xs text-emerald-900/80 leading-relaxed font-medium">
                    <div className="pt-0">
                      <p className="font-bold text-emerald-950 mb-1">Q: Apa bedanya Zakat Fitrah & Zakat Maal?</p>
                      <p className="text-emerald-700/80">Zakat Fitrah dibayarkan menjelang Idul Fitri untuk membersihkan diri. Zakat Maal dibayarkan atas kepemilikan harta (uang, tabungan, investasi) yang sudah mengendap setahun.</p>
                    </div>
                    <div className="pt-3">
                      <p className="font-bold text-emerald-950 mb-1">Q: Kapan saya wajib bayar Zakat Profesi?</p>
                      <p className="text-emerald-700/80">Jika penghasilan bulanan bersih Anda bernilai setara 522kg beras (nisab profesi, sekitar Rp 6.850.000), Anda dianjurkan membayar 2.5% setiap menerima gaji bulanan.</p>
                    </div>
                    <div className="pt-3">
                      <p className="font-bold text-emerald-950 mb-1">Q: Bagaimana jika nominal pembayaran tidak pas?</p>
                      <p className="text-emerald-700/80">Jika pembayaran lebih besar dari nisab zakat, kelebihannya akan otomatis dihitung sebagai sedekah sunnah yang mendatangkan pahala tambahan bagi Anda.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. Tab Transparansi Penyaluran */}
            {activeTab === "transparency" && (
              <motion.div
                key="transparency"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Visual Chart Aggregates */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Distribution Progress */}
                  <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-xl space-y-6">
                    <div>
                      <h3 className="text-lg font-black text-emerald-900">Distribusi Penyaluran Dana Zakat</h3>
                      <p className="text-xs text-emerald-600/70 mt-1">Akuntabilitas pembagian dana kepada 8 golongan Asnaf yang berhak menerima.</p>
                    </div>

                    <div className="space-y-4">
                      {Object.keys(categoryAggregate).length > 0 ? (
                        Object.entries(categoryAggregate).map(([name, amount], i) => {
                          const percentage = totalDistribution > 0 ? Math.round((amount / totalDistribution) * 100) : 0;
                          return (
                            <div key={name} className="space-y-2">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-emerald-900">{name} (Asnaf)</span>
                                <span className="text-emerald-600">{formatCurrency(amount)} ({percentage}%)</span>
                              </div>
                              <div className="w-full h-2.5 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    i % 4 === 0 ? "bg-emerald-500" : i % 4 === 1 ? "bg-blue-500" : i % 4 === 2 ? "bg-amber-500" : "bg-purple-500"
                                  )}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-xs text-emerald-400 italic">Belum ada pencatatan distribusi amil.</div>
                      )}
                    </div>
                  </div>

                  {/* Impact Summary */}
                  <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden border border-emerald-700/50 flex flex-col justify-between">
                    <div className="absolute inset-0 bg-white/[0.01] islamic-pattern" />
                    <div className="space-y-4 relative z-10">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/5">
                        <TrendingUp className="w-5 h-5 text-emerald-300" />
                      </div>
                      <h4 className="text-xl font-black tracking-tight">Kekuatan Zakat Anda</h4>
                      <p className="text-xs text-emerald-300/80 leading-relaxed">
                        Setiap rupiah zakat yang Anda bayar disalurkan 100% langsung untuk pengentasan kemiskinan, beasiswa pendidikan mustahik, pertolongan kesehatan dhuafa, dan kemandirian usaha.
                      </p>
                    </div>

                    <div className="pt-6 border-t border-white/10 mt-6 relative z-10">
                      <p className="text-[10px] font-black uppercase opacity-60">Total Penyaluran Lembaga</p>
                      <p className="text-3xl font-black text-white tracking-tight mt-1">{formatCurrency(totalDistribution)}</p>
                    </div>
                  </div>
                </div>

                {/* Mustahik impact feed */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-emerald-900">Aktivitas & Berita Penyaluran Mustahik</h3>
                    <p className="text-xs text-emerald-600/70 mt-1">Berikut adalah laporan dokumentasi penyaluran nyata dari tim amil di lapangan.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {distributions.map((d) => (
                      <div key={d.id} className="p-5 border border-emerald-100 rounded-3xl hover:shadow-lg transition-all flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase border border-emerald-100">
                              {d.category}
                            </span>
                            <span className="text-[9px] font-semibold text-emerald-400">
                              {new Date(d.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-emerald-950">Penyaluran untuk {d.mustahikName}</h4>
                          <p className="text-xs text-emerald-600/80 leading-relaxed font-medium line-clamp-2">
                            {d.description || "Bantuan diserahkan secara amanah untuk menunjang kesejahteraan dan keperluan dasar penerima manfaat."}
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-emerald-50/50">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">Jumlah Bantuan</span>
                          <span className="text-sm font-black text-emerald-900">{formatCurrency(d.amount)}</span>
                        </div>
                      </div>
                    ))}
                    {distributions.length === 0 && (
                      <div className="md:col-span-2 text-center py-10 text-xs text-emerald-400 italic">Laporan aktivitas lapangan masih kosong.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. Tab Pengaturan Profil */}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-xl max-w-2xl mx-auto space-y-6"
              >
                <div>
                  <h3 className="text-xl font-black text-emerald-900">Pengaturan Informasi Profil Muzakki</h3>
                  <p className="text-xs text-emerald-600/70 mt-1">Perbarui informasi donasi pribadi Anda untuk pencatatan kuitansi digital yang valid.</p>
                </div>

                {/* Info saat profil belum dilengkapi */}
                {profileData && (
                  !profileData.job?.trim() || 
                  profileData.job === "Pekerja" ||
                  !profileData.address?.trim() || 
                  profileData.address === "Belum diisi"
                ) && (
                  <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 font-medium leading-relaxed">
                      <strong>Informasi untuk pengguna baru:</strong> Saat mendaftar akun dari mode Tamu, data Pekerjaan dan Alamat tidak diisi otomatis. Silakan lengkapi di sini agar data Anda di panel Amil terisi dengan benar.
                    </p>
                  </div>
                )}

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-900 uppercase pl-1">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <input
                        type="text"
                        required
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-900 uppercase pl-1">Jenis Kelamin</label>
                      <select
                        className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none text-xs font-bold text-emerald-900"
                        value={profileData.gender || "Laki-laki"}
                        onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                      >
                        <option>Laki-laki</option>
                        <option>Perempuan</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-900 uppercase pl-1">Pekerjaan</label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                        <input
                          type="text"
                          value={profileData.job || ""}
                          onChange={(e) => setProfileData({ ...profileData, job: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-primary/20"
                          placeholder="Contoh: Karyawan Swasta"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-900 uppercase pl-1">Nomor WhatsApp / HP</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <input
                        type="tel"
                        required
                        value={profileData.phone || ""}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-900 uppercase pl-1">Alamat Lengkap</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-emerald-400" />
                      <textarea
                        rows={3}
                        value={profileData.address || ""}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none text-xs font-bold text-emerald-900 resize-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Contoh: Jl. Diponegoro No. 45"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-md active:scale-95 transition-all"
                  >
                    Simpan Perubahan Profil
                  </button>
                </form>

                <hr className="border-emerald-50 my-6" />

                <div className="pt-2">
                  <h4 className="text-sm font-black text-emerald-900 uppercase">Ganti Kata Sandi Akun</h4>
                  <p className="text-[10px] text-emerald-500 font-semibold mt-1">Perbarui kata sandi Anda untuk keamanan akun yang lebih baik.</p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                  {passError && (
                    <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{passError}</p>
                  )}
                  {passSuccess && (
                    <p className="text-xs font-bold text-emerald-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">{passSuccess}</p>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-900 uppercase pl-1">Kata Sandi Lama</label>
                    <input
                      type="password"
                      required
                      placeholder="Masukkan kata sandi lama"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-900 uppercase pl-1">Kata Sandi Baru</label>
                      <input
                        type="password"
                        required
                        placeholder="Buat kata sandi baru"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-900 uppercase pl-1">Konfirmasi Kata Sandi Baru</label>
                      <input
                        type="password"
                        required
                        placeholder="Ulangi kata sandi baru"
                        value={confirmNewPass}
                        onChange={(e) => setConfirmNewPass(e.target.value)}
                        className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="w-full py-3.5 bg-emerald-900 text-white rounded-xl font-bold text-xs hover:bg-emerald-950 shadow-md active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isChangingPass ? "Memperbarui..." : "Perbarui Kata Sandi"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 7. Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className={cn(
              "fixed bottom-8 left-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl min-w-[280px] backdrop-blur-md border",
              toastType === "success" 
                ? "bg-emerald-950 text-white border-emerald-800" 
                : "bg-red-950 text-white border-red-800"
            )}
          >
            {toastType === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. BSZ Modal Receipt Simulation */}
      <AnimatePresence>
        {showBszModal && selectedTx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            
            {/* Modal Box */}
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden relative border border-emerald-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              
              {/* Header */}
              <div className="p-4 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/20 no-print">
                <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  KUITANSI BUKTI SETOR ZAKAT (BSZ) DIGITAL
                </span>
                <button
                  onClick={() => setShowBszModal(false)}
                  className="p-1 hover:bg-emerald-100 text-emerald-400 hover:text-emerald-700 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Receipt Body */}
              <div className="p-8 flex-1 overflow-y-auto print-container space-y-8 bg-white relative">
                
                {/* Islamic watermark pattern in background */}
                <div className="absolute inset-0 bg-emerald-500/[0.01] islamic-pattern pointer-events-none" />

                {/* Receipt Header logo */}
                <div className="flex justify-between items-start gap-4 border-b-2 border-double border-emerald-900/20 pb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-black italic text-2xl">L</span>
                    </div>
                    <div>
                      <h4 className="text-md font-black text-emerald-950 tracking-tighter uppercase leading-none">LAZ LINSHAREIN AMAL</h4>
                      <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Lembaga Amil Zakat Nasional</p>
                      <p className="text-[8px] text-emerald-500 mt-0.5">Izin Kemenag RI No. 123 Tahun 2026</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-950 uppercase tracking-wider">KUITANSI BSZ</p>
                    <p className="text-[10px] font-black text-emerald-600 mt-1">{selectedTx.txId}</p>
                    <p className="text-[8px] text-emerald-400 mt-0.5">Status: SAH / LEGAL</p>
                  </div>
                </div>

                {/* Receipt details grid */}
                <div className="space-y-4 relative z-10 text-xs font-medium text-emerald-950">
                  
                  <div className="grid grid-cols-3 border-b border-emerald-50/50 pb-2">
                    <span className="font-bold text-emerald-800">Telah Terima Dari</span>
                    <span className="col-span-2 font-black">: {profileData.name}</span>
                  </div>

                  <div className="grid grid-cols-3 border-b border-emerald-50/50 pb-2">
                    <span className="font-bold text-emerald-800">No. WhatsApp/HP</span>
                    <span className="col-span-2 font-bold">: {profileData.phone}</span>
                  </div>

                  <div className="grid grid-cols-3 border-b border-emerald-50/50 pb-2">
                    <span className="font-bold text-emerald-800">Jenis Setoran</span>
                    <span className="col-span-2 font-black text-emerald-600">: {selectedTx.type}</span>
                  </div>

                  <div className="grid grid-cols-3 border-b border-emerald-50/50 pb-2">
                    <span className="font-bold text-emerald-800">Metode Penyetoran</span>
                    <span className="col-span-2 font-bold uppercase">: {selectedTx.method}</span>
                  </div>

                  <div className="grid grid-cols-3 border-b border-emerald-50/50 pb-2">
                    <span className="font-bold text-emerald-800">Jumlah Uang</span>
                    <span className="col-span-2 font-black text-emerald-950">: {formatCurrency(selectedTx.amount)}</span>
                  </div>

                  {/* Terbilang block */}
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex gap-2 italic">
                    <span className="font-black text-emerald-900 not-italic uppercase text-[9px] shrink-0 mt-0.5">Terbilang :</span>
                    <span className="font-bold text-emerald-800 leading-normal">{terbilang(selectedTx.amount)}</span>
                  </div>
                </div>

                {/* Signature and footer section */}
                <div className="pt-4 flex justify-between items-end relative z-10">
                  <div className="space-y-1">
                    {/* Secure validation QR Code Simulation */}
                    <div className="w-16 h-16 bg-gray-50 border border-emerald-100 p-1.5 rounded-lg flex items-center justify-center relative">
                      <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=LinshareinSecureBSZVerificationToken')] bg-cover opacity-80" />
                    </div>
                    <p className="text-[8px] text-emerald-500 font-semibold italic">Scan untuk verifikasi keaslian</p>
                  </div>

                  <div className="text-right space-y-12">
                    <div>
                      <p className="text-[9px] text-emerald-500 font-bold uppercase">Jakarta, {new Date(selectedTx.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                      <p className="text-[10px] font-black text-emerald-950 uppercase mt-0.5">Amil Penerima,</p>
                    </div>
                    
                    <div className="relative">
                      {/* Amil Stamp mockup in background of signature */}
                      <div className="absolute right-4 -top-8 w-16 h-16 border-2 border-dashed border-emerald-600/30 rounded-full flex items-center justify-center opacity-30 select-none pointer-events-none rotate-12">
                        <span className="text-[8px] font-black text-emerald-600 text-center leading-none">LAZ LINSHAREIN<br/>AMAL</span>
                      </div>
                      <p className="text-xs font-black text-emerald-900 underline">Drs. H. Amil Utama, M.A.</p>
                      <p className="text-[9px] text-emerald-500 font-bold uppercase mt-0.5">Kepala Bidang Penyaluran</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="p-4 border-t border-emerald-50 flex gap-3 justify-end bg-emerald-50/10 no-print">
                <button
                  onClick={() => setShowBszModal(false)}
                  className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition-all"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-emerald-700 shadow-md shadow-emerald-600/10 transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Kuitansi (PDF)
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function MuzakkiDashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
          <p className="text-emerald-700 font-bold">Memuat Dashboard Anda...</p>
        </div>
      }>
        <MuzakkiDashboardContent />
      </Suspense>
    </DashboardLayout>
  );
}




