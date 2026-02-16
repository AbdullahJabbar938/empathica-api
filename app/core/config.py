# config.py
import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    WORKERS: int = int(os.getenv("WORKERS", 1))
    
    # Model settings
    # MODEL_PATH: str = os.getenv("MODEL_PATH", "./models/emotion_model")
    # USE_ONNX: bool = os.getenv("USE_ONNX", "False").lower() == "true"

    # Model settings - UPDATED
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./models/emotion_distilbert_finetuned")
    USE_ONNX: bool = os.getenv("USE_ONNX", "False").lower() == "true"
    ONNX_MODEL_PATH: str = os.getenv("ONNX_MODEL_PATH", "./models/emotion_model.onnx")
    MAX_TEXT_LENGTH: int = int(os.getenv("MAX_TEXT_LENGTH", 2000))
    
    # Security
    API_KEY: str = os.getenv("API_KEY", "empathica_ai_secret_key_2024")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your_jwt_secret_key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    
    # CORS
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5000").split(",")
    
    # Database (for caching results)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017/empathica_ai")
    
    # Performance
    CACHE_ENABLED: bool = os.getenv("CACHE_ENABLED", "True").lower() == "true"
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", 3600))  # 1 hour
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", 32))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "./logs/ai_service.log")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
