<script setup lang="ts">
import { profileConfig } from "@/config/profile";

const {
  name,
  title,
  avatar,
  bio,
  location,
  email,
  socialLinks,
  projects,
  skills,
  icp,
} = profileConfig;
</script>

<template>
  <div class="home">
    <!-- 头部个人信息 -->
    <header class="header">
      <div class="avatar-container">
        <img :src="avatar" :alt="name" class="avatar" />
      </div>
      <h1 class="name">{{ name }}</h1>
      <p class="title">{{ title }}</p>
      <p class="bio">{{ bio }}</p>

      <div class="meta">
        <span class="location">📍 {{ location }}</span>
        <span class="email">📧 {{ email }}</span>
      </div>

      <!-- 社交链接 -->
      <div class="social-links">
        <a
          v-for="link in socialLinks"
          :key="link.name"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="social-link"
        >
          {{ link.name }}
        </a>
      </div>
    </header>

    <!-- 技能标签 -->
    <section class="section skills-section">
      <h2 class="section-title">💡 技能栈</h2>
      <div class="skills">
        <span v-for="skill in skills" :key="skill" class="skill-tag">
          {{ skill }}
        </span>
      </div>
    </section>

    <!-- 项目展示 -->
    <section class="section projects-section">
      <h2 class="section-title">🚀 项目合集</h2>
      <div class="projects">
        <a
          v-for="project in projects"
          :key="project.name"
          :href="project.url"
          target="_blank"
          rel="noopener noreferrer"
          class="project-card"
        >
          <div class="project-icon">{{ project.icon }}</div>
          <h3 class="project-name">{{ project.name }}</h3>
          <p class="project-desc">{{ project.description }}</p>
          <div class="project-tags">
            <span v-for="tag in project.tags" :key="tag" class="project-tag">
              {{ tag }}
            </span>
          </div>
        </a>
      </div>
    </section>

    <!-- 页脚备案信息 -->
    <footer class="footer">
      <p>© {{ new Date().getFullYear() }} {{ name }}. All rights reserved.</p>
      <div class="icp-links">
        <a :href="icp.url" target="_blank" rel="noopener noreferrer">
          {{ icp.number }}
        </a>
        <template v-if="icp.gongan">
          <span class="divider">|</span>
          <a :href="icp.gonganUrl" target="_blank" rel="noopener noreferrer">
            {{ icp.gongan }}
          </a>
        </template>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.header {
  max-width: 800px;
  margin: 0 auto 40px;
  text-align: center;
  color: white;
}

.avatar-container {
  margin-bottom: 20px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.3);
  background: white;
}

.name {
  font-size: 2.5rem;
  margin: 0 0 10px;
  font-weight: 700;
}

.title {
  font-size: 1.2rem;
  margin: 0 0 20px;
  opacity: 0.9;
}

.bio {
  font-size: 1rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto 20px;
  opacity: 0.85;
}

.meta {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  opacity: 0.8;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.social-link {
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.section {
  max-width: 1000px;
  margin: 0 auto 40px;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.5rem;
  margin: 0 0 20px;
  color: #333;
  text-align: center;
}

.skills {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.skill-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.projects {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.project-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.project-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.project-name {
  font-size: 1.2rem;
  margin: 0 0 8px;
  color: #333;
}

.project-desc {
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 12px;
  line-height: 1.5;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.project-tag {
  background: #e9ecef;
  color: #495057;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
}

.footer {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.footer a {
  color: white;
  text-decoration: none;
  opacity: 0.8;
}

.footer a:hover {
  opacity: 1;
}

.icp-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.icp-links .divider {
  color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 768px) {
  .name {
    font-size: 2rem;
  }

  .meta {
    flex-direction: column;
    gap: 8px;
  }

  .section {
    padding: 20px;
  }

  .projects {
    grid-template-columns: 1fr;
  }
}
</style>
