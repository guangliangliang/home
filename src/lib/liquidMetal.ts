export type MetalFinish = 0 | 1 | 2;

type MetalOptions = {
  name: string;
  initialFinish?: MetalFinish;
  onReady?: () => void;
  onUnavailable?: () => void;
};

const vertexSource = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragmentSource = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uMask;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uFlow;
uniform float uFinish;

float field(vec2 uv) {
  vec2 encodedDistance = texture2D(uMask, uv).rg;
  return (dot(encodedDistance, vec2(256.0, 1.0)) / 257.0 - 0.5) * 48.0;
}

vec3 environment(vec3 r, vec2 uv, float time) {
  float sweep = r.y + r.x * 0.24 + sin(uv.x * 5.0 + time * 0.15) * 0.12;
  float band = smoothstep(-0.34, -0.12, sweep) - smoothstep(0.08, 0.16, sweep);
  float light = exp(-pow((sweep - 0.46) * 6.0, 2.0));
  float rim = exp(-pow((sweep + 0.67) * 11.0, 2.0));
  vec3 silver = mix(vec3(0.025, 0.035, 0.055), vec3(0.73, 0.81, 0.91), band);
  silver += light * vec3(1.15, 1.16, 1.18) + rim * vec3(0.53, 0.69, 0.90);
  silver += vec3(0.13, 0.16, 0.20) * (r.x * 0.5 + 0.5);
  vec3 gold = silver * vec3(1.30, 0.84, 0.33) + vec3(0.10, 0.035, 0.006);
  vec3 spectrum = 0.58 + 0.42 * cos(vec3(0.0, 2.1, 4.2) + sweep * 4.5 + uv.x * 4.0 + time * 0.14);
  vec3 iridescent = silver * (spectrum * 1.4 + 0.25) + spectrum * 0.12;
  return uFinish < 0.5 ? silver : (uFinish < 1.5 ? gold : iridescent);
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  float scale = min(0.84, aspect * 0.94 / 2.85714);
  vec2 uv = p / vec2(scale * 2.85714, scale) + vec2(0.5, 0.49);
  float time = uTime * 0.6;
  vec2 delta = vUv - uPointer;
  delta.x *= aspect;
  float influence = exp(-dot(delta, delta) * 13.0);
  uv += vec2(sin(uv.y * 17.0 + time), cos(uv.x * 12.0 - time * 0.72)) * 0.0035 * uFlow;
  uv += delta * influence * 0.025 * uFlow;
  float d = field(uv);
  // Wider normal differences smooth raster stair-steps without blurring the silhouette.
  vec2 texel = vec2(3.0 / 1200.0, 3.0 / 420.0);
  vec2 gradient = vec2(field(uv + vec2(texel.x, 0.0)) - field(uv - vec2(texel.x, 0.0)), field(uv + vec2(0.0, texel.y)) - field(uv - vec2(0.0, texel.y))) / 6.0;
  float waveA = cos(uv.x * 11.0 + uv.y * 6.0 + time * 0.72);
  float waveB = sin(uv.y * 14.0 - uv.x * 6.0 - time * 0.51);
  vec2 flowNormal = vec2(waveA * 0.36 + waveB * 0.16, waveB * 0.42 - waveA * 0.12) * uFlow;
  flowNormal += delta * influence * 1.6;
  float bevel = 1.9 * exp(-max(d, 0.0) * 0.13) + 0.05;
  vec3 normal = normalize(vec3(-gradient * bevel + flowNormal, 0.78));
  vec3 reflected = reflect(vec3(0.0, 0.0, -1.0), normal);
  vec3 metal = environment(reflected, uv, time);
  float edge = exp(-abs(d - 0.9) * 0.80);
  metal += edge * vec3(0.75, 0.82, 0.94);
  metal *= 0.80 + 0.20 * smoothstep(0.0, 9.0, d);
  float highlight = pow(max(dot(normal, normalize(vec3(-0.45, 0.75, 0.65))), 0.0), 32.0);
  metal += highlight * 0.8;
  float insideTexture = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  float mask = smoothstep(-0.7, 0.8, d) * insideTexture;
  vec3 ambient = uFinish < 0.5 ? vec3(0.66, 0.82, 1.0) : (uFinish < 1.5 ? vec3(1.0, 0.74, 0.36) : vec3(0.84, 0.62, 1.0));
  float glow = exp(-abs(d) * 0.24) * 0.13 * (1.0 - mask) * smoothstep(-24.0, -18.0, d) * insideTexture;
  // Premultiplied transparent output lets the site's own background show through.
  vec3 color = min(metal, vec3(1.0)) * mask + ambient * glow;
  gl_FragColor = vec4(color, mask + glow);
}`;

/** A small signed-distance mask gives the lettering a rounded, reflective bevel. */
function createNameMask(name: string) {
  const width = 1200;
  const height = 420;
  const surface = document.createElement("canvas");
  surface.width = width;
  surface.height = height;
  const context = surface.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  context.fillStyle = "white";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = '900 348px "Microsoft YaHei", "PingFang SC", sans-serif';
  context.fillText(name, width / 2, height / 2 + 13, width - 100);
  const rgba = context.getImageData(0, 0, width, height).data;
  const inside = new Float32Array(width * height);
  const outside = new Float32Array(width * height);
  for (let i = 0; i < inside.length; i++) {
    const filled = rgba[i * 4 + 3]! > 127;
    inside[i] = filled ? 10000 : 0;
    outside[i] = filled ? 0 : 10000;
  }
  function distancePass(data: Float32Array) {
    for (let y = 1; y < height; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        data[i] = Math.min(data[i]!, data[i - 1]! + 1, data[i - width]! + 1, data[i - width - 1]! + 1.4142, data[i - width + 1]! + 1.4142);
      }
    }
    for (let y = height - 2; y >= 0; y--) {
      for (let x = width - 2; x > 0; x--) {
        const i = y * width + x;
        data[i] = Math.min(data[i]!, data[i + 1]! + 1, data[i + width]! + 1, data[i + width + 1]! + 1.4142, data[i + width - 1]! + 1.4142);
      }
    }
  }
  distancePass(inside);
  distancePass(outside);
  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < inside.length; i++) {
    // RG encodes a 16-bit distance; both channels remain linearly filterable.
    const packed = Math.round(Math.max(0, Math.min(1, 0.5 + (inside[i]! - outside[i]!) / 48)) * 65535);
    pixels[i * 4] = packed >> 8;
    pixels[i * 4 + 1] = packed & 255;
    pixels[i * 4 + 3] = 255;
  }
  return { width, height, pixels };
}

export function createLiquidMetal(canvas: HTMLCanvasElement, options: MetalOptions) {
  const mask = createNameMask(options.name);
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) throw new Error("WebGL is unavailable");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  let frame = 0;
  let disposed = false;
  let lost = false;
  let visible = true;
  let paused = false;
  let time = 1.8;
  let previous = 0;
  let finish: MetalFinish = options.initialFinish ?? 0;
  let flow = 1;
  const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };

  function initialize() {
    function shader(type: number, source: string) {
      const result = gl!.createShader(type);
      if (!result) throw new Error("Cannot create shader");
      gl!.shaderSource(result, source);
      gl!.compileShader(result);
      if (!gl!.getShaderParameter(result, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(result);
        throw new Error("Cannot compile liquid metal shader");
      }
      return result;
    }
    const vertex = shader(gl!.VERTEX_SHADER, vertexSource);
    const fragment = shader(gl!.FRAGMENT_SHADER, fragmentSource);
    program = gl!.createProgram();
    if (!program) throw new Error("Cannot create shader program");
    gl!.attachShader(program, vertex);
    gl!.attachShader(program, fragment);
    gl!.linkProgram(program);
    gl!.deleteShader(vertex);
    gl!.deleteShader(fragment);
    if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) throw new Error("Cannot link liquid metal shader");
    gl!.useProgram(program);
    buffer = gl!.createBuffer();
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
    gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl!.STATIC_DRAW);
    const position = gl!.getAttribLocation(program, "aPosition");
    gl!.enableVertexAttribArray(position);
    gl!.vertexAttribPointer(position, 2, gl!.FLOAT, false, 0, 0);
    texture = gl!.createTexture();
    gl!.bindTexture(gl!.TEXTURE_2D, texture);
    gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, false);
    // Typed-array textures do not use UNPACK_FLIP_Y: flip rows explicitly.
    const flipped = new Uint8Array(mask.pixels.length);
    for (let row = 0; row < mask.height; row++) {
      flipped.set(mask.pixels.subarray(row * mask.width * 4, (row + 1) * mask.width * 4), (mask.height - row - 1) * mask.width * 4);
    }
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, mask.width, mask.height, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, flipped);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    uniforms = Object.fromEntries(["uResolution", "uPointer", "uTime", "uFlow", "uFinish", "uMask"].map((name) => [name, gl!.getUniformLocation(program!, name)]));
    gl!.uniform1i(uniforms.uMask!, 0);
    options.onReady?.();
  }

  function draw() {
    if (disposed || lost || !program) return;
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.uniform2f(uniforms.uResolution!, canvas.width, canvas.height);
    gl!.uniform2f(uniforms.uPointer!, pointer.x, pointer.y);
    gl!.uniform1f(uniforms.uTime!, time);
    gl!.uniform1f(uniforms.uFlow!, flow);
    gl!.uniform1f(uniforms.uFinish!, finish);
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
  }

  function shouldAnimate() { return !disposed && !lost && visible && !document.hidden && !paused && !reduced.matches; }

  function tick(now: number) {
    frame = 0;
    if (!shouldAnimate()) return;
    time += previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    pointer.x += (pointer.targetX - pointer.x) * 0.08;
    pointer.y += (pointer.targetY - pointer.y) * 0.08;
    draw();
    frame = requestAnimationFrame(tick);
  }

  function schedule() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (shouldAnimate()) frame = requestAnimationFrame(tick);
    else if (!document.hidden && visible) draw();
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    draw();
  }

  function move(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    const bounds = canvas.getBoundingClientRect();
    pointer.targetX = (event.clientX - bounds.left) / bounds.width;
    pointer.targetY = 1 - (event.clientY - bounds.top) / bounds.height;
    if (reduced.matches && !paused) { pointer.x = pointer.targetX; pointer.y = pointer.targetY; draw(); }
  }

  function leave() { pointer.targetX = 0.5; pointer.targetY = 0.5; }
  function onLost(event: Event) { event.preventDefault(); lost = true; cancelAnimationFrame(frame); options.onUnavailable?.(); }
  function onRestored() {
    lost = false;
    try { initialize(); resize(); schedule(); } catch { lost = true; options.onUnavailable?.(); }
  }

  try { initialize(); resize(); }
  catch (error) {
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    throw error;
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const intersectionObserver = new IntersectionObserver((entries) => { visible = entries[0]?.isIntersecting ?? true; schedule(); }, { rootMargin: "80px" });
  intersectionObserver.observe(canvas);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerleave", leave);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  document.addEventListener("visibilitychange", schedule);
  reduced.addEventListener("change", schedule);
  schedule();

  return {
    setFinish(value: MetalFinish) { finish = value; draw(); },
    setFlow(value: number) { flow = value; draw(); },
    setPaused(value: boolean) { paused = value; schedule(); },
    reset() { time = 1.8; pointer.x = pointer.targetX = 0.5; pointer.y = pointer.targetY = 0.5; draw(); },
    destroy() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      document.removeEventListener("visibilitychange", schedule);
      reduced.removeEventListener("change", schedule);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
