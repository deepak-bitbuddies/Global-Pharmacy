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
      {/* `h-full min-h-0` on both the root and every panel — inert (resolves to `auto`) for
          callers with no height-bearing ancestor, but lets a caller that DOES set one up (e.g. a
          page wrapping this in `flex h-full min-h-0 flex-col`) have its tab content fill the
          remaining space, so a `fillHeight` table inside a tab scrolls internally instead of the
          whole page scrolling past it — same behavior every non-tabbed list page already has. */}
      <Tabs className={`h-full min-h-0 ${className ?? ""}`} orientation={orientation}>
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
          <Tabs.Panel key={item.key} id={item.key} className="flex h-full min-h-0 flex-col">
            {item.content}
          </Tabs.Panel>
        ))}
      </Tabs>
    </SharedElementTransition>
  );
};
