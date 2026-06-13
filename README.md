# TaskFlow — Task Management Application (MEAN Stack)

A full stack task management application built with the **MEAN stack** (MongoDB, Express, Angular, Node.js). It supports JWT authentication, role based authorization with a three level organisation hierarchy, full task CRUD, and real time updates over WebSockets.

## Features

- **Authentication** — register and log in with JWT. All task and user routes are protected.
- **Role based authorization** with three roles:
  - **Manager** — sees every user (team leads and employees) and their tasks; can create, modify, reassign and delete tasks for anyone or themselves.
  - **Team Lead** — sees and manages tasks for their own team members or themselves.
  - **Employee** — creates and modifies only their own tasks; new tasks are automatically assigned to them.
- **Task management** — create, read, update, delete, toggle completion, and filter by status (all / pending / completed).
- **Form validation** on both registration and task forms.
- **Real time updates** (bonus) — task changes are pushed live to every relevant user (assignee, creator, their team lead and manager) via Socket.IO.
- **Responsive UI** built with Angular standalone components and signals.

## Tech Stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Frontend | Angular 21 (standalone, signals), SCSS      |
| Backend  | Node.js, Express, Socket.IO                 |
| Database | MongoDB (Mongoose ODM), hosted on Atlas     |
| Auth     | JWT, bcrypt                                 |

## Project Structure

```
Task-Management-Application/
├── server/            Express + MongoDB API
│   └── src/
│       ├── config/        database connection
│       ├── models/        User and Task schemas
│       ├── middleware/    auth, authorization, validation, errors
│       ├── services/      role based access scope rules
│       ├── controllers/   route handlers
│       ├── routes/        API routes
│       ├── socket.js      Socket.IO real time layer
│       └── seed.js        demo data seeder
└── client/            Angular application
    └── src/app/
        ├── core/          services, guards, interceptor, models
        └── features/      auth, tasks, users
```

## Prerequisites

- Node.js 18+ and npm
- A MongoDB database (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works well)

## Getting Started

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and set your values:

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/task_management
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:4200
DNS_SERVERS=8.8.8.8,1.1.1.1
```

> `DNS_SERVERS` is optional. Set it only if your local network cannot resolve the
> `mongodb+srv` SRV record (a common ISP/router issue); it points Node at public DNS.

Seed demo data and start the server:

```bash
npm run seed
npm start
```

The API runs at `http://localhost:5000`.

### 2. Frontend

```bash
cd client
npm install
npm start
```

The app runs at `http://localhost:4200`.

## Demo Accounts

After running `npm run seed`, log in with any of these (password: `password123`):

| Role      | Email             |
| --------- | ----------------- |
| Manager   | manager@demo.com  |
| Team Lead | alice@demo.com    |
| Team Lead | bob@demo.com      |
| Employee  | charlie@demo.com  |
| Employee  | dave@demo.com     |
| Employee  | erin@demo.com     |

## API Overview

| Method | Endpoint                  | Description                          | Access        |
| ------ | ------------------------- | ------------------------------------ | ------------- |
| POST   | `/api/auth/register`      | Register a new user                  | Public        |
| POST   | `/api/auth/login`         | Log in, returns JWT                  | Public        |
| GET    | `/api/auth/managers`      | List managers (registration dropdown)| Public        |
| GET    | `/api/auth/team-leads`    | List team leads (registration)       | Public        |
| GET    | `/api/users`              | List users in scope                  | Manager, Lead |
| GET    | `/api/users/assignable`   | Users this role can assign tasks to  | Authenticated |
| GET    | `/api/tasks`              | List visible tasks (`?status=` filter)| Authenticated |
| POST   | `/api/tasks`              | Create a task                        | Authenticated |
| PUT    | `/api/tasks/:id`          | Update a task                        | Authenticated |
| DELETE | `/api/tasks/:id`          | Delete a task                        | Authenticated |

## Real Time Updates

The backend emits `task:created`, `task:updated` and `task:deleted` events over Socket.IO. Each client authenticates the socket connection with its JWT and joins a personal room. When a task changes, the event is delivered to the assignee, the creator, the assignee's team lead and that team lead's manager, so the list stays in sync across connected clients automatically.

## Deployment

The application is designed to deploy to any Node friendly cloud platform with MongoDB Atlas as the database.

**Backend (Render web service):**
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (the deployed frontend URL)

**Frontend (Render static site / Netlify):**
- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist/client/browser`
- Before building, set `apiUrl` in `src/environments/environment.prod.ts` to the deployed backend URL.

## License

This project was built as a machine test submission.
