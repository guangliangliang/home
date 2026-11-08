<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import type { WechatAccount } from "@/config/profile";

defineProps<{ account: WechatAccount }>();

const qrDialog = ref<HTMLDialogElement | null>(null);
let previousBodyOverflow: string | undefined;

const openQrcode = () => {
  if (!qrDialog.value || qrDialog.value.open) return;
  qrDialog.value.showModal();
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
};

const restoreScroll = () => {
  if (previousBodyOverflow === undefined) return;
  document.body.style.overflow = previousBodyOverflow;
  previousBodyOverflow = undefined;
};

const closeQrcode = () => qrDialog.value?.close();

const closeOnBackdrop = (event: MouseEvent) => {
  if (event.target !== qrDialog.value || !qrDialog.value) return;
  const bounds = qrDialog.value.getBoundingClientRect();
  if (
    event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom
  ) closeQrcode();
};

onBeforeUnmount(() => {
  qrDialog.value?.close();
  restoreScroll();
});
</script>

<template>
  <section id="wechat-account" class="wechat-section" aria-labelledby="wechat-heading">
    <h2 id="wechat-heading" class="section-heading" data-reveal>微信公众号</h2>

    <div class="account-intro" data-reveal>
      <div class="account-copy">
        <p class="account-eyebrow">文字与分享</p>
        <h3 class="account-name">{{ account.name }}</h3>
        <p class="account-description">{{ account.description }}</p>
        <ul class="account-tags" aria-label="公众号内容主题">
          <li v-for="tag in account.tags" :key="tag">{{ tag }}</li>
        </ul>
        <p class="account-search">微信搜索「{{ account.name }}」，一起读懂自己，过好日常。</p>
      </div>

      <div class="account-follow">
        <button
          class="qrcode-button"
          type="button"
          :aria-label="`放大${account.name}公众号二维码`"
          aria-haspopup="dialog"
          @click="openQrcode"
        >
          <img
            :src="account.qrcode"
            :alt="`${account.name}公众号关注二维码`"
            width="258"
            height="258"
            loading="lazy"
          />
        </button>
        <p class="follow-label">微信扫码关注</p>
        <p class="follow-hint">点击二维码放大 · 手机可长按识别</p>
      </div>
    </div>

    <div class="articles-heading" data-reveal>
      <h3>精选文章</h3>
      <span>从这几篇开始阅读</span>
    </div>
    <div class="article-list">
      <a
        v-for="(article, index) in account.articles"
        :key="article.url"
        :href="article.url"
        class="article-card"
        target="_blank"
        rel="noopener noreferrer"
        data-reveal
        :style="{ '--reveal-delay': `${index * 65}ms` }"
      >
        <span class="article-number" aria-hidden="true">{{ String(index + 1).padStart(2, "0") }}</span>
        <h4>{{ article.title }}</h4>
        <p>{{ article.description }}</p>
        <span class="article-action">阅读全文<span class="sr-only">（新窗口打开）</span></span>
      </a>
    </div>

    <Teleport to="body">
      <dialog
        ref="qrDialog"
        class="qrcode-dialog"
        aria-labelledby="qrcode-dialog-heading"
        aria-describedby="qrcode-dialog-hint"
        @click="closeOnBackdrop"
        @close="restoreScroll"
      >
        <div class="dialog-topline">
          <h2 id="qrcode-dialog-heading">{{ account.name }}</h2>
          <button class="dialog-close" type="button" autofocus @click="closeQrcode">关闭</button>
        </div>
        <img
          class="dialog-qrcode"
          :src="account.qrcode"
          :alt="`${account.name}公众号关注二维码`"
          width="258"
          height="258"
        />
        <p id="qrcode-dialog-hint">微信扫一扫，或长按二维码识别关注</p>
      </dialog>
    </Teleport>
  </section>
</template>

<style scoped>
.wechat-section {
  margin-bottom: 30px;
  padding: 40px;
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  background: var(--glass-bg);
  color: var(--text-primary);
  box-shadow: var(--shadow);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  scroll-margin-top: 32px;
}

.section-heading { margin: 0 0 32px; text-align: center; font-size: 1.6rem; font-weight: 700; }
.account-intro { display: grid; grid-template-columns: minmax(0, 1fr) 210px; align-items: center; gap: 48px; }
.account-eyebrow { margin: 0 0 12px; color: var(--text-secondary); font-size: 0.85rem; letter-spacing: 0.16em; }
.account-name { margin: 0 0 18px; font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 700; letter-spacing: 0.12em; }
.account-description { max-width: 520px; margin: 0; color: var(--text-secondary); font-size: 1.05rem; line-height: 1.9; }
.account-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0 0; padding: 0; list-style: none; }
.account-tags li { padding: 6px 13px; border: 1px solid var(--glass-border); border-radius: 999px; background: rgba(255, 255, 255, 0.1); font-size: 0.8rem; }
.account-search { margin: 22px 0 0; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.8; }
.account-follow { text-align: center; }
.qrcode-button { display: block; width: 180px; margin: 0 auto; padding: 0; overflow: hidden; border: 0; border-radius: 14px; background: #fff; cursor: zoom-in; box-shadow: 0 8px 25px rgba(23, 14, 54, 0.16); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.qrcode-button img { display: block; width: 100%; height: auto; }
.qrcode-button:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(23, 14, 54, 0.22); }
.qrcode-button:focus-visible, .article-card:focus-visible { outline: 3px solid var(--text-primary); outline-offset: 5px; }
.follow-label { margin: 14px 0 5px; font-size: 0.9rem; font-weight: 600; }
.follow-hint { margin: 0; color: var(--text-secondary); font-size: 0.72rem; line-height: 1.7; }
.articles-heading { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px 16px; margin-top: 36px; padding-top: 28px; border-top: 1px solid var(--glass-border); }
.articles-heading h3 { margin: 0; font-size: 1.05rem; }
.articles-heading > span { color: var(--text-secondary); font-size: 0.8rem; }
.article-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 18px; }
.article-card { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; padding: 24px; border: 1px solid var(--glass-border); border-radius: 18px; background: var(--card-bg); color: var(--text-primary); text-decoration: none; transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
.article-number { margin-bottom: 18px; color: var(--text-secondary); font-size: 0.8rem; font-variant-numeric: tabular-nums; letter-spacing: 0.1em; }
.article-card h4 { margin: 0 0 12px; font-size: 1.05rem; line-height: 1.7; overflow-wrap: anywhere; }
.article-card > p { margin: 0 0 22px; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.85; overflow-wrap: anywhere; }
.article-action { margin-top: auto; padding-bottom: 3px; border-bottom: 1px solid var(--glass-border); font-size: 0.8rem; font-weight: 600; }
.article-card:hover { transform: translateY(-4px); border-color: rgba(227, 220, 255, 0.65); box-shadow: 0 14px 30px rgba(23, 14, 54, 0.18); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.qrcode-dialog { position: fixed; inset: 0; width: min(360px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); margin: auto; padding: 24px; overflow: auto; border: 1px solid #ded9f1; border-radius: 22px; background: #fff; color: #28233c; box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3); }
.qrcode-dialog::backdrop { background: rgba(17, 12, 35, 0.72); backdrop-filter: blur(8px); }
.dialog-topline { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; }
.dialog-topline h2 { margin: 0; font-size: 1.2rem; }
.dialog-close { min-width: 48px; min-height: 44px; padding: 8px 12px; border: 1px solid #e4dfef; border-radius: 10px; background: #f4f1fa; color: #443963; font: inherit; font-size: 0.85rem; cursor: pointer; }
.dialog-close:focus-visible { outline: 3px solid #7160b4; outline-offset: 3px; }
.dialog-qrcode { display: block; width: 258px; max-width: 100%; height: auto; margin: 0 auto; }
.qrcode-dialog > p { margin: 18px 0 0; color: #655d77; text-align: center; font-size: 0.8rem; line-height: 1.8; }

@media (max-width: 900px) {
  .article-list { grid-template-columns: 1fr; gap: 12px; }
  .article-card { padding: 22px; }
  .article-number { margin-bottom: 10px; }
  .article-card > p { margin-bottom: 16px; }
}

@media (max-width: 600px) {
  .wechat-section { padding: 28px 20px; border-radius: 20px; }
  .section-heading { margin-bottom: 28px; font-size: 1.4rem; }
  .account-intro { grid-template-columns: 1fr; gap: 28px; }
  .account-name { font-size: 2rem; }
  .account-description { font-size: 0.95rem; }
  .account-search { margin-top: 18px; }
  .account-follow { padding-top: 4px; }
  .qrcode-button { width: 190px; }
  .articles-heading { margin-top: 28px; padding-top: 24px; }
}

@media (prefers-reduced-motion: reduce) {
  .qrcode-button, .article-card { transition: none; }
  .qrcode-button:hover, .article-card:hover { transform: none; }
}
</style>
