# Adorministration - Dormitory Management System

Vue (Vite) + Node/Express + MySQL.

## Description
The application is a stystem to manage a dormitory involving 4 types of actors:
### Student
- Can view profile
- Can request one room
- Must wait for admin approval
- Must confirm payment after approval
- Can request interventions

### Receptionist
- Can request interventions
- Can record behavior penalties

### Service
Can accept / reject / complete interventions

### Administrator
- Sees rooms overview (occupancy and behavior score)
- Accepts or rejects room requests

## Install
### Backend
1. Open the terminal in vs code and enter the following:
```
cd dormitory-management-system\server
npm install
copy .env.example .env
```
Edit .env and init-db.js files and set :
- DB_PASSWORD

Initialize the database and lauch the server:
```
npm run db:init
npm run dev
```
Backend should print: `API listening on http://localhost:4000`

### Frontend
Open a new terminal for the frontend and enter the following:
cd dormitory-management-system\client
npm install
copy .env.example .env
npm run dev
```

Frontend runs on : `http://localhost:5173`

## Seeded accounts
| Role          | Username   | Password |
| ------------- | ---------- | -------- |
| Student       | student1   | pass1234 |
| Student       | ...        | pass1234 |
| Student       | student10  | pass1234 |
| Receptionist  | reception1 | pass1234 |
| Service       | service1   | pass1234 |
| Administrator | admin1     | pass1234 |

## Health checks
- http://localhost:4000/health
- http://localhost:4000/

##