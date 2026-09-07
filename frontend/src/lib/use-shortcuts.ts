"use client";

import { useEffect } from "react";

/**
 * Bölüm 3.3, klavye: `/` arama alanına odaklanır, `Esc` açık katmanı kapatır.
 * Faz 2'de komut paleti (Cmd/Ctrl+K) aynı kayıt mekanizmasına takılır.
 *
 * Kısayollar sonradan eklenemez; bileşenlerin en baştan odak yönetimini
 * doğru yapması gerektiği için tek merkezden kurulur.
 */

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
  );
}

/** `/` tuşu verilen ref'teki alana odaklanır. */
export function useSearchHotkey(
  ref: React.RefObject<HTMLInputElement | null>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      ref.current?.focus();
      ref.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ref, enabled]);
}

/** `Esc` açık katmanı kapatır. */
export function useEscape(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEscape, enabled]);
}
