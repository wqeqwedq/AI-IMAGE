"use client";

import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/context";
import { navList } from "@/context/sidebar";
import { useTranslations } from "next-intl";

export const NavMain = () => {
  const pathname = usePathname();
  const navData = useI18n(navList);
  const sidebarT = useTranslations("sidebar");
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sm">
        {sidebarT("name")}
      </SidebarGroupLabel>
      <SidebarMenu className="text-base">
        {navData.map((item: any) => (
          <Link
            href={item.url}
            key={item.title}
            className={cn(
              "rounded-none",
              pathname === item.url
                ? "text-primary bg-primary/5"
                : "text-muted-foreground"
            )}
          >
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={item.title}
                className="h-10 text-base [&>svg]:size-5"
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};
