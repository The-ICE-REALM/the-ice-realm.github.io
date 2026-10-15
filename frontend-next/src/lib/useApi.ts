import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";

const asApiError = (error: unknown) =>
  error instanceof ApiError ? error : new ApiError("SERVER_ERROR", "Something went wrong. Try again in a minute.");

/**
 * Loads data from the API whenever `key` changes. While a new key loads, `data` is undefined;
 * `reload()` fetches the same key again and keeps showing the old data until the new data arrives.
 * Pass key null to skip loading.
 */
export function useApi<T>(load: () => Promise<T>, key: string | null) {
  const [state, setState] = useState<{ key: string | null; data?: T; error?: ApiError }>({ key: null });
  const [nonce, setNonce] = useState(0);
  // The caller passes a new function every render; the effect only needs the latest one.
  const loadRef = useRef(load);
  useLayoutEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    if (key === null) return;
    let live = true;
    loadRef.current().then(
      (data) => live && setState({ key, data }),
      (error: unknown) => live && setState({ key, error: asApiError(error) })
    );
    return () => {
      live = false;
    };
  }, [key, nonce]);

  const current = key !== null && state.key === key;
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: key !== null && (!current || (state.data === undefined && state.error === undefined)),
    reload: useCallback(() => setNonce((n) => n + 1), []),
  };
}
