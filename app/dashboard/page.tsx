"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDashboardStats, getTransactions } from "@/lib/actions";
import {
  Users,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  History
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const [statsData, setStatsData] = useState<any>({
    totalZakat: 0,
    totalTransactions: 0,
    uniqueMuzakki: 0,
    totalDistribution: 0,
    chartData: [],
    zakatTypes: []
  });
  const [chartPeriod, setChartPeriod] = useState("6m");
  const [chartLoading, setChartLoading] = useState(false);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setPageLoading(true);
      const [stats, txs] = await Promise.all([getDashboardStats(), getTransactions()]);
      setStatsData(stats);
      setRecentTx(txs.slice(0, 5));
      setPageLoading(false);
    }
    fetchData();
  }, []);

  // Fetch chart data when period changes
  const handlePeriodChange = async (period: string) => {
    setChartPeriod(period);
    setChartLoading(true);
    try {
      const stats = await getDashboardStats(period);
      setStatsData((prev: any) => ({ ...prev, chartData: stats.chartData }));
    } catch (e) {
      console.error("Error fetching chart data:", e);
    }
    setChartLoading(false);
  };

  const periodOptions = [
    { value: "1w", label: "1 Minggu" },
    { value: "1m", label: "1 Bulan" },
    { value: "3m", label: "3 Bulan" },
    { value: "6m", label: "6 Bulan" },
    { value: "1y", label: "1 Tahun" },
  ];

  const displayStats = [
    {
      label: "Total Zakat Terkumpul",
      value: statsData.totalZakat,
      change: "+12.5%",
      trend: "up",
      icon: Wallet,
      color: "emerald"
    },
    {
      label: "Total Muzakki",
      value: statsData.uniqueMuzakki,
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "blue"
    },
    {
      label: "Total Penyaluran",
      value: statsData.totalDistribution,
      change: "+5.4%",
      trend: "up",
      icon: ArrowUpRight,
      color: "amber"
    },
    {
      label: "Total Transaksi",
      value: statsData.totalTransactions,
      change: "-2.1%",
      trend: "down",
      icon: History,
      color: "purple"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-emerald-900">Dashboard Overview</h2>
          <p className="text-emerald-600/70">Ringkasan statistik dan aktivitas zakat terbaru.</p>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pageLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-emerald-100 flex flex-col justify-between animate-pulse h-[170px]">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-emerald-55 bg-emerald-100/50 rounded-xl"></div>
                  <div className="w-14 h-6 bg-emerald-55 bg-emerald-100/50 rounded-lg"></div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-emerald-55 bg-emerald-100/50 rounded w-2/3"></div>
                  <div className="h-8 bg-emerald-55 bg-emerald-100/50 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : (
            displayStats.map((stat, i) => (
              <Link 
                key={i} 
                href={
                  stat.label === "Total Muzakki" ? "/muzakki" : 
                  stat.label === "Total Penyaluran" ? "/distributions" : 
                  "/transactions"
                }
                className="bg-white p-6 rounded-2xl border border-emerald-100 card-hover flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-3 rounded-xl",
                    stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                      stat.color === "blue" ? "bg-blue-50 text-blue-600" :
                        stat.color === "amber" ? "bg-amber-50 text-amber-600" :
                          "bg-purple-50 text-purple-600"
                  )}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                    stat.trend === "up" ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                  )}>
                    {stat.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-emerald-600/60">{stat.label}</p>
                  <p className="text-2xl font-black text-emerald-900 mt-1">
                    {stat.label.includes("Total Zakat") || stat.label.includes("Penyaluran") 
                      ? formatCurrency(stat.value as number) 
                      : stat.value.toLocaleString("id-ID")}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-emerald-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-bold text-emerald-900">Statistik Pemasukan & Penyaluran</h3>
              <div className="flex gap-1 bg-emerald-50 rounded-xl p-1">
                {periodOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handlePeriodChange(opt.value)}
                    disabled={chartLoading}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
                      chartPeriod === opt.value
                        ? "bg-primary text-white shadow-sm"
                        : "text-emerald-600 hover:bg-emerald-100/80"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px] w-full relative">
              {pageLoading ? (
                <div className="absolute inset-0 bg-emerald-50/10 rounded-xl animate-pulse flex items-center justify-center border border-dashed border-emerald-100/50">
                  <div className="h-6 w-32 bg-emerald-100/50 rounded"></div>
                </div>
              ) : (
                <>
                  {chartLoading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        <span className="text-sm font-bold">Memuat data...</span>
                      </div>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData.chartData}>
                      <defs>
                        <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPenyaluran" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d97706" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#065f46', fontSize: 11 }}
                        dy={10}
                        interval={chartPeriod === "1m" ? 2 : 0}
                        angle={chartPeriod === "3m" ? -35 : 0}
                        textAnchor={chartPeriod === "3m" ? "end" : "middle"}
                        height={chartPeriod === "3m" ? 60 : 40}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#065f46', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(value: any) => [formatCurrency(Number(value || 0))]}
                      />
                      <Area type="monotone" dataKey="pemasukan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPemasukan)" />
                      <Area type="monotone" dataKey="penyaluran" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorPenyaluran)" strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-emerald-100">
            <h3 className="text-lg font-bold text-emerald-900 mb-6">Distribusi Jenis Zakat</h3>
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {pageLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="space-y-2 animate-pulse">
                      <div className="flex justify-between">
                        <div className="h-4 bg-emerald-100/50 rounded w-1/3"></div>
                        <div className="h-4 bg-emerald-100/50 rounded w-1/12"></div>
                      </div>
                      <div className="w-full h-2 bg-emerald-100/50 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : statsData.zakatTypes.length > 0 ? (
                statsData.zakatTypes.map((type: any, idx: number) => (
                  <ZakatTypeProgress 
                    key={type.label} 
                    label={type.label} 
                    value={type.value} 
                    color={idx % 4 === 0 ? "emerald" : idx % 4 === 1 ? "blue" : idx % 4 === 2 ? "amber" : "purple"} 
                  />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-xs text-emerald-500 italic">Belum ada data transaksi</p>
                </div>
              )}
            </div>
            <div className="mt-8 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                Tip: Zakat Profesi mengalami kenaikan sebesar 15% dibandingkan bulan lalu.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden">
          <div className="p-6 border-b border-emerald-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-emerald-900">Transaksi Terbaru</h3>
            <Link href="/transactions" className="text-sm font-bold text-primary hover:underline">Lihat Semua</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-emerald-50/50 text-emerald-800 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Muzakki</th>
                  <th className="px-6 py-4 font-bold">Jenis Zakat</th>
                  <th className="px-6 py-4 font-bold">Nominal</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                </tr>
              </thead>

          </table>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}

function ZakatTypeProgress({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-emerald-800">{label}</span>
        <span className="text-emerald-600">{value}%</span>
      </div>
      <div className="w-full h-2 bg-emerald-50 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", colorClasses[color])}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}
