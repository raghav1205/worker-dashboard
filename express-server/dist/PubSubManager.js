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
        this.redisClientPublisher.on("error", (err) => console.log("Redis Publisher Error", err));
        this.redisClientSubscriber.on("error", (err) => console.log("Redis Subscriber Error", err));
        this.redisClientPublisher.connect();
        this.redisClientSubscriber.connect();
    }
    static getInstance() {
        if (!PubSubManager.instance) {
            PubSubManager.instance = new PubSubManager();
        }
        return PubSubManager.instance;
    }
    addToQueue(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("adding to queue:", data);
            const length = yield this.redisClientPublisher.lLen("submissions");
            const maxQueueLength = 20;
            if (length > 20) {
                return -1;
            }
            yield this.redisClientPublisher.lPush("submissions", JSON.stringify(data));
            yield this.redisClientPublisher.lTrim("submissions", 0, maxQueueLength - 1);
            return 1;
        });
    }
}
exports.default = PubSubManager.getInstance();
