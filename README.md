# AssessInventory

## Quick Start

### 1. Backend Setup
1.  Navigate to the server directory: `cd server`
2.  Install dependencies: `npm install`
3.  Create a `.env` file with your MongoDB URI:
    ```env
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret_key
    PORT=5000
    FRONTEND_URL=http://localhost:3000
    ```
4.  Start the server:
    ```bash
    npm start
    ```
    *You should see "Server running on port 5000" and "MongoDB Connected".*

### 2. Frontend Setup
1.  Navigate to the client directory: `cd client`
2.  Install dependencies: `npm install`
3.  Create a `.env.local` file:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:5000
    ```
4.  Start the frontend:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000).

---

## Troubleshooting "Network Error"

If you see a **Network Error** when logging in:

1.  **Check if the Backend is Running**:
    -   Ensure you have a terminal open running the `server` (`npm start`).
    -   It should say `Server running on port 5000`.

2.  **Check Port Configuration**:
    -   Frontend expects backend at `http://localhost:5000`.
    -   If your backend is running on a different port, update `client/.env.local`.

3.  **Check Database Connection**:
    -   If the backend crashes immediately, check your `MONGO_URI` in `server/.env`.
