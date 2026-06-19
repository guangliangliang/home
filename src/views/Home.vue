<script setup lang="ts">
import { profileConfig } from "@/config/profile";
import ThemeToggle from "@/components/ThemeToggle.vue";

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

const getSocialIcon = (iconName: string) => {
  const icons: Record<string, string> = {
    github: "🐙",
    book: "📖",
    twitter: "🐦",
    linkedin: "💼",
    email: "📧",
    website: "🌐",
  };
  return icons[iconName] || "🔗";
};

const getParticleStyle = (i: number) => {
  const positions = [
    { top: "20%", left: "10%", duration: "25s" },
    { top: "60%", left: "20%", duration: "30s" },
    { top: "10%", left: "30%", duration: "22s" },
    { top: "40%", left: "40%", duration: "28s" },
    { top: "80%", left: "50%", duration: "24s" },
    { top: "30%", left: "60%", duration: "26s" },
    { top: "70%", left: "70%", duration: "27s" },
    { top: "50%", left: "80%", duration: "23s" },
    { top: "90%", left: "5%", duration: "29s" },
    { top: "15%", left: "85%", duration: "21s" },
    { top: "45%", left: "15%", duration: "25s" },
    { top: "75%", left: "25%", duration: "28s" },
    { top: "25%", left: "45%", duration: "24s" },
    { top: "65%", left: "55%", duration: "26s" },
    { top: "5%", left: "65%", duration: "22s" },
    { top: "55%", left: "75%", duration: "27s" },
    { top: "85%", left: "90%", duration: "30s" },
    { top: "35%", left: "35%", duration: "23s" },
    { top: "95%", left: "45%", duration: "25s" },
    { top: "5%", left: "55%", duration: "28s" },
    { top: "35%", left: "85%", duration: "24s" },
    { top: "75%", left: "15%", duration: "26s" },
    { top: "15%", left: "75%", duration: "22s" },
    { top: "55%", left: "5%", duration: "27s" },
    { top: "95%", left: "25%", duration: "29s" },
    { top: "25%", left: "55%", duration: "21s" },
    { top: "65%", left: "85%", duration: "25s" },
    { top: "5%", left: "25%", duration: "28s" },
    { top: "45%", left: "65%", duration: "24s" },
    { top: "85%", left: "35%", duration: "26s" },
    { top: "15%", left: "45%", duration: "22s" },
    { top: "55%", left: "75%", duration: "27s" },
    { top: "95%", left: "55%", duration: "30s" },
    { top: "35%", left: "15%", duration: "23s" },
    { top: "75%", left: "55%", duration: "25s" },
    { top: "25%", left: "75%", duration: "28s" },
    { top: "65%", left: "25%", duration: "24s" },
    { top: "5%", left: "45%", duration: "26s" },
    { top: "45%", left: "5%", duration: "22s" },
    { top: "85%", left: "65%", duration: "27s" },
  ];
  
  const pos = positions[(i - 1) % positions.length];
  return {
    top: pos.top,
    left: pos.left,
    animationDuration: pos.duration,
    animationDelay: `${-Math.random() * 30}s`,
  };
};
</script>

<template>
  <div class="home">
    <ThemeToggle />
    
    <!-- 动态背景 -->
    <div class="bg-container">
      <div class="bg-gradient"></div>
      <div class="bg-particles">
        <div v-for="i in 40" :key="i" class="particle" :style="getParticleStyle(i)"></div>
      </div>
    </div>
    
    <div class="container">
      <!-- 头部区域 -->
      <header class="header">
        <div class="avatar-container">
          <div class="avatar-ring-1"></div>
          <div class="avatar-ring-2"></div>
          <img :src="avatar" :alt="name" class="avatar" />
        </div>
        <h1 class="name">{{ name }}</h1>
        <p class="title">{{ title }}</p>
        <p class="bio">{{ bio }}</p>

        <div class="contact-info">
          <div class="contact-item">📍 {{ location }}</div>
          <a :href="`mailto:${email}`" class="email-btn">
            <span class="email-icon">📧</span>
            <span>{{ email }}</span>
          </a>
        </div>

          <div class="social-links">
            <a
              v-for="link in socialLinks"
              :key="link.name"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link"
            >
              <span class="social-icon">{{ getSocialIcon(link.icon) }}</span>
              <span class="social-name">{{ link.name }}</span>
            </a>
          </div>
      </header>

      <!-- 技能区域 -->
      <section class="section skills-section">
        <h2 class="section-title">💡 技能栈</h2>
        <div class="skills">
          <a
            v-for="skill in skills"
            :key="skill.name"
            :href="skill.url"
            target="_blank"
            rel="noopener noreferrer"
            class="skill-tag"
          >
            {{ skill.name }}
          </a>
        </div>
      </section>

      <!-- 项目区域 -->
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
            <div class="project-content">
              <h3 class="project-name">{{ project.name }}</h3>
              <p class="project-desc">{{ project.description }}</p>
              <div class="project-tags">
                <span v-for="tag in project.tags" :key="tag" class="project-tag">
                  {{ tag }}
                </span>
              </div>
            </div>
          </a>
        </div>
      </section>

      <!-- 页脚 -->
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
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  padding: 70px 20px;
  position: relative;
  overflow-x: hidden;
}

/* 动态背景 */
.bg-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-gradient);
  transition: background 0.5s ease;
}

.bg-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: particleFloat linear infinite;
}

@keyframes particleFloat {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

.container {
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 10;
}

/* 头部区域 */
.header {
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 50px;
}

.avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 36px;
}

.avatar-ring-1 {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb, #667eea);
  background-size: 400% 400%;
  animation: rotate 3s linear infinite, pulse 2s ease-in-out infinite;
  z-index: -2;
  filter: blur(2px);
}

.avatar-ring-2 {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: linear-gradient(135deg, transparent, rgba(255,255,255,0.2), transparent);
  background-size: 200% 200%;
  animation: rotate 4s linear infinite reverse;
  z-index: -1;
}

@keyframes rotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.9; }
}

.avatar {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 6px solid var(--glass-border);
  background: white;
  backdrop-filter: blur(10px);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  position: relative;
  z-index: 1;
  object-fit: cover;
}

.avatar:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 0 60px rgba(102, 126, 234, 0.7);
}

.name {
  font-size: 4rem;
  margin: 0 0 12px;
  font-weight: 900;
  letter-spacing: -2px;
  color: #ffffff;
  text-shadow: 0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(102,126,234,0.5);
}

.title {
  font-size: 1.3rem;
  margin: 0 0 24px;
  opacity: 0.9;
  font-weight: 500;
}

.bio {
  font-size: 1.1rem;
  line-height: 1.8;
  max-width: 600px;
  margin: 0 auto 28px;
  opacity: 0.9;
}

.contact-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
}

.contact-item {
  font-size: 1rem;
  opacity: 0.9;
}

.email-btn {
  padding: 14px 28px;
  border-radius: 50px;
  background: var(--glass-bg);
  backdrop-filter: blur(30px);
  border: 2px solid var(--glass-border);
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.email-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
}

.email-icon {
  font-size: 1.2rem;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

.social-link {
  padding: 14px 28px;
  border-radius: 50px;
  background: var(--glass-bg);
  backdrop-filter: blur(30px);
  border: 2px solid var(--glass-border);
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
}

.social-name {
  font-weight: 600;
  font-size: 1rem;
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-5px) scale(1.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.social-icon {
  font-size: 1.4rem;
}

/* 通用区域样式 */
.section {
  background: var(--glass-bg);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 24px;
  padding: 40px;
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow);
  margin-bottom: 30px;
}

.section-title {
  font-size: 1.6rem;
  margin: 0 0 28px;
  color: var(--text-primary);
  text-align: center;
  font-weight: 700;
}

/* 技能区域 */
.skills {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.skill-tag {
  background: var(--skill-gradient);
  color: white;
  padding: 14px 28px;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
  position: relative;
  overflow: hidden;
  text-decoration: none;
  display: inline-block;
  cursor: pointer;
}

.skill-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.skill-tag:hover::before {
  left: 100%;
}

.skill-tag:hover {
  transform: translateY(-5px) scale(1.08);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.5);
}

/* 项目区域 */
.projects {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.project-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px;
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 2px solid var(--glass-border);
  display: flex;
  gap: 18px;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
}

.project-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--skill-gradient);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.project-card:hover::before {
  transform: scaleX(1);
}

.project-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  border-color: #667eea;
}

.project-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  transition: transform 0.4s ease;
}

.project-card:hover .project-icon {
  transform: scale(1.2) rotate(10deg);
}

.project-content {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: 1.35rem;
  margin: 0 0 10px;
  color: var(--text-primary);
  font-weight: 700;
}

.project-desc {
  font-size: 1rem;
  color: #ffffff;
  margin: 0 0 16px;
  line-height: 1.7;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.project-tag {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 5px 12px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.project-card:hover .project-tag {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.05);
}

/* 页脚 */
.footer {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.95rem;
  padding: 30px 20px;
}

.footer a {
  color: var(--text-primary);
  text-decoration: none;
  opacity: 0.85;
  transition: opacity 0.3s ease;
}

.footer a:hover {
  opacity: 1;
}

.icp-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.icp-links .divider {
  color: var(--text-secondary);
  opacity: 0.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home {
    padding: 35px 15px;
  }

  .name {
    font-size: 2.2rem;
  }

  .avatar {
    width: 120px;
    height: 120px;
  }

  .avatar-glow {
    width: 140px;
    height: 140px;
  }

  .contact-info {
    flex-direction: column;
    gap: 12px;
  }

  .section {
    padding: 30px 24px;
    border-radius: 20px;
  }

  .projects {
    grid-template-columns: 1fr;
  }
}
</style>
