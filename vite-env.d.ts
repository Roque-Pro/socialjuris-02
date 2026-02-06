/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_FACEBOOK_APP_ID: string;
  readonly VITE_AUTH_CALLBACK_URL: string;
  readonly VITE_STRIPE_PUBLIC_KEY: string;
  readonly VITE_STRIPE_PRICE_JURIS_10: string;
  readonly VITE_STRIPE_PRICE_JURIS_20: string;
  readonly VITE_STRIPE_PRICE_JURIS_50: string;
  readonly VITE_STRIPE_PRICE_PRO_MONTHLY: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
