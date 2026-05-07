import {
  Bookmark,
  CircleHelp,
  CreditCard,
  Images,
  Settings2,
  Sparkles,
  SquareTerminal,
} from "lucide-react";

export const navList = {
  en: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Generate Image",
      url: "/image-generation",
      icon: Images,
    },
    {
      title: "Inspiration",
      url: "/models",
      icon: Sparkles,
    },
    {
      title: "Preset library",
      url: "/model-training",
      icon: Bookmark,
    },
    {
      title: "My Images",
      url: "/gallery",
      icon: Images,
    },
    {
      title: "Billing",
      url: "/billing",
      icon: CreditCard,
    },
    {
      title: "Help & feedback",
      url: "/help-feedback",
      icon: CircleHelp,
    },
    {
      title: "Settings",
      url: "/account-settings",
      icon: Settings2,
    },
  ],
  zh: [
    {
      title: "仪表盘",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "生成图片",
      url: "/image-generation",
      icon: Images,
    },
    {
      title: "灵感来源",
      url: "/models",
      icon: Sparkles,
    },
    {
      title: "灵感库",
      url: "/model-training",
      icon: Bookmark,
    },
    {
      title: "我的图片",
      url: "/gallery",
      icon: Images,
    },
    {
      title: "账单",
      url: "/billing",
      icon: CreditCard,
    },
    {
      title: "帮助与反馈",
      url: "/help-feedback",
      icon: CircleHelp,
    },
    {
      title: "设置",
      url: "/account-settings",
      icon: Settings2,
    },
  ],
};
