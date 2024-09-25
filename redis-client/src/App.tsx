
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import QueueContents from "./components/QueueContents";
import WorkerStatus from "./components/WorkerStatus";
import "./App.css"; // Import the CSS file for custom styles

const WEBSOCKET_URL = "ws://localhost:3000";

interface WorkerStatuses {
    workerId: string;
    status: string;
    workerResources?: WorkerResources;
}

interface WorkerResources {
    cpuUsage: number[];
    freeMemory: number;
    totalMemory: number;
    memoryUsage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
    };
}

function App() {
    const [workerStatuses, setWorkerStatuses] = useState<WorkerStatuses[]>([]);
    const [queueLength, setQueueLength] = useState(0);

    useEffect(() => {
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            // console.log("Connected to WebSocket");
        };

        ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            console.log(data);
            if (data.length !== undefined) {
                setQueueLength(data.length);
            } else {
                setWorkerStatuses((prevStatuses) => {
                    // console.log(prevStatuses);
                    const updatedStatuses = [...prevStatuses];
                    const workerIndex = updatedStatuses.findIndex(
                        (w) => w.workerId === data.workerId
                    );

                    if (workerIndex > -1) {
                        updatedStatuses[workerIndex] = data;
                    } else {
                        updatedStatuses.push(data);
                    }

                    return updatedStatuses;
                });
            }
        };

        return () => ws.close();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 p-10 font-sans grid-container">
            <motion.h1
                className="text-3xl font-bold text-center mb-8 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                Worker Status Dashboard
            </motion.h1>

            <motion.h2
                className="text-xl font-semibold text-center mb-8 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
            >
                Queue Length: {queueLength}
            </motion.h2>

            <div className="grid-layout">
                {workerStatuses.slice(0, 4).map((worker, index) => (
                    <motion.div
                        key={worker.workerId}
                        className={`worker-card worker-${index + 1}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <WorkerCard worker={worker} />
                        {worker?.workerResources && (
                            <WorkerStatus workerStats={worker?.workerResources} />
                        )}
                    </motion.div>
                ))}
            </div>
            <QueueContents />
            <SubmitTask queueLength = {queueLength}/>
        </div>
    );
}

interface WorkerProps {
    worker: WorkerStatuses;
}

function SubmitTask({queueLength}: {queueLength: number}) {
   

    const handleSubmit = async () => {
     
        const taskId =  `T${queueLength + 1}`;
        await fetch("http://localhost:3000/submission", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ taskId}),
        });

       
    };

    return (
        <motion.div
            className="shadow-lg rounded-lg p-6 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            <button
                onClick={handleSubmit}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg"
            >
                Start a Task
            </button>
        </motion.div>
    );
}

function WorkerCard({ worker }: WorkerProps) {
    const { workerId, status } = worker;

    const getStatusClasses = () => {
        switch (status) {
            case "Processing":
                return "bg-yellow-400";
            case "Idle":
                return "bg-green-400";
            default:
                return "bg-white";
        }
    };

    return (
        <motion.div
            className={`shadow-lg rounded-lg p-6 ${getStatusClasses()}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <h3 className="text-xl font-semibold mb-2">Worker ID: {workerId}</h3>
            <p className="text-gray-700">Status: {status}</p>
        </motion.div>
    );
}

export default App;