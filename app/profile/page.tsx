import { getOrganizationProfile } from "@/lib/actions";
import ProfileClient from "./ProfileClient";

export default async function ProfileLembagaPage() {
  const profile = await getOrganizationProfile();

  return <ProfileClient initialProfile={profile} />;
}
