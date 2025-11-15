from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Dict, Any
from app.database import get_db
from app.models import Trade, Portfolio
from app.models.trade import TradeStatus
from app.crud import portfolio as portfolio_crud
from app.auth.dependencies import get_current_active_user
from app.models import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


async def verify_portfolio_ownership(portfolio_id: int, user_id: int, db: AsyncSession):
    """Helper function to verify user owns the portfolio"""
    portfolio = await portfolio_crud.get_portfolio_by_id(db, portfolio_id=portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    if portfolio.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this portfolio"
        )
    return portfolio


@router.get("/portfolio/{portfolio_id}", response_model=Dict[str, Any])
async def get_portfolio_analytics(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive analytics for a portfolio"""
    portfolio = await verify_portfolio_ownership(portfolio_id, current_user.id, db)

    # Get all closed trades for calculations
    result = await db.execute(
        select(Trade).where(
            and_(
                Trade.portfolio_id == portfolio_id,
                Trade.status == TradeStatus.CLOSED
            )
        )
    )
    closed_trades = list(result.scalars().all())

    # Calculate statistics
    total_trades = len(closed_trades)
    if total_trades == 0:
        return {
            "portfolio_id": portfolio_id,
            "portfolio_name": portfolio.name,
            "total_trades": 0,
            "total_profit_loss": 0.0,
            "win_rate": 0.0,
            "average_profit_loss": 0.0,
            "best_trade": None,
            "worst_trade": None,
            "total_wins": 0,
            "total_losses": 0,
            "average_win": 0.0,
            "average_loss": 0.0,
            "profit_factor": 0.0,
        }

    total_pl = sum(t.profit_loss or 0 for t in closed_trades)
    winning_trades = [t for t in closed_trades if (t.profit_loss or 0) > 0]
    losing_trades = [t for t in closed_trades if (t.profit_loss or 0) <= 0]

    total_wins = len(winning_trades)
    total_losses = len(losing_trades)
    win_rate = (total_wins / total_trades) * 100 if total_trades > 0 else 0

    avg_pl = total_pl / total_trades if total_trades > 0 else 0
    avg_win = sum(t.profit_loss for t in winning_trades) / total_wins if total_wins > 0 else 0
    avg_loss = sum(t.profit_loss for t in losing_trades) / total_losses if total_losses > 0 else 0

    # Profit factor: total wins / abs(total losses)
    total_win_amount = sum(t.profit_loss for t in winning_trades)
    total_loss_amount = abs(sum(t.profit_loss for t in losing_trades))
    profit_factor = total_win_amount / total_loss_amount if total_loss_amount > 0 else 0

    # Best and worst trades
    best_trade = max(closed_trades, key=lambda t: t.profit_loss or 0)
    worst_trade = min(closed_trades, key=lambda t: t.profit_loss or 0)

    return {
        "portfolio_id": portfolio_id,
        "portfolio_name": portfolio.name,
        "total_trades": total_trades,
        "total_profit_loss": round(total_pl, 2),
        "win_rate": round(win_rate, 2),
        "average_profit_loss": round(avg_pl, 2),
        "best_trade": {
            "id": best_trade.id,
            "symbol": best_trade.symbol,
            "profit_loss": round(best_trade.profit_loss or 0, 2),
        },
        "worst_trade": {
            "id": worst_trade.id,
            "symbol": worst_trade.symbol,
            "profit_loss": round(worst_trade.profit_loss or 0, 2),
        },
        "total_wins": total_wins,
        "total_losses": total_losses,
        "average_win": round(avg_win, 2),
        "average_loss": round(avg_loss, 2),
        "profit_factor": round(profit_factor, 2),
    }


@router.get("/portfolio/{portfolio_id}/by-symbol", response_model=Dict[str, Any])
async def get_analytics_by_symbol(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get analytics grouped by trading symbol"""
    await verify_portfolio_ownership(portfolio_id, current_user.id, db)

    # Get all closed trades
    result = await db.execute(
        select(Trade).where(
            and_(
                Trade.portfolio_id == portfolio_id,
                Trade.status == TradeStatus.CLOSED
            )
        )
    )
    closed_trades = list(result.scalars().all())

    # Group by symbol
    symbol_stats = {}
    for trade in closed_trades:
        symbol = trade.symbol
        if symbol not in symbol_stats:
            symbol_stats[symbol] = {
                "symbol": symbol,
                "total_trades": 0,
                "total_profit_loss": 0.0,
                "wins": 0,
                "losses": 0,
            }

        symbol_stats[symbol]["total_trades"] += 1
        symbol_stats[symbol]["total_profit_loss"] += trade.profit_loss or 0
        if (trade.profit_loss or 0) > 0:
            symbol_stats[symbol]["wins"] += 1
        else:
            symbol_stats[symbol]["losses"] += 1

    # Calculate win rates
    for symbol in symbol_stats:
        total = symbol_stats[symbol]["total_trades"]
        wins = symbol_stats[symbol]["wins"]
        symbol_stats[symbol]["win_rate"] = round((wins / total) * 100, 2) if total > 0 else 0
        symbol_stats[symbol]["total_profit_loss"] = round(symbol_stats[symbol]["total_profit_loss"], 2)

    return {"symbols": list(symbol_stats.values())}
