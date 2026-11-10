# 🚀 Deployment Guide

This guide covers deploying Yuan's World to production.

---

## Option A: Vercel + Neon PostgreSQL (Recommended)

### Step 1: Create a PostgreSQL database

1. Go to [neon.tech](https://neon.tech) and sign up (free tier, no credit card)
2. Create a new project named `yuans-world`
3. Copy the connection string:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/yuans_world?sslmode=require
   ```

### Step 2: Push your code to GitHub

```bash
git init
git add .
git commit -m "Yuan's World - children's habit tracking platform"
git remote add origin https://github.com/yourusername/yuans-world.git
git push -u origin main
```

### Step 3: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Select your `yuans-world` repository
4. Vercel auto-detects Next.js — keep the defaults

### Step 4: Set environment variables

In the Vercel project settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://user:password@ep-xxx...neon.tech/yuans_world?sslmode=require` |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` (your Vercel URL) |
| `MAX_FILE_SIZE_MB` | `5` |

> **Note:** Do NOT set `UPLOAD_STORAGE`. When omitted, photos are stored as data-URLs in the database, which works on Vercel's serverless runtime.

### Step 5: Deploy & seed

1. Click **Deploy** — the `postinstall` script auto-runs `prisma generate`
2. After the first deploy, run the database migration and seed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Link your local project to Vercel
vercel link

# Run migrations against the production database
# (Temporarily set DATABASE_URL to your Neon connection string)
$env:DATABASE_URL="postgresql://your-neon-connection-string"
npx tsx scripts/switch-provider.ts
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

3. Visit your Vercel URL and log in:
   - Parent: `parent@yuansworld.com` / `parent123`
   - Child: `yuan123` / `1234`

---

## Option B: Self-Hosted (VPS / Docker)

Best if you want to keep SQLite for simplicity.

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./data/dev.db
      - NEXTAUTH_SECRET=your-secret-key-change-me
      - NEXTAUTH_URL=http://localhost:3000
      - UPLOAD_STORAGE=disk
      - UPLOAD_DIR=./uploads
      - MAX_FILE_SIZE_MB=5
    volumes:
      - db-data:/app/prisma/data
      - uploads:/app/uploads

volumes:
  db-data:
  uploads:
```

### Dockerfile

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
EXPOSE 3000
CMD ["npm", "start"]
```

### Running with Docker

```bash
docker-compose up -d --build

# Run migrations and seed
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx tsx prisma/seed.ts
```

---

## Option C: Render / Railway / Fly.io

Similar to Vercel but with persistent disk:

1. Create a PostgreSQL database on the platform
2. Set the same environment variables as Option A
3. If the platform supports persistent disks, set `UPLOAD_STORAGE=disk` and `UPLOAD_DIR=/data/uploads`
4. Add a build command: `npm run build`
5. Add a start command: `npm start`
6. Add a postbuild: `npx prisma migrate deploy && npx tsx prisma/seed.ts`

---

## Post-Deployment Checklist

- [ ] Set a strong `NEXTAUTH_SECRET` (not the dev default)
- [ ] Run `prisma migrate deploy` against the production database
- [ ] Run `prisma/seed.ts` to create demo data (or skip if you want a clean start)
- [ ] Test parent login → create a child → create activities → assign to child
- [ ] Test child login → acknowledge rules → complete activity → upload photo
- [ ] Test parent approval flow → verify points/badges awarded
- [ ] Update `NEXTAUTH_URL` to your final domain if it changed

## File Upload Notes

| Environment | `UPLOAD_STORAGE` | How photos are stored |
|-----------|-----------------|----------------------|
| Local dev | `disk` | Saved to `./uploads/` on filesystem |
| Vercel (serverless) | *(omit)* | Stored as data-URL in database column |
| VPS / Docker | `disk` | Saved to persistent volume |

For production with many users, consider switching to cloud storage (S3, Cloudinary, Vercel Blob). The upload route at `src/app/api/upload/route.ts` is structured to make this swap straightforward.

## Database Provider Auto-Switching

The `scripts/switch-provider.ts` script runs automatically during `postinstall` and `db:generate`. It reads `DATABASE_URL` and updates `prisma/schema.prisma` to use the correct provider:

- URL starts with `postgresql://` → provider = `postgresql`
- URL starts with `file:` → provider = `sqlite`

This means the same codebase works for both local SQLite development and production PostgreSQL without manual schema edits.
