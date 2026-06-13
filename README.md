# TaskFlow

A task management app built on the MEAN stack (MongoDB, Express, Angular, Node). Users sign in, create and track tasks, and work inside a role based hierarchy — Manager, Team Lead and Employee — each with a different view of the board. Task changes show up live across connected clients over WebSockets.

The frontend is an Angular 21 dashboard (standalone components, signals, Tailwind) with a dark theme. The backend is an Express API with JWT auth stored in an httpOnly cookie.

## What it does

- **Accounts & auth** — register with username, email and password and sign in. The JWT is kept in an httpOnly cookie, so the browser handles it and page scripts never touch the token.
- **Three roles**
  - **Employee** — creates and edits their own tasks; anything they create is assigned to them automatically. They only see their own work.
  - **Team Lead** — sees their own tasks plus their team members' tasks, and can assign work to those members.
  - **Manager** — sees every task in the organisation, can assign to anyone, and manages the org chart by putting employees under team leads.
- **Tasks** — create, edit, delete, and mark complete (status flips between *pending* and *completed* from the card, not a dropdown). Filter by status, sort by date, and — for managers and team leads — filter the board down to a specific person.
- **Team management** — on the Team page a manager sees two groups (team leads and employees) and can open a team lead's card to multi-select which employees report to them.
- **Live updates** — creating, editing or deleting a task is pushed over Socket.IO to everyone who should see it, so boards stay in sync without a refresh.

## Tech

- **Frontend:** Angular 21 (standalone, zoneless, signals), Tailwind CSS, Socket.IO client
- **Backend:** Node + Express, Mongoose, Socket.IO, JWT, bcrypt
- **Database:** MongoDB (works great with a free MongoDB Atlas cluster)
- **Hardening:** httpOnly cookie auth, helmet, rate limiting, express-validator

## Project layout

```
Task-Management-Application/
├── server/                 Express API + Socket.IO
│   ├── server.js           http server + socket bootstrap
│   └── src/
│       ├── config/         Mongoose connection
│       ├── models/         User, Task schemas
│       ├── middleware/     auth (cookie/JWT), role authorization, validation, rate limit, errors
│       ├── services/       scope.js — who can see/assign/access what
│       ├── controllers/    auth, user, task handlers
│       ├── routes/         API routes
│       ├── socket.js       real-time task events
│       └── seed.js         demo users + tasks
└── client/                 Angular app
    └── src/app/
        ├── core/           services, guards, interceptor, models
        └── features/
            ├── auth/        login, register
            ├── dashboard/   sidebar + header shell, role-based nav
            ├── tasks/       task board
            └── users/       team page
```

## Running it locally

You'll need **Node 20.19+** (Angular 21 requires it), **npm**, and a **MongoDB** connection string — a free [Atlas](https://www.mongodb.com/atlas) cluster is the easiest, or a local `mongod`.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and fill in your values:

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/task_management
JWT_SECRET=use-a-long-random-string-here
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:4200
DNS_SERVERS=8.8.8.8,1.1.1.1
```

A couple of notes:
- The app always uses the `task_management` database, so the path in the URI is optional.
- `DNS_SERVERS` is only needed if your network can't resolve a `mongodb+srv` address (a common home-router/ISP quirk). It points Node at public DNS. Leave it out for a local `mongod`.

Load the demo data and start the API:

```bash
npm run seed     # optional, but gives you accounts to log in with
npm run dev      # or: npm start  -> http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
npm start        # -> http://localhost:4200
```

In development the Angular app talks to the API at `http://localhost:5000`, set in `client/src/environments/environment.ts`. If you run the backend on a different port, change `apiUrl` there to match.

### Running it as a single app

For a production-style run, build the Angular app and let Express serve it — everything ends up on one URL, no CORS:

```bash
cd client && npm install && npm run build
cd ../server && npm install && npm start
# open http://localhost:5000
```

## Demo accounts

After `npm run seed`, all of these use the password **`password123`**:

| Role      | Email                                   |
| --------- | --------------------------------------- |
| Manager   | manager@demo.com                        |
| Team Lead | alice@demo.com, bob@demo.com            |
| Employee  | charlie@demo.com, dave@demo.com, erin@demo.com |

Registration always creates an **Employee** (and enforces a stronger password — at least 8 characters with an uppercase, lowercase, number and symbol). Managers and Team Leads come from the seed, so use the accounts above to explore those roles. The seed wires up the hierarchy too (charlie/dave under alice, erin under bob).

> Heads up: `npm run seed` clears all existing users and tasks before inserting the demo set, so don't run it if you have data you want to keep.

## API

All `/api/users` and `/api/tasks` routes require a valid auth cookie.

| Method | Endpoint              | What it does                                      |
| ------ | --------------------- | ------------------------------------------------- |
| POST   | `/api/auth/register`  | Sign up (creates an Employee), sets the cookie    |
| POST   | `/api/auth/login`     | Sign in, sets the httpOnly cookie                 |
| POST   | `/api/auth/logout`    | Clear the cookie                                  |
| GET    | `/api/auth/me`        | Current user — used to validate the session       |
| GET    | `/api/users`          | Users in your scope (Manager: all, Lead: their team) |
| GET    | `/api/users/assignable` | People you're allowed to assign tasks to        |
| PUT    | `/api/users/team`     | Assign employees to a team lead (Manager only)    |
| GET    | `/api/tasks`          | Tasks you can see                                 |
| POST   | `/api/tasks`          | Create a task                                     |
| PUT    | `/api/tasks/:id`      | Update, toggle status, or reassign                |
| DELETE | `/api/tasks/:id`      | Delete a task                                     |

## Real-time

The Socket.IO connection authenticates with the same httpOnly cookie used by the API. On every task change the server emits `task:created`, `task:updated` or `task:deleted` to the people involved (assignee, creator, and up the chain to their team lead and manager), and the client refreshes that board.

## Security notes

- The token lives in an httpOnly, SameSite cookie (Secure over HTTPS), so it isn't reachable from JavaScript — that closes off token theft via XSS.
- Passwords are bcrypt-hashed and never sent back in a response.
- Every protected route checks the role and scopes data so users can't read or change work outside their permission.
- `helmet` adds the usual security headers, auth routes are rate limited against brute force, and express-validator rejects bad input (including NoSQL operator injection on login).
- On the client, a 401 from the API logs the user out and redirects to login.

## Deployment

In production Express serves the built Angular files, so the app runs as one web service with MongoDB Atlas behind it. A `render.yaml` blueprint is included for [Render](https://render.com):

1. Push the repo to GitHub.
2. On Render pick **New → Blueprint** and select the repo — it reads `render.yaml`.
3. Set `MONGO_URI` to your Atlas connection string (`JWT_SECRET` is generated for you).
4. Deploy. The build compiles the client and installs the server, then `npm start` serves the API and the app from a single URL.

For any other host: build with `cd client && npm install && npm run build && cd ../server && npm install`, start with `cd server && npm start`, and set `MONGO_URI` and `JWT_SECRET`. Remember to allow the host's IP (or `0.0.0.0/0`) in Atlas Network Access.
