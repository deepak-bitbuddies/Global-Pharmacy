"use client";

import Image from "next/image";
import { useState } from "react";
import { CustomSkeleton } from "../customSkeleton/customSkeleton";

type CustomImageProps = {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  /** Shown in place of `src` if the image fails to load. */
  fallbackSrc: string;
  sizes?: string;
};

export function CustomImage({
  src,
  alt = "image",
  className = "",
  containerClassName = "",
  fallbackSrc,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: CustomImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const displaySrc = error ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {loading && !error && (
        <CustomSkeleton className="absolute inset-0 z-10 h-full w-full rounded-none" />
      )}

      <Image
        fill
        sizes={sizes}
        src={displaySrc}
        alt={alt}
        className={`${className}`}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
