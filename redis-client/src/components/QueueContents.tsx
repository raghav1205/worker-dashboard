// QueueContents.tsx
import React, { useState, useEffect } from 'react';

interface Submission {
  taskId: string;
}

const QueueContents: React.FC = () => {
  const [queueContents, setQueueContents] = useState<Submission[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000'); // Adjust to your server URL

    ws.onopen = () => {
      console.log('Connected to WebSocket');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('message:', message);
      if (message.type === 'queueStatus') {
       
        console.log('queueStatus:', message.data );
        setQueueContents(message.data.queueStatus);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="p-4 bg-gray-50 rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4">Queue Contents</h2>
      {queueContents?.length === 0 ? (
        <p>No submissions in queue.</p>
      ) : (
        <ul className='flex '>
          {queueContents?.map((submission, index) => (
            <li key={index} className="mb-2 p-2 bg-white border-2 rounded shadow-sm">
              {submission.taskId}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default QueueContents;