# Round the Corner — Admin Frontend

A Next.js 15 admin dashboard for the **Round the Corner** food truck platform. It provides management interfaces for vendors, menus, orders, categories, cuisines, diet types, banners, notifications, transactions, and user accounts.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Environment Variables](#environment-variables)
5. [Local Development Setup](#local-development-setup)
6. [Available Scripts](#available-scripts)
7. [Building for Production](#building-for-production)
8. [Deployment](#deployment)
9. [API Integration](#api-integration)
10. [Code Conventions](#code-conventions)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, Static Export) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + `tailwindcss-animate` |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + Radix UI primitives |
| Data Fetching | [TanStack Query v5](https://tanstack.com/query/latest) + Axios |
| Forms | React Hook Form + Zod validation |
| Rich Text | Draft.js + react-draft-wysiwyg |
| Charts | Recharts |
| Notifications | Sonner (toast) |
| Font | Geist (Google Fonts via `next/font`) |
| Package Manager | npm / Bun |

---

## Prerequisites

Ensure the following are installed on your machine before proceeding:

- **Node.js** ≥ 18.x — [Download](https://nodejs.org/)
- **npm** ≥ 9.x (ships with Node.js) **or** [Bun](https://bun.sh/) ≥ 1.x
- **Git** — [Download](https://git-scm.com/)
- Access to a running instance of the **Round the Corner backend API**

---

## Project Structure

```
rtc-admin-frontend/
├── public/                  # Static assets served as-is
├── src/
│   ├── app/                 # Next.js App Router pages & layouts
│   │   ├── (main)/          # Authenticated route group
│   │   │   ├── banner/
│   │   │   ├── categories/
│   │   │   ├── cuisine/
│   │   │   ├── diet/
│   │   │   ├── notification/
│   │   │   ├── order/
│   │   │   ├── setting/
│   │   │   ├── transactions/
│   │   │   ├── user/
│   │   │   └── vendor/
│   │   ├── auth/            # Login, forgot/reset password, delete account
│   │   └── privacy/         # Privacy policy page
│   ├── components/
│   │   ├── core/            # App-wide providers and layout components
│   │   └── ui/              # shadcn/ui component library
│   ├── hooks/               # Custom React hooks
│   ├── interfaces/          # TypeScript interfaces / response shapes
│   ├── lib/                 # Utility helpers (e.g., cn(), formatters)
│   ├── models/              # Domain model types
│   ├── services/            # Axios API service classes (one per domain)
│   ├── types/               # Shared TypeScript type definitions
│   └── utils/               # General-purpose utility functions
├── .env.example             # Environment variable template
├── next.config.ts           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json
```

---

## Environment Variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the backend REST API | `http://localhost:3000` |
| `NEXT_PUBLIC_ENCRYPTION_SECRET_KEY` | Secret key used for client-side encryption | `your-secret-key` |

> **Note:** All variables prefixed with `NEXT_PUBLIC_` are bundled into the client-side JavaScript at build time. **Never put sensitive server-side secrets in these variables.**

---

## Local Development Setup

Follow these steps to get the project running locally:

### 1. Clone the repository

```bash
git clone <repository-url>
cd rtc-admin-frontend
```

### 2. Install dependencies

Using **npm**:
```bash
npm install
```

Or using **Bun** (faster):
```bash
bun install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and update the values:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ENCRYPTION_SECRET_KEY=your-secret-key
```

Make sure the backend API server is running at the URL specified in `NEXT_PUBLIC_API_BASE_URL`.

### 4. Start the development server

```bash
npm run dev
```

The app starts on **http://localhost:3001** (port `3001` is configured in `package.json`).

> Hot-reloading is enabled out of the box — any file changes will instantly reflect in the browser.

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| Development | `npm run dev` | Starts dev server on port 3001 with hot-reload |
| Build | `npm run build` | Creates an optimised static export in the `out/` directory |
| Start | `npm run start` | Starts the Next.js production server (not applicable for static export) |
| Lint | `npm run lint` | Runs ESLint across the codebase |

---

## Building for Production

This project is configured as a **static export** (`output: "export"` in `next.config.ts`), meaning it generates a fully static site in the `out/` directory — no Node.js server required at runtime.

### Steps

```bash
# 1. Set production environment variables
cp .env.example .env
# Edit .env with production API URL and secret key

# 2. Build the static export
npm run build
```

After the build completes, the `out/` directory contains all static HTML, CSS, and JS files ready to be served by any static web host (Nginx, Apache, S3, Vercel, Netlify, etc.).

> **Important:** `trailingSlash: true` is enabled in `next.config.ts`. Ensure your web server is configured to serve `index.html` files from trailing-slash paths (e.g., `/order/` → `/order/index.html`).

---

## Deployment

### Option A — Nginx (Self-Hosted / VPS)

1. Build the project locally or on your CI server:
   ```bash
   npm run build
   ```

2. Copy the `out/` directory to your server:
   ```bash
   scp -r out/ user@your-server:/var/www/rtc-admin
   ```

3. Configure Nginx to serve the static files:
   ```nginx
   server {
       listen 80;
       server_name admin.yourdomain.com;

       root /var/www/rtc-admin;
       index index.html;

       location / {
           try_files $uri $uri/ $uri/index.html =404;
       }
   }
   ```

4. Reload Nginx:
   ```bash
   sudo nginx -s reload
   ```

5. *(Optional)* Add SSL with Certbot:
   ```bash
   sudo certbot --nginx -d admin.yourdomain.com
   ```

---

### Option B — Vercel (Recommended for simplest deployment)

1. Push your code to GitHub / GitLab / Bitbucket.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repository.
3. Set the environment variables in the Vercel dashboard under **Settings → Environment Variables**:
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_ENCRYPTION_SECRET_KEY`
4. Deploy. Vercel auto-detects Next.js and handles the static export.

---

### Option C — AWS S3 + CloudFront

1. Build the project:
   ```bash
   npm run build
   ```

2. Create an S3 bucket with **static website hosting** enabled.

3. Upload the `out/` directory:
   ```bash
   aws s3 sync out/ s3://your-bucket-name --delete
   ```

4. Configure CloudFront to point to the S3 bucket origin.

5. Add a CloudFront **Error Page** rule to redirect `404` errors to `/index.html` with HTTP status `200` to handle client-side routing.

---

### Option D — Docker + Nginx

Create a `Dockerfile` at the project root:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }
}
```

Build and run:

```bash
docker build -t rtc-admin-frontend .
docker run -p 80:80 rtc-admin-frontend
```

---

## API Integration

All API calls are made through typed service classes in `src/services/`, each extending `BaseAPI` (`src/services/base-api.ts`).

**Authentication:** The `BaseAPI` interceptor automatically reads the `token` from `localStorage` and attaches it as the `Authorization` header on every request.

**Domain services:**

| Service File | Domain |
|---|---|
| `auth-api-service.ts` | Login, logout |
| `user-api-service.ts` | Admin users |
| `food-truck-api-service.ts` | Vendor / food truck management |
| `menu-api-service.ts` | Menu items |
| `order-api-service.ts` | Orders |
| `categories-api-service.ts` | Categories |
| `cuisine-api-service.ts` | Cuisines |
| `diet-api-service.ts` | Diet types |
| `banner-api-service.ts` | Promotional banners |
| `notification-api-service.ts` | Push notifications |
| `transaction-api-service.ts` | Transactions |
| `review-api-service.ts` | User reviews |
| `setting-api-service.ts` | App settings |
| `file-api-service.ts` | File / image uploads |
| `public-api-service.ts` | Public-facing endpoints |

---

## Code Conventions

- **Path alias:** `@/` maps to `src/` — use this for all internal imports.
- **TypeScript:** Strict mode is enabled. Avoid `any` where possible.
- **Components:** Reusable UI primitives live in `src/components/ui/`. Domain-specific components live in their respective `app/` route folders.
- **Formatting:** Prettier is included — run `npx prettier --write .` before committing.
- **Linting:** Fix lint errors with `npm run lint`.
- **Build errors:** TypeScript build errors are currently set to be ignored (`ignoreBuildErrors: true`) — fix type errors before removing this flag in production.
