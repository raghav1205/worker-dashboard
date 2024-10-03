import { CpuUsage, MemoryUsage } from "../types/types";

interface WorkerStatusProps {
  cpuUsage: CpuUsage;
  freeMemory: number;
  totalMemory: number;
  memoryUsage: MemoryUsage;
}

interface WorkerProps {
  workerStats: WorkerStatusProps | null;
  timeRemaining: number;
}

const formatBytes = (bytes: number) => {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
};

const formatCpuTime = (time: number) => `${time.toFixed(3)} sec`;

const WorkerStatus = ({ workerStats, timeRemaining }: WorkerProps) => {
  const workerNotReady =
    !workerStats || !workerStats.memoryUsage || !workerStats.cpuUsage;

  const memoryUsage: MemoryUsage = workerStats?.memoryUsage || {
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
  };
  const cpuUsage: CpuUsage = workerStats?.cpuUsage || {
    userCpuTime: 0,
    systemCpuTime: 0,
  };
  const freeMemory = workerStats?.freeMemory || 0;
  const totalMemory = workerStats?.totalMemory || 0;

  const memoryUsagePercent = totalMemory
    ? (((memoryUsage?.heapUsed || 0) / totalMemory) * 100).toFixed(2)
    : "0.00";
  const freeMemoryPercent = totalMemory
    ? ((freeMemory / totalMemory) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="p-4 bg-gray-100 rounded-md shadow-lg">
      <h2 className="text-lg font-bold mb-2">Worker Resource Usage</h2>

      {workerNotReady && (
        <div className="absolute inset-0 bg-gray-500 opacity-50 flex items-center justify-center rounded-md">
          <h2 className="text-lg font-bold text-white"></h2>
        </div>
      )}
      {/* Memory Usage Section */}
      <div className="mb-4">
        <h3 className="text-md font-semibold">Memory Usage</h3>
        <div className="flex justify-between">
          <span>Heap Used:</span>
          <span className="md:min-w-[150px] md:max-w-[200px] text-right font-mono truncate">
            {formatBytes(memoryUsage.heapUsed || 0)} /{" "}
            {formatBytes(memoryUsage.heapTotal || 0)} ({memoryUsagePercent}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span>External Memory:</span>
          <span className="md:min-w-[150px] md:max-w-[200px] text-right font-mono truncate">
            {formatBytes(memoryUsage.external || 0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>RSS:</span>
          <span className="md:min-w-[150px] md:max-w-[200px] text-right font-mono truncate">
            {formatBytes(memoryUsage.rss || 0)}
          </span>
        </div>
        <div className="w-full bg-gray-300 h-2 rounded-full mt-2 ">
          <div
            className="bg-blue-500 h-2 rounded-full ]"
            style={{ width: `${freeMemoryPercent}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Free Memory:{" "}
          <span className="md:min-w-[150px] md:max-w-[200px] text-right font-mono truncate">
            {formatBytes(freeMemory)} ({freeMemoryPercent}% free)
          </span>
        </div>
      </div>

      {/* CPU Usage Section */}
      <div className="mb-4">
        <h3 className="text-md font-semibold">CPU Usage</h3>
        <div className="flex justify-between">
          <span>User CPU Time:</span>
          <span>{formatCpuTime(cpuUsage.userCpuTime || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>System CPU Time:</span>
          <span>{formatCpuTime(cpuUsage.systemCpuTime || 0)}</span>
        </div>
      </div>

      <div>
        <ProgressBar value={timeRemaining} />
      </div>
    </div>
  );
};

const ProgressBar = ({ value }: { value: number }) => {
  const progress = value ? 100 - (value / 10000) * 100 : 0;

  return (
    <div className="mt-4">
      <h3 className="text-md font-semibold">Task Progress</h3>
      <div className="w-full bg-gray-300 h-2 rounded-full mt-2">
        <div
          className="bg-blue-500 h-2 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default WorkerStatus;
