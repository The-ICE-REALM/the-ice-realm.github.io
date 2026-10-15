import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createFreezeRenderer, type FreezeRenderer } from "@/lib/freezeRenderer";

export interface CrestFreeze {
  id: number;
  /** Where the crest was tapped, in viewport pixels; null when it was pressed from the keyboard. */
  from: { x: number; y: number } | null;
}

interface FreezingCrestProps {
  src: string;
  /** Set to freeze the crest; a new id replays the freeze. */
  freeze: CrestFreeze | null;
  /** Called once the crest has frozen over. */
  onFrozen: () => void;
}

const FREEZE_MS = 1500;
const GLINT_AT = 1350;
const GLINT_MS = 650;
const DONE_AT = 1750;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
/** Frost spreads fast from the tap, then slows as it reaches the edges. */
const spread = (x: number) => 1 - Math.pow(1 - clamp01(x), 1.6);

export function FreezingCrest({ src, freeze, onFrozen }: FreezingCrestProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawnId, setDrawnId] = useState<number | null>(null);
  const [frostedId, setFrostedId] = useState<number | null>(null);

  // The parent passes a fresh callback on every render; the animation only needs the latest one.
  const onFrozenRef = useRef(onFrozen);
  useLayoutEffect(() => {
    onFrozenRef.current = onFrozen;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!freeze || !canvas || !image) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let reported = false;
    let raf = 0;
    let timer = 0;
    let renderer: FreezeRenderer | null = null;

    const frozen = () => {
      if (cancelled || reported) return;
      reported = true;
      onFrozenRef.current();
    };

    // Without WebGL (or if the GPU drops the context): a simple frosted crest instead.
    const frost = () => {
      cancelAnimationFrame(raf);
      setFrostedId(freeze.id);
      timer = window.setTimeout(frozen, reduceMotion ? 200 : 900);
    };
    const onContextLost = () => {
      renderer = null;
      frost();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    const run = async () => {
      await image.decode().catch(() => undefined);
      if (cancelled) return;
      const box = canvas.getBoundingClientRect();
      // 1.5× is plenty for frost, and keeps the one-off ice drawing quick on phones.
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(box.width * scale));
      canvas.height = Math.max(1, Math.round(box.height * scale));
      // The frost starts where the crest was tapped; from the keyboard, at the top right.
      const origin = freeze.from
        ? { x: clamp01((freeze.from.x - box.left) / box.width), y: clamp01((freeze.from.y - box.top) / box.height) }
        : { x: 0.85, y: 0.15 };

      renderer = createFreezeRenderer(canvas, image, origin);
      if (!renderer) {
        frost();
        return;
      }

      const start = performance.now();
      let shown = false;
      const frame = (now: number) => {
        if (cancelled || !renderer) return;
        const elapsed = now - start;
        if (reduceMotion) renderer.draw(1, 0, 0);
        else renderer.draw(spread(elapsed / FREEZE_MS), clamp01((elapsed - GLINT_AT) / GLINT_MS), elapsed / 1000);
        if (!shown) {
          shown = true;
          setDrawnId(freeze.id);
        }
        if (elapsed >= (reduceMotion ? 250 : DONE_AT)) frozen();
        // With reduced motion nothing changes after the freeze, so stop drawing.
        if (!(reduceMotion && reported)) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    void run();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      renderer?.dispose();
    };
  }, [freeze]);

  const live = freeze !== null && drawnId === freeze.id && frostedId !== freeze.id;
  const frosted = freeze !== null && frostedId === freeze.id;

  return (
    <span className={`crest-art${live ? "is-live" : ""}${frosted ? "is-frosted" : ""}`}>
      <img ref={imageRef} src={src} alt="" width={960} height={960} data-testid="hero-image" />
      {freeze && (
        <canvas key={freeze.id} ref={canvasRef} className="crest-ice" aria-hidden="true" data-testid="crest-ice" />
      )}
    </span>
  );
}
