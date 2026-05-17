import React from "react";
import Configurations from "@/components/image-generation/config-urations";
import GeneratedImages from "@/components/image-generation/generated-images";
import { fetchUserPresetsForStudio } from "@/lib/presets/queries";

const ImageGenerationPage = async () => {
  const { presets } = await fetchUserPresetsForStudio();

  return (
    <section className="container mx-auto grid min-h-0 w-full min-w-0 max-w-full flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-3 lg:items-stretch">
      <div className="flex min-h-0 w-full min-w-0 flex-col lg:overflow-hidden">
        <Configurations userPresets={presets} />
      </div>
      <div className="col-span-2 flex min-h-[min(48vh,400px)] w-full min-w-0 flex-col rounded-xl p-0 lg:min-h-0 lg:p-4">
        <GeneratedImages />
      </div>
    </section>
  );
};

export default ImageGenerationPage;
