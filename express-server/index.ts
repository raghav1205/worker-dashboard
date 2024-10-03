import express from "express";
import WebSocket, { WebSocket as WsType } from "ws";
import http from "http";
import cluster, { Worker } from "cluster";
import cors from "cors";
import startWorker from "./Worker";
import PubSubManager from "./PubSubManager";
import { WorkerStatus, QueueStatus } from "./types";

if (cluster.isPrimary) {
  // const numCPUs = os.cpus().length;
  // Fork workers
  // console.log(`Master process is running. Forking ${numCPUs} workers...`);
  const workerSet = new Set<Worker>();
  const workerStatuses = new Set<WorkerStatus>();
  const queueStatus = new Set<QueueStatus>();

  for (let i = 0; i < 4; i++) {
    const worker = cluster.fork();
    workerSet.add(worker);
  }

  cluster.on("message", async (worker, message) => {
    console.log(`Message from worker ${worker.process.pid}: ${message}`);
    // console.log("message", message.type);
    // console.log("message", JSON.parse(message));
    try {
      if (message.type === "workerStatus") {
        // PubSubManager.updateWorkerStatus(message.data);
        addWorkerStatus(message.data, workerStatuses);
        for (const worker of workerSet) {
          worker.send({
            type: "workerStatus",
            workerStatuses: Array.from(workerStatuses),
          });
        }
      }
      if (message.type === "queueStatus") {
        const data = message.data;
        updateQueueStatus(queueStatus, data);
        for (const worker of workerSet) {
          worker.send({
            type: "queueStatus",
            queueStatus: Array.from(queueStatus),
          });
        }
        console.log("Queue status:", data);
      }
      if (message.type === "newConnection") {
        updateQueueStatus(queueStatus);
        for (const worker of workerSet) {
          worker.send({
            type: "workerStatus",
            workerStatuses: Array.from(workerStatuses),
          });
          worker.send({
            type: "queueStatus",
            queueStatus: Array.from(queueStatus),
          });
        }
      }

      if (message.type === "submission") {
        const status = await PubSubManager.addToQueue(message.data);
        console.log("Status:", status);
        if (status === -1) {
          worker.send({
            type: "error",
            message: "Queue is full, try again later",
          });
        }
        else{
          console.log("Sending initial queue status to worker");
          updateQueueStatus(queueStatus, message.data);
          worker.send({
            type: "queueStatus",
            queueStatus: Array.from(queueStatus),
          });
        }
      }
    } catch (err) {
      console.log("Error in message handling :", err);
    }
  });

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
  const wsMap = new Map<number, Set<WebSocket>>();
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });
  const pid = cluster.worker?.process.pid;

  wss.on("connection", async (ws) => {
    if (pid !== undefined) {
      if (!wsMap.has(pid)) {
        wsMap.set(pid, new Set<WebSocket>());
      }
      wsMap.get(pid)?.add(ws);
      if (process.send) process.send({ type: "newConnection" });
    }

    process.on("message", (message: MessageEvent) => {
      if (message.type === "workerStatus") {
        ws.send(JSON.stringify(message));
      }
      if (message.type === "workerStatus") {
        ws.send(JSON.stringify(message));
      }
      if (message.type === "error") {
        ws.send(JSON.stringify(message));
      }
      if (message.type === "queueStatus") {
        console.log("Received queue status:", message);
        ws.send(JSON.stringify(message));
      }
    });

    ws.on("close", () => {
      console.log("Connection closed");
      if (pid !== undefined) {
        wsMap.get(pid)?.delete(ws);
      }
    });
  });
  console.log("new worker", process.pid);
  startWorker();
  app.post("/submission", async (req, res) => {
    const { taskId } = req.body;

    if (process.send) {
      process.send({ type: "submission", data: { taskId, status: "Pending" } });
    }

    res.send({ message: "Submission received" });
  });

  process.on("message", (message) => {});

  process.on("exit", async () => {
    console.log("Worker is exiting", process.pid);
  });

  app.get("/", (req, res) => {
    res.send("Hello World");
  });
  server.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}

const addWorkerStatus = (
  data: WorkerStatus,
  workerStatuses: Set<WorkerStatus>
) => {
  for (const workerStatus of workerStatuses) {
    if (workerStatus.workerId === data.workerId) {
      workerStatuses.delete(workerStatus);
    }
  }
  workerStatuses.add(data);
};

const updateQueueStatus = (
  queueStatus: Set<QueueStatus>,
  data?: QueueStatus
) => {
  if (data) {
    for (const queue of queueStatus) {
      if (queue.taskId === data.taskId || queue.status === "Completed") {
        queueStatus.delete(queue);
      }
    }
    queueStatus.add(data);
  }
  else{
    for (const queue of queueStatus) {
      if (queue.status === "Completed") {
        queueStatus.delete(queue);
      }
    }
  }
};
