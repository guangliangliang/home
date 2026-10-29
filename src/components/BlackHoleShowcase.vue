<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { profileConfig } from '@/config/profile';
import { createBlackHole } from '@/lib/blackHole';

const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);
const unavailable = ref(false);
const angle = ref(16);
const intensity = ref(100);
const paused = ref(false);
let renderer: ReturnType<typeof createBlackHole> | undefined;
const orbitProjects = ['AI工具集', '地图功能展示', '游戏集合'].flatMap((name, index) => {
  const project = profileConfig.projects.find((item) => item.name === name);
  return project ? [{ ...project, position: index + 1, label: ['智能', '探索', '游乐'][index] }] : [];
});

function setAngle(event: Event) {
  angle.value = Number((event.target as HTMLInputElement).value);
  renderer?.setAngle(angle.value);
}
function setIntensity(event: Event) {
  intensity.value = Number((event.target as HTMLInputElement).value);
  renderer?.setIntensity(intensity.value / 100);
}
function togglePause() {
  paused.value = !paused.value;
  renderer?.setPaused(paused.value);
}
function reset() {
  angle.value = 16;
  intensity.value = 100;
  renderer?.reset();
}
onMounted(() => {
  if (!canvas.value) return;
  renderer = createBlackHole(canvas.value, {
    onReady: () => { ready.value = true; unavailable.value = false; },
    onUnavailable: () => { unavailable.value = true; },
    onViewChange: (value) => { angle.value = Math.round(value); },
  });
});
onUnmounted(() => renderer?.destroy());
</script>

<template>
  <section class="black-hole" aria-labelledby="black-hole-heading">
    <div class="hole-intro">
      <div>
        <p class="hole-eyebrow">EVENT HORIZON / 02</p>
        <h2 id="black-hole-heading">在引力的<span>边界。</span></h2>
      </div>
      <p class="hole-description">光，在这里绕了一个弯。<br /><span>横向拖动，换个角度看宇宙。</span></p>
    </div>

    <div class="hole-stage" :class="{ 'is-ready': ready && !unavailable }">
      <canvas ref="canvas" class="hole-canvas" aria-hidden="true"></canvas>
      <div v-if="!ready || unavailable" class="hole-fallback" aria-hidden="true">
        <div class="fallback-ring"></div><div class="fallback-disk"></div><div class="fallback-core"></div>
        <span>{{ unavailable ? '静态星空 · 作品仍可探索' : '即将抵达引力的边界…' }}</span>
      </div>
      <div class="hole-marker marker-left" aria-hidden="true"><span>01 / SINGULARITY</span><i></i></div>
      <div class="hole-marker marker-right" aria-hidden="true"><i></i><span>NO LIGHT ESCAPES</span></div>
      <a v-for="project in orbitProjects" :key="project.name" :class="['orbit-project', `orbit-project-${project.position}`]" :href="project.url" target="_blank" rel="noopener noreferrer" :aria-label="`打开${project.name}（新窗口）`">
        <i aria-hidden="true"></i><span>{{ project.label }}<b aria-hidden="true">↗</b></span>
      </a>
      <div class="hole-stage-footer"><span><i></i>引力漫游</span><span>拖动视角 · 点击星点探索作品</span></div>
    </div>

    <div class="hole-controls">
      <div class="hole-sliders">
        <label for="hole-angle"><span>观测角度<output for="hole-angle">{{ angle }}°</output></span><input id="hole-angle" type="range" min="6" max="42" step="1" :value="angle" :disabled="unavailable" @input="setAngle" /></label>
        <label for="hole-intensity"><span>光环强度<output for="hole-intensity">{{ intensity }}%</output></span><input id="hole-intensity" type="range" min="40" max="200" step="5" :value="intensity" :disabled="unavailable" @input="setIntensity" /></label>
      </div>
      <div class="hole-actions">
        <button type="button" :disabled="unavailable" :aria-pressed="paused" :aria-label="paused ? '继续黑洞动画' : '暂停黑洞动画'" @click="togglePause"><span aria-hidden="true">{{ paused ? '▷' : 'Ⅱ' }}</span>{{ paused ? '继续' : '暂停' }}</button>
        <button type="button" :disabled="unavailable" @click="reset"><span aria-hidden="true">↺</span>重置</button>
      </div>
    </div>
    <div class="hole-caption"><p>好奇心，是逃逸速度。</p><span>三个星点，通向三个亲手创造的世界。</span></div>
  </section>
</template>

<style scoped>
.black-hole { color: #fff9f3; background: transparent; overflow: hidden; }
.hole-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 32px 42px 0; }
.hole-eyebrow { margin: 0 0 11px; font: 10px/1.6 Consolas, monospace; letter-spacing: 3px; color: #ffe0b3; }
.hole-intro h2 { margin: 0; font-size: clamp(28px, 3vw, 42px); letter-spacing: -1.5px; font-weight: 600; line-height: 1.3; }
.hole-intro h2 span { color: #f8dabb; }
.hole-description { margin: 0 0 3px; color: #f1e6f1; font-size: 12px; line-height: 1.9; text-align: right; }
.hole-description span { color: #dfd3e8; }
.hole-stage { position: relative; height: 460px; isolation: isolate; margin-top: 10px; overflow: hidden; background: radial-gradient(ellipse 48% 55% at 50% 50%, #170e3059 0%, #21113928 47%, transparent 82%); }
.hole-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: grab; touch-action: pan-y; opacity: 0; transition: opacity .8s; }
.is-ready .hole-canvas { opacity: 1; }
.hole-canvas:active { cursor: grabbing; }
.hole-marker { position: absolute; top: 43%; z-index: 2; display: flex; align-items: center; gap: 12px; color: #ded0e5; font: 8px/1.5 Consolas, monospace; letter-spacing: 1.5px; pointer-events: none; }
.hole-marker i { width: 50px; height: 1px; background: linear-gradient(90deg, #e8ca9966, #e8ca9900); }
.marker-left { left: 42px; }
.marker-right { right: 42px; }
.marker-right i { transform: rotate(180deg); }
.orbit-project { position: absolute; z-index: 3; display: flex; align-items: center; gap: 9px; min-height: 44px; padding-inline: 5px; color: #f9e8d7; font-size: 10px; letter-spacing: 1px; text-decoration: none; }
.orbit-project i { width: 5px; height: 5px; border-radius: 50%; border: 1px solid #ffcf88; background: #e0ac60; box-shadow: 0 0 0 5px #c6954b10, 0 0 17px #d69c50; transition: box-shadow .2s; }
.orbit-project b { color: #ffe0b3; font-size: 12px; font-weight: 400; margin-left: 7px; }
.orbit-project:hover { color: white; }
.orbit-project:hover i { box-shadow: 0 0 0 8px #c6954b20, 0 0 24px #ffcb85; }
.orbit-project-1 { left: 26%; top: 15%; }
.orbit-project-2 { right: 20%; top: 67%; }
.orbit-project-3 { left: 22%; top: 72%; }
.hole-stage-footer { position: absolute; z-index: 2; bottom: 18px; left: 42px; right: 42px; display: flex; justify-content: space-between; gap: 15px; color: #e5d9eb; font-size: 10px; letter-spacing: 1px; pointer-events: none; }
.hole-stage-footer span:first-child { display: flex; align-items: center; gap: 8px; }
.hole-stage-footer i { width: 4px; height: 4px; border-radius: 50%; background: #f1b96d; box-shadow: 0 0 9px #dba970; }
.hole-controls { display: flex; align-items: center; justify-content: space-between; gap: 32px; padding: 13px 42px 25px; }
.hole-sliders { display: flex; gap: 30px; width: min(100%, 500px); }
.hole-sliders label { flex: 1; min-width: 0; display: block; color: #f1e5ee; font-size: 11px; }
.hole-sliders label > span { display: flex; justify-content: space-between; margin-bottom: 10px; }
.hole-sliders output { color: #ffe0b3; font: 11px/1.5 Consolas, monospace; }
.hole-sliders input { display: block; width: 100%; height: 18px; margin: 0; accent-color: #e9b578; cursor: pointer; }
.hole-actions { display: flex; gap: 8px; }
.hole-actions button { display: flex; justify-content: center; align-items: center; gap: 8px; height: 40px; min-width: 76px; border: 1px solid #ffe4ca40; border-radius: 9px; background: #ffffff0a; color: #fff1e4; cursor: pointer; font-family: inherit; font-size: 11px; line-height: 1.5; }
.hole-actions button > span { font-size: 17px; line-height: 1; }
.hole-actions button:hover { color: #ffffff; background: #ffffff17; border-color: #ffe4ca80; }
.hole-actions button[aria-pressed='true'] { color: #ffe0b3; border-color: #ffe0b3aa; }
.black-hole button:disabled, .black-hole input:disabled { opacity: .4; cursor: default; }
.black-hole a:focus-visible, .black-hole button:focus-visible, .black-hole input:focus-visible { outline: 2px solid #e9b578; outline-offset: 4px; }
.hole-caption { display: flex; justify-content: space-between; align-items: center; gap: 18px; border-top: 1px solid #ffffff24; padding: 22px 42px 25px; background: transparent; }
.hole-caption p { margin: 0; color: #fff0df; font-size: 14px; letter-spacing: .5px; }
.hole-caption > span { color: #e2d6e8; font-size: 11px; line-height: 1.8; }
.hole-fallback { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.fallback-ring { position: absolute; width: 165px; height: 165px; border: 5px solid #ffdc92; border-radius: 50%; box-shadow: 0 0 9px #ffbd6b, 0 0 30px #b96834; }
.fallback-disk { position: absolute; width: 70%; height: 28px; border: 10px solid #ecb66a; border-radius: 50%; transform: rotate(-3deg); filter: blur(2px); box-shadow: 0 0 20px #b96834; }
.fallback-core { position: absolute; width: 151px; height: 151px; background: #010206; border-radius: 50%; box-shadow: inset 0 -8px 8px #ffb04918; }
.hole-fallback > span { position: absolute; bottom: 65px; color: #f4d9b8; font-size: 11px; }
@media (max-width: 760px) {
  .hole-intro { padding: 26px 24px 0; }
  .hole-description { display: none; }
  .hole-stage { height: 350px; margin-top: 15px; }
  .hole-marker { display: none; }
  .hole-stage-footer { left: 24px; right: 24px; font-size: 9px; letter-spacing: 0; }
  .hole-controls { padding: 10px 24px 22px; gap: 16px; flex-wrap: wrap; }
  .hole-sliders { width: 100%; gap: 24px; }
  .hole-actions { margin-left: auto; }
  .hole-caption { padding: 20px 24px 23px; flex-direction: column; align-items: flex-start; gap: 7px; }
  .orbit-project-1 { left: 17%; top: 7%; }
  .orbit-project-2 { right: 9%; top: 69%; }
  .orbit-project-3 { left: 9%; top: 73%; }
}
@media (max-width: 420px) {
  .hole-intro { padding-inline: 18px; }
  .hole-stage { height: 300px; }
  .hole-stage-footer { left: 18px; right: 18px; }
  .hole-stage-footer > span:last-child { font-size: 8px; }
  .hole-controls, .hole-caption { padding-inline: 18px; }
  .hole-sliders { gap: 20px; }
  .hole-eyebrow { font-size: 9px; }
  .hole-fallback > span { bottom: 48px; }
}
@media (prefers-reduced-motion: reduce) { .black-hole * { transition: none !important; } }
</style>
