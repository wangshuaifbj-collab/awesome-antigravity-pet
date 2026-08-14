"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { useLocale } from "@/components/locale-provider";
import { getLocalizedPetName } from "@/lib/codex-links";
import { translations, type TranslationKey } from "@/lib/i18n";
import type { Pet, PreviewAction } from "@/lib/pets";

export type PlaygroundAction = {
  action: PreviewAction;
  title: string;
  image: string;
};

type Position = { x: number; y: number };
type DragSample = { x: number; y: number; time: number };
type DragDirection = "left" | "right" | "vertical";

const GESTURE_SAMPLE_WINDOW_MS = 140;
const GESTURE_MIN_DISTANCE_PX = 10;
const GESTURE_AXIS_BIAS = 1.12;
const AMBIENT_MIN_DELAY_MS = 6000;
const AMBIENT_MAX_DELAY_MS = 9500;
const AMBIENT_ACTION_DURATION_MS = 2200;
const movementActions = new Set([
  "idle",
  "running",
  "running-left",
  "running-right",
  "jumping",
]);

const knownActionKeys = new Set(Object.keys(translations.en));

function resolveDragDirection(samples: DragSample[]): DragDirection | null {
  if (samples.length < 2) return null;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (Math.max(absX, absY) < GESTURE_MIN_DISTANCE_PX) return null;
  if (absX > absY * GESTURE_AXIS_BIAS) {
    return dx < 0 ? "left" : "right";
  }
  if (absY > absX * GESTURE_AXIS_BIAS) return "vertical";
  return null;
}

export function PetPlayground({
  pet,
  actions,
  sidebar,
}: {
  pet: Pet;
  actions: PlaygroundAction[];
  sidebar: ReactNode;
}) {
  const { t, locale } = useLocale();
  const localizedName = getLocalizedPetName(pet, locale);
  const stageRef = useRef<HTMLDivElement>(null);
  const petRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: Position;
    samples: DragSample[];
    action: PreviewAction | null;
  } | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [gestureAction, setGestureAction] = useState<PreviewAction | null>(null);
  const [ambientAction, setAmbientAction] = useState<PreviewAction | null>(null);
  const [activityVersion, setActivityVersion] = useState(0);
  const ambientIndexRef = useRef(0);
  const [selectedAction, setSelectedAction] = useState(
    actions[0]?.action ?? "idle",
  );

  const activeAction =
    actions.find(
      (item) => item.action === (gestureAction ?? ambientAction ?? selectedAction),
    ) ??
    actions[0];
  const activeImage = activeAction?.image ?? pet.animatedPreviewImage;

  function firstAvailableAction(candidates: PreviewAction[]) {
    return candidates.find((candidate) =>
      actions.some((item) => item.action === candidate),
    ) ?? null;
  }

  function actionForDirection(direction: DragDirection) {
    if (direction === "left") {
      return firstAvailableAction(["running-left", "running", "jumping", "idle"]);
    }
    if (direction === "right") {
      return firstAvailableAction(["running-right", "running", "jumping", "idle"]);
    }
    return firstAvailableAction(["jumping", "waving", "idle"]);
  }

  function actionLabel(item: PlaygroundAction) {
    return knownActionKeys.has(item.action)
      ? t(item.action as TranslationKey)
      : item.title;
  }

  function registerActivity() {
    setAmbientAction(null);
    setActivityVersion((current) => current + 1);
  }

  useEffect(() => {
    if (dragging || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const idleAction = actions.find((item) => item.action === "idle") ?? actions[0];
    const ambientActions = actions.filter(
      (item) => !movementActions.has(item.action),
    );
    if (!idleAction || ambientActions.length === 0) return;

    let actionTimer: number | null = null;
    let idleTimer: number | null = null;
    let cancelled = false;

    function scheduleAmbientAction() {
      const delay =
        AMBIENT_MIN_DELAY_MS +
        Math.random() * (AMBIENT_MAX_DELAY_MS - AMBIENT_MIN_DELAY_MS);
      actionTimer = window.setTimeout(() => {
        if (cancelled) return;
        const next = ambientActions[ambientIndexRef.current % ambientActions.length];
        ambientIndexRef.current += 1;
        setAmbientAction(next.action);
        idleTimer = window.setTimeout(() => {
          if (cancelled) return;
          setAmbientAction(null);
          setSelectedAction(idleAction.action);
          scheduleAmbientAction();
        }, AMBIENT_ACTION_DURATION_MS);
      }, delay);
    }

    scheduleAmbientAction();
    return () => {
      cancelled = true;
      if (actionTimer !== null) window.clearTimeout(actionTimer);
      if (idleTimer !== null) window.clearTimeout(idleTimer);
    };
  }, [actions, activityVersion, dragging]);

  function clampPosition(next: Position): Position {
    const stage = stageRef.current?.getBoundingClientRect();
    const petBounds = petRef.current?.getBoundingClientRect();
    if (!stage || !petBounds) return next;
    const maxX = Math.max(0, (stage.width - petBounds.width) / 2 - 18);
    const maxY = Math.max(0, (stage.height - petBounds.height) / 2 - 18);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  function startDrag(event: ReactPointerEvent<HTMLImageElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    registerActivity();
    event.currentTarget.setPointerCapture(event.pointerId);
    const liftAction = actionForDirection("vertical");
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: position,
      samples: [{ x: event.clientX, y: event.clientY, time: event.timeStamp }],
      action: liftAction,
    };
    setGestureAction(liftAction);
    setDragging(true);
  }

  function movePet(event: ReactPointerEvent<HTMLImageElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    drag.samples.push({
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
    });
    const cutoff = event.timeStamp - GESTURE_SAMPLE_WINDOW_MS;
    while (drag.samples.length > 2 && drag.samples[1].time < cutoff) {
      drag.samples.shift();
    }

    const direction = resolveDragDirection(drag.samples);
    if (direction) {
      const nextAction = actionForDirection(direction);
      if (nextAction && nextAction !== drag.action) {
        drag.action = nextAction;
        setGestureAction(nextAction);
      }
    }

    setPosition(
      clampPosition({
        x: drag.origin.x + event.clientX - drag.startX,
        y: drag.origin.y + event.clientY - drag.startY,
      }),
    );
  }

  function stopDrag(event: ReactPointerEvent<HTMLImageElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    setGestureAction(null);
    setActivityVersion((current) => current + 1);
    const idleAction = firstAvailableAction(["idle"]);
    if (idleAction) setSelectedAction(idleAction);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function resetPosition() {
    setPosition({ x: 0, y: 0 });
    setAmbientAction(null);
    const idleAction = firstAvailableAction(["idle"]);
    if (idleAction) setSelectedAction(idleAction);
    setActivityVersion((current) => current + 1);
  }

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)] lg:items-start lg:gap-10">
      <div
        ref={stageRef}
        data-active-action={activeAction?.action ?? "idle"}
        className="relative order-1 flex min-h-[420px] items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-secondary sm:min-h-[520px] lg:col-start-1 lg:row-start-1"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(45deg,var(--color-bg-tertiary)_25%,transparent_25%),linear-gradient(-45deg,var(--color-bg-tertiary)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,var(--color-bg-tertiary)_75%),linear-gradient(-45deg,transparent_75%,var(--color-bg-tertiary)_75%)] [background-position:0_0,0_8px,8px_-8px,-8px_0px] [background-size:16px_16px]"
        />
        <div className="absolute left-4 top-4 z-10 rounded-md border border-border bg-bg/85 px-2.5 py-1 text-xs font-medium text-text backdrop-blur" aria-live="polite">
          {activeAction ? actionLabel(activeAction) : t("interactivePreview")}
        </div>
        <button
          className="absolute right-4 top-4 z-20 inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-bg/85 text-muted backdrop-blur transition-colors hover:bg-bg-elevated hover:text-text"
          type="button"
          title={t("resetPetPosition")}
          aria-label={t("resetPetPosition")}
          onClick={resetPosition}
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 101.7-4.75M4.5 4.5v5h5" />
          </svg>
        </button>
        <img
          ref={petRef}
          className={`relative z-10 max-h-64 max-w-[72%] select-none object-contain [image-rendering:pixelated] will-change-transform sm:max-h-80 ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          src={activeImage}
          alt={`${localizedName} ${activeAction?.title ?? "preview"}`}
          draggable={false}
          style={{
            touchAction: "none",
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          }}
          onDoubleClick={resetPosition}
          onPointerDown={startDrag}
          onPointerMove={movePet}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          onLostPointerCapture={() => {
            if (!dragRef.current) return;
            dragRef.current = null;
            setDragging(false);
            setGestureAction(null);
            const idleAction = firstAvailableAction(["idle"]);
            if (idleAction) setSelectedAction(idleAction);
          }}
        />
      </div>

      <div className="order-3 min-w-0 lg:order-2 lg:col-start-2 lg:row-start-1">
        {sidebar}
      </div>

      {actions.length > 0 ? (
        <div
          data-action-picker
          className="order-2 grid gap-2.5 border-b border-border pb-8 lg:order-3 lg:col-span-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,7.5rem),1fr))]"
        >
          {actions.map((item) => {
            const selected = item.action === activeAction?.action;
            return (
              <button
                className={`group flex min-h-32 min-w-0 cursor-pointer flex-col items-stretch gap-2 rounded-lg border p-2 text-center transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 ${
                  selected
                    ? "border-accent bg-accent-light"
                    : "border-border bg-bg-elevated hover:border-border-hover hover:bg-surface"
                }`}
                key={item.action}
                type="button"
                aria-pressed={selected}
                title={actionLabel(item)}
                onClick={() => {
                  registerActivity();
                  setSelectedAction(item.action);
                }}
              >
                <span className="flex h-20 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg-secondary">
                  <img
                    className="max-h-full max-w-full object-contain [image-rendering:pixelated]"
                    src={item.image}
                    alt=""
                    loading="lazy"
                  />
                </span>
                <span className="min-w-0 whitespace-normal break-words px-1 text-xs font-medium leading-snug text-text">
                  {actionLabel(item)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
