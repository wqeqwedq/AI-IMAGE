import { Sparkles } from "lucide-react";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <Link href={"/"} className={cn("flex items-center gap-2", className)}>
      <Sparkles strokeWidth={1.5} />
      <span className="text-lg font-semibold">AI Image</span>
    </Link>
  );
};

export default Logo;
