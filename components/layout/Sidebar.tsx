"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { 
  LayoutDashboard, 
  Users, 
  HandCoins, 
  Calculator, 
  ArrowLeftRight, 
  Gift, 
  BarChart3, 
  FileText, 
  UserCircle, 
  Settings, 
  LogOut,
  ChevronRight,
  Building2,
  ListPlus,
  Coins,
  History,
  TrendingUp,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/lib/actions";

const amilMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Data Muzakki", href: "/muzakki" },
  { icon: UserCircle, label: "Data Mustahik", href: "/mustahik" },
  { icon: Calculator, label: "Kalkulator Zakat", href: "/calculator" },
  { icon: ArrowLeftRight, label: "Transaksi", href: "/transactions" },
  { icon: Gift, label: "Penyaluran", href: "/distributions" },
  { icon: ListPlus, label: "Jenis Zakat", href: "/zakat-types" },
  { icon: Building2, label: "Program Lembaga", href: "/program-lembaga" },
  { icon: FileText, label: "Laporan", href: "/reports" },
  { icon: Settings, label: "Profil Lembaga", href: "/profile" },
];

const muzakkiMenuItems = [
  { icon: LayoutDashboard, label: "Ringkasan", href: "/muzakki-dashboard?tab=overview", tab: "overview" },
  { icon: Calculator, label: "Kalkulator Zakat", href: "/calculator", tab: "calculator" },
  { icon: History, label: "Riwayat & BSZ", href: "/muzakki-dashboard?tab=history", tab: "history" },
  { icon: TrendingUp, label: "Transparansi", href: "/muzakki-dashboard?tab=transparency", tab: "transparency" },
  { icon: User, label: "Pengaturan", href: "/muzakki-dashboard?tab=settings", tab: "settings" },
];

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const status = sessionStorage.getItem("isLoggedIn") === "true";
    const role = sessionStorage.getItem("userRole");
    setIsLoggedIn(status);
    setUserRole(role);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    sessionStorage.clear();
    localStorage.removeItem("sessionLastActive");
    router.push("/login");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  // Determine active tab for muzakki routes
  const currentTab = searchParams.get("tab") || "overview";
  const isMuzakkiDashboard = pathname === "/muzakki-dashboard";

  // Filter menu items dynamically
  const filteredMenuItems = isLoggedIn 
    ? (userRole === "muzakki" ? muzakkiMenuItems : amilMenuItems) 
    : amilMenuItems.filter(item => item.href === "/calculator");

  return (
    <aside className="w-64 sidebar-gradient text-white h-screen fixed left-0 top-0 hidden lg:flex flex-col z-50 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none !important;
        }
        .scrollbar-hide {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-xl italic">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Ma'had Fastabiqul Khoirot</h1>
            <p className="text-[10px] text-emerald-300 tracking-wider uppercase">Amal Digital</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {filteredMenuItems.map((item) => {
          // For muzakki items, check tab query param; for amil items, check pathname
          const isMuzakkiItem = 'tab' in item;
          const isActive = isMuzakkiItem
            ? (item.href.startsWith("/muzakki-dashboard")
                ? (isMuzakkiDashboard && currentTab === (item as any).tab)
                : pathname === item.href)
            : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/30" 
                  : "text-emerald-100/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-emerald-300/50 group-hover:text-white")} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        {isLoggedIn ? (
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-emerald-100/70 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        ) : (
          <button 
            onClick={handleLogin}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all group"
          >
            <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Login Portal</span>
          </button>
        )}
      </div>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense>
      <SidebarContent />
    </Suspense>
  );
}

