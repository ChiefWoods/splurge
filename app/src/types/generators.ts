export type ExtractDefinedKeys<T> = T extends any
  ? keyof {
      [K in keyof T as T[K] extends Record<string, never> ? K : never]: T[K];
    }
  : never;
