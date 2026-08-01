"use client";
import { Tabs } from "@heroui/react";
import { ReactNode } from "react";
import { SharedElementTransition } from "react-aria-components/SharedElementTransition";

export enum TabsOrientation {
  horizontal = "horizontal",
  vertical = "vertical",
}

export type CustomTabItem = {
  key: string;
  label: ReactNode;
  content: ReactNode;
};

type CustomTabsProps = {
  items: CustomTabItem[];
  className?: string;
  orientation?: TabsOrientation;
};

export const CustomTabs = ({ items, className, orientation }: CustomTabsProps) => {
  return (
    <SharedElementTransition>
      <Tabs className={className} orientation={orientation}>
        <Tabs.ListContainer>
          <Tabs.List>
            {items.map((item) => (
              // Colored directly on the tab rather than via Tabs.Indicator — the indicator's
              // JS-measured position/size wasn't rendering reliably (selected text turned light
              // with no pill behind it, i.e. invisible). Trades the slide animation for a
              // guaranteed-visible selected state.
              <Tabs.Tab
                key={item.key}
                id={item.key}
                className="data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
              >
                {item.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
        {items.map((item) => (
          <Tabs.Panel key={item.key} id={item.key}>
            {item.content}
          </Tabs.Panel>
        ))}
      </Tabs>
    </SharedElementTransition>
  );
};
