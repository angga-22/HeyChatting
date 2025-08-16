import { Server as SocketIOServer, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { ChatManager } from "../core/ChatManager.js";
import {
  User,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../types/index.js";

export class SocketHandler {
  private chatManager: ChatManager;
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;

  constructor(
    io: SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
    chatManager: ChatManager,
  ) {
    this.io = io;
    this.chatManager = chatManager;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle joining a room
      socket.on("joinRoom", (roomId: string, username: string) => {
        this.handleJoinRoom(socket, roomId, username);
      });

      // Handle leaving a room
      socket.on("leaveRoom", (roomId: string) => {
        this.handleLeaveRoom(socket, roomId);
      });

      // Handle sending a message
      socket.on("sendMessage", (roomId: string, content: string) => {
        this.handleSendMessage(socket, roomId, content);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinRoom(
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
    roomId: string,
    username: string,
  ): void {
    try {
      // Create user
      const user: User = {
        id: uuidv4(),
        username: username.trim(),
        joinedAt: new Date(),
      };

      // Store user data in socket
      socket.data.userId = user.id;
      socket.data.username = user.username;
      socket.data.roomId = roomId;

      // Join the socket room
      socket.join(roomId);

      // Add user to chat room
      const success = this.chatManager.addUserToRoom(roomId, user);

      if (success) {
        // Send room users to the new user
        const roomUsers = this.chatManager.getRoomUsers(roomId);
        socket.emit("roomUsers", roomUsers);

        // Send recent messages to the new user
        const recentMessages = this.chatManager.getRoomMessages(roomId, 50);
        recentMessages.forEach((message) => {
          socket.emit("message", message);
        });

        // Notify other users
        socket.to(roomId).emit("userJoined", user);

        console.log(`User ${username} joined room ${roomId}`);
      } else {
        socket.emit("error", "Failed to join room");
      }
    } catch (error) {
      console.error("Error handling join room:", error);
      socket.emit("error", "Internal server error");
    }
  }

  private handleLeaveRoom(
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
    roomId: string,
  ): void {
    try {
      const { userId, username } = socket.data;

      if (userId) {
        socket.leave(roomId);
        this.chatManager.removeUserFromRoom(roomId, userId);

        // Notify other users
        socket
          .to(roomId)
          .emit("userLeft", { id: userId, username, joinedAt: new Date() });

        // Clear socket data
        socket.data.roomId = undefined;

        console.log(`User ${username} left room ${roomId}`);
      }
    } catch (error) {
      console.error("Error handling leave room:", error);
      socket.emit("error", "Internal server error");
    }
  }

  private handleSendMessage(
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
    roomId: string,
    content: string,
  ): void {
    try {
      const { userId } = socket.data;

      if (!userId) {
        socket.emit("error", "User not authenticated");
        return;
      }

      if (!content.trim()) {
        socket.emit("error", "Message cannot be empty");
        return;
      }

      // Add message to room
      const message = this.chatManager.addMessage(
        roomId,
        userId,
        content.trim(),
      );

      if (message) {
        // Broadcast message to all users in the room
        this.io.to(roomId).emit("message", message);
        console.log(`Message sent in room ${roomId}: ${content}`);
      } else {
        socket.emit("error", "Failed to send message");
      }
    } catch (error) {
      console.error("Error handling send message:", error);
      socket.emit("error", "Internal server error");
    }
  }

  private handleDisconnect(
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
  ): void {
    try {
      const { userId, username, roomId } = socket.data;

      if (userId && roomId) {
        this.chatManager.removeUserFromRoom(roomId, userId);

        // Notify other users
        socket
          .to(roomId)
          .emit("userLeft", { id: userId, username, joinedAt: new Date() });

        console.log(`User ${username} disconnected from room ${roomId}`);
      }

      console.log(`Client disconnected: ${socket.id}`);
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  }
}
