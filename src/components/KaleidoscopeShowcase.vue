<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { createKaleidoscope, type KaleidoscopePalette, type KaleidoscopeSymmetry } from "@/lib/kaleidoscope";

const canvas = ref<HTMLCanvasElement | null>(null);
const symmetry = ref<KaleidoscopeSymmetry>(8);
const palette = ref<KaleidoscopePalette>("electric");
const unavailable = ref(false);
const message = ref("拖动绘画，松开换一种颜色。");
const symmetries = [6, 8, 12] as const;
const palettes = [
  { id: "electric" as const, name: "电光", color: "linear-gradient(135deg, #77eaff, #ff7edb)" },
  { id: "sunset" as const, name: "落日", color: "linear-gradient(135deg, #ffe8a6, #ff6aa8)" },
  { id: "aurora" as const, name: "极光", color: "linear-gradient(135deg, #beff9a, #81caff)" },
];
let renderer: ReturnType<typeof createKaleidoscope> | undefined;

function chooseSymmetry(value: KaleidoscopeSymmetry) { symmetry.value = value; renderer?.setSymmetry(value); }
function choosePalette(value: KaleidoscopePalette) { palette.value = value; renderer?.setPalette(value); }
function clear() { renderer?.clear(); message.value = "画布已清空，画下第一笔吧。"; }
function showExample() { renderer?.showExample(); message.value = "换了一朵新花，也可以继续添一笔。"; }

onMounted(() => {
  if (!canvas.value) return;
  try {
    renderer = createKaleidoscope(canvas.value, {
      symmetry: symmetry.value,
      palette: palette.value,
      onDraw: () => { message.value = "松开换色，继续画出你的对称宇宙。"; },
    });
  } catch { unavailable.value = true; }
});
onUnmounted(() => renderer?.destroy());
</script>

<template>
  <section class="kaleido-exhibit" aria-labelledby="kaleido-heading">
    <div class="kaleido-intro">
      <h2 id="kaleido-heading">一笔，绽放万象。</h2>
      <p id="kaleido-instruction">拖动画出镜像花纹 · 每一笔都有回响</p>
    </div>
    <div class="kaleido-stage">
      <canvas ref="canvas" role="img" aria-label="霓虹万花筒绘画画布，可使用鼠标或手指拖动绘画" aria-describedby="kaleido-instruction"></canvas>
      <div class="kaleido-stage-top" aria-hidden="true"><span><i></i> NEON KALEIDOSCOPE</span><span>{{ symmetry }} FOLD</span></div>
      <div v-if="unavailable" class="kaleido-fallback"><span aria-hidden="true">✳</span><p>当前浏览器暂不支持画布绘画</p></div>
      <p v-else class="kaleido-stage-hint" aria-live="polite">{{ message }}</p>
    </div>
    <div v-if="!unavailable" class="kaleido-toolbar">
      <div class="kaleido-group" role="group" aria-label="选择万花筒对称数量">
        <button v-for="value in symmetries" :key="value" type="button" :aria-pressed="symmetry === value" :class="{ selected: symmetry === value }" @click="chooseSymmetry(value)">{{ value }} 重</button>
      </div>
      <div class="kaleido-group kaleido-palettes" role="group" aria-label="选择万花筒配色">
        <button v-for="option in palettes" :key="option.id" type="button" :aria-pressed="palette === option.id" :class="{ selected: palette === option.id }" @click="choosePalette(option.id)"><i :style="{ background: option.color }" aria-hidden="true"></i>{{ option.name }}</button>
      </div>
      <div class="kaleido-actions">
        <button type="button" aria-label="清空万花筒画布" @click="clear">清空</button>
        <button type="button" aria-label="生成新的万花筒示范花纹" @click="showExample"><span aria-hidden="true">↻</span> 换个花样</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.kaleido-exhibit { color: #fff; }
.kaleido-intro { padding: 24px 28px 18px; display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 9px 18px; }
.kaleido-intro h2 { margin: 0; font-size: 28px; line-height: 1.35; font-weight: 600; letter-spacing: -.5px; }
.kaleido-intro p { margin: 0; color: #ffffffe0; font-size: 12px; line-height: 1.7; }
.kaleido-stage { position: relative; height: 360px; margin-inline: 28px; overflow: hidden; border: 1px solid #bccdff35; border-radius: 18px; background: #070b20; box-shadow: inset 0 0 50px #030512; }
.kaleido-stage canvas { display: block; width: 100%; height: 100%; cursor: crosshair; touch-action: none; }
.kaleido-stage-top { position: absolute; inset: 18px 20px auto; display: flex; justify-content: space-between; gap: 12px; color: #b7c6df; font: 9px/1.5 Consolas, monospace; letter-spacing: 1.6px; pointer-events: none; }
.kaleido-stage-top > span:first-child { display: flex; align-items: center; gap: 7px; }
.kaleido-stage-top i { width: 4px; height: 4px; border-radius: 50%; background: #9deaff; box-shadow: 0 0 9px #7bdfff; }
.kaleido-stage-hint { position: absolute; margin: 0; bottom: 16px; inset-inline: 10px; color: #d4def0; font-size: 11px; text-align: center; pointer-events: none; text-shadow: 0 1px 5px #000; }
.kaleido-toolbar { padding: 18px 28px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.kaleido-group, .kaleido-actions { display: flex; align-items: center; gap: 4px; }
.kaleido-group { padding: 4px; border: 1px solid #ffffff30; border-radius: 11px; background: #ffffff08; }
.kaleido-toolbar button { display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 36px; padding: 7px 11px; border: 1px solid transparent; border-radius: 7px; background: transparent; color: #ffffffe6; font: inherit; font-size: 12px; white-space: nowrap; cursor: pointer; }
.kaleido-toolbar button:hover { background: #ffffff16; color: #fff; }
.kaleido-toolbar button.selected { border-color: #ffffff38; background: #ffffff22; color: #fff; }
.kaleido-toolbar button:focus-visible { outline: 2px solid #bceeff; outline-offset: 3px; }
.kaleido-palettes i { display: block; width: 12px; height: 12px; border-radius: 50%; border: 1px solid #ffffff70; }
.kaleido-actions { margin-left: auto; }
.kaleido-actions button { border-color: #ffffff32; min-height: 40px; padding-inline: 13px; }
.kaleido-actions span { font-size: 18px; line-height: 1; }
.kaleido-fallback { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(ellipse, #292650, #070b20); }
.kaleido-fallback > span { color: #b1c9ff; font-size: 140px; line-height: 1.2; text-shadow: 0 0 40px #aa70ff; }
.kaleido-fallback p { font-size: 12px; color: #d4def0; }
@media (max-width: 760px) {
  .kaleido-intro { padding: 22px 20px 16px; }
  .kaleido-intro h2 { font-size: 24px; }
  .kaleido-intro p { font-size: 11px; }
  .kaleido-stage { height: 280px; margin-inline: 16px; border-radius: 14px; }
  .kaleido-stage-top { inset: 14px 14px auto; font-size: 8px; letter-spacing: 1px; }
  .kaleido-stage-hint { bottom: 12px; font-size: 10px; }
  .kaleido-toolbar { padding: 16px 20px 22px; justify-content: flex-start; gap: 10px; }
  .kaleido-toolbar button { padding-inline: 9px; font-size: 11px; }
  .kaleido-actions { width: 100%; margin-left: 0; justify-content: flex-end; }
}
</style>
