import { useEffect, useState } from "react";

const SHRINK_AFTER = 48;

export function useNavShrink() {
  const [shrunk, setShrunk] = useState(false);

  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > SHRINK_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return shrunk;
}
