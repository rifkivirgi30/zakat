"use client";

import { useState, useEffect } from "react";
import { Bell, Menu, User, X, LucideIcon, LogOut } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { getMyTransactions, logoutUser } from "@/lib/actions";

interface MenuItem {
  label: string;
  href: string;
}

const amilMenuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Data Muzakki", href: "/muzakki" },
  { label: "Jenis Zakat", href: "/zakat-types" },
  { label: "Kalkulator Zakat", href: "/calculator" },
  { label: "Transaksi", href: "/transactions" },
  { label: "Penyaluran", href: "/distributions" },
  { label: "Laporan", href: "/reports" },
  { label: "Profil Lembaga", href: "/profile" },
];

const muzakkiMobileMenuItems: MenuItem[] = [
  { label: "Ringkasan", href: "/muzakki-dashboard?tab=overview" },
  { label: "Kalkulator Zakat", href: "/calculator" },
  { label: "Riwayat & BSZ", href: "/muzakki-dashboard?tab=history" },
  { label: "Transparansi", href: "/muzakki-dashboard?tab=transparency" },
  { label: "Pengaturan", href: "/muzakki-dashboard?tab=settings" },
];

export default function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  
  const pathname = usePathname();
  const today = format(new Date(), "EEEE, d MMMM yyyy", { locale: id });

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Sembunyi jika scroll ke bawah (> 20px)
      if (currentScrollY > 20) {
        setIsVisible(false);
      } else {
        // Hanya muncul jika benar-benar di posisi paling atas
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    setUserRole(role);
    if (role === "muzakki") {
      const name = sessionStorage.getItem("muzakkiName");
      if (name) setAdminName(name);
    } else {
      const name = sessionStorage.getItem("adminName");
      if (name) setAdminName(name);
    }

    async function fetchNotifications() {
      const role = sessionStorage.getItem("userRole");
      const mIdStr = sessionStorage.getItem("muzakkiId");
      const mId = mIdStr ? parseInt(mIdStr) : null;
      
      const txs = await getMyTransactions();
      
      if (role === "muzakki" && mId) {
        // Personal muzakki notifications
        const personalTxs = txs.filter((tx: any) => tx.muzakkiId === mId);
        const latest = personalTxs.slice(0, 5).map((tx: any) => ({
          id: tx.id,
          title: tx.status === "Success" ? "Zakat Terverifikasi" : "Zakat Baru Dicatat",
          message: `Zakat ${tx.type} Anda sebesar ${formatCurrency(tx.amount)} ${tx.status === "Success" ? "telah berhasil dikonfirmasi oleh Amil." : "menunggu konfirmasi transfer."}`,
          time: "Info",
          unread: tx.status === "Pending"
        }));
        setNotifications(latest);
        setHasUnread(latest.some((n: any) => n.unread));
      } else {
        // Admin amil notifications
        const latest = txs.slice(0, 5).map((tx: any) => ({
          id: tx.id,
          title: "Zakat Baru",
          message: `${tx.muzakkiName} baru saja membayar ${tx.type} sebesar ${formatCurrency(tx.amount)}.`,
          time: "Baru saja",
          unread: tx.status === "Pending"
        }));
        setNotifications(latest);
        setHasUnread(latest.some((n: any) => n.unread));
      }
    }
    fetchNotifications();
  }, []);

  const markAllAsRead = () => {
    setHasUnread(false);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <>
      {/* Global Overlay - High Z-Index to cover everything including Sidebar */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-[999] bg-transparent cursor-default" 
          onClick={() => setShowNotifications(false)} 
        />
      )}

      <header className={cn(
        "h-20 border-b border-border bg-white/80 backdrop-blur-md sticky top-0 px-4 md:px-8 flex items-center justify-between no-print transition-all duration-300",
        showNotifications ? "z-[1000]" : "z-40",
        !isVisible && !showNotifications ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      )}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-emerald-50 rounded-lg text-emerald-700 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-emerald-800">
              Assalamu'alaikum, {userRole ? adminName : "Guest"}
            </p>
            <p className="text-xs text-emerald-600/70">{today}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <div className="relative">
            {pathname !== "/calculator" && (
              <>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={cn(
                    "relative p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors",
                    showNotifications && "bg-emerald-50"
                  )}
                >
                  <Bell className="w-5 h-5" />
                  {hasUnread && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-emerald-100 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[110]">
                    <div className="p-4 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/20">
                      <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Notifikasi</h4>
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Tandai semua dibaca
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-emerald-400 italic">Belum ada notifikasi</div>
                      ) : notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setShowNotifications(false);
                            router.push(userRole === "muzakki" ? "/muzakki-dashboard?tab=history" : "/transactions");
                          }}
                          className={cn(
                            "p-4 border-b border-emerald-50 hover:bg-emerald-50/50 transition-colors cursor-pointer relative",
                            n.unread && "bg-emerald-50/20"
                          )}
                        >
                          {n.unread && <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />}
                          <p className="text-xs font-bold text-emerald-900">{n.title}</p>
                          <p className="text-[10px] text-emerald-600 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[9px] text-emerald-400 mt-2 font-medium">{n.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-emerald-50/50 text-center">
                      <Link
                        href={userRole === "muzakki" ? "/muzakki-dashboard?tab=history" : "/transactions"}
                        onClick={() => setShowNotifications(false)}
                        className="text-[10px] font-bold text-emerald-600 hover:underline"
                      >
                        {userRole === "muzakki" ? "Lihat Riwayat Zakat Saya" : "Lihat Semua Transaksi"}
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-emerald-100">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-emerald-900">
                {pathname === "/calculator" ? "Guest" : adminName}
              </p>
              <p className="text-[10px] text-emerald-500 font-medium">
                {pathname === "/calculator" ? "Guest Mode" : (userRole === "muzakki" ? "Muzakki Donatur" : "Petugas Amil")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-50 flex items-center justify-center text-emerald-600">
              <User className="w-6 h-6" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div className={cn(
        "fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300",
        isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsMobileMenuOpen(false)}>
        <div 
          className={cn(
            "w-72 h-full sidebar-gradient transition-transform duration-300 ease-out p-6 flex flex-col overflow-hidden",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .scrollbar-hide::-webkit-scrollbar {
              display: none !important;
            }
            .scrollbar-hide {
              -ms-overflow-style: none !important;
              scrollbar-width: none !important;
            }
          `}} />
          <div className="flex justify-between items-center mb-8">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold italic text-sm">M</span>
              </div>
              <span className="text-white font-bold">Ma'had Fastabiqul Khoirot</span>
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 bg-white/10 text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto scrollbar-hide">
            {(userRole === "muzakki" ? muzakkiMobileMenuItems : amilMenuItems).map((item) => {
              const isActive = item.href.includes("?")
                ? pathname + (typeof window !== "undefined" ? window.location.search : "") === item.href.replace(/\?/, "?" )
                : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive 
                      ? "bg-primary text-white" 
                      : "text-emerald-100/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {userRole && (
            <div className="mt-8 pt-4 border-t border-white/10">
              <button 
                onClick={async () => {
                  await logoutUser();
                  sessionStorage.clear();
                  localStorage.removeItem("sessionLastActive");
                  setIsMobileMenuOpen(false);
                  router.push("/login");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-emerald-100/70 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all group"
              >
                <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

