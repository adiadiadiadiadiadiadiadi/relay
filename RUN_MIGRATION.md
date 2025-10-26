# Run Database Migration - Correct Command

The migration file is in the src/server directory. Run this:

```bash
cd src/server
railway mysql < setup_database.sql
```

Or from project root:

```bash
cd src/server && railway mysql < setup_database.sql
```

## Alternative: Use Railway Console

If the file redirection doesn't work, use the MySQL console:

```bash
railway mysql
```

Then inside the MySQL console:

```sql
source setup_database.sql;
exit;
```

## Verify It Worked

After running the migration, check tables exist:

```bash
railway mysql
```

Then in MySQL:
```sql
SHOW TABLES;
```

You should see: users, jobs, wallets, conversations, messages, notifications

