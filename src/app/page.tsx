import { getCurrentUser } from "@/lib/auth";
import { AuthGate } from "@/components/AuthGate";
import { ChatApp } from "@/components/ChatApp";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) return <AuthGate />;
  return <ChatApp initialUser={user} />;
}
