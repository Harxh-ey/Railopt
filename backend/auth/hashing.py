import bcrypt

def get_password_hash(password: str) -> str:
    """Generate a secure bcrypt hash using direct bcrypt library."""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash using direct bcrypt checkpw."""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        # Fallback to passlib if hash was generated with an alternative format
        try:
            from passlib.context import CryptContext
            ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
            return ctx.verify(plain_password, hashed_password)
        except Exception:
            return False
