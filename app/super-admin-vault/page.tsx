import { redirect } from "next/navigation";

export default function LegacySuperAdminVaultRedirect() {
  redirect("/admin/super/vault");
}
