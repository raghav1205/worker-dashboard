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
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
class PubSubManager {
    constructor() {
        this.redisClientPublisher = (0, redis_1.createClient)({
            url: "redis://localhost:6379",
        });
        this.redisClientSubscriber = (0, redis_1.createClient)({
            url: "redis://localhost:6379",
        });
        this.subscribers = new Set();
        this.redisClientPublisher.on("error", (err) => console.log("Redis Publisher Error", err));
        this.redisClientSubscriber.on("error", (err) => console.log("Redis Subscriber Error", err));
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
    updateWorkerStatus(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("sending worker status:", `${data.workerId} - ${data.status}`);
            yield this.redisClientPublisher.hSet("worker-statuses", data.workerId.toString(), JSON.stringify(data));
            yield this.redisClientPublisher.publish("workerStatus", JSON.stringify(data));
            yield this.updateQueueStatus();
        });
    }
    subscribeToWorkerStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redisClientSubscriber.subscribe("workerStatus", (message) => {
                this.broadcastMessage(message);
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
            const parsedQueueStatus = queueStatus.map((status) => JSON.parse(status));
            const queueLength = queueStatus.length;
            const data = {
                queueStatus: parsedQueueStatus,
                queueLength,
            };
            // console.log("queueStatus:", data);
            this.broadcastMessage(JSON.stringify({ type: "queueStatus", data }));
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
            // Send current queue length
            const queueLength = yield this.redisClientPublisher.lLen("submissions");
            ws.send(JSON.stringify({
                type: "queueStatus",
                queueLength: queueLength || 0,
            }));
        });
    }
    broadcastMessage(data) {
        this.subscribers.forEach((subscriber) => {
            subscriber.send(data);
        });
    }
}
exports.default = PubSubManager.getInstance();
