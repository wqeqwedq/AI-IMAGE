import React from "react";
import Title from "@/components/model-training/title";
import PresetsStudio from "@/components/model-training/presets-studio";
import { fetchUserPresetsForStudio } from "@/lib/presets/queries";

const ModelTrainingPage = async () => {
  const { presets } = await fetchUserPresetsForStudio();

  return (
    <div className="container mx-auto">
      <Title />
      <PresetsStudio presets={presets} />
    </div>
  );
};

export default ModelTrainingPage;
