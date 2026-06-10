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
  Check
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
  const [activeTab, setActiveTab] = useState<"general" | "custom">("general");
  const [dbTypes, setDbTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as any });

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
      triggerToast(isEdit ? "Jenis zakat berhasil diperbarui!" : "Jenis zakat baru berhasil ditambahkan!");
    } else {
      triggerToast(res.error || "Gagal menyimpan jenis zakat.", "error");
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
    if (confirm("Apakah Anda yakin ingin menghapus kategori program zakat ini?")) {
      const res = await deleteZakatType(id);
      if (res.success) {
        fetchDbTypes();
        triggerToast("Jenis zakat berhasil dihapus!");
      } else {
        triggerToast(res.error || "Gagal menghapus jenis zakat.", "error");
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Jenis & Program Zakat</h2>
            <p className="text-emerald-600/70">Referensi ketentuan syariat dan pengelolaan program khusus amil.</p>
          </div>
          {activeTab === "custom" && (
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
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex bg-emerald-50/50 p-1.5 rounded-2xl w-full sm:w-fit border border-emerald-100">
          <button
            onClick={() => setActiveTab("general")}
            className={cn(
              "flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
              activeTab === "general"
                ? "bg-white text-emerald-800 shadow-md shadow-emerald-900/5"
                : "text-emerald-600 hover:text-emerald-800"
            )}
          >
            Panduan Syariat (Umum)
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={cn(
              "flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
              activeTab === "custom"
                ? "bg-white text-emerald-800 shadow-md shadow-emerald-900/5"
                : "text-emerald-600 hover:text-emerald-800"
            )}
          >
            Program Lembaga (Dinamis)
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "general" ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100 flex gap-4">
              <Info className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-900">Informasi Panduan Syariat</p>
                <p className="text-sm text-emerald-700/80 leading-relaxed">
                  Berikut adalah jenis zakat standar syariat yang berlaku secara umum. Parameter hitungan dan nisab pada bagian ini sudah terintegrasi otomatis di kalkulator zakat platform ini.
                </p>
              </div>
            </div>

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
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100 flex gap-4">
              <Info className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-900">Program Lembaga Kustom</p>
                <p className="text-sm text-emerald-700/80 leading-relaxed">
                  Bagian ini diperuntukkan bagi Amil untuk menambahkan kategori zakat/sedekah kustom atau program donasi insidentil khusus yayasan yang akan tercatat secara dinamis di database.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-emerald-600">
                <RefreshCcw className="w-10 h-10 animate-spin mb-4" />
                <p className="text-sm font-bold">Memuat data program...</p>
              </div>
            ) : dbTypes.length === 0 ? (
              <div className="py-16 text-center bg-white border border-dashed border-emerald-200 rounded-3xl">
                <HeartHandshake className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-emerald-900">Belum ada program khusus</p>
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dbTypes.map((type) => {
                  const SelectedIcon = iconMap[type.icon] || HeartHandshake;
                  const isInactive = type.status === "Inactive";
                  return (
                    <div 
                      key={type.id} 
                      className={cn(
                        "bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col relative overflow-hidden",
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
                          <p className="text-sm text-emerald-600/70 mt-2 leading-relaxed">
                            {type.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto pt-6 border-t border-emerald-50 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Rate / Kadar</p>
                          <p className="text-lg font-black text-emerald-900 mt-1">{type.percentage || "Sukarela"}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{isEdit ? "Edit Program Zakat" : "Tambah Program Baru"}</h3>
                <p className="text-emerald-100 text-xs">Kelola kategori atau program sosial khusus amil.</p>
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
                      placeholder="Contoh: 2.5%, 5%, 10%, Sukarela"
                      className="w-full px-4 py-3 rounded-xl bg-emerald-50 border-none outline-none text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-primary/20"
                      value={formData.percentage}
                      onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-900 uppercase">Status Aktif</label>
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
                  {isEdit ? "Simpan Perubahan" : "Tambah Kategori"}
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
