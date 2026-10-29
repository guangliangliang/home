export interface WaterCausticsOptions {
  onReady?: () => void;
  onUnavailable?: () => void;
}

const vertexSource = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const fragmentSource = `
precision highp float;
uniform sampler2D u_water;
uniform sampler2D u_lettering;
uniform vec2 u_resolution;
uniform vec2 u_texel;
uniform float u_time;
uniform float u_strength;

float heightAt(vec2 p) {
  vec2 encoded = texture2D(u_water, clamp(p, vec2(0.0), vec2(1.0))).rg;
  return (encoded.r + encoded.g / 255.0 - 0.5) / 0.12;
}
vec2 hash(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}
// The moving cellular lattice represents light gathering on the pool floor.
float caustic(vec2 p) {
  vec2 cell = floor(p), local = fract(p);
  float first = 8.0, second = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 random = hash(cell + neighbor);
      vec2 point = 0.5 + 0.36 * sin(u_time * 0.32 + random * 6.28318);
      vec2 delta = neighbor + point - local;
      float distance = dot(delta, delta);
      second = min(second, max(first, distance));
      first = min(first, distance);
    }
  }
  return pow(1.0 - smoothstep(0.015, 0.16, second - first), 2.0);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  float center = heightAt(uv);
  float left = heightAt(uv - vec2(u_texel.x, 0.0));
  float right = heightAt(uv + vec2(u_texel.x, 0.0));
  float down = heightAt(uv - vec2(0.0, u_texel.y));
  float up = heightAt(uv + vec2(0.0, u_texel.y));
  vec2 gradient = vec2(left - right, down - up) * 2.8 * u_strength;
  vec2 refracted = uv + gradient * vec2(1.0 / aspect, 1.0) * 0.12;
  vec2 floorPosition = refracted * vec2(aspect, 1.0);
  vec2 grid = abs(fract(floorPosition * 9.0) - 0.5);
  float grout = smoothstep(0.467, 0.49, max(grid.x, grid.y));
  float poolLight = exp(-length((uv - vec2(0.40, 0.65)) * vec2(0.75 * aspect, 1.0)) * 1.3);
  vec3 color = mix(vec3(0.005, 0.105, 0.17), vec3(0.02, 0.47, 0.53), poolLight);
  color *= 1.0 - grout * 0.20;
  float shimmer = caustic(floorPosition * 6.0 + gradient * 0.48);
  float fine = caustic(floorPosition * 9.3 - vec2(u_time * 0.025, 0.0) - gradient * 0.35);
  color += vec3(0.28, 0.88, 0.77) * (shimmer * 0.44 + fine * 0.13) * (0.45 + poolLight);
  vec2 textUV = (refracted - 0.5) * vec2(aspect / 1.65, 1.0) + 0.5;
  float lettering = texture2D(u_lettering, textUV).a;
  lettering *= step(0.0, textUV.x) * step(textUV.x, 1.0);
  color = mix(color, vec3(0.55, 0.89, 0.83) * (0.6 + shimmer * 0.4), lettering * 0.24);
  vec3 normal = normalize(vec3(gradient, 0.62));
  float reflection = pow(max(dot(normal, normalize(vec3(-0.3, 0.6, 1.0))), 0.0), 36.0);
  float curvature = (left + right + down + up - 4.0 * center) * u_strength;
  color += vec3(0.48, 0.94, 1.0) * reflection * 0.60;
  color += vec3(0.10, 0.74, 0.84) * min(abs(curvature) * 4.0, 0.36);
  color += vec3(0.07, 0.23, 0.25) * sin(center * 6.0) * u_strength;
  float edge = smoothstep(0.0, 0.22, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
  color *= 0.66 + edge * 0.34;
  gl_FragColor = vec4(color, 1.0);
}
`;

export function createWaterCaustics(canvas: HTMLCanvasElement, options: WaterCausticsOptions = {}) {
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let waterTexture: WebGLTexture | null = null;
  let letteringTexture: WebGLTexture | null = null;
  const shaders: WebGLShader[] = [];
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  const rows = 96;
  let columns = 192;
  let current = new Float32Array(columns * rows);
  let previous = new Float32Array(columns * rows);
  let next = new Float32Array(columns * rows);
  let pixels = new Uint8Array(columns * rows * 4);
  let frame = 0;
  let interactionFrame = 0;
  let interactionPending = false;
  let interactionSteps = 0;
  let lastTime = 0;
  let time = 0;
  let nextDrop = 2.8;
  let dropNumber = 0;
  let strength = 1;
  let paused = false;
  let visible = true;
  let lost = false;
  let destroyed = false;
  let activePointer: number | null = null;
  let lastPointer: { x: number; y: number } | null = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function releaseResources() {
    if (gl && !gl.isContextLost()) {
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      if (waterTexture) gl.deleteTexture(waterTexture);
      if (letteringTexture) gl.deleteTexture(letteringTexture);
      shaders.forEach((shader) => gl?.deleteShader(shader));
    }
    buffer = null;
    program = null;
    waterTexture = null;
    letteringTexture = null;
    shaders.length = 0;
    uniforms = {};
  }

  function disturb(x: number, y: number, amplitude = 0.45) {
    const cx = x * (columns - 1), cy = y * (rows - 1);
    const radius = 4;
    for (let row = Math.max(1, Math.floor(cy - radius)); row <= Math.min(rows - 2, cy + radius); row++) {
      for (let col = Math.max(1, Math.floor(cx - radius)); col <= Math.min(columns - 2, cx + radius); col++) {
        const distance = ((col - cx) ** 2 + (row - cy) ** 2) / (radius * radius);
        if (distance < 1) {
          const index = row * columns + col;
          current[index] = Math.max(-2, Math.min(2, current[index]! + (Math.cos(Math.sqrt(distance) * Math.PI) + 1) * amplitude * 0.5));
        }
      }
    }
  }

  function step() {
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < columns - 1; x++) {
        const index = y * columns + x;
        const value = current[index]!;
        const laplacian = current[index - 1]! + current[index + 1]! + current[index - columns]! + current[index + columns]! - 4 * value;
        const boundary = Math.min(x, y, columns - 1 - x, rows - 1 - y);
        const damping = boundary < 6 ? 0.91 + boundary * 0.014 : 0.995;
        next[index] = Math.max(-2, Math.min(2, (2 * value - previous[index]! + laplacian * 0.24) * damping));
      }
    }
    const reusable = previous;
    previous = current;
    current = next;
    next = reusable;
  }

  function seed() {
    cancelAnimationFrame(interactionFrame);
    interactionFrame = 0;
    interactionPending = false;
    interactionSteps = 0;
    current.fill(0);
    previous.fill(0);
    next.fill(0);
    disturb(0.30, 0.60, 0.7);
    disturb(0.70, 0.37, 0.5);
    for (let i = 0; i < 20; i++) step();
  }

  function uploadWater() {
    if (!gl || !waterTexture) return;
    for (let index = 0; index < current.length; index++) {
      const encoded = Math.round(Math.max(0, Math.min(1, 0.5 + current[index]! * 0.12)) * 65025);
      pixels[index * 4] = Math.floor(encoded / 255);
      pixels[index * 4 + 1] = encoded % 255;
      pixels[index * 4 + 2] = 0;
      pixels[index * 4 + 3] = 255;
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, waterTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, columns, rows, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  }

  function render() {
    if (!gl || !program || lost || destroyed) return;
    uploadWater();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.uniform2f(uniforms.u_resolution!, canvas.width, canvas.height);
    gl.uniform2f(uniforms.u_texel!, 1 / columns, 1 / rows);
    gl.uniform1f(uniforms.u_time!, time);
    gl.uniform1f(uniforms.u_strength!, strength);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function canRender() {
    return !destroyed && !lost && !!program && visible && !document.hidden;
  }

  function canAnimate() {
    return canRender() && !paused && !reducedMotion.matches;
  }

  function renderInteraction() {
    interactionFrame = 0;
    if (!canRender() || canAnimate()) return;
    for (let i = 0; i < interactionSteps; i++) step();
    interactionPending = false;
    interactionSteps = 0;
    render();
  }

  function requestInteractionRender(steps = 0) {
    interactionPending = true;
    // Coalesce static previews as well as their simulation work into one frame.
    interactionSteps = Math.max(interactionSteps, steps);
    schedule();
  }

  function tick(now: number) {
    frame = 0;
    if (!canAnimate()) { lastTime = 0; return; }
    if (!lastTime || now - lastTime >= 31) {
      const elapsed = lastTime ? Math.min((now - lastTime) / 1000, 0.075) : 1 / 30;
      lastTime = now;
      time += elapsed;
      // Two fixed substeps keep the 2D wave equation stable at the 30 fps draw rate.
      step();
      step();
      if (time >= nextDrop && activePointer === null) {
        dropNumber++;
        disturb(0.18 + ((dropNumber * 0.381966) % 0.64), 0.22 + ((dropNumber * 0.267949) % 0.56), 0.21);
        nextDrop = time + 3.6;
      }
      interactionPending = false;
      interactionSteps = 0;
      render();
    }
    frame = requestAnimationFrame(tick);
  }

  function schedule() {
    if (canAnimate()) {
      cancelAnimationFrame(interactionFrame);
      interactionFrame = 0;
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      if (!canRender()) {
        cancelAnimationFrame(interactionFrame);
        interactionFrame = 0;
      } else if (interactionPending && !interactionFrame) {
        interactionFrame = requestAnimationFrame(renderInteraction);
      }
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height || !gl || !waterTexture) return;
    const density = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(550000 / (rect.width * rect.height)));
    canvas.width = Math.max(1, Math.round(rect.width * density));
    canvas.height = Math.max(1, Math.round(rect.height * density));
    const targetColumns = Math.round(Math.max(96, Math.min(224, rows * rect.width / rect.height)));
    if (columns !== targetColumns) {
      columns = targetColumns;
      current = new Float32Array(columns * rows);
      previous = new Float32Array(columns * rows);
      next = new Float32Array(columns * rows);
      pixels = new Uint8Array(columns * rows * 4);
      seed();
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, waterTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, columns, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    render();
  }

  function initialize() {
    if (destroyed) return;
    try {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
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
      for (const name of ['u_water', 'u_lettering', 'u_resolution', 'u_texel', 'u_time', 'u_strength']) {
        uniforms[name] = context.getUniformLocation(program, name);
      }
      const texture = (unit: number) => {
        const result = context.createTexture();
        if (!result) throw new Error('Texture unavailable');
        context.activeTexture(context.TEXTURE0 + unit);
        context.bindTexture(context.TEXTURE_2D, result);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
        return result;
      };
      waterTexture = texture(0);
      context.uniform1i(uniforms.u_water!, 0);
      letteringTexture = texture(1);
      const lettering = document.createElement('canvas');
      lettering.width = 1024;
      lettering.height = 512;
      const ink = lettering.getContext('2d');
      if (ink) {
        ink.textAlign = 'center';
        ink.textBaseline = 'middle';
        ink.fillStyle = '#fff';
        ink.font = '600 148px system-ui, sans-serif';
        ink.fillText('光亮亮', 512, 256);
      }
      context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);
      context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, lettering);
      context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, false);
      context.uniform1i(uniforms.u_lettering!, 1);
      lost = false;
      seed();
      resize();
      options.onReady?.();
      schedule();
    } catch {
      releaseResources();
      options.onUnavailable?.();
    }
  }

  function positionOf(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    return { x: Math.max(0.02, Math.min(0.98, (event.clientX - rect.left) / rect.width)), y: Math.max(0.02, Math.min(0.98, 1 - (event.clientY - rect.top) / rect.height)) };
  }

  function onPointerDown(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0 || !program || lost) return;
    activePointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    lastPointer = positionOf(event);
    disturb(lastPointer.x, lastPointer.y, 0.48);
    requestInteractionRender(12);
  }

  function onPointerMove(event: PointerEvent) {
    if (activePointer !== event.pointerId || !lastPointer) return;
    const point = positionOf(event);
    const distance = Math.hypot((point.x - lastPointer.x) * columns, (point.y - lastPointer.y) * rows);
    if (distance < 1.2) return;
    const count = Math.min(16, Math.ceil(distance / 3));
    for (let i = 1; i <= count; i++) {
      disturb(lastPointer.x + (point.x - lastPointer.x) * i / count, lastPointer.y + (point.y - lastPointer.y) * i / count, 0.14);
    }
    lastPointer = point;
    requestInteractionRender(6);
  }

  function releasePointer() {
    const pointer = activePointer;
    activePointer = null;
    lastPointer = null;
    if (pointer !== null && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerId === activePointer) releasePointer();
  }

  function drop() {
    if (!program || lost) return;
    disturb(0.5, 0.5, 0.65);
    requestInteractionRender(12);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); drop(); }
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    lost = true;
    releasePointer();
    schedule();
    options.onUnavailable?.();
  }

  function onContextRestored() { releaseResources(); initialize(); }
  function onVisibilityChange() { if (document.hidden) releasePointer(); schedule(); }
  function onMotionChange() { requestInteractionRender(); }
  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (!visible) releasePointer();
    schedule();
  }, { rootMargin: '40px' });
  resizeObserver.observe(canvas);
  intersectionObserver.observe(canvas);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('lostpointercapture', onPointerUp);
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('blur', releasePointer);
  reducedMotion.addEventListener('change', onMotionChange);
  initialize();

  return {
    drop,
    setStrength(value: number) { strength = Math.max(0.4, Math.min(1.8, value)); render(); },
    setPaused(value: boolean) { paused = value; releasePointer(); schedule(); },
    reset() { releasePointer(); time = 0; nextDrop = 2.8; dropNumber = 0; seed(); render(); },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(interactionFrame);
      releasePointer();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('lostpointercapture', onPointerUp);
      canvas.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', releasePointer);
      reducedMotion.removeEventListener('change', onMotionChange);
      releaseResources();
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      gl = null;
    },
  };
}
