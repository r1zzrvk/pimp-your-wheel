"use client";

import { useEffect } from "react";
import { playButton, playMenu } from "@/lib/sounds";

export function SoundClicks() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-sound='menu']")) {
        playMenu();
        return;
      }
      const button = target.closest("button");
      if (!(button instanceof HTMLButtonElement) || button.disabled) return;
      if (button.dataset.sound === "none") return;
      playButton();
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
