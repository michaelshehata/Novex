# Novex

Novex is a secure finance discussion platform developed for a university cybersecurity and web security project.

The system demonstrates secure authentication, session handling, protected user generated content, and modern security mitigations using a Node.js and PostgreSQL stack.

---

# Features

- User registration and login
- Secure session-based authentication
- TOTP MFA
- Create and manage finance discussion posts
- Personal dashboard and settings pages
- PostgreSQL database hosted on Supabase
- Secure frontend/backend integration

---

# Security Features Implemented

- Argon2id password hashing
- Password peppering
- CSRF protection
- XSS sanitisation
- SQL injection mitigation using parameterised queries
- Rate limiting
- Session regeneration on login
- Secure cookies
- MFA using authenticator apps
- Encrypted sensitive database fields
- Generic authentication error messages to reduce user enumeration

# Setup Instructions

## 1. Clone the repository

```bash
git clone https://github.com/michaelshehata/Novex.git
cd Novex
```

---

## 2. Install dependencies

```bash
npm install
```


# 3. Create a Supabase Database

1. Go to:
   https://supabase.com

2. Create a new project

3. Open:
   - Project Settings
   - Database

4. Copy the PostgreSQL connection string

Example:

```env
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/postgres
```

---

# 4. Configure Environment Variables

Create a `.env` file in the root project directory.

Example:

```env
PORT=3000

DATABASE_URL=your_supabase_connection_string

SESSION_SECRET=replace_with_random_secret

PASSWORD_PEPPER=replace_with_random_pepper

ENCRYPTION_KEY=replace_with_32_char_key

FAKE_HASH=argon2_fake_hash_here

NODE_ENV=development
```

---

# 5. Create Database Tables

Open the Supabase SQL Editor and run the contents of:

```txt
database/schema.sql
```

---

# 6. Start the Server

```bash
node app/app.js
```

Server should run on:

```txt
http://localhost:3000
```

---

# 7. Access the Application

Homepage:

```txt
http://localhost:3000
```

---

# Test Accounts

You can create users through the registration page or seed users manually using:

```bash
npm run db:seed-user
```

# Important Notes

- The application uses sessions and cookies for authentication.
- MFA requires an authenticator app such as:
  - Google Authenticator
  - Microsoft Authenticator
  - Authy

