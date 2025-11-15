from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Portfolio
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate
from typing import Optional, List


async def get_portfolio_by_id(db: AsyncSession, portfolio_id: int) -> Optional[Portfolio]:
    result = await db.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
    return result.scalar_one_or_none()


async def get_user_portfolios(db: AsyncSession, user_id: int) -> List[Portfolio]:
    result = await db.execute(select(Portfolio).where(Portfolio.user_id == user_id))
    return list(result.scalars().all())


async def create_portfolio(db: AsyncSession, portfolio: PortfolioCreate, user_id: int) -> Portfolio:
    db_portfolio = Portfolio(
        **portfolio.model_dump(),
        user_id=user_id
    )
    db.add(db_portfolio)
    await db.commit()
    await db.refresh(db_portfolio)
    return db_portfolio


async def update_portfolio(
    db: AsyncSession,
    portfolio_id: int,
    portfolio_update: PortfolioUpdate
) -> Optional[Portfolio]:
    result = await db.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
    db_portfolio = result.scalar_one_or_none()

    if db_portfolio is None:
        return None

    update_data = portfolio_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_portfolio, field, value)

    await db.commit()
    await db.refresh(db_portfolio)
    return db_portfolio


async def delete_portfolio(db: AsyncSession, portfolio_id: int) -> bool:
    result = await db.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
    db_portfolio = result.scalar_one_or_none()

    if db_portfolio is None:
        return False

    await db.delete(db_portfolio)
    await db.commit()
    return True
