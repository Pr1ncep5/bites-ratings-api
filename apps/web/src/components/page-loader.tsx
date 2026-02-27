import * as React from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface PageLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  fullScreen?: boolean;
}

export function PageLoader({
  className,
  message = "Loading...",
  fullScreen = false,
  ...props
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-4",
        fullScreen ? "h-dvh" : "min-h-[50vh]",
        className,
      )}
      {...props}
    >
      <Spinner className="size-8 text-primary" />
      {message && <p className="text-sm font-medium animate-pulse">{message}</p>}
    </div>
  );
}
