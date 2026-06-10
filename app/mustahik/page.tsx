"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Filter,
  Download,
  Phone,
  CheckCircle,
  X,
  Users2,
  Gift
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { getMustahik, addMustahik, updateMustahik, deleteMustahik } from "@/lib/actions";

export default function MustahikPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mustahikList, setMustahikList] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const asnafCategories = [
    "Fakir",
    "Miskin",
    "Amil",
    "Muallaf",
    "Riqab",
    "Gharim",
    "Fisabilillah",
    "Ibnu Sabil"
  ];

  const [formData, setFormData] = useState({
    name: "",
    category: "Fakir",
    address: "",
    phone: ""
  });

  const fetchData = async () => {
    setLoading(true);
    const data = await getMustahik();
    setMustahikList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let result;
    if (isEdit && selectedId) {
      result = await updateMustahik(selectedId, formData);
    } else {
      result = await addMustahik(formData);
    }

    if (result.success) {
      setShowAddModal(false);
      setShowToast(true);
      fetchData();
      resetForm();
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleEdit = (m: any) => {
    setFormData({
      name: m.name,
      category: m.category || "Fakir",
      address: m.address || "",
      phone: m.phone || ""
    });
    setSelectedId(m.id);
    setIsEdit(true);
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data Mustahik ini?")) {
      const result = await deleteMustahik(id);
      if (result.success) {
        fetchData();
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", category: "Fakir", address: "", phone: "" });
    setIsEdit(false);
    setSelectedId(null);
  };

  const filteredMustahik = mustahikList.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone?.includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Data Mustahik</h2>
            <p className="text-emerald-600/70">Kelola daftar penerima manfaat dan bantuan zakat.</p>
          </div>
          <button 
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Tambah Mustahik
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <input 
              type="text" 
              placeholder="Cari nama, asnaf, atau no. hp..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-emerald-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
             <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 flex items-center gap-2">
                <Users2 className="w-4 h-4" />
                {mustahikList.length} Terdaftar
             </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-emerald-50/50 text-emerald-800 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Penerima Manfaat</th>
                  <th className="px-6 py-4 font-bold">Kategori Asnaf</th>
                  <th className="px-6 py-4 font-bold">No. HP</th>
                  <th className="px-6 py-4 font-bold">Alamat</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {filteredMustahik.map((m) => (
                  <tr key={m.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-900">{m.name}</p>
                          <p className="text-[10px] text-emerald-500 font-medium">Terdaftar: {new Date(m.createdAt).toLocaleDateString("id-ID")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider",
                        "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      )}>
                        {m.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-emerald-700">
                        <Phone className="w-3 h-3" />
                        {m.phone || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-emerald-800 line-clamp-1 max-w-[200px]">{m.address || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          href={`/distributions?mustahikId=${m.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase hover:bg-rose-100 transition-all"
                        >
                          <Gift className="w-3 h-3" />
                          Beri Bantuan
                        </Link>
                        <button onClick={() => handleEdit(m)} className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(m.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-emerald-50 flex justify-between items-center bg-amber-50/20">
              <h3 className="text-xl font-bold text-emerald-900">{isEdit ? "Edit Data Mustahik" : "Tambah Mustahik Baru"}</h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-white rounded-full text-emerald-400"><X className="w-5 h-5" /></button>
            </div>
            
            <form className="p-8 space-y-5" onSubmit={handleSave}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-900 uppercase">Nama Lengkap / Lembaga</label>
                <input type="text" required placeholder="Contoh: Ahmad Fauzi / Panti Asuhan..." className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-900 uppercase">Kategori Asnaf</label>
                <select className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 outline-none" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  {asnafCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-900 uppercase">No. Handphone (Opsional)</label>
                <input type="tel" placeholder="0812..." className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 outline-none" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-900 uppercase">Alamat Lengkap</label>
                <textarea rows={3} placeholder="Masukkan alamat lengkap..." className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 outline-none resize-none" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="flex-1 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-600/20">{isEdit ? "Update Data" : "Simpan Data"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: 50, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 20, x: "-50%" }} className="fixed bottom-8 left-1/2 z-[200] flex items-center gap-4 px-6 py-4 bg-amber-900 text-white rounded-[2rem] shadow-2xl">
            <CheckCircle className="w-6 h-6 text-amber-400" />
            <p className="text-sm font-black">Data Mustahik Berhasil Disimpan!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
