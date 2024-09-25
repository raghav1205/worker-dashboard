import { RedisClientType, createClient } from "redis";
import WebSocket from "ws";

class PubSubManager {
  private static instance: PubSubManager;
  private redisClientPublisher: RedisClientType;
  private redisClientSubscriber: RedisClientType;
  private subscribers: Set<WebSocket>;

  constructor() {
    this.redisClientPublisher = createClient({
      url: "redis://localhost:6379",
    });
    this.redisClientSubscriber = createClient({
      url: "redis://localhost:6379",
    });
    this.subscribers = new Set();

    this.redisClientPublisher.on("error", (err) =>
      console.log("Redis Publisher Error", err)
    );
    this.redisClientSubscriber.on("error", (err) =>
      console.log("Redis Subscriber Error", err)
    );

    this.redisClientPublisher.connect();
    this.redisClientSubscriber.connect();

    this.subscribeToWorkerStatus();
    this.subscribeToQueueStatus();
  }

  static getInstance() {
    if (!PubSubManager.instance) {
      PubSubManager.instance = new PubSubManager();
    }

    return PubSubManager.instance;
  }

  public async addToQueue(data: any) {
    await this.redisClientPublisher.lPush("submissions", JSON.stringify(data));
  }

  public async getFromQueue() {
    this.updateQueueStatus();
    return await this.redisClientPublisher.rPop("submissions");
  }

  public async updateWorkerStatus(data: any) {
    // console.log("sending worker status:", `${data.workerId} - ${data.status}`);
    await this.redisClientPublisher.hSet(
      "worker-statuses",
      data.workerId.toString(),
      JSON.stringify(data)
    );

    await this.redisClientPublisher.publish(
      "workerStatus",
      JSON.stringify(data)
    );
  }

  private async subscribeToWorkerStatus() {
    await this.redisClientSubscriber.subscribe("workerStatus", (message) => {
      this.broadcastMessage(message);
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
    
    const data = {
      queueStatus,
    };

    console.log("queueStatus:", data);
    this.broadcastMessage(JSON.stringify({ type: "queueStatus", data }));
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
    for (const [workerId, status] of Object.entries(workerStatuses)) {
      ws.send(JSON.stringify(JSON.parse(status)));
    }

    // Send current queue length
    const queueLength = await this.redisClientPublisher.get("queue-length");
    ws.send(
      JSON.stringify({
        type: "queueStatus",
        queueLength: parseInt(queueLength || "0"),
      })
    );
  }

  private broadcastMessage(data: any) {
    this.subscribers.forEach((subscriber) => {
      subscriber.send(data);
    });
  }
}

export default PubSubManager.getInstance();
