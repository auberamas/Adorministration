# Adorministration - Dormitory Management System

Vue (Vite) + Node/Express + MySQL.

## Description
The application is a system to manage a dormitory involving 4 type of actors:
### The student
- Can view profile
- Can request one room
- Must wait for admin approval
- Must confirm payment after approval
- Can request interventions

### The receptionist
- Can request interventions
- Can record behavior penalties

### The service
Can accept / reject / complete interventions

### Administrator
- Sees rooms overview (occupancy and behavior score)
- Accepts or rejects room requests

## Install
### Backend
Open the terminal in vs code and enter the following:
```
cd dormitory-management-system\server
npm install
copy .env.example .env
```
Goes to the .env (not .env.example) and the init-db.js files and set : DB_PASSWORD

Initialize the database and lauch the server:
```
npm run db:init
npm run dev
```
Backend should print: `API listening on http://localhost:4000`

### Frontend
Open a new terminal znd enter the following:
```
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