"use client";

import { useEffect, useRef, useState } from "react";

function formatRemaining(targetIso: string, now: number) {
  const ms = Math.max(0, new Date(targetIso).getTime() - now);
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export function ResetCountdown({
  nextResetAt,
  onElapsed,
}: {
  nextResetAt: string;
  onElapsed: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const onElapsedRef = useRef(onElapsed);

  useEffect(() => {
    onElapsedRef.current = onElapsed;
  }, [onElapsed]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = Date.now();
      setNow(next);
      if (new Date(nextResetAt).getTime() - next <= 0) {
        onElapsedRef.current();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [nextResetAt]);

  return (
    <p className="font-display text-lg">
      Следующие крутки через {formatRemaining(nextResetAt, now)}
    </p>
  );
}
