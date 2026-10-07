import { requireAdmin } from "@/lib/auth";
import { Shell } from "@/components/Shell";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return <Shell admin>{children}</Shell>;
}
