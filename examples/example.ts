import { StreamChatServer } from "../src/StreamChatServer.js";

async function basicExample() {
  console.log("🚀 Starting HeyChatting Basic Example");

  // Create and start the server
  const server = new StreamChatServer(3005);

  try {
    await server.start();
    console.log("✅ Server started successfully!");

    // Get the chat manager to interact with the system
    const chatManager = server.getChatManager();

    // Create some example rooms
    console.log("\n📁 Creating example rooms...");
    chatManager.createRoom("tech-talk", "Tech Discussion");
    chatManager.createRoom("random", "Random Chat");

    console.log("✅ Created example rooms");

    // Get all rooms
    const rooms = chatManager.getAllRooms();
    console.log(`\n🏠 Available rooms (${rooms.length}):`);
    rooms.forEach((room) => {
      console.log(`  - ${room.name} (ID: ${room.id})`);
    });

    // Subscribe to events for the general room
    console.log("\n👂 Setting up event listeners...");

    const messageStream = chatManager.getMessageStream("general");
    messageStream.subscribe((message) => {
      console.log(
        `\n💬 New message in general: ${message.username}: ${message.content}`,
      );
    });

    const roomEventStream = chatManager.getRoomEventStream("general");
    roomEventStream.subscribe((event) => {
      console.log(`\n📡 Room event: ${event.type}`, event.payload);
    });

    console.log("✅ Event listeners set up");

    // Create some example users and messages
    console.log("\n👥 Simulating user activity...");

    const user1 = {
      id: "user-1",
      username: "Alice",
      joinedAt: new Date(),
    };

    const user2 = {
      id: "user-2",
      username: "Bob",
      joinedAt: new Date(),
    };

    // Add users to general room
    chatManager.addUserToRoom("general", user1);
    chatManager.addUserToRoom("general", user2);

    // Send some messages
    setTimeout(() => {
      chatManager.addMessage("general", user1.id, "Hello everyone! 👋");
    }, 1000);

    setTimeout(() => {
      chatManager.addMessage("general", user2.id, "Hey Alice! How's it going?");
    }, 2000);

    setTimeout(() => {
      chatManager.addMessage(
        "general",
        user1.id,
        "Great! Just testing out this chat system.",
      );
    }, 3000);

    setTimeout(() => {
      chatManager.addMessage("general", user2.id, "It looks really cool! 🚀");
    }, 4000);

    // Show room statistics after messages
    setTimeout(() => {
      console.log("\n📊 Room Statistics:");
      const generalRoom = chatManager.getRoom("general");
      if (generalRoom) {
        console.log(`  - Users in general: ${generalRoom.users.size}`);
        console.log(`  - Messages in general: ${generalRoom.messages.length}`);

        console.log("\n📝 Recent messages:");
        const recentMessages = chatManager.getRoomMessages("general", 5);
        recentMessages.forEach((msg) => {
          const time = msg.timestamp.toLocaleTimeString();
          console.log(`  [${time}] ${msg.username}: ${msg.content}`);
        });
      }

      // Remove a user to demonstrate leave functionality
      setTimeout(() => {
        console.log("\n👋 Bob is leaving the room...");
        chatManager.removeUserFromRoom("general", user2.id);

        setTimeout(() => {
          console.log("\n📊 Updated Room Statistics:");
          const room = chatManager.getRoom("general");
          if (room) {
            console.log(`  - Users in general: ${room.users.size}`);
            console.log(`  - Messages in general: ${room.messages.length}`);
          }
        }, 1000);
      }, 1000);
    }, 5000);

    console.log("\n🌐 Server is running!");
    console.log("You can now:");
    console.log("  • Visit http://localhost:3002/health for health check");
    console.log("  • GET http://localhost:3002/api/rooms to see all rooms");
    console.log("  • Connect with Socket.IO client to ws://localhost:3002");
    console.log("\nPress Ctrl+C to stop the server");
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down gracefully...");
  process.exit(0);
});

// Run the example
basicExample().catch((error) => {
  console.error("❌ Example failed:", error);
  process.exit(1);
});
