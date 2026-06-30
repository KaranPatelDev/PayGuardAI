# Frontend Documentation

## Framework
The frontend uses React 19 and is located in `frontend/`.

## Main Technologies
- React 19
- React Router 7
- Tailwind CSS 3.4
- shadcn/ui components (Radix UI primitives)
- Recharts
- Axios
- Sonner toasts
- lucide-react icons
- CRACO (Create React App Configuration Override)

## Folder Structure
```text
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── app/           # AppShell, Badges, EmptyState
│   │   └── ui/            # shadcn/ui components
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   ├── lib/
│   │   ├── api.js         # Axios instance
│   │   ├── format.js      # INR formatting, date formatting
│   │   └── utils.js       # cn() utility
│   ├── pages/             # 14 page components
│   ├── App.js
│   ├── index.css
│   └── index.js
├── package.json
├── craco.config.js
├── tailwind.config.js
└── vercel.json            # SPA routing rewrites
```

## Pages
- Landing
- Login
- Register
- ForgotPassword
- ResetPassword
- Dashboard
- Customers
- Customer Detail
- Invoices
- Invoice Detail
- Payments
- AI Follow-ups
- Cashflow
- Reports
- Settings
- Profile
- How to Use
- Pricing

## Routing
Routes are defined in `src/App.js`. Public routes include `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/how-to-use`, and `/pricing`. Protected app routes use `AppShell` and require an authenticated user.

## State Management
Authentication state is handled by `AuthContext`. Page-level data is managed with React state and API calls.

## API Integration
`src/lib/api.js` creates an Axios instance using `REACT_APP_BACKEND_URL` and attaches the JWT token from `sessionStorage` to requests.

## Responsive Design
The frontend is fully responsive across all devices (mobile, tablet, laptop, desktop).

### Breakpoints (Tailwind defaults)
| Prefix | Min Width | Typical Device |
|--------|-----------|----------------|
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |

### Mobile Navigation
- **AppShell**: Hamburger menu (below `md:`) opens a Sheet drawer with full navigation
- **Landing page**: Logo + Login/Get started buttons + hamburger dropdown for extra links (below `sm:`)

### Data Tables
- **Desktop (md+)**: Full table view with `overflow-x-auto` safety net
- **Mobile (<md)**: Card/list view showing key fields (name, amount, status, risk) with action buttons

### Forms
- **Register, Customer Dialog, Invoice Dialog**: `grid-cols-1 sm:grid-cols-2` — single column on mobile, two columns on desktop
- **Dialogs**: `max-h-[90vh] overflow-y-auto` for mobile scrolling

### Headers
- **Detail pages** (CustomerDetail, InvoiceDetail): Headers use `flex-col sm:flex-row` to stack vertically on mobile

### Patterns Used
```jsx
// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

// Mobile hide / desktop show
<div className="hidden md:block">  {/* desktop only */}
<div className="md:hidden">       {/* mobile only */}

// Responsive padding
<main className="p-4 sm:p-6 lg:p-8">

// Responsive typography
<h1 className="text-3xl sm:text-4xl lg:text-5xl">

// Responsive flex direction
<div className="flex flex-col sm:flex-row sm:justify-between">
```

## Running Frontend Locally
```bash
cd frontend
yarn install
yarn start
```

Required environment variable:
```bash
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Building for Production
```bash
cd frontend
yarn build
```

Output is in `frontend/build/`.

## Deployment
The frontend is deployed on Vercel (free tier). See [Deployment Guide](DEPLOYMENT_GUIDE.md) for configuration.
