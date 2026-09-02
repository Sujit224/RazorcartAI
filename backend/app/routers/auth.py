import json
from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security_scheme = HTTPBearer(auto_error=False)

# ─────────────────────────────────────────────
# JWT Helpers
# ─────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")

def _format_user(user: User) -> dict:
    try:
        sh = json.loads(user.search_history or "[]")
    except Exception:
        sh = []
    try:
        vp = json.loads(user.viewed_product_ids or "[]")
    except Exception:
        vp = []
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "city": user.city,
        "merchant_id": user.merchant_id,
        "merchant_name": user.merchant_name,
        "search_history": sh,
        "viewed_product_ids": vp,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }

# ─────────────────────────────────────────────
# Dependency Injection: get current user from Bearer token
# ─────────────────────────────────────────────

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header missing.")
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return user

def require_merchant(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("merchant", "admin"):
        raise HTTPException(status_code=403, detail="Merchant access required.")
    return current_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Razorpay Admin access required.")
    return current_user

# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@router.post("/login")
def login(req: dict, db: Session = Depends(get_db)):
    email = req.get("email", "").strip().lower()
    password = req.get("password", "")
    role_hint = req.get("role")   # optional: "customer" | "merchant" | "admin"

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not bcrypt.checkpw(password.encode("utf-8"), user.hashed_password.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Role mismatch guard
    if role_hint and user.role != role_hint:
        raise HTTPException(
            status_code=403,
            detail=f"This account is registered as '{user.role}'. Please use the correct login portal."
        )

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "merchant_id": user.merchant_id,
    })
    return {"access_token": token, "token_type": "bearer", "user": _format_user(user)}


@router.post("/register")
def register(req: dict, db: Session = Depends(get_db)):
    email = req.get("email", "").strip().lower()
    name = req.get("name", "").strip()
    password = req.get("password", "")
    city = req.get("city", "Bengaluru").strip()
    role = req.get("role", "customer").strip().lower()
    merchant_name = req.get("merchant_name", "").strip()
    merchant_id = req.get("merchant_id", "").strip()
    admin_code = req.get("admin_code", "").strip()

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    if role not in ("customer", "merchant", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role specified. Must be customer, merchant, or admin.")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    # Role-specific validations & defaults
    if role == "merchant":
        if not merchant_name:
            merchant_name = f"{name}'s Store"
        if not merchant_id:
            import uuid
            merchant_id = f"merch_{uuid.uuid4().hex[:6]}"
    elif role == "admin":
        merchant_id = None
        merchant_name = None
        if admin_code and admin_code not in ("RAZORPAY_ADMIN_2026", "admin123", "ADMIN", "razorpay"):
            raise HTTPException(status_code=403, detail="Invalid Razorpay Admin Authorization Code.")
    else:
        merchant_id = None
        merchant_name = None

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(
        name=name,
        email=email,
        hashed_password=hashed,
        city=city or "Bengaluru",
        role=role,
        merchant_id=merchant_id,
        merchant_name=merchant_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "merchant_id": user.merchant_id,
    })
    return {"access_token": token, "token_type": "bearer", "user": _format_user(user)}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return _format_user(current_user)


@router.post("/switch-persona/{user_id}")
def switch_persona(user_id: int, db: Session = Depends(get_db)):
    """Demo persona switcher (customers only)."""
    user = db.query(User).filter(User.id == user_id, User.role == "customer").first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer persona not found.")
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": "customer", "merchant_id": None})
    return {"access_token": token, "token_type": "bearer", "user": _format_user(user)}
