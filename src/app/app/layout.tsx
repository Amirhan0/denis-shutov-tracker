import { requireClient } from "@/lib/auth";
import { Shell } from "@/components/Shell";

export default async function ClientLayout({ children }: LayoutProps<"/app">) {
  await requireClient();
  return <Shell>{children}</Shell>;
}
