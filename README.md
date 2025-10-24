```bash
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
```

## 🚀 Getting Started

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Authentication Workflow

This project integrates **NextAuth** with a **Django REST API** for authentication, session management, and role-based access control.

### 🧩 1. Login Process

```bash
User → Login Page (/login) → signIn() → authorize() → Django API
```

- The user fills out the login form.  
- The `signIn()` method (provided by **NextAuth**) sends credentials to the backend.  
- The `authorize()` function in `NextAuthConfig.tsx` sends a POST request to:
  ```bash
  /api/accounts/login/
  ```
- If Django validates the credentials, it returns user data and a JWT token.

---

### 🧠 2. Session & JWT Callbacks

```bash
NextAuth → jwt callback → session callback → Available in useSession()
```

- The `jwt` callback stores extra user data (like `role`, `id`, `accessToken`) inside the token.  
- The `session` callback exposes these values in the client session.  
- You can access session data anywhere with:
  ```ts
  import { useSession } from "next-auth/react";
  const { data: session } = useSession();
  console.log(session?.user);
  ```

---

### 🛡️ 3. Route Protection

Protected routes (e.g. `/admin/dashboard`) are handled through `middleware.ts`.

- If the user is **not authenticated**, they are redirected to `/login`.  
- Role-based logic ensures users only access authorized pages.  
  Example:
  ```bash
  Admin → /admin/dashboard
  Doctor → /doctor/dashboard
  Patient → /patient/profile
  ```

---

## 📁 Key Files Overview

```bash
src/app/api/auth/NextAuthConfig.tsx   # Handles login logic and token creation
src/middleware.ts                     # Protects routes and manages role-based redirection
src/app/login/page.tsx                # Login page UI and signIn() handler
src/app/admin/dashboard/page.tsx      # Example of a protected route for admins
```

---

## ⚙️ Environment Variables

Create a `.env.local` file:

```bash
BACKEND_URL=http://127.0.0.1:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret
```

Generate a secure secret with:

```bash
npx auth secret
```

---

## 🧾 Summary

```bash
✅ Secure login using Django backend
✅ JWT-based session management via NextAuth
✅ Role-based route protection with middleware
✅ No localStorage – uses encrypted cookies
✅ Easy session access with useSession()
```

---

## 📚 Learn More

```bash
Next.js Docs:        https://nextjs.org/docs
NextAuth.js Docs:    https://next-auth.js.org
Django REST Framework: https://www.django-rest-framework.org
```
````
