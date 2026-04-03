<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5.5-black?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/NextAuth-v4-000000?logo=next.js&logoColor=white" alt="NextAuth" />
</p>

<h1 align="center">MedFlow Frontend</h1>

<p align="center">
  <strong>Modern Healthcare SaaS Platform — Next.js 15 + React 19</strong>
</p>

<p align="center">
  A comprehensive healthcare management system built with <strong>Next.js 15</strong>, <strong>React 19</strong>, and <strong>TypeScript</strong>.
  Seamlessly integrates with the MedFlow Django backend to provide a modern, responsive interface for clinics, doctors, receptionists, and patients.
</p>

---

## 👥 Team & Methodology

**Developed collaboratively by:**
-**Nourhene Ferchichi**:Full-stack Developer
- **Malak Benhassine** — Frontend Engineer
- **Jesser Mdimegh** — Full-Stack Developer
- **Badii Msalmi** — Backend & DevOps Lead

**Methodology:** Agile (Scrum) — Iterative development with real-time feedback integration and bi-weekly sprints.

---

## 🏥 About MedFlow

> *"Digitalizing private healthcare in Tunisia, one clinic at a time."*

**MedFlow** is a secure, scalable **SaaS platform** designed to help private clinics transition into the digital era. It eliminates paper files, phone call chaos, and manual prescription management.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Real-time Appointments** | Instant scheduling in doctor's agenda; online booking with WebSocket updates |
| **Patient Management** | Digital medical records, consultation history, diagnoses & treatments |
| **Billing & Payments** | Invoice management with Stripe integration for online payments |
| **AI Diagnostics** | AI-powered diagnostic suggestions for doctors |
| **PDF Generation** | Automatic prescriptions & invoices delivered as PDFs |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MedFlow Frontend                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Admin      │  │   Doctor     │  │   Manager    │  │ Receptionist │ │
│  │  Dashboard   │  │   Workspace  │  │   Console    │  │    Portal    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                     Patient Portal                                   ││
│  │    Book Appointments • Pay Online • Medical History • Prescriptions ││
│  └─────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────┤
│  🔐 NextAuth.js + JWT • 🎨 TailwindCSS + shadcn/ui • ⚡ WebSockets     │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  MedFlow Django API │
                    │   (Backend Layer)   │
                    └─────────────────────┘
```

---

## 🎯 Role-Based Access Control (RBAC)

| Role | Access Level | Key Pages |
|------|--------------|-----------|
| **Administrator** | Super Admin — Multi-clinic management | `/admin/*` — Clinics, Managers, Global settings |
| **Clinic Manager** | Full clinic control | `/manager/*` — Doctors, Receptionists, Patients, Dashboard |
| **Doctor** | Medical workspace | `/doctor/*` — Agenda, Consultations, Patients, Prescriptions |
| **Receptionist** | Front desk operations | `/receptionist/*` — Appointments, Billing, Patient registration |
| **Patient** | Self-service portal | `/patient/*` — Appointments, Doctors, Billing, Medical records |

---

## 🛠️ Tech Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.5 | App Router, SSR/SSG, API Routes |
| **React** | 19.1.0 | Component library with concurrent features |
| **TypeScript** | 5.0 | Type-safe development |
| **TailwindCSS** | v4 | Utility-first styling |

### Authentication & State
| Technology | Purpose |
|------------|---------|
| **NextAuth.js v4** | JWT-based authentication with Django backend |
| **TanStack Query** | Server state management, caching, synchronization |
| **React Hook Form + Zod** | Type-safe form handling & validation |

### UI & Components
| Technology | Purpose |
|------------|---------|
| **shadcn/ui** | Accessible Radix UI primitives |
| **Framer Motion** | Smooth animations & transitions |
| **Lucide React** | Modern icon library |
| **next-themes** | Dark/light mode support |

### Domain-Specific
| Technology | Purpose |
|------------|---------|
| **FullCalendar** | Doctor's agenda & appointment scheduling |
| **Stripe React** | Secure payment processing |
| **Socket.io Client** | Real-time notifications & updates |
| **jsPDF + html2canvas** | PDF generation for prescriptions & invoices |
| **Prometheus Client** | Application metrics & monitoring |

---

## 📁 Project Structure

```
med-flow-frontend/
├── src/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── admin/                    # Admin portal (RBAC protected)
│   │   │   ├── clinics/page.tsx      # Multi-clinic management
│   │   │   ├── managers/page.tsx     # Manager assignment
│   │   │   └── layout.tsx            # Admin shell
│   │   ├── doctor/                   # Doctor workspace
│   │   │   ├── agenda/page.tsx       # Calendar view (FullCalendar)
│   │   │   ├── consultations/        # Consultation management
│   │   │   ├── patients/             # Patient records
│   │   │   ├── ordonnances/page.tsx  # Prescriptions
│   │   │   └── layout.tsx            # Doctor shell
│   │   ├── manager/                  # Clinic Manager console
│   │   │   ├── dashboard/page.tsx    # Analytics & overview
│   │   │   ├── doctors/page.tsx      # Doctor management
│   │   │   └── receptionist/page.tsx # Receptionist management
│   │   ├── receptionist/             # Front desk interface
│   │   │   ├── appointments/page.tsx # Appointment management
│   │   │   ├── billing/              # Invoicing & payments
│   │   │   └── patients/             # Patient registration
│   │   ├── patient/                  # Patient self-service portal
│   │   │   ├── dashboard/page.tsx    # Personal health dashboard
│   │   │   ├── appointments/page.tsx   # Booking & management
│   │   │   ├── doctors/page.tsx      # Doctor directory
│   │   │   └── components/           # Reusable patient UI
│   │   ├── api/auth/                 # NextAuth configuration
│   │   │   ├── [...nextauth]/route.ts # API endpoint
│   │   │   └── NextAuthConfig.ts     # JWT + Credentials provider
│   │   ├── login/page.tsx            # Login page
│   │   ├── unauthorized/page.tsx     # 403 access denied
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Tailwind + custom styles
│   ├── components/                   # Shared React components
│   │   └── ui/                       # shadcn/ui components
│   ├── hooks/                        # Custom React hooks
│   ├── lib/                          # Utilities & helpers
│   ├── types/                        # TypeScript definitions
│   └── middleware.ts                 # RBAC route protection
├── k8s/                              # Kubernetes manifests
├── public/                           # Static assets
├── .env.local                        # Local environment
├── .env.prod                         # Production environment
├── Dockerfile                        # Container image
└── package.json                      # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **npm** or **yarn**
- Running [MedFlow Django backend](../backend-medflow/)

### Installation

```bash
cd med-flow-frontend
npm install
```

### Environment Configuration

Create `.env.local`:

```env
# Backend API
BACKEND_URL=http://localhost:8000

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secure_random_secret

# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Generate a secure secret:
```bash
npx auth secret
```

### Development

```bash
# Start with Turbopack (fast HMR)
npm run dev

# Or for production testing
npm run build
npm start
```

App runs at `http://localhost:3000`

---

## 🔐 How Authentication Works

### 1. Login Flow

```
User → /login page → signIn() → authorize() → Django /api/accounts/login/
                                                          │
                                                          ▼
User ← JWT Token + Profile ←─── 200 OK (user + access token)
```

The `authorize()` function in `NextAuthConfig.ts`:
- Sends credentials to Django REST API
- Receives JWT tokens + user profile
- Returns enriched user object with role

### 2. Session & JWT Strategy

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   JWT       │────▶│   Session   │────▶│ useSession  │
│   Callback  │     │   Callback  │     │   Hook      │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
 Stores:               Exposes:            Access in
 - id                   - user.id            components
 - email                - user.email
 - firstname            - user.firstname
 - lastname             - user.lastname
 - role                 - user.role          ← RBAC key
 - accessToken          - accessToken
```

### 3. Route Protection (Middleware)

`middleware.ts` enforces role-based access:

```typescript
// Route-to-Role Mapping
/admin/*       → requires role === "ADMIN"
/doctor/*      → requires role === "DOCTOR"
/manager/*     → requires role === "MANAGER"
/receptionist/* → requires role === "RECEPTIONIST"
/patient/*     → requires role === "PATIENT"
```

**Security Features:**
- ✅ Encrypted JWT cookies (httpOnly)
- ✅ No localStorage token storage
- ✅ Automatic token refresh
- ✅ Role-based redirects to `/unauthorized`

---

## 📊 Key Features Explained

### 🗓️ Appointment Management
- **FullCalendar integration** for drag-and-drop scheduling
- **WebSocket updates** — appointments appear in real-time across all users
- **Multi-clinic isolation** — doctors only see their clinic's agenda

### 📄 PDF Generation
- **Prescriptions** — Doctors create, patients download
- **Invoices** — Auto-generated with Stripe payment links
- Uses `jsPDF` + `html2canvas` for client-side generation

### 💳 Billing & Stripe
- Secure payment forms via `@stripe/react-stripe-js`
- Webhook handling for payment confirmations
- Invoice status tracking (paid/pending/overdue)

### 🔴 Real-Time Updates
- **Socket.io** connection to Django Channels
- Live notifications for:
  - New appointments
  - Patient check-ins
  - Payment confirmations
  - System alerts

---

## 🐳 Docker

```bash
# Build image
docker build -t medflow-frontend .

# Run container
docker run -p 3000:3000 \
  -e BACKEND_URL=http://host.docker.internal:8000 \
  -e NEXTAUTH_SECRET=your_secret \
  medflow-frontend
```

---

## ☸️ Kubernetes

Deployment configurations in `k8s/`:

```bash
kubectl apply -f k8s/
```

Includes:
- Deployment with health checks
- Service (LoadBalancer/ClusterIP)
- ConfigMap for environment variables
- Horizontal Pod Autoscaler (HPA)

---

## 🔗 Related Projects

| Project | Description | Tech |
|---------|-------------|------|
| [MedFlow Backend](../backend-medflow/) | Django REST API + WebSockets | Django 5, DRF, Channels, PostgreSQL, Redis |
| Infrastructure | Terraform + EKS | AWS, Kubernetes, Terraform |

---

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Django REST Framework](https://www.django-rest-framework.org)
- [TailwindCSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

---

<p align="center">
  <strong>Built with ❤️ in Tunisia</strong>
</p>

