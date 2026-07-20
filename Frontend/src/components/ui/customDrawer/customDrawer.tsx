"use client";
import { Drawer, useOverlayState } from "@heroui/react";
import { ReactNode } from "react";

export enum DrawerPlacement {
  left = "left",
  right = "right",
  top = "top",
  bottom = "bottom",
}

export enum BackdropEnum {
  opaque = "opaque",
  blur = "blur",
  transparent = "transparent",
}

type CustomDrawerProps = {
  trigger: ReactNode;
  title?: ReactNode;
  content?: ReactNode;
  placement?: DrawerPlacement;
  backdrop?: BackdropEnum;
  renderContent?: (onClose: () => void) => ReactNode;
  className?: string;
  wrapperStyle?: string;
  headerStyle?: string;
  bodyStyle?: string;
};

export const CustomDrawer = ({
  backdrop = BackdropEnum.blur,
  placement = DrawerPlacement.left,
  ...props
}: CustomDrawerProps) => {
  const state = useOverlayState();

  return (
    <>
      <span onClick={state.open} className="contents">
        {props.trigger}
      </span>
      <Drawer.Backdrop
        isOpen={state.isOpen}
        onOpenChange={state.setOpen}
        variant={backdrop}
        className={props.wrapperStyle}
      >
        <Drawer.Content placement={placement}>
          <Drawer.Dialog className={`${props.className ?? ""}`}>
            <Drawer.CloseTrigger />
            {props.title && (
              <Drawer.Header className={props.headerStyle}>
                <Drawer.Heading>{props.title}</Drawer.Heading>
              </Drawer.Header>
            )}
            {props.content && (
              <Drawer.Body className={props.bodyStyle}>
                {props.content}
              </Drawer.Body>
            )}
            {props.renderContent && (
              <Drawer.Body className={props.bodyStyle}>
                {props.renderContent(state.close)}
              </Drawer.Body>
            )}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
};
