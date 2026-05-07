import React from "react";
import Title from "@/components/gallery/title";
import GalleryComponent from "@/components/gallery/gallery-component";
import { getSucceededGenerationJobsGalleryAction } from "@/app/actions/image-action";

const GalleryPage = async () => {
  const { data: items } = await getSucceededGenerationJobsGalleryAction();

  return (
    <section className="container mx-auto">
      <Title />
      <GalleryComponent items={items ?? []} />
    </section>
  );
};

export default GalleryPage;
