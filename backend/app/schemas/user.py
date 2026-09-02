from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    id: int
    name: str
    email: str
    role: str
    city: str
    merchant_id: Optional[str] = None
    merchant_name: Optional[str] = None
    search_history: List[str] = []
    viewed_product_ids: List[int] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    city: Optional[str] = "Bengaluru"

class UserLogin(BaseModel):
    email: str
    password: str
    role: Optional[str] = None  # role hint for portal validation

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserBase

# Keep UserResponse as alias for compatibility
UserResponse = UserBase
