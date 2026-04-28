# Personal Blog

A personal blog built with Next.js 14 + Supabase + Vercel.

---

## ✨ Features

- 🌓 **Light / Dark mode** toggle
- 📝 **WYSIWYG + Markdown** dual editor with drag-to-resize images
- 🖼️ **Post thumbnails** — first image auto-extracted from content
- 🏷️ **Hashtag** filtering
- 📌 **Pin posts** to top with optional expiry date
- ⏰ **Scheduled publish / unpublish** — auto-transition via Vercel Cron
- 💬 **Comments** per post (with spam protection & password-based deletion)
- 📖 **Guestbook** (toggleable, spam protection)
- 📊 **Visitor analytics** — daily chart, top pages, today/total visitors
- 🔐 **Supabase Auth** login
- 📦 **Backup & migration** (JSON export/import)
- 🎨 **Theme color** customization (10 presets + custom hex + live preview)
- 👤 **Profile image** + favicon sync
- 📱 **Mobile responsive** with hamburger menu
- 🚀 **Vercel** one-click deployment
- ☁️ **Supabase Storage** for post images and file attachments

---

## 🚀 Deployment Guide

### Step 1 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → create a new project
2. Open **SQL Editor** → paste and run the full contents of `supabase/schema.sql`
3. Open **SQL Editor** again → paste and run `supabase/storage.sql` (creates the `blog-media` storage bucket)
4. Go to **Authentication > Providers** → enable Email login
5. Go to **Authentication > Users** → Add User → enter your email and password
6. Go to **Project Settings > API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial blog setup"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 3 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → import your GitHub repository
2. Add **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   ```
3. Click **Deploy**

### Step 4 — Configure Supabase Auth URLs

After deployment, register your Vercel URL in Supabase:

- **Authentication > URL Configuration**
  - Site URL: `https://your-blog.vercel.app`
  - Redirect URLs: `https://your-blog.vercel.app/**`

---

## 💻 Local Development

```bash
# Copy env template and fill in your Supabase credentials
cp .env.local.example .env.local

# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev
```

Open `http://localhost:3000`

---

## 📁 Project Structure

```
blog-project/
├── app/
│   ├── page.tsx                  # Home — post list
│   ├── login/page.tsx            # Admin sign in
│   ├── write/page.tsx            # Create / edit post
│   ├── posts/[slug]/page.tsx     # Post detail + comments
│   ├── tags/page.tsx             # Tag browser
│   ├── about/page.tsx            # About page (bio from settings)
│   ├── guestbook/page.tsx        # Guestbook
│   ├── settings/page.tsx         # Admin settings
│   ├── loading.tsx               # Global loading UI
│   └── api/
│       ├── pageview/route.ts     # Record page views
│       ├── guestbook/route.ts    # Guestbook CRUD + spam guard
│       ├── comments/route.ts     # Comments CRUD + spam guard
│       └── cron/route.ts         # Scheduled post transitions (Vercel Cron)
│
├── components/
│   ├── GNB.tsx                   # Fixed top navigation + mobile hamburger
│   ├── Sidebar.tsx               # Post list + visitor stats
│   ├── PostCard.tsx              # Post card (thumbnail, badges, share)
│   ├── PostContent.tsx           # Post body renderer (HTML / Markdown)
│   ├── PostActions.tsx           # Edit / Delete buttons (post detail)
│   ├── DeleteModal.tsx           # Shared delete confirmation modal
│   ├── CommentsSection.tsx       # Post comments UI
│   ├── GuestbookClient.tsx       # Guestbook UI
│   ├── AnalyticsSection.tsx      # Visitor analytics chart (settings)
│   ├── WysiwygEditor.tsx         # TipTap editor + drag-to-resize images
│   ├── MarkdownEditor.tsx        # @uiw/react-md-editor
│   ├── ClientProviders.tsx       # Theme + color + head + page tracker
│   ├── ThemeProvider.tsx         # next-themes wrapper
│   ├── ThemeColorInjector.tsx    # Runtime CSS variable injection
│   ├── DynamicHead.tsx           # Dynamic title + favicon
│   └── PageViewTracker.tsx       # Client-side page view recording
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   └── server.ts             # Server Supabase client
│   ├── blogSettings.ts           # Cached blog settings fetch
│   ├── types.ts                  # TypeScript interfaces
│   ├── formatDate.ts             # KST date formatting (Intl)
│   ├── extractFirstImage.ts      # Extract first image from post content
│   └── storage.ts                # Supabase Storage upload/delete utils
│
├── supabase/
│   ├── schema.sql                # Full DB schema (run first)
│   └── storage.sql               # Storage bucket + RLS policies
│
├── middleware.ts                 # Supabase session refresh
├── vercel.json                   # Vercel config + Cron schedule
└── .env.local.example            # Environment variable template
```

---

## 🗄️ Database Schema

### `posts`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Author (auth.users) |
| title | text | Post title |
| content | text | HTML or Markdown body |
| content_type | text | `'wysiwyg'` \| `'markdown'` |
| slug | text | URL identifier (unique) |
| excerpt | text | Auto-generated preview text |
| thumbnail | text | First image URL/base64 |
| tags | text[] | Tag array |
| published | boolean | Public / private |
| pinned | boolean | Pinned to top |
| pinned_until | timestamptz | Pin expiry (null = permanent) |
| publish_at | timestamptz | Scheduled publish time |
| unpublish_at | timestamptz | Scheduled unpublish time |
| comments_enabled | boolean | Allow comments on this post |
| attachments | text | JSON array of attached files |
| created_at | timestamptz | Created at |
| updated_at | timestamptz | Updated at (auto) |

### `blog_settings`
| Column | Type | Description |
|--------|------|-------------|
| blog_name | text | Blog title shown in GNB |
| accent_color | text | Theme accent color (hex) |
| bio | text | About page bio (Markdown) |
| profile_image | text | Avatar base64 (also used as favicon) |
| guestbook_enabled | boolean | Show/hide guestbook |

### `page_views`
| Column | Type | Description |
|--------|------|-------------|
| path | text | Visited path |
| visitor_id | text | Anonymous visitor ID (localStorage) |
| referrer | text | Referring URL |
| created_at | timestamptz | Visit time |

### `guestbook`
| Column | Type | Description |
|--------|------|-------------|
| name | text | Visitor name |
| content | text | Message |
| password_hash | text | SHA-256 hashed password |
| ip_hash | text | Hashed IP for spam prevention |

### `comments`
| Column | Type | Description |
|--------|------|-------------|
| post_id | uuid | Parent post |
| name | text | Commenter name |
| content | text | Comment body |
| password_hash | text | SHA-256 hashed password |
| ip_hash | text | Hashed IP for spam prevention |

---

## ⚙️ Settings

All settings are managed at `/settings` (login required):

| Section | Options |
|---------|---------|
| Profile Image | Upload avatar — used on About page and as favicon |
| Blog Name | Displayed in GNB header |
| Bio | About page content (Markdown supported) |
| Theme Color | 10 presets + custom hex + live preview |
| Guestbook | Enable / disable guestbook |
| Analytics | Daily visitor chart + top pages (last 7/14/30 days) |
| Backup | Export all posts as JSON |
| Import | Import posts from JSON backup |
| Danger Zone | Delete all posts |

---

## 📌 Post Options

Available when creating or editing a post:

| Option | Description |
|--------|-------------|
| WYSIWYG / Markdown | Switch editor type |
| Public / Private | Visibility toggle |
| Pin | Pin post to top of feed |
| Comments On/Off | Enable or disable comments for this post |
| Scheduling panel | **Pin until** — auto-unpin at set time |
| | **Scheduled publish** — auto-publish at set time |
| | **Scheduled unpublish** — auto-hide at set time |
| File attachments | Upload any file type via Supabase Storage |
| Tags | Add hashtags |

---

## ⏰ Vercel Cron

`/api/cron` runs every 5 minutes (Vercel Pro) or daily (Vercel Free):

- Expired pins → `pinned = false`
- Reached `publish_at` → `published = true`
- Reached `unpublish_at` → `published = false`

To adjust frequency, edit `vercel.json`:
```json
"crons": [{ "path": "/api/cron", "schedule": "0 * * * *" }]
```
`0 * * * *` = once per hour (recommended for free plan).

---

## 🛡️ Spam Protection

Both guestbook and comments use:
- **IP-based rate limiting** — same IP must wait before posting again (guestbook: 5 min, comments: 3 min)
- **SHA-256 password hashing** — deletion password stored as hash, never plain text
- **Admin override** — logged-in admin can delete any entry without password

---

## 🛠 Tech Stack

| Category | Library |
|----------|---------|
| Framework | Next.js 14 (App Router) |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage) |
| Styling | Tailwind CSS + CSS Variables |
| WYSIWYG Editor | TipTap |
| Markdown Editor | @uiw/react-md-editor + react-markdown |
| Charts | Recharts |
| Deployment | Vercel |
| Theme | next-themes |
| Icons | lucide-react |
| Date formatting | Intl.DateTimeFormat (KST) |
