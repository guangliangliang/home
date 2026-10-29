<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { profileConfig } from "@/config/profile";
import { createGlassScene, galleryColors, projectArtwork, type GlassScene } from "@/lib/spatialGallery";

const props=defineProps<{mode:"tunnel"|"glass"}>();
const projects=profileConfig.projects;
const active=ref(0);
const paused=ref(false);
const reduced=ref(false);
const inView=ref(true);
const pageVisible=ref(true);
const pointer=ref({x:0,y:0});
const stage=ref<HTMLElement|null>(null);
const canvas=ref<HTMLCanvasElement|null>(null);
const current=computed(()=>projects[active.value]!);
const tint=computed(()=>galleryColors[active.value%galleryColors.length]??"#8de2ff");
const still=computed(()=>paused.value||reduced.value||!inView.value||!pageVisible.value);
const cards=computed(()=>[-2,-1,0,1,2].map(offset=>{const index=(active.value+offset+projects.length)%projects.length;return {offset,index,project:projects[index]!,artwork:projectArtwork(index)};}));
let glass:GlassScene|null=null;
let observer:IntersectionObserver|undefined;
let media:MediaQueryList|undefined;
let pointerStart:{x:number;y:number}|null=null;
let suppressGestureClick=false;

function select(index:number){active.value=(index+projects.length)%projects.length;glass?.setPalette(active.value);}
function move(event:PointerEvent){
  if(!stage.value||event.pointerType==="touch"||reduced.value||paused.value)return;
  const bounds=stage.value.getBoundingClientRect();
  pointer.value={x:(event.clientX-bounds.left)/bounds.width-.5,y:(event.clientY-bounds.top)/bounds.height-.5};
  glass?.setPointer(pointer.value.x,pointer.value.y);
}
function leave(){pointerStart=null;if(paused.value)return;pointer.value={x:0,y:0};glass?.setPointer(0,0);}
function down(event:PointerEvent){
  suppressGestureClick=false;
  pointerStart=null;
  const control=(event.target as Element).closest("button,a");
  if(control&&!control.classList.contains("exhibit-card"))return;
  pointerStart={x:event.clientX,y:event.clientY};
}
function up(event:PointerEvent){
  if(!pointerStart)return;
  const dx=event.clientX-pointerStart.x,dy=event.clientY-pointerStart.y;
  pointerStart=null;
  if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4){
    suppressGestureClick=true;
    select(active.value+(dx<0?1:-1));
  }
}
function onStageClick(event:MouseEvent){
  // A swipe can synthesize a click on its original card after the next card is selected.
  // Consume that click, while keeping ordinary taps and keyboard activation intact.
  if(suppressGestureClick&&event.detail!==0){
    suppressGestureClick=false;
    event.preventDefault();
    event.stopPropagation();
  }
}
function toggle(){paused.value=!paused.value;glass?.setPaused(paused.value);}
function onPreference(){reduced.value=media?.matches??false;}
function onVisibility(){pageVisible.value=!document.hidden;}
onMounted(()=>{
  media=matchMedia("(prefers-reduced-motion: reduce)");onPreference();media.addEventListener("change",onPreference);
  document.addEventListener("visibilitychange",onVisibility);
  if(stage.value){observer=new IntersectionObserver(([entry])=>{inView.value=entry?.isIntersecting??true;});observer.observe(stage.value);}
  if(canvas.value){glass=createGlassScene(canvas.value);if(!glass)canvas.value.style.opacity="0";}
});
onUnmounted(()=>{glass?.destroy();observer?.disconnect();media?.removeEventListener("change",onPreference);document.removeEventListener("visibilitychange",onVisibility);});
</script>

<template>
  <section class="spatial-gallery" :class="[`mode-${props.mode}`,{'is-still':still}]" :style="{'--gallery-tint':tint,'--pointer-x':pointer.x,'--pointer-y':pointer.y}" :aria-label="props.mode==='tunnel'?'3D 作品隧道':'液态玻璃展厅'">
    <div class="spatial-intro">
      <div><p class="spatial-eyebrow">{{ props.mode==='tunnel'?'INFINITE PROJECT TUNNEL':'LIQUID GLASS GALLERY' }}</p><h3>{{ props.mode==='tunnel'?'下一站，灵感深处。':'让想法，浮出光面。' }}</h3></div>
      <p class="spatial-note">{{ props.mode==='tunnel'?'穿过光的隧道，遇见我的每一个作品。':'光线流动，作品悬浮。换个角度，发现不同。' }}</p>
    </div>

    <div ref="stage" class="spatial-stage" @pointermove="move" @pointerleave="leave" @pointerdown="down" @pointerup="up" @pointercancel="pointerStart=null" @click.capture="onStageClick">
      <div class="stage-grain" aria-hidden="true"></div>
      <template v-if="props.mode==='tunnel'">
        <div class="tunnel-vanishing" aria-hidden="true"></div>
        <div class="tunnel-room" aria-hidden="true">
          <div v-for="frame in 12" :key="frame" class="tunnel-frame" :style="{'--depth':frame,'--delay':`${-frame*.78}s`}"><i></i><i></i><i></i><i></i></div>
          <div class="tunnel-floor"></div>
        </div>
        <div class="tunnel-axis" aria-hidden="true"><span>← EXPLORING IDEAS</span><span>CREATING WORLDS →</span></div>
      </template>
      <template v-else>
        <div class="glass-ambient" aria-hidden="true"></div>
        <canvas ref="canvas" class="glass-sculpture" aria-hidden="true"></canvas>
        <div class="glass-orbit orbit-a" aria-hidden="true"></div><div class="glass-orbit orbit-b" aria-hidden="true"></div>
        <div class="glass-pearl pearl-one" aria-hidden="true"></div><div class="glass-pearl pearl-two" aria-hidden="true"></div>
      </template>

      <div class="spatial-cards">
        <button v-for="card in cards" :key="card.index" type="button" class="exhibit-card" :class="{'is-active':card.offset===0}" :style="{'--offset':card.offset,'--abs-offset':Math.abs(card.offset),'--card-tint':galleryColors[card.index]}" :aria-label="`查看${card.project.name}`" :aria-pressed="card.offset===0" :tabindex="card.offset===0?0:-1" @click="select(card.index)">
          <span class="card-overline"><span>{{ String(card.index+1).padStart(2,'0') }}</span><span>{{ props.mode==='tunnel'?'SELECTED WORK':'GLASS COLLECTION' }}</span><span>↗</span></span>
          <img :src="card.artwork" alt="" class="card-art" draggable="false"/>
          <span class="card-caption"><strong>{{ card.project.name }}</strong><span>{{ card.project.tags[0] }} <i> / </i> EXPLORE</span></span>
          <span class="card-sheen" aria-hidden="true"></span>
        </button>
      </div>
      <div class="stage-edge top-edge" aria-hidden="true"><span><i></i>{{ props.mode==='tunnel'?'DEPTH / INFINITE':'MATERIAL / GLASS' }}</span><span>0{{ active+1 }} — 0{{ projects.length }}</span></div>
      <div class="stage-edge bottom-edge" aria-hidden="true"><span>{{ props.mode==='tunnel'?'移动指针 · 左右滑动探索':'移动指针 · 观察光线折射' }}</span><span>{{ props.mode==='tunnel'?'PORTFOLIO IN MOTION':'LIGHT / SPACE / IDEAS' }}</span></div>
      <button type="button" class="stage-arrow previous" aria-label="上一个作品" @click="select(active-1)">←</button>
      <button type="button" class="stage-arrow next" aria-label="下一个作品" @click="select(active+1)">→</button>
    </div>

    <div class="spatial-toolbar">
      <div class="project-dots" role="group" aria-label="选择展示作品"><button v-for="(project,index) in projects" :key="project.name" type="button" :class="{'is-active':active===index}" :aria-label="`展示${project.name}`" :aria-pressed="active===index" @click="select(index)"><span></span></button></div>
      <button class="motion-button" type="button" :aria-label="paused?'继续空间动画':'暂停空间动画'" :aria-pressed="paused" @click="toggle"><span aria-hidden="true">{{ paused?'▷':'Ⅱ' }}</span>{{ paused?'继续动画':'暂停动画' }}</button>
    </div>
    <div class="spatial-footer">
      <div aria-live="polite"><span class="footer-index">{{ String(active+1).padStart(2,'0') }} / {{ String(projects.length).padStart(2,'0') }}</span><h4>{{ current.name }}</h4><p>{{ current.description }}</p></div>
      <a :href="current.url" target="_blank" rel="noopener noreferrer">打开作品 <span aria-hidden="true">↗</span></a>
    </div>
  </section>
</template>

<style scoped>
.spatial-gallery{color:#ecf3ff;--gallery-tint:#8de2ff;padding:0 30px 28px}.spatial-intro{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin:27px 0 24px}.spatial-eyebrow{font:10px/1.4 ui-monospace,monospace;letter-spacing:2.3px;color:var(--gallery-tint);margin:0 0 9px}.spatial-intro h3{font-size:clamp(24px,3vw,34px);font-weight:600;letter-spacing:-1px;margin:0}.spatial-note{font-size:12px;color:#e1dcf1;max-width:270px;line-height:1.8;margin:0}.spatial-stage{position:relative;height:440px;border:1px solid #ffffff26;border-radius:18px;overflow:hidden;background:linear-gradient(145deg,#ffffff0e,#ffffff03);box-shadow:inset 0 1px 0 #ffffff18;isolation:isolate;touch-action:pan-y;user-select:none}.stage-grain{position:absolute;inset:0;background-image:radial-gradient(#e8efff66 .5px,transparent .5px);background-size:53px 61px;opacity:.28;pointer-events:none;z-index:1}.tunnel-vanishing{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 48%,#25114366,transparent 70%),radial-gradient(ellipse at 50% 100%,#9cc5ff20,transparent 65%)}.tunnel-room{position:absolute;inset:0;perspective:640px;perspective-origin:50% 47%;transform:translate(calc(var(--pointer-x)*-10px),calc(var(--pointer-y)*-8px))}.tunnel-frame{position:absolute;width:88%;height:112%;left:6%;top:-6%;border:1px solid #e0dcff55;border-radius:15px;transform:translateZ(calc(var(--depth)*-160px));box-shadow:inset 0 0 10px #9e8dff0a,0 0 10px #9e8dff0d;animation:tunnel-travel 9.36s linear infinite;animation-delay:var(--delay)}.tunnel-frame::before,.tunnel-frame::after{content:"";position:absolute;top:12%;bottom:12%;width:3px;background:linear-gradient(transparent,var(--gallery-tint),transparent);box-shadow:0 0 15px var(--gallery-tint);opacity:.65}.tunnel-frame::before{left:-1px}.tunnel-frame::after{right:-1px}.tunnel-frame i{position:absolute;width:23%;height:2px;background:linear-gradient(90deg,transparent,#c2b5ff88,transparent);left:38%;box-shadow:0 0 11px #af99ff}.tunnel-frame i:nth-child(2){bottom:0}.tunnel-frame i:nth-child(3){width:9%;left:2%;bottom:0}.tunnel-frame i:nth-child(4){width:9%;left:auto;right:2%;top:0}.tunnel-floor{position:absolute;width:240%;height:550px;left:-70%;top:61%;transform:rotateX(75deg);transform-origin:50% 0;background-image:linear-gradient(#ede5ff28 1px,transparent 1px),linear-gradient(90deg,#ede5ff28 1px,transparent 1px);background-size:70px 70px;mask-image:linear-gradient(transparent,#000 15%,transparent 90%)}.tunnel-axis{position:absolute;inset:49% 6% auto;display:flex;justify-content:space-between;color:#e8e1ff99;letter-spacing:2px;font:9px ui-monospace,monospace}.spatial-cards{position:absolute;inset:0;perspective:1100px;transform:translate(calc(var(--pointer-x)*-9px),calc(var(--pointer-y)*-6px))}.exhibit-card{appearance:none;position:absolute;left:50%;top:50%;width:252px;height:284px;padding:0;border:1px solid #b8caff42;border-radius:15px;color:#eef7ff;cursor:pointer;text-align:left;font:inherit;background:#211d3dd1;backdrop-filter:blur(12px);overflow:hidden;box-shadow:0 20px 65px #0008;transform:translate(calc(-50% + var(--offset)*235px),calc(-50% + var(--abs-offset)*-3px)) translateZ(calc(var(--abs-offset)*-200px)) rotateY(calc(var(--offset)*-40deg));opacity:calc(1 - var(--abs-offset)*.26);transition:transform .75s cubic-bezier(.2,.7,.1,1),opacity .65s,border-color .4s;will-change:transform}.exhibit-card.is-active{border-color:color-mix(in srgb,var(--card-tint) 45%,transparent);box-shadow:0 22px 65px #0009,0 0 45px color-mix(in srgb,var(--card-tint) 8%,transparent);z-index:3}.card-overline{position:absolute;top:16px;left:17px;right:17px;z-index:1;display:flex;align-items:center;justify-content:space-between;font:8px ui-monospace,monospace;letter-spacing:1px;color:#dddff2}.card-overline>span:first-child{color:var(--card-tint);font-size:11px}.card-overline>span:last-child{font-size:15px}.card-art{display:block;width:100%;height:215px;object-fit:cover;pointer-events:none}.card-caption{display:block;padding:0 18px 19px}.card-caption strong{display:block;font-size:17px;line-height:1.5;font-weight:500;letter-spacing:.8px}.card-caption>span{display:block;margin-top:5px;color:#c5c8e2;font:8px ui-monospace,monospace;letter-spacing:1px}.card-caption i{font-style:normal;color:#aaa0c2;margin:0 6px}.card-sheen{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(120deg,#fff0 20%,#dcecff0a 45%,#fff0 60%);pointer-events:none}.stage-edge{position:absolute;left:21px;right:21px;display:flex;align-items:center;justify-content:space-between;gap:12px;color:#eee8ff;font:9px ui-monospace,monospace;letter-spacing:1.1px;z-index:4;pointer-events:none}.top-edge{top:19px}.bottom-edge{bottom:19px;color:#ded5f2}.stage-edge i{display:inline-block;width:4px;height:4px;border-radius:50%;background:var(--gallery-tint);box-shadow:0 0 10px var(--gallery-tint);margin-right:8px;vertical-align:middle}.stage-arrow{position:absolute;top:calc(50% - 21px);width:42px;height:42px;border:1px solid #ffffff40;background:#ffffff1a;backdrop-filter:blur(12px);color:#dcecff;border-radius:50%;font-size:19px;cursor:pointer;z-index:6;transition:background .2s,border-color .2s}.stage-arrow:hover{border-color:var(--gallery-tint);background:#ffffff2e}.previous{left:22px}.next{right:22px}.spatial-toolbar{display:flex;flex-wrap:wrap;row-gap:10px;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff26;padding:13px 0 16px}.project-dots{display:flex;flex-shrink:0;align-items:center;gap:1px}.project-dots button{display:grid;place-items:center;width:25px;height:28px;padding:0;background:none;border:0;cursor:pointer}.project-dots button span{display:block;height:4px;width:4px;background:#d8ccea80;border-radius:3px;transition:width .3s,background .3s}.project-dots button.is-active span{width:18px;background:var(--gallery-tint);box-shadow:0 0 12px color-mix(in srgb,var(--gallery-tint) 35%,transparent)}.motion-button{display:flex;flex-shrink:0;white-space:nowrap;margin-left:auto;align-items:center;gap:8px;color:#eee7ff;font-family:inherit;font-size:11px;border:1px solid #ffffff35;border-radius:8px;padding:7px 11px;background:#ffffff0c;cursor:pointer}.motion-button span{font-size:14px;line-height:1}.spatial-footer{display:flex;align-items:center;justify-content:space-between;gap:24px;padding-top:22px}.footer-index{float:left;font:10px ui-monospace,monospace;letter-spacing:1px;margin:7px 14px 0 0;color:var(--gallery-tint)}.spatial-footer h4{font-weight:500;font-size:18px;letter-spacing:.5px;margin:0 0 9px}.spatial-footer p{font-size:12px;line-height:1.8;color:#e4dcf3;margin:0}.spatial-footer a{display:inline-flex;align-items:center;gap:28px;flex-shrink:0;text-decoration:none;font-size:12px;color:#e3efff;background:#ffffff12;border:1px solid #ffffff38;border-radius:10px;padding:13px 18px;transition:background .2s}.spatial-footer a:hover{background:#ffffff10}.spatial-footer a span{font-size:17px;color:var(--gallery-tint)}button:focus-visible,a:focus-visible{outline:2px solid var(--gallery-tint);outline-offset:4px}.glass-ambient{position:absolute;inset:0;background:radial-gradient(ellipse at 30% 40%,#4da7b33b,transparent 50%),radial-gradient(ellipse at 75% 70%,#a178ef45,transparent 55%)}.glass-ambient::before{content:"";position:absolute;left:50%;top:50%;width:350px;height:280px;border:45px solid #b0e8ff3b;box-shadow:inset 10px 15px 20px #bcafff44,0 0 60px #7ad9f62b;border-radius:50%;transform:translate(-50%,-50%) rotate(-25deg)}.glass-sculpture{position:absolute;inset:0;width:100%;height:100%;display:block}.mode-glass .spatial-stage{background:linear-gradient(145deg,#ffffff10,#ffffff03)}.mode-glass .exhibit-card{width:211px;height:244px;background:linear-gradient(145deg,#d6f3ff1f,#92aaff05 65%,#c5a6ff17);border:1px solid #d5eaff48;box-shadow:inset 0 0 30px #d3e9ff08,0 20px 60px #0005;backdrop-filter:blur(18px) saturate(150%);transform:translate(calc(-50% + var(--offset)*231px),calc(-50% + var(--offset)*20px)) translateZ(calc(var(--abs-offset)*-110px)) rotateY(calc(var(--offset)*-22deg)) rotateZ(calc(var(--offset)*8deg));opacity:calc(1 - var(--abs-offset)*.24)}.mode-glass .exhibit-card.is-active{background:linear-gradient(135deg,#e7faff20,#a0bafb0a 45%,#ab9dff14);box-shadow:inset 0 1px 1px #fff6,0 18px 50px #0005;transform:translate(-50%,-50%) rotateY(calc(var(--pointer-x)*-12deg)) rotateX(calc(var(--pointer-y)*9deg));border-color:#e0f5ff70}.mode-glass .card-art{height:174px;mix-blend-mode:screen;opacity:.9}.mode-glass .card-overline{font-size:6px}.mode-glass .card-caption strong{font-size:16px}.mode-glass .spatial-cards{animation:glass-float 7s ease-in-out infinite}.glass-orbit{position:absolute;left:50%;top:50%;width:620px;height:180px;border:1px solid #edf6ff44;border-radius:50%;transform:translate(-50%,-50%) rotate(-25deg);pointer-events:none}.orbit-b{width:540px;height:280px;transform:translate(-50%,-50%) rotate(28deg);border-color:#e9dfff35}.glass-pearl{position:absolute;border-radius:50%;background:radial-gradient(circle at 30% 24%,#f5ffffbb 0,#d5ecff11 22%,#bbdeff05 52%,#b6c6ff55 79%,#f0f7ff99 95%);border:1px solid #deefff55;box-shadow:inset 2px 4px 9px #fff3,0 10px 25px #0003;backdrop-filter:blur(3px);animation:glass-float 7s ease-in-out infinite}.pearl-one{width:49px;height:49px;left:29%;top:17%;animation-delay:-2s}.pearl-two{width:28px;height:28px;right:29%;bottom:17%;animation-delay:-4s}.is-still .tunnel-frame,.is-still .spatial-cards,.is-still .glass-pearl{animation-play-state:paused}@keyframes tunnel-travel{from{transform:translateZ(-1900px);opacity:0}10%{opacity:.8}80%{opacity:.8}to{transform:translateZ(0);opacity:0}}@keyframes glass-float{0%,100%{margin-top:0}50%{margin-top:-10px}}
@media(max-width:760px){.spatial-gallery{padding:0 16px 20px}.spatial-intro{align-items:flex-start;flex-direction:column;gap:9px;margin:22px 0 20px}.spatial-note{max-width:none;font-size:11px}.spatial-stage{height:370px}.exhibit-card{width:214px;height:252px;transform:translate(calc(-50% + var(--offset)*180px),-50%) translateZ(calc(var(--abs-offset)*-250px)) rotateY(calc(var(--offset)*-47deg))}.card-art{height:185px}.card-caption strong{font-size:16px}.card-caption{padding-left:15px}.mode-glass .exhibit-card{width:188px;height:230px;transform:translate(calc(-50% + var(--offset)*185px),calc(-50% + var(--offset)*15px)) translateZ(calc(var(--abs-offset)*-170px)) rotateY(calc(var(--offset)*-20deg)) rotateZ(calc(var(--offset)*9deg))}.mode-glass .card-art{height:165px}.stage-arrow{width:34px;height:34px;font-size:16px;top:calc(50% - 17px)}.previous{left:12px}.next{right:12px}.stage-edge{left:14px;right:14px;font-size:8px;letter-spacing:.5px}.bottom-edge span:last-child{display:none}.tunnel-axis{display:none}.glass-orbit{width:420px}.spatial-footer{align-items:flex-start;gap:18px}.spatial-footer p{font-size:11px}.spatial-footer a{gap:15px;padding:11px 13px}.footer-index{display:none}.pearl-one{left:17%;top:14%}.pearl-two{right:17%;bottom:15%}}
@media(max-width:420px){.spatial-stage{height:330px}.exhibit-card{width:188px;height:229px}.card-art{height:164px}.card-overline{font-size:6px;left:13px;right:13px;top:13px}.card-caption strong{font-size:15px}.mode-glass .exhibit-card{width:173px;height:215px}.mode-glass .card-art{height:153px}.mode-glass .card-caption strong{font-size:15px}.top-edge{top:14px}.bottom-edge{bottom:14px}.spatial-toolbar{gap:8px}.project-dots button{width:22px}.motion-button{font-size:10px;gap:5px;padding:7px 8px}.spatial-footer{flex-direction:column;gap:16px}.spatial-footer a{width:100%;justify-content:space-between;box-sizing:border-box}.spatial-intro h3{font-size:25px}.spatial-eyebrow{font-size:9px}.glass-orbit{width:350px}}
@media(prefers-reduced-motion:reduce){.tunnel-frame,.mode-glass .spatial-cards,.glass-pearl{animation:none}.exhibit-card{transition:none}.spatial-cards,.tunnel-room{transform:none}}
</style>
