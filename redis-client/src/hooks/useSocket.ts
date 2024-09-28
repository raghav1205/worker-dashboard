// src/hooks/useSocket.js

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateWorkerStatus, setQueueLength } from "../redux/workerSlice.ts";

const WEBSOCKET_URL = "wss://worker.multiplayerbackend.tech"; 

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
    
    setInterval(() => {
      ws.send(JSON.stringify({ type: "keep-alive", timestamp: Date.now() }));
    }, 30000);

    return () => ws.close();
  }, [dispatch]);
}

export default useSocket;
