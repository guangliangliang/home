# 个人主页

基于 Vue3 + TypeScript 构建的个人主页网站。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📁 项目结构

```
home/
├── src/
│   ├── config/
│   │   └── profile.ts      # 📝 配置文件（修改这里的内容）
│   ├── views/
│   │   └── Home.vue        # 首页组件
│   ├── App.vue             # 根组件
│   ├── main.ts             # 入口文件
│   └── style.css           # 全局样式
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## ⚙️ 配置说明

所有个人信息都在 `src/config/profile.ts` 中配置，修改后即可更新页面内容。

### 可配置项：

- **基本信息**: 姓名、头衔、头像、简介、位置、邮箱
- **社交链接**: GitHub、掘金、知乎等
- **项目列表**: 项目名称、描述、链接、标签
- **技能栈**: 技术技能标签
- **备案信息**: ICP 备案号和链接

### 修改示例：

```typescript
export const profileConfig: ProfileConfig = {
  name: "你的名字",           // 修改姓名
  title: "你的职位",          // 修改职位
  avatar: "头像 URL",         // 修改头像
  bio: "个人简介",            // 修改简介
  // ... 其他配置
};
```

## 🎨 自定义样式

如需修改样式，编辑 `src/views/Home.vue` 中的 `<style>` 部分。

## 📄 License

MIT
