import { Background } from "@/components/Background";
import { Nav } from "@/components/Nav";
import { getAppUser } from "@/lib/user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAppUser();

  return (
    <div className="relative flex min-h-screen flex-col">
      <Background />
      <Nav userName={user.name} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
