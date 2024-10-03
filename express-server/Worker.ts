// import PubSubManager from "./PubSubManager";
import cluster from "cluster";
import os from "os";
import process from "process";
import { RedisClientType, createClient } from "redis";

const simulateMemoryFluctuation = () => {
  let memoryHog: any = [];

  const memoryIncrease = setInterval(() => {
    memoryHog.push(new Array(1e6).fill("*"));
    // console.log(`Memory increased, current size: ${memoryHog.length} MB`);

    // Stop increasing after reaching 100MB
    if (memoryHog.length >= 100) {
      clearInterval(memoryIncrease);
      // console.log("Reached maximum memory usage");
    }
  }, 500); // Increase memory every 500ms

  // Simulate memory release
  const memoryRelease = setInterval(() => {
    const releaseSize = Math.floor(Math.random() * 10) + 1;
    memoryHog.splice(0, releaseSize);
    // console.log(`Memory released, current size: ${memoryHog.length} MB`);

    // Stop releasing after memory has been freed completely
    if (memoryHog.length <= 0) {
      clearInterval(memoryRelease);
      // console.log("Memory fully released");
    }
  }, 1000); // Release memory every 1000ms
};
// Simulate fluctuating resource usage during task processing
const startWorker = async () => {
  const redisClient: RedisClientType = createClient({
    url: "redis://localhost:6379",
  });
  await redisClient.connect();

  let previousStatus = "Idle";
  const workerId = cluster.worker?.process.pid;
  if (workerId) {
    if (process.send) {
      process.send({
        type: "workerStatus",
        data: { workerId, status: "Not started" },
      });
    }
  }

  while (true) {
    const workerId = cluster.worker?.process.pid;
    let intervalId = null;
    let taskStartTime: number = 0;
    let taskEndTime: number = 0;

    if (previousStatus !== "Idle" && workerId) {
      if (process.send) {
        process.send({
          type: "workerStatus",
          data: { workerId, status: "Idle" },
        });
      }
      previousStatus = "Idle";
    }

    const result = await redisClient.brPop("submissions", 0);
    const submission = result ? result.element : null;

    if (submission) {
      console.log("Processing submission:", submission);

      if (previousStatus !== "Processing" && workerId) {
        const taskId = JSON.parse(submission).taskId;
        previousStatus = "Processing";
        taskEndTime = Math.floor(Math.random() * 10000) + 1000;

        intervalId = setInterval(() => {
          const timeElapsed = Date.now() - taskStartTime;
          const timeRemaining = Math.floor(taskEndTime - timeElapsed);

          if (process.send) {
            process.send({
              type: "workerStatus",
              data: {
                workerId,
                taskId,
                status: "Processing",
                workerResources: monitorResources(),
                timeRemaining,
              },
            });
            process.send({
              type: "queueStatus",
              data: { taskId, status: "Processing" },
            });
          }
        }, 1000);
      }

      try {
        await new Promise((resolve) => {
          taskStartTime = Date.now();
          setTimeout(resolve, taskEndTime);
        });
      } catch (error) {
        console.log(error, "promise error");
        if (workerId) {
          if (process.send) {
            process.send({
              type: "workerStatus",
              data: { workerId, status: "Dead" },
            });
          }
        }
      }

      console.log("Task completed:", JSON.parse(submission).taskId);
      if (process.send) {
        process.send({
          type: "queueStatus",
          data: { taskId: JSON.parse(submission).taskId, status: "Completed" },
        }); 
        process.send({
            type: "workerStatus",
            data: { workerId, status: "Idle" },
          });
      }
    } else {
      // After processing, set the worker back to "Idle"
      if (workerId) {
        console.log("Worker is idle now");
        if (process.send) {
         
        }
      }
    }
    previousStatus = "Idle";

    if (intervalId) clearInterval(intervalId);

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
