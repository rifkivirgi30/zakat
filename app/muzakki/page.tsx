"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Filter,
  Download,
  Phone,
  CheckCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { initialMuzakki } from "@/lib/data";

import { getMuzakki, addMuzakki, updateMuzakki, deleteMuzakki } from "@/lib/actions";
import { initialMuzakki as mockMuzakki } from "@/lib/data";

export default function MuzakkiPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [muzakkiList, setMuzakkiList] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    gender: "Laki-laki",
    address: "",
    phone: "",
    job: ""
  });

  const fetchData = async () => {
    setLoading(true);
    const data = await getMuzakki();
    setMuzakkiList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let result;
    if (isEdit && selectedId) {
      result = await updateMuzakki(selectedId, formData);
    } else {
      result = await addMuzakki(formData);
    }

    if (result.success) {
      setShowAddModal(false);
      setShowToast(true);
      fetchData();
      resetForm();
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleEdit = (muzakki: any) => {
    setFormData({
      name: muzakki.name,
      gender: muzakki.gender || "Laki-laki",
      address: muzakki.address || "",
      phone: muzakki.phone || "",
      job: muzakki.job || ""
    });
    setSelectedId(muzakki.id);
    setIsEdit(true);
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      const result = await deleteMuzakki(id);
      if (result.success) {
        fetchData();
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", gender: "Laki-laki", address: "", phone: "", job: "" });
    setIsEdit(false);
    setSelectedId(null);
  };

  const filteredMuzakki = muzakkiList.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Data Muzakki</h2>
            <p className="text-emerald-600/70">Kelola informasi donatur dan wajib zakat.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-5 h-5" />
            Tambah Muzakki
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <input
              type="text"
              placeholder="Cari nama atau no. hp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-emerald-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-emerald-50/50 text-emerald-800 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Nama Lengkap</th>
                  <th className="px-6 py-4 font-bold">Kontak</th>
                  <th className="px-6 py-4 font-bold">Alamat</th>
                  <th className="px-6 py-4 font-bold">Pekerjaan</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {filteredMuzakki.map((m) => (
                  <tr key={m.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-900">{m.name}</p>
                          <p className="text-[10px] text-emerald-500 font-medium">{m.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-emerald-700">
                        <Phone className="w-3 h-3" />
                        {m.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-emerald-800 line-clamp-1 max-w-[200px]">{m.address}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        {m.job}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(m)}
                          className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMuzakki.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-emerald-400">
                        <Search className="w-8 h-8 opacity-20" />
                        <p className="text-sm font-medium">Muzakki tidak ditemukan</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-emerald-50 flex items-center justify-between bg-emerald-50/20">
            <p className="text-xs text-emerald-600 font-medium">
              Menampilkan <span className="font-bold">1</span> sampai <span className="font-bold">{filteredMuzakki.length}</span> dari <span className="font-bold">{muzakkiList.length}</span> data
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-bold text-emerald-400 bg-white border border-emerald-100 rounded-lg cursor-not-allowed">Previous</button>
              <button className="px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg shadow-sm">1</button>
              <button className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-white border border-emerald-100 rounded-lg hover:bg-emerald-50">Next</button>
            </div>
          </div>
        </div>
      </div>
      {/* Modal Tambah Muzakki */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/20">
              <h3 className="text-xl font-bold text-emerald-900">{isEdit ? "Edit Data Muzakki" : "Tambah Muzakki Baru"}</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-white rounded-full text-emerald-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="p-8 space-y-5" onSubmit={handleSave}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-900 uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama muzakki..."
                  className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900 uppercase">Jenis Kelamin</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 outline-none"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900 uppercase">Pekerjaan</label>
                  <input
                    type="text"
                    placeholder="Contoh: PNS"
                    className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.job}
                    onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-900 uppercase">No. Handphone</label>
                <input
                  type="tel"
                  placeholder="0812..."
                  className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-900 uppercase">Alamat Lengkap</label>
                <textarea
                  rows={3}
                  placeholder="Masukkan alamat lengkap..."
                  className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  {isEdit ? "Update Data" : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-[200] flex items-center gap-4 px-6 py-4 bg-emerald-900 text-white rounded-[2rem] shadow-2xl min-w-[320px] border border-emerald-700/50 backdrop-blur-md"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-white">Berhasil Disimpan!</p>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-0.5">Data Muzakki Terupdate</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
