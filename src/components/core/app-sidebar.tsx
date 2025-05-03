import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {Home, SquareUserRound, User2} from "lucide-react";
import { NavMain } from "@/components/core/nav-main";

// This is sample data.
const navMain = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    items: [],
  },
  {
    title: "Vendors",
    url: "/vendor",
    icon: SquareUserRound,
    items: [],
  },
  {
    title: "Users",
    url: "/user",
    icon: User2,
    items: [],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex h-14 px-4 text-white font-semibold items-center p-2 bg-primary rounded-b-3xl">
          Round The Corner
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
