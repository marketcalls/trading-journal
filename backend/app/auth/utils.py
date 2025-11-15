from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    try:
        print(f"DEBUG verify_token: Attempting to decode token")
        print(f"DEBUG verify_token: SECRET_KEY = {settings.SECRET_KEY[:10]}...")
        print(f"DEBUG verify_token: ALGORITHM = {settings.ALGORITHM}")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        print(f"DEBUG verify_token: Successfully decoded payload: {payload}")
        return payload
    except JWTError as e:
        print(f"DEBUG verify_token: JWTError occurred: {type(e).__name__}: {str(e)}")
        return None
    except Exception as e:
        print(f"DEBUG verify_token: Unexpected error: {type(e).__name__}: {str(e)}")
        return None
