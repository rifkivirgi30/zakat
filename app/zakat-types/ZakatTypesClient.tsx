"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  HandHeart, 
  BookOpen, 
  HeartHandshake,
  Coins,
  Briefcase,
  Users,
  Wheat,
  Info,
  ArrowRight,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Data Statis / Data Umum Zakat sesuai syariat
const generalZakatTypes = [
  {
    id: 1,
    name: "Zakat Maal (Harta)",
    description: "Zakat yang dikenakan atas harta (emas, perak, tabungan, investasi) yang telah mencapai nisab (85 gram emas) dan haul (1 tahun kepemilikan).",
    percentage: "2.5%",
    icon: Coins,
    color: "emerald",
    rules: "Nisab: 85 Gram Emas | Haul: 1 Tahun",
  },
  {
    id: 2,
    name: "Zakat Profesi (Penghasilan)",
    description: "Zakat yang dikeluarkan dari penghasilan rutin (gaji/honorarium) jika telah mencapai nisab yang diqiyaskan dengan zakat pertanian (522 kg beras).",
    percentage: "2.5%",
    icon: Briefcase,
    color: "blue",
    rules: "Nisab: 522 Kg Beras/Bulan | Haul: Saat Menerima",
  },
  {
    id: 3,
    name: "Zakat Fitrah",
    description: "Zakat jiwa yang diwajibkan atas setiap jiwa muslim yang hidup di bulan Ramadhan. Berfungsi untuk menyucikan orang yang berpuasa.",
    percentage: "2.5 Kg / 3.5 Liter",
    icon: Users,
    color: "amber",
    rules: "Bentuk: Makanan Pokok (Beras) atau Uang Tunai",
  },
  {
    id: 4,
    name: "Fidyah",
    description: "Tebusan bagi orang yang tidak mampu berpuasa Ramadhan karena alasan syar'i (sakit menahun, renta, hamil/menyusui yang berisiko).",
    percentage: "1 Mud / Hari",
    icon: Wheat,
    color: "orange",
    rules: "Bentuk: Memberi makan 1 orang miskin per hari puasa yang ditinggalkan",
  },
  {
    id: 5,
    name: "Infak & Sedekah",
    description: "Pemberian harta secara sukarela di luar kewajiban zakat untuk mengharap ridha Allah. Tidak ada batas nisab, haul, maupun persentase tertentu.",
    percentage: "Sukarela",
    icon: HandHeart,
    color: "rose",
    rules: "Tanpa batas minimal atau maksimal",
  }
];

export default function ZakatTypesClient() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Jenis & Panduan Zakat</h2>
            <p className="text-emerald-600/70">Referensi ketentuan syariat zakat yang berlaku secara umum.</p>
          </div>
          <Link
            href="/program-lembaga"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-sm"
          >
            <Building2 className="w-4 h-4" />
            Kelola Program Lembaga
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Info Box */}
        <div className="bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100 flex gap-4">
          <Info className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-emerald-900">Informasi Panduan Syariat</p>
            <p className="text-sm text-emerald-700/80 leading-relaxed">
              Berikut adalah jenis zakat standar syariat yang berlaku secara umum. Parameter hitungan dan nisab pada bagian ini sudah terintegrasi otomatis di kalkulator zakat platform ini.
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generalZakatTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <div key={type.id} className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-4 rounded-2xl",
                    type.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                    type.color === "blue" ? "bg-blue-50 text-blue-600" :
                    type.color === "amber" ? "bg-amber-50 text-amber-600" :
                    type.color === "orange" ? "bg-orange-50 text-orange-600" :
                    type.color === "rose" ? "bg-rose-50 text-rose-600" :
                    "bg-violet-50 text-violet-600"
                  )}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Standar Syariat
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-emerald-900">{type.name}</h3>
                  <p className="text-sm text-emerald-600/70 mt-2 leading-relaxed">
                    {type.description}
                  </p>
                </div>

                <div className="mt-auto pt-6 border-t border-emerald-50 space-y-3">
                  <div>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Aturan Dasar</p>
                    <p className="text-xs font-bold text-emerald-800 mt-1">{type.rules}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Rate / Kadar</p>
                    <p className="text-lg font-black text-emerald-900">{type.percentage}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
