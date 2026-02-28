import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.mongo_uri);
    console.log("db connected");
  } catch (err) {
    console.error("DB connection error", err);
  }
};

export default connectDB;
