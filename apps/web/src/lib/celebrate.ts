// Lightweight canvas confetti — no dependencies.
// Usage: celebrate() on goal completion / achievement unlock.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: "rect" | "circle";
}

const COLORS = ["#39d353", "#26a641", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4"];

let activeCanvas: HTMLCanvasElement | null = null;

export function celebrate(durationMs = 2800): void {
  if (typeof window === "undefined") return;
  // Don't stack multiple celebrations
  if (activeCanvas) return;

  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);
  activeCanvas = canvas;

  const ctx = canvas.getContext("2d")!;
  const particles: Particle[] = [];

  // Burst from two bottom corners + center top
  const origins = [
    { x: canvas.width * 0.1, y: canvas.height * 0.9, angle: -Math.PI / 3 },
    { x: canvas.width * 0.9, y: canvas.height * 0.9, angle: (-2 * Math.PI) / 3 },
    { x: canvas.width * 0.5, y: canvas.height * 0.3, angle: -Math.PI / 2 },
  ];

  for (const origin of origins) {
    for (let i = 0; i < 60; i++) {
      const spread = (Math.random() - 0.5) * Math.PI * 0.6;
      const speed = 6 + Math.random() * 10;
      particles.push({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(origin.angle + spread) * speed,
        vy: Math.sin(origin.angle + spread) * speed,
        size: 4 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }
  }

  const start = performance.now();

  function frame(now: number) {
    const elapsed = now - start;
    const fade = Math.max(0, 1 - elapsed / durationMs);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.vx *= 0.99; // drag
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (elapsed < durationMs) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
      activeCanvas = null;
    }
  }

  requestAnimationFrame(frame);
}
