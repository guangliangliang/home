<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
};

const applyTheme = (dark: boolean) => {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  localStorage.setItem("theme", dark ? "dark" : "light");
};

watch(isDark, (newVal) => {
  applyTheme(newVal);
});

onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    isDark.value = savedTheme === "dark";
  } else {
    isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  applyTheme(isDark.value);
});
</script>

<template>
  <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换到浅色模式' : '切换到深色模式'">
    <span class="theme-icon">{{ isDark ? '☀️' : '🌙' }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.theme-toggle:hover {
  transform: scale(1.1) rotate(15deg);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
}

.theme-icon {
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.theme-toggle:hover .theme-icon {
  transform: scale(1.2);
}

@media (max-width: 768px) {
  .theme-toggle {
    top: 15px;
    right: 15px;
    width: 44px;
    height: 44px;
  }
  
  .theme-icon {
    font-size: 1.2rem;
  }
}
</style>
