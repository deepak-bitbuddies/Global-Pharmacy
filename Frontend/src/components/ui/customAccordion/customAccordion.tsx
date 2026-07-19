"use client";
import { Accordion } from "@heroui/react";
import { ReactNode } from "react";

export type CustomAccordionItem = {
  key: string;
  title: ReactNode;
  content: ReactNode;
};

type CustomAccordionProps = {
  items: CustomAccordionItem[];
  className?: string;
  hideSeparator?: boolean;
};

export const CustomAccordion = ({
  items,
  className,
  hideSeparator,
}: CustomAccordionProps) => {
  return (
    <Accordion className={className} hideSeparator={hideSeparator}>
      {items.map((item) => (
        <Accordion.Item key={item.key} id={item.key}>
          <Accordion.Heading>
            <Accordion.Trigger>
              {item.title}
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>{item.content}</Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};
