import React from "react";

import { useScrollReveal } from "@/hooks/useScrollReveal";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({ children, className = "" }) => {
  const { ref, visible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`reveal-on-scroll ${visible ? "reveal-on-scroll--visible" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
