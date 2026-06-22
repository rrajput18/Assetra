# ⚜️ Assetra: Premium Multi-Tenant Property Maintenance SaaS

Assetra is a high-end, multi-tenant Software-as-a-Service (SaaS) platform designed for property managers and residents. It simplifies building maintenance tracking, invoicing, payment collections, and arrears management. Styled with a premium **light-gold champagne visual theme**, it features interactive animated line-drawing preloaders, dynamic SVG property-tier illustrations, building-level directories, outstanding dues leaderboards, custom payment checkouts (routing to individual merchant accounts), and scan-to-pay QR codes.

---

## 🚀 Key Features & Capabilities

### 1. Multi-Tenant Architecture & Data Isolation
* **Independent Registries**: Multiple property managers can register their buildings independently. Each building gets a unique join code (e.g., `AST-1001`) that acts as a secure tenant identifier.
* **Database Isolation (RLS)**: Row-Level Security policies in Supabase isolate all database tables (`buildings`, `flats`, `reminders`, `payments`). Tenant data is partitioned by `building_code`.

### 2. SaaS Super-Admin Console
* **Global Console Dashboard**: Accessing the platform with master super-admin credentials opens a centralized SaaS Console.
* **Tenant Controls**: The platform owner can monitor all registered properties, suspend or activate building access, and extend service subscriptions by months or years.

### 3. Property Manager Portal (Admin)
* **Property Hub Selector**: Multi-property admins can switch between their managed buildings, while single-property admins route directly to their specific dashboard.
* **Resident Directory**: Register flats, pre-provision accounts, view overdue status, and search/filter residents instantly.
* **Billing Reminders**: Generate custom notices for overdue balances and dispatch bulk payment notifications.
* **Transaction Logs & Export**: Monitor payment history, view settled dues, and export ledger logs to a clean, formatted CSV file.
* **Leaderboard Broadcasts**: Publicly announce the top outstanding dues leader (social accountability tool) to trigger a congratulations popup notice inside the resident dashboard.

### 4. Resident Dues Portal (Member)
* **Authentication**: Seamless resident login using their building code, flat number, and portal credentials.
* **Dues Ledger**: View total outstanding balances and a complete log of payments settled.
* **Scan to Pay (UPI QR Code)**: 
  * If the administrator uploads a custom payment QR code, it will display.
  * If empty, the dashboard **dynamically generates a UPI QR Code** encoding their outstanding dues and payee name. Scanning it with GPay, PhonePe, Paytm, or BHIM automatically pre-fills the exact due amount and building name.
* **Razorpay Checkout**: Pay full or custom partial dues directly using the integrated Razorpay SDK.

---

## 🎨 Visual System & Design Philosophy

Assetra implements modern visual design practices:
* **Luxury Champagne Palette**: Warm cream backdrops, brushed gold accents, metallic outline icons, and gold-tinted card deck layouts.
* **Headless Building Preloader**: A vector line-drawing animation at startup. Left and right skyscrapers draw, adjust scale, and pop windows open in a fluid 2.5s sequence.
* **Dynamic Property Visuals**: Dashboards render SVG illustrations indicating the property's financial health:
  * **Gold Tier (Rate >= 90%)**: A thriving gold skyscraper with a *"Thriving Gold Tier"* badge.
  * **Silver Tier (70% - 90%)**: Slate-and-gold stable apartment blocks with a *"Stable Silver Tier"* badge.
  * **Amber Tier (< 70%)**: Warning skyscraper alert line-art with an *"Attention Required"* badge.

---

## 📂 Project Directory Structure

```filepath
Assetra/
├── public/                     # Static assets served directly
│   ├── favicon.svg             # Champagne-gold favicon matching logo
│   └── icons.svg               # SVG icons sheet for navigation and tabs
├── src/
│   ├── assets/                 # Image assets
│   │   ├── hero.png            # Dashboard presentation hero
│   │   ├── javascript.svg      # JS compiler logo
│   │   └── vite.svg            # Bundler engine logo
│   ├── counter.js              # State helpers
│   ├── db.js                   # Supabase interaction client, data maps, and migration triggers
│   ├── main.js                 # Front-end UI router, controllers, and form handlers
│   └── style.css               # Theme custom tokens, responsive drawer layouts, and keyframe animations
├── index.html                  # Main UI layout, modal elements, and loading preloaders
├── setup_schema.sql            # Unified DDL: Creates tables, enables RLS, triggers, and security policies
├── setup_rls_policies.sql      # RLS specific script: Focuses purely on security policy updates
├── setup_saas.sql              # Alter commands: Column additions for SaaS properties
├── package.json                # Project dependencies (Vite & Supabase JS client)
├── vercel.json                 # Vercel single-page application router settings
└── vite.config.js              # Vite bundler parameters (routes local server to port 3000)
```

---

## 🛠️ Installation & Configuration

### 1. Install Dependencies
Clone the repository, open the directory in your terminal, and run:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Initialize Supabase Database Schema & Security Trigger
To ensure the leaderboard and congratulations broadcasts function securely under RLS, follow these steps:
1. Log in to your **Supabase Dashboard**.
2. Navigate to **SQL Editor** -> **New Query**.
3. Copy the contents of [setup_schema.sql](file:///c:/Users/raksh/OneDrive/Desktop/Folder/Assetra/setup_schema.sql).
4. Paste it into the editor and click **Run**.
5. Disabling confirmation email verification is required to support instant mock credentials (e.g. resident accounts):
   * Go to **Authentication** -> **Providers** -> **Email** -> toggle **"Confirm email"** to **OFF** -> click **Save**.



## 🧪 Verification Procedures

### 1. Run Development Server
Start the local server (Vite is configured to serve on `http://localhost:3000`):
```bash
npm run dev
```

### 2. Verify Database Seeding
Open `http://localhost:3000` in your browser. Upon the very first page load, the database initialization code will run. If the database tables are empty, it will automatically populate them with the default **Assetra Heights** (`AST-1001`) registry data.

### 3. Verify Admin Login & Auto-Migration
1. On the landing page, choose **Property Administrator**.
2. Log in using your admin portal credentials (or the default seed account).
3. The database auto-migration script will securely sign up this account inside **Supabase Auth** on the fly.
4. Go to **Authentication** -> **Users** in your Supabase dashboard to verify that the auth profile was successfully created.

### 4. Verify Leaderboard Congrats Broadcast
1. Log in as Admin.
2. Go to the **Leaderboard** tab, and click the **"Broadcast Leaderboard Congratulations"** button.
3. Log out, then select **Building Member**.
4. Log in as a resident using resident credentials (or a default seed resident account).
5. Verify that the **Leaderboard Standing congratulations modal** overlays the dashboard, indicating the current leader's details. Click **Awesome** to dismiss.
6. Verify that the resident can view their neighbors' ranks and outstanding balances on the **Building Leaderboard** tab.

