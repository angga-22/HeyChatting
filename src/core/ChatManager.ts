import { BehaviorSubject, Observable, Subject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";
import {
  User,
  Message,
  Room,
  ChatEvent,
  ChatEventType,
  MessageType,
} from "../types/index.js";

export class ChatManager {
  private rooms = new Map<string, Room>();
  private eventStream = new Subject<ChatEvent>();
  private roomSubjects = new Map<string, BehaviorSubject<Room>>();

  constructor() {
    // Create a default room
    this.createRoom("general", "General Chat");
  }

  /**
   * Creates a new chat room
   */
  createRoom(id: string, name: string): Room {
    const room: Room = {
      id,
      name,
      users: new Map(),
      messages: [],
      createdAt: new Date(),
    };

    this.rooms.set(id, room);
    this.roomSubjects.set(id, new BehaviorSubject(room));

    return room;
  }

  /**
   * Gets a room by ID
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Gets all rooms
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Adds a user to a room
   */
  addUserToRoom(roomId: string, user: User): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    room.users.set(user.id, user);

    // Add system message for user joining
    const joinMessage: Message = {
      id: uuidv4(),
      userId: "system",
      username: "System",
      content: `${user.username} joined the room`,
      timestamp: new Date(),
      type: MessageType.USER_JOINED,
    };

    room.messages.push(joinMessage);
    this.updateRoom(room);

    this.emitEvent({
      type: ChatEventType.ROOM_JOINED,
      payload: { roomId, user },
      timestamp: new Date(),
    });

    return true;
  }

  /**
   * Removes a user from a room
   */
  removeUserFromRoom(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    const user = room.users.get(userId);
    if (!user) {
      return false;
    }

    room.users.delete(userId);

    // Add system message for user leaving
    const leaveMessage: Message = {
      id: uuidv4(),
      userId: "system",
      username: "System",
      content: `${user.username} left the room`,
      timestamp: new Date(),
      type: MessageType.USER_LEFT,
    };

    room.messages.push(leaveMessage);
    this.updateRoom(room);

    this.emitEvent({
      type: ChatEventType.ROOM_LEFT,
      payload: { roomId, user },
      timestamp: new Date(),
    });

    return true;
  }

  /**
   * Adds a message to a room
   */
  addMessage(roomId: string, userId: string, content: string): Message | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    const user = room.users.get(userId);
    if (!user) {
      return null;
    }

    const message: Message = {
      id: uuidv4(),
      userId,
      username: user.username,
      content,
      timestamp: new Date(),
      type: MessageType.TEXT,
    };

    room.messages.push(message);
    this.updateRoom(room);

    this.emitEvent({
      type: ChatEventType.MESSAGE_SENT,
      payload: { roomId, message },
      timestamp: new Date(),
    });

    return message;
  }

  /**
   * Gets messages from a room
   */
  getRoomMessages(roomId: string, limit?: number): Message[] {
    const room = this.rooms.get(roomId);
    if (!room) {
      return [];
    }

    const messages = room.messages;
    return limit ? messages.slice(-limit) : messages;
  }

  /**
   * Gets users in a room
   */
  getRoomUsers(roomId: string): User[] {
    const room = this.rooms.get(roomId);
    if (!room) {
      return [];
    }

    return Array.from(room.users.values());
  }

  /**
   * Gets an observable stream of room updates
   */
  getRoomStream(roomId: string): Observable<Room> {
    const subject = this.roomSubjects.get(roomId);
    if (!subject) {
      throw new Error(`Room ${roomId} not found`);
    }
    return subject.asObservable();
  }

  /**
   * Gets an observable stream of chat events
   */
  getEventStream(): Observable<ChatEvent> {
    return this.eventStream.asObservable();
  }

  /**
   * Gets filtered event stream for a specific room
   */
  getRoomEventStream(roomId: string): Observable<ChatEvent> {
    return this.eventStream
      .asObservable()
      .pipe(filter((event) => event.payload.roomId === roomId));
  }

  /**
   * Gets message stream for a specific room
   */
  getMessageStream(roomId: string): Observable<Message> {
    return this.eventStream.asObservable().pipe(
      filter(
        (event) =>
          event.type === ChatEventType.MESSAGE_SENT &&
          event.payload.roomId === roomId,
      ),
      map((event) => event.payload.message),
    );
  }

  private updateRoom(room: Room): void {
    this.rooms.set(room.id, room);
    const subject = this.roomSubjects.get(room.id);
    if (subject) {
      subject.next(room);
    }
  }

  private emitEvent(event: ChatEvent): void {
    this.eventStream.next(event);
  }
}
