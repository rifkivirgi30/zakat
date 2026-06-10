import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  ShieldCheck,
  Heart,
  Coins,
  HandHeart,
  Users,
} from "lucide-react";

import { getOrganizationProfile, getPublicStats } from "@/lib/actions";

export default async function Home() {
  const profile = await getOrganizationProfile();
  const stats = await getPublicStats();

  // Parse missions safely
  let missions: string[] = [];
  try {
    missions = JSON.parse(profile.mission || "[]");
  } catch {
    missions = profile.mission ? [profile.mission] : [];
  }

  return (
    <div className="relative bg-[#f8fafc] overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full islamic-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-3xl opacity-50" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 border-b border-emerald-100/50">
        <nav className="flex items-center justify-between px-6 py-5 mx-auto max-w-7xl">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-10 h-10 shadow-lg bg-emerald-600 rounded-xl shadow-emerald-600/20">
              <span className="text-xl font-bold text-white italic">L</span>
            </div>

            <span className="text-xl font-black tracking-tight text-emerald-900">
              {profile.name}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              Fitur
            </a>

            <a
              href="#about"
              className="text-sm font-bold text-emerald-900 transition-colors"
            >
              Tentang Kami
            </a>

            <Link
              href="/login"
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all hover:scale-105"
            >
              Masuk Dashboard
            </Link>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-col items-center px-6 pt-24 pb-20 mx-auto max-w-7xl text-center">
        {/* Hero Section */}
        <section className="w-full flex flex-col items-center min-h-[85vh] justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border rounded-full bg-emerald-50 border-emerald-100 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />

            <span className="text-xs font-black uppercase tracking-widest">
              Platform Zakat Digital Terpercaya
            </span>
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl text-emerald-900 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Sucikan Harta Anda dengan{" "}
            <span className="text-emerald-600 italic">Zakat</span> Digital yang
            Aman
          </h1>

          <p className="max-w-2xl mx-auto mt-8 text-lg font-medium leading-relaxed md:text-xl text-emerald-700/70 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            Platform modern untuk perhitungan dan penyaluran zakat secara
            transparan. Mudah, cepat, dan sesuai syariat untuk kemaslahatan
            ummah.
          </p>

          <div className="flex items-center mt-12 animate-in fade-in slide-in-from-bottom-16 duration-1000">
            <Link
              href="/calculator"
              className="group flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all hover:-translate-y-1"
            >
              <Calculator className="w-6 h-6" />

              Hitung Zakat Sekarang

              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Transparency Stats Section */}
        <section className="w-full py-20 border-t border-emerald-100 bg-gradient-to-b from-white to-emerald-50/20 scroll-mt-28">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full">
                Laporan &amp; Akuntabilitas
              </span>

              <h2 className="text-3xl md:text-4xl font-black text-emerald-900 mt-6">
                Transparansi Keuangan Real-Time
              </h2>

              <p className="text-emerald-600/70 mt-4 max-w-xl mx-auto">
                Komitmen kami dalam menjaga amanah umat dengan menyajikan data penerimaan dan penyaluran zakat secara terbuka dan akurat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Dana Terkumpul */}
              <div className="group relative bg-white border border-emerald-100 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(16,185,129,0.1)] overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-bl-[4rem] group-hover:scale-110 transition-transform duration-500" />

                <div className="inline-flex p-4 mb-6 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Coins className="w-6 h-6" />
                </div>

                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">
                  Dana Terkumpul
                </p>

                <h3 className="text-3xl font-black text-emerald-900 mt-2 tracking-tight group-hover:text-emerald-700 transition-colors">
                  <span className="text-lg font-bold text-emerald-600 mr-1">Rp</span>
                  {stats.totalZakat.toLocaleString("id-ID")}
                </h3>

                <p className="text-[11px] text-emerald-500/80 mt-6 flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Terbarui otomatis oleh sistem
                </p>
              </div>

              {/* Card 2: Telah Disalurkan */}
              <div className="group relative bg-white border border-emerald-100 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(16,185,129,0.1)] overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-bl-[4rem] group-hover:scale-110 transition-transform duration-500" />

                <div className="inline-flex p-4 mb-6 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <HandHeart className="w-6 h-6" />
                </div>

                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">
                  Telah Disalurkan
                </p>

                <h3 className="text-3xl font-black text-emerald-900 mt-2 tracking-tight group-hover:text-emerald-700 transition-colors">
                  <span className="text-lg font-bold text-emerald-600 mr-1">Rp</span>
                  {stats.totalDistribution.toLocaleString("id-ID")}
                </h3>

                <p className="text-[11px] text-emerald-500/80 mt-6 flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Telah disalurkan ke 8 asnaf
                </p>
              </div>

              {/* Card 3: Muzakki Bergabung */}
              <div className="group relative bg-white border border-emerald-100 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(16,185,129,0.1)] overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-bl-[4rem] group-hover:scale-110 transition-transform duration-500" />

                <div className="inline-flex p-4 mb-6 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Users className="w-6 h-6" />
                </div>

                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">
                  Muzakki Bergabung
                </p>

                <h3 className="text-3xl font-black text-emerald-900 mt-2 tracking-tight group-hover:text-emerald-700 transition-colors">
                  {stats.uniqueMuzakki}
                  <span className="text-lg font-bold text-emerald-600 ml-1.5">Orang</span>
                </h3>

                <p className="text-[11px] text-emerald-500/80 mt-6 flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Muzakki terdaftar aktif
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How to Donate Section */}
        <section className="w-full py-20 bg-white border-t border-emerald-100 scroll-mt-28">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full">
                Petunjuk Pembayaran
              </span>

              <h2 className="text-3xl md:text-4xl font-black text-emerald-900 mt-6">
                3 Langkah Mudah Penyaluran Zakat
              </h2>

              <p className="text-emerald-600/70 mt-4 max-w-xl mx-auto">
                Panduan sederhana untuk menyalurkan zakat, infak, atau sedekah Anda secara online dan amanah.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connector lines (only visible on md screens and up) */}
              <div className="hidden md:block absolute top-[28%] left-[18%] right-[18%] h-0.5 bg-gradient-to-r from-emerald-100 via-emerald-200 to-emerald-100 -z-10" />

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-100 text-emerald-600 font-black text-2xl shadow-lg shadow-emerald-100/50 mb-6">
                  1
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    ✓
                  </div>
                </div>
                <h3 className="text-xl font-bold text-emerald-900">Hitung Kewajiban</h3>
                <p className="text-sm text-emerald-600/70 mt-3 max-w-xs leading-relaxed">
                  Gunakan fitur kalkulator zakat online kami untuk menghitung nominal kewajiban zakat Anda secara akurat sesuai nisab.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-100 text-emerald-600 font-black text-2xl shadow-lg shadow-emerald-100/50 mb-6">
                  2
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    ✓
                  </div>
                </div>
                <h3 className="text-xl font-bold text-emerald-900">Transfer Rekening</h3>
                <p className="text-sm text-emerald-600/70 mt-3 max-w-xs leading-relaxed">
                  Lakukan pembayaran melalui transfer bank ke nomor rekening resmi lembaga zakat kami.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-100 text-emerald-600 font-black text-2xl shadow-lg shadow-emerald-100/50 mb-6">
                  3
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    ✓
                  </div>
                </div>
                <h3 className="text-xl font-bold text-emerald-900">Konfirmasi &amp; Selesai</h3>
                <p className="text-sm text-emerald-600/70 mt-3 max-w-xs leading-relaxed">
                  Unggah bukti transfer langsung di kalkulator (sebagai Tamu), atau masuk ke Dashboard untuk mencatat dan melacak donasi Anda.
                </p>
              </div>
            </div>

            <div className="flex justify-center mt-16">
              <Link
                href="/login"
                className="group flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all hover:scale-105"
              >
                Masuk &amp; Konfirmasi Pembayaran
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="w-full mt-20 pt-32 pb-20 border-t border-emerald-100 scroll-mt-28"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-emerald-900">
              Fitur Unggulan Kami
            </h2>

            <p className="text-emerald-600/70 mt-4 max-w-xl mx-auto">
              Dirancang untuk memudahkan Amil dan Muzakki dalam pengelolaan
              zakat yang transparan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <LandingFeature
              icon={Calculator}
              title="Kalkulator Zakat"
              description="Perhitungan akurat untuk Zakat Maal, Profesi, dan Fitrah sesuai standar nisab terbaru."
            />

            <LandingFeature
              icon={ShieldCheck}
              title="Keamanan Terjamin"
              description="Enkripsi data tingkat tinggi untuk melindungi informasi pribadi dan riwayat transaksi Anda."
            />

            <LandingFeature
              icon={Heart}
              title="Penyaluran Mustahik"
              description="Pantau langsung penyaluran dana ke 8 asnaf yang berhak menerima secara transparan."
            />
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className="w-full pt-32 pb-20 border-t border-emerald-100 scroll-mt-28"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left space-y-6">
              <h2 className="text-3xl md:text-4xl font-black text-emerald-900">
                Tentang {profile.name}
              </h2>

              <p className="text-lg text-emerald-700/70 leading-relaxed">
                {profile.subtitle || "Kami berkomitmen untuk memodernisasi pengelolaan zakat. Kami percaya bahwa transparansi dan kemudahan teknologi dapat meningkatkan kepercayaan Muzakki."}
              </p>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-600" />
                  </div>

                  <p className="text-sm font-bold text-emerald-800 leading-relaxed">
                    Visi: {profile.vision || "Menjadi lembaga pengelola zakat yang transparan dan amanah."}
                  </p>
                </div>

                {missions.length > 0 && (
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                    </div>

                    <div className="text-sm font-bold text-emerald-800 leading-relaxed space-y-2">
                      Misi:
                      <ul className="list-disc pl-4 font-normal mt-1 space-y-1">
                        {missions.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video bg-emerald-900 rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-emerald-600/20 islamic-pattern" />

                <p className="text-emerald-100 font-bold italic z-10 text-xl">
                  Transformasi Zakat Digital
                </p>
              </div>

              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-emerald-300 rounded-full blur-3xl opacity-30" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-12 border-t bg-emerald-900 border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left flex items-center gap-6">
            <div>
              <h3 className="text-white font-black text-xl">
                {profile.name}
              </h3>
              <p className="text-emerald-300/60 text-sm mt-2">
                {profile.subtitle || "Memberdayakan Ummah melalui Zakat Digital."}
              </p>
            </div>

            <div className="hidden md:block h-10 border-l border-emerald-700 px-6">
              <p className="text-emerald-300/80 text-xs">{profile.phone}</p>
              <p className="text-emerald-300/80 text-xs mt-1">{profile.email}</p>
            </div>
          </div>

          <p className="text-emerald-400/40 text-sm font-medium">
            © {new Date().getFullYear()} {profile.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function LandingFeature({
  icon: Icon,
  title,
  description,
}: any) {
  return (
    <div className="p-8 text-left bg-white border border-emerald-100 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-100/50">
      <div className="inline-flex p-3 mb-6 rounded-2xl bg-emerald-50 text-emerald-600">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-xl font-bold text-emerald-900">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-emerald-600/70">
        {description}
      </p>
    </div>
  );
}