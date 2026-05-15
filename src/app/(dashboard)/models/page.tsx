import React from "react";
import { createServer } from "@/lib/supabase/server";
import InspirationTitle from "@/components/inspiration/title";
import InspirationToolbar from "@/components/inspiration/inspiration-toolbar";
import InspirationGrid from "@/components/inspiration/inspiration-grid";
import {
  fetchPublicPresetCategoryTree,
  fetchPublicPresetsForInspiration,
  parseInspirationSearchParams,
} from "@/lib/inspiration/fetch-public-presets";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const ModelsPage = async ({ searchParams }: PageProps) => {
  const sp = (await searchParams) ?? {};
  const supabase = await createServer();
  const categoryTree = await fetchPublicPresetCategoryTree(supabase);
  const filters = parseInspirationSearchParams(sp, categoryTree);
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
      <InspirationToolbar categoryTree={categoryTree} />
      <InspirationGrid
        items={inspirations}
        filteredActive={filteredActive}
      />
    </section>
  );
};

export default ModelsPage;
