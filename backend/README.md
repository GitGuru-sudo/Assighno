# Backend

Express API, Telegram bot, BullMQ queue, and AI worker for the assignment assistant MVP.

## Environment

Copy `.env.example` to `.env` and fill in:

- MongoDB Atlas connection string
- Redis URL
- Firebase Admin credentials
- Telegram bot token
- OpenRouter API key

## Local Run

```bash
npm install
npm run dev
```

## Cloud Run Deployment

1. Build and push the image:

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/assignment-assistant-backend
```

2. Deploy to Cloud Run:

```bash
gcloud run deploy assignment-assistant-backend \
  --image gcr.io/PROJECT_ID/assignment-assistant-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --max-instances 1
```

3. Set all environment variables in Cloud Run and make sure Redis and MongoDB Atlas allow Cloud Run egress.

4. For GitHub auto deploy, create a Cloud Build GitHub trigger pointed at `backend/`.

## API Summary

- `GET /health`
- `POST /api/auth/sync`
- `GET /api/users/me`
- `POST /api/users/linking-code`
- `GET /api/assignments`
- `GET /api/assignments/:assignmentId`
