# Adorministrator
Project of Web programming and Object-oriented Analysis & Design with UML, I1-S5  


## Introduction 
For this new school semester, we EFREI students arrived in China to study at SEU. 
To support our stay, we were provided with apartments in a dormitory. 
Several months later, as part of this UML course, we were assigned a project requiring us to design a system. 
This led us to propose a dormitory management system as a way to give back by creating a solution that could help SEU manage its dormitory services more efficiently.
And so, we created this program allowing you to launch a website to manage a school dormitory and the information related to the people involved in this dormitory.

## Usage
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

## Features
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
  




You now know how to launch the website and what to do with it.
We hope you will like it :)



## Authors
Lélia GHEZALI, Sophie JAFFAL, Aube RAMASSAMY
