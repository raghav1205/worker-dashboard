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

    this.redisClientPublisher.on("error", (err) =>
      console.log("Redis Publisher Error", err)
    );
    this.redisClientSubscriber.on("error", (err) =>
      console.log("Redis Subscriber Error", err)
    );

    this.redisClientPublisher.connect();
    this.redisClientSubscriber.connect();


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
    const maxQueueLength = 20;
    if (length > 20) {
      return -1;
    }
    await this.redisClientPublisher.lPush("submissions", JSON.stringify(data));
    await this.redisClientPublisher.lTrim("submissions", 0, maxQueueLength - 1);
    return 1;
  }


}

export default PubSubManager.getInstance();
