# Trade Journal Application

A full-stack trade journal application for Indian stock market traders. Track your NSE/BSE trades, analyze performance, and manage multiple portfolios. Built with Next.js, shadcn/ui, FastAPI, and SQLite.

**🇮🇳 Designed for Indian Markets** - Currency in INR (₹), supports NSE/BSE stock symbols (RELIANCE, TCS, INFY, etc.)

## Indian Market Features

- **INR Currency** (₹) - All amounts displayed in Indian Rupees
- **NSE/BSE Support** - Track stocks from National Stock Exchange and Bombay Stock Exchange
- **Indian Stock Symbols** - RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, etc.
- **Lakhs & Crores** - Number formatting follows Indian numbering system
- **IST Timezone** - Trade times in Indian Standard Time

## Features

### Authentication & User Management
- **JWT-based authentication** with secure login and registration
- **Multi-user support** with role-based access control
- **Admin dashboard** - First user automatically becomes admin
- **User management** - Admins can manage users, toggle admin rights, activate/deactivate accounts

### Portfolio Management
- Create multiple trading portfolios
- Track initial balance and performance per portfolio
- View portfolio statistics and metrics
- Update and delete portfolios

### Trade Tracking
- **Record trades** with entry/exit prices, quantities, and dates
- **Long and short positions** support
- **Trade notes and tags** for detailed record keeping
- **Screenshot uploads** for trade setups and charts
- **Automatic P&L calculation** including percentage returns
- **Close trades** with automatic profit/loss calculation
- Filter trades by status (open/closed)

### Analytics & Insights
- **Portfolio analytics** with comprehensive metrics:
  - Total P&L and average P&L per trade
  - Win rate and profit factor
  - Best and worst trades
  - Average win vs average loss
- **Performance by symbol** - Track which symbols perform best
- **Visual charts** using Recharts:
  - Win/Loss distribution pie chart
  - P&L by symbol bar chart
- **Real-time statistics** dashboard

## Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **SQLAlchemy** - SQL toolkit and ORM with async support
- **SQLite** - Lightweight database
- **JWT** - Secure authentication
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **shadcn/ui** - Beautiful, accessible component library
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Axios** - HTTP client
- **Recharts** - Charting library
- **date-fns** - Date utilities

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── auth/          # Authentication logic
│   │   ├── crud/          # Database operations
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # API endpoints
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── config.py      # Configuration
│   │   ├── database.py    # Database setup
│   │   └── main.py        # FastAPI app
│   ├── requirements.txt
│   ├── run.py
│   └── .env
│
└── frontend/
    ├── app/
    │   ├── dashboard/     # Dashboard pages
    │   ├── login/         # Login page
    │   ├── register/      # Register page
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── ui/            # shadcn/ui components
    │   └── dashboard-nav.tsx
    ├── lib/
    │   ├── api.ts         # API client
    │   ├── store.ts       # Zustand store
    │   └── utils.ts       # Utilities
    ├── package.json
    └── tsconfig.json
```

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. The `.env` file is already configured. You can update the SECRET_KEY if needed.

5. Run the backend server:
```bash
python run.py
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file (optional):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### First Time Setup

1. **Start both servers** (backend and frontend)
2. **Navigate to** `http://localhost:3000`
3. **Register** your first account - This will automatically be an admin account
4. **Create a portfolio** to start tracking trades
5. **Add trades** to your portfolio

### Admin Features

As an admin, you can:
- View all users in the system
- Toggle admin rights for other users
- Activate/deactivate user accounts
- Delete users (except yourself)

### Managing Trades

1. **Create a Portfolio**: Start by creating a portfolio with an initial balance
2. **Record Trades**: Add trades with entry details (symbol, type, price, quantity, date)
3. **Add Notes**: Document your trading strategy, entry reasons, and observations
4. **Upload Screenshots**: Attach chart screenshots to your trades
5. **Close Trades**: When exiting a position, close the trade to calculate P&L
6. **View Analytics**: Check the analytics dashboard for performance insights

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - List all users
- `GET /api/users/{id}` - Get user by ID
- `PATCH /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Portfolios
- `GET /api/portfolios` - Get user's portfolios
- `POST /api/portfolios` - Create portfolio
- `GET /api/portfolios/{id}` - Get portfolio
- `PATCH /api/portfolios/{id}` - Update portfolio
- `DELETE /api/portfolios/{id}` - Delete portfolio

### Trades
- `GET /api/trades/portfolio/{id}` - Get portfolio trades
- `POST /api/trades` - Create trade
- `GET /api/trades/{id}` - Get trade
- `PATCH /api/trades/{id}` - Update trade
- `POST /api/trades/{id}/close` - Close trade
- `POST /api/trades/{id}/screenshot` - Upload screenshot
- `DELETE /api/trades/{id}` - Delete trade

### Analytics
- `GET /api/analytics/portfolio/{id}` - Get portfolio analytics
- `GET /api/analytics/portfolio/{id}/by-symbol` - Analytics by symbol

## Database Schema

### Users Table
- Email, username, password (hashed)
- Full name, active status, admin flag
- Created/updated timestamps

### Portfolios Table
- Name, description, initial balance
- User relationship
- Created/updated timestamps

### Trades Table
- Symbol, trade type (long/short), status (open/closed)
- Entry price, date, quantity
- Exit price, date (nullable)
- P&L, P&L percentage (calculated)
- Notes, tags, screenshot path
- Portfolio relationship
- Created/updated timestamps

## Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- Protected API routes
- CORS configuration
- SQL injection prevention via ORM
- Input validation using Pydantic

## Future Enhancements

Potential features to add:
- Email verification
- Password reset functionality
- Export trades to CSV/Excel
- Advanced charting and technical analysis
- Trade alerts and notifications
- Multiple currencies support
- Commission and fee tracking
- Tax reporting
- Trade journaling with rich text editor
- Mobile app

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please create an issue in the repository.
