import React from 'react';
import { useSelector } from 'react-redux';

interface Submission {
  taskId: string;
}

const QueueContents: React.FC = () => {

  const queueContents = useSelector((state: { worker: { queueStatus: Submission[] } }) => state.worker.queueStatus);
  console.log(queueContents, "queueContents");
  return (
    <div className=" rounded-md shadow-md w-[80%]  text-center mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-white">Queue </h2>
     
        <ul className='flex items-center gap-4  overflow-x-auto w-full min-h-[4rem] bg-white mx-auto rounded-md'   >
          {queueContents?.map((submission, index) => (
            <li key={index} className="m-2 p-2 bg-white border-2 border-black rounded shadow-sm text-center text-nowrap">
              {submission.taskId}
            </li>
          ))}
        </ul>
    </div>
  );
};

export default QueueContents;