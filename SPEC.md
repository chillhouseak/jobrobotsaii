# JobRobots AI - Full Product Specification

## Concept & Vision

JobRobots AI is a premium AI-powered job search automation platform that transforms the chaotic job hunt into a streamlined, data-driven experience. Features a modern glassmorphism UI with sidebar navigation, real-time AI assistance, and comprehensive job tracking.

---

## Design Language

### Color Palette

**Dark Mode (Primary)**
- Background Primary: `#0a0a0f`
- Background Secondary: `#12121a`
- Background Tertiary: `#1a1a2e`
- Glass Surface: `rgba(255, 255, 255, 0.05)`
- Glass Border: `rgba(255, 255, 255, 0.1)`
- Text Primary: `#f0f0f5`
- Text Secondary: `#a0a0b0`

**Light Mode**
- Background Primary: `#fafbfc`
- Background Secondary: `#ffffff`
- Background Tertiary: `#f0f2f5`
- Glass Surface: `rgba(0, 0, 0, 0.05)`
- Text Primary: `#1a1a2e`

**Accent Colors**
- Primary: `#6366f1` (Indigo)
- Secondary: `#8b5cf6` (Violet)
- Accent Gradient: `linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)`
- Success: `#10b981`
- Warning: `#f59e0b`
- Error: `#ef4444`

### Typography
- Headings: Inter (700, 600)
- Body: Inter (400, 500)
- Scale: 12 / 14 / 16 / 18 / 24 / 32 / 48px

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌───────────┐ ┌───────────────────────────────────────────────┐│
│ │           │ │ Header Bar                                     ││
│ │ SIDEBAR   │ ├───────────────────────────────────────────────┤│
│ │ (280px)   │ │                                               ││
│ │           │ │ Page Content                                  ││
│ │ Logo      │ │ (Scrollable)                                 ││
│ │ Nav Items │ │                                               ││
│ │ User      │ │                                               ││
│ │ Settings  │ │                                               ││
│ │           │ │                                               ││
│ └───────────┘ └───────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Sidebar Navigation Items
1. Dashboard (Home icon)
2. Applications (Briefcase icon)
3. AI Tools (Sparkles icon)
4. Analytics (BarChart icon)
5. Resume (FileText icon)
6. Library (Bookmark icon)
7. Settings (Settings icon)

---

## Features

### 1. Dashboard
- Stats cards: Total Applications, Interviews, Offers, Rejections
- Recent activity feed
- Quick action buttons
- AI credits display

### 2. Job Application Tracker
- Kanban board with drag-and-drop
- Status: Saved → Applied → HR → Interview → Final → Offer / Rejected
- CRUD operations
- Filters and search
- Add/Edit modal

### 3. AI Answer Generator
- Question input
- Role selection
- Tone selector (Professional, Friendly, Confident)
- Length selector (Short, Medium, Long)
- Copy + Regenerate

### 4. Cold Outreach Generator
- LinkedIn Message
- Referral Request
- Cold Email
- Follow-up Email
- Tab-based interface

### 5. Cover Letter Generator
- Company/Role input
- Job description paste
- Editable output
- Export to PDF

### 6. Resume Analyzer
- Upload zone
- Score display (0-100)
- ATS compatibility
- Keyword analysis
- Improvement suggestions

### 7. Interview Prep Generator
- Behavioral questions
- Technical questions
- STAR method answers
- Export to PDF

### 8. Analytics Dashboard
- Applications over time (Line chart)
- Status distribution (Donut chart)
- Response rate gauge
- Weekly/Monthly trends

### 9. Notification System
- Toast notifications
- Notification panel
- Bell icon in header

### 10. Theme Switcher
- Dark/Light mode toggle
- Persisted in localStorage

### 11. User Profile
- Name, Email
- Skills input
- Experience level
- Target job role

---

## Technical Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB (Atlas)
- **Auth**: JWT tokens
- **AI**: Gemini API integration
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit

---

## API Endpoints

### Auth
- POST /api/auth/login (auto-create)
- GET /api/auth/me

### Applications
- GET /api/applications
- POST /api/applications
- PUT /api/applications/:id
- DELETE /api/applications/:id

### AI
- POST /api/ai/generate
- POST /api/ai/cover-letter
- POST /api/ai/outreach
- POST /api/ai/interview-prep

### Profile
- GET /api/profile
- PUT /api/profile

---

## Database Schema

### Users Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "password": "string (hashed)",
  "skills": ["string"],
  "experienceLevel": "string",
  "targetRole": "string",
  "createdAt": "Date"
}
```

### Applications Collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "company": "string",
  "role": "string",
  "link": "string",
  "status": "string",
  "appliedDate": "Date",
  "notes": "string",
  "createdAt": "Date"
}
```

### SavedContent Collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "type": "string",
  "title": "string",
  "content": "string",
  "createdAt": "Date"
}
```

---

## Admin Panel

A separate, fully-featured admin dashboard for managing the JobRobots AI platform.

### Access
- **URL**: http://localhost:3002
- **Login**: admin@jobrobots.ai / JobRobots@2024!

### Admin Features

#### 1. Dashboard
- Total users count
- Active users display
- New user growth rate
- Plan distribution pie chart
- Status distribution bar chart
- Recent signups table

#### 2. User Management
- View all users with pagination
- Search by name or email
- Filter by status (active/suspended/cancelled)
- Filter by plan (free/standard/unlimited/agency)
- Suspend/unsuspend users
- Delete users (superadmin only)
- Export users to CSV

#### 3. Subscription Management
- View subscription distribution by plan
- Upgrade/downgrade user plans
- Manage subscription status
- View user subscription details

#### 4. AI Usage Control
- Track AI credits usage per user
- Identify heavy users
- Edit user credits
- View resume generations count
- View interview sessions count

#### 5. Analytics
- User growth metrics
- Plan conversion rates
- Visual charts (Area, Bar)
- Status distribution

#### 6. Settings
- Admin profile display
- Send announcements to users
- Login history
- Logout functionality

### Admin API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/me` | Get current admin |
| GET | `/api/admin/users` | List users (paginated) |
| GET | `/api/admin/users/:id` | Get user details |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user (superadmin) |
| PUT | `/api/admin/users/:id/suspend` | Suspend/unsuspend user |
| GET | `/api/admin/analytics` | Get analytics data |
| GET | `/api/admin/subscriptions` | List subscriptions |
| PUT | `/api/admin/subscriptions/:userId` | Update subscription |
| GET | `/api/admin/ai-usage` | Get AI usage stats |
| PUT | `/api/admin/ai-usage/:userId` | Update user credits |
| GET | `/api/admin/export/users` | Export users CSV |
| POST | `/api/admin/broadcast` | Send broadcast |

### Admin Collection
```json
{
  "_id": "ObjectId",
  "email": "string (unique)",
  "password": "string (hashed)",
  "name": "string",
  "role": "admin | superadmin",
  "isActive": "boolean",
  "lastLogin": "Date",
  "loginHistory": [{
    "timestamp": "Date",
    "ip": "string",
    "userAgent": "string"
  }],
  "createdAt": "Date"
}
```

### Security
- JWT-based authentication
- Separate admin schema
- Role-based middleware (admin/superadmin)
- 24-hour token expiry
- Login history tracking
- Superadmin required for delete operations
