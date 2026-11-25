import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "ORGANIZATION") redirect("/org");
  redirect("/researcher");
}
