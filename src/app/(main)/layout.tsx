"use client";
import { AppSidebar } from "@/components/core/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useUser } from "@/hooks/use-user";
import { NavUser } from "@/components/core/nav-user";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading, logout } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) return null; // Redirect happening

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 rounded-b-3xl px-4 bg-primary justify-between">
          <SidebarTrigger className="-ml-1 text-white" />
          <div className="max-w-[300px]">
            <NavUser user={user} />
          </div>
        </header>
        <div className="p-4 h-[calc(100vh-56px)] overflow-x-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
