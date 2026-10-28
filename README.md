# Surplus Food Donation Network

A beginner-friendly full-stack project that helps donors list surplus food and lets community members request available donations.

## Technologies
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js and Express.js
- Database: Supabase PostgreSQL

## Features
- View available food donations
- Add a food donation
- Filter donations by food type
- Request a donation
- Basic dashboard counters
- Server-side input validation
- Supabase database integration

> This is a learning/demo MVP. Before public deployment, add user authentication, authorization, spam protection, stricter food-safety workflows, and moderation.

## 1. Install prerequisites
1. Install Node.js LTS from https://nodejs.org/
2. Create a Supabase account at https://supabase.com/
3. Open this folder in VS Code.

Check Node and npm in a new VS Code terminal:
```bash
node --version
npm.cmd --version
```
On macOS/Linux, use `npm --version`.

## 2. Create the Supabase database
1. Open your Supabase project.
2. Select **SQL Editor**.
3. Click **New query**.
4. Open `database/schema.sql` from this project and copy all its contents into the SQL editor.
5. Click **Run**.

## 3. Configure environment variables
1. In the Supabase dashboard, open **Project Settings → API** (the label may appear as **API Keys** in some dashboard versions).
2. Copy the Project URL.
3. Copy the **service_role** secret key. Do not share it or put it in frontend files.
4. In this project folder, make a copy of `.env.example` and name the copy `.env`.
5. Replace the example values in `.env`:
```env
PORT=3000
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```
Keep `.env` private. Never upload it to GitHub or send it in screenshots. The service role key bypasses Row Level Security and must only be used by the backend.

## 4. Install packages
In VS Code, choose **Terminal → New Terminal**. Make sure the terminal is at the project root (the folder containing `package.json`). Run:
```bash
npm install
```
If Windows says `npm` is not recognized but `npm.cmd` works, use:
```powershell
npm.cmd install
```

## 5. Start the server
From the project root, run:
```bash
npm run dev
```
Or:
```bash
npm start
```
You should see a message that the server is running on `http://localhost:3000`.

Open http://localhost:3000 in your browser. Express serves the frontend and API from the same local server.

## 6. Troubleshooting
- **Missing Supabase environment variables:** confirm `.env` is in the same folder as `package.json`, not inside `backend` or `frontend`.
- **Cannot find package/module:** run `npm install` from the project root.
- **Database relation/table missing:** rerun `database/schema.sql` in the correct Supabase project's SQL Editor.
- **Invalid API key / fetch errors:** check the URL and service role key in `.env`; restart the server after changing it.
- **Port already in use:** change `PORT=3001` in `.env`, then open `http://localhost:3001`.
- **`npm run check`:** runs syntax checks only; it does not start the app or check Supabase connectivity.

## Project structure
```text
surplus-food-donation-network/
├── backend/
│   ├── server.js
│   └── routes/
│       ├── donations.js
│       └── requests.js
├── database/
│   └── schema.sql
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## API endpoints
- `GET /api/health` — server status
- `GET /api/donations` — list available donations
- `POST /api/donations` — create a donation
- `POST /api/requests` — request a donation
- `GET /api/stats` — dashboard counts

## Important safety notes
This demo does not verify donor identity, recipient identity, food temperature, allergen details, or whether a listing is safe to consume. Only list food that can be safely donated, provide accurate pickup details, and follow local food-safety rules. Add authentication and access controls before using real personal information or launching publicly.
