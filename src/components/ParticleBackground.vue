<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationId: number | null = null;

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let particles: Particle[] = [];
  const particleCount = 80;

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  const initParticles = () => {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
  };

  const drawParticles = () => {
    particles.forEach((particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
      ctx.fill();
    });
  };

  const connectParticles = () => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          const opacity = (1 - distance / 120) * 0.3;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  };

  const updateParticles = () => {
    particles.forEach((particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
    });
  };

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawParticles();
    connectParticles();
    updateParticles();
    animationId = requestAnimationFrame(animate);
  };

  resizeCanvas();
  initParticles();
  animate();

  window.addEventListener("resize", () => {
    resizeCanvas();
    initParticles();
  });

  onUnmounted(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    window.removeEventListener("resize", resizeCanvas);
  });
});
</script>

<template>
  <canvas ref="canvasRef" class="particles-canvas"></canvas>
</template>

<style scoped>
.particles-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
