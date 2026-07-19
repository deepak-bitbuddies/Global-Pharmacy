"use client";

import { Avatar } from "@heroui/react";

type Props = {
  src?: string;
  alt?: string;
  title?: string;
  className?: string;
};

export function CustomAvatar({ alt = "avatar", ...props }: Props) {
  const getInitials = (text?: string) => {
    const cleanedText = text?.replace(/[^a-zA-Z\s]/g, "").trim();
    return text
      ?.trim()
      .replace(/[^a-zA-Z\s]/g, cleanedText == "" ? text : "")
      .split(/\s+/) // handles multiple spaces
      .slice(0, 2) // limit to first two words
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Avatar className={props.className}>
      <Avatar.Image alt={alt} src={props.src} />
      <Avatar.Fallback>{getInitials(props.title)}</Avatar.Fallback>
    </Avatar>
  );
}
