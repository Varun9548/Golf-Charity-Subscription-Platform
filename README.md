# ⛳ GreenHeart — Golf Charity Subscription Platform

**Golf. Give. Win.** — A modern subscription-based platform combining golf performance tracking, charitable giving, and a monthly prize draw engine.

---

## 🌐 Live URLs

| Page | Path | Description |
|------|------|-------------|
| Homepage | `/index.html` | Marketing site with hero, how-it-works, prizes, testimonials, pricing |
| Charities | `/charities.html` | Directory with search, filter, sort |
| Charity Profile | `/charity-profile.html` | Individual charity page with events |
| Sign Up | `/signup.html` | 4-step subscription flow |
| Log In | `/login.html` | Authentication page with demo credentials |
| User Dashboard | `/dashboard.html` | Member hub — scores, draws, charity, winnings |
| Admin Dashboard | `/admin.html` | Admin control panel — users, draws, winners, reports |

---

## 🔐 Demo Credentials

| Role | Email | Password | Redirect |
|------|-------|----------|----------|
| User | `user@demo.com` | `demo1234` | `dashboard.html` |
| Admin | `admin@demo.com` | `admin1234` | `admin.html` |

---

## ✅ Completed Features

### Public Site
- [x] Full homepage with animated hero section, dark theme
- [x] Animated prize pool countdown timer (counts down to 28th of month)
- [x] Social proof ticker bar (auto-scrolling)
- [x] How It Works 3-step flow
- [x] Prize tier breakdown (3/4/5 match)
- [x] Charity spotlight cards with featured badge
- [x] Testimonial section
- [x] Pricing toggle (monthly/yearly) with 25% savings badge
- [x] Final CTA section
- [x] Fully responsive footer

### Charity Directory
- [x] Search by charity name (real-time filtering)
- [x] Category filter tabs (All, Health, Children, Animals, Community, Environment)
- [x] Sort options (Popular, Most Raised, Newest, A–Z)
- [x] Progress bars for monthly goals
- [x] 8 charity cards with stats
- [x] Animated filter transitions
- [x] No-results state with reset button

### Charity Profile
- [x] Full charity hero banner with gradient
- [x] About section with impact statistics
- [x] Upcoming events list (Golf Days, tournaments)
- [x] Sidebar with giving calculator, progress, top supporters
- [x] Contact/social links
- [x] Community stats (supporters, raised)

### Signup Flow (4 Steps)
- [x] Step 1: Account creation with password strength indicator
- [x] Step 2: Plan selection (Monthly £9.99 / Yearly £89.99)
- [x] Step 3: Charity selection with giving slider (10%–50%)
- [x] Step 4: Payment details with card formatting
- [x] Step 5: Success confirmation with next steps
- [x] Progress indicator with animated step circles
- [x] URL param pre-selection (`?plan=yearly&charity=nspcc`)
- [x] Form validation with field-level error messages
- [x] Dynamic order summary updates

### User Dashboard
- [x] Score overview with rolling 5-score list
- [x] Add Score modal with stepper input + optional course name
- [x] Score deletion (oldest auto-replaced animation)
- [x] Draw numbers display (5 numbered balls)
- [x] Live prize pool breakdown per tier
- [x] Draw countdown timer
- [x] Charity contribution widget with live slider
- [x] Performance chart (Chart.js line graph)
- [x] Draw history table (6 months with match/result badges)
- [x] Winnings section with proof upload
- [x] Drag & drop file upload zone
- [x] Subscription management with billing history
- [x] Responsive sidebar navigation

### Admin Dashboard
- [x] Platform analytics KPIs (subscribers, revenue, prize pool, charity total)
- [x] Subscriber growth chart (Chart.js)
- [x] Charity distribution doughnut chart
- [x] Plan distribution chart
- [x] Real-time activity feed
- [x] User management table with search and status filter
- [x] Bulk user select
- [x] User edit modal (name, email, plan, status, score override)
- [x] Draw configuration panel (logic type, pool values)
- [x] Draw simulation engine (random ball generator with stats)
- [x] Draw history table
- [x] Winner verification list with status filter
- [x] Approve/reject workflow with modal
- [x] Mark as Paid action
- [x] Charity management table (CRUD actions)
- [x] Report cards with download trigger
- [x] Revenue trend bar chart

---

## 🏗️ Project Structure

```
index.html              — Homepage / marketing site
charities.html          — Charity directory
charity-profile.html    — Individual charity profile
signup.html             — 4-step subscription signup
login.html              — Authentication
dashboard.html          — User dashboard
admin.html              — Admin control panel

css/
  main.css              — Full design system (~2200 lines)

js/
  main.js               — Shared: navbar, countdown, animations, utils
  signup.js             — Multi-step form logic, plan/charity selection
  login.js              — Auth flow with demo credential handling
  charities.js          — Search, filter, sort logic
  dashboard.js          — Score entry, modals, Chart.js integration
  admin.js              — Admin section navigation, draw sim, charts
```

---

## 🎨 Design System

- **Primary Font**: Space Grotesk (headings), Inter (body)
- **Brand Color**: `#10b981` (Emerald Green)
- **Background**: Dark mode for dashboards (`#0c1222`, `#131c2e`)
- **Public site**: Light mode (`#fafafa`, `#ffffff`)
- **Accent**: Purple `#6366f1`, Gold `#f59e0b`
- **Design Philosophy**: Emotion-driven, modern — deliberately avoids traditional golf clichés (no fairways, plaid, clubs as primary imagery)

---

## 📦 Dependencies (CDN)

| Library | Version | Use |
|---------|---------|-----|
| Inter / Space Grotesk | Latest | Typography |
| Font Awesome | 6.4.0 | Icons |
| Chart.js | Latest | Analytics & performance charts |

---

## 📋 Data Model Summary

### User
- `id`, `firstName`, `lastName`, `email`, `passwordHash`
- `plan` (monthly | yearly), `subscriptionStatus` (active | inactive | lapsed)
- `charityId`, `givingPercentage` (10–50%)
- `scores[]` (max 5, Stableford 1–45)
- `createdAt`, `renewalDate`

### Score
- `userId`, `value` (1–45), `datePlayed`, `courseName`
- Auto-replaced: oldest removed when 6th added

### Draw
- `month`, `year`, `winningNumbers[]`
- `logicType` (random | algorithmic)
- `prizePool`, `jackpotRollover`

### Winner Claim
- `userId`, `drawId`, `matchType` (3 | 4 | 5)
- `prizeAmount`, `proofFile`, `status` (pending | review | approved | paid | rejected)

### Charity
- `name`, `category`, `description`, `images[]`
- `supporters`, `totalRaised`, `featured`
- `events[]` (date, name, location, description)

---

## 🚀 Next Steps

1. **Backend Integration** — Connect to Supabase for real data persistence
2. **Stripe Integration** — Live payment processing with webhooks
3. **Email System** — Draw results, winner alerts, renewal reminders
4. **Score Verification** — Photo upload validation with OCR
5. **Draw Engine** — Implement the weighted algorithmic draw option
6. **Admin Auth** — Role-based access control with JWT
7. **Mobile App** — React Native version using same API
8. **Multi-currency** — EUR, USD support for international expansion

---

*Built as a PRD prototype for the GreenHeart Golf Charity Subscription Platform — Digital Heroes Trainee Assignment*
