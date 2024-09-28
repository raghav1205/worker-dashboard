// src/redux/workerSlice.js

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorkerStatuses } from '../types/types';
import { WorkerState } from '../types/types';

const initialState: WorkerState = {
  workerStatuses: [],
  queueLength: 0,
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
    setQueueLength: (state, action: PayloadAction<number>) => {
      state.queueLength = action.payload;
    },
  },
});

export const { setWorkerStatuses, updateWorkerStatus, setQueueLength } = workerSlice.actions;
export default workerSlice.reducer;
