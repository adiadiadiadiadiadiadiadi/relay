# Stellar Server Setup

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

## Database Setup

1. Make sure MySQL is running
2. Create the `payroll_app` database if it doesn't exist
3. Run the SQL migration:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
```

Or run the provided SQL file:
```bash
mysql -u root -p payroll_app < setup_database.sql
```

## Running the Server

```bash
npm start
```

The server will run on http://localhost:3000

## API Endpoints

### POST /api/auth/signup
Register a new user
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name" // optional
}
```

### POST /api/auth/login
Login with email and password
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Both endpoints return:
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "token": "jwt-token-here"
}
```
