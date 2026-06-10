"use client";

import { useState, useEffect, Suspense } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Plus, 
  Trash2, 
  Filter,
  Download,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  X,
  UserCheck,
  Camera,
  Image as ImageIcon
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { getDistributions, addDistribution, deleteDistribution, getMustahik } from "@/lib/actions";

export default function DistributionsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-emerald-600 font-bold">
        Memuat Penyaluran Dana...
      </div>
    }>
      <DistributionsContent />
    </Suspense>
  );
}

function DistributionsContent() {
  const searchParams = useSearchParams();
  const preselectedMustahikId = searchParams.get("mustahikId");

  const [searchTerm, setSearchTerm] = useState("");
  const [distributionList, setDistributionList] = useState<any[]>([]);
  const [mustahikList, setMustahikList] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    mustahikId: "",
    mustahikName: "",
    amount: 0,
    category: "Fakir",
    description: "",
    proofImage: ""
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setFormData({ ...formData, proofImage: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

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

  const fetchData = async () => {
    setLoading(true);
    const [dData, mData] = await Promise.all([getDistributions(), getMustahik()]);
    setDistributionList(dData);
    setMustahikList(mData);
    
    // Handle preselected mustahik from query params
    if (preselectedMustahikId && mData.length > 0) {
      const m = mData.find((x: any) => x.id.toString() === preselectedMustahikId);
      if (m) {
        setFormData(prev => ({ 
          ...prev, 
          mustahikId: preselectedMustahikId, 
          mustahikName: m.name,
          category: m.category 
        }));
        setShowAddModal(true);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addDistribution({
      ...formData,
      amount: parseFloat(formData.amount.toString()),
      mustahikId: formData.mustahikId ? formData.mustahikId : undefined
    });

    if (result.success) {
      setShowAddModal(false);
      setShowToast(true);
      fetchData();
      resetForm();
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data penyaluran ini?")) {
      const result = await deleteDistribution(id);
      if (result.success) {
        fetchData();
      }
    }
  };

  const resetForm = () => {
    setFormData({ mustahikId: "", mustahikName: "", amount: 0, category: "Fakir", description: "", proofImage: "" });
    setPreviewImage(null);
  };

  const filteredDistributions = distributionList.filter(d => 
    d.mustahikName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Penyaluran Dana</h2>
            <p className="text-emerald-600/70">Catat dan kelola distribusi zakat kepada Mustahik.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Catat Penyaluran
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <input 
              type="text" 
              placeholder="Cari penerima atau kategori..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-emerald-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
             <div className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Total Keluar: {formatCurrency(distributionList.reduce((acc, curr) => acc + curr.amount, 0))}
             </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-emerald-50/50 text-emerald-800 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Penerima & Tanggal</th>
                  <th className="px-6 py-4 font-bold">Asnaf</th>
                  <th className="px-6 py-4 font-bold">Nominal</th>
                  <th className="px-6 py-4 font-bold">Keterangan</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {filteredDistributions.map((d) => (
                  <tr key={d.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-emerald-900">{d.mustahikName}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(d.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg uppercase">
                        {d.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-rose-600">-{formatCurrency(d.amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         {d.proofImage && (
                           <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center overflow-hidden border border-emerald-200 cursor-zoom-in" onClick={() => window.open(d.proofImage, "_blank")}>
                              <img src={d.proofImage} alt="Bukti" className="w-full h-full object-cover" />
                           </div>
                         )}
                         <p className="text-xs text-emerald-800 line-clamp-1 max-w-[200px]">{d.description || "-"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button onClick={() => handleDelete(d.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
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
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-5 border-b border-rose-50 flex justify-between items-center bg-rose-50/20">
              <h3 className="text-lg font-bold text-emerald-900">Catat Penyaluran</h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-white rounded-full text-rose-400"><X className="w-5 h-5" /></button>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleSave}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider pl-1">Pilih Mustahik (Database)</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 outline-none text-sm font-medium"
                  value={formData.mustahikId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    const m = mustahikList.find(x => x.id.toString() === mId);
                    setFormData({ 
                      ...formData, 
                      mustahikId: mId, 
                      mustahikName: m ? m.name : "",
                      category: m ? m.category : formData.category
                    });
                  }}
                >
                  <option value="">-- Input Manual Saja --</option>
                  {mustahikList.map(m => <option key={m.id} value={m.id}>{m.name} ({m.category})</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider pl-1">Nama Penerima</label>
                <input 
                  type="text" 
                  required 
                  disabled={!!formData.mustahikId}
                  placeholder="Contoh: Bpk. Ahmad / Warga RT 01..." 
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium",
                    formData.mustahikId ? "bg-emerald-100/50 border-emerald-200 text-emerald-600 cursor-not-allowed" : "bg-emerald-50 border-emerald-100"
                  )} 
                  value={formData.mustahikName} 
                  onChange={(e) => setFormData({ ...formData, mustahikName: e.target.value })} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider pl-1">Nominal (Rp)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 outline-none font-black text-rose-600 text-sm" 
                    value={formData.amount === 0 ? "" : formData.amount.toLocaleString("id-ID")} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\./g, "");
                      const num = parseInt(val) || 0;
                      setFormData({ ...formData, amount: num });
                    }} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider pl-1">Asnaf</label>
                  <select 
                    disabled={!!formData.mustahikId}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-medium",
                      formData.mustahikId ? "bg-emerald-100/50 border-emerald-200 text-emerald-600 cursor-not-allowed" : "bg-emerald-50 border-emerald-100"
                    )}
                    value={formData.category} 
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {asnafCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider pl-1">Keterangan</label>
                <textarea rows={2} placeholder="Catatan penyaluran..." className="w-full px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 outline-none resize-none text-sm" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider pl-1">Bukti Foto</label>
                <div className="flex gap-3 items-center p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div 
                    onClick={() => document.getElementById("photo-upload")?.click()}
                    className="w-14 h-14 rounded-xl bg-white border border-emerald-200 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 transition-all overflow-hidden flex-shrink-0"
                  >
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-emerald-700">Lampirkan Dokumentasi</p>
                    <p className="text-[8px] text-emerald-500 uppercase font-black">Maksimal 2MB</p>
                  </div>
                </div>
                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="flex-1 py-3 text-emerald-600 font-bold text-sm">Batal</button>
                <button type="submit" className="flex-[2] py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 text-sm">
                  <ArrowUpRight className="w-4 h-4" />
                  Simpan Penyaluran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: 50, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 20, x: "-50%" }} className="fixed bottom-8 left-1/2 z-[200] flex items-center gap-4 px-6 py-4 bg-rose-900 text-white rounded-[2rem] shadow-2xl">
            <ShieldCheck className="w-6 h-6 text-rose-400" />
            <p className="text-sm font-black">Dana Berhasil Disalurkan!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
