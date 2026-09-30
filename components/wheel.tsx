"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { pointerTurn, type GlowName } from "@/lib/economy";
import type { WheelSegmentView } from "@/lib/wheels";
import { playPointerClick } from "@/lib/sounds";
import { pegPassedPointer, polar, segmentPath } from "@/lib/wheel";

function rimMarks(glow?: GlowName) {
  if (glow === "fire") return ["🔥", "🔥", "🔥", "🔥", "🔥", "🔥"];
  if (glow === "blaze") return ["🔥", "💥", "🔥", "💥", "🔥", "💥", "🔥", "💥"];
  if (glow === "inferno") return ["🔥", "🔥", "💀", "🔥", "🔥", "💀", "🔥", "🔥"];
  if (glow === "spark") return ["✨", "⚡", "✨", "⚡", "✨", "⚡"];
  return [];
}

type WheelProps = {
  segments: WheelSegmentView[];
  rotation: number;
  spinning: boolean;
  quick?: boolean;
  glow?: GlowName;
  pointer?: string;
  hub?: string;
  hubRim?: string;
  hubFill?: string;
  plate?: string;
  peg?: string;
  size?: number;
  onPress?: () => void;
  disabled?: boolean;
  onSpinEnd?: () => void;
};

export function Wheel({
  segments,
  rotation,
  spinning,
  quick = false,
  glow,
  pointer = "triangle",
  hub = "💎",
  hubRim = "#e7d3a1",
  hubFill = "#1a1610",
  plate = "#1c1914",
  peg = "#e7d3a1",
  size = 340,
  onPress,
  disabled = false,
  onSpinEnd,
}: WheelProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.44;
  const count = segments.length;
  const labelId = useId().replace(/:/g, "");
  const wheelRef = useRef<HTMLDivElement>(null);
  const step = count > 0 ? 360 / count : 0;
  const pegLength = size > 200 ? 16 : 9;
  const pegWidth = size > 200 ? 8 : 5;

  return (
    <WheelShell onPress={onPress} disabled={disabled} size={size}>
      <WheelPointer
        spinning={spinning}
        segmentCount={count}
        wheelRef={wheelRef}
        pointer={pointer}
        size={size}
      />
      <div
        ref={wheelRef}
        className={`absolute inset-0 ${glow ? `wheel-${glow}` : ""}`}
        onTransitionEnd={(event) => {
          if (event.propertyName === "transform") onSpinEnd?.();
        }}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? quick
              ? "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)"
              : "transform 4s cubic-bezier(0.12, 0.72, 0.08, 1)"
            : "none",
        }}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
          <circle cx={cx} cy={cy} r={radius + 8} fill={plate} />
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segmentPath(cx, cy, radius, index, count)}
              fill={segment.color}
              stroke={plate}
              strokeWidth="3"
            />
          ))}
          {segments.map((segment, index) => {
            const angle = index * (360 / count);
            if (segment.layout === "radial") {
              const [x1, y1] = polar(cx, cy, radius * 0.34, angle);
              const [x2, y2] = polar(cx, cy, radius * 0.9, angle);
              return (
                <g key={index}>
                  <path
                    id={`${labelId}-${index}`}
                    d={`M ${x1} ${y1} L ${x2} ${y2}`}
                    fill="none"
                  />
                  <text
                    fill="#f7f3ea"
                    stroke="#14120c"
                    strokeWidth={size > 200 ? 3 : 2}
                    paintOrder="stroke"
                    fontSize={size > 200 ? 13 : 7}
                    fontWeight={700}
                    fontFamily="var(--font-manrope), sans-serif"
                  >
                    <textPath
                      href={`#${labelId}-${index}`}
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {segment.label}
                    </textPath>
                  </text>
                </g>
              );
            }

            const [x, y] = polar(cx, cy, radius * 0.62, angle);
            return (
              <text
                key={index}
                x={x}
                y={y}
                transform={`rotate(${angle} ${x} ${y})`}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f7f3ea"
                stroke="#14120c"
                strokeWidth={size > 200 ? 3 : 2}
                paintOrder="stroke"
                fontSize={size > 200 ? 16 : 10}
                fontWeight={700}
                fontFamily="var(--font-manrope), sans-serif"
              >
                {segment.label}
              </text>
            );
          })}
        </svg>
        {Array.from({ length: count }, (_, index) => {
          const angle = index * step - step / 2;
          const [x, y] = polar(cx, cy, radius + pegLength / 2, angle);
          return (
            <div
              key={index}
              aria-hidden
              className="absolute rounded-sm"
              style={{
                width: pegWidth,
                height: pegLength,
                left: x - pegWidth / 2,
                top: y - pegLength / 2,
                transform: `rotate(${angle}deg)`,
                background: peg,
                boxShadow: `0 0 0 2px ${plate}`,
              }}
            />
          );
        })}
        {rimMarks(glow).map((mark, index, marks) => {
          const angle = index * (360 / marks.length);
          const [x, y] = polar(cx, cy, radius + 2, angle);
          return (
            <span
              key={angle}
              aria-hidden
              className="flame-mark absolute"
              style={{
                left: x,
                top: y,
                fontSize: size > 200 ? 22 : 13,
                animationDelay: `${index * 0.07}s`,
              }}
            >
              {mark}
            </span>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div
          className="grid place-items-center rounded-full border-2"
          style={{
            width: size * 0.22,
            height: size * 0.22,
            borderColor: hubRim,
            background: hubFill,
            boxShadow: `inset 0 0 0 3px ${plate}, 0 0 0 3px ${hubRim}`,
          }}
        >
          <span className="leading-none" style={{ fontSize: size * 0.1 }} aria-hidden>
            {hub}
          </span>
        </div>
      </div>
    </WheelShell>
  );
}

function WheelShell({
  onPress,
  disabled,
  size,
  children,
}: {
  onPress?: () => void;
  disabled: boolean;
  size: number;
  children: ReactNode;
}) {
  const style = { width: size, height: size };
  if (!onPress) {
    return (
      <div className="relative" style={style}>
        {children}
      </div>
    );
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPress}
      aria-label="Крутить"
      className="relative block cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed"
      style={style}
    >
      {children}
    </button>
  );
}

function WheelPointer({
  spinning,
  segmentCount,
  wheelRef,
  pointer,
  size,
}: {
  spinning: boolean;
  segmentCount: number;
  wheelRef: RefObject<HTMLDivElement | null>;
  pointer: string;
  size: number;
}) {
  const [bump, setBump] = useState(0);
  const bumpRef = useRef(0);

  useEffect(() => {
    if (!spinning || segmentCount === 0) return;
    const step = 360 / segmentCount;
    const pegs = Array.from({ length: segmentCount }, (_, index) => index * step - step / 2);
    let previous: number | null = null;
    let frame = 0;

    const tick = () => {
      const node = wheelRef.current;
      if (node) {
        const current = readRotation(node);
        const last = previous;
        previous = current;
        if (last !== null && pegs.some((angle) => pegPassedPointer(last, current, angle))) {
          bumpRef.current += 1;
          setBump(bumpRef.current);
          playPointerClick();
        }
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [spinning, segmentCount, wheelRef]);

  const turn = pointerTurn(pointer);
  const glyph = size > 200 ? 44 : 28;

  return (
    <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2" aria-hidden>
      <div
        key={bump}
        style={{
          transformOrigin: "center top",
          animation: bump > 0 ? "pointer-knock 140ms ease-out" : undefined,
        }}
      >
        {pointer !== "triangle" ? (
          <span
            className="grid place-items-center leading-none drop-shadow"
            style={{
              width: glyph,
              height: glyph,
              fontSize: glyph - 4,
              transform: turn ? `rotate(${turn}deg)` : undefined,
            }}
          >
            {pointer}
          </span>
        ) : (
          <div
            className="mt-1 h-0 w-0 border-x-transparent border-t-accent drop-shadow rounded-full"
            style={{ borderLeftWidth: 20, borderRightWidth: 20, borderTopWidth: 36 }}
          />
        )}
      </div>
    </div>
  );
}

function readRotation(node: HTMLElement) {
  const transform = getComputedStyle(node).transform;
  if (!transform || transform === "none") return 0;
  const matrix = new DOMMatrix(transform);
  return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
}
