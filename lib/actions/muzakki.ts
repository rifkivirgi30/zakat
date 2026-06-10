"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSessionPayload, setSessionCookie } from "../session";
import { prisma, safeSerialize, requireAmil, validatePassword } from "./helpers";

export async function getMuzakki() {
  await requireAmil();
  return safeSerialize(await prisma.muzakki.findMany({
    orderBy: { createdAt: "desc" },
  }));
}

export async function addMuzakki(data: { name: string; gender: string; phone?: string; address?: string; job?: string }) {
  try {
    await requireAmil();

    // [FIX #2] Cek duplikasi nomor telepon sebelum menambah
    if (data.phone) {
      const existing = await prisma.muzakki.findFirst({ where: { phone: data.phone } });
      if (existing) {
        return { success: false, error: `Nomor telepon ${data.phone} sudah terdaftar atas nama ${existing.name}.` };
      }
    }

    const muzakki = await prisma.muzakki.create({
      data: {
        name: data.name,
        gender: data.gender,
        phone: data.phone || "",
        address: data.address || "",
        job: data.job || "",
        // [FIX #2] Muzakki buatan admin dimulai sebagai akun "unclaimed" (password null)
        // Pengguna asli dapat mengklaim akunnya sendiri melalui halaman Registrasi
        password: null,
      },
    });
    revalidatePath("/muzakki");
    return safeSerialize({ success: true, data: muzakki });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang berwenang." };
    console.error(error);
    return { success: false, error: "Gagal menambah muzakki" };
  }
}

export async function updateMuzakki(id: number, data: { name: string; gender: string; phone?: string; address?: string; job?: string }) {
  try {
    await requireAmil();
    const muzakki = await prisma.muzakki.update({
      where: { id },
      data: {
        name: data.name,
        gender: data.gender,
        phone: data.phone || "",
        address: data.address || "",
        job: data.job || "",
      },
    });
    revalidatePath("/muzakki");
    return safeSerialize({ success: true, data: muzakki });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang berwenang." };
    console.error(error);
    return { success: false, error: "Gagal update muzakki" };
  }
}

export async function deleteMuzakki(id: number) {
  try {
    await requireAmil();
    await prisma.muzakki.delete({ where: { id } });
    revalidatePath("/muzakki");
    return { success: true };
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang berwenang." };
    console.error(error);
    return { success: false, error: "Gagal hapus muzakki" };
  }
}

export async function loginMuzakki(data: { phone: string; password: string }) {
  try {
    const muzakki = await prisma.muzakki.findFirst({
      where: { phone: data.phone }
    });

    if (!muzakki) {
      return { success: false, error: "Nomor WhatsApp belum terdaftar. Silakan daftar terlebih dahulu." };
    }

    // Block login for guest accounts (those who paid without registering)
    if (muzakki.password === null) {
      return { success: false, error: "Nomor ini terdaftar sebagai Tamu. Silakan daftar akun baru untuk mengakses Dashboard Muzakki." };
    }

    // Check brute-force lock
    if (muzakki.lockUntil && muzakki.lockUntil.getTime() > Date.now()) {
      const remainingMinutes = Math.ceil((muzakki.lockUntil.getTime() - Date.now()) / 60000);
      return { 
        success: false, 
        error: `Akun ini terkunci sementara karena 5x salah kata sandi. Silakan coba lagi dalam ${remainingMinutes} menit.` 
      };
    }

    let isMatch = false;
    const isBcrypt = muzakki.password.startsWith("$2a$") || muzakki.password.startsWith("$2b$") || muzakki.password.startsWith("$2y$");

    if (isBcrypt) {
      isMatch = bcrypt.compareSync(data.password, muzakki.password);
    } else {
      isMatch = data.password === muzakki.password;
      if (isMatch) {
        // Auto upgrade legacy plain-text password to bcrypt hash
        const hashed = bcrypt.hashSync(data.password, 10);
        await prisma.muzakki.update({
          where: { id: muzakki.id },
          data: { password: hashed }
        });
      }
    }

    if (!isMatch) {
      // Increment attempts on failure
      const newAttempts = muzakki.loginAttempts + 1;
      const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await prisma.muzakki.update({
        where: { id: muzakki.id },
        data: { 
          loginAttempts: newAttempts >= 5 ? 0 : newAttempts, // reset count to 0 once locked
          lockUntil: lockUntil 
        }
      });

      if (newAttempts >= 5) {
        return { 
          success: false, 
          error: "Terlalu banyak percobaan masuk yang gagal. Akun dikunci selama 15 menit." 
        };
      }
      return { 
        success: false, 
        error: `Kata Sandi salah. Sisa percobaan: ${5 - newAttempts} kali.` 
      };
    }

    // Reset brute-force counter on success
    await prisma.muzakki.update({
      where: { id: muzakki.id },
      data: { loginAttempts: 0, lockUntil: null }
    });

    await setSessionCookie({
      userId: muzakki.id,
      role: "muzakki",
      name: muzakki.name,
      phone: muzakki.phone || ""
    });

    return JSON.parse(JSON.stringify({ success: true, user: muzakki }));
  } catch (error) {
    console.error("Muzakki login error:", error);
    return { success: false, error: "Gagal masuk. Silakan coba lagi." };
  }
}

export async function registerMuzakki(data: { name: string; phone: string; password: string }) {
  try {
    const passwordCheck = validatePassword(data.password);
    if (!passwordCheck.valid) {
      return { success: false, error: passwordCheck.error };
    }
    const hashedPassword = bcrypt.hashSync(data.password, 10);
    const existing = await prisma.muzakki.findFirst({
      where: { phone: data.phone }
    });

    if (existing) {
      // [FIX #2] Akun "unclaimed" mencakup dua jenis:
      // (a) Muzakki yang pernah bayar sebagai Tamu (password null)
      // (b) Muzakki yang dibuat oleh Admin dari panel muzakki (password null)
      // Keduanya diperbolehkan untuk mendaftar dan mengklaim akun mereka.
      if (existing.password === null) {
        const muzakki = await prisma.muzakki.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            password: hashedPassword,
          }
        });
        
        await setSessionCookie({
          userId: muzakki.id,
          role: "muzakki",
          name: muzakki.name,
          phone: muzakki.phone || ""
        });

        revalidatePath("/muzakki");
        return JSON.parse(JSON.stringify({ success: true, user: muzakki }));
      }
      return { success: false, error: "Nomor WhatsApp sudah terdaftar. Silakan masuk." };
    }

    const muzakki = await prisma.muzakki.create({
      data: {
        name: data.name,
        phone: data.phone,
        password: hashedPassword,
        gender: "Laki-laki",
        job: "Pekerja",
        address: "Belum diisi"
      }
    });

    await setSessionCookie({
      userId: muzakki.id,
      role: "muzakki",
      name: muzakki.name,
      phone: muzakki.phone || ""
    });

    revalidatePath("/muzakki");
    return JSON.parse(JSON.stringify({ success: true, user: muzakki }));
  } catch (error) {
    console.error("Muzakki register error:", error);
    return { success: false, error: "Gagal mendaftar akun baru." };
  }
}

export async function getMuzakkiDashboardData(muzakkiId: number) {
  try {
    const session = await getSessionPayload();
    if (!session) {
      return { success: false, error: "Sesi tidak valid. Silakan masuk kembali." };
    }
    if (session.role === "muzakki" && session.userId !== muzakkiId) {
      return { success: false, error: "Akses ditolak. Anda hanya dapat melihat data Anda sendiri." };
    }

    const muzakki = await prisma.muzakki.findUnique({
      where: { id: muzakkiId },
      include: {
        transactions: {
          orderBy: { date: "desc" }
        }
      }
    });

    if (!muzakki) {
      return { success: false, error: "Muzakki tidak ditemukan" };
    }

    const distributions = await prisma.distribution.findMany({
      orderBy: { date: "desc" },
      take: 10,
      select: {
        id: true,
        mustahikName: true,
        amount: true,
        category: true,
        date: true,
        description: true
      }
    });

    const distributionSummary = await prisma.distribution.groupBy({
      by: ['category'],
      _sum: {
        amount: true
      }
    });

    const categoryAggregate: Record<string, number> = {};
    distributionSummary.forEach((item: any) => {
      categoryAggregate[item.category] = item._sum.amount || 0;
    });

    return JSON.parse(JSON.stringify({
      success: true,
      muzakki,
      distributions,
      categoryAggregate
    }));
  } catch (error) {
    console.error("Error getting muzakki dashboard data:", error);
    return { success: false, error: "Gagal memuat data dashboard" };
  }
}

export async function updateMuzakkiProfile(id: number, data: { name: string; gender: string; address?: string; phone?: string; job?: string }) {
  try {
    const session = await getSessionPayload();
    if (!session) {
      return { success: false, error: "Sesi tidak valid. Silakan masuk kembali." };
    }
    if (session.role !== "amil" && (session.role !== "muzakki" || session.userId !== id)) {
      return { success: false, error: "Akses ditolak. Anda tidak berwenang mengubah profil ini." };
    }

    if (data.phone) {
      const duplicate = await prisma.muzakki.findFirst({
        where: {
          phone: data.phone,
          id: { not: id }
        }
      });
      if (duplicate) {
        return { success: false, error: `Nomor WhatsApp ${data.phone} sudah digunakan oleh ${duplicate.name}. Gunakan nomor lain.` };
      }
    }

    const muzakki = await prisma.muzakki.update({
      where: { id },
      data: {
        name: data.name,
        gender: data.gender,
        address: data.address || "",
        phone: data.phone || "",
        job: data.job || "",
      }
    });
    revalidatePath("/muzakki");
    return safeSerialize({ success: true, data: muzakki });
  } catch (error) {
    console.error("Error updating muzakki profile:", error);
    return { success: false, error: "Gagal memperbarui profil" };
  }
}

export async function changeMuzakkiPassword(id: number, currentPass: string, newPass: string) {
  try {
    const session = await getSessionPayload();
    if (!session) {
      return { success: false, error: "Sesi tidak valid. Silakan masuk kembali." };
    }
    if (session.role !== "amil" && (session.role !== "muzakki" || session.userId !== id)) {
      return { success: false, error: "Akses ditolak. Anda tidak berwenang mengubah kata sandi ini." };
    }

    const muzakki = await prisma.muzakki.findUnique({
      where: { id }
    });

    if (!muzakki) {
      return { success: false, error: "Akun tidak ditemukan." };
    }

    let isCurrentMatch = false;
    const isBcrypt = muzakki.password.startsWith("$2a$") || muzakki.password.startsWith("$2b$") || muzakki.password.startsWith("$2y$");

    if (isBcrypt) {
      isCurrentMatch = bcrypt.compareSync(currentPass, muzakki.password);
    } else {
      isCurrentMatch = currentPass === muzakki.password;
    }

    if (!isCurrentMatch) {
      return { success: false, error: "Kata Sandi Lama salah." };
    }

    const passwordCheck = validatePassword(newPass);
    if (!passwordCheck.valid) {
      return { success: false, error: passwordCheck.error };
    }

    const hashedNew = bcrypt.hashSync(newPass, 10);
    await prisma.muzakki.update({
      where: { id },
      data: { password: hashedNew }
    });

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Gagal memperbarui Kata Sandi." };
  }
}
