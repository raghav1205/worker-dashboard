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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = __importDefault(require("ws"));
const http_1 = __importDefault(require("http"));
const cluster_1 = __importDefault(require("cluster"));
const cors_1 = __importDefault(require("cors"));
const Worker_1 = __importDefault(require("./Worker"));
const PubSubManager_1 = __importDefault(require("./PubSubManager"));
if (cluster_1.default.isPrimary) {
    // const numCPUs = os.cpus().length;
    // Fork workers
    // console.log(`Master process is running. Forking ${numCPUs} workers...`);
    const workerSet = new Set();
    const workerStatuses = new Set();
    const queueStatus = new Set();
    for (let i = 0; i < 4; i++) {
        const worker = cluster_1.default.fork();
        workerSet.add(worker);
    }
    cluster_1.default.on("message", (worker, message) => __awaiter(void 0, void 0, void 0, function* () {
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
                const status = yield PubSubManager_1.default.addToQueue(message.data);
                console.log("Status:", status);
                if (status === -1) {
                    worker.send({
                        type: "error",
                        message: "Queue is full, try again later",
                    });
                }
                else {
                    console.log("Sending initial queue status to worker");
                    updateQueueStatus(queueStatus, message.data);
                    worker.send({
                        type: "queueStatus",
                        queueStatus: Array.from(queueStatus),
                    });
                }
            }
        }
        catch (err) {
            console.log("Error in message handling :", err);
        }
    }));
    // Listen for worker exit events and replace dead workers
    cluster_1.default.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} exited. Forking a new worker...`);
        if (code !== 0) {
            console.log(`Forking a new worker due to exit code: ${code}`);
            const processId = worker.process.pid;
            if (processId !== undefined) {
                // workerStatuses[processId] = "Dead";
            }
            cluster_1.default.fork();
        }
    });
}
else {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    const wsMap = new Map();
    const server = http_1.default.createServer(app);
    const wss = new ws_1.default.Server({ server });
    const pid = (_a = cluster_1.default.worker) === null || _a === void 0 ? void 0 : _a.process.pid;
    wss.on("connection", (ws) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        if (pid !== undefined) {
            if (!wsMap.has(pid)) {
                wsMap.set(pid, new Set());
            }
            (_b = wsMap.get(pid)) === null || _b === void 0 ? void 0 : _b.add(ws);
            if (process.send)
                process.send({ type: "newConnection" });
        }
        process.on("message", (message) => {
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
            var _a;
            console.log("Connection closed");
            if (pid !== undefined) {
                (_a = wsMap.get(pid)) === null || _a === void 0 ? void 0 : _a.delete(ws);
            }
        });
    }));
    console.log("new worker", process.pid);
    (0, Worker_1.default)();
    app.post("/submission", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { taskId } = req.body;
        if (process.send) {
            process.send({ type: "submission", data: { taskId, status: "Pending" } });
        }
        res.send({ message: "Submission received" });
    }));
    process.on("message", (message) => { });
    process.on("exit", () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("Worker is exiting", process.pid);
    }));
    app.get("/", (req, res) => {
        res.send("Hello World");
    });
    server.listen(3000, () => {
        console.log("Server is running on port 3000");
    });
}
const addWorkerStatus = (data, workerStatuses) => {
    for (const workerStatus of workerStatuses) {
        if (workerStatus.workerId === data.workerId) {
            workerStatuses.delete(workerStatus);
        }
    }
    workerStatuses.add(data);
};
const updateQueueStatus = (queueStatus, data) => {
    if (data) {
        for (const queue of queueStatus) {
            if (queue.taskId === data.taskId || queue.status === "Completed") {
                queueStatus.delete(queue);
            }
        }
        queueStatus.add(data);
    }
    else {
        for (const queue of queueStatus) {
            if (queue.status === "Completed") {
                queueStatus.delete(queue);
            }
        }
    }
};
