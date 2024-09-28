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
const simulateMemoryFluctuation = () => {
    let memoryHog = [];
    const memoryIncrease = setInterval(() => {
        memoryHog.push(new Array(1e6).fill("*"));
        console.log(`Memory increased, current size: ${memoryHog.length} MB`);
        // Stop increasing after reaching 100MB
        if (memoryHog.length >= 100) {
            clearInterval(memoryIncrease);
            console.log("Reached maximum memory usage");
        }
    }, 500); // Increase memory every 500ms
    // Simulate memory release
    const memoryRelease = setInterval(() => {
        const releaseSize = Math.floor(Math.random() * 10) + 1;
        memoryHog.splice(0, releaseSize);
        console.log(`Memory released, current size: ${memoryHog.length} MB`);
        // Stop releasing after memory has been freed completely
        if (memoryHog.length <= 0) {
            clearInterval(memoryRelease);
            console.log("Memory fully released");
        }
    }, 1000); // Release memory every 1000ms
};
// Simulate fluctuating resource usage during task processing
const startWorker = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let previousStatus = "Idle";
    PubSubManager_1.default.updateWorkerStatus({
        workerId: (_a = cluster_1.default.worker) === null || _a === void 0 ? void 0 : _a.process.pid,
        status: "Not started",
    });
    while (true) {
        const workerId = (_b = cluster_1.default.worker) === null || _b === void 0 ? void 0 : _b.process.pid;
        let intervalId = null;
        let taskStartTime = 0;
        let taskEndTime = 0;
        if (previousStatus !== "Idle") {
            PubSubManager_1.default.updateWorkerStatus({
                workerId,
                status: "Idle",
            });
            previousStatus = "Idle";
        }
        const submission = yield PubSubManager_1.default.getFromQueue();
        if (submission) {
            console.log("Processing submission:", submission);
            if (previousStatus !== "Processing") {
                const taskId = JSON.parse(submission).taskId;
                previousStatus = "Processing";
                taskEndTime = Math.floor(Math.random() * 10000) + 1000;
                intervalId = setInterval(() => {
                    const timeElapsed = Date.now() - taskStartTime;
                    const timeRemaining = taskEndTime - timeElapsed;
                    PubSubManager_1.default.updateWorkerStatus({
                        workerId,
                        taskId,
                        status: "Processing",
                        workerResources: monitorResources(),
                        timeRemaining,
                    });
                }, 1000);
            }
            simulateMemoryFluctuation();
            // Simulate task processing delay
            yield new Promise((resolve) => {
                taskStartTime = Date.now();
                setTimeout(resolve, taskEndTime);
            });
            // After processing, set the worker back to "Idle"
            PubSubManager_1.default.updateWorkerStatus({
                workerId,
                status: "Idle",
            });
            previousStatus = "Idle";
            if (intervalId)
                clearInterval(intervalId);
        }
        yield new Promise((resolve) => setTimeout(resolve, 500));
    }
});
const monitorResources = () => {
    const memoryUsage = process.memoryUsage();
    const freeMemory = os_1.default.freemem();
    const totalMemory = os_1.default.totalmem();
    const cpuUsage = process.cpuUsage();
    const userCpuTime = cpuUsage.user / 1e6;
    const systemCpuTime = cpuUsage.system / 1e6;
    return {
        memoryUsage: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
        },
        cpuUsage: {
            userCpuTime,
            systemCpuTime,
        },
        freeMemory,
        totalMemory,
    };
};
exports.default = startWorker;
