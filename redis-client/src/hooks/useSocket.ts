// src/hooks/useSocket.js

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateWorkerStatus, setQueueStatus } from "../redux/workerSlice.ts";

const WEBSOCKET_URL = `wss://${import.meta.env.VITE_BACKEND_URL}`;

function useSocket() {
  const dispatch = useDispatch();

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      // console.log(data);
     
      if (data.type === "queueStatus") {
        // console.log("queueStatus:", data.data.queueStatus);
        if (data.data.queueStatus.length > 0) {
          console.log("queueStatus:", data.data.queueStatus);
          dispatch(setQueueStatus(data.data.queueStatus));
        }
      } 
       else if (data.hasOwnProperty("workerId")) {
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
