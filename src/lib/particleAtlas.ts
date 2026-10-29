export type ParticleScene = "identity" | "ai" | "games" | "map";

export interface ParticleAtlas {
  setScene: (scene: ParticleScene) => void;
  burst: () => void;
  setPaused: (paused: boolean) => void;
  destroy: () => void;
}

interface AtlasOptions {
  onReady?: () => void;
  onUnavailable?: () => void;
}

const BODY_COUNT = 11200;
const ORBIT_COUNT = 720;
const STAR_COUNT = 480;
const COUNT = BODY_COUNT + ORBIT_COUNT + STAR_COUNT;
const DURATION = 1.8;
const TAU = Math.PI * 2;
const bounds: Record<ParticleScene, [number, number]> = {
  identity: [4.3, 1.65], ai: [3.5, 1.8], games: [3.45, 1.7], map: [2.5, 2.5],
};

const vertexSource = `
precision highp float;
attribute vec3 aFrom;
attribute vec3 aTo;
attribute vec4 aSeed;
uniform float uProgress;
uniform float uTime;
uniform float uScale;
uniform float uAspect;
uniform float uDpr;
uniform float uGlobe;
uniform float uMotion;
uniform vec2 uPointer;
varying vec3 vColor;
varying float vAlpha;

void main() {
  float eased = uProgress * uProgress * (3.0 - 2.0 * uProgress);
  float scatter = sin(uProgress * 3.14159265);
  scatter *= scatter;
  vec3 p = mix(aFrom, aTo, eased);
  p += aSeed.xyz * scatter * 2.5;

  float star = step(1.5, aSeed.w);
  float orbit = step(0.5, aSeed.w) * (1.0 - star);
  float phase = aSeed.x * 20.0 + aSeed.y * 11.0;
  p += vec3(sin(uTime * 0.7 + phase), cos(uTime * 0.55 + phase),
       sin(uTime * 0.35 + phase)) * (0.025 + scatter * 0.08) * uMotion;

  float angle = uPointer.x * 0.10 + uGlobe * uTime * 0.12;
  float c = cos(angle), s = sin(angle);
  p.xz = mat2(c, -s, s, c) * p.xz;
  float pitch = -uPointer.y * 0.055;
  p.yz = mat2(cos(pitch), -sin(pitch), sin(pitch), cos(pitch)) * p.yz;
  float perspective = 1.0 / max(0.65, 1.0 - p.z * 0.075);
  vec2 screen = p.xy * uScale * perspective;
  screen.x /= uAspect;

  // Pointer force is calculated in screen space, so it works at every aspect ratio.
  vec2 pointer = vec2(uPointer.x, -uPointer.y);
  vec2 delta = screen - pointer;
  delta.x *= uAspect;
  float distanceToPointer = length(delta);
  float force = exp(-distanceToPointer * distanceToPointer * 16.0) * 0.075 * uMotion;
  screen += normalize(delta + vec2(0.0001)) * force * (1.0 - orbit);

  if (star > 0.5) {
    screen = aTo.xy;
    screen.x += sin(uTime * 0.045 + phase) * 0.018 * uMotion;
    screen.y += cos(uTime * 0.04 + phase) * 0.012 * uMotion;
  }
  gl_Position = vec4(screen, 0.0, 1.0);
  float sparkle = pow(abs(aSeed.z), 9.0);
  float size = (4.2 + sparkle * 2.4) * perspective;
  size = mix(size, 2.2 + sparkle * 1.5, orbit);
  size = mix(size, 1.6 + sparkle * 1.7, star);
  gl_PointSize = min(10.0, size * uDpr);

  float gradient = clamp(0.50 + p.x * 0.10 + p.y * 0.11, 0.0, 1.0);
  vec3 cyan = vec3(0.20, 0.80, 1.0);
  vec3 violet = vec3(0.63, 0.38, 1.0);
  vColor = mix(cyan, violet, gradient);
  vColor = mix(vColor, vec3(0.73, 0.92, 1.0), sparkle * 0.60);
  float depth = mix(0.45, 1.0, smoothstep(-1.7, 1.5, p.z));
  float twinkle = 0.82 + 0.18 * sin(uTime * 1.1 + phase);
  vAlpha = depth * 0.82;
  vAlpha = mix(vAlpha, 0.30 * twinkle, orbit);
  vAlpha = mix(vAlpha, (0.12 + sparkle * 0.45) * twinkle, star);
}
`;

const fragmentSource = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 point = gl_PointCoord * 2.0 - 1.0;
  float d = dot(point, point);
  if (d > 1.0) discard;
  float core = exp(-d * 5.0);
  float halo = exp(-d * 2.5) * 0.30;
  gl_FragColor = vec4(vColor, (core + halo) * vAlpha);
}
`;

function randomGenerator(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

function rasterPoints(scene: "identity" | "games"): [number, number][] {
  const bitmap = document.createElement("canvas");
  bitmap.width = 1100;
  bitmap.height = 420;
  const ctx = bitmap.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [[0, 0]];
  ctx.fillStyle = "white";
  if (scene === "identity") {
    ctx.font = '900 280px "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("光亮亮", 550, 225);
  } else {
    // A controller silhouette with real negative-space controls, not an emoji font.
    ctx.beginPath();
    ctx.moveTo(360, 90);
    ctx.bezierCurveTo(300, 80, 258, 112, 240, 166);
    ctx.lineTo(199, 296);
    ctx.bezierCurveTo(182, 358, 243, 383, 282, 340);
    ctx.lineTo(356, 263);
    ctx.lineTo(744, 263);
    ctx.lineTo(818, 340);
    ctx.bezierCurveTo(857, 383, 918, 358, 901, 296);
    ctx.lineTo(860, 166);
    ctx.bezierCurveTo(842, 112, 800, 80, 740, 90);
    ctx.bezierCurveTo(624, 107, 476, 107, 360, 90);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(318, 144, 30, 100);
    ctx.fillRect(283, 179, 100, 30);
    for (const [x, y] of [[765, 153], [807, 194], [765, 235], [723, 194]]) {
      ctx.beginPath(); ctx.arc(x!, y!, 16, 0, TAU); ctx.fill();
    }
    ctx.fillRect(491, 157, 38, 11);
    ctx.fillRect(571, 157, 38, 11);
    for (const x of [435, 665]) {
      ctx.beginPath(); ctx.arc(x, 228, 25, 0, TAU); ctx.fill();
    }
  }
  const pixels = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
  const points: [number, number][] = [];
  const edge: [number, number][] = [];
  for (let y = 2; y < bitmap.height - 2; y += 2) {
    for (let x = 2; x < bitmap.width - 2; x += 2) {
      const index = (y * bitmap.width + x) * 4 + 3;
      if ((pixels[index] ?? 0) < 150) continue;
      const point: [number, number] = [(x - 550) * 0.0084, (218 - y) * 0.0084];
      points.push(point);
      if ((pixels[index - 8] ?? 0) < 150 || (pixels[index + 8] ?? 0) < 150
        || (pixels[index - bitmap.width * 8] ?? 0) < 150
        || (pixels[index + bitmap.width * 8] ?? 0) < 150) edge.push(point);
    }
  }
  // Reinforce the contours while retaining the grain inside each glyph.
  return points.length ? points.concat(edge, edge, edge) : [[0, 0]];
}

const continents: [number, number][][] = [
  [[-17, 36], [10, 37], [34, 31], [51, 11], [42, -12], [30, -35], [18, -35], [9, -5], [-16, 7]],
  [[-10, 36], [-10, 59], [23, 71], [45, 56], [80, 73], [170, 64], [145, 45], [123, 28], [106, 5], [95, 19], [78, 7], [65, 25], [43, 12], [30, 36]],
  [[-168, 66], [-136, 70], [-109, 76], [-54, 50], [-83, 25], [-100, 17], [-118, 33], [-128, 52]],
  [[-81, 12], [-60, 8], [-35, -7], [-52, -30], [-69, -55], [-76, -27]],
  [[112, -12], [137, -11], [153, -26], [145, -39], [114, -34]],
  [[-52, 60], [-25, 69], [-28, 82], [-60, 82]],
];

function isLand(lon: number, lat: number) {
  return continents.some((polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i]!; const b = polygon[j]!;
      if (((a[1] > lat) !== (b[1] > lat))
        && lon < (b[0] - a[0]) * (lat - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  });
}

function makeScene(scene: ParticleScene): Float32Array {
  const random = randomGenerator(751 + scene.length);
  const result = new Float32Array(COUNT * 3);
  const raster = scene === "identity" || scene === "games" ? rasterPoints(scene) : [];
  for (let i = 0; i < BODY_COUNT; i++) {
    let x = 0, y = 0, z = 0;
    if (scene === "identity" || scene === "games") {
      const point = raster[Math.floor(random() * raster.length)]!;
      x = point[0] + (random() - 0.5) * 0.014;
      y = point[1] + (random() - 0.5) * 0.014;
      z = (random() - 0.5) * 0.20;
    } else if (scene === "ai") {
      const t = random() * TAU;
      const around = random() * TAU;
      const radius = Math.sqrt(random()) * 0.23;
      x = 2.7 * Math.sin(t) + Math.cos(around) * radius;
      y = 1.08 * Math.sin(2 * t) + Math.sin(around) * radius;
      z = 0.6 * Math.cos(t) + Math.cos(around) * radius;
    } else {
      let lon: number, lat: number;
      if (i < BODY_COUNT * 0.44) {
        const horizontal = i % 2 === 0;
        lon = horizontal ? random() * 360 - 180 : (Math.floor(random() * 24) - 12) * 15;
        lat = horizontal ? (Math.floor(random() * 11) - 5) * 15 : random() * 180 - 90;
      } else {
        let attempts = 0;
        do { lon = random() * 360 - 180; lat = random() * 150 - 60; attempts++; }
        while (!isLand(lon, lat) && attempts < 80);
      }
      const longitude = (lon - 15) * Math.PI / 180;
      const latitude = lat * Math.PI / 180;
      const radius = 1.88 + random() * 0.025;
      x = radius * Math.cos(latitude) * Math.sin(longitude);
      y = radius * Math.sin(latitude);
      z = radius * Math.cos(latitude) * Math.cos(longitude);
    }
    result.set([x, y, z], i * 3);
  }
  const [rx, ry] = bounds[scene];
  for (let i = 0; i < ORBIT_COUNT; i++) {
    const t = i / ORBIT_COUNT * TAU * 2;
    const ring = i < ORBIT_COUNT / 2 ? 0.87 : 1.0;
    result.set([
      Math.cos(t) * rx * ring,
      Math.sin(t) * ry * 0.64 * ring + Math.cos(t) * 0.2,
      Math.sin(t) * 0.45 - 0.35,
    ], (BODY_COUNT + i) * 3);
  }
  for (let i = BODY_COUNT + ORBIT_COUNT; i < COUNT; i++) {
    result.set([random() * 2 - 1, random() * 2 - 1, random() * 2 - 1], i * 3);
  }
  return result;
}

export function createParticleAtlas(canvas: HTMLCanvasElement, options: AtlasOptions = {}): ParticleAtlas {
  const noop: ParticleAtlas = { setScene() {}, burst() {}, setPaused() {}, destroy() {} };
  let context: WebGLRenderingContext | null = null;
  try {
    context = canvas.getContext("webgl", {
      alpha: true, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: true, powerPreference: "low-power",
    });
  } catch { /* The component supplies an accessible static alternative. */ }
  if (!context) { options.onUnavailable?.(); return noop; }
  const gl = context;
  const scenes = new Map<ParticleScene, Float32Array>();
  const getScene = (name: ParticleScene) => {
    if (!scenes.has(name)) scenes.set(name, makeScene(name));
    return scenes.get(name)!;
  };
  let currentScene: ParticleScene = "identity";
  let target = getScene(currentScene);
  let from = target.slice();
  const random = randomGenerator(98631);
  const seeds = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    const layer = i >= BODY_COUNT + ORBIT_COUNT ? 2 : i >= BODY_COUNT ? 1 : 0;
    seeds.set([random() * 2 - 1, random() * 2 - 1, random() * 2 - 1, layer], i * 4);
    if (!layer) {
      from[i * 3] = from[i * 3]! + seeds[i * 4]! * 3;
      from[i * 3 + 1] = from[i * 3 + 1]! + seeds[i * 4 + 1]! * 2;
      from[i * 3 + 2] = from[i * 3 + 2]! + seeds[i * 4 + 2]! * 2;
    }
  }

  let program: WebGLProgram | null = null;
  let buffers: WebGLBuffer[] = [];
  let shaders: WebGLShader[] = [];
  let fromBuffer: WebGLBuffer | null = null;
  let targetBuffer: WebGLBuffer | null = null;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  let destroyed = false, lost = false, paused = false, inView = true;
  let frame = 0, lastFrame = 0, elapsed = 0, transitionAt = 0;
  let progress = 0, width = 1, height = 1, dpr = 1;
  let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;
  let previousBounds = bounds.identity;
  let globeFrom = 0, globeTo = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function deleteResources() {
    buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    shaders.forEach((shader) => gl.deleteShader(shader));
    if (program) gl.deleteProgram(program);
    buffers = []; shaders = []; program = null;
  }

  function initializeResources() {
    deleteResources();
    function compile(type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Shader unavailable");
      shaders.push(shader);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Shader compilation failed");
      return shader;
    }
    const nextProgram = gl.createProgram();
    if (!nextProgram) throw new Error("Program unavailable");
    program = nextProgram;
    gl.attachShader(nextProgram, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(nextProgram, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(nextProgram);
    if (!gl.getProgramParameter(nextProgram, gl.LINK_STATUS)) throw new Error("Program linking failed");
    gl.useProgram(nextProgram);
    function attribute(name: string, size: number, data: Float32Array) {
      const buffer = gl.createBuffer();
      if (!buffer) throw new Error("Buffer unavailable");
      buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      const location = gl.getAttribLocation(nextProgram, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
      return buffer;
    }
    fromBuffer = attribute("aFrom", 3, from);
    targetBuffer = attribute("aTo", 3, target);
    attribute("aSeed", 4, seeds);
    uniforms = {};
    for (const name of ["uProgress", "uTime", "uScale", "uAspect", "uDpr", "uGlobe", "uMotion", "uPointer"]) {
      uniforms[name] = gl.getUniformLocation(nextProgram, name);
    }
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    // The framebuffer holds premultiplied color: avoid a second alpha attenuation
    // when the browser composites the transparent canvas over its dark backdrop.
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
  }

  function canAnimate() {
    return !destroyed && !lost && !paused && !reducedMotion.matches && inView && !document.hidden;
  }

  function draw() {
    if (destroyed || lost || !program || width <= 0 || height <= 0) return;
    const eased = progress * progress * (3 - 2 * progress);
    const nextBounds = bounds[currentScene];
    const bx = previousBounds[0] + (nextBounds[0] - previousBounds[0]) * eased;
    const by = previousBounds[1] + (nextBounds[1] - previousBounds[1]) * eased;
    const aspect = width / height;
    const scale = Math.min(aspect * 0.90 / bx, 0.91 / by);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform1f(uniforms.uProgress ?? null, progress);
    gl.uniform1f(uniforms.uTime ?? null, elapsed);
    gl.uniform1f(uniforms.uScale ?? null, scale);
    gl.uniform1f(uniforms.uAspect ?? null, aspect);
    // Keep the framebuffer resolution sharp while reducing particle overlap on phones.
    gl.uniform1f(uniforms.uDpr ?? null, dpr * (width < 600 ? 0.68 : 1));
    gl.uniform1f(uniforms.uGlobe ?? null, globeFrom + (globeTo - globeFrom) * eased);
    gl.uniform1f(uniforms.uMotion ?? null, reducedMotion.matches ? 0 : 1);
    gl.uniform2f(uniforms.uPointer ?? null, smoothX, smoothY);
    gl.drawArrays(gl.POINTS, 0, COUNT);
  }

  function tick(now: number) {
    frame = 0;
    if (!canAnimate()) { lastFrame = 0; return; }
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 1 / 60;
    lastFrame = now;
    elapsed += dt;
    progress = Math.min(1, (elapsed - transitionAt) / DURATION);
    const damping = 1 - Math.exp(-dt * 5);
    smoothX += (pointerX - smoothX) * damping;
    smoothY += (pointerY - smoothY) * damping;
    draw();
    frame = requestAnimationFrame(tick);
  }

  function syncAnimation() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; lastFrame = 0;
    if (canAnimate()) frame = requestAnimationFrame(tick);
  }

  function resize() {
    if (destroyed) return;
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth; canvas.height = pixelHeight;
    }
    draw();
  }

  function uploadPositions() {
    if (lost || !program) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, fromBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, from, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, targetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, target, gl.DYNAMIC_DRAW);
  }

  function transition(scene: ParticleScene) {
    if (destroyed) return;
    const eased = progress * progress * (3 - 2 * progress);
    const scatter = Math.sin(progress * Math.PI) ** 2;
    const snapshot = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      for (let axis = 0; axis < 3; axis++) {
        const index = i * 3 + axis;
        snapshot[index] = from[index]! + (target[index]! - from[index]!) * eased
          + (i < BODY_COUNT + ORBIT_COUNT ? seeds[i * 4 + axis]! * scatter * 2.5 : 0);
      }
    }
    const currentBounds = bounds[currentScene];
    previousBounds = [
      previousBounds[0] + (currentBounds[0] - previousBounds[0]) * eased,
      previousBounds[1] + (currentBounds[1] - previousBounds[1]) * eased,
    ];
    globeFrom += (globeTo - globeFrom) * eased;
    globeTo = scene === "map" ? 1 : 0;
    from = snapshot;
    currentScene = scene;
    target = getScene(scene);
    progress = paused || reducedMotion.matches ? 1 : 0;
    transitionAt = elapsed - (progress === 1 ? DURATION : 0);
    uploadPositions();
    draw();
    syncAnimation();
  }

  function onPointer(event: PointerEvent) {
    if (paused || reducedMotion.matches || event.pointerType === "touch") return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerX = (event.clientX - rect.left) / rect.width * 2 - 1;
    pointerY = (event.clientY - rect.top) / rect.height * 2 - 1;
  }
  function onPointerLeave() { pointerX = 0; pointerY = 0; }
  function onPreference() {
    if (reducedMotion.matches) {
      progress = 1; transitionAt = elapsed - DURATION;
      smoothX = 0; smoothY = 0; pointerX = 0; pointerY = 0; draw();
    }
    syncAnimation();
  }
  function onContextLost(event: Event) {
    event.preventDefault(); lost = true; syncAnimation(); options.onUnavailable?.();
  }
  function onContextRestored() {
    if (destroyed) return;
    lost = false;
    try {
      initializeResources(); resize(); options.onReady?.(); syncAnimation();
    } catch { deleteResources(); lost = true; options.onUnavailable?.(); }
  }

  try { initializeResources(); }
  catch {
    deleteResources();
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    options.onUnavailable?.();
    return noop;
  }
  if (reducedMotion.matches) { progress = 1; transitionAt = elapsed - DURATION; }
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const intersectionObserver = new IntersectionObserver((entries) => {
    inView = entries.some((entry) => entry.isIntersecting);
    syncAnimation();
  }, { rootMargin: "60px" });
  intersectionObserver.observe(canvas);
  canvas.addEventListener("pointermove", onPointer, { passive: true });
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  document.addEventListener("visibilitychange", syncAnimation);
  window.addEventListener("resize", resize, { passive: true });
  reducedMotion.addEventListener("change", onPreference);
  options.onReady?.();
  syncAnimation();

  return {
    setScene(scene) { if (scene !== currentScene) transition(scene); },
    burst() { transition(currentScene); },
    setPaused(value) { paused = value; syncAnimation(); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect(); intersectionObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      document.removeEventListener("visibilitychange", syncAnimation);
      window.removeEventListener("resize", resize);
      reducedMotion.removeEventListener("change", onPreference);
      deleteResources(); scenes.clear();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
