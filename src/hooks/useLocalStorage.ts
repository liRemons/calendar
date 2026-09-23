import { useEffect, useState } from 'react';

/** localStorage 持久化的 state */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 忽略写入异常（如隐私模式配额问题）
    }
  }, [key, value]);

  return [value, setValue] as const;
}
