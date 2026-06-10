"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Calculator,
  Info,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCcw,
  Coins,
  Briefcase,
  PiggyBank,
  HeartHandshake,
  Users,
  UserCircle,
  HandCoins,
  Smartphone,
  Bell
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

import { addTransaction } from "@/lib/actions";
import Toast from "@/components/ui/Toast";

export default function CalculatorPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-emerald-600 font-bold">
        Memuat Kalkulator Zakat...
      </div>
    }>
      <CalculatorContent />
    </Suspense>
  );
}

function CalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("maal");
  const [showSuccessNotif, setShowSuccessNotif] = useState(false);
  const [successMuzakki, setSuccessMuzakki] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as any });

  const triggerToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setSuccessMuzakki(searchParams.get("muzakki") || "Hamba Allah");
      setShowSuccessNotif(true);
      setTimeout(() => setShowSuccessNotif(false), 5000);

      // Clean URL
      router.replace("/calculator");
    }
  }, [searchParams]);

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
    const role = sessionStorage.getItem("userRole");
    if (isLoggedIn && role === "muzakki") {
      const name = sessionStorage.getItem("muzakkiName") || "";
      const phone = sessionStorage.getItem("muzakkiPhone") || "";
      setMuzakkiData(prev => ({
        ...prev,
        name,
        phone
      }));
    }
  }, []);

  // Zakat Maal State
  const [maalValues, setMaalValues] = useState({
    savings: 0, gold: 0, investments: 0, other: 0, debts: 0
  });

  // Zakat Profesi State
  const [profesiValues, setProfesiValues] = useState({
    income: 0, bonus: 0, expenses: 0
  });

  // Zakat Fitrah State
  const [fitrahValues, setFitrahValues] = useState({
    members: 1, price: 36250
  });

  const [zakatDue, setZakatDue] = useState(0);
  const [isEligible, setIsEligible] = useState(false);
  const [nisab, setNisab] = useState(0);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [muzakkiData, setMuzakkiData] = useState({
    name: "",
    phone: "",
    method: "qris",
    proofImage: ""
  });
  const [paymentStep, setPaymentStep] = useState<"identitas" | "instruksi">("identitas");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMuzakkiData({ ...muzakkiData, proofImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Constants
  const NISAB_EMAS = 82312000; // 85gr Emas
  const NISAB_BERAS_BULANAN = 6850000; // Setara 522kg beras

  useEffect(() => {
    if (activeTab === "maal") {
      const total = maalValues.savings + maalValues.gold + maalValues.investments + maalValues.other - maalValues.debts;
      setNisab(NISAB_EMAS);
      if (total >= NISAB_EMAS) {
        setZakatDue(total * 0.025);
        setIsEligible(true);
      } else {
        setZakatDue(0);
        setIsEligible(false);
      }
    } else if (activeTab === "profesi") {
      const netIncome = profesiValues.income + profesiValues.bonus - profesiValues.expenses;
      setNisab(NISAB_BERAS_BULANAN);
      if (netIncome >= NISAB_BERAS_BULANAN) {
        setZakatDue(netIncome * 0.025);
        setIsEligible(true);
      } else {
        setZakatDue(0);
        setIsEligible(false);
      }
    } else {
      // Fitrah
      const total = fitrahValues.members * fitrahValues.price;
      setZakatDue(total);
      setIsEligible(true);
      setNisab(0);
    }
  }, [activeTab, maalValues, profesiValues, fitrahValues]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If we are in identity step, move to instructions
    if (paymentStep === "identitas") {
      setPaymentStep("instruksi");
      return;
    }

    // Manual validation for proof image in instructions step
    if (!muzakkiData.proofImage) {
      triggerToast("Silakan pilih dan unggah screenshot bukti transfer terlebih dahulu.", "warning");
      return;
    }

    setIsProcessing(true);

    // Save to real database
    const result = await addTransaction({
      muzakkiName: muzakkiData.name || "Hamba Allah",
      phone: muzakkiData.phone,
      type: activeTab === 'maal' ? 'Zakat Maal' : activeTab === 'profesi' ? 'Zakat Profesi' : 'Zakat Fitrah',
      amount: zakatDue,
      method: muzakkiData.method,
      status: "Pending",
      proofImage: muzakkiData.proofImage,
      anonymous: false
    });

    if (result.success) {
      setIsProcessing(false);
      setIsSuccess(true);
    } else {
      setIsProcessing(false);
      triggerToast("Gagal memproses transaksi. Silakan coba lagi.", "error");
    }
  };

  if (isSuccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border border-emerald-50 p-10 text-center space-y-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-bl-full opacity-60 -z-0" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 rounded-tr-full opacity-60 -z-0" />

            {/* Icon */}
            <div className="relative z-10 flex justify-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl bg-amber-50 border-4 border-amber-200">
                <RefreshCcw className="w-12 h-12 text-amber-500 animate-spin" style={{ animationDuration: "3s" }} />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="relative z-10 space-y-2">
              <h2 className="text-3xl font-black text-emerald-900">
                Bukti Diterima!
              </h2>
              <p className="text-emerald-600/70 font-medium">
                Terima kasih, {muzakkiData.name}. Bukti transfer Anda telah kami simpan.
              </p>
            </div>

            {/* Info Box - Only for online payment */}
            <div className="relative z-10 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">Langkah Selanjutnya</p>
              </div>
              <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                Tim Amil kami akan <span className="font-black text-emerald-900">menghubungi Anda terlebih dahulu</span> melalui WhatsApp ke nomor <span className="font-black text-emerald-900">{muzakkiData.phone || "yang Anda daftarkan"}</span> untuk konfirmasi dan verifikasi pembayaran.
              </p>
              <p className="text-xs text-emerald-500 font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Estimasi konfirmasi: 1×24 jam di hari kerja
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="relative z-10 bg-emerald-900 rounded-2xl p-5 text-left space-y-3">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Ringkasan Donasi</p>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-sm text-emerald-300 font-medium">Jenis Zakat</span>
                <span className="text-sm font-black text-white">{activeTab === 'maal' ? 'Zakat Maal' : activeTab === 'profesi' ? 'Zakat Profesi' : 'Zakat Fitrah'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-sm text-emerald-300 font-medium">Nominal</span>
                <span className="text-sm font-black text-emerald-400">{formatCurrency(zakatDue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-300 font-medium">Status</span>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-400">
                  ⏳ Menunggu Verifikasi
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 flex gap-3 pt-2">
              <button
                onClick={() => window.location.href = "/"}
                className="flex-1 py-3.5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all hover:scale-[1.02]"
              >
                Kembali ke Beranda
              </button>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setShowPaymentForm(false);
                  setPaymentStep("identitas");
                  setMaalValues({ savings: 0, gold: 0, investments: 0, other: 0, debts: 0 });
                  setProfesiValues({ income: 0, bonus: 0, expenses: 0 });
                  setFitrahValues({ members: 1, price: 45000 });
                }}
                className="flex-1 py-3.5 bg-white text-emerald-600 border border-emerald-100 rounded-2xl font-bold hover:bg-emerald-50 transition-all"
              >
                Hitung Lagi
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-100 text-emerald-600 mb-2">
            <Calculator className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-emerald-900 tracking-tight">Kalkulator Zakat Digital</h2>
          <p className="text-emerald-600/70 max-w-xl mx-auto text-sm md:text-base">
            Pilih jenis zakat dan masukkan data kekayaan Anda untuk perhitungan yang akurat.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1 bg-emerald-50/50 rounded-2xl w-fit mx-auto border border-emerald-100">
          <TabBtn active={activeTab === "maal"} onClick={() => setActiveTab("maal")} label="Zakat Maal" icon={Coins} />
          <TabBtn active={activeTab === "profesi"} onClick={() => setActiveTab("profesi")} label="Zakat Profesi" icon={Briefcase} />
          <TabBtn active={activeTab === "fitrah"} onClick={() => setActiveTab("fitrah")} label="Zakat Fitrah" icon={Users} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Input Section */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-emerald-900">
                {activeTab === "maal" ? "Rincian Kekayaan" : activeTab === "profesi" ? "Rincian Penghasilan" : "Data Keluarga"}
              </h3>
              <button
                onClick={() => {
                  setMaalValues({ savings: 0, gold: 0, investments: 0, other: 0, debts: 0 });
                  setProfesiValues({ income: 0, bonus: 0, expenses: 0 });
                }}
                className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 hover:text-emerald-700"
              >
                <RefreshCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === "maal" && (
                <>
                  <CalcInput icon={PiggyBank} label="Tabungan/Simpanan" value={maalValues.savings} onChange={(v: number) => setMaalValues({ ...maalValues, savings: v })} />
                  <CalcInput icon={Coins} label="Emas & Perak (Nilai)" value={maalValues.gold} onChange={(v: number) => setMaalValues({ ...maalValues, gold: v })} />
                  <CalcInput icon={HeartHandshake} label="Investasi & Saham" value={maalValues.investments} onChange={(v: number) => setMaalValues({ ...maalValues, investments: v })} />
                  <CalcInput icon={AlertCircle} label="Hutang Jatuh Tempo" value={maalValues.debts} onChange={(v: number) => setMaalValues({ ...maalValues, debts: v })} isDebt />
                </>
              )}

              {activeTab === "profesi" && (
                <>
                  <CalcInput icon={Briefcase} label="Gaji Bulanan" value={profesiValues.income} onChange={(v: number) => setProfesiValues({ ...profesiValues, income: v })} />
                  <CalcInput icon={Coins} label="Bonus / Pendapatan Lain" value={profesiValues.bonus} onChange={(v: number) => setProfesiValues({ ...profesiValues, bonus: v })} />
                  <CalcInput icon={AlertCircle} label="Pengeluaran Pokok" value={profesiValues.expenses} onChange={(v: number) => setProfesiValues({ ...profesiValues, expenses: v })} isDebt />
                </>
              )}

              {activeTab === "fitrah" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-900 uppercase">Jumlah Orang</label>
                    <input type="number" value={fitrahValues.members} onChange={(e) => setFitrahValues({ ...fitrahValues, members: parseInt(e.target.value) || 1 })} className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 outline-none show-spinner" />
                  </div>
                  <CalcInput icon={Coins} label="Harga Beras (Per Kg)" value={fitrahValues.price} onChange={(v: number) => setFitrahValues({ ...fitrahValues, price: v })} />
                </div>
              )}
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-6">
            <div className={cn(
              "p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 border",
              isEligible ? "bg-emerald-600 text-white border-emerald-500" : "bg-white text-emerald-900 border-emerald-100"
            )}>
              <h4 className="text-xs font-black uppercase tracking-widest mb-6 opacity-60">Hasil Perhitungan</h4>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-1 opacity-80">Wajib Zakat?</p>
                  <p className="text-2xl font-black">{isEligible ? "YA, WAJIB" : "BELUM WAJIB"}</p>
                </div>
                <div className="pt-6 border-t border-white/20 flex flex-col gap-3">
                  <p className="text-sm font-medium mb-1 opacity-80">Nominal Zakat</p>
                  <div className="flex justify-between items-center">
                    <p className="text-5xl font-black tracking-tight">{formatCurrency(zakatDue)}</p>
                  </div>
                </div>

                {isEligible && !showPaymentForm && (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setPaymentStep("identitas");
                        setMuzakkiData({ ...muzakkiData, method: "qris" });
                        setShowPaymentForm(true);
                      }}
                      className="w-full py-4 bg-white text-emerald-700 rounded-2xl font-black text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      Tunaikan Zakat Online (QRIS/Transfer)
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Form Section */}
            <AnimatePresence>
              {showPaymentForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-emerald-100/50 space-y-6 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <UserCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-black text-emerald-900">
                        {paymentStep === "identitas" ? "Identitas Muzakki" : "Instruksi Pembayaran"}
                      </h3>
                    </div>
                    {paymentStep === "instruksi" && (
                      <button
                        onClick={() => setPaymentStep("identitas")}
                        className="text-xs font-bold text-emerald-500 hover:underline"
                      >
                        Kembali
                      </button>
                    )}
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    {paymentStep === "identitas" ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest pl-1">Nama Lengkap</label>
                          <input
                            type="text"
                            required
                            placeholder="Masukkan nama sesuai KTP"
                            className="w-full px-5 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-emerald-900 placeholder:text-emerald-300"
                            value={muzakkiData.name}
                            onChange={(e) => setMuzakkiData({ ...muzakkiData, name: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest pl-1">Nomor WhatsApp / HP</label>
                          <input
                            type="tel"
                            required
                            placeholder="Contoh: 08123456789"
                            className="w-full px-5 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-emerald-900 placeholder:text-emerald-300"
                            value={muzakkiData.phone}
                            onChange={(e) => setMuzakkiData({ ...muzakkiData, phone: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest pl-1">Metode Pembayaran</label>
                          <select
                            className="w-full px-5 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-emerald-900"
                            value={muzakkiData.method}
                            onChange={(e) => setMuzakkiData({ ...muzakkiData, method: e.target.value })}
                          >
                            <option value="qris">QRIS (Otomatis)</option>
                            <option value="transfer">Transfer Bank (Manual)</option>
                            <option value="ewallet">E-Wallet (Gopay/OVO)</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-6">
                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-4">
                          <p className="text-sm font-bold text-emerald-900">Silakan Transfer Sebesar:</p>
                          <p className="text-3xl font-black text-emerald-600 tracking-tight">{formatCurrency(zakatDue)}</p>

                          <div className="pt-4 border-t border-emerald-100 space-y-3">
                            {muzakkiData.method === "qris" || muzakkiData.method === "ewallet" ? (
                              <div className="flex flex-col items-center gap-4 py-2">
                                <div className="p-4 bg-white rounded-2xl border-2 border-emerald-100 shadow-sm">
                                  {/* Dummy QRIS Placeholder */}
                                  <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ZakatDigital')] bg-cover opacity-80" />
                                    <p className="relative z-10 text-[10px] font-black text-emerald-900 bg-white/90 px-3 py-1 rounded-full shadow-sm">SCAN QRIS RESMI</p>
                                  </div>
                                </div>
                                <p className="text-[10px] text-center text-emerald-600 font-medium">Bisa scan pakai m-banking atau e-wallet apa saja</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Tujuan Transfer</p>
                                <div className="bg-white p-4 rounded-xl border border-emerald-100">
                                  <p className="text-sm font-black text-emerald-900">BANK SYARIAH INDONESIA (BSI)</p>
                                  <p className="text-lg font-black text-emerald-600 tracking-widest">7123456789</p>
                                  <p className="text-xs font-bold text-emerald-400">a.n YAYASAN LINSHAREIN AMAL</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest pl-1">Unggah Bukti Transfer</label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="proof-upload"
                            />
                            <label
                              htmlFor="proof-upload"
                              className="w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all cursor-pointer group"
                            >
                              {muzakkiData.proofImage ? (
                                <div className="flex flex-col items-center gap-2">
                                  <img src={muzakkiData.proofImage} alt="Preview" className="h-32 object-contain rounded-lg shadow-sm" />
                                  <span className="text-xs font-bold text-emerald-600">Klik untuk ganti foto</span>
                                </div>
                              ) : (
                                <>
                                  <div className="p-3 bg-emerald-100 rounded-full group-hover:scale-110 transition-transform">
                                    <Smartphone className="w-6 h-6 text-emerald-600" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm font-bold text-emerald-900">Pilih Foto / Screenshot</p>
                                    <p className="text-[10px] text-emerald-500 mt-1">Format JPG, PNG (Maks 2MB)</p>
                                  </div>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (paymentStep === "instruksi") setPaymentStep("identitas");
                          else setShowPaymentForm(false);
                        }}
                        className="flex-1 py-4 border border-emerald-100 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-50 transition-all"
                      >
                        {paymentStep === "instruksi" ? "Kembali" : "Batal"}
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCcw className="w-5 h-5 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            {paymentStep === "identitas" ? (
                              <>
                                <ArrowRight className="w-6 h-6" />
                                Lanjutkan
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-6 h-6" />
                                Konfirmasi Pembayaran
                              </>
                            )}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex gap-4">
              <Info className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-900">Info Syariat</p>
                <p className="text-xs text-emerald-700/80 leading-relaxed italic">
                  {activeTab === "maal" ? "Zakat Maal wajib dikeluarkan jika harta mencapai nisab (85gr emas) dan telah dimiliki selama 1 tahun (haul)." :
                    activeTab === "profesi" ? "Zakat Profesi dikeluarkan dari penghasilan bersih jika mencapai nisab setara 522kg beras." :
                      "Zakat Fitrah wajib bagi setiap muslim yang hidup di akhir Ramadhan."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification (Phone Simulation) */}
      <AnimatePresence>
        {showSuccessNotif && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.8 }}
            className="fixed bottom-8 right-8 z-[100]"
          >
            <div className="bg-white rounded-[2.5rem] p-3 shadow-2xl border-4 border-emerald-900 w-[280px] overflow-hidden relative">
              {/* Phone Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-emerald-900 rounded-full z-10"></div>

              <div className="bg-emerald-50 rounded-[2rem] p-5 pt-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <span className="text-[10px] font-black text-emerald-800">4G</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bell className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-800">10:45</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-500 rounded-lg text-white">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-900 uppercase tracking-tighter">Pembayaran Berhasil</p>
                      <p className="text-[8px] text-emerald-500">Just now • Linsharein Amal</p>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700 leading-tight">
                    Alhamdulillah, zakat dari <span className="font-bold text-emerald-900">{successMuzakki}</span> telah berhasil dicatat.
                  </p>
                </div>

                <div className="mt-6 flex justify-center">
                  <div className="w-10 h-1 bg-emerald-200 rounded-full"></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </DashboardLayout>
  );
}

function TabBtn({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon: any }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all",
        active ? "bg-white text-emerald-900 shadow-sm border border-emerald-100" : "text-emerald-400 hover:text-emerald-600"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

interface CalcInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  icon: any;
  isDebt?: boolean;
}

function CalcInput({ label, value, onChange, icon: Icon, isDebt }: CalcInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-emerald-900 uppercase flex items-center gap-2">
        <Icon className={cn("w-4 h-4", isDebt ? "text-red-500" : "text-emerald-500")} />
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">Rp</span>
        <input
          type="text"
          value={value.toLocaleString("id-ID")}
          onChange={(e) => {
            const num = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
            onChange(num);
          }}
          className={cn(
            "w-full pl-12 pr-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/30 text-emerald-900 font-bold outline-none focus:ring-2 transition-all",
            isDebt ? "focus:ring-red-200 focus:border-red-400" : "focus:ring-primary/20 focus:border-primary"
          )}
        />
      </div>
    </div>
  );
}
