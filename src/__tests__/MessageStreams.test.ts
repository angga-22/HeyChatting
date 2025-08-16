import {
  MessageTransform,
  MessageHistoryStream,
  UserActivityTransform,
} from "../streams/MessageStreams";
import { Message, MessageType, User } from "../types/index";
import { Readable } from "stream";

describe("MessageStreams", () => {
  describe("MessageTransform", () => {
    let messageTransform: MessageTransform;

    beforeEach(() => {
      messageTransform = new MessageTransform();
    });

    test("should sanitize message content", (done) => {
      const inputMessage: Message = {
        id: "1",
        userId: "user1",
        username: "testuser",
        content: "<script>alert('xss')</script>Hello <b>world</b>",
        timestamp: new Date(),
        type: MessageType.TEXT,
      };

      messageTransform.on("data", (processedMessage: Message) => {
        expect(processedMessage.content).toBe(
          "&lt;script&gt;alert('xss')&lt;/script&gt;Hello &lt;b&gt;world&lt;/b&gt;",
        );
        expect(processedMessage.id).toBe(inputMessage.id);
        expect(processedMessage.userId).toBe(inputMessage.userId);
        done();
      });

      messageTransform.write(inputMessage);
    });

    test("should trim whitespace from message content", (done) => {
      const inputMessage: Message = {
        id: "1",
        userId: "user1",
        username: "testuser",
        content: "  Hello world  ",
        timestamp: new Date(),
        type: MessageType.TEXT,
      };

      messageTransform.on("data", (processedMessage: Message) => {
        expect(processedMessage.content).toBe("Hello world");
        done();
      });

      messageTransform.write(inputMessage);
    });

    test("should handle empty message content", (done) => {
      const inputMessage: Message = {
        id: "1",
        userId: "user1",
        username: "testuser",
        content: "   ",
        timestamp: new Date(),
        type: MessageType.TEXT,
      };

      messageTransform.on("data", (processedMessage: Message) => {
        expect(processedMessage.content).toBe("");
        done();
      });

      messageTransform.write(inputMessage);
    });
  });

  describe("MessageHistoryStream", () => {
    test("should stream all messages in order", (done) => {
      const messages: Message[] = [
        {
          id: "1",
          userId: "user1",
          username: "user1",
          content: "Message 1",
          timestamp: new Date(),
          type: MessageType.TEXT,
        },
        {
          id: "2",
          userId: "user2",
          username: "user2",
          content: "Message 2",
          timestamp: new Date(),
          type: MessageType.TEXT,
        },
      ];

      const historyStream = new MessageHistoryStream(messages);
      const receivedMessages: Message[] = [];

      historyStream.on("data", (message: Message) => {
        receivedMessages.push(message);
      });

      historyStream.on("end", () => {
        expect(receivedMessages).toHaveLength(2);
        expect(receivedMessages[0].content).toBe("Message 1");
        expect(receivedMessages[1].content).toBe("Message 2");
        done();
      });
    });

    test("should handle empty message array", (done) => {
      const historyStream = new MessageHistoryStream([]);
      const receivedMessages: Message[] = [];

      historyStream.on("data", (message: Message) => {
        receivedMessages.push(message);
      });

      historyStream.on("end", () => {
        expect(receivedMessages).toHaveLength(0);
        done();
      });
    });
  });

  describe("UserActivityTransform", () => {
    let activityTransform: UserActivityTransform;

    beforeEach(() => {
      activityTransform = new UserActivityTransform();
    });

    test("should track user activity", (done) => {
      const user: User = {
        id: "user1",
        username: "testuser",
        joinedAt: new Date(),
      };

      const activityData = { user, action: "message_sent" };

      activityTransform.on("data", (data: any) => {
        expect(data.user).toEqual(user);
        expect(data.action).toBe("message_sent");
        expect(data.lastActivity).toBeInstanceOf(Date);
        expect(data.activeUsers).toBe(1);
        done();
      });

      activityTransform.write(activityData);
    });

    test("should track multiple users", (done) => {
      const user1: User = {
        id: "user1",
        username: "user1",
        joinedAt: new Date(),
      };
      const user2: User = {
        id: "user2",
        username: "user2",
        joinedAt: new Date(),
      };

      let callCount = 0;

      activityTransform.on("data", (data: any) => {
        callCount++;
        if (callCount === 1) {
          expect(data.activeUsers).toBe(1);
        } else if (callCount === 2) {
          expect(data.activeUsers).toBe(2);
          done();
        }
      });

      activityTransform.write({ user: user1, action: "joined" });
      activityTransform.write({ user: user2, action: "joined" });
    });

    test("should return correct active user count", () => {
      const user: User = {
        id: "user1",
        username: "testuser",
        joinedAt: new Date(),
      };

      activityTransform.write({ user, action: "message_sent" });

      expect(activityTransform.getActiveUsers()).toBe(1);
    });
  });
});
