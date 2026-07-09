import express from "express";
import { connectMongoDB } from "./mongo";
import rutasAuth from "./routes/auth";
import rutasPlanner from "./routes/planner";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

connectMongoDB();

const app = express();
app.use(cors({
  origin: ['http://localhost:4200', ''],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use("/auth", rutasAuth);
app.use("/planner", rutasPlanner);
app.get("/", (req, res) => {
  res.send("Se ha conectado correctamente al API");
});

app.listen(3000, () => console.log("El API ha comenzado"));

export default app;