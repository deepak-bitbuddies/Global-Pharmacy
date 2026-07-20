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
              <Tabs.Tab key={item.key} id={item.key}>
                {item.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <Tabs.Indicator />
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
