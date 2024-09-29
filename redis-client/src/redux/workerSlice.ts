// src/redux/workerSlice.js

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WorkerStatuses } from "../types/types";
import { WorkerState } from "../types/types";

const initialState: WorkerState = {
  workerStatuses: [],
  queueStatus: [],
};

const workerSlice = createSlice({
  name: "worker",
  initialState,
  reducers: {
    setWorkerStatuses: (state, action: PayloadAction<WorkerStatuses[]>) => {
      const filteredStatuses = action.payload.filter(w => w.status !== "Dead");
      state.workerStatuses = filteredStatuses
    },
    updateWorkerStatus: (state, action: PayloadAction<WorkerStatuses>) => {
      let updatedStatus = action.payload
      const workerIndex = state.workerStatuses.findIndex(
        (w) => w.workerId === updatedStatus.workerId
      );
      if (workerIndex > -1 && updatedStatus.status !== "Dead") {

        state.workerStatuses[workerIndex] = updatedStatus;
      } else {

        state.workerStatuses.push(updatedStatus);
      }
    },
    setQueueStatus: (state, action: PayloadAction<string>) => {
      // if (action.payload.length > 0) {
        console.log("setting queue status:", action.payload);
        console.log("setting queue status:", action.payload);
        state.queueStatus.push(...action.payload);
      // }
    },
  },
});

export const { setWorkerStatuses, updateWorkerStatus, setQueueStatus } =
  workerSlice.actions;
export default workerSlice.reducer;
