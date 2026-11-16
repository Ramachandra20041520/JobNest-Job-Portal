
# JobNest - Job Portal

A full-stack Job Portal application built using React.js, FastAPI, and MySQL.

## Technologies Used

### Frontend
- React.js
- Vite
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- JWT Authentication

### Database
- MySQL

## Features
- User Registration and Login
- JWT Authentication
- Candidate Dashboard
- Recruiter Dashboard
- Job Posting
- Job Management
- Job Listing

## Project Structure

- backend/ - FastAPI backend
- frontend/ - React frontend

## Installation

Clone the repository:

    git clone YOUR_GITHUB_REPOSITORY_URL

### Backend

    cd backend
    python -m venv venv

Activate virtual environment and install dependencies:

    pip install -r requirements.txt

Run:

    uvicorn app.main:app --reload

### Frontend

    cd frontend
    npm install
    npm run dev
