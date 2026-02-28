// 个人主页配置文件
// 修改这里的配置来更新页面内容
import logoSrc from "@/assets/image/logo.png";
export interface Project {
  name: string;
  description: string;
  url: string;
  tags: string[];
  icon?: string;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface ProfileConfig {
  // 基本信息
  name: string;
  title: string;
  avatar: string;
  bio: string;
  location: string;
  email: string;

  // 社交链接
  socialLinks: SocialLink[];

  // 项目列表
  projects: Project[];

  // 技能标签
  skills: string[];

  // 备案信息
  icp: {
    number: string;
    url: string;
  };

  // 其他信息
  github: string;
  website: string;
}

export const profileConfig: ProfileConfig = {
  name: "光亮亮",
  title: "前端工程师",
  avatar: logoSrc || "https://api.dicebear.com/7.x/avataaars/svg?seed=dev",
  bio: "热爱编程，专注前端开发，喜欢探索新技术。致力于创造优秀的用户体验。",
  location: "中国·北京",
  email: "17600498920@163.com",
  socialLinks: [
    {
      name: "GitHub",
      url: "https://github.com/guangliangliang",
      icon: "github",
    },
    {
      name: "掘金",
      url: "https://juejin.cn/user/747323639998014",
      icon: "book",
    },
  ],

  projects: [
    {
      name: "个人博客",
      description: "个人博客网站",
      url: "https://guangliangliang.github.io/",
      tags: ["Vue3"],
      icon: "🧭",
    },
    {
      name: "导航系统",
      description: "个人导航网站，收集常用的开发工具和资源",
      url: "http://navigation.lingliang.top/",
      tags: ["Vue3", "Vite", "导航"],
      icon: "🧭",
    },
    {
      name: "精忠报国系统",
      description: "基于 Vue3 构建的后台管理系统",
      url: "http://admin.lingliang.top/",
      tags: ["Vue3", "Admin", "管理系统"],
      icon: "📝",
    },
    {
      name: "地图功能展示",
      description: "地图功能展示，包含常用地图组件和交互功能",
      url: "http://map.lingliang.top/",
      tags: ["地图"],
      icon: "🥾",
    },
    {
      name: "简历展示",
      description: "个人简历展示页面，包含个人信息和技能展示",
      url: "http://resume.lingliang.top/",
      tags: ["简历"],
      icon: "📄",
    },
  ],

  skills: [
    "Vue.js",
    "React",
    "TypeScript",
    "JavaScript",
    "HTML/CSS",
    "Node.js",
    "Webpack",
    "Vite",
  ],
  icp: {
    number: "京 ICP 备 2026005080 号",
    url: "https://beian.miit.gov.cn/",
    gongan: "京公网安备 11010702003005 号",
    gonganUrl:
      "https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010702003005",
  },
};
