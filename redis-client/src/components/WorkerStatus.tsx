interface WorkerProps {
  workerStats: WorkerStatus;
}

interface WorkerStatus {
 
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

const WorkerStatus = ({ workerStats }: WorkerProps) => {
    console.log(workerStats,'workerStats')
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
         <div className="mb-2">
            <p className="text-gray-700 font-semibold">Free Memory:</p>
            <p className="text-indigo-600">
              {(workerStats?.freeMemory / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>

          <div className="mb-2">
            <p className="text-gray-700 font-semibold">Total Memory:</p>
            <p className="text-indigo-600">
              {(workerStats?.totalMemory / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
     
        <div
     
          className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
        >
         

          <div className="mb-2">
            <p className="text-gray-700 font-semibold">CPU Usage:</p>
            <p className="text-indigo-600">
              {workerStats?.cpuUsage?.join(", ")} (1min, 5min, 15min avg)
            </p>
          </div>

         

          <div className="mb-2">
            <p className="text-gray-700 font-semibold">Memory Usage:</p>
            <ul className="text-indigo-600 list-disc list-inside">
              <li>
                RSS: {(workerStats.memoryUsage?.rss / (1024 * 1024)).toFixed(2)} MB
              </li>
              <li>
                Heap Total:{" "}
                {(workerStats.memoryUsage?.heapTotal / (1024 * 1024)).toFixed(2)} MB
              </li>
              <li>
                Heap Used:{" "}
                {(workerStats.memoryUsage?.heapUsed / (1024 * 1024)).toFixed(2)} MB
              </li>
              <li>
                External:{" "}
                {(workerStats.memoryUsage?.external / (1024 * 1024)).toFixed(2)} MB
              </li>
            </ul>
          </div>
        </div>

    </div>
  );
};

export default WorkerStatus;
