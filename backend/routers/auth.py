from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from db.connection import get_db
from db.models_db import User
from auth.hashing import verify_password
from auth.jwt import create_access_token, timedelta, ACCESS_TOKEN_EXPIRE_MINUTES
from auth.dependencies import get_current_user, log_audit

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == req.email)
    res = await db.execute(stmt)
    user = res.scalars().first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    
    host = request.client.host if request.client else "127.0.0.1"
    await log_audit(db, user.id, user.email, "LOGIN", "USER", str(user.id), {}, host)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "email": user.email,
        "full_name": user.full_name,
        "department_id": user.department_id,
        "user_id": str(user.id)
    }

@router.post("/logout")
async def logout(request: Request, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    host = request.client.host if request.client else "127.0.0.1"
    await log_audit(db, current_user.id, current_user.email, "LOGOUT", "USER", str(current_user.id), {}, host)
    return {"message": "Logged out successfully"}

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "department_id": current_user.department_id,
        "is_active": current_user.is_active
    }
