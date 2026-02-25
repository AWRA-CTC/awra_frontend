import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    "border border-rose-300/50 bg-[linear-gradient(135deg,#ff4a55,#d01129)] text-white shadow-[0_10px_30px_rgba(255,58,70,0.32)] hover:brightness-110",
  secondary:
    "border border-white/20 bg-white/5 text-white hover:border-white/30 hover:bg-white/10",
  danger:
    "border border-rose-300/35 bg-rose-950/45 text-rose-100 hover:bg-rose-900/60",
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-xl font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/75 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-55",
        variantClassName[variant],
        sizeClassName[size],
        className,
      )}
      {...props}
    />
  );
});
