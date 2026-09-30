"use client";

import { OnboardingProvider, useOnboarding, type OnboardingStep } from "@onboardjs/react";
import { Icon } from "@/components/icon";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from "react";

type HintPayload = {
  title: string;
  body: string;
  target: "profile" | "nav" | "wheel" | "wheels" | "xp" | "spin";
};

const HOME_TARGETS = new Set<HintPayload["target"]>(["wheel", "wheels", "xp", "spin"]);

const STEPS: OnboardingStep[] = [
  {
    id: "profile",
    type: "INFORMATION",
    payload: {
      title: "Профиль",
      body: "Монеты, уровень и серия дней. Заходи каждый день и забирай награды. Карточка открывает профиль.",
      target: "profile",
    },
    nextStep: "nav",
    isSkippable: true,
    skipToStep: null,
  },
  {
    id: "nav",
    type: "INFORMATION",
    payload: {
      title: "Разделы",
      body: "Главная — рулетка. Уровни — награды. Магазин скинов и анимаций.",
      target: "nav",
    },
    nextStep: "wheel",
    isSkippable: true,
    skipToStep: null,
  },
  {
    id: "wheel",
    type: "INFORMATION",
    payload: {
      title: "Колесо",
      body: "Секторы решают, сколько монет или фриспинов ты получишь. Некоторые секторы отнимают монеты.",
      target: "wheel",
    },
    nextStep: "wheels",
    isSkippable: true,
    skipToStep: null,
  },
  {
    id: "wheels",
    type: "INFORMATION",
    payload: {
      title: "Рулетки",
      body: "Классика доступна сразу. Остальные откроются с повышением уровня.",
      target: "wheels",
    },
    nextStep: "xp",
    isSkippable: true,
    skipToStep: null,
  },
  {
    id: "xp",
    type: "INFORMATION",
    payload: {
      title: "Опыт",
      body: "Крутка даёт опыт. Каждые два уровня приходят монеты и опыт, а на некоторых уровнях — скины.",
      target: "xp",
    },
    nextStep: "spin",
    isSkippable: true,
    skipToStep: null,
  },
  {
    id: "spin",
    type: "INFORMATION",
    payload: {
      title: "Играть",
      body: "Жми на кнопку или колесо, чтобы запустить крутку. Одна крутка списывается из дневного лимита. Лимит обновляется в 00:00.",
      target: "spin",
    },
    nextStep: null,
    isSkippable: true,
    skipToStep: null,
  },
];

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useTargetBox(name: string | null, active: boolean, pathname: string) {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!active || !name) return () => {};
      visibleTarget(name, pathname)?.scrollIntoView({ block: "center", inline: "nearest" });
      const onChange = () => notify();
      window.addEventListener("resize", onChange);
      window.addEventListener("scroll", onChange, true);
      const frame = requestAnimationFrame(onChange);
      return () => {
        window.removeEventListener("resize", onChange);
        window.removeEventListener("scroll", onChange, true);
        cancelAnimationFrame(frame);
      };
    },
    [active, name, pathname],
  );
  const box = useSyncExternalStore(
    subscribe,
    () => {
      if (!active || !name) return null;
      const node = visibleTarget(name, pathname);
      const rect = node?.getBoundingClientRect();
      if (!node || !rect || rect.width === 0 || rect.height === 0) return null;
      const style = getComputedStyle(node);
      const radii = [
        style.borderTopLeftRadius,
        style.borderTopRightRadius,
        style.borderBottomRightRadius,
        style.borderBottomLeftRadius,
      ].map((value) => {
        const radius = Number.parseFloat(value);
        return Number.isFinite(radius) ? radius : 0;
      });
      return `${rect.top}|${rect.left}|${rect.width}|${rect.height}|${radii.join("|")}`;
    },
    () => null,
  );
  if (!box) return null;
  const [top, left, width, height, topLeft, topRight, bottomRight, bottomLeft] = box.split("|").map(Number);
  return { top, left, width, height, topLeft, topRight, bottomRight, bottomLeft };
}

function visibleTarget(name: string, path: string) {
  if (!path) return null;
  const nodes = [...document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)];
  return (
    nodes.find((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    }) ?? null
  );
}

function TourOverlay() {
  const mounted = useMounted();
  const pathname = usePathname();
  const router = useRouter();
  const { state, currentStep, next, previous, skip, isLoading, isCompleted } = useOnboarding();
  const payload = currentStep?.payload as HintPayload | undefined;
  const show = mounted && !isLoading && !state?.isHydrating && !isCompleted && Boolean(payload);
  const rect = useTargetBox(show ? (payload?.target ?? null) : null, show, pathname);

  useEffect(() => {
    if (!show || !payload) return;
    if (HOME_TARGETS.has(payload.target) && pathname !== "/") router.push("/");
  }, [show, payload, pathname, router]);

  if (!show || !payload || !state) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none absolute border-2 border-accent"
          style={{
            top: Math.max(8, rect.top - 8),
            left: Math.max(8, rect.left - 8),
            width: rect.width + 16,
            height: rect.height + 16,
            borderRadius: `${rect.topLeft + 8}px ${rect.topRight + 8}px ${rect.bottomRight + 8}px ${rect.bottomLeft + 8}px`,
            boxShadow: "0 0 0 9999px rgba(18, 16, 12, 0.78)",
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-[#12100c]/80" />
      )}
      <TourCard
        rect={rect}
        title={payload.title}
        body={payload.body}
        step={state.currentStepNumber}
        total={state.totalSteps}
        canGoPrevious={state.canGoPrevious}
        isLast={state.isLastStep}
        onPrevious={() => void previous()}
        onNext={() => void next()}
        onSkip={() => void skip()}
      />
    </div>
  );
}

function TourCard({
  rect,
  title,
  body,
  step,
  total,
  canGoPrevious,
  isLast,
  onPrevious,
  onNext,
  onSkip,
}: {
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
  } | null;
  title: string;
  body: string;
  step: number;
  total: number;
  canGoPrevious: boolean;
  isLast: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const width = Math.min(352, typeof window === "undefined" ? 352 : window.innerWidth - 32);
  let top = 24;
  let left = 16;
  if (rect && typeof window !== "undefined") {
    const below = rect.top + rect.height + 16;
    const cardHeight = 196;
    top = below + cardHeight < window.innerHeight - 12 ? below : Math.max(12, rect.top - cardHeight - 16);
    left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
  }

  return (
    <div
      className="absolute rounded-3xl border border-accent bg-[#1a1610] p-4 shadow-2xl"
      style={{ top, left, width }}
    >
      <button
        type="button"
        onClick={onSkip}
        aria-label="Закрыть"
        className="grid size-8 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-foreground"
        style={{ position: "absolute", top: 12, right: 12 }}
      >
        <Icon name="cross" size={14} />
      </button>
      <p className="text-xs text-muted">
        {step} из {total}
      </p>
      <h2 id="onboarding-title" className="mt-1 font-display text-xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      <div className="mt-4 flex items-center justify-end gap-2">
        {canGoPrevious ? (
          <button
            type="button"
            onClick={onPrevious}
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            Назад
          </button>
        ) : null}
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-[#1a1408]"
        >
          {isLast ? "Понятно" : "Дальше"}
        </button>
      </div>
    </div>
  );
}

export function OnboardingTour({ email, children }: { email: string; children: ReactNode }) {
  return (
    <OnboardingProvider
      steps={STEPS}
      flowId="pyw-tour"
      localStoragePersistence={{ key: `pyw-onboard:${email}` }}
    >
      {children}
      <TourOverlay />
    </OnboardingProvider>
  );
}
