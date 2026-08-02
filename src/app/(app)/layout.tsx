import { Background } from "@/components/Background";
import { Nav } from "@/components/Nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <Background />
      <main
        className="mx-auto w-full max-w-lg flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5"
        style={{ paddingBottom: "calc(5.25rem + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>
      <Nav />
    </div>
  );
}
