import { useState } from "react";

const tryParse = <T>(val: string | null | undefined, defaultValue?: T) => {
  if (!val) return defaultValue;
  try {
    return JSON.parse(val) as T;
  } catch (e) {
    return defaultValue;
  }
};

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (newValue: T) => void] {
  const lookupKey = `referydo:${key}`;

  const [value, setValue] = useState(
    tryParse<T>(localStorage.getItem(lookupKey), defaultValue)
  );

  const set = (newValue: T | undefined) => {
    if (newValue === undefined) {
      localStorage.removeItem(lookupKey);
      setValue(defaultValue);
    } else {
      localStorage.setItem(lookupKey, JSON.stringify(newValue));
      setValue(newValue);
    }
  };

  return [value, set];
}
