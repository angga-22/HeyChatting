// Core types for the chat application
export interface User {
  id: string;
  username: string;
  joinedAt: Date;
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: MessageType;
}

export enum MessageType {
  TEXT = "text",
  SYSTEM = "system",
  USER_JOINED = "user_joined",
  USER_LEFT = "user_left",
}

export interface Room {
  id: string;
  name: string;
  users: Map<string, User>;
  messages: Message[];
  createdAt: Date;
}

export interface ChatEvent {
  type: ChatEventType;
  payload: any;
  timestamp: Date;
}

export enum ChatEventType {
  USER_CONNECTED = "user_connected",
  USER_DISCONNECTED = "user_disconnected",
  MESSAGE_SENT = "message_sent",
  ROOM_JOINED = "room_joined",
  ROOM_LEFT = "room_left",
}

export interface ServerToClientEvents {
  message: (message: Message) => void;
  userJoined: (user: User) => void;
  userLeft: (user: User) => void;
  roomUsers: (users: User[]) => void;
  error: (error: string) => void;
}

export interface ClientToServerEvents {
  joinRoom: (roomId: string, username: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, content: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
  roomId?: string;
}
