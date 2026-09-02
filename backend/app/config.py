import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "RazorCartAI"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./razorcart.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "razorcart-super-secret-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Groq LLM
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    # Razorpay Test Credentials
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_mock_razorcart2026")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "mock_secret_razorcart2026")
    RAZORPAY_MOCK_MODE: bool = os.getenv("RAZORPAY_MOCK_MODE", "true").lower() == "true"

    class Config:
        case_sensitive = True

settings = Settings()
