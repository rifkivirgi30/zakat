import prismaOriginal from "@/lib/db";
export const prisma = prismaOriginal as any;
import { getSessionPayload } from "../session";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// --- Helper to safely serialize objects for Server Actions (converts Date objects to string) ---
export function safeSerialize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj));
}

// --- Internal Authorization Helpers ---
export async function requireAmil() {
  const session = await getSessionPayload();
  if (!session || session.role !== "amil") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireMuzakki() {
  const session = await getSessionPayload();
  if (!session || session.role !== "muzakki") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export function validateProofImage(proofImage?: string): { valid: boolean; error?: string } {
  if (!proofImage) return { valid: true };
  const allowedPrefixes = [
    "data:image/jpeg;base64,",
    "data:image/jpg;base64,",
    "data:image/png;base64,",
    "data:image/webp;base64,",
  ];
  const isValidMime = allowedPrefixes.some(p => proofImage.startsWith(p));
  if (!isValidMime) {
    return { valid: false, error: "Format file bukti tidak valid. Hanya JPEG, PNG, atau WEBP yang diizinkan." };
  }
  // ~4/3 of original binary size
  const approxBytes = (proofImage.length * 3) / 4;
  if (approxBytes > 3 * 1024 * 1024) {
    return { valid: false, error: "Ukuran file bukti terlalu besar. Maksimum 3MB." };
  }
  return { valid: true };
}

export function sanitizeInput(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Kata sandi minimal harus terdiri dari 8 karakter." };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return { valid: false, error: "Kata sandi harus mengandung setidaknya satu huruf dan satu angka." };
  }
  return { valid: true };
}

export function saveProofImage(base64Data: string, prefix: string): string {
  if (!base64Data || !base64Data.includes(";base64,")) {
    return base64Data; // Jika sudah berupa string biasa (bukan Base64), kembalikan langsung
  }

  try {
    const parts = base64Data.split(";base64,");
    const mimeType = parts[0].split(":")[1];
    const rawData = parts[1];

    let extension = "png";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
      extension = "jpg";
    } else if (mimeType.includes("webp")) {
      extension = "webp";
    }

    const filename = `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
    
    // Pastikan direktori tujuan ada
    const uploadDir = path.join(process.cwd(), "public", "uploads", "proofs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, Buffer.from(rawData, "base64"));

    // Kembalikan URL relatif publik
    return `/uploads/proofs/${filename}`;
  } catch (err) {
    console.error("Gagal menyimpan gambar bukti:", err);
    return "";
  }
}
