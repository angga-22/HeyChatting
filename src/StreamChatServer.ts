import express, { Express, Request, Response } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { ChatManager } from "./core/ChatManager.js";
import { SocketHandler } from "./socket/SocketHandler.js";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "./types/index.js";

export class StreamChatServer {
  private app: Express;
  private server: any;
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  private chatManager: ChatManager;
  private socketHandler: SocketHandler;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.chatManager = new ChatManager();

    // Initialize Socket.IO
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.socketHandler = new SocketHandler(this.io, this.chatManager);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static("public"));
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (req: Request, res: Response) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Get all rooms
    this.app.get("/api/rooms", (req: Request, res: Response) => {
      const rooms = this.chatManager.getAllRooms().map((room) => ({
        id: room.id,
        name: room.name,
        userCount: room.users.size,
        createdAt: room.createdAt,
      }));
      res.json(rooms);
    });

    // Get room details
    this.app.get("/api/rooms/:roomId", (req: Request, res: Response) => {
      const { roomId } = req.params;
      const room = this.chatManager.getRoom(roomId);

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      return res.json({
        id: room.id,
        name: room.name,
        users: this.chatManager.getRoomUsers(roomId),
        messageCount: room.messages.length,
        createdAt: room.createdAt,
      });
    });

    // Get room messages
    this.app.get(
      "/api/rooms/:roomId/messages",
      (req: Request, res: Response) => {
        const { roomId } = req.params;
        const limit = req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined;

        const messages = this.chatManager.getRoomMessages(roomId, limit);
        res.json(messages);
      },
    );

    // Create a new room
    this.app.post("/api/rooms", (req: Request, res: Response) => {
      const { id, name } = req.body;

      if (!id || !name) {
        return res.status(400).json({ error: "Room ID and name are required" });
      }

      // Check if room already exists
      if (this.chatManager.getRoom(id)) {
        return res.status(409).json({ error: "Room already exists" });
      }

      const room = this.chatManager.createRoom(id, name);
      return res.status(201).json({
        id: room.id,
        name: room.name,
        userCount: 0,
        createdAt: room.createdAt,
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: "Endpoint not found" });
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`🚀 HeyChatting server running on port ${this.port}`);
        console.log(`📡 Socket.IO server ready for connections`);
        console.log(`🌐 HTTP API available at http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log("📴 HeyChatting server stopped");
        resolve();
      });
    });
  }

  public getChatManager(): ChatManager {
    return this.chatManager;
  }

  public getApp(): Express {
    return this.app;
  }
}
