# Run Project

## Frontend

1. Copy `frontend/.env.example` to `frontend/.env` and keep `EXPO_PUBLIC_BACKEND_URL` pointed at the API you want to use.
2. From `frontend`, run `yarn install`.
3. Start the web app with `yarn web`.

The web app is verified at `http://localhost:8081`.

## Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Start a local MongoDB server, or point `MONGO_URL` at an existing MongoDB instance.
3. From `backend`, run `python -m uvicorn server:app --reload --port 8001`.

The backend cannot boot without a working MongoDB connection because `server.py` reads `MONGO_URL`, `DB_NAME`, and `JWT_SECRET` at import time.

## Production Deployment & Configuration

### 1. Database & Mail Setup
1. Copy `backend/production.env.example` to `backend/.env` (or set the equivalent system environment variables).
2. Point `MONGO_URL` to a hosted database (such as MongoDB Atlas).
3. Set the SMTP parameters (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`) to enable real-world asynchronous registration verification email dispatch.

### 2. Frontend Production Build
To export the Expo web application as a static production bundle:
1. Make sure `frontend/.env` points to the correct production server URL.
2. From the `frontend` folder, run:
   ```bash
   npx expo export
   ```
   This compiles and exports your React Native web code into a static web bundle inside the `dist/` directory, which can be deployed directly to Netlify, Vercel, AWS S3, or any static file hosting service.

### 3. Backend Production Execution
For production server hosting:
1. Ensure Python dependencies are installed using:
   ```bash
   pip install -r requirements.txt
   ```
2. Launch the server using a production ASGI server like `uvicorn` (or with `gunicorn` as the process manager):
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
   ```
   *Note:* The `--workers` flag scales the backend to run multiple concurrent processes to handle heavier load, and binding to `0.0.0.0` allows connections from local network interfaces or public reverse proxies.

## Notes

- Expo Doctor is clean after the dependency and config fixes.
- The frontend dependency tree now uses `ws@8.21.0`, which resolves the Expo websocket startup crash seen on the earlier install.
- Android tooling is not installed on this machine (`adb`/`emulator` are unavailable), so Android launch could not be verified here.