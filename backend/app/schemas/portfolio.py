from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PortfolioBase(BaseModel):
    name: str
    description: Optional[str] = None
    initial_balance: float = 0.0


class PortfolioCreate(PortfolioBase):
    pass


class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    initial_balance: Optional[float] = None


class Portfolio(PortfolioBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
