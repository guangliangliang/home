<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { profileConfig } from "@/config/profile";
import { createParticleAtlas } from "@/lib/particleAtlas";

defineProps<{ embedded?: boolean }>();

type Scene = "identity" | "ai" | "games" | "map";
const canvas = ref<HTMLCanvasElement | null>(null);
const activeScene = ref<Scene>("identity");
const paused = ref(false);
const ready = ref(false);
const unavailable = ref(false);
let atlas: ReturnType<typeof createParticleAtlas> | undefined;

const project = (name: string) => profileConfig.projects.find((item) => item.name === name);
const scenes = [
  { id: "identity" as const, label: "光亮亮", code: "01", title: "每一束光，都有一个想法。", description: "从一个念头，到一个可以触摸的作品。这里是我的创作宇宙。", href: "#projects", cta: "探索我的作品", color: "120, 210, 255" },
  { id: "ai" as const, label: "人工智能", code: "02", title: "让好奇心，连接更多可能。", description: "探索 AI 工具与应用，让新的想法在这里相遇。", href: project("AI工具集")?.url ?? "#projects", cta: "打开 AI 工具集", color: "175, 146, 255" },
  { id: "games" as const, label: "游戏世界", code: "03", title: "认真创造，也尽情玩耍。", description: "把规则变成乐趣，把想象变成可以亲手体验的小世界。", href: project("游戏集合")?.url ?? "#projects", cta: "进入游戏世界", color: "255, 148, 207" },
  { id: "map" as const, label: "地图探索", code: "04", title: "世界很大，下一站由你决定。", description: "让坐标连接成风景，探索地图中的交互与可能。", href: project("地图功能展示")?.url ?? "#projects", cta: "探索地图项目", color: "107, 239, 217" },
];
const current = computed(() => scenes.find((scene) => scene.id === activeScene.value)!);

function selectScene(scene: Scene) {
  if (activeScene.value === scene) {
    atlas?.burst();
    return;
  }
  activeScene.value = scene;
  atlas?.setScene(scene);
}

function togglePause() {
  paused.value = !paused.value;
  atlas?.setPaused(paused.value);
}

onMounted(() => {
  if (!canvas.value) return;
  try {
    atlas = createParticleAtlas(canvas.value, {
      onReady: () => { ready.value = true; unavailable.value = false; },
      onUnavailable: () => { unavailable.value = true; },
    });
  } catch {
    unavailable.value = true;
  }
});

onUnmounted(() => atlas?.destroy());
</script>

<template>
  <section :id="embedded ? undefined : 'particle-lab'" class="atlas" :class="{ 'atlas-embedded': embedded }" :style="{ '--atlas-accent': current.color }" aria-labelledby="atlas-heading">
    <div v-if="!embedded" class="atlas-topline">
      <span class="atlas-label"><span class="atlas-spark" aria-hidden="true">✳</span> 光亮亮实验室</span>
      <span class="atlas-edition">INTERACTIVE EXHIBIT <span>/ 001</span></span>
    </div>

    <div class="atlas-intro">
      <div>
        <p class="atlas-eyebrow">PARTICLE ATLAS</p>
        <h2 id="atlas-heading">把灵感，<span>聚成光。</span></h2>
      </div>
      <p class="atlas-invitation">一个名字，无限种可能。<br /><span>选择一个世界，看星尘重新成形。</span></p>
    </div>

    <div class="atlas-stage" :class="{ 'is-ready': ready, 'is-unavailable': unavailable }">
      <div class="atlas-halo" aria-hidden="true"></div>
      <div class="atlas-orbit atlas-orbit-one" aria-hidden="true"></div>
      <div class="atlas-orbit atlas-orbit-two" aria-hidden="true"></div>
      <canvas ref="canvas" class="atlas-canvas" aria-hidden="true" @click="atlas?.burst()"></canvas>
      <div v-if="unavailable || !ready" class="atlas-fallback" aria-hidden="true">
        <span>{{ current.label }}</span>
        <small>{{ unavailable ? '此设备显示静态预览 · 下方仍可探索作品' : '星尘正在聚拢…' }}</small>
      </div>
      <div class="atlas-stage-meta" aria-hidden="true">
        <span><i></i>{{ current.code }} / {{ current.label }}</span>
        <span v-if="!unavailable" class="atlas-pointer-hint">移动指针 · 点击重组</span>
      </div>
    </div>

    <div class="atlas-toolbar">
      <div class="atlas-scenes" role="group" aria-label="选择粒子形态">
        <button v-for="scene in scenes" :key="scene.id" type="button" :aria-pressed="activeScene === scene.id" :class="{ 'is-selected': activeScene === scene.id }" @click="selectScene(scene.id)">
          <span class="scene-number">{{ scene.code }}</span>{{ scene.label }}
        </button>
      </div>
      <div v-if="!unavailable" class="atlas-actions">
        <button type="button" class="atlas-icon-button" aria-label="重新聚合粒子" title="重新聚合粒子" @click="atlas?.burst()">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 8a8 8 0 1 0 1 7M19 3v5h-5" /></svg>
        </button>
        <button type="button" class="atlas-icon-button" :aria-label="paused ? '继续粒子动画' : '暂停粒子动画'" :title="paused ? '继续动画' : '暂停动画'" :aria-pressed="paused" @click="togglePause">
          <svg v-if="paused" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 11 7-11 7Z" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5v14M16 5v14" /></svg>
        </button>
      </div>
    </div>

    <div class="atlas-bottom">
      <div class="atlas-story" aria-live="polite" aria-atomic="true">
        <h3>{{ current.title }}</h3>
        <p>{{ current.description }}</p>
      </div>
      <a class="atlas-link" :href="current.href" :target="current.href.startsWith('#') ? undefined : '_blank'" :rel="current.href.startsWith('#') ? undefined : 'noopener noreferrer'">
        {{ current.cta }}<span aria-hidden="true">↗</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.atlas {
  --atlas-accent: 120, 210, 255;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  margin-bottom: 30px;
  border: 1px solid rgba(165, 192, 241, .22);
  border-radius: 26px;
  background: #070a14;
  color: #f3f6ff;
  box-shadow: 0 24px 80px #08092040, inset 0 1px 0 #ffffff08;
  scroll-margin-top: 24px;
}
.atlas::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 72% 22%, #34225635, transparent 58%), radial-gradient(ellipse at 20% 60%, #16385430, transparent 50%);
}
.atlas.atlas-embedded { margin: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
.atlas-embedded::before { background: radial-gradient(ellipse at 50% 48%, rgba(var(--atlas-accent), .07), transparent 65%); }
.atlas-topline, .atlas-intro, .atlas-toolbar, .atlas-bottom { padding-inline: 42px; }
.atlas-topline { display: flex; justify-content: space-between; align-items: center; padding-top: 26px; }
.atlas-label { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; letter-spacing: 1px; color: #d9e7f8; }
.atlas-spark { color: rgb(var(--atlas-accent)); font-size: 24px; line-height: 1; }
.atlas-edition { font: 10px/1.5 Consolas, monospace; letter-spacing: 2px; color: #8a94ac; }
.atlas-edition span { margin-left: 10px; color: #c4cde0; }
.atlas-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding-top: 34px; }
.atlas-eyebrow { margin: 0 0 10px; font: 10px/1.6 Consolas, monospace; letter-spacing: 4px; color: rgb(var(--atlas-accent)); }
.atlas-intro h2 { margin: 0; font-size: clamp(28px, 3vw, 42px); letter-spacing: -1.5px; font-weight: 600; line-height: 1.3; }
.atlas-intro h2 span { color: #a7b5d0; }
.atlas-invitation { margin: 0 0 3px; color: #c2cbdf; font-size: 12px; line-height: 1.9; text-align: right; }
.atlas-invitation span { color: #8e9bb3; }
.atlas-stage { position: relative; height: clamp(300px, 32vw, 410px); margin-top: 0; }
.atlas-canvas { display: block; position: absolute; inset: 0; width: 100%; height: 100%; cursor: crosshair; touch-action: pan-y; }
.atlas-halo { position: absolute; inset: 6% 12%; opacity: .75; background: radial-gradient(ellipse, rgba(var(--atlas-accent), .09), transparent 64%); transition: background 1s ease; pointer-events: none; }
.atlas-orbit { position: absolute; width: 57%; height: 38%; left: 21.5%; top: 34%; border: 1px solid rgba(var(--atlas-accent), .12); border-radius: 50%; pointer-events: none; }
.atlas-orbit-one { transform: rotate(-15deg); }
.atlas-orbit-two { transform: rotate(15deg); opacity: .4; }
.atlas-stage-meta { position: absolute; bottom: 20px; left: 42px; right: 42px; display: flex; justify-content: space-between; gap: 16px; color: #8997b0; font: 10px/1.5 Consolas, "Microsoft YaHei", sans-serif; letter-spacing: 1px; pointer-events: none; }
.atlas-stage-meta span:first-child { display: flex; align-items: center; gap: 8px; }
.atlas-stage-meta i { width: 4px; height: 4px; border-radius: 50%; background: rgb(var(--atlas-accent)); box-shadow: 0 0 10px rgba(var(--atlas-accent), .7); }
.atlas-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-top: 10px; padding-bottom: 24px; }
.atlas-scenes { display: flex; gap: 6px; border: 1px solid #ffffff12; border-radius: 12px; padding: 5px; background: #ffffff03; }
.atlas button { font-family: inherit; cursor: pointer; }
.atlas-scenes button { display: flex; align-items: center; gap: 9px; min-height: 40px; border: 1px solid transparent; border-radius: 8px; background: transparent; padding: 0 17px; color: #a9b5cd; font-size: 12px; transition: color .2s, background .2s, border-color .2s; }
.atlas-scenes button:hover { color: #fff; background: #ffffff08; }
.atlas-scenes button.is-selected { border-color: rgba(var(--atlas-accent), .25); background: rgba(var(--atlas-accent), .09); color: #effaff; box-shadow: inset 0 0 20px rgba(var(--atlas-accent), .03); }
.scene-number { color: #76849e; font: 10px/1 Consolas, monospace; }
.is-selected .scene-number { color: rgb(var(--atlas-accent)); }
.atlas-actions { display: flex; gap: 8px; }
.atlas-icon-button { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid #ffffff1a; border-radius: 50%; background: transparent; color: #b2c0d6; }
.atlas-icon-button:hover { background: #ffffff0d; color: white; }
.atlas-icon-button[aria-pressed="true"] { color: rgb(var(--atlas-accent)); border-color: rgba(var(--atlas-accent), .35); }
.atlas-icon-button svg { width: 16px; height: 16px; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.atlas-bottom { display: flex; align-items: center; justify-content: space-between; gap: 24px; border-top: 1px solid #ffffff10; padding-block: 25px 28px; background: #ffffff02; }
.atlas-story { min-width: 0; }
.atlas-story h3 { font-size: 15px; font-weight: 500; letter-spacing: .5px; line-height: 1.5; margin: 0 0 7px; }
.atlas-story p { color: #94a2ba; font-size: 12px; line-height: 1.8; margin: 0; }
.atlas-link { display: flex; align-items: center; justify-content: space-between; gap: 30px; flex-shrink: 0; min-height: 44px; padding: 10px 18px; border: 1px solid rgba(var(--atlas-accent), .25); border-radius: 9px; color: #e6efff; background: rgba(var(--atlas-accent), .05); text-decoration: none; font-size: 12px; }
.atlas-link:hover { background: rgba(var(--atlas-accent), .13); border-color: rgba(var(--atlas-accent), .5); }
.atlas-link span { font-size: 20px; color: rgb(var(--atlas-accent)); }
.atlas button:focus-visible, .atlas a:focus-visible { outline: 2px solid rgb(var(--atlas-accent)); outline-offset: 4px; }
.atlas-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 20px; pointer-events: none; }
.atlas-fallback span { font-size: clamp(38px, 9vw, 100px); font-weight: 800; color: rgb(var(--atlas-accent)); text-shadow: 0 0 45px rgba(var(--atlas-accent), .4); }
.atlas-fallback small { font-size: 12px; color: #91a0ba; }
.atlas-embedded .atlas-intro h2 span { color: #ffffffb8; }
.atlas-embedded .atlas-invitation, .atlas-embedded .atlas-invitation span,
.atlas-embedded .atlas-stage-meta, .atlas-embedded .atlas-story p,
.atlas-embedded .scene-number { color: #ffffffbf; }
.atlas-embedded .atlas-scenes { border-color: #ffffff29; background: #ffffff06; }
.atlas-embedded .atlas-scenes button { color: #ffffffe0; }
.atlas-embedded .atlas-scenes button.is-selected { background: #ffffff1f; border-color: #ffffff4d; color: #fff; }
.atlas-embedded .atlas-icon-button { border-color: #ffffff40; color: #fff; }
.atlas-embedded .atlas-bottom { border-top-color: #ffffff1f; background: #ffffff04; }
.atlas-embedded .atlas-link { color: #fff; border-color: #ffffff4d; background: #ffffff0a; }
.atlas-embedded .atlas-link:hover { background: #ffffff20; }
@media (max-width: 760px) {
  .atlas-topline, .atlas-intro, .atlas-toolbar, .atlas-bottom { padding-inline: 24px; }
  .atlas-edition { letter-spacing: 1px; font-size: 8px; }
  .atlas-edition span { display: none; }
  .atlas-intro { padding-top: 28px; }
  .atlas-invitation { display: none; }
  .atlas-stage { height: 300px; }
  .atlas-stage-meta { left: 24px; right: 24px; font-size: 9px; }
  .atlas-toolbar { align-items: flex-start; gap: 14px; flex-wrap: wrap; padding-bottom: 20px; }
  .atlas-scenes { width: 100%; }
  .atlas-scenes button { flex: 1; justify-content: center; padding-inline: 8px; gap: 6px; min-height: 43px; }
  .atlas-actions { margin-left: auto; }
  .atlas-bottom { flex-direction: column; align-items: stretch; gap: 18px; }
  .atlas-link { align-self: flex-start; }
}
@media (max-width: 420px) {
  .atlas { border-radius: 20px; }
  .atlas-topline, .atlas-intro, .atlas-toolbar, .atlas-bottom { padding-inline: 18px; }
  .atlas-label { font-size: 11px; letter-spacing: 0; }
  .atlas-stage { height: 260px; }
  .atlas-stage-meta { left: 18px; right: 18px; letter-spacing: 0; }
  .atlas-scenes { gap: 1px; padding: 4px; }
  .atlas-scenes button { padding-inline: 4px; font-size: 11px; }
  .scene-number { display: none; }
}
@media (hover: none) { .atlas-pointer-hint { display: none; } }
@media (prefers-reduced-motion: reduce) { .atlas *, .atlas::before { transition: none !important; } }
</style>
