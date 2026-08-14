"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type ActionDropdownProps = {
  label: string;
  trigger: ReactNode;
  triggerClassName: string;
  children: ReactNode;
  menuWidth?: number;
};

type MenuPosition = {
  left: number;
  top: number;
  visible: boolean;
};

export function ActionDropdown({
  label,
  trigger,
  triggerClassName,
  children,
  menuWidth = 272,
}: ActionDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({
    left: 12,
    top: 12,
    visible: false,
  });

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;
    const triggerElement = triggerRef.current;
    const menuElement = menuRef.current;
    if (!triggerElement || !menuElement) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const renderedMenuWidth = menuElement.offsetWidth;
    const menuHeight = menuElement.offsetHeight;
    const viewportPadding = 12;
    const gap = 8;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const top =
      spaceBelow >= menuHeight + gap || triggerRect.top < menuHeight + gap
        ? triggerRect.bottom + gap
        : triggerRect.top - menuHeight - gap;
    const left = Math.min(
      Math.max(viewportPadding, triggerRect.right - renderedMenuWidth),
      window.innerWidth - renderedMenuWidth - viewportPadding,
    );
    setPosition({ left, top: Math.max(viewportPadding, top), visible: true });
  }, [menuWidth, open]);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    const close = () => setOpen(false);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.visualViewport?.addEventListener("resize", close);
    window.visualViewport?.addEventListener("scroll", close);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      window.visualViewport?.removeEventListener("resize", close);
      window.visualViewport?.removeEventListener("scroll", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        className={triggerClassName}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setPosition((current) => ({ ...current, visible: false }));
          setOpen((current) => !current);
        }}
      >
        {trigger}
      </button>
      {mounted && open
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[1000] overflow-hidden rounded-lg border border-border bg-bg-elevated p-1.5 shadow-xl"
              role="menu"
              style={{
                left: position.left,
                maxWidth: "calc(100vw - 24px)",
                top: position.top,
                visibility: position.visible ? "visible" : "hidden",
                width: menuWidth,
              }}
              onClick={(event) => {
                const target = event.target;
                if (
                  target instanceof Element &&
                  target.closest("[data-menu-keep-open]")
                ) {
                  return;
                }
                if (target instanceof Element && target.closest("a, button")) {
                  setOpen(false);
                }
              }}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
