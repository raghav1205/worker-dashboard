// src/redux/workerSlice.js

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WorkerStatuses } from "../types/types";
import { WorkerState } from "../types/types";
import {QueueStatus} from "../types/types";

const initialState: WorkerState = {
  workerStatuses: [],
  queueStatus:[],
};



const workerSlice = createSlice({
  name: "worker",
  initialState,
  reducers: {
    setWorkerStatuses: (state, action: PayloadAction<WorkerStatuses[]>) => {
      const filteredStatuses = action.payload.filter(w => w.status !== "Dead");
      state.workerStatuses = filteredStatuses
    },
    updateWorkerStatus: (state, action: PayloadAction<WorkerStatuses[]>) => {
     
      state.workerStatuses = action.payload
        .sort((a, b) => parseInt(a.workerId) - parseInt(b.workerId))
        .sort((a, b) => (a.status === "Processing" ? -1 : 1));
    },
    setQueueStatus: (state, action: PayloadAction<QueueStatus[]>) => {

        state.queueStatus = action.payload.filter((q) => q.status === "Pending");

    },
  },
});

export const { setWorkerStatuses, updateWorkerStatus, setQueueStatus } =
  workerSlice.actions;
export default workerSlice.reducer;
