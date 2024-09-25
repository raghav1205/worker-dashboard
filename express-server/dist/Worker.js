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
const PubSubManager_1 = __importDefault(require("./PubSubManager"));
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const startWorker = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let previousStatus = "Idle";
    let previousQueueLength = 0;
    PubSubManager_1.default.updateWorkerStatus({
        workerId: (_a = cluster_1.default.worker) === null || _a === void 0 ? void 0 : _a.process.pid,
        status: "Not started",
    });
    while (true) {
        const workerId = (_b = cluster_1.default.worker) === null || _b === void 0 ? void 0 : _b.process.pid;
        let intervalId = null;
        // Check if the worker's status has changed to "Idle"
        if (previousStatus !== "Idle") {
            PubSubManager_1.default.updateWorkerStatus({
                workerId,
                status: "Idle",
            });
            previousStatus = "Idle";
        }
        const submission = yield PubSubManager_1.default.getFromQueue();
        // Update worker status to "Processing" only if a submission is retrieved
        if (submission) {
            if (previousStatus !== "Processing") {
                PubSubManager_1.default.updateWorkerStatus({
                    workerId,
                    status: "Processing",
                });
                previousStatus = "Processing";
                intervalId = setInterval(() => {
                    PubSubManager_1.default.updateWorkerStatus({
                        workerId,
                        workerResources: monitorResources(),
                    });
                }, 1000);
            }
            console.log(submission);
            yield new Promise((resolve) => setTimeout(resolve, 6000));
            // After processing, set the worker back to "Idle"
            PubSubManager_1.default.updateWorkerStatus({
                workerId,
                status: "Idle",
            });
            previousStatus = "Idle";
            if (intervalId)
                clearInterval(intervalId);
        }
        // Add a small delay to avoid overloading the server
        yield new Promise((resolve) => setTimeout(resolve, 500));
    }
});
// Function to monitor system resources
const monitorResources = () => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = os_1.default.loadavg(); // [1min, 5min, 15min avg CPU load]
    const freeMemory = os_1.default.freemem();
    const totalMemory = os_1.default.totalmem();
    return {
        memoryUsage: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
        },
        cpuUsage,
        freeMemory,
        totalMemory,
    };
};
exports.default = startWorker;
