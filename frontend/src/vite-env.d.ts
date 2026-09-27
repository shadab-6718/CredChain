/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_POLYGON_AMOY_RPC_URL: string;
  readonly VITE_CREDCHAIN_CONTRACT_ADDRESS: string;
  readonly VITE_PINATA_GATEWAY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
