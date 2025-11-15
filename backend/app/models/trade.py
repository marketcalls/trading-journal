from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class TradeType(str, enum.Enum):
    LONG = "long"
    SHORT = "short"


class TradeStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)

    # Trade details
    symbol = Column(String, nullable=False, index=True)
    trade_type = Column(Enum(TradeType), nullable=False)
    status = Column(Enum(TradeStatus), default=TradeStatus.OPEN)

    # Entry details
    entry_price = Column(Float, nullable=False)
    entry_date = Column(DateTime(timezone=True), nullable=False)
    quantity = Column(Float, nullable=False)

    # Exit details (nullable for open trades)
    exit_price = Column(Float, nullable=True)
    exit_date = Column(DateTime(timezone=True), nullable=True)

    # P&L
    profit_loss = Column(Float, nullable=True)
    profit_loss_percentage = Column(Float, nullable=True)

    # Additional info
    notes = Column(Text, nullable=True)
    tags = Column(String, nullable=True)  # Comma-separated tags
    screenshot_path = Column(String, nullable=True)  # Path to screenshot file

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    portfolio = relationship("Portfolio", back_populates="trades")
