import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

// Dynamic imports based on environment
let setupVite: any = null;
let serveStatic: any = null;
let log: any = null;

if (process.env.NODE_ENV === "development") {
  try {
    const viteModule = await import("./vite.js");
    setupVite = viteModule.setupVite;
    serveStatic = viteModule.serveStatic;
    log = viteModule.log;
  } catch (error) {
    console.warn("Vite not available, falling back to production mode");
    const prodModule = await import("./production-utils.js");
    serveStatic = prodModule.serveStatic;
    log = prodModule.log;
  }
} else {
  const prodModule = await import("./production-utils.js");
  serveStatic = prodModule.serveStatic;
  log = prodModule.log;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development" && setupVite) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 3000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
  });
})();
