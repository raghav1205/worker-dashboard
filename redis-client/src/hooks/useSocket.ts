// src/hooks/useSocket.js

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateWorkerStatus, setQueueStatus } from "../redux/workerSlice.ts";
import toast from "react-hot-toast";

const WEBSOCKET_URL = `wss://${import.meta.env.VITE_BACKEND_URL}`;
// const WEBSOCKET_URL = `ws://localhost:3000`;

function useSocket() {
  const dispatch = useDispatch();

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      // console.log("data:", data);
      if (data.type === "workerStatus") {
        // console.log("workerStatus:", data);
        dispatch(updateWorkerStatus(data.workerStatuses));
      } 
     
      else if (data.type === "queueStatus") {
        // console.log("queueStatus:", data.data.queueStatus);
     
          console.log("queueStatus:", data.queueStatus);
          dispatch(setQueueStatus(data.queueStatus));
        
      } 
      
      else if (data.type === "error"){
        toast.error(data.message);
      }
    };
     
    setInterval(() => {
      ws.send(JSON.stringify({ type: "keep-alive", timestamp: Date.now() }));
    }, 30000);

    return () => ws.close();
  }, [dispatch]);
}

export default useSocket;
