# JobRobots AI - Admin Panel

A comprehensive admin dashboard for managing the JobRobots AI SaaS platform.

## Features

### Authentication
- Secure login with email/password
- JWT-based authentication
- Role-based access control (admin/superadmin)
- Login history tracking

### Dashboard
- Total users overview
- Active users count
- New user growth rate
- Plan distribution charts
- Recent signups table

### User Management
- View all users with pagination
- Search by name or email
- Filter by status and plan
- Suspend/unsuspend users
- Delete users (superadmin only)
- Export users to CSV

### Subscription Management
- View subscription distribution
- Upgrade/downgrade user plans
- Manage subscription status
- Plan statistics (Free/Standard/Unlimited/Agency)

### AI Usage Control
- Track AI credits usage
- Monitor heavy users
- Edit user credits
- View resume generations and interview sessions

### Analytics
- User growth metrics
- Plan conversion rates
- Visual charts and graphs
- Status distribution

### Settings
- Admin profile management
- Broadcast announcements
- Security information
- Logout functionality

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router v6
- **Backend**: Node.js + Express
- **Database**: MongoDB

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB connection
- Backend server running on port 5000

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install admin panel dependencies
cd admin-panel
npm install
```

### Create Admin User

```bash
cd backend
npm run seed:admin
```

This creates a superadmin account:
- **Email**: admin@jobrobots.ai
- **Password**: JobRobots@2024!

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Admin Panel:**
```bash
cd admin-panel
npm run dev
```

### Access

- **Admin Panel**: http://localhost:3002
- **User Panel**: http://localhost:5173
- **API**: http://localhost:5001

## API Endpoints

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/me` | Get current admin |
| GET | `/api/admin/users` | List all users |
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

## Security

- All admin routes protected by JWT
- Token expiry: 24 hours
- Separate admin schema from users
- Role-based middleware protection
- Login history tracking
- Admin-only access to sensitive operations

## Project Structure

```
jobrobots-ai/
├── backend/
│   ├── models/
│   │   └── Admin.js          # Admin schema
│   ├── middleware/
│   │   └── adminAuth.js      # Admin authentication
│   ├── routes/
│   │   └── admin.js          # Admin API routes
│   ├── seed-admin.js         # Create initial admin
│   └── server.js             # Express server
│
└── admin-panel/
    ├── src/
    │   ├── components/
    │   │   └── Layout.jsx   # Sidebar layout
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Users.jsx
    │   │   ├── Subscriptions.jsx
    │   │   ├── AIUsage.jsx
    │   │   ├── Analytics.jsx
    │   │   └── Settings.jsx
    │   ├── services/
    │   │   └── api.js
    │   └── App.jsx
    └── package.json
```

## Environment Variables

Backend `.env`:
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
PORT=5000
```

## Plans & Pricing

| Plan | Price | AI Credits |
|------|-------|------------|
| Free | $0 | 10 |
| Standard | $29/mo | 50 |
| Unlimited | $49/mo | Unlimited |
| Agency | $99/mo | Unlimited |

## License

Private - JobRobots AI
