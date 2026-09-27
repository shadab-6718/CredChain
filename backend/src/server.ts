import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { ENV } from "./config/env";
import apiRoutes from "./routes/api";

const app = express();

// Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-demo-role", "x-demo-user-id"],
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    platform: "CredChain API",
    version: "1.0.0",
    network: "Polygon Amoy (80002)",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api", apiRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled API Error:", err);
  res.status(err.status || 500).json({
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred on the server.",
  });
});

// 404 Fallback
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "NotFound",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(ENV.PORT, () => {
    console.log("==========================================");
    console.log(`🚀 CredChain Backend API Server running on port ${ENV.PORT}`);
    console.log(`🌐 Health check: http://localhost:${ENV.PORT}/health`);
    console.log(`🔗 Polygon Amoy RPC: ${ENV.POLYGON_AMOY_RPC_URL}`);
    console.log("==========================================");
  });
}

export default app;
