"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Target,
  Lightbulb,
  Edit2,
  Camera,
  X
} from "lucide-react";
import { updateOrganizationProfile } from "@/lib/actions";
import Toast from "@/components/ui/Toast";

export default function ProfileClient({ initialProfile }: { initialProfile: any }) {
  const [profile, setProfile] = useState(initialProfile);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as any });

  const triggerToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast({ show: true, message, type });
  };

  // Helper to parse mission from JSON string
  const getMissions = (missionString: string) => {
    try {
      return JSON.parse(missionString || "[]");
    } catch {
      return [missionString];
    }
  };

  const missions = getMissions(profile.mission);

  const [formData, setFormData] = useState({
    name: profile.name || "",
    subtitle: profile.subtitle || "",
    address: profile.address || "",
    phone: profile.phone || "",
    email: profile.email || "",
    website: profile.website || "",
    verification: profile.verification || "",
    vision: profile.vision || "",
    missionText: missions.join("\n")
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(profile.logoBase64 || null);
  const [logoBase64, setLogoBase64] = useState<string | null>(profile.logoBase64 || null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      triggerToast("Ukuran gambar terlalu besar. Maksimal 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setLogoBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const missionArray = formData.missionText.split("\n").filter((m: string) => m.trim() !== "");
    const updatedData = {
      ...formData,
      mission: JSON.stringify(missionArray),
      logoBase64: logoBase64 || profile.logoBase64 || null,
    };

    const res = await updateOrganizationProfile(profile.id, updatedData);
    if (res.success) {
      setProfile({ ...res.data, logoBase64: logoBase64 || res.data.logoBase64 });
      setShowEditModal(false);
      triggerToast("Profil lembaga berhasil disimpan!");
    } else {
      triggerToast(res.error || "Gagal memperbarui profil lembaga.", "error");
    }
    setIsSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Profil Lembaga</h2>
            <p className="text-emerald-600/70">Informasi detail mengenai lembaga amil zakat.</p>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profil
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm flex flex-col items-center text-center">
              <div className="relative group">
                <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                  {profile.logoBase64 ? (
                    <img src={profile.logoBase64} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-16 h-16 text-emerald-600" />
                  )}
                </div>
                <button
                  onClick={() => triggerToast("Fitur unggah berkas logo tersambung otomatis saat Anda mengklik gambar ini.", "info")}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full border-2 border-white shadow-lg hover:bg-primary/90 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h3 className="mt-6 text-xl font-bold text-emerald-900">{profile.name}</h3>
              <p className="text-sm font-medium text-emerald-500">{profile.subtitle}</p>

              <div className="mt-8 w-full space-y-4">
                <InfoItem icon={MapPin} text={profile.address || "-"} />
                <InfoItem icon={Phone} text={profile.phone || "-"} />
                <InfoItem icon={Mail} text={profile.email || "-"} />
                <InfoItem icon={Globe} text={profile.website || "-"} />
              </div>
            </div>

            <div className="bg-emerald-600 p-8 rounded-3xl text-white space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Target className="w-24 h-24" />
              </div>
              <h4 className="text-lg font-bold">Status Verifikasi</h4>
              <p className="text-sm text-emerald-50 text-emerald-100/80 leading-relaxed">
                Lembaga ini telah terdaftar dan terverifikasi oleh instansi terkait sebagai Lembaga Amil Zakat resmi.
              </p>
              <div className="pt-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">{profile.verification || "Belum Terverifikasi"}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm space-y-8">
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Visi Lembaga
                </h4>
                <p className="text-emerald-700/80 leading-relaxed">
                  {profile.vision || "Belum ada visi yang ditetapkan."}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Misi Lembaga
                </h4>
                <ul className="space-y-3">
                  {missions.length > 0 ? missions.map((misi: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-emerald-700/80">
                      <div className="mt-1.5 w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                      <span className="text-sm">{misi}</span>
                    </li>
                  )) : (
                    <p className="text-sm text-emerald-500">Belum ada misi yang ditetapkan.</p>
                  )}
                </ul>
              </div>
            </div>

            {/* Organisasi Dummy Section */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm opacity-50 grayscale">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-widest">Struktur Organisasi (Coming Soon)</h4>
              </div>
              <p className="text-xs text-emerald-600">Pengaturan pengurus organisasi belum diaktifkan.</p>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/20">
              <h3 className="text-xl font-bold text-emerald-900">Edit Profil Lembaga</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white rounded-full text-emerald-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar" onSubmit={handleSave}>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900 uppercase">Nama Lembaga</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900 uppercase">Slogan / Subtitle</label>
                  <input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-900 uppercase">Alamat Lengkap</label>
                <textarea rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-primary/20 resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900 uppercase">Nomor Telepon</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900 uppercase">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900 uppercase">Website</label>
                  <input type="text" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-900 uppercase">Visi Lembaga</label>
                <textarea rows={3} value={formData.vision} onChange={(e) => setFormData({ ...formData, vision: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-primary/20 resize-none"></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-900 uppercase">Misi Lembaga (Satu baris per misi)</label>
                <textarea rows={5} value={formData.missionText} onChange={(e) => setFormData({ ...formData, missionText: e.target.value })} placeholder="Misi pertama...&#10;Misi kedua..." className="w-full px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold hover:bg-emerald-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-70"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Profil"}
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

function InfoItem({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3 text-emerald-700">
      <div className="p-2 bg-emerald-50 rounded-lg">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
