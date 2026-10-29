export type FlockMode = 'birds' | 'fish';

type FlockOptions = { onUnavailable?: () => void };
type Boid = { x: number; y: number; vx: number; vy: number; size: number; phase: number; shade: number };

/** A small boids simulation in CSS-pixel space. All three flocking forces use neighbours. */
export function createFlockField(canvas: HTMLCanvasElement, options: FlockOptions = {}) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    options.onUnavailable?.();
    return { setMode(_mode: FlockMode) {}, setPaused(_paused: boolean) {}, scatter() {}, reset() {}, destroy() {} };
  }
  const ctx = context;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 1;
  let height = 1;
  let density = 1;
  let mode: FlockMode = 'birds';
  let boids: Boid[] = [];
  let time = 0;
  let frame = 0;
  let last = 0;
  let paused = false;
  let visible = true;
  let destroyed = false;
  let backdrop: CanvasGradient | null = null;
  let halo: CanvasGradient | null = null;
  const pointer = { x: 0, y: 0, active: false, id: null as number | null };

  function populate() {
    const count = width < 600 ? 78 : 124;
    boids = Array.from({ length: count }, (_, index) => {
      const angle = index * 2.399963;
      const radius = Math.sqrt((index + .5) / count);
      return {
        x: width * .5 + Math.cos(angle) * radius * width * .28,
        y: height * .5 + Math.sin(angle) * radius * height * .28,
        vx: Math.cos(-.2 + Math.sin(index * 1.7) * .35) * 64,
        vy: Math.sin(-.2 + Math.sin(index * 1.7) * .35) * 64,
        size: 3.7 + (index % 7) * .28,
        phase: index * 1.618,
        shade: index % 4,
      };
    });
  }

  function update(dt: number) {
    // Read every neighbour from the same simulation step, then integrate together.
    const accelerations: { x: number; y: number }[] = [];
    const sight = Math.min(100, width * .24);
    const sightSquared = sight * sight;
    const separation = mode === 'fish' ? 16 : 21;
    const maxSpeed = mode === 'fish' ? 78 : 94;
    const targetX = width * (.5 + .19 * Math.cos(time * .25));
    const targetY = height * (.5 + .16 * Math.sin(time * .39));
    const avoidRadius = Math.min(112, width * .25);

    for (let i = 0; i < boids.length; i++) {
      const bird = boids[i]!;
      let neighbors = 0;
      let centerX = 0, centerY = 0, velocityX = 0, velocityY = 0;
      let separateX = 0, separateY = 0;
      for (let j = 0; j < boids.length; j++) {
        if (i === j) continue;
        const other = boids[j]!;
        const dx = other.x - bird.x, dy = other.y - bird.y;
        const squared = dx * dx + dy * dy;
        if (squared > sightSquared) continue;
        neighbors++;
        centerX += other.x; centerY += other.y;
        velocityX += other.vx; velocityY += other.vy;
        if (squared < separation * separation && squared > .001) {
          const distance = Math.sqrt(squared);
          const force = (separation - distance) / separation;
          separateX -= dx / distance * force;
          separateY -= dy / distance * force;
        }
      }
      let ax = separateX * 100, ay = separateY * 100;
      if (neighbors) {
        ax += (centerX / neighbors - bird.x) * .68 + (velocityX / neighbors - bird.vx) * 1.45;
        ay += (centerY / neighbors - bird.y) * .68 + (velocityY / neighbors - bird.vy) * 1.45;
      }
      // A slowly moving roost guides the whole flock without replacing local rules.
      ax += (targetX - bird.x) * .16;
      ay += (targetY - bird.y) * .24;
      const margin = Math.min(55, width * .12);
      if (bird.x < margin) ax += (margin - bird.x) * 3.5;
      if (bird.x > width - margin) ax -= (bird.x - width + margin) * 3.5;
      if (bird.y < 40) ay += (40 - bird.y) * 4;
      if (bird.y > height - 40) ay -= (bird.y - height + 40) * 4;
      if (pointer.active) {
        const dx = bird.x - pointer.x, dy = bird.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < avoidRadius) {
          const force = (1 - distance / avoidRadius) * 780;
          const direction = distance > .01 ? Math.atan2(dy, dx) : bird.phase;
          ax += Math.cos(direction) * force;
          ay += Math.sin(direction) * force;
        }
      }
      const acceleration = Math.hypot(ax, ay);
      if (acceleration > 420) { ax *= 420 / acceleration; ay *= 420 / acceleration; }
      accelerations.push({ x: ax, y: ay });
    }
    for (let i = 0; i < boids.length; i++) {
      const bird = boids[i]!, acceleration = accelerations[i]!;
      bird.vx += acceleration.x * dt;
      bird.vy += acceleration.y * dt;
      const speed = Math.hypot(bird.vx, bird.vy);
      if (speed > .001) {
        const nextSpeed = Math.max(34, Math.min(maxSpeed, speed));
        bird.vx *= nextSpeed / speed;
        bird.vy *= nextSpeed / speed;
      }
      bird.x += bird.vx * dt;
      bird.y += bird.vy * dt;
      // Keep a strong pointer push from sending an individual beyond the canvas.
      if (bird.x < 8) { bird.x = 8; bird.vx = Math.abs(bird.vx); }
      if (bird.x > width - 8) { bird.x = width - 8; bird.vx = -Math.abs(bird.vx); }
      if (bird.y < 12) { bird.y = 12; bird.vy = Math.abs(bird.vy); }
      if (bird.y > height - 12) { bird.y = height - 12; bird.vy = -Math.abs(bird.vy); }
    }
  }

  function draw() {
    if (destroyed) return;
    ctx.setTransform(density, 0, 0, density, 0, 0);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = backdrop ?? '#07101d';
    ctx.fillRect(0, 0, width, height);
    if (halo) { ctx.fillStyle = halo; ctx.fillRect(0, 0, width, height); }

    // Quiet, widely spaced contours give the flock depth without competing with it.
    ctx.lineWidth = .75;
    ctx.strokeStyle = mode === 'birds' ? '#62badb0e' : '#5ce6c915';
    for (let i = 0; i < 5; i++) {
      const y = height * (.23 + i * .15);
      ctx.beginPath();
      ctx.moveTo(-30, y);
      ctx.bezierCurveTo(width * .3, y - 90, width * .65, y + 65, width + 30, y - 20);
      ctx.stroke();
    }
    const colors = mode === 'birds' ? ['#e7faff', '#83d9f8', '#b3beff', '#b9f4ef'] : ['#7ff9d4', '#a8fff5', '#54bfec', '#d6ef9a'];
    for (const bird of boids) {
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(Math.atan2(bird.vy, bird.vx));
      const size = bird.size;
      const flutter = Math.sin(time * (mode === 'fish' ? 7 : 10) + bird.phase);
      const color = colors[bird.shade]!;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = mode === 'fish' ? 7 : 4;
      ctx.globalAlpha = .65 + bird.shade * .1;
      if (mode === 'birds') {
        const wings = size * (1.05 + flutter * .35);
        ctx.lineWidth = 1.35;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-size * .8, -wings);
        ctx.quadraticCurveTo(size * .5, -wings * .65, size * .2, 0);
        ctx.quadraticCurveTo(size * .5, wings * .65, -size * .8, wings);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(size * .85, 0);
        ctx.lineTo(-size * .65, -1);
        ctx.lineTo(-size * .35, 1.1);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 1.1, size * .34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-size * .7, 0);
        ctx.lineTo(-size * 1.7, -size * .6 + flutter * 1.2);
        ctx.lineTo(-size * 1.7, size * .6 + flutter * 1.2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    if (pointer.active) {
      ctx.strokeStyle = '#bceeff44';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 7]);
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, Math.min(112, width * .25), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#d5f6ff88';
      ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  function canAnimate() { return !destroyed && visible && !document.hidden && !paused && !preference.matches; }
  function tick(now: number) {
    frame = 0;
    if (!canAnimate()) { last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, .04) : 1 / 60;
    last = now;
    time += dt;
    update(dt);
    draw();
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (canAnimate()) frame = requestAnimationFrame(tick);
  }
  function resize() {
    if (destroyed) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const previousWidth = width, previousHeight = height;
    width = bounds.width; height = bounds.height;
    density = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    if (!boids.length) populate();
    else for (const bird of boids) { bird.x *= width / previousWidth; bird.y *= height / previousHeight; }
    ctx.setTransform(density, 0, 0, density, 0, 0);
    backdrop = ctx.createLinearGradient(0, 0, width * .35, height);
    backdrop.addColorStop(0, '#091226'); backdrop.addColorStop(1, '#060c18');
    halo = ctx.createRadialGradient(width * .53, height * .48, 5, width * .53, height * .48, Math.max(width * .48, height));
    halo.addColorStop(0, '#1e5c713b'); halo.addColorStop(.6, '#173b5715'); halo.addColorStop(1, '#08102400');
    pointer.active = false;
    draw();
  }
  function move(event: PointerEvent) {
    if (!event.isPrimary || paused || preference.matches || (event.pointerType === 'touch' && pointer.id !== event.pointerId)) return;
    const bounds = canvas.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
  }
  function down(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0) return;
    pointer.id = event.pointerId;
    move(event);
  }
  function leave() { pointer.active = false; pointer.id = null; if (!canAnimate()) draw(); }
  function up(event: PointerEvent) { if (event.pointerType !== 'mouse') leave(); else pointer.id = null; }
  function preferenceChange() { leave(); draw(); schedule(); }
  function visibilityChange() { if (document.hidden) leave(); schedule(); }
  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? false; if (!visible) leave(); schedule(); });
  resizeObserver.observe(canvas);
  intersectionObserver.observe(canvas);
  canvas.addEventListener('pointermove', move, { passive: true });
  canvas.addEventListener('pointerdown', down, { passive: true });
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', leave);
  document.addEventListener('visibilitychange', visibilityChange);
  preference.addEventListener('change', preferenceChange);
  resize();
  schedule();

  return {
    setMode(value: FlockMode) { mode = value; draw(); },
    setPaused(value: boolean) { paused = value; leave(); schedule(); draw(); },
    scatter() {
      if (!boids.length || paused) return;
      const center = boids.reduce((sum, bird) => ({ x: sum.x + bird.x, y: sum.y + bird.y }), { x: 0, y: 0 });
      center.x /= boids.length; center.y /= boids.length;
      for (const bird of boids) {
        const angle = Math.atan2(bird.y - center.y, bird.x - center.x);
        bird.vx = Math.cos(angle) * 130; bird.vy = Math.sin(angle) * 130;
        // Show the result immediately, without animation, for reduced-motion users.
        if (preference.matches) {
          bird.x = Math.max(12, Math.min(width - 12, bird.x + Math.cos(angle) * 36));
          bird.y = Math.max(18, Math.min(height - 18, bird.y + Math.sin(angle) * 36));
        }
      }
      draw();
    },
    reset() { time = 0; leave(); populate(); draw(); },
    destroy() {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect(); intersectionObserver.disconnect();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', leave);
      document.removeEventListener('visibilitychange', visibilityChange);
      preference.removeEventListener('change', preferenceChange);
      boids = [];
    },
  };
}
