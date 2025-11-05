import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

type SwitchSize = "sm" | "default" | "lg";

type SwitchProps = React.ComponentPropsWithoutRef<
  typeof SwitchPrimitives.Root
> & {
  size?: SwitchSize;
};

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size = "default", ...props }, ref) => {
  const rootClass = cn(
    "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
    size === "sm" ? "h-5 w-9" : size === "lg" ? "h-8 w-14" : "h-6 w-11",
    className,
  );

  const thumbClass = cn(
    "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
    size === "sm"
      ? "h-4 w-4 data-[state=checked]:translate-x-4"
      : size === "lg"
      ? "h-7 w-7 data-[state=checked]:translate-x-6"
      : "h-5 w-5 data-[state=checked]:translate-x-5",
  );

  return (
    <SwitchPrimitives.Root className={rootClass} {...props} ref={ref}>
      <SwitchPrimitives.Thumb className={thumbClass} />
    </SwitchPrimitives.Root>
  );
});

Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
