# Surplus Food Donation Network

A beginner-friendly full-stack project built with:
- Frontend: HTML5, CSS3, vanilla JavaScript
- Backend: Node.js + Express.js
- Database: Supabase PostgreSQL

Features:
- View food donations from the database
- Add a donation with donor, contact, quantity, food type, pickup location and optional expiry time
- Filter listings by status
- Mark a donation as claimed or completed
- Responsive layout for desktop and mobile

## 1. Install the prerequisites

1. Install the current **Node.js LTS** version from https://nodejs.org/
2. During installation, keep the option to add Node.js to PATH enabled.
3. Restart VS Code/Command Prompt after installation.
4. Confirm installation in a NEW terminal:

   ```bash
   node --version
   npm --version
   ```

If Windows says `node` or `npm` is not recognized, restart the terminal or computer first. If it continues, repair/reinstall Node.js and ensure it is added to PATH.

## 2. Create a Supabase project

1. Visit https://supabase.com/ and sign in.
2. Click **New project** and create a project. Save its database password somewhere safe.
3. Open **SQL Editor** in the Supabase dashboard.
4. Click **New query**.
5. Open `database/schema.sql` from this project, copy the whole file into the SQL Editor, then click **Run**.
6. Open **Project Settings -> API** (or the project's API keys/settings page).
7. Copy the **Project URL** and the **service_role / secret server key**. Never share the service-role key or put it in frontend code.

> Important: This API uses `donor_name` and `donor_contact`. If you already have an old `donations` table with different columns, the API will not match it. For the cleanest first run, use a new Supabase project and run this schema there. Do not blindly drop a table containing data you need.

## 3. Configure the project

1. Extract the ZIP folder.
2. Open the extracted `surplus-food-donation-network` folder in VS Code.
3. In the project root, make a copy of `.env.example` and name the copy `.env`.
   - In VS Code: right-click `.env.example` -> Copy, then right-click blank space -> Paste, then rename the copy to `.env`.
   - Make sure it is named exactly `.env`, not `.env.txt`.
4. Edit `.env` and replace the placeholders:

   ```env
   PORT=3000
   SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=YOUR_REAL_SERVER_KEY
   ```

5. Save the file. Do not add quotes around values and do not upload `.env` to GitHub.

## 4. Install packages and run

Open the VS Code terminal (**Terminal -> New Terminal**) in the project root folder — the folder that contains `package.json`.

Run these commands one at a time:

```bash
npm install
npm run check
npm start
```

Expected terminal message:

```text
Surplus Food Donation Network running at http://localhost:3000
```

Open this address in your browser:

http://localhost:3000

Keep the terminal open while using the website. To stop the server, press `Ctrl + C`.

For auto-restart during development, run `npm run dev` after installing dependencies.

## 5. Quick tests

- Open `http://localhost:3000/api/health`. It should return JSON with `"ok": true`.
- Open `http://localhost:3000/api/donations`. It should return `{ "donations": [] }` when the table is empty and connected.
- Submit a test donation in the website, then confirm it appears in the listing and in Supabase -> Table Editor -> donations.
- Test the status filter and the “Mark as claimed” / “Mark completed” buttons.

## Troubleshooting

### `column donations.donor_name does not exist`
The existing table does not match the API schema. In Supabase -> Table Editor -> `donations`, check the actual columns. Run `database/schema.sql` in a clean/new Supabase project, or carefully migrate your existing table after backing up any data.

### `Could not find the 'donor_contact' column of 'donations' in the schema cache`
The `donor_contact` column is missing or named differently. The API and SQL schema in this ZIP consistently use `donor_contact`. Run the schema in the correct project and make sure `.env` points to that same project.

### `Could not load donations`
Check:
1. The `.env` file is in the project root beside `package.json`.
2. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct.
3. The SQL schema ran successfully in the same Supabase project.
4. Restart the server after editing `.env`.

### `npm run check` says a file cannot be found
Run the command from the project root (the folder containing `package.json`), not from `backend` or `frontend`.

### Port 3000 is already in use
Stop the other server with `Ctrl + C`, or change `PORT=3001` in `.env` and open `http://localhost:3001`.

## Project structure

```text
surplus-food-donation-network/
├── backend/
│   ├── lib/supabase.js
│   ├── routes/donations.js
│   └── server.js
├── database/
│   └── schema.sql
├── frontend/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Security note

This is an educational starter project, not a production-ready donation platform. It uses a server-side service-role key, which bypasses database row-level security. Keep the key secret, deploy only over HTTPS, and add user authentication/authorization and stricter rate limits before public deployment. The “claim” action is intentionally a simple classroom demo and is not protected by user accounts.
