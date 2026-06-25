"use server";

import { revalidatePath } from "next/cache";
import { prisma, safeSerialize, requireAmil } from "./helpers";

export async function getZakatTypes() {
  return safeSerialize(await prisma.zakatType.findMany({
    orderBy: { createdAt: "desc" },
  }));
}

export async function addZakatType(data: { name: string; description?: string; percentage?: string; status: string; icon?: string; color?: string }) {
  try {
    await requireAmil();
    const res = await prisma.zakatType.create({
      data: {
        name: data.name,
        description: data.description || "",
        percentage: data.percentage || "",
        status: data.status,
        icon: data.icon || "HandHeart",
        color: data.color || "emerald",
      },
    });
    revalidatePath("/zakat-types");
    revalidatePath("/program-lembaga");
    return safeSerialize({ success: true, data: res });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang berwenang." };
    console.error(error);
    return { success: false, error: "Gagal menambah jenis zakat" };
  }
}

export async function updateZakatType(id: number, data: { name: string; description?: string; percentage?: string; status: string; icon?: string; color?: string }) {
  try {
    await requireAmil();
    const res = await prisma.zakatType.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || "",
        percentage: data.percentage || "",
        status: data.status,
        icon: data.icon || "HandHeart",
        color: data.color || "emerald",
      },
    });
    revalidatePath("/zakat-types");
    revalidatePath("/program-lembaga");
    return safeSerialize({ success: true, data: res });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang berwenang." };
    console.error(error);
    return { success: false, error: "Gagal update jenis zakat" };
  }
}

export async function deleteZakatType(id: number) {
  try {
    await requireAmil();
    await prisma.zakatType.delete({ where: { id } });
    revalidatePath("/zakat-types");
    revalidatePath("/program-lembaga");
    return { success: true };
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang berwenang." };
    console.error(error);
    return { success: false, error: "Gagal hapus jenis zakat" };
  }
}
