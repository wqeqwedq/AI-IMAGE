import React, { Suspense } from "react";
import { createServer } from "@/lib/supabase/server";
import InspirationTitle from "@/components/inspiration/title";
import InspirationToolbar from "@/components/inspiration/inspiration-toolbar";
import InspirationGrid from "@/components/inspiration/inspiration-grid";
import {
  fetchPublicPresetsForInspiration,
  parseInspirationSearchParams,
} from "@/lib/inspiration/fetch-public-presets";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const ModelsPage = async ({ searchParams }: PageProps) => {
  const sp = (await searchParams) ?? {};
  const filters = parseInspirationSearchParams(sp);
  const supabase = await createServer();
  const { data: inspirations } = await fetchPublicPresetsForInspiration(
    supabase,
    filters
  );
  const filteredActive = !!(
    filters.primary ||
    filters.secondary ||
    (filters.q && filters.q.trim())
  );

  return (
    <section className="container mx-auto">
      <InspirationTitle />
      <Suspense fallback={null}>
        <InspirationToolbar />
      </Suspense>
      <InspirationGrid
        items={inspirations}
        filteredActive={filteredActive}
      />
    </section>
  );
};

export default ModelsPage;
