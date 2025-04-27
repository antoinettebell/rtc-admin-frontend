"use client";
import { AppSidebar } from "@/components/core/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useUser } from "@/hooks/use-user";

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
        <header className="flex h-14 shrink-0 items-center gap-2 rounded-b-3xl px-4 bg-primary">
          <SidebarTrigger className="-ml-1 text-white" />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
