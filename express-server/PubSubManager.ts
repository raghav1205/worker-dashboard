import { RedisClientType, createClient } from "redis";
import WebSocket from "ws";
import { workerStatuses } from ".";

class PubSubManager {
  private static instance: PubSubManager;
  private redisClientPublisher: RedisClientType;
  private redisClientSubscriber: RedisClientType;
  private subscribers: Set<WebSocket>;

  constructor() {
    this.redisClientPublisher = createClient({
      url: "redis://redis:6379",
    });
    this.redisClientSubscriber = createClient({
      url: "redis://redis:6379",
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
    this.updateQueueStatus();
  }

  public async getFromQueue() {
    const submission = await this.redisClientPublisher.rPop("submissions");
    this.updateQueueStatus();
    return submission;
  }

  public async updateQueueItem(data: any) {
    const taskId = data.taskId;
    const itemIdx = await this.redisClientPublisher.lIndex("submissions", taskId);

    if (itemIdx === null) {
      return;
    }
    
    await this.redisClientPublisher.lSet(
      "submissions",
      parseInt(itemIdx),
      JSON.stringify(data)
    );


    
  }


  public async updateWorkerStatus(data: any) {
    console.log("sending worker status:", `${data.workerId} - ${data.status}`);
    
    await this.redisClientPublisher.hSet(
      "worker-statuses",
      data.workerId.toString(),
      JSON.stringify(data)
    );

    const workerId = data.workerId;
    
    // delete if worker is dead
    if(workerStatuses[workerId] === "Dead") {
      await this.redisClientPublisher.hDel("worker-statuses", workerId.toString());
    }

    await this.redisClientPublisher.publish(
      "workerStatus",
      JSON.stringify(data)
    );

    await this.updateQueueStatus();
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
    const parsedQueueStatus = queueStatus.map((status) => JSON.parse(status)).filter((status) => status.status !== "Completed");

    const queueLength = queueStatus.length;
    const data = {
      queueStatus: parsedQueueStatus,
      queueLength,
    };
    if (queueLength > 0) {
      console.log("queueStatus:", data);
    }
  

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
    const queueLength = await this.redisClientPublisher.lLen("submissions");
    ws.send(
      JSON.stringify({
        type: "queueStatus",
        queueLength: queueLength || 0,
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
