"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  PieChart as PieIcon,
  BarChart3,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  CheckCircle2,
  Eye,
  X as CloseIcon
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { getReportData } from "@/lib/actions";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("pemasukan");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getReportData();
      setReportData(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !reportData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-emerald-600 font-bold animate-pulse">Menghitung Data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Group transactions by type (for print report)
  const groupedTransactions = (reportData.recentTransactions || []).reduce((acc: any, tx: any) => {
    const key = tx.type || "Lainnya";
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  // Group distributions by category/asnaf (for print report)
  const groupedDistributions = (reportData.recentDistributions || []).reduce((acc: any, dist: any) => {
    const key = dist.category || "Lainnya";
    if (!acc[key]) acc[key] = [];
    acc[key].push(dist);
    return acc;
  }, {});

  const displayTransactions = (reportData.recentTransactions || []).slice(0, 10);
  const displayDistributions = (reportData.recentDistributions || []).slice(0, 10);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Print Header (Only visible in PDF) */}
        <div className="hidden print:block mb-8 border-b-2 border-emerald-900 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-emerald-900">MA'HAD FASTABIQUL KHOIROT</h1>
              <p className="text-emerald-600 font-bold">Laporan Rekapitulasi Zakat & Infaq</p>
              <p className="text-xs text-emerald-500 mt-1">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-emerald-800 uppercase">Status Laporan</p>
              <p className="text-lg font-black text-emerald-600">TERVERIFIKASI</p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Laporan & Analitik</h2>
            <p className="text-emerald-600/70">Pantau performa penghimpunan dan pendayagunaan zakat.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-emerald-100 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all"
            >
              <Printer className="w-4 h-4" />
              Cetak PDF Resmi
            </button>
            <button 
              onClick={() => {
                const csvRows = [
                  ["LAPORAN KEUANGAN MA'HAD FASTABIQUL KHOIROT"],
                  [`Tanggal Export: ${new Date().toLocaleDateString()}`],
                  [""],
                  ["RINGKASAN KEUANGAN"],
                  ["Total Penghimpunan", reportData.totalIncome],
                  ["Total Penyaluran", reportData.totalOut],
                  ["Saldo Kas", reportData.balance],
                  ["Total Mustahik Terbantu", reportData.mustahikCount],
                  [""],
                  ["RINCIAN BULANAN"],
                  ["Bulan", "Pemasukan (IDR)", "Pengeluaran (IDR)", "Status"],
                  ...reportData.monthlyData.map((row: any) => [
                    row.month, 
                    row.income, 
                    row.out,
                    (row.income - row.out) >= 0 ? "Surplus" : "Defisit"
                  ]),
                  [""],
                  ["ALOKASI PENYALURAN ASNAF"],
                  ["Kategori Asnaf", "Nominal (IDR)", "Persentase"],
                  ...reportData.distributionData.map((d: any) => [
                    d.name,
                    d.value,
                    `${((d.value / reportData.totalOut) * 100).toFixed(2)}%`
                  ])
                ];
                const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `Laporan_Resmi_Mahad_Fastabiqul_Khoirot_${new Date().getTime()}.csv`);
                document.body.appendChild(link);
                link.click();
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
            >
              <Download className="w-4 h-4" />
              Export Excel (Rinci)
            </button>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ReportCard title="Total Penghimpunan" value={reportData.totalIncome} change="+--" trend="up" icon={ArrowUpRight} color="emerald" />
          <ReportCard title="Total Penyaluran" value={reportData.totalOut} change="+--" trend="up" icon={ArrowDownLeft} color="amber" />
          <ReportCard title="Mustahik Terbantu" value={reportData.mustahikCount} change="+--" trend="up" icon={CheckCircle2} color="blue" />
          <ReportCard title="Saldo Efektif" value={reportData.balance} change="--" trend="up" icon={FileText} color="purple" />
        </div>

        {/* Report Sections */}
        <div className="space-y-6">
          <div className="flex items-center gap-1 bg-emerald-50/50 p-1 rounded-2xl w-fit border border-emerald-100">
            <TabButton active={activeTab === "pemasukan"} onClick={() => setActiveTab("pemasukan")} label="Laporan Penghimpunan" />
            <TabButton active={activeTab === "penyaluran"} onClick={() => setActiveTab("penyaluran")} label="Laporan Penyaluran" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-emerald-900">
                  {activeTab === "pemasukan" ? "Tren Penghimpunan Dana" : "Tren Penyaluran Dana"}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    Januari - Mei 2026
                  </span>
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData.monthlyData}>
                    <defs>
                      <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeTab === "pemasukan" ? "#10b981" : "#f59e0b"} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={activeTab === "pemasukan" ? "#10b981" : "#f59e0b"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#065f46', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#065f46', fontSize: 12}} tickFormatter={(val) => `Rp${val/1000000}M`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                      formatter={(value: any) => [formatCurrency(value), "Total"]}
                    />
                    <Area type="monotone" dataKey={activeTab === "pemasukan" ? "income" : "out"} stroke={activeTab === "pemasukan" ? "#10b981" : "#f59e0b"} strokeWidth={4} fillOpacity={1} fill="url(#colorAmt)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side Distribution */}
            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-emerald-900 mb-8">
                {activeTab === "pemasukan" ? "Sumber Penghimpunan" : "Alokasi Penyaluran"}
              </h3>
              <div className="h-[250px] relative mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeTab === "pemasukan" ? reportData.incomeDistribution : reportData.distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {(activeTab === "pemasukan" ? reportData.incomeDistribution : reportData.distributionData).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total</p>
                  <p className="text-lg font-black text-emerald-900">
                    {activeTab === "pemasukan" ? `${(reportData.totalIncome/1000000).toFixed(1)}M` : `${(reportData.totalOut/1000000).toFixed(1)}M`}
                  </p>
                </div>
              </div>
              <div className="space-y-3 mt-auto">
                {(activeTab === "pemasukan" ? reportData.incomeDistribution : reportData.distributionData).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-emerald-800">{item.name}</span>
                    </div>
                    <span className="text-xs font-medium text-emerald-500">
                      {(((item.value / (activeTab === "pemasukan" ? reportData.totalIncome : reportData.totalOut)) || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Data List based on Tab */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden print:hidden">
          <div className="p-6 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/20">
            <h3 className="text-lg font-bold text-emerald-900">
              {activeTab === "pemasukan" ? "Rincian Transaksi Masuk" : "Rincian Penyaluran Dana"}
            </h3>
            <div className="text-xs font-bold text-emerald-500 bg-white px-3 py-1.5 rounded-lg border border-emerald-100">
              {activeTab === "pemasukan" ? `${displayTransactions.length} Transaksi Terakhir` : `${displayDistributions.length} Penyaluran Terakhir`}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-emerald-800 text-[10px] uppercase tracking-widest font-black">
                  {activeTab === "pemasukan" ? (
                    <>
                      <th className="px-8 py-5">Muzakki</th>
                      <th className="px-8 py-5">Jenis Zakat</th>
                      <th className="px-8 py-5">Tanggal</th>
                      <th className="px-8 py-5 text-right">Nominal</th>
                      <th className="px-8 py-5 text-center">Metode</th>
                    </>
                  ) : (
                    <>
                      <th className="px-8 py-5">Penerima (Mustahik)</th>
                      <th className="px-8 py-5">Kategori Asnaf</th>
                      <th className="px-8 py-5">Tanggal</th>
                      <th className="px-8 py-5 text-right">Nominal</th>
                      <th className="px-8 py-5 text-center">Bukti Foto</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {activeTab === "pemasukan" ? (
                  displayTransactions.map((tx: any, i: number) => (
                    <tr key={i} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="px-8 py-4">
                        <p className="text-sm font-bold text-emerald-900">{tx.muzakkiName}</p>
                        <p className="text-[10px] text-emerald-400">{tx.txId}</p>
                      </td>
                      <td className="px-8 py-4">
                        <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">{tx.type}</span>
                      </td>
                      <td className="px-8 py-4 text-xs text-emerald-600">{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-8 py-4 text-right text-sm font-black text-emerald-700">{formatCurrency(tx.amount)}</td>
                      <td className="px-8 py-4 text-center">
                        <span className="text-[10px] font-bold text-emerald-500 uppercase">{tx.method}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  displayDistributions.map((dist: any, i: number) => (
                    <tr key={i} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="px-8 py-4">
                        <p className="text-sm font-bold text-emerald-900">{dist.mustahikName}</p>
                        <p className="text-[10px] text-emerald-400 truncate max-w-[150px]">{dist.description}</p>
                      </td>
                      <td className="px-8 py-4">
                        <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase">{dist.category}</span>
                      </td>
                      <td className="px-8 py-4 text-xs text-emerald-600">{new Date(dist.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-8 py-4 text-right text-sm font-black text-rose-600">{formatCurrency(dist.amount)}</td>
                      <td className="px-8 py-4 text-center">
                        {dist.proofImage ? (
                          <button 
                            onClick={() => setPreviewImage(dist.proofImage)}
                            className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1 mx-auto hover:bg-emerald-200 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            Lihat Foto
                          </button>
                        ) : (
                          <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-400 text-[10px] font-bold">Tidak Ada</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print-Only Detailed Data Grouped by Category */}
        <div className="hidden print:block space-y-8">
          {activeTab === "pemasukan" ? (
            Object.keys(groupedTransactions).length === 0 ? (
              <p className="text-sm text-emerald-600 font-medium">Tidak ada data transaksi masuk.</p>
            ) : (
              Object.keys(groupedTransactions).map((type) => (
                <div key={type} className="bg-white rounded-3xl border border-emerald-100 p-8 space-y-4 break-inside-avoid shadow-sm">
                  <div className="border-b border-emerald-100 pb-4 flex justify-between items-center bg-emerald-50/20 -mx-8 -mt-8 p-6 rounded-t-3xl mb-2">
                    <h3 className="text-base font-black text-emerald-900 uppercase">
                      Laporan Penghimpunan: {type}
                    </h3>
                    <div className="text-right">
                      <p className="text-xs text-emerald-600 font-bold">
                        Total: {formatCurrency(groupedTransactions[type].reduce((sum: number, tx: any) => sum + tx.amount, 0))}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-medium">
                        {groupedTransactions[type].length} Transaksi
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-emerald-800 text-[10px] uppercase tracking-wider font-black border-b border-emerald-50">
                          <th className="py-3 pr-4">Muzakki</th>
                          <th className="py-3 px-4">ID Transaksi</th>
                          <th className="py-3 px-4">Tanggal</th>
                          <th className="py-3 px-4 text-right">Nominal</th>
                          <th className="py-3 pl-4 text-center">Metode</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50">
                        {groupedTransactions[type].map((tx: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-3 pr-4 font-bold text-emerald-900">{tx.muzakkiName}</td>
                            <td className="py-3 px-4 text-[10px] text-emerald-500 font-mono">{tx.txId}</td>
                            <td className="py-3 px-4 text-emerald-600">{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                            <td className="py-3 px-4 text-right font-black text-emerald-700">{formatCurrency(tx.amount)}</td>
                            <td className="py-3 pl-4 text-center text-emerald-500 uppercase font-bold">{tx.method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )
          ) : (
            Object.keys(groupedDistributions).length === 0 ? (
              <p className="text-sm text-emerald-600 font-medium">Tidak ada data penyaluran dana.</p>
            ) : (
              Object.keys(groupedDistributions).map((category) => (
                <div key={category} className="bg-white rounded-3xl border border-emerald-100 p-8 space-y-4 break-inside-avoid shadow-sm">
                  <div className="border-b border-emerald-100 pb-4 flex justify-between items-center bg-emerald-50/20 -mx-8 -mt-8 p-6 rounded-t-3xl mb-2">
                    <h3 className="text-base font-black text-emerald-900 uppercase">
                      Laporan Penyaluran Asnaf: {category}
                    </h3>
                    <div className="text-right">
                      <p className="text-xs text-rose-600 font-bold">
                        Total Penyaluran: {formatCurrency(groupedDistributions[category].reduce((sum: number, dist: any) => sum + dist.amount, 0))}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-medium">
                        {groupedDistributions[category].length} Distribusi
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-emerald-800 text-[10px] uppercase tracking-wider font-black border-b border-emerald-50">
                          <th className="py-3 pr-4">Penerima (Mustahik)</th>
                          <th className="py-3 px-4">Keterangan</th>
                          <th className="py-3 px-4">Tanggal</th>
                          <th className="py-3 pl-4 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50">
                        {groupedDistributions[category].map((dist: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-3 pr-4 font-bold text-emerald-900">{dist.mustahikName}</td>
                            <td className="py-3 px-4 text-[10px] text-emerald-500 max-w-[200px] truncate">{dist.description || "-"}</td>
                            <td className="py-3 px-4 text-emerald-600">{new Date(dist.date).toLocaleDateString('id-ID')}</td>
                            <td className="py-3 pl-4 text-right font-black text-rose-600">{formatCurrency(dist.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Image Preview Modal */}
        <AnimatePresence>
          {previewImage && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full relative"
              >
                <button 
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-10"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
                <div className="p-2">
                  <img 
                    src={previewImage} 
                    alt="Bukti Penyaluran" 
                    className="w-full h-auto max-h-[70vh] object-contain rounded-2xl"
                  />
                </div>
                <div className="p-6 text-center bg-emerald-50/30">
                  <p className="text-emerald-900 font-bold">Bukti Dokumentasi Penyaluran</p>
                  <p className="text-xs text-emerald-600 mt-1">Dokumen ini disimpan secara aman di sistem Ma'had Fastabiqul Khoirot</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Monthly Summary (Always visible at bottom) */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden no-print">
          <div className="p-6 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/20">
            <h3 className="text-lg font-bold text-emerald-900">Performa Bulanan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-emerald-800 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-8 py-5">Bulan</th>
                  <th className="px-8 py-5 text-right">Pemasukan</th>
                  <th className="px-8 py-5 text-right">Penyaluran</th>
                  <th className="px-8 py-5 text-center">Efisiensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {[...reportData.monthlyData].reverse().map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="px-8 py-4 text-sm font-bold text-emerald-900">{row.month}</td>
                    <td className="px-8 py-4 text-right text-sm font-black text-emerald-700">{formatCurrency(row.income)}</td>
                    <td className="px-8 py-4 text-right text-sm font-black text-amber-700">{formatCurrency(row.out)}</td>
                    <td className="px-8 py-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                        {row.income > 0 ? Math.round((row.out / row.income) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ReportCard({ title, value, change, trend, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className={cn("p-3 rounded-2xl", colorMap[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={cn(
          "px-2 py-1 rounded-lg text-[10px] font-black",
          trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {change}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{title}</p>
        <h4 className="text-xl font-black text-emerald-900 mt-1">
          {typeof value === "number" && value > 10000 ? formatCurrency(value) : value.toLocaleString()}
        </h4>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-2.5 rounded-xl text-xs font-black transition-all",
        active 
          ? "bg-white text-emerald-900 shadow-sm border border-emerald-100" 
          : "text-emerald-400 hover:text-emerald-600"
      )}
    >
      {label}
    </button>
  );
}
