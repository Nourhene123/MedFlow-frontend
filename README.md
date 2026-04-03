```bash
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
```# MedFlow Frontend

 Developed together with me and  my colleagues — **Malak Benhassine**, **Jesser Mdimegh**, and **Badii Msalmi** — applying Agile methodology (Scrum) for iterative development and real-time feedback integration.

## About MedFlow

Today, everything is going digital: banking, commerce, education... Private healthcare in Tunisia is now making the same leap.

**MedFlow** is a modern, secure, and intelligent **SaaS platform** designed to help private clinics fully transition into the digital era — ending paper files, endless phone calls, and unreadable prescriptions.

### What MedFlow Delivers

- **Real-time appointment management** — Appointments created instantly in the doctor's agenda; receptionists check availability in one click; online booking, modification, and cancellation
- **Complete patient management** — Medical records, consultation history, diagnoses, treatments; automatic PDF delivery of prescriptions and invoices
- **Billing & payments** — Invoice management with cash or online payments via Stripe

### Role-Based Access (Multi-Tenant & Secure)

| Role | Capabilities |
|------|-------------|
| **Administrator** | Manage multiple clinics and assign managers |
| **Clinic Manager** | Full control over clinic data, doctors, receptionists, and patients |
| **Receptionist** | Manage appointments and patient flow |
| **Patient Portal** | Book appointments, pay online, download prescriptions, access medical history |
| **Doctor Workspace** | Access patient records, schedule consultations, write prescriptions, AI-powered diagnostic suggestions |

### Real-Time Communication

- **WebSockets** with Django Channels / Daphne
- **Redis** as the channel layer for pub/sub messaging
- Instant updates for appointments, notifications, and patient flow

### Technology & Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, TailwindCSS v4 |
| **Backend** | Django 5, Django REST Framework |
| **Database** | PostgreSQL |
| **State & Cache** | Redis, TanStack Query |
| **Payments** | Stripe |
| **Versioning** | Git / GitLab |
| **Architecture** | 3-tier SaaS with multi-clinic isolation |
| **DevOps** | Docker, Kubernetes, Amazon EKS, Terraform |
| **CI/CD** | Automated GitLab pipelines |

### What Makes MedFlow Different

- Full multi-clinic isolation
- End-to-end digitalization of clinical workflows
- Secure, scalable SaaS architecture
- Real-time updates across the platform for all users

---

This is the frontend application for **MedFlow**, a comprehensive healthcare management system. It provides a modern, responsive web interface for managing clinics, appointments, patients, billing, and AI-powered medical assistance.

## Overview

MedFlow Frontend is built with **Next.js 15** and **React 19**, delivering a high-performance, SEO-friendly single-page application. It integrates seamlessly with the MedFlow Django backend API.

## Project Structure

```
frontend-medflow/
└── med-flow-frontend/          # Main Next.js application
    ├── src/                    # Source code (pages, components, hooks)
    ├── public/                 # Static assets
    ├── k8s/                    # Kubernetes deployment configs
    ├── .env.local              # Local environment variables
    ├── .env.prod               # Production environment variables
    ├── Dockerfile              # Container configuration
    └── package.json            # Dependencies & scripts
```

## Tech Stack

- **Framework**: [Next.js 15.5.5](https://nextjs.org/) with App Router
- **UI Library**: [React 19.1.0](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/) + [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Authentication**: [NextAuth.js v4](https://next-auth.js.org/)
- **State Management**: [TanStack Query (React Query)](https://tanstack.com/query)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation
- **Calendar**: [FullCalendar](https://fullcalendar.io/)
- **Payments**: [Stripe React](https://stripe.com/docs/stripe-js/react)
- **Real-time**: [Socket.io Client](https://socket.io/docs/v4/client-api/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/)
- **Monitoring**: [Prometheus Client](https://github.com/siimon/prom-client)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ 
- npm or yarn
- Running MedFlow backend API

### Installation

```bash
cd med-flow-frontend
npm install
```

### Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### Development

```bash
# Start development server with Turbopack
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Build & Production

```bash
# Create production build
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Key Features

- **Authentication**: JWT-based auth with role-based access control
- **Appointment Management**: Calendar view with drag-and-drop scheduling
- **Patient Records**: Digital medical records and history
- **Billing & Invoicing**: Integrated with Stripe for payments
- **AI Assistant**: Medical AI chat interface
- **Real-time Updates**: WebSocket integration for live notifications
- **PDF Reports**: Generate medical reports and invoices
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Theme switching support

## Docker

```bash
docker build -t medflow-frontend .
docker run -p 3000:3000 medflow-frontend
```

## Kubernetes

Deployment configs are available in the `k8s/` directory.

## API Integration

The frontend communicates with the MedFlow Django backend at `/api`. See the [Backend README](../backend-medflow/) for API documentation.

## Related Projects

- [MedFlow Backend](../backend-medflow/) - Django REST API


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
