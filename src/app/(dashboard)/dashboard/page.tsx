import React from "react";
import { getCreditsAction } from "@/app/actions/credits-action";
import {
  getImagesAction,
  getSucceededGenerationJobsGalleryAction,
} from "@/app/actions/image-action";
import QuickAction from "@/components/dashboard/quick-action";
import RecentImage from "@/components/dashboard/recent-images";
import StatsCards from "@/components/dashboard/stats-card";
import { createServer } from "@/lib/supabase/server";
import { displayNameFromUser } from "@/lib/user-display-name";
import { redirect } from "next/navigation";
import Title from "@/components/dashboard/title";

const DashboardPage = async () => {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: legacyImages } = await getImagesAction();
  const { data: jobGallery } = await getSucceededGenerationJobsGalleryAction();
  const { data: credits } = await getCreditsAction();
  const imageCount =
    (legacyImages?.length ?? 0) + (jobGallery?.length ?? 0);
  if (!user) {
    return redirect("/login");
  }
  const welcomeName = displayNameFromUser(user);
  return (
    <section className="container mx-auto flex-1 space-y-6">
      <Title displayName={welcomeName} />
      <StatsCards imageCount={imageCount} credits={credits} />
      <div className="grid gap-6 grid-cols-3 md:grid-cols-4">
        <RecentImage items={jobGallery?.slice(0, 6) ?? []} />
        <div className="h-full col-span-full xl:col-span-1 gap-0 sm:gap-6 xl:gap-0 xl:space-y-6 flex flex-col sm:flex-row xl:flex-col space-y-6">
          <QuickAction />
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
