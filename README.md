# Assetra

Assetra is a premium, multi-tenant SaaS application designed to simplify building maintenance tracking, invoicing, and dues collections. It features a luxury champagne-gold aesthetic, building-level directories, outstanding dues leaderboards, custom partial payment checkouts (integrating Razorpay), and automated email reminders.

## Key Features

- **Multi-Tenant Architecture**: Multiple properties can register, configure unique settings (maintenance fees, bank details, credentials), and manage their registry independently using unique building codes.
- **SaaS Platform Console**: A master Platform Super-Admin dashboard (`superadmin@assetra.com`) allows managing all properties, suspending/activating building access, and extending service subscription periods.
- **Member & Admin Portals**: Dedicated authentication flows for property managers (to edit directory details and send alerts) and flat residents (to check leaderboard standings and pay outstanding balances).
- **Payment Gateway**: Integrates Razorpay Standard Checkout allowing residents to pay full or custom partial dues with automatic database balance updates.
- **Automated Notices**: Generates and logs billing reminders for tenants with pending arrears.
- **Interactive Preloader & Theme**: A custom vector line-drawing animation at startup set in a premium light-gold visual theme.

## Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), CSS3 (Variables, Transitions, Keyframe Animations)
- **Bundler**: Vite
- **Database / Backend**: Supabase (PostgreSQL with real-time API integrations)

## Getting Started

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Database Schema Setup
Execute the statements inside `setup_saas.sql` in your Supabase project's SQL Editor to configure the necessary tables (`buildings`, `flats`, `reminders`, `payments`) and Row-Level Security (RLS) policies.

### 3. Environment Configuration
Create a `.env` file in the root directory and add your keys:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

### 4. Running Locally
Start the development server:
```bash
npm run dev
```

### 5. Production Build
Generate optimized static assets in the `dist` folder:
```bash
npm run build
```
