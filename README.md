**Worker Dashboard** </br>
A real-time dashboard application for monitoring worker tasks and statuses, built with a Pub/Sub architecture using Redis and WebSockets. The app manages task queues, worker status updates, and real-time communication with the frontend.

**Features**</br>
Pub/Sub Architecture: Utilizes Redis for Pub/Sub to manage tasks between the queue and multiple workers.</br>
Real-time Worker Status Monitoring: Workers communicate their status to the primary process, which broadcasts updates to all workers and clients via WebSocket..</br>
Task Queue Management: Task submission and processing through Redis with a maximum queue length of 20 items for optimized handling..</br>
Dynamic Worker Dashboard: A real-time, visually appealing UI built with React to monitor worker performance, task processing, and status updates..</br>
Dockerized Deployment: Containerized with Docker for scalability and ease of use, integrated with CI/CD pipelines using GitHub Actions..</br>

**Tech Stack**</br>
Frontend: React.js</br>
Backend: TypeScript, Node.js</br>
Task Queue: Redis</br>
Real-time Communication: WebSocket</br>
Containerization: Docker, Docker Compose</br>

**Usage**</br>
Submit tasks to the dashboard to be processed by workers.</br>
Monitor the real-time status of each worker, including task progress and health.</br>
The queue is limited to 20 items to maintain system stability and prevent overload.</br>


![Screenshot (79)](https://github.com/user-attachments/assets/2f8f640b-1a7d-4002-a5f9-f9f21d39040b)
![Screenshot (80)](https://github.com/user-attachments/assets/020ea0cd-d05a-4a2d-bc8a-e202d0f625ea)
