"use client";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, toggleSidebar } = useSidebar();
  const [openState, setOpenState] = useState<Record<number, boolean>>({});

  return (
    <SidebarGroup>
      {/*<SidebarGroupLabel>Platform</SidebarGroupLabel>*/}
      <SidebarMenu>
        {items.map((item, inx1) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={
              item.isActive ||
              item.items?.some((sub) => pathname.includes(sub.url))
            }
            className="group/collapsible"
            onOpenChange={(e) => {
              setOpenState((prev) => ({ ...prev, [inx1]: e }));
            }}
          >
            <SidebarMenuItem
              className={
                (pathname !== "/" &&
                  item.url !== "/" &&
                  item.url &&
                  pathname.includes(item.url)) ||
                (pathname === "/" && item.url === "/")
                  ? "bg-gray-100 font-medium rounded-sm"
                  : !item.items?.length
                    ? "hover:font-medium"
                    : ""
              }
            >
              <CollapsibleTrigger
                asChild
                onClick={(e) => {
                  if (!item.items?.length && item.url) {
                    router.push(item.url);
                    e.preventDefault();
                  }
                  if (state === "collapsed") {
                    toggleSidebar();
                    if (openState[inx1]) e.preventDefault();
                  }
                }}
              >
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && (
                    <item.icon className="text-[#3F3F46] text-base" />
                  )}
                  <span className="text-[#3F3F46] text-base">{item.title}</span>
                  {item.items?.length ? (
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  ) : (
                    ""
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem
                      key={subItem.title}
                      className={
                        pathname.includes(subItem.url)
                          ? "bg-gray-100 font-medium rounded-sm"
                          : "hover:font-medium"
                      }
                    >
                      <SidebarMenuSubButton asChild>
                        <a
                          className="cursor-pointer"
                          onClick={() => router.push(subItem.url)}
                        >
                          <span className="text-[#3F3F46] text-base">
                            {subItem.title}
                          </span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
