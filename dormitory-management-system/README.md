# Dormitory Management System (Clean, Minimal)

Vue (Vite) + Node/Express + MySQL.

## Install
### Backend
1. Open PowerShell:
```powershell
cd dormitory-management-system\server
npm install
copy .env.example .env
# edit .env and set DB_PASSWORD + JWT_SECRET
npm run db:reset
npm run db:migrate
npm run db:seed
npm run dev
```
Backend should print: `API listening on http://localhost:4000`

### Frontend
```powershell
cd dormitory-management-system\client
npm install
copy .env.example .env
npm run dev
```

## Seeded accounts
- student1 / pass1234
- reception1 / pass1234
- service1 / pass1234
- admin1 / pass1234

## Health checks
- http://localhost:4000/health
- http://localhost:4000/
