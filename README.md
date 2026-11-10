# ExpenseTracker

<p>
  <img alt="Version" src="https://img.shields.io/badge/version-3.2.0-06b6d4?style=for-the-badge&labelColor=0a0a0a" />
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-06b6d4?style=for-the-badge&labelColor=0a0a0a" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white&labelColor=0a0a0a" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=0a0a0a" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white&labelColor=0a0a0a" />
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-11-FFCA28?style=for-the-badge&logo=firebase&logoColor=black&labelColor=0a0a0a" />
  <img alt="Deployed on Vercel" src="https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white&labelColor=0a0a0a" />
</p>

A modern expense tracking app built with Next.js, Supabase, and Firebase, available on the web and as an Android app. Includes light and dark themes, analytics and Google sign-in.

### 🔗 [**Live Demo → expense-tracker-41vi4p.vercel.app**](https://expense-tracker-41vi4p.vercel.app/)

## 🆕 Version 3.2.0

- **⛽ Commute & Fuel Hub (`/commute`)** - Real mileage tracking (km/L) from odometer differentials, cost per km analysis, and fuel refill history.
- **🧮 Daily Commute Cost Calculator** - Calculate daily and monthly commute expenses across two-wheelers, cars, and public transit with savings projections.
- **⚡ 1-Tap Commute Loggers** - Instant action chips for petrol refills, metro/bus tickets, auto/cab fares, parking, and highway tolls.
- **🎯 Monthly Spending Guard & Budgeting** - Live monthly budget progress bar on the Dashboard with alert thresholds and commute spend breakdowns.
- **⚡ One-Click Supabase Deployment** - Run and connect your personal cloud database in seconds with no database experience needed
- **🔄 Cross-Device Account Sync** - Database credentials link automatically to your Google account; logging in anywhere reconnects you seamlessly
- **📱 Android app** - download the APK from [Releases](https://github.com/41vi4p/Expense-Tracker/releases/latest); a new build is published automatically for every version
- **🌗 Light & dark themes** - follows your system by default; switch from the header or Settings -> Appearance
- **🔒 Security hardening** - Row level security & Firestore security rules, input validation, patched dependencies, security headers

[📖 **Full changelog**](./docs/CHANGELOG.md) | [⭐ **Star us on GitHub**](https://github.com/41vi4p/Expense-Tracker) | [🌐 **Try the Live Demo**](https://expense-tracker-41vi4p.vercel.app/)

## 🚀 Features

- **🔐 Google OAuth Authentication** - Secure login with Firebase Auth
- **💰 Income & Expense Tracking** - Add, edit, and categorize transactions
- **📊 Real-time Analytics** - Visual insights with Chart.js and Recharts
- **📝 Financial Notes** - Keep track of goals, plans, and reminders
- **🎯 Activity Tracking** - Monitor your financial activities
- **🌗 Light/Dark/System Theme** - Smooth, modern UI with instant theme switching
- **🤖 Android App** - Capacitor-wrapped APK with native Google sign-in
- **📱 Mobile-First Design** - Optimized for mobile devices
- **🔥 Firebase Integration** - Real-time database with Firestore
- **⚡ Fast Performance** - Built with Next.js 16 and TypeScript

## 🛠️ Tech Stack

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
  <img alt="Chart.js" src="https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white" />
  <img alt="Framer Motion" src="https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-black?style=flat-square&logo=vercel&logoColor=white" />
</p>

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS 4
- **Backend**: Firebase (Firestore, Authentication)
- **Authentication**: Firebase Auth with Google Provider
- **Charts**: Chart.js, React Chart.js 2, Recharts
- **UI Components**: Framer Motion, React Hot Toast
- **Icons**: Lucide React
- **Mobile**: Capacitor (Android)
- **Deployment**: Vercel + GitHub Releases (APK)

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd expense-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file and add your Firebase and Google OAuth credentials:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# (Optional) Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Firebase:
   - Create a new Firebase project in the Firebase Console
   - Enable Authentication and Firestore Database
   - **Deploy the security rules**: `npx firebase-tools deploy --only firestore:rules` (uses `firestore.rules`). Without them your data is not protected.
   - Add Google as an authentication provider in Firebase Auth
   - Add your domain (localhost:3000) to authorized domains
   - Copy your Firebase config to the environment variables

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎨 UI Features

- **Light & Dark themes**: system default, header toggle, Settings -> Appearance; no flash on load
- **Mobile-first**: responsive layout with safe-area support, bottom navigation on phones
- **Smooth motion**: Framer Motion transitions (respects reduced-motion settings)
- **Typography**: Poppins for headings, Source Sans 3 for body text
- **Semantic design tokens**: colours live in `src/app/globals.css` and adapt per theme

## 🤖 Android app

Grab `ExpenseTracker-vX.Y.Z.apk` from the [latest release](https://github.com/41vi4p/Expense-Tracker/releases/latest), open it on your device and allow installs from your browser/file manager when prompted.

Releases are built by GitHub Actions whenever the version in `package.json` changes on `main`, and the release notes come from [`docs/CHANGELOG.md`](./docs/CHANGELOG.md). Setup (secrets, signing, Google sign-in) and local builds are covered in [docs/ANDROID.md](./docs/ANDROID.md).

## 🔒 Security

- Firestore rules ([`firestore.rules`](./firestore.rules)) keep every record private to its owner and validate writes
- Client-side validation and sanitising for all writes and imports
- Security headers on the web deployment; HTTPS-only, no backups, no cleartext traffic in the Android app
- Activity logs contain no personal data
- Report vulnerabilities privately via GitHub Security Advisories

## 📱 Pages

- **Dashboard**: Overview of financial stats, monthly budget tracker, and recent transactions
- **Commute & Fuel**: Fuel refill logger, true mileage tracker, and daily commute cost estimator
- **Transactions**: Complete list with search, filtering, and 1-tap quick presets
- **Analytics**: Visual breakdown of spending by category and trends
- **Notes**: Financial notes with categories and tags
- **Activity**: Track user actions and account activities
- **Profile / Settings**: Account, theme, data export/import and deletion

## 🔧 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Static export for Android / build a debug APK (JDK 21 + Android SDK)
npm run build:static
npm run android:debug
```

## 🤝 Contributing

Contributions are welcome! Please read [CLAUDE.md](./CLAUDE.md) first. Every change must bump the version in `package.json` and add an entry to [`docs/CHANGELOG.md`](./docs/CHANGELOG.md).

## 📄 License

Licensed under the [MIT License](./LICENSE).

---

<p align="center">
  <a href="https://expense-tracker-41vi4p.vercel.app/"><strong>🌐 Live Demo</strong></a> ·
  <a href="https://github.com/41vi4p/Expense-Tracker/issues"><strong>🐛 Report Bug</strong></a> ·
  <a href="https://github.com/41vi4p/Expense-Tracker/issues"><strong>✨ Request Feature</strong></a>
</p>

