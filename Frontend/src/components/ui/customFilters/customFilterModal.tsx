"use client";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FunnelIcon } from "@phosphor-icons/react";
import { ButtonVariant, CustomButton } from "../customButton/customButton";
import { CustomModal } from "../customModal/customModal";

type CustomFilterModalProps<T> = {
  /** The currently *applied* filters — the draft is re-seeded from this every time the modal opens, so reopening after Cancel always starts from what's actually applied. */
  filters: T;
  /** Committed only when the user presses Apply — Cancel/close discards the draft entirely. */
  onApply: (filters: T) => void;
  /** Shown in parentheses on the trigger button, e.g. "Filters (3)". */
  activeCount: number;
  /** Renders the modal's field content — receives the local draft plus its setter, stacked one field per row. */
  children: (draft: T, setDraft: (updater: (prev: T) => T) => void) => ReactNode;
  title?: string;
};

/**
 * The shared "Filters" button + modal shell used across the app (Reports, Expense Tracker, ...) —
 * one implementation of the open/draft/Apply-Cancel mechanics, instead of every module re-building
 * its own. Widens on large screens (`size="lg"`) so longer field controls have room to breathe.
 */
export function CustomFilterModal<T>({ filters, onApply, activeCount, children, title }: CustomFilterModalProps<T>) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<T>(filters);

  return (
    <>
      <CustomButton
        variant={ButtonVariant.primary}
        startContent={<FunnelIcon className="size-4" />}
        onClick={() => {
          setDraft(filters);
          setIsOpen(true);
        }}
      >
        {title ?? t("Filters")}
        {activeCount > 0 ? ` (${activeCount})` : ""}
      </CustomButton>

      <CustomModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title={title ?? t("Filters")}
        negativeText={t("Cancel")}
        onNegativePress={() => setIsOpen(false)}
        positiveText={t("Apply")}
        onPositivePress={() => {
          onApply(draft);
          setIsOpen(false);
        }}
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4">{children(draft, setDraft)}</div>
      </CustomModal>
    </>
  );
}

/** One filter field's label + control, meant as a direct child of `CustomFilterModal`. */
export function CustomFilterField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {children}
    </div>
  );
}
