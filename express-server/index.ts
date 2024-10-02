import express from "express";
import WebSocket, { WebSocket as WsType } from "ws";
import http from "http";
import PubSubManager from "./PubSubManager";
import cluster from "cluster";
import os from "os";
import cors from "cors";
import startWorker from "./Worker";

export const workerStatuses: { [key: number]: string } = {};
if (cluster.isPrimary) {
  // const numCPUs = os.cpus().length;
  // // Fork workers
  // console.log(`Master process is running. Forking ${numCPUs} workers...`);

  for (let i = 0; i < 4; i++) {
    const worker = cluster.fork();
    if (worker.process.pid !== undefined) {
      // workerStatuses[worker.process.pid] = "Idle";
    }
    // console.log(workerStatuses, "workerstatuses");
  }

  // Listen for worker exit events and replace dead workers
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} exited. Forking a new worker...`);
    if (code !== 0) {
      console.log(`Forking a new worker due to exit code: ${code}`);
      const processId = worker.process.pid;
      if (processId !== undefined) {
        // workerStatuses[processId] = "Dead";
      }
      cluster.fork();
    }
  });
} else {

  const app = express();
  app.use(express.json());
  app.use(cors());

  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    ws.on("message", (message: { taskId: string }) => {
      console.log(`Received message => ${message}`);
    });
    PubSubManager.addSubscriber(ws);

    // ws.send(JSON.stringify({ workerId: cluster.worker?.process.pid, workerStatuses }));
    ws.on("close", () => {
      console.log("Connection closed");
      PubSubManager.removeSubscriber(ws);
    });

    // ws.send("Hello! Message From Server!!");
  });
  console.log("new worker", process.pid);
  startWorker();
  app.post("/submission", async (req, res) => {
    const { taskId } = req.body;

    PubSubManager.addToQueue({ taskId, status: "Pending" });
    // PubSubManager.updateQueueStatus();
    // console.log(workerStatuses, "workerstatuses");

    res.send({ message: "Submission received" });
  });

  process.on("exit", async () => {
    console.log("Worker is exiting", process.pid);
    await PubSubManager.updateWorkerStatus({
      workerId: process.pid,
      status: "Dead",
    });
  });

  app.get("/", (req, res) => {
    res.send("Hello World");
  });
  server.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}
