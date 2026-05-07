import { AnnouncementGate } from "@/components/announcements/announcement-gate";
import { AnnouncementHistorySheet } from "@/components/announcements/announcement-history-sheet";
import AppSidebar from "@/components/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import React from "react";

const DashboardLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex w-full items-center gap-2 px-4 my-4">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <AnnouncementHistorySheet />
          </div>
        </div>
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <AnnouncementGate />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
