"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  ShieldCheck, 
  HandHeart, 
  BookOpen, 
  HeartHandshake,
  Coins,
  Briefcase,
  Users,
  Wheat,
  Info,
  Plus,
  Edit2,
  Trash2,
  X,
  RefreshCcw,
  Check,
  Search,
  Building2,
  LayoutGrid,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Toast from "@/components/ui/Toast";
import { getZakatTypes, addZakatType, updateZakatType, deleteZakatType } from "@/lib/actions";

const iconMap: Record<string, any> = {
  Coins,
  Briefcase,
  Users,
  Wheat,
  HandHeart,
  BookOpen,
  HeartHandshake
};

const colorPresets = [
  { name: "Emerald", value: "emerald", bg: "bg-emerald-50 text-emerald-600 border-emerald-100", activeBg: "bg-emerald-600 text-white" },
  { name: "Blue", value: "blue", bg: "bg-blue-50 text-blue-600 border-blue-100", activeBg: "bg-blue-600 text-white" },
  { name: "Amber", value: "amber", bg: "bg-amber-50 text-amber-600 border-amber-100", activeBg: "bg-amber-600 text-white" },
  { name: "Orange", value: "orange", bg: "bg-orange-50 text-orange-600 border-orange-100", activeBg: "bg-orange-600 text-white" },
  { name: "Rose", value: "rose", bg: "bg-rose-50 text-rose-600 border-rose-100", activeBg: "bg-rose-600 text-white" },
  { name: "Violet", value: "violet", bg: "bg-violet-50 text-violet-600 border-violet-100", activeBg: "bg-violet-600 text-white" }
];

const iconPresets = [
  { name: "Coins", component: Coins },
  { name: "Briefcase", component: Briefcase },
  { name: "Users", component: Users },
  { name: "Wheat", component: Wheat },
  { name: "HandHeart", component: HandHeart },
  { name: "BookOpen", component: BookOpen },
  { name: "HeartHandshake", component: HeartHandshake }
];

export default function ProgramLembagaPage() {
  const [dbTypes, setDbTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as any });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const triggerToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast({ show: true, message, type });
  };

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    percentage: "",
    status: "Active",
    icon: "HeartHandshake",
    color: "emerald"
  });

  const fetchDbTypes = async () => {
    setLoading(true);
    const data = await getZakatTypes();
    setDbTypes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDbTypes();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    let res;
    if (isEdit && selectedId) {
      res = await updateZakatType(selectedId, formData);
    } else {
      res = await addZakatType(formData);
    }

    if (res.success) {
      setShowAddModal(false);
      resetForm();
      fetchDbTypes();
      triggerToast(isEdit ? "Program berhasil diperbarui!" : "Program baru berhasil ditambahkan!");
    } else {
      triggerToast(res.error || "Gagal menyimpan program.", "error");
    }
  };

  const handleEdit = (type: any) => {
    setFormData({
      name: type.name,
      description: type.description || "",
      percentage: type.percentage || "",
      status: type.status,
      icon: type.icon || "HeartHandshake",
      color: type.color || "emerald"
    });
    setSelectedId(type.id);
    setIsEdit(true);
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus program ini?")) {
      const res = await deleteZakatType(id);
      if (res.success) {
        fetchDbTypes();
        triggerToast("Program berhasil dihapus!");
      } else {
        triggerToast(res.error || "Gagal menghapus program.", "error");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      percentage: "",
      status: "Active",
      icon: "HeartHandshake",
      color: "emerald"
    });
    setIsEdit(false);
    setSelectedId(null);
  };

  const filteredTypes = dbTypes.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = dbTypes.filter(t => t.status === "Active").length;
  const inactiveCount = dbTypes.filter(t => t.status === "Inactive").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Program Lembaga</h2>
            <p className="text-emerald-600/70">Kelola program zakat, sedekah, dan sosial khusus lembaga Anda.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Program
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-emerald-100 p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-900">{dbTypes.length}</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Total Program</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-900">{activeCount}</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Program Aktif</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <X className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-900">{inactiveCount}</p>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Nonaktif</p>
            </div>
          </div>
        </div>

        {/* Search & View Toggle */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <input 
              type="text" 
              placeholder="Cari program..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-emerald-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "grid" ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-500 hover:text-emerald-700"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "list" ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-500 hover:text-emerald-700"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100 flex gap-4">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-emerald-900">Tentang Program Lembaga</p>
            <p className="text-xs text-emerald-700/80 leading-relaxed">
              Tambahkan kategori zakat/sedekah kustom atau program donasi insidentil khusus yayasan Anda. Program yang ditambahkan di sini akan tercatat secara dinamis di database dan dapat digunakan sebagai referensi kategori transaksi.
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-emerald-600">
            <RefreshCcw className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-bold">Memuat data program...</p>
          </div>
        ) : filteredTypes.length === 0 && searchTerm ? (
          <div className="py-16 text-center bg-white border border-dashed border-emerald-200 rounded-3xl">
            <Search className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-emerald-900">Tidak ada program yang cocok</p>
            <p className="text-xs text-emerald-500 mt-1">Coba ubah kata kunci pencarian Anda.</p>
          </div>
        ) : dbTypes.length === 0 ? (
          <div className="py-16 text-center bg-white border border-dashed border-emerald-200 rounded-3xl">
            <HeartHandshake className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-emerald-900">Belum ada program</p>
            <p className="text-xs text-emerald-500 mt-1 mb-4">Tambahkan program zakat atau sosial lembaga Anda sekarang.</p>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/95 text-xs transition-all"
            >
              Tambah Program Pertama
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTypes.map((type, index) => {
              const SelectedIcon = iconMap[type.icon] || HeartHandshake;
              const isInactive = type.status === "Inactive";
              return (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "bg-white p-6 rounded-3xl border shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col relative overflow-hidden group",
                    isInactive ? "opacity-60 border-gray-200" : "border-emerald-100"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className={cn(
                      "p-4 rounded-2xl border",
                      type.color === "emerald" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      type.color === "blue" ? "bg-blue-50 text-blue-600 border-blue-100" :
                      type.color === "amber" ? "bg-amber-50 text-amber-600 border-amber-100" :
                      type.color === "orange" ? "bg-orange-50 text-orange-600 border-orange-100" :
                      type.color === "rose" ? "bg-rose-50 text-rose-600 border-rose-100" :
                      "bg-violet-50 text-violet-600 border-violet-100"
                    )}>
                      <SelectedIcon className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        isInactive ? "bg-gray-100 text-gray-500" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {isInactive ? "Nonaktif" : "Aktif"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-emerald-900">{type.name}</h3>
                    {type.description && (
                      <p className="text-sm text-emerald-600/70 mt-2 leading-relaxed line-clamp-3">
                        {type.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-6 border-t border-emerald-50 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Rate / Kadar</p>
                      <p className="text-lg font-black text-emerald-900 mt-1">{type.percentage || "Sukarela"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(type)}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-emerald-50/50 text-emerald-800 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Program</th>
                    <th className="px-6 py-4 font-bold">Deskripsi</th>
                    <th className="px-6 py-4 font-bold">Rate</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filteredTypes.map((type) => {
                    const SelectedIcon = iconMap[type.icon] || HeartHandshake;
                    const isInactive = type.status === "Inactive";
                    return (
                      <tr key={type.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-xl",
                              type.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                              type.color === "blue" ? "bg-blue-50 text-blue-600" :
                              type.color === "amber" ? "bg-amber-50 text-amber-600" :
                              type.color === "orange" ? "bg-orange-50 text-orange-600" :
                              type.color === "rose" ? "bg-rose-50 text-rose-600" :
                              "bg-violet-50 text-violet-600"
                            )}>
                              <SelectedIcon className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-bold text-emerald-900">{type.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-emerald-700 line-clamp-2 max-w-[250px]">{type.description || "-"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-emerald-900">{type.percentage || "Sukarela"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                            isInactive ? "bg-gray-100 text-gray-500" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {isInactive ? "Nonaktif" : "Aktif"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleEdit(type)} className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(type.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{isEdit ? "Edit Program" : "Tambah Program Baru"}</h3>
                <p className="text-emerald-100 text-xs">Kelola kategori atau program sosial khusus lembaga.</p>
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

            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900 uppercase">Nama Program / Kategori</label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Zakat Pertanian, Sedekah Anak Yatim"
                    className="w-full px-4 py-3 rounded-xl bg-emerald-50 border-none outline-none text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-primary/20"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900 uppercase">Deskripsi</label>
                  <textarea
                    rows={3}
                    placeholder="Jelaskan mengenai ketentuan atau sasaran program..."
                    className="w-full px-4 py-3 rounded-xl bg-emerald-50 border-none outline-none text-sm font-medium text-emerald-900 resize-none focus:ring-2 focus:ring-primary/20"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-900 uppercase">Rate / Persentase Kadar</label>
                    <input
                      type="text"
                      placeholder="Contoh: 2.5%, 5%, Sukarela"
                      className="w-full px-4 py-3 rounded-xl bg-emerald-50 border-none outline-none text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-primary/20"
                      value={formData.percentage}
                      onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-900 uppercase">Status</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-emerald-50 border-none outline-none text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-primary/20"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Aktif</option>
                      <option value="Inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>

                {/* Preset Color Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900 uppercase">Pilih Warna Tema Kartu</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: preset.value })}
                        className={cn(
                          "px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all text-center",
                          formData.color === preset.value
                            ? preset.activeBg
                            : preset.bg
                        )}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Icon Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900 uppercase">Pilih Ikon</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {iconPresets.map((preset) => {
                      const IconComponent = preset.component;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: preset.name })}
                          className={cn(
                            "p-3 rounded-xl border flex justify-center items-center transition-all",
                            formData.icon === preset.name
                              ? "bg-primary text-white border-primary"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                          )}
                          title={preset.name}
                        >
                          <IconComponent className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-3.5 bg-emerald-50 text-emerald-700 rounded-2xl font-bold hover:bg-emerald-100 transition-all text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3.5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-sm"
                >
                  {isEdit ? "Simpan Perubahan" : "Tambah Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </DashboardLayout>
  );
}
