import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Shared with `WalletConnectModal` — icon dismiss, matches secondary cancel surface. */
export const MODAL_ICON_CLOSE_CLASS =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zap-bg-alt bg-zap-bg-raised p-0 text-zap-ink-muted transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-alt hover:text-zap-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zap-brand focus-visible:ring-offset-2 focus-visible:ring-offset-zap-surface";

/** Full-width secondary action — pairs with `brandCta` primary (outline pill, not editorial ghost). */
export const MODAL_FOOTER_CANCEL_CLASS =
  "inline-flex w-full min-h-11 items-center justify-center rounded-full border border-zap-bg-alt bg-zap-bg-raised px-5 font-body text-sm font-semibold text-zap-ink transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-alt disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zap-brand focus-visible:ring-offset-2 focus-visible:ring-offset-zap-surface";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /**
   * When omitted, the title uses default display typography.
   * When set, this string **replaces** those defaults (pass the full utility set you want);
   * `min-w-0` is always applied on the `<h2>`.
   */
  titleClassName?: string;
  /** Wider panel for long forms (e.g. Content unlock builder). */
  wide?: boolean;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  titleClassName,
  wide = false,
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        if (modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length) {
            (focusableElements[0] as HTMLElement).focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 10);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const titleTypography =
    titleClassName ??
    "font-body text-xl font-semibold leading-snug tracking-tight text-zap-ink";

  const modalTree = (
    <div
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
    >
      {/* Backdrop — strong blur + dark scrim so content beneath is barely visible */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-3xl backdrop-saturate-50 dark:bg-black/75"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal content */}
      <div
        className={`relative z-10 flex max-h-[min(100dvh,720px)] w-full flex-col overflow-hidden rounded-t-3xl border border-zap-bg-alt bg-zap-surface shadow-none max-sm:max-h-[92dvh] sm:mx-4 sm:max-h-[85vh] sm:rounded-3xl ${
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-label={title ? undefined : "Dialog"}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zap-bg-alt px-5 py-4 sm:px-8 sm:py-5">
            <h2
              id="modal-title"
              className={`min-w-0 ${titleTypography}`}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={MODAL_ICON_CLOSE_CLASS}
              aria-label="Close modal"
            >
              <X size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalTree, document.body);
};

export default Modal;
