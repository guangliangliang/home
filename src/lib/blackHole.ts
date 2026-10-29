export interface BlackHoleOptions {
  onReady?: () => void;
  onUnavailable?: () => void;
  onViewChange?: (angle: number) => void;
}

const vertexSource = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

// An artistic light-bending study, rather than a scientific simulation.
const fragmentSource = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_angle;
uniform float u_intensity;
uniform vec2 u_pointer;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
vec3 stars(vec3 direction) {
  vec2 sky = vec2(atan(direction.x, direction.z), asin(clamp(direction.y, -1.0, 1.0)));
  vec3 result = vec3(0.0);
  for (int layer = 0; layer < 2; layer++) {
    float scale = 110.0 + float(layer) * 100.0;
    vec2 cell = floor(sky * scale), f = fract(sky * scale);
    float seed = hash(cell + float(layer) * 79.2);
    vec2 point = vec2(hash(cell + 14.0), hash(cell + 34.0));
    float dotSize = 0.04 + seed * 0.055;
    float spark = exp(-dot(f - point, f - point) / (dotSize * dotSize));
    spark *= smoothstep(0.965, 0.997, seed);
    vec3 tint = mix(vec3(0.43, 0.64, 1.0), vec3(1.0, 0.83, 0.61), hash(cell + 84.0));
    result += tint * spark * (0.4 + seed * 0.7);
  }
  float mist = noise(sky * 5.0 + 23.0) * noise(sky * 13.0);
  result += vec3(0.006, 0.004, 0.015) * mist;
  return result;
}

vec4 disk(vec3 p) {
  float r = length(p.xz);
  float edge = smoothstep(2.9, 3.6, r) * (1.0 - smoothstep(7.3, 10.6, r));
  float phi = atan(p.z, p.x);
  float flow = phi + u_time * (0.28 + 2.2 / sqrt(r * r * r));
  float bands = noise(vec2(r * 17.0, flow * 3.0));
  bands = bands * 0.55 + noise(vec2(r * 43.0, flow * 8.0)) * 0.3;
  bands += noise(vec2(r * 3.5, flow * 2.0)) * 0.15;
  float thread = 0.6 + 0.4 * sin(r * 34.0 + noise(vec2(flow * 5.0, r)) * 8.0);
  float heat = pow(3.0 / max(r, 3.0), 1.45);
  float asymmetric = 0.65 + 0.7 * smoothstep(-7.0, 7.0, p.x);
  float brightness = (0.55 + 1.55 * bands + 0.4 * thread) * heat * asymmetric;
  vec3 color = mix(vec3(1.0, 0.22, 0.035), vec3(1.0, 0.77, 0.39), clamp(heat * 1.25, 0.0, 1.0));
  color = mix(color, vec3(1.0, 0.94, 0.8), smoothstep(0.74, 1.0, heat) * 0.7);
  return vec4(color * brightness * 2.7 * u_intensity, edge * 0.97);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / u_resolution.y;
  // Keep the complete disk in view on narrow screens.
  float narrow = min(1.0, u_resolution.x / u_resolution.y / 1.9);
  uv /= max(narrow, 0.3);
  uv -= u_pointer * 0.035;
  float inclination = u_angle * 0.0174532925;
  vec3 origin = vec3(0.0, sin(inclination), cos(inclination)) * 18.0;
  vec3 up = vec3(0.0, cos(inclination), -sin(inclination));
  vec3 velocity = normalize(-normalize(origin) * 2.45 + vec3(1, 0, 0) * uv.x + up * uv.y);
  vec3 position = origin;
  vec3 impact = cross(position, velocity);
  float angular = dot(impact, impact);
  vec3 light = vec3(0.0);
  float transmission = 1.0;
  bool swallowed = false;
  for (int i = 0; i < 100; i++) {
    float radius = length(position);
    if (radius < 1.02) { swallowed = true; break; }
    if (radius > 24.0) break;
    float stepLength = clamp(radius * 0.085, 0.035, 0.72);
    vec3 acceleration = -1.5 * angular * position / pow(radius, 5.0);
    vec3 previous = position;
    position += velocity * stepLength + acceleration * stepLength * stepLength * 0.5;
    float nextRadius = length(position);
    vec3 nextAcceleration = -1.5 * angular * position / pow(max(nextRadius, 0.9), 5.0);
    velocity += (acceleration + nextAcceleration) * stepLength * 0.5;
    if (previous.y * position.y < 0.0) {
      float t = previous.y / (previous.y - position.y);
      vec4 emission = disk(mix(previous, position, t));
      light += emission.rgb * emission.a * transmission;
      transmission *= 1.0 - emission.a;
    }
  }
  if (!swallowed) light += stars(normalize(velocity)) * transmission;
  // A soft halo makes the hottest inner light visible without filling the shadow.
  float halo = exp(-abs(length(uv) - 0.36) * 12.0) * 0.012;
  if (!swallowed) light += vec3(1.0, 0.4, 0.08) * halo * u_intensity;
  light = vec3(1.0) - exp(-light * 1.12);
  light = pow(light, vec3(0.9));
  float vignette = 1.0 - smoothstep(0.6, 2.7, length(uv)) * 0.48;
  light *= vignette;
  // Composite the light over the page, while captured rays remain fully opaque.
  // This is premultiplied color: empty space has no dark rectangular backdrop.
  float brightness = max(light.r, max(light.g, light.b));
  float coverage = swallowed ? 1.0 : max(1.0 - transmission, brightness);
  vec2 screen = gl_FragCoord.xy / u_resolution;
  vec2 edgeDistance = min(screen, 1.0 - screen);
  float edgeFade = swallowed ? 1.0 : smoothstep(0.0, 0.07, min(edgeDistance.x, edgeDistance.y));
  gl_FragColor = vec4(light * edgeFade, coverage * edgeFade);
}
`;

export function createBlackHole(canvas: HTMLCanvasElement, options: BlackHoleOptions = {}) {
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let shaders: WebGLShader[] = [];
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  let destroyed = false;
  let lost = false;
  let visible = true;
  let paused = false;
  let frame = 0;
  let previousTime = 0;
  let time = 0;
  let angle = 16;
  let intensity = 1;
  let pointerX = 0;
  let pointerY = 0;
  let activePointer: number | null = null;
  let dragStartX = 0;
  let dragStartAngle = 16;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function releaseResources() {
    if (gl && !gl.isContextLost()) {
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      for (const shader of shaders) gl.deleteShader(shader);
    }
    buffer = null;
    program = null;
    shaders = [];
    uniforms = {};
  }

  function initialize() {
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
      if (!gl) throw new Error('WebGL unavailable');
      const context = gl;
      const compile = (type: number, source: string) => {
        const shader = context.createShader(type);
        if (!shader) throw new Error('Shader unavailable');
        shaders.push(shader);
        context.shaderSource(shader, source);
        context.compileShader(shader);
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) throw new Error('Shader compilation failed');
        return shader;
      };
      const vertex = compile(context.VERTEX_SHADER, vertexSource);
      const fragment = compile(context.FRAGMENT_SHADER, fragmentSource);
      program = context.createProgram();
      if (!program) throw new Error('Program unavailable');
      context.attachShader(program, vertex);
      context.attachShader(program, fragment);
      context.linkProgram(program);
      if (!context.getProgramParameter(program, context.LINK_STATUS)) throw new Error('Program linking failed');
      context.useProgram(program);
      buffer = context.createBuffer();
      if (!buffer) throw new Error('Buffer unavailable');
      context.bindBuffer(context.ARRAY_BUFFER, buffer);
      context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), context.STATIC_DRAW);
      const position = context.getAttribLocation(program, 'a_position');
      context.enableVertexAttribArray(position);
      context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
      for (const name of ['u_resolution', 'u_time', 'u_angle', 'u_intensity', 'u_pointer']) uniforms[name] = context.getUniformLocation(program, name);
      lost = false;
      resize();
      options.onReady?.();
      schedule();
    } catch {
      releaseResources();
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      gl = null;
      options.onUnavailable?.();
    }
  }

  function render() {
    if (!gl || !program || destroyed || lost) return;
    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.u_resolution ?? null, canvas.width, canvas.height);
    gl.uniform1f(uniforms.u_time ?? null, time);
    gl.uniform1f(uniforms.u_angle ?? null, angle);
    gl.uniform1f(uniforms.u_intensity ?? null, intensity);
    gl.uniform2f(uniforms.u_pointer ?? null, pointerX, pointerY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function canAnimate() {
    return !destroyed && !lost && !!program && visible && !document.hidden && !paused && !reducedMotion.matches;
  }

  function tick(now: number) {
    frame = 0;
    if (!canAnimate()) { previousTime = 0; return; }
    // Capped at 30 fps: the slowly orbiting light needs no faster updates.
    if (!previousTime || now - previousTime >= 32) {
      time += previousTime ? Math.min((now - previousTime) / 1000, 0.08) : 0;
      previousTime = now;
      render();
    }
    frame = requestAnimationFrame(tick);
  }

  function schedule() {
    if (canAnimate() && !frame) frame = requestAnimationFrame(tick);
    if (!canAnimate()) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const density = Math.min(window.devicePixelRatio || 1, 1.35, Math.sqrt(650000 / (rect.width * rect.height)));
    canvas.width = Math.max(1, Math.round(rect.width * density));
    canvas.height = Math.max(1, Math.round(rect.height * density));
    render();
  }

  function updateView(value: number) {
    angle = Math.max(6, Math.min(42, value));
    options.onViewChange?.(angle);
    render();
  }

  function onPointerDown(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0) return;
    activePointer = event.pointerId;
    dragStartX = event.clientX;
    dragStartAngle = angle;
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (activePointer === event.pointerId) {
      updateView(dragStartAngle + (event.clientX - dragStartX) * 0.08);
    } else if (event.pointerType === 'mouse') {
      const rect = canvas.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width * 2 - 1;
      pointerY = -((event.clientY - rect.top) / rect.height * 2 - 1);
      render();
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (activePointer !== event.pointerId) return;
    activePointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }

  function onPointerLeave() {
    pointerX = 0;
    pointerY = 0;
    if (activePointer === null) render();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    lost = true;
    schedule();
    options.onUnavailable?.();
  }

  function onContextRestored() {
    releaseResources();
    initialize();
  }

  function onVisibilityChange() { schedule(); }
  function onMotionChange() { render(); schedule(); }
  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    schedule();
  }, { rootMargin: '40px' });
  resizeObserver.observe(canvas);
  intersectionObserver.observe(canvas);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('lostpointercapture', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  document.addEventListener('visibilitychange', onVisibilityChange);
  reducedMotion.addEventListener('change', onMotionChange);
  initialize();

  return {
    setAngle: updateView,
    setIntensity(value: number) { intensity = Math.max(0.4, Math.min(2, value)); render(); },
    setPaused(value: boolean) { paused = value; schedule(); },
    reset() { angle = 16; intensity = 1; time = 0; pointerX = 0; pointerY = 0; options.onViewChange?.(angle); render(); },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      if (activePointer !== null && canvas.hasPointerCapture(activePointer)) canvas.releasePointerCapture(activePointer);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('lostpointercapture', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotion.removeEventListener('change', onMotionChange);
      releaseResources();
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      gl = null;
    },
  };
}
