"use server";

import { revalidatePath } from "next/cache";
import { prisma, safeSerialize, requireAmil } from "./helpers";

export async function getOrganizationProfile() {
  let profile = await prisma.organizationProfile.findFirst();
  if (!profile) {
    profile = await prisma.organizationProfile.create({
      data: {
        name: "LAZ Linsharein Amal",
        subtitle: "Lembaga Amil Zakat Nasional",
        address: "Jl. Raya Zakat No. 123, Jakarta",
        phone: "+62 812-3456-7890",
        email: "info@linsharein.com",
        website: "www.linsharein.com",
        verification: "Terverifikasi 2026",
        vision: "Menjadi lembaga amil zakat terdepan dalam pengelolaan dana umat yang profesional, transparan, dan berbasis teknologi untuk mewujudkan kesejahteraan umat yang berkelanjutan.",
        mission: JSON.stringify([
          "Meningkatkan kesadaran masyarakat dalam berzakat, infak, dan sedekah.",
          "Mengelola dana zakat dengan prinsip akuntabilitas dan transparansi tinggi.",
          "Mengembangkan program pendayagunaan zakat yang inovatif and produktif.",
          "Memberikan pelayanan terbaik kepada para muzakki dan mustahik.",
          "Pemanfaatan teknologi digital untuk kemudahan akses dan pelaporan."
        ]),
      }
    });
  }
  return safeSerialize(profile);
}

export async function updateOrganizationProfile(id: number, data: any) {
  try {
    await requireAmil();
    const res = await prisma.organizationProfile.update({
      where: { id },
      data: {
        name: data.name,
        subtitle: data.subtitle,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        verification: data.verification,
        vision: data.vision,
        mission: data.mission,
        logoBase64: data.logoBase64,
      },
    });
    revalidatePath("/profile");
    return safeSerialize({ success: true, data: res });
  } catch (error: any) {
    if (error?.message === "FORBIDDEN") return { success: false, error: "Akses ditolak. Hanya Amil yang dapat mengubah profil lembaga." };
    console.error(error);
    return { success: false, error: "Gagal update profil lembaga" };
  }
}
