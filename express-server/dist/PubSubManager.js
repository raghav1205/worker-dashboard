"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const process_1 = __importDefault(require("process"));
class PubSubManager {
    constructor() {
        // this.redisClientPublisher = createClient({
        //   url: "redis://redis:6379",
        // });
        // this.redisClientSubscriber = createClient({
        //   url: "redis://redis:6379",
        // });
        this.redisClientPublisher = (0, redis_1.createClient)({
            url: "redis://localhost:6379",
        });
        this.redisClientSubscriber = (0, redis_1.createClient)({
            url: "redis://localhost:6379",
        });
        this.subscribers = new Set();
        this.workerStatuses = new Set();
        this.redisClientPublisher.on("error", (err) => console.log("Redis Publisher Error", err));
        this.redisClientSubscriber.on("error", (err) => console.log("Redis Subscriber Error", err));
        this.redisClientPublisher.connect();
        this.redisClientSubscriber.connect();
        this.subscribeToWorkerStatus();
        // this.subscribeToQueueStatus();
        this.checkIfWorkerIsDead(process_1.default.pid);
    }
    static getInstance() {
        if (!PubSubManager.instance) {
            PubSubManager.instance = new PubSubManager();
        }
        return PubSubManager.instance;
    }
    addToQueue(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redisClientPublisher.lPush("submissions", JSON.stringify(data));
            this.updateQueueStatus();
        });
    }
    getFromQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            const submission = yield this.redisClientPublisher.rPop("submissions");
            this.updateQueueStatus();
            return submission;
        });
    }
    updateQueueItem(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const taskId = data.taskId;
            const itemIdx = yield this.redisClientPublisher.lIndex("submissions", taskId);
            if (itemIdx === null) {
                return;
            }
            yield this.redisClientPublisher.lSet("submissions", parseInt(itemIdx), JSON.stringify(data));
        });
    }
    updateWorkerStatus(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("sending worker status:", `${data.workerId} - ${data.status}`);
            const workerId = data.workerId;
            console.log("workerId", workerId);
            // if (data.status === "Dead") {
            //   console.log("Worker is dead", workerId);
            //   await this.redisClientPublisher.hDel(
            //     "worker-statuses",
            //     workerId.toString()
            //   );
            //   this.workerStatuses.delete(data);
            // } else {
            yield this.redisClientPublisher.hSet("worker-statuses", data.workerId.toString(), JSON.stringify(data));
            this.workerStatuses.add(data);
            // }
            yield this.redisClientPublisher.publish("workerStatus", JSON.stringify(data));
            console.log("status", this.workerStatuses);
            const hsetData = yield this.redisClientPublisher.hGet("worker-statuses", workerId.toString());
            console.log("hsetData", hsetData);
            // await this.updateQueueStatus();
        });
    }
    subscribeToWorkerStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redisClientSubscriber.subscribe("workerStatus", (message) => {
                // console.log("recent worker status:", message);
                this.addWorkerStatus(JSON.parse(message));
                console.log("workerStatuses", this.workerStatuses.size);
                const workerStatusesArray = Array.from(this.workerStatuses);
                console.log("workerStatusesArray", workerStatusesArray.length);
                this.broadcastMessage(JSON.stringify({ type: 'workerStatus', data: workerStatusesArray }));
                // this.broadcastMessage(message);
            });
        });
    }
    subscribeToQueueStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redisClientSubscriber.subscribe("submissions", (message) => {
                console.log("queueStatus:", message);
                this.broadcastMessage(JSON.stringify({ type: "queueStatus", queueStatus: message }));
            });
        });
    }
    getQueueContents() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.redisClientPublisher.lRange("submissions", 0, -1);
        });
    }
    updateQueueStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("updating queue status");
            const queueStatus = yield this.getQueueContents();
            // console.log("queueStatus before :", queueStatus);
            const parsedQueueStatus = queueStatus
                .map((status) => JSON.parse(status))
                .filter((status) => status.status !== "Completed");
            const data = {
                queueStatus: parsedQueueStatus,
            };
            // console.log("queueStatus after", data.queueStatus);
            // this.broadcastMessage(JSON.stringify({ type: "queueStatus", data }));
        });
    }
    addSubscriber(ws) {
        return __awaiter(this, void 0, void 0, function* () {
            this.subscribers.add(ws);
            yield this.sendCurrentState(ws);
        });
    }
    removeSubscriber(ws) {
        return __awaiter(this, void 0, void 0, function* () {
            this.subscribers.delete(ws);
        });
    }
    // Send the current worker statuses and queue length to the newly connected WebSocket client
    sendCurrentState(ws) {
        return __awaiter(this, void 0, void 0, function* () {
            // Send current worker statuses
            const workerStatuses = yield this.redisClientPublisher.hGetAll("worker-statuses");
            for (const [workerId, status] of Object.entries(workerStatuses)) {
                ws.send(JSON.stringify(JSON.parse(status)));
            }
        });
    }
    broadcastMessage(data) {
        const broadData = JSON.parse(data);
        console.log("worker no:", process_1.default.pid);
        console.log("broadData", broadData);
        //  for (let  item of broadData.data){
        //     console.log(item);
        //  }
        this.subscribers.forEach((subscriber) => {
            // subscriber.send(data);
            try {
                subscriber.send(data);
            }
            catch (err) {
                console.log("Error in sending message to subscriber:", err);
            }
        });
    }
    checkIfWorkerIsDead(workerId) {
        process_1.default.on("exit", () => __awaiter(this, void 0, void 0, function* () {
            console.log("Worker is exiting", workerId);
            yield this.updateWorkerStatus({
                workerId,
                status: "Dead",
            });
            yield this.redisClientPublisher.hDel("worker-statuses", workerId.toString());
        }));
    }
    addWorkerStatus(data) {
        for (const workerStatus of this.workerStatuses) {
            if (workerStatus.workerId === data.workerId) {
                this.workerStatuses.delete(workerStatus);
            }
        }
        this.workerStatuses.add(data);
    }
}
exports.default = PubSubManager.getInstance();
