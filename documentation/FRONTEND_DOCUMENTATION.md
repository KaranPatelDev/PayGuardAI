# Frontend Documentation

## Actual Frontend Framework
The repository uses **React**, not Vue.js. The frontend is located in `frontend/`.

## Main Technologies
- React 19
- React Router
- Tailwind CSS
- shadcn-style UI components
- lucide-react icons
- Recharts
- Axios
- Sonner toasts

## Folder Structure
```text
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── app/
│   │   └── ui/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── App.js
│   ├── index.css
│   └── index.js
├── package.json
└── tailwind.config.js
```

## Pages
- Landing
- Login
- Register
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

## Routing
Routes are defined in `src/App.js`. Public routes include `/`, `/login`, and `/register`. Protected app routes use `AppShell` and require an authenticated user.

## State Management
Authentication state is handled by `AuthContext`. Page-level data is managed with React state and API calls.

## API Integration
`src/lib/api.js` creates an Axios instance using `REACT_APP_BACKEND_URL` and attaches the JWT token from `sessionStorage` to requests.

## Form Handling and Validation
Forms use controlled React state and lightweight required-field checks. Backend Pydantic models provide server-side validation.

## Dashboard UI
The dashboard uses cards and Recharts visualizations for invoices, pending/recovered amounts, risk distribution, recovery trend, and overdue customers.

## How the New How to Use Page Was Added
The page `src/pages/HowToUse.jsx` was added and routed as `/app/how-to-use`. It was also added to `AppShell` sidebar navigation with a HelpCircle icon.

## Responsive Design
The frontend uses Tailwind responsive grids and spacing. The How to Use page uses stacked mobile layouts and wider grid layouts on desktop.

## Running Frontend Locally
```bash
cd frontend
npm install
npm start
```

Required environment variable:
```bash
REACT_APP_BACKEND_URL=http://localhost:8000
```
