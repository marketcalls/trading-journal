from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.trade import TradeType, TradeStatus


class TradeBase(BaseModel):
    symbol: str
    trade_type: TradeType
    entry_price: float
    entry_date: datetime
    quantity: float
    notes: Optional[str] = None
    tags: Optional[str] = None


class TradeCreate(TradeBase):
    portfolio_id: int


class TradeUpdate(BaseModel):
    symbol: Optional[str] = None
    trade_type: Optional[TradeType] = None
    entry_price: Optional[float] = None
    entry_date: Optional[datetime] = None
    quantity: Optional[float] = None
    exit_price: Optional[float] = None
    exit_date: Optional[datetime] = None
    status: Optional[TradeStatus] = None
    notes: Optional[str] = None
    tags: Optional[str] = None


class TradeClose(BaseModel):
    exit_price: float
    exit_date: datetime


class Trade(TradeBase):
    id: int
    portfolio_id: int
    status: TradeStatus
    exit_price: Optional[float] = None
    exit_date: Optional[datetime] = None
    profit_loss: Optional[float] = None
    profit_loss_percentage: Optional[float] = None
    screenshot_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
