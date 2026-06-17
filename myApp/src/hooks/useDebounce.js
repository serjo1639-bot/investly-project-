/**
 * useDebounce — returns a debounced copy of a value that only updates after
 * `delay` ms of no changes. Used for search inputs to avoid spamming the API.
 */
import { useEffect, useState } from 'react';

export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
