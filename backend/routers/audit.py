from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from db.connection import get_db
from db.models_db import AuditLog, User
from auth.dependencies import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["audit"])

@router.get("")
async def get_audit_logs(limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
    res = await db.execute(stmt)
    logs = res.scalars().all()
    return logs
