import { ProgressBar } from "@heroui/react";

/**
 * Props for CustomProgress component.
 */
type Props = {
  /**
   * Progress value between 0 and 100. Defaults to 0.
   */
  progress?: number;
  /**
   * Additional CSS classes to apply to the progress container.
   */
  className?: string;
};

/**
 * Custom Progress bar wrapper around HeroUI Progress component.
 *
 * ## Example:
 * ```
 * <CustomProgress progress={75} className="w-full" />
 * ```
 *
 * @param props - Props for the progress bar
 */
export const CustomProgress = (props: Props) => {
  return (
    <ProgressBar value={props.progress} className={props.className}>
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  );
};
