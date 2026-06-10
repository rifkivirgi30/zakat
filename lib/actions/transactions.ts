"use server";

import { revalidatePath } from "next/cache";
import { getSessionPayload } from "../session";
import { 
  prisma, 
  safeSerialize, 
  requireAmil, 
  sanitizeInput, 
  validateProofImage, 
  saveProofImage 
} from "./helpers";

export async function getTransactions() {
  await requireAmil();
  return safeSerialize(await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    select: {
      id: true,
      txId: true,
      muzakkiName: true,
      muzakkiId: true,
      type: true,
      amount: true,
      method: true,
      status: true,
      anonymous: true,
      date: true,
      muzakki: true,
    }
  }));
}

export async function getTransactionProof(id: number) {
  await requireAmil();
  const tx = await prisma.transaction.findUnique({
    where: { id },
    select: { proofImage: true }
  });
  return tx?.proofImage || null;
}

export async function getMyTransactions() {
  const session = await getSessionPayload();
  if (!session) return [];

  if (session.role === "amil") {
    return safeSerialize(await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      include: { muzakki: true },
    }));
  }

  return safeSerialize(await prisma.transaction.findMany({
    where: { muzakkiId: session.userId },
    orderBy: { date: "desc" },
    include: { muzakki: true },
  }));
}

export async function addTransaction(data: { 
  muzakkiName: string; 
  phone?: string; 
  type: string; 
  amount: number; 
  method: string; 
  status: string;
  anonymous: boolean;
  proofImage?: string;
}) {
  try {
    const sanitizedMuzakkiName = sanitizeInput(data.muzakkiName);
    const sanitizedPhone = data.phone ? sanitizeInput(data.phone) : "";

    if (!data.amount || data.amount <= 0) {
      return { success: false, error: "Nominal zakat harus lebih besar dari Rp 0." };
    }

    const imageCheck = validateProofImage(data.proofImage);
    if (!imageCheck.valid) {
      return { success: false, error: imageCheck.error };
    }

    const session = await getSessionPayload();
    const safeStatus = session?.role === "amil" ? (data.status || "Pending") : "Pending";

    let muzakki = null;
    if (sanitizedPhone) {
      muzakki = await prisma.muzakki.findFirst({
        where: { phone: sanitizedPhone }
      });
    }

    if (muzakki) {
      if (muzakki.name !== sanitizedMuzakkiName) {
        muzakki = await prisma.muzakki.update({
          where: { id: muzakki.id },
          data: { name: sanitizedMuzakkiName }
        });
      }
    } else {
      muzakki = await prisma.muzakki.create({
        data: {
          name: sanitizedMuzakkiName,
          phone: sanitizedPhone,
          gender: "Laki-laki",
          password: null,
        }
      });
    }

    const lastTx = await prisma.transaction.findFirst({
      orderBy: { id: "desc" }
    });
    
    let nextNumber = 1;
    if (lastTx && lastTx.txId.startsWith("TX-")) {
      const lastNum = parseInt(lastTx.txId.split("-")[1]);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }
    
    const newTxId = `TX-${nextNumber.toString().padStart(4, '0')}`;

    const savedImagePath = data.proofImage ? saveProofImage(data.proofImage, "tx") : null;

    const transaction = await prisma.transaction.create({
      data: {
        txId: newTxId,
        muzakkiName: muzakki.name,
        muzakkiId: muzakki.id,
        type: data.type,
        amount: data.amount,
        method: data.method,
        status: safeStatus,
        proofImage: savedImagePath,
        anonymous: data.anonymous,
      }
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    return safeSerialize({ success: true, data: transaction });
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal memproses transaksi" };
  }
}

export async function verifyTransaction(id: number) {
  try {
    await requireAmil();
    await prisma.transaction.update({
      where: { id },
      data: { status: "Success" }
    });
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    return { success: true };
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang dapat memverifikasi transaksi." };
    console.error(error);
    return { success: false, error: "Gagal verifikasi transaksi" };
  }
}

export async function updateTransaction(id: number, data: { type: string; amount: number; method: string; status: string }) {
  try {
    await requireAmil();
    if (!data.amount || data.amount <= 0) {
      return { success: false, error: "Nominal transaksi harus lebih besar dari Rp 0." };
    }
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        type: data.type,
        amount: data.amount,
        method: data.method,
        status: data.status,
      }
    });
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return safeSerialize({ success: true, data: transaction });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang dapat mengubah transaksi." };
    console.error(error);
    return { success: false, error: "Gagal update transaksi" };
  }
}

export async function deleteTransaction(id: number) {
  try {
    await requireAmil();
    await prisma.transaction.delete({ where: { id } });
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang dapat menghapus transaksi." };
    console.error(error);
    return { success: false, error: "Gagal hapus transaksi" };
  }
}
