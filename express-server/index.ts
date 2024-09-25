import express from "express";
import WebSocket, { WebSocket as WsType } from "ws";
import http from "http";
import PubSubManager from "./PubSubManager";
import cluster from "cluster";
import os from "os";
import cors from "cors";
import startWorker from "./Worker";

// Check if the process is the master process
if (cluster.isPrimary) {
  // This is the master process, we will fork workers here

  const numCPUs = os.cpus().length; // Get the number of CPU cores available

  // Fork workers
  console.log(`Master process is running. Forking ${numCPUs} workers...`);

  for (let i = 0; i < 4; i++) {
    cluster.fork(); // Fork a worker for each CPU core
  }

  // Listen for worker exit events and replace dead workers
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} exited. Forking a new worker...`);
    cluster.fork();
  });
} else {
  const app = express();
  app.use(express.json());
  app.use(cors());

  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      console.log(`Received message => ${message}`);
    });
    PubSubManager.addSubscriber(ws);

    ws.on("close", () => {
      console.log("Connection closed");
      PubSubManager.removeSubscriber(ws);
    });

    // ws.send("Hello! Message From Server!!");
  });

  startWorker();
  app.post("/submission", async (req, res) => {
    const { taskId } = req.body;

    PubSubManager.addToQueue({ taskId });
    PubSubManager.updateQueueStatus();

    res.send({ message: "Submission received" });
  });

  app.get("/", (req, res) => {
    res.send("Hello World");
  });
  server.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}
