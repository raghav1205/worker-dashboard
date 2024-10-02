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
exports.workerStatuses = void 0;
const express_1 = __importDefault(require("express"));
const ws_1 = __importDefault(require("ws"));
const http_1 = __importDefault(require("http"));
const PubSubManager_1 = __importDefault(require("./PubSubManager"));
const cluster_1 = __importDefault(require("cluster"));
const cors_1 = __importDefault(require("cors"));
const Worker_1 = __importDefault(require("./Worker"));
exports.workerStatuses = {};
if (cluster_1.default.isPrimary) {
    // const numCPUs = os.cpus().length;
    // // Fork workers
    // console.log(`Master process is running. Forking ${numCPUs} workers...`);
    for (let i = 0; i < 4; i++) {
        const worker = cluster_1.default.fork();
        if (worker.process.pid !== undefined) {
            // workerStatuses[worker.process.pid] = "Idle";
        }
        // console.log(workerStatuses, "workerstatuses");
    }
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
    const server = http_1.default.createServer(app);
    const wss = new ws_1.default.Server({ server });
    wss.on("connection", (ws) => {
        ws.on("message", (message) => {
            console.log(`Received message => ${message}`);
        });
        PubSubManager_1.default.addSubscriber(ws);
        // ws.send(JSON.stringify({ workerId: cluster.worker?.process.pid, workerStatuses }));
        ws.on("close", () => {
            console.log("Connection closed");
            PubSubManager_1.default.removeSubscriber(ws);
        });
        // ws.send("Hello! Message From Server!!");
    });
    console.log("new worker", process.pid);
    (0, Worker_1.default)();
    app.post("/submission", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { taskId } = req.body;
        PubSubManager_1.default.addToQueue({ taskId, status: "Pending" });
        // PubSubManager.updateQueueStatus();
        // console.log(workerStatuses, "workerstatuses");
        res.send({ message: "Submission received" });
    }));
    process.on("exit", () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("Worker is exiting", process.pid);
        yield PubSubManager_1.default.updateWorkerStatus({
            workerId: process.pid,
            status: "Dead",
        });
    }));
    app.get("/", (req, res) => {
        res.send("Hello World");
    });
    server.listen(3000, () => {
        console.log("Server is running on port 3000");
    });
}
