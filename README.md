# Student Attendance Tracker QR System

## Requirements

- PHP 8.1+
- Composer
- Node.js 18+
- SQLite (included with PHP)

## Quick Setup

### Windows (`start.bat`)
```
start.bat
```

### Manual Setup

**1. Backend Setup**
```bash
cd backend
composer install
cp .env.example .env    # or .env already configured
php artisan key:generate
php artisan migrate --force --seed
php artisan storage:link
php artisan serve --port=8000
```

**2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

**3. Access**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

## Default Login
- **Email:** teacher@school.com
- **Password:** password

## Architecture

### Backend (Laravel 10 + SQLite)
- REST API with Sanctum token authentication
- QR codes generated as SVG using bacon/bacon-qr-code
- SQLite database optimized for low-resource devices

### Frontend (React + Vite + Tailwind CSS)
- Single-page application with React Router
- QR scanning via html5-qrcode
- Axios for API communication with Bearer token auth

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/login | No | Teacher login |
| POST | /api/logout | Yes | Logout |
| GET | /api/dashboard | Yes | Dashboard stats |
| GET | /api/students | Yes | List/search students |
| POST | /api/students | Yes | Create student |
| GET | /api/students/{id} | Yes | Get student |
| PUT | /api/students/{id} | Yes | Update student |
| DELETE | /api/students/{id} | Yes | Delete student |
| POST | /api/students/bulk-import | Yes | CSV import |
| GET | /api/students/{id}/qr | Yes | Get QR code |
| POST | /api/students/{id}/regenerate-qr | Yes | Regenerate QR |
| GET | /api/qr-codes/all | Yes | All QR codes |
| POST | /api/attendance/scan | Yes | Scan QR attendance |
| GET | /api/attendance/today | Yes | Today's attendance |

## Sample Data
- 1 Teacher (teacher@school.com / password)
- 5 Students with unique QR codes
- Students: Juan Dela Cruz, Maria Santos, Jose Reyes, Ana Luna Gonzales, Pedro Mendoza

## Features
- QR-based attendance scanning with camera
- Duplicate scan prevention (one scan per student per day)
- Today-only attendance reporting
- Student CRUD with CSV bulk import
- QR code generation, download, and bulk print
- Mobile-responsive UI
