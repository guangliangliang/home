<script setup lang="ts">
import { computed, ref } from "vue";
import ParticleShowcase from "@/components/ParticleShowcase.vue";
import BlackHoleShowcase from "@/components/BlackHoleShowcase.vue";
import LiquidMetalShowcase from "@/components/LiquidMetalShowcase.vue";
import SpatialGallery from "@/components/SpatialGallery.vue";

const exhibits = [
  { id: "metal", name: "液态金属", number: "01", english: "LIQUID METAL", color: "232, 187, 113", path: "M12 3c-2 4.8-7 7-7 11a7 7 0 0 0 14 0c0-4-5-6.2-7-11ZM8 14a4 4 0 0 0 4 4" },
  { id: "particles", name: "粒子宇宙", number: "02", english: "PARTICLES", color: "120, 210, 255", path: "M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1M12 9l3 3-3 3-3-3Z" },
  { id: "black-hole", name: "引力黑洞", number: "03", english: "EVENT HORIZON", color: "255, 186, 113", path: "M16.5 9.4a5 5 0 0 0-9-1.8M7.5 14.6a5 5 0 0 0 9 1.8M21 8.6c.6 1.6-3 4.1-8 5.9S3.6 16.2 3 14.6s3-4.1 8-5.9S20.4 7 21 8.6Z" },
  { id: "tunnel", name: "作品隧道", number: "04", english: "INFINITE TUNNEL", color: "154, 167, 255", path: "M3 3h18v18H3ZM7 7h10v10H7Zm3 3h4v4h-4ZM3 3l4 4m10 10 4 4M3 21l4-4M17 7l4-4" },
  { id: "glass", name: "液态玻璃", number: "05", english: "GLASS GALLERY", color: "129, 239, 216", path: "m12 3 8 5v8l-8 5-8-5V8Zm0 0v18M4 8l8 5 8-5M4 16l8-5 8 5" },
] as const;
type Exhibit = typeof exhibits[number]["id"];
const active = ref<Exhibit>("metal");
const expanded = ref(true);
const toggleButton = ref<HTMLButtonElement | null>(null);
const current = computed(() => exhibits.find((exhibit) => exhibit.id === active.value)!);

function selectExhibit(id: Exhibit) {
  active.value = id;
}

function collapse() {
  expanded.value = false;
  toggleButton.value?.focus({ preventScroll: true });
}

function navigateTabs(event: KeyboardEvent, index: number) {
  let next: number;
  if (event.key === "ArrowRight") next = (index + 1) % exhibits.length;
  else if (event.key === "ArrowLeft") next = (index - 1 + exhibits.length) % exhibits.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = exhibits.length - 1;
  else return;
  event.preventDefault();
  const exhibit = exhibits[next];
  if (!exhibit) return;
  selectExhibit(exhibit.id);
  const tab = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']")[next];
  tab?.focus({ preventScroll: true });
}
</script>

<template>
  <section id="particle-lab" class="visual-lab" :class="{ 'is-expanded': expanded }" :style="{ '--lab-accent': current.color }" aria-labelledby="visual-lab-heading">
    <span id="visual-lab" class="lab-anchor" aria-hidden="true"></span>
    <header class="lab-header">
      <div class="lab-brand">
        <span class="lab-emblem" aria-hidden="true">✳</span>
        <div><h2 id="visual-lab-heading">互动实验室</h2><p>{{ expanded ? '切换场景，试试移动鼠标或左右拖动。' : '一些关于粒子、光影和空间的小实验。' }}</p></div>
      </div>
      <button ref="toggleButton" type="button" class="lab-toggle" :aria-expanded="expanded" aria-controls="visual-lab-content" @click="expanded ? collapse() : expanded = true">{{ expanded ? '收起' : '展开体验' }}<span aria-hidden="true">{{ expanded ? '−' : '+' }}</span></button>
    </header>

    <div id="visual-lab-content" :hidden="!expanded">
    <template v-if="expanded">
    <div class="lab-tabs" role="tablist" aria-label="选择互动展区">
      <button v-for="(exhibit, index) in exhibits" :id="`lab-tab-${exhibit.id}`" :key="exhibit.id" type="button" role="tab" :aria-selected="active === exhibit.id" :aria-controls="`lab-panel-${exhibit.id}`" :tabindex="active === exhibit.id ? 0 : -1" :class="{ 'is-active': active === exhibit.id }" @click="selectExhibit(exhibit.id)" @keydown="navigateTabs($event, index)">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="exhibit.path" /></svg>
        <span>{{ exhibit.name }}</span>
      </button>
    </div>

    <div :id="`lab-panel-${active}`" :key="active" class="lab-panel" role="tabpanel" :aria-labelledby="`lab-tab-${active}`" tabindex="0">
      <ParticleShowcase v-if="active === 'particles'" embedded />
      <BlackHoleShowcase v-else-if="active === 'black-hole'" />
      <LiquidMetalShowcase v-else-if="active === 'metal'" />
      <SpatialGallery v-else :mode="active === 'tunnel' ? 'tunnel' : 'glass'" />
    </div>

    <div class="lab-close-row"><button type="button" @click="collapse">收起实验室 <span aria-hidden="true">↑</span></button></div>
    </template>
    </div>
  </section>
</template>

<style scoped>
.visual-lab {
  --lab-accent: 120, 210, 255;
  position: relative;
  isolation: isolate;
  margin-bottom: 16px;
  color: #fff;
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  background: linear-gradient(140deg, #ffffff18, #ffffff08);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  overflow: hidden;
  box-shadow: var(--shadow);
  scroll-margin-top: 24px;
}
.lab-anchor { position: absolute; top: 0; scroll-margin-top: 24px; }
.lab-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 26px 30px; }
.lab-brand { display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1; }
.lab-emblem { font: 30px/1 Georgia, serif; color: #d7eaff; }
.lab-brand h2 { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: .5px; }
.lab-brand p { margin: 7px 0 0; color: #ffffffe0; font-size: 12px; line-height: 1.7; }
.lab-toggle { display: flex; align-items: center; gap: 18px; flex-shrink: 0; padding: 10px 16px; min-height: 44px; border: 1px solid #ffffff40; border-radius: 10px; background: #ffffff0a; color: #fff; font: inherit; font-size: 12px; cursor: pointer; }
.lab-toggle span { font-size: 20px; line-height: 1; font-weight: 300; }
.lab-toggle:hover { background: #ffffff1c; }
.lab-tabs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; max-width: 850px; padding: 0 28px 16px; }
.lab-tabs button { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; min-width: 0; padding: 8px 10px; font: inherit; font-size: 12px; white-space: nowrap; color: #ffffffe0; border: 1px solid transparent; border-radius: 10px; background: transparent; cursor: pointer; transition: background .2s, border-color .2s; }
.lab-tabs button:hover { background: #ffffff0d; }
.lab-tabs button.is-active { color: #fff; border-color: #ffffff45; background: #ffffff20; }
.lab-tabs svg { width: 18px; height: 18px; flex-shrink: 0; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.lab-panel { min-width: 0; border-top: 1px solid #ffffff1a; }
.lab-toggle:focus-visible, .lab-tabs button:focus-visible, .lab-close-row button:focus-visible, .lab-panel:focus-visible { outline: 2px solid #e4f2ff; outline-offset: -3px; }
.lab-close-row { display: flex; justify-content: center; padding: 8px 24px 20px; }
.lab-close-row button { min-height: 36px; padding: 6px 12px; border: 0; border-radius: 8px; background: transparent; font: inherit; font-size: 12px; color: #ffffffe0; cursor: pointer; }
.lab-close-row button:hover { color: #fff; background: #ffffff12; }
.lab-close-row span { margin-left: 8px; }
/* Let the artwork lead; remove secondary exhibition labels and repeated copy. */
.lab-panel :deep(.atlas-eyebrow), .lab-panel :deep(.hole-eyebrow), .lab-panel :deep(.metal-eyebrow), .lab-panel :deep(.spatial-eyebrow),
.lab-panel :deep(.atlas-invitation), .lab-panel :deep(.hole-description), .lab-panel :deep(.metal-invitation), .lab-panel :deep(.spatial-note),
.lab-panel :deep(.atlas-stage-meta), .lab-panel :deep(.hole-marker), .lab-panel :deep(.hole-stage-footer), .lab-panel :deep(.metal-stage-label),
.lab-panel :deep(.metal-corner), .lab-panel :deep(.tunnel-axis), .lab-panel :deep(.stage-edge), .lab-panel :deep(.card-overline),
.lab-panel :deep(.card-caption > span), .lab-panel :deep(.hole-caption), .lab-panel :deep(.atlas-story), .lab-panel :deep(.metal-bottom > div) { display: none; }
.lab-panel :deep(.atlas-intro), .lab-panel :deep(.hole-intro), .lab-panel :deep(.metal-intro) { padding: 24px 28px 0; }
.lab-panel :deep(.atlas-intro h2), .lab-panel :deep(.hole-intro h2), .lab-panel :deep(.metal-intro h2), .lab-panel :deep(.spatial-intro h3) { font-size: 28px; letter-spacing: -.5px; }
.lab-panel :deep(.atlas-stage) { height: 330px; }
.lab-panel :deep(.hole-stage) { height: 370px; }
.lab-panel :deep(.metal-stage) { height: 340px; margin-top: 8px; }
.lab-panel :deep(.spatial-stage) { height: 370px; }
.lab-panel :deep(.spatial-gallery) { padding: 0 28px 20px; }
.lab-panel :deep(.spatial-intro) { margin: 24px 0 20px; }
.lab-panel :deep(.atlas-toolbar), .lab-panel :deep(.hole-controls), .lab-panel :deep(.metal-toolbar) { padding-inline: 28px; padding-bottom: 18px; }
.lab-panel :deep(.atlas-bottom), .lab-panel :deep(.metal-bottom) { padding: 14px 28px 20px; border: 0; background: transparent; }
.lab-panel :deep(.metal-bottom) { justify-content: flex-start; }
@media(max-width: 760px) {
  .lab-header { padding: 22px; gap: 14px; }
  .lab-brand { gap: 10px; }
  .lab-brand h2 { font-size: 16px; }
  .lab-brand p { font-size: 11px; }
  .lab-toggle { gap: 10px; padding: 9px 12px; font-size: 11px; }
  .lab-tabs { max-width: none; gap: 3px; padding: 0 16px 16px; }
  .lab-tabs button { padding: 8px 3px; font-size: 11px; }
  .lab-tabs svg { display: none; }
  .lab-panel :deep(.atlas-intro), .lab-panel :deep(.hole-intro), .lab-panel :deep(.metal-intro) { padding: 22px 20px 0; }
  .lab-panel :deep(.atlas-intro h2), .lab-panel :deep(.hole-intro h2), .lab-panel :deep(.metal-intro h2), .lab-panel :deep(.spatial-intro h3) { font-size: 24px; }
  .lab-panel :deep(.atlas-stage), .lab-panel :deep(.hole-stage), .lab-panel :deep(.metal-stage) { height: 260px; }
  .lab-panel :deep(.spatial-stage) { height: 310px; }
  .lab-panel :deep(.spatial-gallery) { padding-inline: 16px; }
  .lab-panel :deep(.atlas-toolbar), .lab-panel :deep(.hole-controls), .lab-panel :deep(.metal-toolbar), .lab-panel :deep(.atlas-bottom), .lab-panel :deep(.metal-bottom) { padding-inline: 20px; }
}
@media(max-width: 420px) {
  .visual-lab { border-radius: 20px; }
  .lab-header { padding: 20px; }
  .is-expanded .lab-brand p { max-width: 210px; }
}
@media(prefers-reduced-motion: reduce) { .lab-tabs button { transition: none; } }
</style>
