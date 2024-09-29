import PubSubManager from "./PubSubManager";
import cluster from "cluster";
import os from "os";

const simulateMemoryFluctuation = () => {
  let memoryHog: any = [];

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
const startWorker = async () => {
let previousStatus = "Idle";
  PubSubManager.updateWorkerStatus({
    workerId: cluster.worker?.process.pid,
    status: "Not started",
  });

  while (true) {
    const workerId = cluster.worker?.process.pid;
    let intervalId = null;
    let taskStartTime: number = 0;
    let taskEndTime: number = 0;
    if (previousStatus !== "Idle") {
      PubSubManager.updateWorkerStatus({
        workerId,
        status: "Idle",
      });
      previousStatus = "Idle";
    }

    const submission = await PubSubManager.getFromQueue();

    if (submission) {
      console.log("Processing submission:", submission);

      if (previousStatus !== "Processing") {
        const taskId = JSON.parse(submission).taskId;
        previousStatus = "Processing";
        taskEndTime = Math.floor(Math.random() * 10000) + 1000;
        
        intervalId = setInterval(() => {
          const timeElapsed = Date.now() - taskStartTime;
          const timeRemaining = taskEndTime - timeElapsed;
          PubSubManager.updateWorkerStatus({
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

      await new Promise((resolve) => {
        taskStartTime = Date.now();
        setTimeout(resolve, taskEndTime);
      });

      // After processing, set the worker back to "Idle"
      PubSubManager.updateWorkerStatus({
        workerId,
        status: "Idle",
      });
      previousStatus = "Idle";

      if (intervalId) clearInterval(intervalId);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};
const monitorResources = () => {
  const memoryUsage = process.memoryUsage();
  const freeMemory = os.freemem();
  const totalMemory = os.totalmem();

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

export default startWorker;
