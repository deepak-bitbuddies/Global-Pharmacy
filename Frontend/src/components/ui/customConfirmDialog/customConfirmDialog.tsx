"use client";
import { AlertDialog } from "@heroui/react";
import { useTranslations } from "next-intl";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { ButtonVariant, CustomButton } from "../customButton/customButton";

export enum ConfirmVariant {
  default = "default",
  warning = "warning",
  danger = "danger",
}

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  /** Extra content rendered below the description, e.g. a reason input for soft deletes. */
  extra?: ReactNode;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

const variantToStatus: Record<ConfirmVariant, "default" | "warning" | "danger"> = {
  [ConfirmVariant.default]: "default",
  [ConfirmVariant.warning]: "warning",
  [ConfirmVariant.danger]: "danger",
};

const variantToButtonVariant: Record<ConfirmVariant, ButtonVariant> = {
  [ConfirmVariant.default]: ButtonVariant.primary,
  [ConfirmVariant.warning]: ButtonVariant.primary,
  [ConfirmVariant.danger]: ButtonVariant.danger,
};

export function CustomConfirmDialogProvider({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    setIsOpen(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
  };

  const variant = options?.variant ?? ConfirmVariant.default;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isOpen}
          onOpenChange={(open) => {
            if (!open) close(false);
          }}
        >
          <AlertDialog.Container size="sm">
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Icon status={variantToStatus[variant]} />
                <AlertDialog.Heading>{options?.title}</AlertDialog.Heading>
              </AlertDialog.Header>
              {(options?.description || options?.extra) && (
                <AlertDialog.Body>
                  {options?.description}
                  {options?.extra}
                </AlertDialog.Body>
              )}
              <AlertDialog.Footer>
                <CustomButton variant={ButtonVariant.tertiary} onClick={() => close(false)}>
                  {options?.cancelLabel ?? t("Close")}
                </CustomButton>
                <CustomButton
                  variant={variantToButtonVariant[variant]}
                  onClick={() => close(true)}
                >
                  {options?.confirmLabel ?? t("Done")}
                </CustomButton>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a CustomConfirmDialogProvider");
  }
  return ctx;
}
