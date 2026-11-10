# 🌍 Yuan's World

A child-friendly habit-building platform where children track daily activities, follow household rules, complete responsibilities, earn rewards, and build positive daily routines.

Parents manage their children's accounts, create activities, monitor progress, approve completed tasks, and encourage positive habits through gamification.

## ✨ Features

- **Welcome Experience** – Animated landing page with a digital admission ticket
- **Three Household Rules** – Illustrated rule cards children acknowledge before accessing their dashboard
- **Dual Authentication** – Separate parent (email/password) and child (ID/PIN) logins with role-based access control
- **Daily Activities** – Interactive dashboard with categories: studying, reading, outdoor play, chores, cleanliness
- **Activity Scheduling** – Flexible frequencies: daily, every 2/3/4 days with automatic schedule generation
- **Gamification** – Points, stars, achievement badges, daily streaks, weekly challenges, level progression
- **Five Levels** – Beginner Explorer → Smart Learner → Outdoor Champion → Cleanliness Hero → Yuan's World Champion
- **Photo Submission** – Children upload evidence photos (no editing/filters), parents review them
- **Parent Dashboard** – Stats, children overview, recent submissions, approval workflow
- **Reports & Analytics** – Category breakdowns, 30-day completion charts, weekly summaries, streak history (Recharts)
- **Notifications** – Reminders, achievement alerts, approval updates
- **Responsive Design** – Mobile-first with playful pastel UI, bottom nav for kids, sidebar for parents

## 🛠 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router) | Server/client components, route handlers, cache components |
| Language | TypeScript | Type safety across frontend and backend |
| Database | SQLite (via Prisma 7) | Zero-config local dev, swappable to PostgreSQL |
| ORM | Prisma 7 | Type-safe queries, migrations, schema-first design |
| Auth | NextAuth v5 (Auth.js) | JWT sessions, credential providers for parent & child |
| Charts | Recharts | Responsive, composable chart components |
| Styling | Custom CSS design system | 20-section design tokens, utility classes, animations |

## 📁 Project Structure

```
yuans-world/
├── prisma/
│   ├── schema.prisma          # Database schema (13 models)
│   ├── seed.ts                # Seed script (parent, child, rules, activities)
│   └── migrations/            # Prisma migrations
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page (welcome experience)
│   │   ├── layout.tsx         # Root layout (SessionProvider)
│   │   ├── globals.css        # Complete CSS design system
│   │   ├── auth/
│   │   │   ├── login/parent/  # Parent login (email/password)
│   │   │   ├── login/child/   # Child login (ID/PIN)
│   │   │   └── register/      # Parent registration
│   │   ├── child/             # Child interface
│   │   │   ├── layout.tsx     # Server layout (Suspense)
│   │   │   ├── child-shell.tsx # Client shell (nav, auth guard)
│   │   │   ├── dashboard/     # Today's activities, stats, badges
│   │   │   ├── rules/         # Rule acknowledgment
│   │   │   ├── activities/    # Activity list + submission detail
│   │   │   ├── achievements/  # Badge collection, level progress
│   │   │   ├── calendar/      # Monthly progress calendar
│   │   │   └── profile/       # Child profile & stats
│   │   ├── parent/            # Parent interface
│   │   │   ├── layout.tsx     # Server layout (Suspense)
│   │   │   ├── parent-shell.tsx # Client shell (sidebar, auth guard)
│   │   │   ├── dashboard/     # Overview stats, children, recent submissions
│   │   │   ├── children/      # Child CRUD management
│   │   │   ├── activities/    # Activity CRUD + scheduling
│   │   │   ├── approvals/     # Approve/reject submissions
│   │   │   ├── rules/         # Rule CRUD
│   │   │   ├── reports/       # Charts & analytics
│   │   │   └── settings/      # Reward config & thresholds
│   │   └── api/               # 24 route handlers
│   │       ├── auth/[...nextauth]/
│   │       ├── activities/    # CRUD
│   │       ├── schedules/     # Create/delete
│   │       ├── submissions/   # Submit + view
│   │       ├── approvals/     # Approve/reject with gamification
│   │       ├── children/     # CRUD
│   │       ├── rules/         # CRUD + acknowledge
│   │       ├── dashboard/     # Child & parent dashboards
│   │       ├── rewards/       # Config GET/PUT
│   │       ├── notifications/ # Child & parent
│   │       ├── achievements/  # By child ID
│   │       ├── calendar/      # Monthly data
│   │       ├── reports/       # Full analytics
│   │       ├── upload/        # Photo upload
│   │       └── register/      # Parent registration
│   ├── components/
│   │   └── session-provider.tsx
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config (parent + child providers)
│   │   ├── prisma.ts          # Prisma client (SQLite adapter)
│   │   ├── gamification.ts    # Points, levels, badges, streaks engine
│   │   └── scheduling.ts      # Frequency-based activity scheduling
│   ├── types/
│   │   └── index.ts           # Shared TypeScript types & constants
│   └── middleware.ts          # Route protection (auth + role checks)
├── prisma.config.ts           # Prisma 7 config (datasource URL)
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (22.5+ recommended for native SQLite support)
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Generate Prisma client
npm run db:generate

# 4. Create database & run migrations
npm run db:migrate

# 5. Seed the database with demo data
npm run db:seed
```

### Running the App

```bash
# Development server
npm run dev
# Open http://localhost:3000

# Production build
npm run build
npm start
```

## 🔑 Demo Credentials

After seeding, these accounts are available:

| Role | Login | Password/PIN |
|------|-------|-------------|
| Parent | parent@yuansworld.com | parent123 |
| Child | yuan123 | 1234 |

## 🗄️ Database Schema

The schema includes 13 models with proper relationships:

- **User** – Parent accounts (email, password hash, role)
- **Child** – Child profiles (childId, PIN hash, avatar, points, level, streaks)
- **Activity** – Activity definitions (name, category, icon, points, photo/approval flags)
- **ActivitySchedule** – Assigns activities to children with frequencies (daily → every 4 days)
- **ActivitySubmission** – Child submissions (description, photo, status, points awarded)
- **Approval** – Parent decisions (approve/reject with feedback)
- **Achievement** – Earned badges with icons and descriptions
- **DailyStreak** – Daily completion tracking
- **Rule** – Household rules with icons and order
- **RuleAcknowledgment** – Tracks which children acknowledged which rules
- **Notification** – Parent notifications
- **ChildNotification** – Child notifications
- **RewardConfig** – Parent-configurable points, bonuses, and level thresholds

## 🎮 Gamification System

Points are **only** awarded after parent approval (not on submission):

1. Child submits activity completion → status: PENDING
2. Parent reviews and approves → `awardPoints()` runs:
   - Base points from activity or reward config
   - Streak bonuses (3/7/30 day streaks)
   - Level recalculation
   - Badge checking (17 badges across categories, streaks, and levels)
3. Child receives notification with points earned and new badges

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- Child PINs hashed with bcrypt (10 rounds)
- Role-based access control via middleware + API auth checks
- Parent ownership verification on all mutations
- File upload validation (type, size, extension)
- No public exposure of child photos
- Duplicate submission prevention (unique constraint on activity+child+date)
- Duplicate point award prevention (atomic check on `pointsAwarded` field)

## 📝 API Documentation

All API routes return `{ success: boolean, data?: T, error?: string, message?: string }` with appropriate HTTP status codes.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register parent account |
| GET | `/api/dashboard/child` | Child dashboard data |
| GET | `/api/dashboard/parent` | Parent dashboard data |
| GET/POST | `/api/activities` | List/create activities |
| PUT/DELETE | `/api/activities/[id]` | Update/delete activity |
| POST | `/api/schedules` | Assign activity to child |
| POST | `/api/submissions` | Child submits activity |
| POST | `/api/approvals` | Parent approves/rejects |
| GET/POST | `/api/children` | List/create children |
| PUT/DELETE | `/api/children/[id]` | Update/delete child |
| GET/POST | `/api/rules` | List/create rules |
| POST | `/api/rules/acknowledge` | Child acknowledges rule |
| GET/PUT | `/api/rewards/config` | Get/update reward config |
| GET | `/api/reports/child/[id]` | Full analytics report |
| GET | `/api/calendar/[childId]` | Monthly calendar data |
| GET | `/api/achievements/[childId]` | All achievements |
| POST | `/api/upload` | Photo upload |
| GET | `/api/notifications/child` | Child notifications |
| GET | `/api/notifications/parent` | Parent notifications |

## 🌍 Deployment

### To Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL` – PostgreSQL connection string
   - `NEXTAUTH_SECRET` – Random 32+ char string
   - `NEXTAUTH_URL` – Your deployment URL
   - `UPLOAD_DIR` – Upload directory path
   - `MAX_FILE_SIZE_MB` – Max upload size
4. For PostgreSQL, update `prisma/schema.prisma` datasource provider to `postgresql` and update `prisma.config.ts`
5. Run `prisma migrate deploy` in the build step

### To Other Platforms

The app is a standard Next.js application. Use `npm run build` and `npm start` for production. Configure your database URL in environment variables.

## 🧪 Testing Instructions

1. Start the dev server: `npm run dev`
2. Open http://localhost:3000
3. Test the landing page – should show the animated welcome with admission ticket
4. Login as parent (parent@yuansworld.com / parent123)
5. Navigate the parent dashboard, create activities, assign to child
6. Logout, login as child (yuan123 / 1234)
7. Acknowledge rules, complete activities, upload photos
8. Switch back to parent, approve submissions, check reports

## ⚙️ Environment Variables

```env
# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB="5"
```

## 📄 License

This project is for educational/family use.
