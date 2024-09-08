/// <reference types="vite/client" />

interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  interface ImportMetaEnv {
    readonly VITE_WEB3AUTH_CLIENT_ID: string;
    // Add other environment variables as needed
  }