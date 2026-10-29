<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { createWaterCaustics } from '@/lib/waterCaustics';

const canvas = ref<HTMLCanvasElement | null>(null);
const unavailable = ref(false);
const paused = ref(false);
const strength = ref(100);
let renderer: ReturnType<typeof createWaterCaustics> | undefined;

function togglePause() {
  paused.value = !paused.value;
  renderer?.setPaused(paused.value);
}
function setStrength(event: Event) {
  strength.value = Number((event.target as HTMLInputElement).value);
  renderer?.setStrength(strength.value / 100);
}
function reset() {
  strength.value = 100;
  renderer?.setStrength(1);
  renderer?.reset();
}
onMounted(() => {
  if (!canvas.value) return;
  renderer = createWaterCaustics(canvas.value, {
    onReady: () => { unavailable.value = false; },
    onUnavailable: () => { unavailable.value = true; },
  });
});
onUnmounted(() => renderer?.destroy());
</script>

<template>
  <section class="water-showcase" aria-labelledby="water-heading">
    <header class="water-intro">
      <h2 id="water-heading">轻触，<span>光便有了波纹。</span></h2>
      <p id="water-help">点击落下一滴水，拖动搅起涟漪。</p>
    </header>
    <div class="water-stage" :class="{ 'is-paused': paused }">
      <canvas ref="canvas" class="water-canvas" :tabindex="unavailable ? -1 : 0" role="img" aria-label="可互动的青蓝水面，按 Enter 或空格在中央投下一滴水" aria-describedby="water-help"></canvas>
      <div v-if="unavailable" class="water-fallback" role="status"><i></i><i></i><span>静态水光 · 当前设备暂不支持水面互动</span></div>
      <span v-else class="water-stage-note">{{ paused ? '水光已暂停' : '每一次触碰，都有回响' }}</span>
    </div>
    <div class="water-toolbar">
      <label class="water-intensity" for="water-strength"><span>波光强度 <output for="water-strength">{{ strength }}%</output></span><input id="water-strength" type="range" min="40" max="180" step="5" :value="strength" :disabled="unavailable" @input="setStrength" /></label>
      <div class="water-actions">
        <button type="button" :disabled="unavailable" @click="renderer?.drop()"><span aria-hidden="true">◉</span>落下一滴</button>
        <button type="button" :disabled="unavailable" :aria-pressed="paused" :aria-label="paused ? '继续水面动画' : '暂停水面动画'" @click="togglePause"><span aria-hidden="true">{{ paused ? '▷' : 'Ⅱ' }}</span>{{ paused ? '继续' : '暂停' }}</button>
        <button type="button" :disabled="unavailable" @click="reset"><span aria-hidden="true">↺</span>重置</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.water-showcase { color: #fff; overflow: hidden; }
.water-intro { padding: 24px 28px 18px; }
.water-intro h2 { margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -.5px; line-height: 1.4; }
.water-intro h2 span { color: #c3fff2; }
.water-intro p { margin: 8px 0 0; color: #ffffffe0; font-size: 12px; line-height: 1.8; }
.water-stage { position: relative; height: 360px; margin: 0 28px; border: 1px solid #b3ffed33; border-radius: 16px; background: #062d3d; overflow: hidden; isolation: isolate; }
.water-canvas { display: block; width: 100%; height: 100%; cursor: crosshair; touch-action: none; }
.water-stage-note { position: absolute; bottom: 16px; left: 20px; color: #ddfff6e6; font-size: 11px; letter-spacing: 2px; text-shadow: 0 1px 8px #001b28; pointer-events: none; }
.water-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 18px 24px; padding: 20px 28px 24px; }
.water-intensity { width: min(240px, 100%); flex: 1 1 160px; color: #f1fffc; font-size: 11px; }
.water-intensity > span { display: flex; justify-content: space-between; margin-bottom: 8px; }
.water-intensity output { color: #c3fff2; font-variant-numeric: tabular-nums; }
.water-intensity input { display: block; width: 100%; margin: 0; min-height: 22px; accent-color: #93edda; cursor: pointer; }
.water-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.water-actions button { display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px; padding: 8px 13px; border: 1px solid #c7fff43d; border-radius: 9px; background: #ffffff0c; color: #f2fffc; font: inherit; font-size: 12px; cursor: pointer; }
.water-actions button:hover { background: #ffffff20; border-color: #c7fff480; }
.water-actions button[aria-pressed='true'] { background: #b7fff224; border-color: #c7fff4a0; }
.water-showcase button:disabled, .water-showcase input:disabled { opacity: .45; cursor: default; }
.water-showcase button:focus-visible, .water-showcase input:focus-visible, .water-canvas:focus-visible { outline: 2px solid #c3fff2; outline-offset: -3px; }
.water-fallback { position: absolute; inset: 0; display: grid; place-items: center; background: radial-gradient(ellipse at 35% 30%, #4cc6bd77, transparent 65%), repeating-radial-gradient(ellipse at 40% 50%, #41c1c125 0 2px, transparent 3px 21px), #073343; pointer-events: none; }
.water-fallback i { position: absolute; width: 160px; height: 160px; border: 2px solid #a6fbe466; border-radius: 50%; box-shadow: 0 0 20px #67ffe533, inset 0 0 20px #67ffe533; }
.water-fallback i:nth-child(2) { width: 260px; height: 260px; opacity: .4; }
.water-fallback span { align-self: end; margin-bottom: 24px; color: #c9f7ef; font-size: 11px; }
@media (max-width: 760px) {
  .water-intro { padding: 22px 20px 16px; }
  .water-intro h2 { font-size: 24px; }
  .water-stage { height: 280px; margin-inline: 16px; border-radius: 13px; }
  .water-toolbar { padding: 18px 20px 22px; gap: 15px; }
  .water-intensity { flex-basis: 100%; width: 100%; max-width: none; }
  .water-actions { width: 100%; }
  .water-actions button { flex: 1; padding-inline: 8px; }
  .water-stage-note { font-size: 10px; left: 15px; letter-spacing: 1px; }
}
</style>
