# Idle No More - Time Tracking System

A comprehensive time tracking solution similar to Insightful/Hubstaff, built with Django backend, React dashboard, and Electron desktop app.

## Project Overview

Idle No More is a time tracking system designed for remote teams and hourly contractors. It provides real-time monitoring, screenshot capture, and comprehensive reporting to ensure productivity and prevent time fraud. The system consists of three main components that work together to provide a complete time tracking solution.

## Components

### 1. Backend API (Django)
The core API server built with Django REST Framework that handles:
- User authentication and authorization (JWT)
- Employee, project, and task management
- Time tracking sessions and heartbeat monitoring
- Screenshot storage and retrieval
- Data analytics and reporting

### 2. Web Dashboard (React)
A React-based web application for administrators that provides:
- User onboarding and account management
- Project and task creation/management
- Real-time analytics and reporting
- Employee performance monitoring
- System configuration and settings

### 3. Desktop App (Electron)
A cross-platform desktop application for employees that offers:
- Secure login and authentication
- Time tracking with start/stop functionality
- Real-time system monitoring (MAC/IP detection)
- Offline capability with data synchronization

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm/yarn

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

**Access:** `http://127.0.0.1:8000/api/`

### 2. Dashboard Setup

```bash
cd dashboard

# Install dependencies
npm install

# Start development server
npm start
```

**Access:** `http://localhost:3000`

### 3. Desktop App Setup

```bash
cd dekstop-app

# Install dependencies
npm install

# Start Electron app
npm start
```

## Quick Start

1. Start the backend server first
2. Create a user account through the Django admin
3. Start the dashboard for admin access
4. Launch the desktop app and login with your credentials
5. Begin time tracking sessions

## Development

- **Backend**: Django REST API with JWT authentication
- **Dashboard**: React with modern UI components
- **Desktop**: Electron with Node.js system integration
- **Database**: PostgreSQL (production)