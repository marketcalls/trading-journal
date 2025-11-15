# Trade Journal API - Backend

FastAPI backend for the Trade Journal application.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and update if needed:
```bash
cp .env.example .env
```

## Running the Server

```bash
python run.py
```

Or using uvicorn directly:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Features

- **Authentication**: JWT-based authentication with login/register
- **User Management**: Admin can manage all users (first user is automatically admin)
- **Portfolios**: Users can create multiple trading portfolios
- **Trades**: Record trades with entry/exit prices, notes, screenshots, and tags
- **Analytics**: Comprehensive trading statistics including win rate, P&L, profit factor

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get specific user
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
- `POST /api/trades/{id}/close` - Close trade and calculate P&L
- `POST /api/trades/{id}/screenshot` - Upload screenshot
- `DELETE /api/trades/{id}` - Delete trade

### Analytics
- `GET /api/analytics/portfolio/{id}` - Get portfolio analytics
- `GET /api/analytics/portfolio/{id}/by-symbol` - Get analytics by symbol
