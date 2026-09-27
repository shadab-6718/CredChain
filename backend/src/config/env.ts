import dotenv from "dotenv";
import path from "path";

// Load .env from root or local
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

  // Pinata IPFS
  PINATA_API_KEY: process.env.PINATA_API_KEY || "",
  PINATA_SECRET_API_KEY: process.env.PINATA_SECRET_API_KEY || "",
  PINATA_JWT: process.env.PINATA_JWT || "",
  PINATA_GATEWAY_URL: process.env.PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/",

  // Blockchain (Polygon Amoy)
  POLYGON_AMOY_RPC_URL: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
  DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY || "",
  CREDCHAIN_CONTRACT_ADDRESS: process.env.CREDCHAIN_CONTRACT_ADDRESS || "",
  CHAIN_ID: 80002,
};
