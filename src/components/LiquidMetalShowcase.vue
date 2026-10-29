<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { profileConfig } from "@/config/profile";
import { createLiquidMetal, type MetalFinish } from "@/lib/liquidMetal";

const canvas = ref<HTMLCanvasElement | null>(null);
const finish = ref<MetalFinish>(1);
const flow = ref(100);
const paused = ref(false);
const ready = ref(false);
const unavailable = ref(false);
const finishes = [
  { id: 0 as const, name: "银铬", subtitle: "CHROME", color: "#c5d8ee" },
  { id: 1 as const, name: "熔金", subtitle: "GOLD", color: "#e8bb71" },
  { id: 2 as const, name: "幻彩", subtitle: "IRIDESCENT", color: "#bb9bf4" },
];
const blog = profileConfig.projects.find((project) => project.name === "个人博客");
let renderer: ReturnType<typeof createLiquidMetal> | undefined;

function chooseFinish(value: MetalFinish) { finish.value = value; renderer?.setFinish(value); }
function changeFlow(event: Event) { flow.value = Number((event.target as HTMLInputElement).value); renderer?.setFlow(flow.value / 100); }
function togglePause() { paused.value = !paused.value; renderer?.setPaused(paused.value); }
function reset() { flow.value = 100; renderer?.setFlow(1); renderer?.reset(); }

onMounted(() => {
  if (!canvas.value) return;
  try {
    renderer = createLiquidMetal(canvas.value, {
      name: profileConfig.name,
      initialFinish: finish.value,
      onReady: () => { ready.value = true; unavailable.value = false; },
      onUnavailable: () => { unavailable.value = true; },
    });
  } catch { unavailable.value = true; }
});
onUnmounted(() => renderer?.destroy());
</script>

<template>
  <section class="metal-exhibit" aria-labelledby="metal-heading" :style="{ '--metal-accent': finishes[finish]?.color }">
    <div class="metal-intro">
      <div><p class="metal-eyebrow">LIQUID IDENTITY</p><h2 id="metal-heading">灵感流动，<span>自有光泽。</span></h2></div>
      <p class="metal-invitation">一个名字，三种光感。<br /><span>移动指针，塑造属于你的反光。</span></p>
    </div>
    <div class="metal-stage">
      <canvas ref="canvas" aria-hidden="true"></canvas>
      <div v-if="!ready || unavailable" class="metal-fallback" aria-hidden="true"><strong>{{ profileConfig.name }}</strong><span>{{ unavailable ? '静态金属预览 · 仍可探索下方作品' : '正在打磨光泽…' }}</span></div>
      <div class="metal-corner metal-corner-tl" aria-hidden="true"></div><div class="metal-corner metal-corner-br" aria-hidden="true"></div>
      <div class="metal-stage-label" aria-hidden="true"><span>GL / MATERIAL STUDY</span><span>{{ finishes[finish]?.subtitle }} — 0{{ finish + 1 }}</span></div>
    </div>
    <div class="metal-toolbar">
      <div class="metal-finishes" role="group" aria-label="选择金属材质">
        <button v-for="material in finishes" :key="material.id" type="button" :aria-pressed="finish === material.id" :class="{ selected: finish === material.id }" @click="chooseFinish(material.id)"><i :class="`swatch-${material.id}`" aria-hidden="true"></i>{{ material.name }}</button>
      </div>
      <div v-if="!unavailable" class="metal-controls">
        <label class="metal-flow">流动感<input type="range" min="0" max="170" step="5" :value="flow" aria-label="金属流动强度" @input="changeFlow" /></label>
        <button type="button" class="metal-action" aria-label="重置金属流动" title="重置流动" @click="reset"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 8a8 8 0 1 0 1 7M19 3v5h-5" /></svg></button>
        <button type="button" class="metal-action" :aria-label="paused ? '继续金属动画' : '暂停金属动画'" :aria-pressed="paused" @click="togglePause"><svg v-if="paused" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 11 7-11 7Z" /></svg><svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5v14M16 5v14" /></svg></button>
      </div>
    </div>
    <div class="metal-bottom"><div><h3>把想法打磨成自己的形状。</h3><p>记录每一次探索，让代码、设计和新的灵感，在这里相遇。</p></div><a :href="blog?.url ?? '#projects'" :target="blog ? '_blank' : undefined" :rel="blog ? 'noopener noreferrer' : undefined">走进我的博客<span aria-hidden="true">↗</span></a></div>
  </section>
</template>

<style scoped>
.metal-exhibit { --metal-accent: #c5d8ee; color: #fff; background: transparent; }
.metal-intro, .metal-toolbar, .metal-bottom { padding-inline: 42px; }
.metal-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding-top: 32px; }
.metal-eyebrow { margin: 0 0 10px; font: 10px/1.6 Consolas, monospace; letter-spacing: 4px; color: var(--metal-accent); }
.metal-intro h2 { margin: 0; font-size: clamp(28px, 3vw, 42px); font-weight: 600; letter-spacing: -1.5px; line-height: 1.3; }
.metal-intro h2 span { color: #ffffffe0; }
.metal-invitation { margin: 0 0 3px; color: #fffffff0; font-size: 12px; line-height: 1.9; text-align: right; }
.metal-invitation span { color: #ffffffbd; }
.metal-stage { height: clamp(320px, 35vw, 420px); position: relative; margin-top: 22px; overflow: hidden; }
.metal-stage canvas { display: block; width: 100%; height: 100%; background: transparent; touch-action: pan-y; cursor: crosshair; }
.metal-stage-label { position: absolute; inset: auto 42px 24px; display: flex; justify-content: space-between; color: #ffffffb8; font: 9px/1.5 Consolas, monospace; letter-spacing: 2px; pointer-events: none; }
.metal-corner { position: absolute; width: 24px; height: 24px; border-color: #ffffff38; border-style: solid; pointer-events: none; }
.metal-corner-tl { left: 42px; top: 20px; border-width: 1px 0 0 1px; }
.metal-corner-br { right: 42px; bottom: 65px; border-width: 0 1px 1px 0; }
.metal-fallback { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px; background: transparent; }
.metal-fallback strong { font-size: clamp(64px, 13vw, 180px); letter-spacing: -.06em; color: #d8e3ed; background: linear-gradient(150deg, #fff 15%, #657183 35%, #f2f7ff 48%, #3c4858 60%, #e2edff 85%); background-clip: text; -webkit-text-fill-color: transparent; }
.metal-fallback span { font-size: 12px; color: #ffffffbd; }
.metal-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 18px; padding-block: 16px 25px; border-bottom: 1px solid #ffffff26; }
.metal-finishes, .metal-controls { display: flex; align-items: center; gap: 8px; }
.metal-finishes { padding: 5px; border-radius: 13px; background: #ffffff0c; border: 1px solid #ffffff26; }
.metal-finishes button { display: flex; align-items: center; justify-content: center; gap: 9px; min-height: 40px; min-width: 88px; border: 1px solid transparent; border-radius: 9px; background: transparent; color: #ffffffe0; font: inherit; font-size: 12px; cursor: pointer; transition: background .2s, color .2s; }
.metal-finishes button:hover { color: #fff; background: #ffffff16; }
.metal-finishes button.selected { color: #fff; background: #ffffff22; border-color: #ffffff40; box-shadow: inset 0 1px 0 #ffffff20; }
.metal-finishes i { height: 14px; width: 14px; border-radius: 50%; border: 1px solid #ffffff50; box-shadow: inset 0 0 3px #ffffff40; }
.swatch-0 { background: linear-gradient(130deg, #eef4ff, #56657e 50%, #d6e4ff); }.swatch-1 { background: linear-gradient(130deg, #fff0b5, #8c5c21 50%, #f2bf6b); }.swatch-2 { background: linear-gradient(130deg, #b2ffec, #9f7bdc 45%, #ffafc4); }
.metal-flow { display: flex; align-items: center; gap: 13px; margin-right: 12px; font-size: 11px; color: #ffffffe0; white-space: nowrap; }
.metal-flow input { width: 96px; accent-color: var(--metal-accent); cursor: ew-resize; }
.metal-action { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid #ffffff38; border-radius: 50%; background: #ffffff0c; color: #fffffff0; cursor: pointer; }
.metal-action:hover { color: #fff; border-color: #ffffff80; background: #ffffff22; }
.metal-action svg { width: 17px; height: 17px; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.metal-bottom { display: flex; justify-content: space-between; align-items: center; gap: 28px; padding-block: 26px 32px; }
.metal-bottom h3 { margin: 0 0 7px; font-size: 16px; color: #fff; font-weight: 500; }
.metal-bottom p { margin: 0; font-size: 12px; line-height: 1.8; color: #ffffffc4; }
.metal-bottom a { display: inline-flex; align-items: center; justify-content: space-between; gap: 34px; padding: 12px 17px; border: 1px solid #ffffff40; border-radius: 10px; background: #ffffff12; color: #fff; text-decoration: none; font-size: 12px; white-space: nowrap; transition: background .2s; }
.metal-bottom a:hover { background: #ffffff26; }.metal-bottom a span { font-size: 18px; color: #ffffffe8; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid var(--metal-accent); outline-offset: 4px; }
@media (max-width: 760px) { .metal-intro, .metal-toolbar, .metal-bottom { padding-inline: 24px; }.metal-invitation { display: none; }.metal-stage { height: 320px; margin-top: 10px; }.metal-stage-label { inset-inline: 24px; font-size: 8px; letter-spacing: 1px; }.metal-corner-tl { left: 24px; }.metal-corner-br { right: 24px; }.metal-toolbar { flex-wrap: wrap; justify-content: space-between; gap: 18px; }.metal-finishes { flex: 1; }.metal-finishes button { flex: 1; min-width: 70px; }.metal-controls { justify-content: flex-end; width: 100%; }.metal-flow { margin-right: auto; }.metal-flow input { width: 110px; }.metal-bottom { align-items: flex-start; flex-direction: column; gap: 20px; }.metal-bottom a { align-self: flex-start; }.metal-bottom p { max-width: 35em; } }
@media (max-width: 420px) { .metal-intro, .metal-toolbar, .metal-bottom { padding-inline: 20px; }.metal-stage { height: 290px; }.metal-intro h2 { font-size: 27px; }.metal-stage-label { inset-inline: 20px; letter-spacing: .5px; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
