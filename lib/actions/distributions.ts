"use server";

import { revalidatePath } from "next/cache";
import { 
  prisma, 
  safeSerialize, 
  requireAmil, 
  validateProofImage, 
  saveProofImage 
} from "./helpers";

// Mustahik Actions
export async function getMustahik() {
  await requireAmil();
  return safeSerialize(await prisma.mustahik.findMany({
    orderBy: { createdAt: "desc" },
  }));
}

export async function addMustahik(data: { name: string; category: string; phone?: string; address?: string }) {
  try {
    await requireAmil();
    const res = await prisma.mustahik.create({
      data: {
        name: data.name,
        category: data.category,
        phone: data.phone || "",
        address: data.address || "",
      },
    });
    revalidatePath("/mustahik");
    return safeSerialize({ success: true, data: res });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang berwenang." };
    console.error(error);
    return { success: false, error: "Gagal menambah mustahik" };
  }
}

export async function updateMustahik(id: number, data: { name: string; category: string; phone?: string; address?: string }) {
  try {
    await requireAmil();
    const res = await prisma.mustahik.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        phone: data.phone || "",
        address: data.address || "",
      },
    });
    revalidatePath("/mustahik");
    return safeSerialize({ success: true, data: res });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang berwenang." };
    console.error(error);
    return { success: false, error: "Gagal update mustahik" };
  }
}

export async function deleteMustahik(id: number) {
  try {
    await requireAmil();
    await prisma.mustahik.delete({ where: { id } });
    revalidatePath("/mustahik");
    return { success: true };
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang berwenang." };
    console.error(error);
    return { success: false, error: "Gagal hapus mustahik" };
  }
}

// Distribution Actions
export async function getDistributions() {
  await requireAmil();
  return safeSerialize(await prisma.distribution.findMany({
    orderBy: { date: "desc" },
    include: { mustahik: true },
  }));
}

export async function addDistribution(data: { 
  mustahikId?: string; 
  mustahikName: string; 
  amount: number; 
  category: string; 
  description: string;
  proofImage?: string;
}) {
  try {
    await requireAmil();
    if (!data.amount || data.amount <= 0) {
      return { success: false, error: "Nominal penyaluran harus lebih besar dari Rp 0." };
    }
    const imageCheck = validateProofImage(data.proofImage);
    if (!imageCheck.valid) {
      return { success: false, error: imageCheck.error };
    }

    // Safety Cash Guard: Check current available balance
    const totalIncomeResult = await prisma.transaction.aggregate({
      where: { status: "Success" },
      _sum: { amount: true }
    });
    const totalOutResult = await prisma.distribution.aggregate({
      _sum: { amount: true }
    });

    const totalIncome = totalIncomeResult._sum.amount || 0;
    const totalOut = totalOutResult._sum.amount || 0;
    const currentBalance = totalIncome - totalOut;

    if (data.amount > currentBalance) {
      return { 
        success: false, 
        error: `Saldo kas tidak mencukupi. Saldo tersedia saat ini: Rp ${currentBalance.toLocaleString("id-ID")}. Penyaluran sebesar Rp ${data.amount.toLocaleString("id-ID")} ditolak.` 
      };
    }

    // Save image to disk and get relative path
    const savedImagePath = data.proofImage ? saveProofImage(data.proofImage, "dist") : null;

    const res = await prisma.distribution.create({
      data: {
        mustahikId: data.mustahikId ? parseInt(data.mustahikId) : null,
        mustahikName: data.mustahikName,
        amount: data.amount,
        category: data.category,
        description: data.description,
        proofImage: savedImagePath,
      },
    });
    revalidatePath("/distributions");
    revalidatePath("/dashboard");
    return safeSerialize({ success: true, data: res });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang dapat mencatat penyaluran." };
    console.error(error);
    return { success: false, error: "Gagal mencatat penyaluran" };
  }
}

export async function deleteDistribution(id: number) {
  try {
    await requireAmil();
    await prisma.distribution.delete({ where: { id } });
    revalidatePath("/distributions");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang berwenang." };
    console.error(error);
    return { success: false, error: "Gagal menghapus data" };
  }
}
