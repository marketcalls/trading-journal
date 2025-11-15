# Quick Start Guide

Get your Trade Journal application up and running in minutes!

## Step 1: Install Backend Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

## Step 3: Start the Backend Server

```bash
cd backend
python run.py
```

The backend will start on `http://localhost:8000`

## Step 4: Start the Frontend Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

## Step 5: Create Your Admin Account

1. Open your browser and navigate to `http://localhost:3000`
2. Click on "Register here"
3. Fill in your details:
   - Email
   - Username
   - Password
   - Full Name (optional)
4. Click "Create Account"

**Note**: Your first account will automatically be an admin account!

## Step 6: Create Your First Portfolio

1. After logging in, click "New Portfolio"
2. Enter:
   - Portfolio Name (e.g., "Day Trading", "Swing Trading")
   - Description (optional)
   - Initial Balance
3. Click "Create Portfolio"

## Step 7: Record Your First Trade

1. Click on your portfolio
2. Click "New Trade"
3. Enter trade details:
   - Symbol (e.g., AAPL, TSLA)
   - Type (Long or Short)
   - Entry Price
   - Quantity
   - Entry Date
   - Tags (optional)
   - Notes (optional)
4. Click "Create Trade"

## Step 8: Close a Trade

1. Click on a trade to view details
2. Click "Close Trade"
3. Enter:
   - Exit Price
   - Exit Date
4. Click "Close Trade"

The system will automatically calculate your P&L!

## Step 9: View Analytics

1. Click "Analytics" in the sidebar
2. Select a portfolio from the dropdown
3. View your performance metrics:
   - Total P&L
   - Win Rate
   - Average P&L
   - Profit Factor
   - Performance charts

## Troubleshooting

### Backend won't start
- Make sure you're in the virtual environment
- Check if port 8000 is already in use
- Verify all dependencies are installed

### Frontend won't start
- Make sure node_modules are installed: `npm install`
- Check if port 3000 is already in use
- Clear the .next folder: `rm -rf .next`

### Can't login
- Make sure both backend and frontend are running
- Check the browser console for errors
- Verify the API URL in `.env.local` is correct

### Database errors
- The database is created automatically on first run
- Check if you have write permissions in the backend directory
- Delete `trade_journal.db` and restart to reset the database

## Admin Features

As an admin, you have access to the "Users" page where you can:
- View all registered users
- Make other users admins
- Activate/deactivate user accounts
- Delete users

## Tips for Success

1. **Document your trades**: Use the notes field to record your strategy and rationale
2. **Tag consistently**: Use tags to categorize trades (e.g., "breakout", "earnings", "pullback")
3. **Review analytics regularly**: Check your performance metrics weekly to identify patterns
4. **Upload screenshots**: Visual records help you review and learn from past trades
5. **Close trades promptly**: Always close your trades to maintain accurate statistics

## Next Steps

- Explore the API documentation at `http://localhost:8000/docs`
- Create multiple portfolios for different strategies
- Track your progress over time using the analytics dashboard
- Review the main README.md for detailed documentation

Happy Trading! 📈
