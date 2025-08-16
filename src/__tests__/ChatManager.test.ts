import { ChatManager } from "../core/ChatManager";
import { User, MessageType } from "../types/index";

describe("ChatManager", () => {
  let chatManager: ChatManager;

  beforeEach(() => {
    chatManager = new ChatManager();
  });

  describe("Room Management", () => {
    test("should create a new room", () => {
      const room = chatManager.createRoom("test-room", "Test Room");

      expect(room.id).toBe("test-room");
      expect(room.name).toBe("Test Room");
      expect(room.users.size).toBe(0);
      expect(room.messages).toHaveLength(0);
      expect(room.createdAt).toBeInstanceOf(Date);
    });

    test("should get an existing room", () => {
      chatManager.createRoom("test-room", "Test Room");
      const room = chatManager.getRoom("test-room");

      expect(room).toBeDefined();
      expect(room?.id).toBe("test-room");
    });

    test("should return undefined for non-existent room", () => {
      const room = chatManager.getRoom("non-existent");

      expect(room).toBeUndefined();
    });

    test("should get all rooms", () => {
      chatManager.createRoom("room1", "Room 1");
      chatManager.createRoom("room2", "Room 2");

      const rooms = chatManager.getAllRooms();

      expect(rooms).toHaveLength(3); // Including default "general" room
      expect(rooms.map((r) => r.id)).toContain("room1");
      expect(rooms.map((r) => r.id)).toContain("room2");
      expect(rooms.map((r) => r.id)).toContain("general");
    });
  });

  describe("User Management", () => {
    const mockUser: User = {
      id: "user-1",
      username: "testuser",
      joinedAt: new Date(),
    };

    beforeEach(() => {
      chatManager.createRoom("test-room", "Test Room");
    });

    test("should add user to room", () => {
      const success = chatManager.addUserToRoom("test-room", mockUser);

      expect(success).toBe(true);

      const users = chatManager.getRoomUsers("test-room");
      expect(users).toHaveLength(1);
      expect(users[0]).toEqual(mockUser);
    });

    test("should not add user to non-existent room", () => {
      const success = chatManager.addUserToRoom("non-existent", mockUser);

      expect(success).toBe(false);
    });

    test("should remove user from room", () => {
      chatManager.addUserToRoom("test-room", mockUser);
      const success = chatManager.removeUserFromRoom("test-room", mockUser.id);

      expect(success).toBe(true);

      const users = chatManager.getRoomUsers("test-room");
      expect(users).toHaveLength(0);
    });

    test("should not remove user from non-existent room", () => {
      const success = chatManager.removeUserFromRoom(
        "non-existent",
        mockUser.id,
      );

      expect(success).toBe(false);
    });

    test("should not remove non-existent user from room", () => {
      const success = chatManager.removeUserFromRoom(
        "test-room",
        "non-existent-user",
      );

      expect(success).toBe(false);
    });

    test("should get users in room", () => {
      const user1: User = { id: "1", username: "user1", joinedAt: new Date() };
      const user2: User = { id: "2", username: "user2", joinedAt: new Date() };

      chatManager.addUserToRoom("test-room", user1);
      chatManager.addUserToRoom("test-room", user2);

      const users = chatManager.getRoomUsers("test-room");
      expect(users).toHaveLength(2);
      expect(users.map((u) => u.id)).toContain("1");
      expect(users.map((u) => u.id)).toContain("2");
    });

    test("should return empty array for non-existent room users", () => {
      const users = chatManager.getRoomUsers("non-existent");

      expect(users).toHaveLength(0);
    });
  });

  describe("Message Management", () => {
    const mockUser: User = {
      id: "user-1",
      username: "testuser",
      joinedAt: new Date(),
    };

    beforeEach(() => {
      chatManager.createRoom("test-room", "Test Room");
      chatManager.addUserToRoom("test-room", mockUser);
    });

    test("should add message to room", () => {
      const message = chatManager.addMessage(
        "test-room",
        mockUser.id,
        "Hello, world!",
      );

      expect(message).not.toBeNull();
      expect(message?.content).toBe("Hello, world!");
      expect(message?.userId).toBe(mockUser.id);
      expect(message?.username).toBe(mockUser.username);
      expect(message?.type).toBe(MessageType.TEXT);
      expect(message?.timestamp).toBeInstanceOf(Date);
      expect(message?.id).toBeDefined();
    });

    test("should not add message to non-existent room", () => {
      const message = chatManager.addMessage(
        "non-existent",
        mockUser.id,
        "Hello!",
      );

      expect(message).toBeNull();
    });

    test("should not add message from non-existent user", () => {
      const message = chatManager.addMessage(
        "test-room",
        "non-existent-user",
        "Hello!",
      );

      expect(message).toBeNull();
    });

    test("should get room messages", () => {
      chatManager.addMessage("test-room", mockUser.id, "Message 1");
      chatManager.addMessage("test-room", mockUser.id, "Message 2");

      const messages = chatManager.getRoomMessages("test-room");

      // Should include the join message plus our 2 messages
      expect(messages.length).toBeGreaterThanOrEqual(3);

      const textMessages = messages.filter((m) => m.type === MessageType.TEXT);
      expect(textMessages).toHaveLength(2);
      expect(textMessages[0].content).toBe("Message 1");
      expect(textMessages[1].content).toBe("Message 2");
    });

    test("should get limited room messages", () => {
      for (let i = 1; i <= 10; i++) {
        chatManager.addMessage("test-room", mockUser.id, `Message ${i}`);
      }

      const messages = chatManager.getRoomMessages("test-room", 5);

      expect(messages).toHaveLength(5);
    });

    test("should return empty array for non-existent room messages", () => {
      const messages = chatManager.getRoomMessages("non-existent");

      expect(messages).toHaveLength(0);
    });
  });

  describe("System Messages", () => {
    const mockUser: User = {
      id: "user-1",
      username: "testuser",
      joinedAt: new Date(),
    };

    beforeEach(() => {
      chatManager.createRoom("test-room", "Test Room");
    });

    test("should create join message when user joins", () => {
      chatManager.addUserToRoom("test-room", mockUser);

      const messages = chatManager.getRoomMessages("test-room");
      const joinMessage = messages.find(
        (m) => m.type === MessageType.USER_JOINED,
      );

      expect(joinMessage).toBeDefined();
      expect(joinMessage?.content).toBe("testuser joined the room");
      expect(joinMessage?.userId).toBe("system");
    });

    test("should create leave message when user leaves", () => {
      chatManager.addUserToRoom("test-room", mockUser);
      chatManager.removeUserFromRoom("test-room", mockUser.id);

      const messages = chatManager.getRoomMessages("test-room");
      const leaveMessage = messages.find(
        (m) => m.type === MessageType.USER_LEFT,
      );

      expect(leaveMessage).toBeDefined();
      expect(leaveMessage?.content).toBe("testuser left the room");
      expect(leaveMessage?.userId).toBe("system");
    });
  });

  describe("Observable Streams", () => {
    const mockUser: User = {
      id: "user-1",
      username: "testuser",
      joinedAt: new Date(),
    };

    beforeEach(() => {
      chatManager.createRoom("test-room", "Test Room");
    });

    test("should get room stream", () => {
      const roomStream = chatManager.getRoomStream("test-room");

      expect(roomStream).toBeDefined();
    });

    test("should throw error for non-existent room stream", () => {
      expect(() => {
        chatManager.getRoomStream("non-existent");
      }).toThrow("Room non-existent not found");
    });

    test("should get event stream", () => {
      const eventStream = chatManager.getEventStream();

      expect(eventStream).toBeDefined();
    });

    test("should get room event stream", () => {
      const roomEventStream = chatManager.getRoomEventStream("test-room");

      expect(roomEventStream).toBeDefined();
    });

    test("should get message stream", () => {
      const messageStream = chatManager.getMessageStream("test-room");

      expect(messageStream).toBeDefined();
    });
  });
});
