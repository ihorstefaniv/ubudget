/**
 * @file components/ui/Modal.tsx
 * @description Уніфікований модальний компонент для всього проєкту.
 * Замінює Modal в accounts/page.tsx і ModalWrap в investments/page.tsx.
 *
 * Використання:
 *   import { Modal } from "@/components/ui/Modal";
 *
 *   <Modal title="Додати рахунок" onClose={() => setOpen(false)}>
 *     <p>Контент модалки</p>
 *     <div className="flex gap-2 mt-4">
 *       <Button variant="secondary" onClick={onClose}>Скасувати</Button>
 *       <Button onClick={handleSave}>Зберегти</Button>
 *     </div>
 *   </Modal>
 */

import React, { useEffect } from "react";
import { Icon, icons } from "./Icon";

// ─── Типи ─────────────────────────────────────────────────────

interface ModalProps {
  /** Заголовок модалки */
  title: string;
  /** Колбек при закритті (кнопка ✕ або клік на overlay) */
  onClose: () => void;
  /** Контент модалки */
  children: React.ReactNode;
  /** Максимальна ширина. За замовчуванням "sm" (~448px) */
  size?: "sm" | "md" | "lg";
  /** Не закривати при кліку на overlay */
  disableOverlayClose?: boolean;
}

const SIZES: Record<string, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-3xl",
};

// ─── Компонент ────────────────────────────────────────────────

/**
 * Модальне вікно з overlay, sticky заголовком і скролом контенту.
 * На мобільних відкривається знизу (bottom sheet).
 * Закривається по Escape або кліку на overlay.
 */
export function Modal({
  title,
  onClose,
  children,
  size = "sm",
  disableOverlayClose = false,
}: ModalProps) {

  // Закриття по Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Блокуємо скрол body поки модалка відкрита
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    // Overlay — темний фон
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={disableOverlayClose ? undefined : onClose}
    >
      {/* Контейнер модалки — зупиняємо bubbling щоб клік всередині не закривав */}
      <div
        className={`bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full ${SIZES[size]} border-t sm:border border-neutral-100 dark:border-neutral-800 flex flex-col max-h-[90vh]`}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky заголовок */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Закрити"
          >
            <Icon d={icons.close} className="w-4 h-4" />
          </button>
        </div>

        {/* Скролабельний контент */}
        <div className="overflow-y-auto p-5 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}