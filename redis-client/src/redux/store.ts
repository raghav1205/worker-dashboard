// src/redux/store.js

import { configureStore } from '@reduxjs/toolkit';
import workerReducer from './workerSlice';

const store = configureStore({
  reducer: {
    worker: workerReducer,
  },
});

export default store;
