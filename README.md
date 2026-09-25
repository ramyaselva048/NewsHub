# NewsHub – AI-Powered News & Blog Platform

A full-stack news and blogging web platform featuring Google Gemini 3.8 AI summarization, real-time JWT authentication, password hashing with bcrypt, category curation, bookmarking, community comments, search, and a secure administrative command center.

---

## 🚀 Live Demo & Accounts

### Demo Accounts for Testing & Development

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `ramyaselva048@gmail.com` | `Admin@123` | Full dashboard access, create/edit/delete articles, categories, comments moderation, user management |
| **Reader** | `sarah.jenkins@newshub.com` | `User@123` | Read, search, like, bookmark, comment, edit personal profile |

> **Quick 1-Click Login:** On the Login page and Profile page, you can use the **1-Click Quick Demo Login** buttons to immediately switch between the Administrator and Reader accounts without manually typing credentials.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS (Dark/Light mode support)
- **Icons:** Lucide React
- **Typography:** Plus Jakarta Sans & Newsreader Serif
- **Features:** Responsive design (Desktop, Tablet, Mobile), instant modal search (⌘K), AI summary viewer, toast notifications, confirmation dialogs.

### Backend (Full-Stack Express & Python Flask Dual Architecture)
- **Interactive Development Server:** Node.js + Express (`server.ts`) with seamless Vite integration on port 3000.
- **Python / Flask Codebase:** Complete production Flask backend in `backend/` directory (`app/`, `routes/`, `models/`, `run.py`, `requirements.txt`).
- **Database:** PostgreSQL (SQLAlchemy ORM with Foreign Keys, Cascades, Indexes, and Constraints).
- **Authentication:** JSON Web Tokens (JWT) with HTTP Bearer authorization headers.
- **Security:** bcrypt password hashing, parameter validation, role-based access control (RBAC).
- **AI Engine:** Google Gemini API (`gemini-3.8-flash`) for executive article summarization with graceful fallback.

---

## 📂 Project Structure

```text
├── .env.example                # Environment variable template
├── metadata.json               # Applet metadata & capabilities
├── package.json                # Frontend & full-stack server scripts
├── server.ts                   # Integrated full-stack API server + Vite middlewares
├── index.html                  # HTML entrypoint with metadata and fonts
├── README.md                   # Complete architectural and deployment documentation
│
├── src/                        # React Frontend Source
│   ├── App.tsx                 # Root component with view routing and providers
│   ├── main.tsx                # React DOM render entry
│   ├── index.css               # Tailwind CSS entrypoint
│   ├── types.ts                # TypeScript domain models and interfaces
│   ├── context/
│   │   ├── AuthContext.tsx     # JWT authentication, user session, demo logins
│   │   └── ThemeContext.tsx    # Dark / Light theme toggle & persistence
│   ├── services/
│   │   └── api.ts              # Centralized typed REST API client
│   ├── components/
│   │   ├── Navbar.tsx          # Responsive navigation, categories, search trigger
│   │   ├── Footer.tsx          # Brand links, newsletter sign-up, copyright
│   │   ├── ArticleCard.tsx     # Standard, featured, and trending card variants
│   │   ├── AISummaryCard.tsx   # Gemini 3.8-flash AI executive summary card
│   │   ├── SearchModal.tsx     # Live search dialog with debounced indexing
│   │   ├── ConfirmModal.tsx    # Accessible confirmation modal for deletions
│   │   └── Toast.tsx           # Toast notification provider & alerts
│   └── pages/
│       ├── HomePage.tsx        # Hero featured story, trending news, article grid
│       ├── ArticleDetailPage.tsx # Reading view, likes, bookmarks, AI summary, comments
│       ├── CategoryPage.tsx    # Dedicated category desk feed
│       ├── SavedArticlesPage.tsx # User reading list / bookmarks library
│       ├── ProfilePage.tsx     # Account settings, stats, 1-click switcher
│       ├── LoginPage.tsx       # Auth login with 1-click demo buttons
│       ├── RegisterPage.tsx    # User registration with password validation
│       └── AdminDashboardPage.tsx # 5-tab admin control center (Stats, Articles, Desks, Users, Comments)
│
└── backend/                    # Python Flask + PostgreSQL Backend
    ├── requirements.txt        # Python dependency manifest
    ├── run.py                  # Flask application runner
    ├── config.py               # Database and JWT configuration
    ├── seed.py                 # PostgreSQL sample database seeder
    └── app/
        ├── __init__.py         # Flask app factory and blueprint registration
        ├── models.py           # SQLAlchemy PostgreSQL models (User, Article, Category, Comment, Like, Bookmark)
        ├── utils/
        │   └── auth.py         # JWT decorators and admin_required protection
        ├── services/
        │   └── ai_service.py   # Gemini API summarizer
        └── routes/
            ├── auth.py         # /api/auth (login, register, me, profile)
            ├── articles.py     # /api/articles (CRUD, trending, search, summary)
            ├── categories.py   # /api/categories (CRUD)
            ├── comments.py     # /api/articles/:id/comments, /api/comments/:id
            ├── likes.py        # /api/articles/:id/like
            ├── bookmarks.py    # /api/bookmarks, /api/articles/:id/bookmark
            └── admin.py        # /api/admin (stats, users, moderation)
```

---

## 🌐 Complete REST API Specification

### Authentication
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`)
- `POST /api/auth/login` — Sign in and receive a JWT token (`email`, `password`)
- `GET /api/auth/me` — Retrieve logged in user's profile and interaction counts
- `PUT /api/auth/profile` — Update user name, bio, or profile image

### Articles & AI
- `GET /api/articles` — Fetch published articles with pagination, category filter (`?category=`, `?page=`, `?limit=`)
- `GET /api/articles/trending` — Fetch top articles ranked by views and likes
- `GET /api/articles/search?q=` — Full-text search across titles, summaries, and contents
- `GET /api/articles/:id` — Retrieve full article by ID or slug, increment views, return related stories
- `POST /api/articles/:id/summary` — Generate an AI summary using **Gemini 3.8-flash** with smart fallback
- `POST /api/articles` — *(Admin only)* Create new article with cover image and desk assignment
- `PUT /api/articles/:id` — *(Admin only)* Update article title, content, status, or featured flag
- `PUT /api/articles/:id/status` — *(Admin only)* Toggle between 'published' and 'draft'
- `DELETE /api/articles/:id` — *(Admin only)* Delete article and cascade related interactions

### Categories / Desks
- `GET /api/categories` — List all categories with article counts
- `POST /api/categories` — *(Admin only)* Create new category
- `PUT /api/categories/:id` — *(Admin only)* Update category title or description
- `DELETE /api/categories/:id` — *(Admin only)* Delete category (protected against active references)

### Engagement (Likes, Bookmarks, Comments)
- `POST /api/articles/:id/like` — Toggle like state on an article
- `DELETE /api/articles/:id/like` — Remove like from an article
- `POST /api/articles/:id/bookmark` — Toggle bookmark state on an article
- `GET /api/bookmarks` — List all saved articles for the authenticated reader
- `GET /api/articles/:id/comments` — List comments for an article
- `POST /api/articles/:id/comments` — Post a new verified comment
- `DELETE /api/comments/:id` — Delete comment (author or admin)

### Admin Command Center
- `GET /api/admin/stats` — Overview metrics: total users, articles, views, comments, category distribution
- `GET /api/admin/users` — List registered users with contribution counts
- `PUT /api/admin/users/:id/role` — Promote user to Admin or demote to standard Reader
- `DELETE /api/admin/users/:id` — Delete user account
- `GET /api/admin/comments` — Moderate all reader comments across the platform

---

## 🗄️ Database Schema Design (PostgreSQL)

```sql
-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' NOT NULL,
  profile_image VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_users_email ON users(email);

-- Categories Table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Articles Table
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(300) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  image_url VARCHAR(500),
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'published' NOT NULL,
  views INTEGER DEFAULT 0 NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  read_time_minutes INTEGER DEFAULT 4,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_status ON articles(status);

-- Comments Table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_comments_article ON comments(article_id);

-- Likes Table
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  CONSTRAINT unique_article_user_like UNIQUE (article_id, user_id)
);

-- Bookmarks Table
CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT unique_article_user_bookmark UNIQUE (article_id, user_id)
);
```

---

## 🚢 Deployment Guide

### Option 1: Full-Stack Web Application (Render / Cloud Run)

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd react-example
   ```

2. **Set up Environment Variables:**
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` (from Google AI Studio) and a secure `JWT_SECRET_KEY`.

3. **Install and run:**
   ```bash
   npm install
   npm run build
   npm run start
   ```
   The application will serve both frontend and backend on `http://localhost:3000`.

---

### Option 2: Frontend on Vercel + Backend on Render + Database on Neon

#### A. Database Setup (Neon PostgreSQL)
1. Navigate to [Neon Console](https://neon.tech) and create a new PostgreSQL project named `newshub`.
2. Copy the Connection String URI (`postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require`).

#### B. Backend Setup (Render Web Service)
1. Fork or push the repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New + > Web Service**.
3. Select your repository and configure:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn run:app`
4. Set Environment Variables:
   - `DATABASE_URL`: Your Neon PostgreSQL Connection String
   - `JWT_SECRET_KEY`: A 32+ character random string
   - `GEMINI_API_KEY`: Your Google Gemini API Key
5. Run the initial database seed:
   In the Render Web Service Shell tab, run:
   ```bash
   python seed.py
   ```

#### C. Frontend Setup (Vercel)
1. In [Vercel Dashboard](https://vercel.com), click **Add New > Project** and import the repository.
2. Build Settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Configure API Proxy in `vite.config.ts` or add `VITE_API_URL` pointing to your Render backend service URL.
4. Deploy!

---

## 🧪 Verified User Flow Checklist

- [x] **Registration:** Create a new reader account with email validation and password confirmation.
- [x] **Login:** Sign in with registered credentials or use 1-Click Demo Login.
- [x] **Browse:** Explore hero featured story, trending ticker, and category-filtered articles.
- [x] **Instant Search:** Trigger search with `⌘K` or search bar to find matching articles.
- [x] **Reading View:** Open detailed article with high-resolution imagery and formatted typography.
- [x] **AI Summary:** Click **Generate AI Summary** to receive a 3-bullet briefing powered by Gemini 3.8 Flash.
- [x] **Interactions:** Like article (with live heart count), toggle bookmark, copy share link.
- [x] **Community Comments:** Submit a new comment and view existing community remarks.
- [x] **Reading List:** Access bookmarked stories via the **Saved Articles** library.
- [x] **Profile:** View participation statistics and update profile details.
- [x] **Admin Operations:** Switch to Admin account, view live platform analytics, draft a new dispatch, toggle publish status, manage categories, moderate reader comments, and delete articles with confirmation dialogs.
