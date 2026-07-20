"use client";
import { Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import {
  ButtonType,
  ButtonVariant,
  CustomButton,
} from "../customButton/customButton";
import { BackdropEnum } from "../customDrawer/customDrawer";
import { CustomText, TextVariant } from "../customText/customText";

/**
 * Scroll options for modal overlay
 * @constant
 * @readonly
 * @description Defines how the scroll behaves in modal
 * - inside: Scroll content inside modal body
 * - outside: Whole body gets scrolled
 * - normal: Normal content
 */
export enum ModalScrollBehaviorEnum {
  inside = "inside",
  outside = "outside",
}

/**
 * Props for CustomModal component
 * @interface CustomModalProps
 * @description A customizable modal component
 */
type CustomModalProps = {
  /** Modal body content */
  children: ReactNode;
  /** Title text to display in the modal header */
  title?: string;
  /** Subtitle text to display below the title */
  subTitle?: string;
  /** Additional CSS classes for the modal wrapper */
  wrapperStyle?: string;
  /** Additional CSS classes for the content wrapper */
  contentWrapperStyle?: string;
  /** Backdrop type for the modal overlay. Default: BackdropEnum.blur */
  backdrop?: BackdropEnum;
  /** Whether to show loading state. Default: false */
  loading?: boolean;
  /** Whether the modal is open. Default: false */
  isOpen?: boolean;
  /** Callback to set modal open state */
  setIsOpen?: (isOpen: boolean) => void;
  /** Text for the positive action button (e.g., Confirm, Save) */
  positiveText?: string;
  positiveType?: ButtonType;
  /** Text for the negative action button (e.g., Cancel, Close) */
  negativeText?: string;
  /** Callback when positive button is clicked */
  onPositivePress?: () => void;
  positiveButtonVariant?: ButtonVariant;
  /** Callback when negative button is clicked */
  onNegativePress?: () => void;
  negativeButtonVariant?: ButtonVariant;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Modal scroll behavior (e.g. Inside, Outside, Normal) */
  scrollBehavior?: ModalScrollBehaviorEnum;
  className?: string;
  /** size of modal */
  size?: "xs" | "sm" | "md" | "lg" | "cover" | "full";
};

/**
 * CustomModal - A customizable modal component
 * @component
 * @description A customizable modal component with support for titles, subtitles,
 * action buttons, loading states, and backdrop customization.
 *
 * @param {CustomModalProps} props - Component props
 * @returns {JSX.Element} The CustomModal component
 *
 * @example
 * // Basic modal with content
 * const [isOpen, setIsOpen] = useState(false);
 * <CustomModal isOpen={isOpen} setIsOpen={setIsOpen}>
 *   <p>Modal content here</p>
 * </CustomModal>
 *
 * @example
 * // Modal with title, subtitle and action buttons
 * <CustomModal
 *   isOpen={isOpen}
 *   setIsOpen={setIsOpen}
 *   title="Delete Item"
 *   subTitle="This action cannot be undone"
 *   positiveText="Delete"
 *   negativeText="Cancel"
 *   onPositivePress={handleDelete}
 *   onNegativePress={() => setIsOpen(false)}
 * >
 *   <p>Are you sure you want to delete this item?</p>
 * </CustomModal>
 *
 * @example
 * // Modal with blur backdrop (default)
 * <CustomModal
 *   isOpen={isOpen}
 *   setIsOpen={setIsOpen}
 *   backdrop={BackdropEnum.blur}
 * >
 *   <p>Modal with blur effect behind</p>
 * </CustomModal>
 */
export const CustomModal = ({
  backdrop = BackdropEnum.blur,
  ...props
}: CustomModalProps) => {
  const t = useTranslations();

  const handleClose = () => {
    props.onNegativePress?.();
    props.onClose?.();
    props.setIsOpen?.(false);
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={props.isOpen}
        onOpenChange={(value) => {
          props.setIsOpen?.(value);
          if (!value) {
            props.onClose?.();
          }
        }}
        variant={backdrop}
      >
        <Modal.Container
          size={props.size}
          scroll={props.scrollBehavior}
          className={`rounded-app`}
        >
          <Modal.Dialog>
            <Modal.CloseTrigger />
            {props.title && (
              <Modal.Header className="px-1">
                <Modal.Heading>
                  <CustomText variant={TextVariant.body}>
                    {props.title}
                  </CustomText>
                </Modal.Heading>
                {props.subTitle && (
                  <CustomText variant={TextVariant.bodySm}>
                    {props.subTitle}
                  </CustomText>
                )}
              </Modal.Header>
            )}

            {props.children && (
              <Modal.Body className={`mt-5 px-1 ${props.className}`}>
                {props.children}
              </Modal.Body>
            )}

            <Modal.Footer>
              {props.onNegativePress && (
                <CustomButton
                  variant={
                    props.negativeButtonVariant ?? ButtonVariant.tertiary
                  }
                  onClick={handleClose}
                >
                  {props.negativeText ?? t("Close")}
                </CustomButton>
              )}
              {props.onPositivePress && (
                <CustomButton
                  loading={props.loading}
                  variant={props.positiveButtonVariant ?? ButtonVariant.primary}
                  type={props.positiveType}
                  onClick={() => {
                    if (!props.loading) {
                      props.onPositivePress?.();
                    }
                  }}
                >
                  {props.positiveText ?? t("Done")}
                </CustomButton>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
