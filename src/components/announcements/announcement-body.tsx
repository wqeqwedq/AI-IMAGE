"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

type AnnouncementBodyProps = {
  body: string;
  /** 嵌入列表等场景时缩小最大高度 */
  variant?: "default" | "embedded";
  className?: string;
};

export function AnnouncementBody({
  body,
  variant = "default",
  className,
}: AnnouncementBodyProps) {
  const looksLikeHtml = /^\s*</.test(body);
  const richClass = cn(
    "overflow-y-auto text-sm leading-relaxed",
    variant === "default"
      ? "max-h-[min(60vh,520px)]"
      : "max-h-72",
    "[&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-md [&_p]:mb-2",
    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
    "[&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold",
    className
  );

  if (looksLikeHtml) {
    return (
      <div
        className={richClass}
        // 正文来自 Supabase 控制台运营录入，按可信 HTML 渲染
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: body }}
      />
    );
  }

  return (
    <div className={richClass}>
      <ReactMarkdown
        components={{
          a: (props) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
