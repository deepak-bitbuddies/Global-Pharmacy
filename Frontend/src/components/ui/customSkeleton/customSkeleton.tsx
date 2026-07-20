import { Skeleton } from "@heroui/react";

type CustomSkeletonProps = {
  className?: string;
};

export const CustomSkeleton = ({ className }: CustomSkeletonProps) => {
  return <Skeleton className={`rounded-app ${className}`} />;
};
