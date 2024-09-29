// src/redux/workerSlice.js

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorkerStatuses } from '../types/types';
import { WorkerState } from '../types/types';

const initialState: WorkerState = {
  workerStatuses: [],
  queueStatus: [],
};

const workerSlice = createSlice({
  name: 'worker',
  initialState,
  reducers: {
    setWorkerStatuses: (state, action: PayloadAction<WorkerStatuses[]>) => {
      state.workerStatuses = action.payload;
    },
    updateWorkerStatus: (state, action: PayloadAction<WorkerStatuses>) => {
      const updatedStatus = action.payload;
      const workerIndex = state.workerStatuses.findIndex(
        (w) => w.workerId === updatedStatus.workerId
      );
      if (workerIndex > -1) {
        state.workerStatuses[workerIndex] = updatedStatus;
      } else {
        state.workerStatuses.push(updatedStatus);
      }
    },
    setQueueStatus: (state, action: PayloadAction<string[]>) => {
      state.queueStatus = action.payload;
    },
  },
});

export const { setWorkerStatuses, updateWorkerStatus, setQueueStatus } = workerSlice.actions;
export default workerSlice.reducer;
