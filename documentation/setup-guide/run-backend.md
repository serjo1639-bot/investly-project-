# Run the Backend

The backend must be running **before** the mobile app.

## 1. Make sure PostgreSQL is running

Start the PostgreSQL service and confirm the `InvestlyDB` database exists
(see [environment-setup](environment-setup.md)).

## 2. Apply database migrations

From the backend folder, create/update the schema:

```bash
cd investly_backendproject
dotnet ef database update
```

This creates all tables (users, projects, investments, wallets, payments,
notifications, …). If you maintain SQL seed files in `database/`, you can also
load `database/seed.sql` for sample data.

## 3. Run the API

```bash
dotnet run
```

You should see it listening on:

```
Now listening on: http://localhost:5231
Now listening on: https://localhost:7201
```

To also accept connections from a physical phone on your LAN:

```bash
dotnet run --urls "http://0.0.0.0:5231"
```

## 4. Verify it works

Open a browser or use curl:

```bash
curl http://localhost:5231/api/projects/featured
```

You should get a JSON `ApiResponse` envelope
(`{ "success": true, "data": [...] }`). If you get data, the API is up.

## Running from Visual Studio

Open `investly_backendproject.sln`, set the project as startup, and press
**F5** (or the green ▶). Use the **http** profile so it serves on `:5231`.

## Notes

- JSON is serialized as **camelCase** — this matches what the mobile app
  expects.
- CORS is enabled (`AllowFrontends`) so the Expo dev client and dashboard can
  call the API.
- Auth uses JWT access + refresh tokens; no extra setup is needed for local dev.

Next: [Run the mobile app](run-mobile-app.md).
