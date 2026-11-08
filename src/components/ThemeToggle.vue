<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const isDark = ref(false);
const isTransitioning = ref(false);
let activeTransition: ViewTransition | undefined;
let revealAnimation: Animation | undefined;

const applyTheme = (dark: boolean, persist = true) => {
  isDark.value = dark;
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");

  if (persist) {
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // The current theme still works when browser storage is unavailable.
    }
  }
};

const toggleTheme = async (event: MouseEvent) => {
  if (isTransitioning.value) return;

  const nextDark = !isDark.value;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.startViewTransition || reduceMotion || document.visibilityState !== "visible") {
    applyTheme(nextDark);
    return;
  }

  // Use the button centre for both mouse and keyboard activation.
  const button = event.currentTarget as HTMLButtonElement;
  const { left, top, width, height } = button.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  const root = document.documentElement;

  isTransitioning.value = true;
  root.classList.add("theme-transitioning");

  try {
    activeTransition = document.startViewTransition(async () => {
      applyTheme(nextDark);
      await nextTick();
    });
    // A transition may be skipped when the page becomes hidden.
    const finished = activeTransition.finished.catch(() => undefined);
    await activeTransition.ready;

    revealAnimation = root.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 650,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
    await revealAnimation.finished;
    await finished;
  } catch {
    activeTransition?.skipTransition();
    applyTheme(nextDark);
  } finally {
    root.classList.remove("theme-transitioning");
    revealAnimation = undefined;
    activeTransition = undefined;
    isTransitioning.value = false;
  }
};

onMounted(() => {
  let savedTheme: string | null = null;
  try {
    savedTheme = localStorage.getItem("theme");
  } catch {
    // Fall back to the OS preference when storage is disabled.
  }

  const dark = savedTheme === "dark" ||
    (savedTheme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  applyTheme(dark, false);
});

onBeforeUnmount(() => {
  revealAnimation?.cancel();
  activeTransition?.skipTransition();
  document.documentElement.classList.remove("theme-transitioning");
});
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
    :aria-pressed="isDark"
    :aria-busy="isTransitioning"
    :aria-disabled="isTransitioning"
    :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
    @click="toggleTheme"
  >
    <span class="theme-icon" aria-hidden="true">{{ isDark ? '☀️' : '🌙' }}</span>
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

.theme-toggle:focus-visible {
  outline: 3px solid white;
  outline-offset: 5px;
}

.theme-toggle[aria-busy="true"] {
  cursor: progress;
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

@media (prefers-reduced-motion: reduce) {
  .theme-toggle,
  .theme-icon {
    transition: none;
  }

  .theme-toggle:hover,
  .theme-toggle:hover .theme-icon {
    transform: none;
  }
}
</style>

<style>
/* Capture the final palette so regular CSS transitions cannot muddy the reveal. */
:root.theme-transitioning * {
  transition: none !important;
}

:root.theme-transitioning::view-transition-image-pair(root) {
  isolation: auto;
}

:root.theme-transitioning::view-transition-old(root),
:root.theme-transitioning::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

:root.theme-transitioning::view-transition-old(root) {
  z-index: 1;
}

:root.theme-transitioning::view-transition-new(root) {
  z-index: 2;
}
</style>
