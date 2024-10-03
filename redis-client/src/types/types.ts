export interface CpuUsage {
  userCpuTime: number;
  systemCpuTime: number;
}

export interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
}

export interface WorkerResources {
  cpuUsage: CpuUsage;
  freeMemory: number;
  totalMemory: number;
  memoryUsage: MemoryUsage;
}

export interface WorkerStatuses {
  workerId: string;
  status: string;
  taskId?: string;
  timeRemaining?: number;
  workerResources?: WorkerResources;
}

export interface WorkerState {
  workerStatuses: WorkerStatuses[];
  queueStatus: QueueStatus[];
}

export interface QueueStatus {
  taskId: string;
  status: string;
}
