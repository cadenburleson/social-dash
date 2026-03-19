import { useEffect, useRef } from "react";
import { DEFAULT_REFRESH_INTERVAL } from "@/lib/constants";

export function useRefreshInterval(
  callback: () => void,
  interval: number = DEFAULT_REFRESH_INTERVAL,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => savedCallback.current(), interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
}
