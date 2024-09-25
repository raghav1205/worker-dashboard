import PubSubManager from "./PubSubManager";
import cluster from "cluster";
import os from "os";

const startWorker = async () => {
  let previousStatus = "Idle";
  let previousQueueLength = 0;

  PubSubManager.updateWorkerStatus({
    workerId: cluster.worker?.process.pid,
    status: "Not started",
  });

  while (true) {
    const workerId = cluster.worker?.process.pid;
    let intervalId = null;
    // Check if the worker's status has changed to "Idle"
    if (previousStatus !== "Idle") {
      PubSubManager.updateWorkerStatus({
        workerId,
        status: "Idle",
      });
      previousStatus = "Idle";
    }

    const submission = await PubSubManager.getFromQueue();

    // Update worker status to "Processing" only if a submission is retrieved
    if (submission) {
      if (previousStatus !== "Processing") {
        PubSubManager.updateWorkerStatus({
          workerId,
          status: "Processing",
        });
        previousStatus = "Processing";
        intervalId = setInterval(() => {
          PubSubManager.updateWorkerStatus({
            workerId,
            workerResources: monitorResources(),
          });
        }, 1000);
      }

      console.log(submission);

      await new Promise((resolve) => setTimeout(resolve, 6000));

      // After processing, set the worker back to "Idle"
      PubSubManager.updateWorkerStatus({
        workerId,
        status: "Idle",
      });
      previousStatus = "Idle";

      if (intervalId) clearInterval(intervalId);
    }

    // Add a small delay to avoid overloading the server
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};

// Function to monitor system resources
const monitorResources = () => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = os.loadavg(); // [1min, 5min, 15min avg CPU load]
  const freeMemory = os.freemem();
  const totalMemory = os.totalmem();

  return {
    memoryUsage: {
      rss: memoryUsage.rss, // Resident Set Size (amount of space occupied in RAM)
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
    cpuUsage,
    freeMemory,
    totalMemory,
  };
};
export default startWorker;
