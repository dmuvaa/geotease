import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-ink text-paper hover:opacity-90",
  pin: "bg-pin text-white hover:brightness-105",
  ghost: "border border-line bg-transparent text-ink hover:bg-paper",
} as const;

export function buttonClass(variant: keyof typeof variants = "primary", className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium tracking-wide transition disabled:pointer-events-none disabled:opacity-40",
    variants[variant],
    className,
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}
