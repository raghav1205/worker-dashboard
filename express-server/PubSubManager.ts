import { RedisClientType, createClient } from "redis";
import WebSocket from "ws";
import process from "process";

interface WorkerStatus {
  workerId: number;
  taskId?: string;
  status: string;
  timeRemaining?: number;
  workerResources?: any;
}

class PubSubManager {
  private static instance: PubSubManager;
  private redisClientPublisher: RedisClientType;
  private redisClientSubscriber: RedisClientType;
  private subscribers: Set<WebSocket>;
  private workerStatuses: Set<WorkerStatus>;

  constructor() {
    this.redisClientPublisher = createClient({
      url: "redis://redis:6379",
    });
    this.redisClientSubscriber = createClient({
      url: "redis://redis:6379",
    });
    // this.redisClientPublisher = createClient({
    //   url: "redis://localhost:6379",
    // });
    // this.redisClientSubscriber = createClient({
    //   url: "redis://localhost:6379",
    // });
    this.subscribers = new Set();
    this.workerStatuses = new Set();

    this.redisClientPublisher.on("error", (err) =>
      console.log("Redis Publisher Error", err)
    );
    this.redisClientSubscriber.on("error", (err) =>
      console.log("Redis Subscriber Error", err)
    );

    this.redisClientPublisher.connect();
    this.redisClientSubscriber.connect();

    this.subscribeToWorkerStatus();
    // this.subscribeToQueueStatus();
    this.checkIfWorkerIsDead(process.pid);
  }

  static getInstance() {
    if (!PubSubManager.instance) {
      PubSubManager.instance = new PubSubManager();
    }

    return PubSubManager.instance;
  }

  public async addToQueue(data: any) {
    console.log("adding to queue:", data);
    const length = await this.redisClientPublisher.lLen("submissions");
    if (length > 20) {
      return -1;
    }
    await this.redisClientPublisher.lPush("submissions", JSON.stringify(data));
    return 1;
  }

  public async getFromQueue() {
    const submission = await this.redisClientPublisher.rPop("submissions");
    this.updateQueueStatus();
    return submission;
  }

  public async updateQueueItem(data: any) {
    const taskId = data.taskId;
    const itemIdx = await this.redisClientPublisher.lIndex(
      "submissions",
      taskId
    );

    if (itemIdx === null) {
      return;
    }

    await this.redisClientPublisher.lSet(
      "submissions",
      parseInt(itemIdx),
      JSON.stringify(data)
    );
  }

  public async updateWorkerStatus(data: WorkerStatus) {
    console.log("sending worker status:", `${data.workerId} - ${data.status}`);
    const workerId = data.workerId;
    console.log("workerId", workerId);

    await this.redisClientPublisher.hSet(
      "worker-statuses",
      data.workerId.toString(),
      JSON.stringify(data)
    );
    this.workerStatuses.add(data);

    await this.redisClientPublisher.publish(
      "workerStatus",
      JSON.stringify(data)
    );
    console.log("status", this.workerStatuses);
    const hsetData = await this.redisClientPublisher.hGet(
      "worker-statuses",
      workerId.toString()
    );
    console.log("hsetData", hsetData);
  }

  private async subscribeToWorkerStatus() {
    await this.redisClientSubscriber.subscribe("workerStatus", (message) => {
      // console.log("recent worker status:", message);
      this.addWorkerStatus(JSON.parse(message));
      console.log("workerStatuses", this.workerStatuses.size);
      const workerStatusesArray = Array.from(this.workerStatuses);
      console.log("workerStatusesArray", workerStatusesArray.length);
      this.broadcastMessage(
        JSON.stringify({ type: "workerStatus", data: workerStatusesArray })
      );
      // this.broadcastMessage(message);
    });
  }

  private async subscribeToQueueStatus() {
    await this.redisClientSubscriber.subscribe("submissions", (message) => {
      console.log("queueStatus:", message);
      this.broadcastMessage(
        JSON.stringify({ type: "queueStatus", queueStatus: message })
      );
    });
  }

  public async getQueueContents() {
    return await this.redisClientPublisher.lRange("submissions", 0, -1);
  }

  public async updateQueueStatus() {
    // console.log("updating queue status");
    const queueStatus = await this.getQueueContents();
    console.log("queueStatus before :", queueStatus);
    const parsedQueueStatus = queueStatus
      .map((status) => JSON.parse(status))
      .filter((status) => status.status !== "Completed");

    const data = {
      queueStatus: parsedQueueStatus,
    };
    console.log("queueStatus after :", data);
    return data;

    // this.broadcastMessage(JSON.stringify({ type: "queueStatus", data }));
  }

  public async addSubscriber(ws: WebSocket) {
    this.subscribers.add(ws);
    await this.sendCurrentState(ws);
  }

  public async removeSubscriber(ws: WebSocket) {
    this.subscribers.delete(ws);
  }

  // Send the current worker statuses and queue length to the newly connected WebSocket client
  private async sendCurrentState(ws: WebSocket): Promise<void> {
    // Send current worker statuses
    const workerStatuses = await this.redisClientPublisher.hGetAll(
      "worker-statuses"
    );
    console.log("Current worker statuses:", workerStatuses); // Log the statuses

    for (const [workerId, status] of Object.entries(workerStatuses)) {
      try {
        const parsedStatus = JSON.parse(status);
        // ws.send(JSON.stringify(parsedStatus));
      } catch (error) {
        console.error("Error parsing status:", error);
      }
    }
  }

  private broadcastMessage(data: any) {
    const broadData = JSON.parse(data);
    console.log("worker no:", process.pid);
    console.log("broadData", broadData);
    //  for (let  item of broadData.data){
    //     console.log(item);
    //  }

    this.subscribers.forEach((subscriber) => {
      // subscriber.send(data);
      try {
        subscriber.send(data);
      } catch (err) {
        console.log("Error in sending message to subscriber:", err);
      }
    });
  }

  private checkIfWorkerIsDead(workerId: number) {
    process.on("exit", async () => {
      console.log("Worker is exiting", workerId);
      await this.updateWorkerStatus({
        workerId,
        status: "Dead",
      });
      await this.redisClientPublisher.hDel(
        "worker-statuses",
        workerId.toString()
      );
    });
  }
  private addWorkerStatus(data: WorkerStatus) {
    for (const workerStatus of this.workerStatuses) {
      if (workerStatus.workerId === data.workerId) {
        this.workerStatuses.delete(workerStatus);
      }
    }
    this.workerStatuses.add(data);
  }
}

export default PubSubManager.getInstance();
