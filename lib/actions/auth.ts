"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { setSessionCookie, clearSessionCookie, getSessionPayload } from "../session";
import { prisma, validatePassword } from "./helpers";

export async function loginAdmin({ username, password }: any) {
  try {
    // Auto-create default admin if none exists (hashed password)
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "AdminZakat@2024!";
      const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
      await prisma.admin.create({
        data: { username: "admin", password: hashedPassword, name: "Amil Utama" }
      });
    }

    const admin = await prisma.admin.findFirst({
      where: { username }
    });

    if (admin) {
      // Check brute-force lock
      if (admin.lockUntil && admin.lockUntil.getTime() > Date.now()) {
        const remainingMinutes = Math.ceil((admin.lockUntil.getTime() - Date.now()) / 60000);
        return { 
          success: false, 
          error: `Akun ini terkunci sementara karena 5x salah kata sandi. Silakan coba lagi dalam ${remainingMinutes} menit.` 
        };
      }

      let isMatch = false;
      const isBcrypt = admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$") || admin.password.startsWith("$2y$");
      
      if (isBcrypt) {
        isMatch = bcrypt.compareSync(password, admin.password);
      } else {
        isMatch = password === admin.password;
        if (isMatch) {
          // Auto upgrade legacy plain-text password to bcrypt hash
          const hashed = bcrypt.hashSync(password, 10);
          await prisma.admin.update({
            where: { id: admin.id },
            data: { password: hashed }
          });
        }
      }

      if (isMatch) {
        // Reset brute-force counter on success
        await prisma.admin.update({
          where: { id: admin.id },
          data: { loginAttempts: 0, lockUntil: null }
        });

        await setSessionCookie({
          userId: admin.id,
          role: "amil",
          name: admin.name || "Administrator",
          username: admin.username
        });

        return { 
          success: true, 
          user: { 
            username: admin.username,
            name: admin.name || "Administrator"
          } 
        };
      } else {
        // Increment attempts on failure
        const newAttempts = admin.loginAttempts + 1;
        const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
        await prisma.admin.update({
          where: { id: admin.id },
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
          error: `Username atau Password salah. Sisa percobaan: ${5 - newAttempts} kali.` 
        };
      }
    }
    return { success: false, error: "Username atau Password salah" };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Gagal melakukan login" };
  }
}

export async function logoutUser() {
  try {
    await clearSessionCookie();
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "Gagal keluar sesi" };
  }
}

export async function getSession() {
  try {
    return await getSessionPayload();
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function verifyMuzakkiProfileForReset(phone: string, fullName: string) {
  try {
    if (!phone || !fullName) {
      return { success: false, error: "Nomor WhatsApp dan Nama Lengkap wajib diisi." };
    }

    const muzakki = await prisma.muzakki.findFirst({
      where: { phone: phone.trim() }
    });

    if (!muzakki) {
      // Security Enumeration Guard: generic error message to prevent account lookup
      return { success: false, error: "Nomor WhatsApp atau Nama Lengkap tidak cocok dengan data terdaftar." };
    }

    // Check if the account has a password (registered/claimed)
    if (muzakki.password === null) {
      return { success: false, error: "Nomor WhatsApp atau Nama Lengkap tidak cocok dengan data terdaftar." };
    }

    // Check reset lockout status
    if (muzakki.resetLockUntil && muzakki.resetLockUntil.getTime() > Date.now()) {
      const remainingMinutes = Math.ceil((muzakki.resetLockUntil.getTime() - Date.now()) / 60000);
      return {
        success: false,
        error: `Fitur pemulihan terkunci sementara karena terlalu banyak kegagalan. Coba lagi dalam ${remainingMinutes} menit.`
      };
    }

    // Case-insensitive trimmed name comparison
    const dbName = muzakki.name.trim().toLowerCase();
    const inputName = fullName.trim().toLowerCase();

    if (dbName !== inputName) {
      // Increment failed attempts
      const newAttempts = muzakki.resetAttempts + 1;
      const shouldLock = newAttempts >= 5;
      const resetLockUntil = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.muzakki.update({
        where: { id: muzakki.id },
        data: {
          resetAttempts: shouldLock ? 0 : newAttempts,
          resetLockUntil
        }
      });

      if (shouldLock) {
        return {
          success: false,
          error: "Terlalu banyak percobaan pencocokan data yang gagal. Fitur pemulihan dikunci selama 15 menit."
        };
      }

      return {
        success: false,
        error: "Nomor WhatsApp atau Nama Lengkap tidak cocok dengan data terdaftar."
      };
    }

    // Verification successful: generate single-use 5-minute reset token
    const resetToken = crypto.randomUUID();
    const resetExpiredAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.muzakki.update({
      where: { id: muzakki.id },
      data: {
        resetToken,
        resetExpiredAt,
        resetAttempts: 0,
        resetLockUntil: null
      }
    });

    return {
      success: true,
      resetToken
    };
  } catch (error) {
    console.error("Error verifying profile for reset:", error);
    return { success: false, error: "Terjadi kesalahan pada sistem." };
  }
}

export async function resetMuzakkiPasswordWithToken(phone: string, token: string, newPass: string) {
  try {
    if (!phone || !token || !newPass) {
      return { success: false, error: "Data pemulihan tidak lengkap." };
    }

    const passwordCheck = validatePassword(newPass);
    if (!passwordCheck.valid) {
      return { success: false, error: passwordCheck.error };
    }

    const muzakki = await prisma.muzakki.findFirst({
      where: {
        phone: phone.trim(),
        resetToken: token
      }
    });

    if (!muzakki) {
      return { success: false, error: "Sesi pemulihan tidak valid atau sudah kedaluwarsa." };
    }

    // Check token expiration
    if (!muzakki.resetExpiredAt || muzakki.resetExpiredAt.getTime() < Date.now()) {
      return { success: false, error: "Sesi pemulihan telah kedaluwarsa (batas 5 menit). Silakan ulangi proses." };
    }

    // Securely hash the new password
    const hashedPassword = bcrypt.hashSync(newPass, 10);

    // Save and clear reset token & unlock login lockouts
    await prisma.muzakki.update({
      where: { id: muzakki.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpiredAt: null,
        loginAttempts: 0,
        lockUntil: null
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error resetting password with token:", error);
    return { success: false, error: "Gagal memperbarui kata sandi. Silakan coba lagi." };
  }
}
