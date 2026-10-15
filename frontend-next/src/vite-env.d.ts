/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the Java API, e.g. https://icerealm.onrender.com. Unset means same-origin /api. */
  readonly VITE_API_BASE?: string;
}
