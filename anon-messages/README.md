# Whispr — Anonymous Messages

A site like NGL/Sayat.me: sign up, get a shareable link, and anyone can send you an
anonymous message without an account of their own. Same design system as the other apps
in this set (black/white glassmorphism, React + Vite + TypeScript + Tailwind, Node/Express,
Supabase).

## How it works

1. Sign up → you get a link like `yourdomain.com/u/yourusername`.
2. Share that link anywhere (bio, story, chat).
3. Anyone who visits it can type a message and send it — no login, no account, and no
   sender identity is stored anywhere in the database. Not even at the database level.
4. You see incoming messages in your **Inbox**, live (Supabase Realtime), with a
   read/unread dot. You can delete any message.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind |
| Backend | Node.js + Express |
| Database/Auth | Supabase (Postgres, Auth, Storage, Realtime) |
| Deployment | Docker on Render |

## 1. Create a new Supabase project

Fresh project, separate from your other apps — different schema.

1. **SQL Editor** → paste all of `sql/schema.sql` → Run. Creates `profiles`, `messages`,
   RLS policies, the avatars bucket, and enables Realtime.
2. **Project Settings → API** → copy Project URL, `anon` key, `service_role` key.

## 2. Environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Fill in the 3 Supabase values in each.

## 3. Run locally

```bash
cd backend && npm install && npm run dev
```
```bash
cd frontend && npm install && npm run dev
```
Visit `http://localhost:5173` for the sign-up screen, or `http://localhost:5173/u/someusername`
to see the public send page for an existing user.

## 4. Deploy to Render

Same flow as the other apps: push to GitHub → Render → New Web Service → Docker → point
at the repo → set Root Directory if needed → Health Check Path `/api/health` → add env
vars → deploy → add `FRONTEND_URL` after the first deploy gives you a URL.

## Abuse-prevention notes

Since this product's whole point is letting strangers message you, a few things are
already built in — worth understanding before wider use:

- **Sending is rate-limited** to 15 messages/hour per IP address (`sendLimiter` in
  `backend/src/middleware/rateLimiter.js`), independent of any login, since senders are
  anonymous by design. Adjust this if it's too strict or too loose for your use case.
- **No sender data is stored** — not an IP, not a cookie, not a fingerprint. This is
  intentional (matches the product's promise of anonymity) but also means you have no
  way to identify or block a specific abusive sender after the fact. If you need that
  tradeoff to go the other way (some accountability in exchange for less pure anonymity),
  that's a deliberate design change, not a bug fix — worth thinking through before
  launching if harassment is a real concern for your audience.
- **Message length is capped** at 500 characters server-side.
- **Recipients can delete** any message from their inbox at any time.
- There's no content moderation / profanity filtering built in. Consider adding one
  (e.g. a keyword blocklist, or a moderation API call before insert) if this goes out to
  a wider or younger audience.
