import { Readable, Transform } from "stream";
import { Message, User } from "../types/index.js";

/**
 * Stream transformer for processing chat messages
 */
export class MessageTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  override _transform(
    message: Message,
    encoding: BufferEncoding,
    callback: Function,
  ): void {
    try {
      // Process the message (e.g., sanitize content, add metadata)
      const processedMessage = this.processMessage(message);
      this.push(processedMessage);
      callback();
    } catch (error) {
      callback(error);
    }
  }

  private processMessage(message: Message): Message {
    // Sanitize content (basic XSS prevention)
    const sanitizedContent = message.content
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .trim();

    return {
      ...message,
      content: sanitizedContent,
    };
  }
}

/**
 * Readable stream for message history
 */
export class MessageHistoryStream extends Readable {
  private messages: Message[];
  private currentIndex = 0;

  constructor(messages: Message[]) {
    super({ objectMode: true });
    this.messages = messages;
  }

  override _read(): void {
    if (this.currentIndex < this.messages.length) {
      this.push(this.messages[this.currentIndex]);
      this.currentIndex++;
    } else {
      this.push(null); // End of stream
    }
  }
}

/**
 * Transform stream for user activity tracking
 */
export class UserActivityTransform extends Transform {
  private userActivity = new Map<string, Date>();

  constructor() {
    super({ objectMode: true });
  }

  override _transform(
    data: { user: User; action: string },
    encoding: BufferEncoding,
    callback: Function,
  ): void {
    try {
      this.userActivity.set(data.user.id, new Date());

      const activityData = {
        ...data,
        lastActivity: this.userActivity.get(data.user.id),
        activeUsers: this.userActivity.size,
      };

      this.push(activityData);
      callback();
    } catch (error) {
      callback(error);
    }
  }

  getActiveUsers(): number {
    // Clean up old activity (users inactive for more than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    for (const [userId, lastActivity] of this.userActivity.entries()) {
      if (lastActivity < fiveMinutesAgo) {
        this.userActivity.delete(userId);
      }
    }

    return this.userActivity.size;
  }
}
