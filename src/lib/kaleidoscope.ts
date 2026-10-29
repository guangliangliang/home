export type KaleidoscopeSymmetry = 6 | 8 | 12;
export type KaleidoscopePalette = "electric" | "sunset" | "aurora";

type Point = { x: number; y: number };
type Stroke = { points: Point[]; color: number };
type Options = {
  symmetry?: KaleidoscopeSymmetry;
  palette?: KaleidoscopePalette;
  onDraw?: () => void;
};

const palettes: Record<KaleidoscopePalette, readonly string[]> = {
  electric: ["#77eaff", "#b391ff", "#ff7edb", "#b9f7ff"],
  sunset: ["#ffb76e", "#ff6aa8", "#ffe8a6", "#d699ff"],
  aurora: ["#69ffd2", "#81caff", "#beff9a", "#bca3ff"],
};

/** Event-driven drawing: idle canvases do no animation work. */
export function createKaleidoscope(canvas: HTMLCanvasElement, options: Options = {}) {
  const context = canvas.getContext("2d", { alpha: false });
  const ink = document.createElement("canvas");
  const inkContext = ink.getContext("2d");
  if (!context || !inkContext) throw new Error("Canvas drawing is unavailable");
  const ctx = context;
  const paint = inkContext;
  let symmetry = options.symmetry ?? 8;
  let palette = options.palette ?? "electric";
  let width = 1;
  let height = 1;
  let dpr = 1;
  let radius = 1;
  let strokes: Stroke[] = [];
  let activeStroke: Stroke | undefined;
  let activePointer: number | undefined;
  let pointCount = 0;
  let exampleIndex = 0;
  let frame = 0;
  let disposed = false;
  const maxPoints = 12000;

  function trace(points: Point[], onlyTail: boolean) {
    const first = points[0];
    if (!first) return;
    if (points.length === 1) {
      paint.moveTo(first.x * radius - .15, first.y * radius);
      paint.lineTo(first.x * radius + .15, first.y * radius);
      return;
    }
    const start = onlyTail ? Math.max(0, points.length - 3) : 0;
    const a = points[start]!;
    const b = points[start + 1]!;
    if (onlyTail && points.length > 2) {
      paint.moveTo((a.x + b.x) * radius / 2, (a.y + b.y) * radius / 2);
    } else {
      paint.moveTo(a.x * radius, a.y * radius);
    }
    const begin = onlyTail ? points.length - 2 : 0;
    for (let i = begin; i < points.length - 1; i++) {
      const p = points[i]!;
      const next = points[i + 1]!;
      paint.quadraticCurveTo(p.x * radius, p.y * radius, (p.x + next.x) * radius / 2, (p.y + next.y) * radius / 2);
    }
  }

  function drawStroke(stroke: Stroke, onlyTail = false) {
    const color = palettes[palette][stroke.color % palettes[palette].length]!;
    paint.save();
    paint.translate(width / 2, height / 2);
    paint.lineCap = "round";
    paint.lineJoin = "round";
    // One path for every mirrored sector keeps a long drawing inexpensive.
    for (let pass = 0; pass < 2; pass++) {
      paint.beginPath();
      for (let sector = 0; sector < symmetry; sector++) {
        paint.save();
        paint.rotate(sector * Math.PI * 2 / symmetry);
        trace(stroke.points, onlyTail);
        paint.scale(1, -1);
        trace(stroke.points, onlyTail);
        paint.restore();
      }
      paint.strokeStyle = pass === 0 ? color : "#ffffff";
      paint.globalAlpha = pass === 0 ? .76 : .62;
      paint.lineWidth = pass === 0 ? 1.5 : .55;
      paint.shadowColor = color;
      paint.shadowBlur = pass === 0 ? 9 * dpr : 0;
      paint.stroke();
    }
    paint.restore();
  }

  function present() {
    frame = 0;
    if (disposed) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#070b20";
    ctx.fillRect(0, 0, width, height);
    const aura = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, radius * 1.5);
    aura.addColorStop(0, "#242550");
    aura.addColorStop(.52, "#121734");
    aura.addColorStop(1, "#070b20");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, width, height);
    // Subtle circular guides keep an empty canvas inviting after clearing.
    ctx.strokeStyle = "#b6ceff12";
    ctx.lineWidth = 1;
    for (const scale of [.33, .66, 1]) {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, radius * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.drawImage(ink, 0, 0, width, height);
    ctx.fillStyle = "#d4edff75";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function requestPresent() {
    if (!frame && !disposed) frame = requestAnimationFrame(present);
  }

  function redraw() {
    paint.setTransform(1, 0, 0, 1, 0, 0);
    paint.clearRect(0, 0, ink.width, ink.height);
    paint.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const stroke of strokes) drawStroke(stroke);
    requestPresent();
  }

  function stopDrawing() {
    const pointer = activePointer;
    activePointer = undefined;
    activeStroke = undefined;
    if (pointer !== undefined && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
  }

  function clear() {
    stopDrawing();
    strokes = [];
    pointCount = 0;
    redraw();
  }

  function showExample() {
    clear();
    const variation = exampleIndex++ % 4;
    for (let layer = 0; layer < 4; layer++) {
      const stroke: Stroke = { points: [], color: layer };
      for (let step = 0; step <= 180; step++) {
        const t = step / 180 * Math.PI * 2;
        const distance = .12 + (.72 - layer * .11) * (1 - Math.cos(t)) / 2;
        const angle = Math.sin(t) * (Math.PI / symmetry) * (.82 - layer * .09)
          + Math.sin(t * (variation + 1)) * variation * .014 + layer * .014;
        stroke.points.push({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
      }
      strokes.push(stroke);
      pointCount += stroke.points.length;
    }
    // Small floating diamonds give the sample its luminous outer crown.
    const diamond: Stroke = { points: [], color: 2 };
    for (const [r, angle] of [[.87, 0], [.92, .035], [.97, 0], [.92, -.035], [.87, 0]]) {
      diamond.points.push({ x: Math.cos(angle!) * r!, y: Math.sin(angle!) * r! });
    }
    strokes.push(diamond);
    pointCount += diamond.points.length;
    redraw();
  }

  function pointerPosition(event: PointerEvent): Point {
    const bounds = canvas.getBoundingClientRect();
    return { x: (event.clientX - bounds.left - width / 2) / radius, y: (event.clientY - bounds.top - height / 2) / radius };
  }

  function pointerDown(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0 || activePointer !== undefined) return;
    activePointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    activeStroke = { points: [pointerPosition(event)], color: strokes.length % 4 };
    strokes.push(activeStroke);
    pointCount++;
    if (pointCount > maxPoints && strokes.length > 1) {
      pointCount -= strokes.shift()!.points.length;
      redraw();
    } else {
      drawStroke(activeStroke);
      requestPresent();
    }
    options.onDraw?.();
  }

  function pointerMove(event: PointerEvent) {
    if (activePointer !== event.pointerId || !activeStroke) return;
    const point = pointerPosition(event);
    const last = activeStroke.points[activeStroke.points.length - 1]!;
    if (Math.hypot(point.x - last.x, point.y - last.y) * radius < 1.2) return;
    activeStroke.points.push(point);
    pointCount++;
    if (pointCount > maxPoints) {
      // Bound both memory and resize cost, even after a long drawing session.
      if (strokes.length > 1) {
        pointCount -= strokes.shift()!.points.length;
      } else {
        activeStroke.points = activeStroke.points.slice(-Math.floor(maxPoints / 2));
        pointCount = activeStroke.points.length;
      }
      redraw();
    } else {
      drawStroke(activeStroke, true);
      requestPresent();
    }
  }

  function pointerEnd(event: PointerEvent) {
    if (event.pointerId !== activePointer) return;
    if (activeStroke && activeStroke.points.length > 1) {
      activeStroke.points.push({ ...activeStroke.points[activeStroke.points.length - 1]! });
      pointCount++;
      drawStroke(activeStroke, true);
      requestPresent();
    }
    stopDrawing();
  }

  function onVisibilityChange() {
    if (document.hidden) stopDrawing();
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    stopDrawing();
    width = bounds.width;
    height = bounds.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    radius = Math.min(width, height) * .43;
    canvas.width = ink.width = Math.max(1, Math.round(width * dpr));
    canvas.height = ink.height = Math.max(1, Math.round(height * dpr));
    redraw();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener("resize", resize);
  window.addEventListener("blur", stopDrawing);
  document.addEventListener("visibilitychange", onVisibilityChange);
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerEnd);
  canvas.addEventListener("pointercancel", pointerEnd);
  canvas.addEventListener("lostpointercapture", pointerEnd);
  resize();
  showExample();

  return {
    setSymmetry(value: KaleidoscopeSymmetry) { stopDrawing(); symmetry = value; redraw(); },
    setPalette(value: KaleidoscopePalette) { palette = value; redraw(); },
    clear,
    showExample,
    destroy() {
      disposed = true;
      stopDrawing();
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", stopDrawing);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerEnd);
      canvas.removeEventListener("pointercancel", pointerEnd);
      canvas.removeEventListener("lostpointercapture", pointerEnd);
      strokes = [];
      ink.width = ink.height = 0;
    },
  };
}
