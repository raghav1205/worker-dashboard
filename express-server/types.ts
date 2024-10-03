export interface WorkerStatus {
  workerId: number;
  taskId?: string;
  status: string;
  timeRemaining?: number;
  workerResources?: any;
}
export interface QueueStatus {
  taskId: string;
  status: string;
}
