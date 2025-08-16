import request from "supertest";
import { StreamChatServer } from "../StreamChatServer";

describe("StreamChatServer API", () => {
  let server: StreamChatServer;
  let app: any;

  beforeEach(async () => {
    server = new StreamChatServer(0); // Use port 0 to let the system assign an available port
    app = server.getApp();
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe("Health Check", () => {
    test("GET /health should return server status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
    });
  });

  describe("Rooms API", () => {
    test("GET /api/rooms should return all rooms", async () => {
      const response = await request(app).get("/api/rooms").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Should include the default "general" room
      const generalRoom = response.body.find(
        (room: any) => room.id === "general",
      );
      expect(generalRoom).toBeDefined();
    });

    test("POST /api/rooms should create a new room", async () => {
      const newRoom = {
        id: "test-room",
        name: "Test Room",
      };

      const response = await request(app)
        .post("/api/rooms")
        .send(newRoom)
        .expect(201);

      expect(response.body).toHaveProperty("id", "test-room");
      expect(response.body).toHaveProperty("name", "Test Room");
      expect(response.body).toHaveProperty("userCount", 0);
      expect(response.body).toHaveProperty("createdAt");
    });

    test("POST /api/rooms should return 400 for missing fields", async () => {
      const response = await request(app)
        .post("/api/rooms")
        .send({ id: "test-room" }) // Missing name
        .expect(400);

      expect(response.body).toHaveProperty(
        "error",
        "Room ID and name are required",
      );
    });

    test("POST /api/rooms should return 409 for duplicate room", async () => {
      const newRoom = {
        id: "general", // This room already exists
        name: "General Room",
      };

      const response = await request(app)
        .post("/api/rooms")
        .send(newRoom)
        .expect(409);

      expect(response.body).toHaveProperty("error", "Room already exists");
    });

    test("GET /api/rooms/:roomId should return room details", async () => {
      const response = await request(app).get("/api/rooms/general").expect(200);

      expect(response.body).toHaveProperty("id", "general");
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("users");
      expect(response.body).toHaveProperty("messageCount");
      expect(response.body).toHaveProperty("createdAt");
    });

    test("GET /api/rooms/:roomId should return 404 for non-existent room", async () => {
      const response = await request(app)
        .get("/api/rooms/non-existent")
        .expect(404);

      expect(response.body).toHaveProperty("error", "Room not found");
    });

    test("GET /api/rooms/:roomId/messages should return room messages", async () => {
      const response = await request(app)
        .get("/api/rooms/general/messages")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test("GET /api/rooms/:roomId/messages with limit should return limited messages", async () => {
      const response = await request(app)
        .get("/api/rooms/general/messages?limit=5")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe("404 Handler", () => {
    test("should return 404 for unknown endpoints", async () => {
      const response = await request(app).get("/unknown-endpoint").expect(404);

      expect(response.body).toHaveProperty("error", "Endpoint not found");
    });
  });
});
