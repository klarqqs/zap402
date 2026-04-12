import React from "react";

import Button from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    /** Default `outline`; use `brandCta` for errors / retry. */
    buttonVariant?: "outline" | "brandCta" | "primary" | "editorial";
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icon && (
        <div className="text-zap-ink-muted [&_svg]:opacity-80">{icon}</div>
      )}
      <h3 className="font-body text-[13px] font-semibold uppercase tracking-[0.06em] text-zap-ink">
        {title}
      </h3>
      {description && (
        <p className="max-w-sm text-pretty text-sm leading-relaxed text-zap-ink-muted">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          variant={action.buttonVariant ?? "outline"}
          onClick={action.onClick}
          className="mt-1 min-w-[11rem] justify-center"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
