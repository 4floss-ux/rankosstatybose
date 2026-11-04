import { useEffect, useState } from "react";
export function useBoostClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => { if (document.visibilityState !== "hidden") setNow(Date.now()); };
    const timer = setInterval(tick, 60000);document.addEventListener("visibilitychange",tick);
    return () => { clearInterval(timer);document.removeEventListener("visibilitychange",tick); };
  }, []);
  return now;
}
