import mongoose from "mongoose";
import config from "./env.js";

const connectDB = async () => {
  const conn = await mongoose.connect(config.mongoUri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

export default connectDB;
