"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Plus,
  Search,
  Filter,
  Download,
  QrCode,
  CreditCard,
  Wallet as WalletIcon,
  Eye,
  Edit2,
  Trash2,
  Printer,
  ChevronRight,
  User,
  ShieldCheck,
  X,
  Banknote,
  RefreshCcw,
  Smartphone
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { initialMuzakki } from "@/lib/data";

import { getTransactions, addTransaction, getMuzakki, updateTransaction, deleteTransaction, verifyTransaction, getTransactionProof, getZakatTypes } from "@/lib/actions";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/Toast";

function TransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhoneNotif, setShowPhoneNotif] = useState(false);
  const [lastMuzakki, setLastMuzakki] = useState("");
  const [transactionList, setTransactionList] = useState<any[]>([]);
  const [muzakkiList, setMuzakkiList] = useState<any[]>([]);
  const [zakatTypesList, setZakatTypesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as any });

  const triggerToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast({ show: true, message, type });
  };
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadingProof, setLoadingProof] = useState(false);

  const [formData, setFormData] = useState({
    muzakki: "",
    muzakkiId: null as number | null,
    type: "Zakat Fitrah",
    amount: 0,
    method: "tunai",
    status: "Success",
    isAnonymous: false
  });

  const [muzakkiSearch, setMuzakkiSearch] = useState("");
  const [showMuzakkiDropdown, setShowMuzakkiDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const filteredMuzakkiList = muzakkiList.filter(m => 
    m.name.toLowerCase().includes(muzakkiSearch.toLowerCase())
  );

  const fetchData = async () => {
    setLoading(true);
    const [txs, mzk, zTypes] = await Promise.all([getTransactions(), getMuzakki(), getZakatTypes()]);
    setTransactionList(txs);
    setMuzakkiList(mzk);
    setZakatTypesList(zTypes.filter((t: any) => t.status === "Active"));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    let result;
    const payload = {
      muzakkiName: formData.muzakki || "Hamba Allah",
      muzakkiId: formData.muzakkiId,
      type: formData.type,
      amount: formData.amount,
      method: formData.method,
      status: formData.status,
      anonymous: formData.isAnonymous,
    };

    if (isEdit && selectedId) {
      result = await updateTransaction(selectedId, payload);
    } else {
      result = await addTransaction(payload);
    }

    if (result.success) {
      setShowAddModal(false);
      fetchData();
      resetForm();
      triggerToast(isEdit ? "Transaksi berhasil diperbarui!" : "Transaksi baru berhasil ditambahkan!");

      if (searchParams.get("amount")) {
        router.replace(`/calculator?success=true&muzakki=${encodeURIComponent(formData.muzakki || "Hamba Allah")}`);
      }
    } else {
      triggerToast(result.error || "Gagal menyimpan transaksi.", "error");
    }
  };

  const handleEdit = (tx: any) => {
    setFormData({
      muzakki: tx.muzakkiName || tx.muzakki?.name || "",
      muzakkiId: tx.muzakkiId,
      type: tx.type,
      amount: tx.amount,
      method: tx.method,
      status: tx.status,
      isAnonymous: tx.anonymous,
    });
    setSelectedId(tx.id);
    setIsEdit(true);
    setShowAddModal(true);
  };

  const handleVerify = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin mensahkan transaksi ini? Pastikan dana sudah masuk ke rekening yayasan.")) {
      setIsVerifying(true);
      const result = await verifyTransaction(id);
      if (result.success) {
        fetchData();
        triggerToast("Transaksi berhasil disahkan!");
      } else {
        triggerToast(result.error || "Gagal verifikasi transaksi", "error");
      }
      setIsVerifying(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      const result = await deleteTransaction(id);
      if (result.success) {
        fetchData();
        triggerToast("Transaksi berhasil dihapus!");
      } else {
        triggerToast(result.error || "Gagal menghapus transaksi.", "error");
      }
    }
  };

  const handleViewReceipt = (tx: any) => {
    setSelectedTx(tx);
    setShowReceipt(true);
  };

  const handlePrint = (tx: any) => {
    setSelectedTx(tx);
    // Give time for modal to render if it's not visible, but we can also trigger print directly
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const filteredTransactions = transactionList.filter(tx => {
    const matchesSearch = 
      (tx.muzakkiName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      tx.txId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "Semua" || tx.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      muzakki: "",
      muzakkiId: null,
      type: "Zakat Fitrah",
      amount: 0,
      method: "tunai",
      status: "Success",
      isAnonymous: false
    });
    setIsEdit(false);
    setSelectedId(null);
  };

  useEffect(() => {
    const amount = searchParams.get("amount");
    const type = searchParams.get("type");

    if (amount) {
      setFormData(prev => ({
        ...prev,
        amount: parseInt(amount),
        type: type === "profesi" ? "Zakat Profesi" : type === "maal" ? "Zakat Maal" : type === "infaq" ? "Infaq & Sedekah" : type === "fidyah" ? "Fidyah" : type === "fasangat" ? "Fasangat" : "Zakat Fitrah"
      }));
      setShowAddModal(true);
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          .no-print, 
          nav, 
          aside, 
          button, 
          .summary-cards, 
          .toolbar,
          th:last-child, 
          td:last-child { 
            display: none !important; 
          }
          body { 
            background: white !important; 
            padding: 0 !important;
          }
          .print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 2rem;
          }
          .main-content {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          table {
            border: 1px solid #e2e8f0 !important;
          }
        }
        .print-header { display: none; }
      `}</style>

      {/* Print Header (Only visible on PDF) */}
      <div className="print-header">
        <h1 className="text-2xl font-bold text-emerald-900">LAPORAN TRANSAKSI ZAKAT</h1>
        <p className="text-sm text-emerald-600">Ma'had Fastabiqul Khoirot • Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
        <hr className="my-4 border-emerald-100" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-emerald-900">Transaksi Zakat</h2>
          <p className="text-emerald-600/70">Catat dan pantau semua aliran dana masuk.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          <Plus className="w-5 h-5" />
          Catat Transaksi
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Transaksi</p>
            <p className="text-lg font-black text-emerald-900">{transactionList.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <RefreshCcw className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Menunggu Verifikasi</p>
            <p className="text-lg font-black text-emerald-900">{transactionList.filter(t => t.status === "Pending").length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Telah Disahkan</p>
            <p className="text-lg font-black text-emerald-900">{transactionList.filter(t => t.status === "Success").length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex flex-col md:flex-row gap-4 items-center justify-between no-print">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
          <input
            type="text"
            placeholder="Cari ID transaksi atau muzakki..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-emerald-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all outline-none border-none"
          >
            <option value="Semua">Semua Status</option>
            <option value="Success">Berhasil</option>
            <option value="Pending">Pending</option>
          </select>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-emerald-50/50 text-emerald-800 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">ID & Tanggal</th>
                <th className="px-6 py-4 font-bold">Muzakki</th>
                <th className="px-6 py-4 font-bold">Jenis Zakat</th>
                <th className="px-6 py-4 font-bold">Metode</th>
                <th className="px-6 py-4 font-bold">Nominal</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-emerald-400">
                    <RefreshCcw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-emerald-400">
                    Tidak ada transaksi yang ditemukan.
                  </td>
                </tr>
              ) : filteredTransactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-emerald-900">{tx.txId || tx.id}</p>
                    <p className="text-[10px] text-emerald-500">{new Date(tx.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {tx.anonymous ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <User className="w-4 h-4 text-emerald-300" />
                      )}
                      <span className={cn("text-sm font-bold", tx.anonymous ? "text-emerald-600 italic" : "text-emerald-900")}>
                        {tx.muzakkiName || tx.muzakki?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-emerald-700">{tx.method}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-emerald-900">{formatCurrency(tx.amount)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {tx.status === "Success" ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Berhasil</span>
                        </div>
                      ) : tx.status === "Pending" ? (
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg w-fit">
                          <RefreshCcw className="w-3 h-3 animate-spin-slow" />
                          <span>Pending</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg w-fit">
                          <X className="w-3 h-3" />
                          <span>Gagal</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-center">
                      {tx.status === "Pending" && (
                        <button
                          onClick={() => handleVerify(tx.id)}
                          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                          title="Sahkan Transaksi"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      )}
                      {tx.muzakki?.phone && (
                        <a
                          href={(() => {
                            const phone = tx.muzakki?.phone;
                            let cleaned = phone.replace(/\D/g, "");
                            if (cleaned.startsWith("0")) {
                              cleaned = "62" + cleaned.slice(1);
                            }
                            const name = tx.muzakkiName || tx.muzakki?.name || "Bpk/Ibu";
                            const amountStr = tx.amount.toLocaleString("id-ID");
                            let message = "";
                            if (tx.status === "Pending") {
                              message = `Assalamualaikum Wr. Wb. *${name}*,\n\nTerima kasih telah mengajukan pembayaran *${tx.type}* sebesar *Rp ${amountStr}* melalui Ma'had Fastabiqul Khoirot.\n\nMohon konfirmasi jika Anda sudah melakukan transfer agar Amil kami dapat segera memverifikasi transaksi Anda. Terima kasih. Wassalamualaikum Wr. Wb.`;
                            } else if (tx.status === "Success") {
                              message = `Assalamualaikum Wr. Wb. *${name}*,\n\nAlhamdulillah, pembayaran *${tx.type}* Anda sebesar *Rp ${amountStr}* telah terverifikasi dan diterima secara resmi oleh Ma'had Fastabiqul Khoirot.\n\n*Doa Amil untuk Anda:*\n_"Ajarakallahu fiimaa a'thaita, wa baaraka fiimaa abqaita, wa ja'alahu laka thahuuraa."_\n(Semoga Allah memberikan pahala atas apa yang engkau berikan, memberikan berkah atas apa yang engkau sisakan, dan menjadikannya pembersih bagimu.)\n\nTerima kasih atas kepercayaan Anda. Wassalamualaikum Wr. Wb.`;
                            } else {
                              message = `Assalamualaikum Wr. Wb. *${name}*,\n\nMohon maaf, transaksi pembayaran *${tx.type}* Anda sebesar *Rp ${amountStr}* dinyatakan tidak berhasil/gagal.\n\nSilakan hubungi kami kembali untuk bantuan lebih lanjut. Terima kasih. Wassalamualaikum Wr. Wb.`;
                            }
                            return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
                          })()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                          title="Kirim Pesan WhatsApp Instan"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.714-1.463L0 24zm6.59-4.846c1.6.95 3.16 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.623-1.023-5.086-2.885-6.948C16.63 2.016 14.17 1 11.547 1 6.11 1 1.685 5.371 1.681 10.8c-.001 1.764.474 3.486 1.38 5.025l-.955 3.487 3.606-.947C7.24 18.847 8.35 19.1 9.4 19.1zM17.43 14.85c-.322-.16-1.9-.937-2.221-1.053-.322-.116-.557-.174-.79.174-.233.349-.9.174-1.103.116-.203-.058-.406-.116-.58-.29-.174-.174-.349-.349-.523-.523-.174-.174-.29-.349-.464-.523-.174-.174-.058-.29.058-.406.116-.116.233-.29.349-.406.116-.116.174-.233.29-.406.116-.174.058-.349-.058-.464-.116-.116-.79-1.9-.933-2.247-.14-.34-.29-.29-.406-.29-.116-.005-.233-.005-.349-.005-.116 0-.29.058-.464.233-.174.174-.639.639-.639 1.564 0 .925.639 1.8.79 2.03.116.174 1.25 1.9 3.03 2.68.423.18.753.29.98.37.424.135.81.115 1.115.07.34-.05 1.9-.78 2.167-1.492.268-.712.268-1.32.174-1.436-.095-.116-.322-.174-.645-.334z"/>
                          </svg>
                        </a>
                      )}
                      {tx.method === "transfer" && (
                        <button
                          onClick={async () => {
                            setSelectedTx({ ...tx, proofImage: null });
                            setShowProofModal(true);
                            setLoadingProof(true);
                            try {
                              const proof = await getTransactionProof(tx.id);
                              setSelectedTx({ ...tx, proofImage: proof });
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setLoadingProof(false);
                            }
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Lihat Bukti Transfer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleViewReceipt(tx)}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                        title="Lihat Kwitansi"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(tx)}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                        title="Edit Transaksi"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(tx.id)}
                        className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add Transaction */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{isEdit ? "Edit Transaksi" : "Catat Transaksi Baru"}</h3>
                <p className="text-emerald-100 text-xs">{isEdit ? "Perbarui detail transaksi yang dipilih." : "Isi formulir untuk mencatat pembayaran zakat."}</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-emerald-900 uppercase">Muzakki</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cari atau ketik nama muzakki..."
                        className="w-full px-4 py-3 rounded-xl bg-emerald-50 border-none outline-none text-sm font-bold text-emerald-900"
                        value={formData.muzakki || muzakkiSearch}
                        onFocus={() => setShowMuzakkiDropdown(true)}
                        onChange={(e) => {
                          setMuzakkiSearch(e.target.value);
                          setFormData({ ...formData, muzakki: e.target.value });
                        }}
                      />
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
                      
                      {showMuzakkiDropdown && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-emerald-100 z-50 max-h-48 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2">
                          {filteredMuzakkiList.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setFormData({ ...formData, muzakki: m.name, muzakkiId: m.id });
                                setMuzakkiSearch("");
                                setShowMuzakkiDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-emerald-50 last:border-0"
                            >
                              <p className="text-sm font-bold text-emerald-900">{m.name}</p>
                              <p className="text-[10px] text-emerald-500">{m.phone}</p>
                            </button>
                          ))}
                          <button
                             onClick={() => setShowMuzakkiDropdown(false)}
                             className="w-full px-4 py-2 text-center text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-50/50"
                          >
                            Tutup
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-900 uppercase">Jenis Zakat</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-emerald-50 border-none outline-none text-sm font-bold text-emerald-900"
                    >
                      <option>Zakat Fitrah</option>
                      <option>Zakat Profesi</option>
                      <option>Zakat Maal</option>
                      <option>Infaq &amp; Sedekah</option>
                      <option>Fidyah</option>
                      <option>Fasangat</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-900 uppercase">Nominal (Rp)</label>
                    <input
                      type="text"
                      value={formData.amount === 0 ? "" : formData.amount.toLocaleString("id-ID")}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setFormData({ ...formData, amount: parseInt(val) || 0 });
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-emerald-50 border-none outline-none text-sm font-bold text-emerald-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-900 uppercase">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-emerald-50 border-none outline-none text-sm font-bold text-emerald-900"
                    >
                      <option>Success</option>
                      <option>Pending</option>
                      <option>Failed</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Metode Pembayaran</p>
                      <p className="text-sm font-bold text-emerald-600">Tunai (Cash)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg uppercase tracking-tighter">Otomatis</span>
                </div>

                <div
                  className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl cursor-pointer"
                  onClick={() => setFormData({ ...formData, isAnonymous: !formData.isAnonymous })}
                >
                  <input type="checkbox" checked={formData.isAnonymous} readOnly className="w-5 h-5 rounded-md border-emerald-300 text-primary focus:ring-primary" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-emerald-900">Tampilkan sebagai "Hamba Allah"</p>
                    <p className="text-[10px] text-emerald-600">Sembunyikan nama asli di laporan publik.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-3.5 bg-emerald-50 text-emerald-700 rounded-2xl font-bold hover:bg-emerald-100 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveTransaction}
                  className="flex-[2] py-3.5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  {isEdit ? "Update Transaksi" : "Simpan Transaksi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Image Modal */}
      <AnimatePresence>
        {showProofModal && selectedTx && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full relative"
            >
              <div className="p-6 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/20">
                <div>
                  <h3 className="text-xl font-bold text-emerald-900">Bukti Transfer Muzakki</h3>
                  <p className="text-xs text-emerald-500 font-medium">{selectedTx.muzakkiName} • {formatCurrency(selectedTx.amount)}</p>
                </div>
                <button 
                  onClick={() => setShowProofModal(false)}
                  className="p-2 hover:bg-white rounded-full text-emerald-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 bg-emerald-50/30">
                {loadingProof ? (
                  <div className="h-64 flex flex-col items-center justify-center text-emerald-600 bg-white rounded-2xl border-2 border-dashed border-emerald-100">
                    <RefreshCcw className="w-8 h-8 animate-spin mb-2" />
                    <p className="text-sm font-medium">Memuat bukti transfer...</p>
                  </div>
                ) : selectedTx.proofImage ? (
                  <img 
                    src={selectedTx.proofImage} 
                    alt="Bukti Transfer" 
                    className="w-full h-auto max-h-[60vh] object-contain rounded-2xl shadow-lg border-4 border-white"
                  />
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-emerald-400 bg-white rounded-2xl border-2 border-dashed border-emerald-100">
                    <Smartphone className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm font-medium">Tidak ada foto bukti</p>
                  </div>
                )}
              </div>
              <div className="p-6 flex gap-3 bg-white">
                <button 
                  onClick={() => setShowProofModal(false)}
                  className="flex-1 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-all"
                >
                  Tutup
                </button>
                {selectedTx.status === "Pending" && (
                  <button 
                    onClick={() => {
                      handleVerify(selectedTx.id);
                      setShowProofModal(false);
                    }}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Sahkan Sekarang
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && selectedTx && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:bg-white print:p-0"
            onClick={() => setShowReceipt(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-full flex flex-col max-h-[95vh]"
            >
              <div className="p-6 bg-emerald-600 text-white flex justify-between items-center print:hidden">
                <h3 className="font-bold">Kuitansi Digital</h3>
                <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Receipt Content to Print */}
              <div className="p-8 space-y-8 bg-white text-emerald-900 overflow-y-auto flex-1 custom-scrollbar" id="receipt-content">
                <div className="text-center space-y-2 border-b border-emerald-100 pb-8">
                  <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <span className="text-3xl font-black text-white italic">M</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-emerald-900">Ma'had Fastabiqul Khoirot</h2>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Kuitansi Zakat Digital</p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-emerald-300 uppercase">No. Transaksi</p>
                      <p className="font-black text-emerald-900">#{selectedTx.txId || selectedTx.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-300 uppercase">Tanggal</p>
                      <p className="font-bold text-emerald-900">{new Date(selectedTx.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
                    <div className="flex justify-between">
                      <p className="text-xs font-bold text-emerald-600">Muzakki</p>
                      <p className="text-sm font-black text-emerald-900">{selectedTx.anonymous ? "Hamba Allah" : (selectedTx.muzakkiName || selectedTx.muzakki?.name)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs font-bold text-emerald-600">Jenis Zakat</p>
                      <p className="text-sm font-black text-emerald-900">{selectedTx.type}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs font-bold text-emerald-600">Metode</p>
                      <p className="text-sm font-bold text-emerald-900 uppercase">{selectedTx.method}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-dashed border-emerald-200">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-emerald-900 uppercase tracking-widest">Total Bayar</p>
                      <p className="text-3xl font-black text-emerald-600">{formatCurrency(selectedTx.amount)}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    Transaksi Terverifikasi
                  </div>
                  <p className="text-[9px] text-emerald-400 font-medium leading-relaxed">
                    Terima kasih atas zakat Anda. Semoga Allah SWT memberikan keberkahan atas harta yang dikeluarkan dan mensucikan jiwa Anda. Amin.
                  </p>
                </div>

                {/* Footer and QR Code Simulation */}
                <div className="pt-8 border-t border-emerald-50 flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-[8px] font-bold text-emerald-300">Dikeluarkan Oleh</p>
                    <p className="text-[10px] font-black text-emerald-900">Petugas Amil Ma'had Fastabiqul Khoirot</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-emerald-200" />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-emerald-50 border-t border-emerald-100 flex gap-3 print:hidden">
                <button 
                  onClick={() => handlePrint(selectedTx)}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all"
                >
                  <Printer className="w-5 h-5" />
                  Cetak / Simpan PDF
                </button>
                <button 
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 py-3 bg-white text-emerald-600 border border-emerald-100 rounded-2xl font-bold hover:bg-emerald-100 transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <TransactionsContent />
      </Suspense>
    </DashboardLayout>
  );
}
