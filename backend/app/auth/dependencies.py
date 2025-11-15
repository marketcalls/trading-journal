from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.auth.utils import verify_token
from app.schemas.user import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    print(f"DEBUG: Received token: {token[:20]}..." if token else "DEBUG: No token received")

    payload = verify_token(token)
    print(f"DEBUG: Payload: {payload}")

    if payload is None:
        print("DEBUG: Payload is None - token verification failed")
        raise credentials_exception

    user_id_str = payload.get("sub")
    print(f"DEBUG: user_id from payload: {user_id_str} (type: {type(user_id_str)})")

    if user_id_str is None:
        print("DEBUG: user_id is None")
        raise credentials_exception

    try:
        user_id = int(user_id_str)
        print(f"DEBUG: Converted user_id to int: {user_id}")
    except (ValueError, TypeError) as e:
        print(f"DEBUG: Failed to convert user_id to int: {e}")
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        print(f"DEBUG: User not found with id: {user_id}")
        raise credentials_exception

    print(f"DEBUG: User found: {user.username}")
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
