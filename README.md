# YouTuber Finder

A production-quality SaaS web application for discovering, filtering, and contacting Indian YouTube creators for brand deals and sponsorships.

## Features
- **Premium AI SaaS Landing Page**: Modern peach hero canvas, CSS-only floating phone composition with a 22-bar animated equalizer, smart profile buttons, and responsive drawer navigation.
- **Authentication**: Simple, secure login and signup with zero OTP friction. Validates unique usernames and emails with password visibility toggle. Full-screen onboarding loader with spinning gradient ring.
- **Badami Luxury Dashboard**: Warm badami theme (`#F7EDD5`, `#FFFAF0`, `#C8963E`) with collapsible desktop sidebar and mobile bottom drawer across 4 dedicated menus:
  1. **Find YouTubers**: Granular filters by Niche (Tech, Gaming, Education, Vlog, Finance, Fitness, Cooking, Comedy), Subscriber bracket (1K–10K, 10K–100K, 100K–1M, 1M+), and Language (Hindi, English, Hinglish, Bhojpuri).
  2. **Saved YouTubers**: Persistent shortlist of bookmarked creators for easy campaign management.
  3. **Plans & Pricing**: Transparent ₹30 (30 days) and ₹299 (1 year) passes. Real UPI QR code generation via `qrcode.react`, 12-digit UTR verification, receipt screenshot upload, and status banners.
  4. **Settings**: Account profile summary, membership status, demo tier toggle, and logout flow.
- **Strict Freemium Enforcement**:
  - Free users can view the first 5 channel profiles, but emails are locked.
  - Channels from the 6th onward appear as dashed locked cards with an unlock CTA.
  - Paid users get complete access to all verified business inquiry emails with one-click copy and mailto links.
- **Dual Architecture**: Works seamlessly as a Vite SPA and includes all Next.js 14 App Router routes ready for Vercel deployment.

## Tech Stack
- React / Next.js 14 App Router
- Tailwind CSS with Badami and Dark Mode CSS variables
- `qrcode.react` for UPI QR code rendering
- Browser `localStorage` store in `lib/store.js` (ready to connect with Supabase)

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Build for Production
```bash
npm run build
```

## Directory Structure
- `lib/store.js` - Client-side store methods (`me`, `signup`, `login`, `logout`, `savedIds`, `toggleSave`, `plan`, `isPaid`, `payment`, `submitPayment`, `demoActivate`)
- `lib/data.js` - Demo creator database (12 verified creators), categories, ranges, and UPI constants
- `lib/AuthForm.js` - Authentication form with validation and password eye toggle
- `lib/CreatorCard.js` - Creator card with freemium locking logic
- `lib/Loader.js` - Full-screen onboarding spinner and progress bar
- `src/App.tsx` - SPA client router handling all routes (`/`, `/login`, `/signup`, `/dashboard/*`)
- `app/` - Next.js 14 App Router structure (`layout.js`, `page.js`, `dashboard/`)
