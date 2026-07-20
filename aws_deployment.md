# AWS Deployment Guide for StudyGenius AI

This document provides step-by-step instructions to deploy the StudyGenius AI platform using Amazon Web Services (AWS). We will use **AWS App Runner** for both the frontend and backend services, **Amazon RDS** for the PostgreSQL database, and **Amazon ECR** to store our Docker images.

## Architecture Overview
- **Database**: Amazon RDS (PostgreSQL)
- **Vector Database**: EC2 Instance running ChromaDB (or hosted Chroma)
- **Backend API**: AWS App Runner (Docker container)
- **Frontend App**: AWS App Runner (Docker container)
- **Container Registry**: Amazon ECR

---

## Step 1: Push Docker Images to Amazon ECR

1. **Authenticate Docker to your ECR registry**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
   ```

2. **Create ECR Repositories**:
   ```bash
   aws ecr create-repository --repository-name studygenius-backend
   aws ecr create-repository --repository-name studygenius-frontend
   ```

3. **Build and Tag Images**:
   ```bash
   # Backend
   docker build -t studygenius-backend ./backend
   docker tag studygenius-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/studygenius-backend:latest

   # Frontend
   docker build -t studygenius-frontend ./frontend
   docker tag studygenius-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/studygenius-frontend:latest
   ```

4. **Push Images**:
   ```bash
   docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/studygenius-backend:latest
   docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/studygenius-frontend:latest
   ```

---

## Step 2: Set up Database (Amazon RDS)

1. Navigate to the AWS RDS Console.
2. Click **Create database** -> **PostgreSQL**.
3. Set the Master username and Master password.
4. Make sure it is publicly accessible (if your App Runner doesn't use a VPC) or properly configured in a VPC.
5. Note the endpoint URL.

*Note: For ChromaDB, since it's stateful, deploy a small EC2 instance running the `chromadb/chroma` docker image.*

---

## Step 3: Deploy Backend on AWS App Runner

1. Navigate to **AWS App Runner** in the console.
2. Click **Create an App Runner service**.
3. Choose **Container registry** -> **Amazon ECR**.
4. Browse and select your `studygenius-backend` image.
5. In **Service settings**, add the following Environment Variables:
   - `DATABASE_URL` (Your RDS URL)
   - `CHROMA_HOST` (Your EC2 Chroma IP)
   - `CHROMA_PORT` (8000)
   - `OPENAI_API_KEY` (Your OpenAI Key)
   - `SECRET_KEY` (A secure random string)
6. Set the port to `8000`.
7. Click **Create & deploy**.

---

## Step 4: Deploy Frontend on AWS App Runner

1. Before deploying the frontend, update the `VITE_API_BASE_URL` to point to the new Backend App Runner URL. You might need to rebuild and push the frontend image with this new URL.
   *Alternatively, if using SSR or specific Vite setups, pass it as an environment variable in App Runner.*
2. Create another App Runner service.
3. Select the `studygenius-frontend` image from ECR.
4. Set the port to `5173` (or `80` if you updated the Dockerfile for production build with Nginx).
5. Click **Create & deploy**.

---

## Step 5: Configure Custom Domains & HTTPS

AWS App Runner automatically provides HTTPS endpoints for both your services.
To map a custom domain (e.g., `app.studygenius.ai`):
1. Go to the Custom Domains tab in your App Runner service.
2. Add your domain and add the provided CNAME records to your DNS provider (Route 53, Cloudflare, etc.).

Your StudyGenius AI application is now production-ready on AWS!
