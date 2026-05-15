import {
  Bookmark,
  CircleHelp,
  Gift,
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
      title: "Common templates",
      url: "/models",
      icon: Sparkles,
    },
    {
      title: "My templates",
      url: "/model-training",
      icon: Bookmark,
    },
    {
      title: "My Images",
      url: "/gallery",
      icon: Images,
    },
    {
      title: "Redeem code",
      url: "/redeem",
      icon: Gift,
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
      title: "常用模板",
      url: "/models",
      icon: Sparkles,
    },
    {
      title: "我的模板",
      url: "/model-training",
      icon: Bookmark,
    },
    {
      title: "我的图片",
      url: "/gallery",
      icon: Images,
    },
    {
      title: "兑换码",
      url: "/redeem",
      icon: Gift,
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
