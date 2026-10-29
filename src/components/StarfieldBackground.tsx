import { useEffect, useRef } from 'react';

interface StarfieldBackgroundProps {
  enabled?: boolean;
  splashDone?: boolean;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  life: number;
  maxLife: number;
  tailLength: number;
  thickness: number;
  tint: 'white' | 'cyan' | 'orange';
}

function createStarSpriteAtlas() {
  // 0: Layer 1 - Distant pinpoint star (12x12)
  const sp1 = document.createElement('canvas');
  sp1.width = 12;
  sp1.height = 12;
  const c1 = sp1.getContext('2d');
  if (c1) {
    const halo1 = c1.createRadialGradient(6, 6, 0, 6, 6, 5.4);
    halo1.addColorStop(0, 'rgba(255, 255, 255, 0.56)');
    halo1.addColorStop(0.45, 'rgba(220, 238, 255, 0.16)');
    halo1.addColorStop(1, 'rgba(255, 255, 255, 0)');
    c1.fillStyle = halo1;
    c1.beginPath();
    c1.arc(6, 6, 5.4, 0, Math.PI * 2);
    c1.fill();

    c1.fillStyle = 'rgba(255, 255, 255, 0.96)';
    c1.beginPath();
    c1.arc(6, 6, 1.85, 0, Math.PI * 2);
    c1.fill();
  }

  // 1: Layer 2 - Medium glowing star (24x24)
  const sp2 = document.createElement('canvas');
  sp2.width = 24;
  sp2.height = 24;
  const c2 = sp2.getContext('2d');
  if (c2) {
    const glow2 = c2.createRadialGradient(12, 12, 0, 12, 12, 11.4);
    glow2.addColorStop(0, 'rgba(255, 255, 255, 0.58)');
    glow2.addColorStop(0.32, 'rgba(224, 242, 255, 0.22)');
    glow2.addColorStop(0.66, 'rgba(186, 230, 253, 0.07)');
    glow2.addColorStop(1, 'rgba(255, 255, 255, 0)');
    c2.fillStyle = glow2;
    c2.beginPath();
    c2.arc(12, 12, 11.4, 0, Math.PI * 2);
    c2.fill();

    c2.fillStyle = 'rgba(255, 255, 255, 0.98)';
    c2.beginPath();
    c2.arc(12, 12, 2.4, 0, Math.PI * 2);
    c2.fill();
  }

  // 2 & 3: Layer 3 - Bright accent star (38x38, optional 4-point cross rays)
  function buildBrightStarSprite(
    withCross: boolean,
    haloRgb = '226, 242, 255'
  ): HTMLCanvasElement {
    const sp = document.createElement('canvas');
    sp.width = 38;
    sp.height = 38;
    const c = sp.getContext('2d');
    if (!c) return sp;

    const glow = c.createRadialGradient(19, 19, 0, 19, 19, 18.2);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.62)');
    glow.addColorStop(0.28, `rgba(${haloRgb}, 0.25)`);
    glow.addColorStop(0.62, `rgba(${haloRgb}, 0.07)`);
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(19, 19, 18.2, 0, Math.PI * 2);
    c.fill();

    if (withCross) {
      const horizGrad = c.createLinearGradient(2, 19, 36, 19);
      horizGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      horizGrad.addColorStop(0.36, `rgba(${haloRgb}, 0.24)`);
      horizGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.54)');
      horizGrad.addColorStop(0.64, `rgba(${haloRgb}, 0.24)`);
      horizGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      c.strokeStyle = horizGrad;
      c.lineWidth = 1.25;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(2, 19);
      c.lineTo(36, 19);
      c.stroke();

      const vertGrad = c.createLinearGradient(19, 2, 19, 36);
      vertGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      vertGrad.addColorStop(0.36, `rgba(${haloRgb}, 0.24)`);
      vertGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.54)');
      vertGrad.addColorStop(0.64, `rgba(${haloRgb}, 0.24)`);
      vertGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      c.strokeStyle = vertGrad;
      c.beginPath();
      c.moveTo(19, 2);
      c.lineTo(19, 36);
      c.stroke();
    }

    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(19, 19, 2.55, 0, Math.PI * 2);
    c.fill();
    return sp;
  }

  // Shooting Star Sprite Builder (240x20, head at x=226, y=10)
  function buildMeteorSprite(trailRgb: string): HTMLCanvasElement {
    const meteor = document.createElement('canvas');
    meteor.width = 240;
    meteor.height = 20;
    const cm = meteor.getContext('2d');
    if (!cm) return meteor;

    const outerTrail = cm.createLinearGradient(226, 10, 8, 10);
    outerTrail.addColorStop(0, `rgba(${trailRgb}, 0.34)`);
    outerTrail.addColorStop(0.35, `rgba(${trailRgb}, 0.13)`);
    outerTrail.addColorStop(1, `rgba(${trailRgb}, 0)`);
    cm.strokeStyle = outerTrail;
    cm.lineWidth = 4.8;
    cm.lineCap = 'round';
    cm.beginPath();
    cm.moveTo(226, 10);
    cm.lineTo(8, 10);
    cm.stroke();

    const coreTrail = cm.createLinearGradient(226, 10, 14, 10);
    coreTrail.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
    coreTrail.addColorStop(0.28, `rgba(${trailRgb}, 0.62)`);
    coreTrail.addColorStop(0.65, `rgba(${trailRgb}, 0.20)`);
    coreTrail.addColorStop(1, 'rgba(255, 255, 255, 0)');
    cm.strokeStyle = coreTrail;
    cm.lineWidth = 1.8;
    cm.lineCap = 'round';
    cm.beginPath();
    cm.moveTo(226, 10);
    cm.lineTo(14, 10);
    cm.stroke();

    const headGlow = cm.createRadialGradient(226, 10, 0, 226, 10, 6.2);
    headGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    headGlow.addColorStop(0.4, `rgba(${trailRgb}, 0.42)`);
    headGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    cm.fillStyle = headGlow;
    cm.beginPath();
    cm.arc(226, 10, 6.2, 0, Math.PI * 2);
    cm.fill();

    cm.fillStyle = '#ffffff';
    cm.beginPath();
    cm.arc(226, 10, 1.75, 0, Math.PI * 2);
    cm.fill();
    return meteor;
  }

  return {
    starSprites: [
      sp1,
      sp2,
      buildBrightStarSprite(false, '226, 242, 255'),
      buildBrightStarSprite(true, '226, 242, 255'),
      buildBrightStarSprite(true, '103, 232, 249'), // Subtle Cyan star
      buildBrightStarSprite(false, '253, 186, 116'), // Subtle Amber-Orange star
    ],
    meteorSprites: {
      white: buildMeteorSprite('215, 236, 255'),
      cyan: buildMeteorSprite('103, 232, 249'),
      orange: buildMeteorSprite('253, 186, 116'),
    },
  };
}

function paintSkyBackdrop(skyCanvas: HTMLCanvasElement, w: number, h: number) {
  const bw = Math.max(1, Math.round(w * 0.5));
  const bh = Math.max(1, Math.round(h * 0.5));
  skyCanvas.width = bw;
  skyCanvas.height = bh;
  const sctx =
    skyCanvas.getContext('2d', { alpha: false }) || skyCanvas.getContext('2d');
  if (!sctx) return;

  const baseGrad = sctx.createLinearGradient(0, 0, 0, bh);
  baseGrad.addColorStop(0, '#03050b');
  baseGrad.addColorStop(0.52, '#060a14');
  baseGrad.addColorStop(1, '#03050a');
  sctx.fillStyle = baseGrad;
  sctx.fillRect(0, 0, bw, bh);

  // Soft zenith night-sky glow
  sctx.save();
  sctx.translate(bw * 0.5, -bh * 0.08);
  sctx.scale(bw * 0.85, bh * 0.54);
  const zenithGlow = sctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  zenithGlow.addColorStop(0, 'rgba(180, 215, 255, 0.075)');
  zenithGlow.addColorStop(0.65, 'rgba(180, 215, 255, 0)');
  zenithGlow.addColorStop(1, 'rgba(180, 215, 255, 0)');
  sctx.fillStyle = zenithGlow;
  sctx.beginPath();
  sctx.arc(0, 0, 1, 0, Math.PI * 2);
  sctx.fill();
  sctx.restore();

  // Subtle Electric Cyan nebula whisper (top-left)
  const cyanRadius = Math.max(bw, bh) * 0.45;
  const cyanGlow = sctx.createRadialGradient(
    bw * 0.16,
    bh * 0.18,
    0,
    bw * 0.16,
    bh * 0.18,
    cyanRadius
  );
  cyanGlow.addColorStop(0, 'rgba(34, 211, 238, 0.055)');
  cyanGlow.addColorStop(1, 'rgba(34, 211, 238, 0)');
  sctx.fillStyle = cyanGlow;
  sctx.fillRect(0, 0, bw, bh);

  // Subtle Blaze Orange nebula whisper (top-right)
  const orangeRadius = Math.max(bw, bh) * 0.42;
  const orangeGlow = sctx.createRadialGradient(
    bw * 0.86,
    bh * 0.16,
    0,
    bw * 0.86,
    bh * 0.16,
    orangeRadius
  );
  orangeGlow.addColorStop(0, 'rgba(251, 146, 60, 0.048)');
  orangeGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
  sctx.fillStyle = orangeGlow;
  sctx.fillRect(0, 0, bw, bh);
}

function detectStarfieldPerfProfile() {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const cores = Number(nav?.hardwareConcurrency) || 4;
  const mem =
    Number((nav as unknown as { deviceMemory?: number })?.deviceMemory) || 4;
  const saveData = Boolean(
    (nav as unknown as { connection?: { saveData?: boolean } })?.connection
      ?.saveData
  );
  const coarsePointer =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(pointer: coarse)')?.matches);
  const isLowPower = saveData || cores <= 4 || mem <= 4;

  return {
    isLowPower,
    coarsePointer,
    maxDpr: isLowPower ? 1.25 : 1.5,
    idleFrameIntervalMs: isLowPower ? 1000 / 24 : 1000 / 30,
    meteorFrameIntervalMs: isLowPower ? 1000 / 36 : 1000 / 50,
    reducedMotionIntervalMs: 1000 / 18,
  };
}

export function StarfieldBackground({
  enabled = true,
  splashDone = true,
}: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx =
        canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    const reducedMotion = Boolean(
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    );
    const perf = detectStarfieldPerfProfile();
    const { starSprites, meteorSprites } = createStarSpriteAtlas();
    const skyBgCanvas = document.createElement('canvas');

    let width = 0;
    let height = 0;
    let dpr = 1;
    let starCount = 0;
    let starX = new Float32Array(0);
    let starY = new Float32Array(0);
    let starDrawSize = new Float32Array(0);
    let starHalfSize = new Float32Array(0);
    let starBaseAlpha = new Float32Array(0);
    let starTwinkleSpeed = new Float32Array(0);
    let starTwinklePhase = new Float32Array(0);
    let starDriftX = new Float32Array(0);
    let starDriftY = new Float32Array(0);
    let starParallax = new Float32Array(0);
    let starSpriteIdx = new Uint8Array(0);

    const shootingStars: ShootingStar[] = [];
    let animFrameId: number | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let nextShootAt = performance.now() * 0.001 + (splashDone ? 0.85 : 1.6);
    let prevPaintTs = 0;
    let resizeTimer: number | undefined;

    function buildStars() {
      const area = width * height;
      const count = Math.min(230, Math.max(115, Math.floor(area / 8000)));
      const temp: Array<{
        x: number;
        y: number;
        drawSize: number;
        baseAlpha: number;
        twinkleSpeed: number;
        twinklePhase: number;
        driftX: number;
        driftY: number;
        parallax: number;
        spriteIdx: number;
      }> = new Array(count);

      for (let idx = 0; idx < count; idx += 1) {
        const tierRand = Math.random();
        const layer = tierRand > 0.88 ? 3 : tierRand > 0.53 ? 2 : 1;
        const radius =
          layer === 3
            ? 1.45 + Math.random() * 0.78
            : layer === 2
              ? 0.98 + Math.random() * 0.62
              : 0.62 + Math.random() * 0.48;

        let spriteIdx = 0;
        if (layer === 1) {
          spriteIdx = 0;
        } else if (layer === 2) {
          spriteIdx = 1;
        } else {
          const colorRoll = Math.random();
          if (colorRoll < 0.22) spriteIdx = 4; // Cyan bright cross star
          else if (colorRoll < 0.36) spriteIdx = 5; // Warm orange star
          else spriteIdx = idx % 2 === 0 ? 3 : 2;
        }

        const sizeScale = layer === 1 ? 4.2 : layer === 2 ? 6.6 : 9.4;
        const drawSize = radius * sizeScale;

        temp[idx] = {
          x: Math.random() * width,
          y: Math.random() * height,
          drawSize,
          baseAlpha:
            layer === 3
              ? 0.78 + Math.random() * 0.16
              : layer === 2
                ? 0.55 + Math.random() * 0.25
                : 0.34 + Math.random() * 0.3,
          twinkleSpeed: 0.75 + Math.random() * 1.95,
          twinklePhase: Math.random() * Math.PI * 2,
          driftX: -(0.014 + layer * 0.011),
          driftY: -(0.022 + layer * 0.016),
          parallax: layer * 3.6,
          spriteIdx,
        };
      }

      temp.sort((a, b) => a.spriteIdx - b.spriteIdx);

      starCount = count;
      starX = new Float32Array(count);
      starY = new Float32Array(count);
      starDrawSize = new Float32Array(count);
      starHalfSize = new Float32Array(count);
      starBaseAlpha = new Float32Array(count);
      starTwinkleSpeed = new Float32Array(count);
      starTwinklePhase = new Float32Array(count);
      starDriftX = new Float32Array(count);
      starDriftY = new Float32Array(count);
      starParallax = new Float32Array(count);
      starSpriteIdx = new Uint8Array(count);

      for (let i = 0; i < count; i += 1) {
        const s = temp[i];
        starX[i] = s.x;
        starY[i] = s.y;
        starDrawSize[i] = s.drawSize;
        starHalfSize[i] = s.drawSize * 0.5;
        starBaseAlpha[i] = s.baseAlpha;
        starTwinkleSpeed[i] = s.twinkleSpeed;
        starTwinklePhase[i] = s.twinklePhase;
        starDriftX[i] = s.driftX;
        starDriftY[i] = s.driftY;
        starParallax[i] = s.parallax;
        starSpriteIdx[i] = s.spriteIdx;
      }
    }

    function resize(forceRebuild = false) {
      if (!canvas || !ctx) return;
      const nextW = Math.max(1, window.innerWidth || 360);
      const rawH = Math.max(
        window.innerHeight || 640,
        Math.round(document.documentElement?.clientHeight || 0)
      );
      if (
        !forceRebuild &&
        width > 0 &&
        Math.abs(nextW - width) < 2 &&
        Math.abs(rawH - height) < 130
      ) {
        return;
      }

      dpr = Math.min(window.devicePixelRatio || 1, perf.maxDpr);
      width = nextW;
      height = perf.coarsePointer ? rawH + 72 : rawH;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintSkyBackdrop(skyBgCanvas, width, height);
      buildStars();
    }

    function spawnShootingStar() {
      if (shootingStars.length >= 2 || width <= 0 || height <= 0) return;

      const goRight = Math.random() < 0.28;
      const baseAngle = goRight ? Math.PI / 4 : (Math.PI * 3) / 4;
      const angle = baseAngle + (Math.random() - 0.5) * 0.18;
      const startX = goRight
        ? width * (0.06 + Math.random() * 0.46)
        : width * (0.46 + Math.random() * 0.48);
      const startY = height * (0.04 + Math.random() * 0.36);
      const maxTravel = Math.min(width, height) * 0.72;
      const maxLife = 0.82 + Math.random() * 0.36;
      const speed = Math.min(540, Math.max(290, maxTravel / maxLife));

      const tintRoll = Math.random();
      const tint: 'white' | 'cyan' | 'orange' =
        tintRoll < 0.62 ? 'white' : tintRoll < 0.86 ? 'cyan' : 'orange';

      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle,
        life: 0,
        maxLife,
        tailLength: Math.min(
          150,
          Math.max(88, Math.min(width, 580) * 0.22 + Math.random() * 34)
        ),
        thickness: 10.5 + Math.random() * 2.5,
        tint,
      });
    }

    function maybeSpawnShootingStar(nowSec: number) {
      if (nowSec < nextShootAt) return;

      spawnShootingStar();
      const twinBurst = Math.random() < 0.16 && shootingStars.length < 2;
      const baseGap = reducedMotion
        ? 6.5 + Math.random() * 4.0
        : 3.2 + Math.random() * 3.1;
      nextShootAt = nowSec + (twinBurst ? 0.42 + Math.random() * 0.28 : baseGap);
    }

    function paintStarfieldScene(
      nowSec: number,
      dt: number,
      advanceMotion: boolean
    ) {
      if (!ctx) return;
      ctx.globalAlpha = 1;
      ctx.drawImage(skyBgCanvas, 0, 0, width, height);

      const stepScale = advanceMotion
        ? reducedMotion
          ? dt * 18
          : dt * 60
        : 0;
      let lastAlpha = 1;

      for (let i = 0; i < starCount; i += 1) {
        let sx = starX[i];
        let sy = starY[i];

        if (stepScale > 0) {
          sx += starDriftX[i] * stepScale;
          sy += starDriftY[i] * stepScale;
          if (sx < -12) sx = width + 12;
          if (sy < -12) sy = height + 12;
          starX[i] = sx;
          starY[i] = sy;
        }

        const pFactor = starParallax[i];
        let drawX = sx + pointerX * pFactor;
        let drawY = sy + pointerY * pFactor;
        if (drawX < 0) drawX += width;
        else if (drawX >= width) drawX -= width;
        if (drawY < 0) drawY += height;
        else if (drawY >= height) drawY -= height;

        const twinkle = reducedMotion
          ? 0.86 + 0.14 * Math.sin(nowSec * 0.9 + starTwinklePhase[i])
          : 0.66 +
            0.34 * Math.sin(nowSec * starTwinkleSpeed[i] + starTwinklePhase[i]);
        const rawAlpha = starBaseAlpha[i] * twinkle;
        const qAlpha =
          rawAlpha >= 0.99 ? 1 : ((rawAlpha * 50 + 0.5) | 0) * 0.02;

        if (qAlpha <= 0.01) continue;
        if (qAlpha !== lastAlpha) {
          ctx.globalAlpha = qAlpha;
          lastAlpha = qAlpha;
        }

        const size = starDrawSize[i];
        const half = starHalfSize[i];
        ctx.drawImage(
          starSprites[starSpriteIdx[i]],
          drawX - half,
          drawY - half,
          size,
          size
        );
      }

      if (advanceMotion && !reducedMotion) {
        maybeSpawnShootingStar(nowSec);
      }

      for (let i = shootingStars.length - 1; i >= 0; i -= 1) {
        const sh = shootingStars[i];
        if (advanceMotion) {
          sh.life += dt;
          if (sh.life >= sh.maxLife) {
            shootingStars.splice(i, 1);
            continue;
          }
          sh.x += sh.vx * dt;
          sh.y += sh.vy * dt;
        }

        const progress = sh.life / sh.maxLife;
        const opacity = Math.min(0.88, Math.sin(progress * Math.PI) * 0.88);
        if (opacity <= 0.01) continue;

        const drawW = sh.tailLength + 12;
        const drawH = sh.thickness;
        const halfH = drawH * 0.5;
        const headOffset = drawW * 0.9417;

        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.angle);
        ctx.globalAlpha = opacity;
        lastAlpha = opacity;
        ctx.drawImage(
          meteorSprites[sh.tint],
          -headOffset,
          -halfH,
          drawW,
          drawH
        );
        ctx.restore();
      }

      ctx.globalAlpha = 1;
    }

    function drawFrame(ts: number) {
      animFrameId = null;
      if (document.hidden) return;

      const targetInterval = reducedMotion
        ? perf.reducedMotionIntervalMs
        : shootingStars.length > 0
          ? perf.meteorFrameIntervalMs
          : perf.idleFrameIntervalMs;

      const elapsedMs = ts - prevPaintTs;
      if (prevPaintTs > 0 && elapsedMs < targetInterval) {
        animFrameId = requestAnimationFrame(drawFrame);
        return;
      }

      const dt = prevPaintTs > 0 ? Math.min(0.08, elapsedMs / 1000) : 0.016;
      prevPaintTs = ts;
      paintStarfieldScene(ts * 0.001, dt, true);

      animFrameId = requestAnimationFrame(drawFrame);
    }

    resize(true);
    paintStarfieldScene(performance.now() * 0.001, 0, false);
    prevPaintTs = performance.now();
    animFrameId = requestAnimationFrame(drawFrame);

    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize(false);
      }, 150);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (width > 0 && height > 0) {
        pointerX = (e.clientX / width - 0.5) * 1.4;
        pointerY = (e.clientY / height - 0.5) * 1.4;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameId !== null) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      } else if (animFrameId === null) {
        prevPaintTs = performance.now();
        animFrameId = requestAnimationFrame(drawFrame);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    if (!perf.coarsePointer) {
      window.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      });
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animFrameId !== null) cancelAnimationFrame(animFrameId);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, splashDone]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      id="starfieldCanvas"
      aria-hidden="true"
      className="nd-starfield"
    />
  );
}
