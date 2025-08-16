import { StreamChatServer } from "./StreamChatServer.js";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3005;
const server = new StreamChatServer(port);

server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await server.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await server.stop();
  process.exit(0);
});

export { StreamChatServer } from "./StreamChatServer.js";
export { ChatManager } from "./core/ChatManager.js";
export * from "./types/index.js";
