from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pathlib import Path
import shutil
from datetime import datetime
from app.database import get_db
from app.schemas.trade import Trade, TradeCreate, TradeUpdate, TradeClose
from app.models.trade import TradeStatus
from app.crud import trade as trade_crud
from app.crud import portfolio as portfolio_crud
from app.auth.dependencies import get_current_active_user
from app.models import User

router = APIRouter(prefix="/trades", tags=["trades"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/screenshots")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


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


@router.get("/portfolio/{portfolio_id}", response_model=List[Trade])
async def get_portfolio_trades(
    portfolio_id: int,
    status: Optional[TradeStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all trades for a portfolio"""
    await verify_portfolio_ownership(portfolio_id, current_user.id, db)
    trades = await trade_crud.get_portfolio_trades(db, portfolio_id=portfolio_id, status=status)
    return trades


@router.post("/", response_model=Trade, status_code=status.HTTP_201_CREATED)
async def create_trade(
    trade: TradeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new trade"""
    await verify_portfolio_ownership(trade.portfolio_id, current_user.id, db)
    return await trade_crud.create_trade(db, trade=trade)


@router.get("/{trade_id}", response_model=Trade)
async def get_trade(
    trade_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific trade"""
    trade = await trade_crud.get_trade_by_id(db, trade_id=trade_id)
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )

    # Verify ownership through portfolio
    await verify_portfolio_ownership(trade.portfolio_id, current_user.id, db)
    return trade


@router.patch("/{trade_id}", response_model=Trade)
async def update_trade(
    trade_id: int,
    trade_update: TradeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a trade"""
    trade = await trade_crud.get_trade_by_id(db, trade_id=trade_id)
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )

    # Verify ownership through portfolio
    await verify_portfolio_ownership(trade.portfolio_id, current_user.id, db)

    updated_trade = await trade_crud.update_trade(db, trade_id=trade_id, trade_update=trade_update)
    return updated_trade


@router.post("/{trade_id}/close", response_model=Trade)
async def close_trade(
    trade_id: int,
    trade_close: TradeClose,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Close a trade and calculate P&L"""
    trade = await trade_crud.get_trade_by_id(db, trade_id=trade_id)
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )

    # Verify ownership through portfolio
    await verify_portfolio_ownership(trade.portfolio_id, current_user.id, db)

    if trade.status == TradeStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trade is already closed"
        )

    closed_trade = await trade_crud.close_trade(db, trade_id=trade_id, trade_close=trade_close)
    return closed_trade


@router.post("/{trade_id}/screenshot")
async def upload_screenshot(
    trade_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a screenshot for a trade"""
    trade = await trade_crud.get_trade_by_id(db, trade_id=trade_id)
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )

    # Verify ownership through portfolio
    await verify_portfolio_ownership(trade.portfolio_id, current_user.id, db)

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files (JPEG, PNG, WebP) are allowed"
        )

    # Create unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = Path(file.filename).suffix
    filename = f"trade_{trade_id}_{timestamp}{file_extension}"
    file_path = UPLOAD_DIR / filename

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update trade with screenshot path
    from app.schemas.trade import TradeUpdate
    trade_update = TradeUpdate(screenshot_path=str(file_path))
    await trade_crud.update_trade(db, trade_id=trade_id, trade_update=trade_update)

    return {"filename": filename, "path": str(file_path)}


@router.delete("/{trade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trade(
    trade_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a trade"""
    trade = await trade_crud.get_trade_by_id(db, trade_id=trade_id)
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )

    # Verify ownership through portfolio
    await verify_portfolio_ownership(trade.portfolio_id, current_user.id, db)

    await trade_crud.delete_trade(db, trade_id=trade_id)
    return None
