import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { DisplayImage } from "@/components/shared/display-image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { GenerationJobGalleryItem } from "@/app/actions/image-action";

interface RecentImagesProps {
  items: GenerationJobGalleryItem[];
}

const RecentImage = ({ items }: RecentImagesProps) => {
  const recentImageT = useTranslations("dashboard.recentImage");

  if (items.length === 0) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>{recentImageT("title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <p className="mt-16 text-muted-foreground">{recentImageT("info")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full xl:col-span-3">
      <CardHeader>
        <CardTitle>{recentImageT("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Carousel className="w-full">
          <CarouselContent>
            {items.map((item) => (
              <CarouselItem
                key={item.id}
                className="basis-full md:basis-1/2 lg:basis-1/3"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <DisplayImage
                    originalUrl={item.originalUrl}
                    alt=""
                    variant="thumbnail"
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
        <div className="flex justify-end">
          <Link href={"/gallery"}>
            <Button variant={"ghost"}>
              {recentImageT("name")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentImage;
