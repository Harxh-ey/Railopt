from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional
from db.connection import get_db
from db.models_db import User
from auth.dependencies import require_role
from auth.hashing import get_password_hash

router = APIRouter(prefix="/admin", tags=["admin"])

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: str
    department_id: Optional[str] = None

class UserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_role("SUPER_ADMIN"))):
    stmt = select(User)
    res = await db.execute(stmt)
    users = res.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "department_id": u.department_id,
            "department_name": None,
            "is_active": u.is_active,
        }
        for u in users
    ]

@router.post("/users")
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_role("SUPER_ADMIN"))):
    new_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password),
        role=user.role,
        department_id=user.department_id
    )
    db.add(new_user)
    await db.commit()
    return {"message": "User created", "id": new_user.id}

@router.put("/users/{user_id}")
async def update_user(user_id: str, user_update: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_role("SUPER_ADMIN"))):
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user_update.role:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    await db.commit()
    return {"message": "User updated"}

class PasswordReset(BaseModel):
    new_password: str

@router.post("/users/{user_id}/reset-password")
async def reset_password(user_id: str, reset: PasswordReset, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_role("SUPER_ADMIN"))):
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = get_password_hash(reset.new_password)
    await db.commit()
    return {"message": "Password reset successfully"}
