"""
Application Configuration
Loads settings from environment variables or .env file with production-ready defaults.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


# Locate .env in backend directory or parent project root
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
ENV_PATH = ROOT_DIR / ".env" if (ROOT_DIR / ".env").exists() else BASE_DIR / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "UK Wind Forecast & Accuracy Analytics"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    
    # Server Binding
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
    
    # MongoDB Persistence & Caching
    MONGODB_URI: str = ""
    DATABASE_NAME: str = "gopratle"
    
    # Elexon API Endpoints
    ELEXON_BASE_URL: str = "https://data.elexon.co.uk/bmrs/api/v1"
    ELEXON_TIMEOUT_SECONDS: int = 25
    ELEXON_MAX_RETRIES: int = 3
    
    # Defaults
    DEFAULT_DECISION_START_DATE: str = "2026-01-01"
    DEFAULT_DECISION_END_DATE: str = "2026-01-31"
    DEFAULT_CUTOFF_TIME: str = "11:00"  # 11:00 London time (Day-ahead auction gate closure)
    TIMEZONE: str = "Europe/London"
    
    # Cache duration (24 hours)
    CACHE_TTL_SECONDS: int = 86400

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [orig.strip() for orig in self.CORS_ORIGINS.split(",") if orig.strip()]


settings = Settings()
