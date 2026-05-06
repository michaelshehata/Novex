# NOVEX FINANCE #
Novex finance is a web based blog targeted towards investors and general users who are interested in the financial market.

The aim of this repository is to test and learn different penetration techniques and vulnerabilities that could affect a web based system. 


How to set up (from terminal):
1. npm install

2. Create a PostgreSQL database and run `database/schema.sql` and `database/migration_totp_columns.sql`.

3. Copy environment variables (at minimum `SESSION_SECRET`, `ENCRYPTION_KEY`; optional `PASSWORD_PEPPER`, `APP_NAME`) into a `.env` file in the project root. 

The app loads `.env` from the current working directory when you start it from `app/` (see `database/database.js` for DB variables).

4. cd app

5. node app.js


PS: If you set `PASSWORD_PEPPER`, keep it stable; changing it invalidates existing password hashes.






