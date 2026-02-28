// 个人主页配置文件
// 修改这里的配置来更新页面内容

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
  name: "张三",
  title: "前端工程师",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=dev",
  bio: "热爱编程，专注前端开发，喜欢探索新技术。致力于创造优秀的用户体验。",
  location: "中国·北京",
  email: "your.email@example.com",
  
  socialLinks: [
    {
      name: "GitHub",
      url: "https://github.com/yourname",
      icon: "github"
    },
    {
      name: "掘金",
      url: "https://juejin.cn/user/yourname",
      icon: "book"
    },
    {
      name: "知乎",
      url: "https://www.zhihu.com/people/yourname",
      icon: "message"
    }
  ],
  
  projects: [
    {
      name: "导航系统",
      description: "个人导航网站，收集常用的开发工具和资源",
      url: "https://github.com/guangliangliang/navigation",
      tags: ["Vue3", "Vite", "导航"],
      icon: "🧭"
    },
    {
      name: "个人博客",
      description: "基于 Vue3 构建的技术博客",
      url: "https://github.com/yourname/blog",
      tags: ["Vue3", "Markdown", "博客"],
      icon: "📝"
    },
    {
      name: "工具集合",
      description: "常用前端开发工具合集",
      url: "https://github.com/yourname/tools",
      tags: ["工具", "TypeScript"],
      icon: "🛠️"
    }
  ],
  
  skills: [
    "Vue.js",
    "React",
    "TypeScript",
    "JavaScript",
    "HTML/CSS",
    "Node.js",
    "Webpack",
    "Vite"
  ],
  
  icp: {
    number: "京 ICP 备 XXXXXXXX 号",
    url: "https://beian.miit.gov.cn/"
  },
  
  github: "https://github.com/yourname",
  website: "https://yourname.com"
};
