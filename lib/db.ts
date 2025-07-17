import mongoose from "mongoose";

// Track connection state
let isConnected = false;

export default async function connect(): Promise<void> {
  // Check if we have a valid MONGODB_URI
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not defined in environment variables. Please add it to your .env.local file."
    );
  }

  // If already connected, return early
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("MongoDB: Using existing connection");
    return;
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    isConnected = true;
    console.log("MongoDB: Connected successfully");

    // Handle connection events
    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB: Disconnected");
      isConnected = false;
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    isConnected = false;
    throw error;
  }
}
