import { useEffect, useRef, useState } from "react";

export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
       Promise.resolve().then(() => setVisible(true));
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.06, rootMargin: "0px 0px -24px 0px", ...options }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}
