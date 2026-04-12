import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
  /** `editorial` matches dashboard / landing (rounded, zap tokens). `default` keeps the legacy brutalist shell. */
  variant?: "default" | "editorial";
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
  hover = false,
  variant = "default",
}) => {
  const paddings: Record<string, string> = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const variantBase =
    variant === "editorial"
      ? "rounded-3xl border border-zap-bg-alt bg-zap-surface shadow-none dark:border-zap-bg-alt dark:bg-zap-surface"
      : "border-3 border-black bg-white shadow-none";

  const hoverClass =
    variant === "editorial" && hover
      ? "transition-colors duration-200 hover:border-zap-bg-alt/35"
      : variant === "default" && hover
        ? "hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform duration-200"
        : "";

  return (
    <div
      className={`${variantBase} ${paddings[padding]} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
