import { motion } from "framer-motion";
import WorkerStatus from "./components/WorkerStatus";
import "./App.css";
import { useSelector } from "react-redux";
import useSocket from "./hooks/useSocket";
import { WorkerStatuses } from "./types/types";
import QueueContents from "./components/QueueContents";
function App() {
  const workerStatuses = useSelector(
    (state: { worker: { workerStatuses: WorkerStatuses[] } }) =>
      state.worker.workerStatuses
  );
  // const queueLength = useSelector((state: { worker: { queueLength: number } }) => state.worker.queueLength);
  useSocket();

  return (
    <div className="min-h-screen m-0 mx-auto text-center bg-gradient-to-r from-[#0A0A0A] to-gray-800 p-5 font-sans">
      <div className="md:w-[100%] w-full ">
        <div className="flex  md:flex flex-col items-center justify-center">
          <div className="flex flex-col items-center grow justify-center h-full w-full mb-4">
            <motion.h1
              className="text-3xl md:flex md:flex-wrap justify-start font-bold text-center mb-4 text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              Worker Status Dashboard
            </motion.h1>
            <div className="h-full w-full md:mt-10">
              <SubmitTask />
              <QueueContents />
            </div>
          </div>
          {/* Grid Layout for worker statuses */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {workerStatuses.map((worker) => (
              <motion.div
                key={worker.workerId}
                className="mx-auto w-full max-w-xs md:max-w-sm lg:max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <WorkerCard worker={worker} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface WorkerProps {
  worker: WorkerStatuses;
}

function SubmitTask() {
  const handleSubmit = async () => {
    const randomTaskId = Math.random().toString(36).substring(7);
    const taskId = `Task-${randomTaskId}`;
    await fetch(`https://${import.meta.env.VITE_BACKEND_URL}/submission`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskId }),
    });
  };

  return (
    <motion.div
      className="shadow-lg rounded-lg p-6 "
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
  const { workerId, status, taskId } = worker;
  // console.log(worker.taskId, "worker.taskId");
  // console.log(worker.status, "worker.status");
  const getStatusClasses = () => {
    switch (status) {
      case "Processing":
        return "bg-green-400";
      case "Idle":
        return "bg-green-400";
      default:
        return "bg-white";
    }
  };

  const getLedStyle = () => {
    if (status === "Processing") {
      return {
        background: "radial-gradient(circle, #00ff00 40%, #008000 100%)",
        boxShadow:
          "0 0 10px rgba(0, 255, 0, 0.7), 0 0 20px rgba(0, 255, 0, 0.5)",
      };
    }
    return {
      background: "radial-gradient(circle, #888888 40%, #555555 100%)",
      boxShadow: "none",
    };
  };
  return (
    <motion.div
      className={`shadow-lg rounded-lg p-3 md:p-6 relative overflow-hidden  ${getStatusClasses()}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute top-2 right-2">
        <div
          className="w-5 h-5 rounded-full"
          style={getLedStyle()}
          title={status === "Processing" ? "Processing" : "Idle"}
        ></div>
      </div>
      <div className="flex justify-between mx-6">
        <h3 className="text-xl font-semibold mb-2">Worker ID: {workerId}</h3>
        <h3 className="text-xl font-semibold mb-2">{taskId}</h3>
      </div>

      {/* <h2 className="text-md font-semibold mb-4">{kworker?.taskId}</h2> */}

      <div className="  ">
        {/* {worker?.workerResources && ( */}
        <div className="h-full md:w-full  ">
          <WorkerStatus
            workerStats={worker?.workerResources ?? null}
            timeRemaining={worker?.timeRemaining ?? 0}
          />
        </div>
        {/* )}  */}
      </div>
    </motion.div>
  );
}

export default App;
