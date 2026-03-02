import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//basic config
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//cors config
app.use(
  cors({
    origin: process.env.cors_origin?.split(",") || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// import healthcheck and authcheck route
import healthCheckRouter from "./routes/healthcheck.route.js";
import authRouter from "./routes/auth.route.js";
import projectRouter from "./routes/project.route.js";
import taskRouter from "./routes/task.route.js"

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/auth/projects", projectRouter);
app.use("/api/v1/auth/projects/:projectId/tasks", taskRouter);

app.get("/", (req, res) => {
  res.send("Hello world!");
});

export default app;
