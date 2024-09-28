// src/hooks/useSocket.js

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateWorkerStatus, setQueueLength } from "../redux/workerSlice.ts";

const WEBSOCKET_URL = "ws://worker.multiplayerbackend.tech"; 

function useSocket() {
  const dispatch = useDispatch();

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      console.log(data);
      if (data.type === "queueStatus") {
        dispatch(setQueueLength(data.data.queueLength));
      } else if (data.length !== undefined) {
        dispatch(setQueueLength(data.queueStatus.length));
      } else {
        dispatch(updateWorkerStatus(data));
      }
    };

    return () => ws.close();
  }, [dispatch]);
}

export default useSocket;
