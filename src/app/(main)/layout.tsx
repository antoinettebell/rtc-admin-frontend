import { AppSidebar } from "@/components/core/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
