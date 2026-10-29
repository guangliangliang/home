<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { createFlockField, type FlockMode } from '@/lib/flockField';

const canvas = ref<HTMLCanvasElement | null>(null);
const mode = ref<FlockMode>('birds');
const paused = ref(false);
const unavailable = ref(false);
let field: ReturnType<typeof createFlockField> | undefined;

function selectMode(value: FlockMode) { mode.value = value; field?.setMode(value); }
function togglePause() { paused.value = !paused.value; field?.setPaused(paused.value); }

onMounted(() => {
  if (!canvas.value) return;
  try { field = createFlockField(canvas.value, { onUnavailable: () => { unavailable.value = true; } }); }
  catch { unavailable.value = true; }
});
onUnmounted(() => field?.destroy());
</script>

<template>
  <section class="flock-showcase" aria-labelledby="flock-heading">
    <div class="flock-intro">
      <h3 id="flock-heading">{{ mode === 'birds' ? '风起时，一起飞。' : '潜入光的深处。' }}</h3>
      <p>移动鼠标或轻触驱散，离开后它们会重新聚拢。</p>
    </div>
    <div class="flock-stage">
      <canvas ref="canvas" aria-hidden="true"></canvas>
      <div v-if="unavailable" class="flock-fallback"><span aria-hidden="true">﹀ ﹀ ﹀</span><p>此设备暂时无法绘制群鸟，请试试其他展区。</p></div>
      <div class="flock-stage-note" aria-hidden="true"><span><i></i>{{ mode === 'birds' ? '夜航鸟群' : '微光鱼群' }}</span><span>{{ paused ? '时间已暂停' : '每一次靠近，都会改变方向' }}</span></div>
    </div>
    <div class="flock-toolbar">
      <div class="flock-modes" role="group" aria-label="选择群体形态">
        <button type="button" :aria-pressed="mode === 'birds'" :disabled="unavailable" @click="selectMode('birds')">夜航鸟群</button>
        <button type="button" :aria-pressed="mode === 'fish'" :disabled="unavailable" @click="selectMode('fish')">微光鱼群</button>
      </div>
      <div class="flock-actions">
        <button type="button" :disabled="unavailable || paused" @click="field?.scatter()">{{ mode === 'birds' ? '惊飞一下' : '惊散一下' }}</button>
        <button type="button" :disabled="unavailable" :aria-pressed="paused" :aria-label="paused ? '继续群体动画' : '暂停群体动画'" @click="togglePause"><span aria-hidden="true">{{ paused ? '▷' : 'Ⅱ' }}</span>{{ paused ? '继续' : '暂停' }}</button>
        <button type="button" :disabled="unavailable" @click="field?.reset()"><span aria-hidden="true">↺</span>重新聚拢</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.flock-showcase { padding: 24px 28px 20px; color: var(--text-primary, #f0f7ff); }
.flock-intro h3 { margin: 0; font-size: 28px; font-weight: 600; line-height: 1.35; letter-spacing: -.5px; }
.flock-intro p { margin: 9px 0 20px; color: var(--text-secondary, #c2d0e2); font-size: 12px; line-height: 1.8; }
.flock-stage { position: relative; height: 360px; overflow: hidden; border: 1px solid #8ccce52b; border-radius: 18px; background: #07101d; }
.flock-stage canvas { display: block; width: 100%; height: 100%; touch-action: pan-y; cursor: crosshair; }
.flock-stage-note { position: absolute; inset: auto 20px 17px; display: flex; justify-content: space-between; gap: 12px; color: #a1c0d2; font-size: 10px; line-height: 1.6; letter-spacing: .7px; pointer-events: none; }
.flock-stage-note span:first-child { color: #d0efff; }
.flock-stage-note i { display: inline-block; width: 4px; height: 4px; margin: 0 8px 2px 0; border-radius: 50%; background: #8ce6f5; box-shadow: 0 0 10px #8ce6f5; }
.flock-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-top: 16px; }
.flock-modes, .flock-actions { display: flex; gap: 6px; }
.flock-modes { padding: 4px; border: 1px solid var(--glass-border, #ffffff29); border-radius: 11px; background: #80c5ec08; }
.flock-toolbar button { min-height: 40px; border: 1px solid transparent; border-radius: 8px; padding: 7px 13px; background: transparent; color: inherit; font: inherit; font-size: 12px; cursor: pointer; }
.flock-modes button[aria-pressed="true"] { border-color: #7dcce66b; background: #6abdda24; }
.flock-toolbar button:hover { background: #73bcda20; }
.flock-actions button { display: flex; align-items: center; gap: 7px; border-color: var(--glass-border, #ffffff30); }
.flock-actions button[aria-pressed="true"] { background: #6abdda24; }
.flock-actions span { font-size: 16px; line-height: 1; }
.flock-toolbar button:focus-visible { outline: 2px solid #80d8f5; outline-offset: 3px; }
.flock-toolbar button:disabled { opacity: .5; cursor: default; }
.flock-fallback { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; color: #cce8f7; }
.flock-fallback > span { color: #91d7eb; font-size: 70px; letter-spacing: 5px; }
.flock-fallback p { font-size: 12px; line-height: 1.8; }
@media (max-width: 760px) {
  .flock-showcase { padding: 22px 20px 18px; }
  .flock-intro h3 { font-size: 24px; }
  .flock-intro p { font-size: 11px; margin-bottom: 16px; }
  .flock-stage { height: 280px; border-radius: 14px; }
  .flock-stage-note { inset: auto 14px 14px; font-size: 9px; letter-spacing: 0; }
  .flock-toolbar { gap: 10px; }
  .flock-toolbar button { padding-inline: 10px; font-size: 11px; }
}
@media (max-width: 420px) {
  .flock-actions { margin-left: auto; }
  .flock-stage-note span:last-child { display: none; }
}
</style>
