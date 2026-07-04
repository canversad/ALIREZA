import { redirect } from "next/navigation";
import { ensureSeeded, getContainer } from "@/adapters/container";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureSeeded();
  const clients = await getContainer().clients.list();
  // Single-client PoC: go straight to the seeded client's hub.
  redirect(`/hub/${clients[0].id}`);
}
