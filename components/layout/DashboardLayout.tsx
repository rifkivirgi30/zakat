"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import PageTransition from "./PageTransition";
import { getSession, logoutUser } from "@/lib/actions";

// Pages accessible ONLY by amil (admin)
const AMIL_ONLY_PAGES = [
  "/dashboard",
  "/muzakki",
  "/mustahik",
  "/transactions",
  "/distributions",
  "/zakat-types",
  "/reports",
  "/profile",
];

// Pages accessible ONLY by muzakki
const MUZAKKI_ONLY_PAGES = ["/muzakki-dashboard"];

// Pages accessible by anyone (including guests)
const PUBLIC_PAGES = ["/calculator"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function checkAndSyncSession() {
      let isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
      let userRole = sessionStorage.getItem("userRole");

      // 1. Cek kedaluwarsa sesi (jika tab ditutup > 15 menit)
      if (isLoggedIn) {
        const lastActiveStr = localStorage.getItem("sessionLastActive");
        if (lastActiveStr) {
          const lastActive = parseInt(lastActiveStr);
          const diffMs = Date.now() - lastActive;
          const fifteenMinutesMs = 15 * 60 * 1000;

          if (diffMs > fifteenMinutesMs) {
            // Sesi kedaluwarsa! Lakukan logout paksa secara aman
            await logoutUser();
            sessionStorage.clear();
            localStorage.removeItem("sessionLastActive");
            router.replace("/login");
            return;
          }
        }
        // Update waktu aktif terakhir
        localStorage.setItem("sessionLastActive", Date.now().toString());
      }

      // Jika sessionStorage kosong, sinkronisasikan dengan session cookie aktif di server
      if (!isLoggedIn) {
        const session = await getSession();
        if (session) {
          // Periksa waktu aktif terakhir sebelum menyinkronkan
          const lastActiveStr = localStorage.getItem("sessionLastActive");
          if (lastActiveStr) {
            const lastActive = parseInt(lastActiveStr);
            const diffMs = Date.now() - lastActive;
            const fifteenMinutesMs = 15 * 60 * 1000;

            if (diffMs > fifteenMinutesMs) {
              await logoutUser();
              localStorage.removeItem("sessionLastActive");
              router.replace("/login");
              return;
            }
          }

          sessionStorage.setItem("isLoggedIn", "true");
          sessionStorage.setItem("userRole", session.role);
          if (session.role === "amil") {
            sessionStorage.setItem("adminName", session.name || "Amil Petugas");
          } else {
            sessionStorage.setItem("muzakkiId", session.userId.toString());
            sessionStorage.setItem("muzakkiName", session.name);
            sessionStorage.setItem("muzakkiPhone", session.phone || "");
          }
          localStorage.setItem("sessionLastActive", Date.now().toString());
          // Refresh halaman sekali untuk memperbarui Sidebar, Navbar, dan Konten secara sinkron
          window.location.reload();
          return;
        }
      }

      // Baca ulang status setelah kemungkinan sinkronisasi
      isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
      userRole = sessionStorage.getItem("userRole");

      const isAmilPage = AMIL_ONLY_PAGES.some(page => pathname.startsWith(page));
      const isMuzakkiPage = MUZAKKI_ONLY_PAGES.some(page => pathname.startsWith(page));

      if (isAmilPage) {
        if (!isLoggedIn || userRole !== "amil") {
          router.replace("/login");
        }
      } else if (isMuzakkiPage) {
        if (!isLoggedIn || userRole !== "muzakki") {
          router.replace("/login");
        }
      } else {
        const isPublic = PUBLIC_PAGES.includes(pathname);
        if (!isPublic && !isLoggedIn) {
          router.replace("/login");
        }
      }
    }

    checkAndSyncSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 2. Event listener untuk selalu memperbarui status keaktifan pengguna saat tab sedang terbuka
  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;

    const updateActivity = () => {
      // Throttle agar tidak menulis ke localStorage terlalu sering (hanya sekali setiap 10 detik)
      if (throttleTimeout) return;

      const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
      if (isLoggedIn) {
        localStorage.setItem("sessionLastActive", Date.now().toString());
      }

      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
      }, 10000); // 10 detik throttle
    };

    // Dengarkan aktivitas interaksi pengguna di layar
    window.addEventListener("mousedown", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("scroll", updateActivity);
    window.addEventListener("click", updateActivity);

    // Set waktu aktif pertama kali saat mount
    updateActivity();

    return () => {
      window.removeEventListener("mousedown", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("scroll", updateActivity);
      window.removeEventListener("click", updateActivity);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-4 md:p-8">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
