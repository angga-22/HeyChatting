#  HeyChatting: Real-Time Chat Application

HeyChatting is a high-performance, real-time chat application built with **Node.js**, **TypeScript**, **RxJS**, **WebSockets (Socket.IO)**, and **Node.js Streams**. This project showcases a modern, scalable architecture for building real-time communication applications.

## Example
<img width="1135" height="887" alt="Screenshot 2025-08-16 at 15 58 54" src="https://github.com/user-attachments/assets/7b26da7b-7b58-4b60-870c-1f03d3a52885" />

## ✨ Features

- **Real-Time Communication**: Instant messaging between multiple clients using Socket.IO
- **Efficient Data Handling**: Utilizes Node.js streams to process messages efficiently, minimizing memory usage
- **Reactive Programming**: Built with RxJS for powerful event stream management
- **Scalable Architecture**: Modern TypeScript-based architecture that's easy to scale and maintain
- **RESTful API**: HTTP endpoints for room and message management
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Unit Testing**: Comprehensive test suite with Jest
- **Professional Documentation**: Well-documented codebase with examples

## 🏗️ Architecture

### Core Components

1. **ChatManager**: Manages rooms, users, and messages with RxJS observables
2. **StreamChatServer**: Express.js server with Socket.IO integration
3. **SocketHandler**: Handles WebSocket connections and events
4. **MessageStreams**: Node.js streams for efficient message processing
5. **Type System**: Comprehensive TypeScript interfaces and types

### Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript with ES modules
- **Real-time**: Socket.IO for WebSocket communication
- **Reactive**: RxJS for event stream management
- **Streams**: Node.js built-in streams for data processing
- **HTTP Framework**: Express.js
- **Testing**: Jest with TypeScript support
- **Build**: tsup for fast TypeScript compilation

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone 
cd hey-chatting

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start the example
npm run example:basic
```

### Development

```bash
# Watch mode (rebuilds on changes)
npm run dev

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

## 📖 Usage Examples

### Basic Server Setup

```typescript
import { StreamChatServer } from "stream-chat";

const server = new StreamChatServer(3002);

server.start().then(() => {
  console.log("🚀 HeyChatting server is running!");
});
```

### Using the ChatManager

```typescript
import { ChatManager } from "stream-chat";

const chatManager = new ChatManager();

// Create a room
const room = chatManager.createRoom("my-room", "My Chat Room");

// Add a user
const user = {
  id: "user-1",
  username: "Alice",
  joinedAt: new Date(),
};
chatManager.addUserToRoom("my-room", user);

// Send a message
const message = chatManager.addMessage("my-room", "user-1", "Hello, world!");

// Subscribe to message stream
chatManager.getMessageStream("my-room").subscribe((message) => {
  console.log(`New message: ${message.username}: ${message.content}`);
});
```

### Client-Side Socket.IO Connection

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3002");

// Join a room
socket.emit("joinRoom", "general", "Alice");

// Send a message
socket.emit("sendMessage", "general", "Hello everyone!");

// Listen for messages
socket.on("message", (message) => {
  console.log(`${message.username}: ${message.content}`);
});

// Listen for user events
socket.on("userJoined", (user) => {
  console.log(`${user.username} joined the room`);
});
```

## 🔌 API Endpoints

### HTTP REST API

- `GET /health` - Health check endpoint
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/:roomId` - Get room details
- `GET /api/rooms/:roomId/messages` - Get room messages
- `POST /api/rooms` - Create a new room

### WebSocket Events

#### Client to Server

- `joinRoom(roomId, username)` - Join a chat room
- `leaveRoom(roomId)` - Leave a chat room
- `sendMessage(roomId, content)` - Send a message

#### Server to Client

- `message(message)` - Receive a new message
- `userJoined(user)` - User joined notification
- `userLeft(user)` - User left notification
- `roomUsers(users)` - Current room users
- `error(error)` - Error notification

## Testing

The project includes comprehensive unit tests covering:

- **ChatManager**: Room and message management
- **MessageStreams**: Stream processing functionality
- **StreamChatServer**: HTTP API endpoints
- **Real-time Features**: Socket.IO event handling

```bash
# Run all tests
npm test

# Run tests with coverage
npm test:coverage

# Run tests in watch mode
npm test:watch
```

## 📁 Project Structure

```
src/
├── core/
│   └── ChatManager.ts          # Core chat management logic
├── socket/
│   └── SocketHandler.ts        # Socket.IO event handling
├── streams/
│   └── MessageStreams.ts       # Node.js streams for message processing
├── types/
│   └── index.ts               # TypeScript type definitions
├── __tests__/                 # Unit tests
│   ├── ChatManager.test.ts
│   ├── MessageStreams.test.ts
│   └── StreamChatServer.test.ts
├── StreamChatServer.ts        # Main server class
└── index.ts                   # Entry point

examples/
└── example.ts                 # Basic usage example

public/
└── index.html                # Web client demo
```

## Demo

Run the example to see HeyChatting in action:

```bash
npm run example:basic
```

Then open your browser to `http://localhost:3002` to try the web client.

### Example Output

```
 Starting HeyChatting Basic Example
 HeyChatting server running on port 3002
 Socket.IO server ready for connections
 HTTP API available at http://localhost:3002
✅ Server started successfully!

 Creating example rooms...
 Created example rooms

🏠 Available rooms (3):
  - General Chat (ID: general)
  - Tech Discussion (ID: tech-talk)
  - Random Chat (ID: random)

💬 New message in general: Alice: Hello everyone! 👋
💬 New message in general: Bob: Hey Alice! How's it going?
```

## 🔧 Configuration

### Environment Variables

- `PORT`: Server port (default: 3002)
- `NODE_ENV`: Environment mode (development/production)

### TypeScript Configuration

The project uses modern TypeScript features:

- ES2022 target
- ESNext modules
- Strict type checking
- Declaration files generation

## 🚀 Deployment

### Production Build

```bash
npm run build
node dist/index.js
```

### Docker (Optional) (COMING SOON!)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3002
CMD ["node", "dist/index.js"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run the test suite
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Socket.IO** - Real-time WebSocket communication
- **RxJS** - Reactive programming with observables
- **Express.js** - HTTP server framework
- **TypeScript** - Type-safe JavaScript development

---

**HeyChatting** - Built with ❤️ for real-time communication
