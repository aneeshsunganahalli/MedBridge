from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import Any, Union
import json
import os

class Settings(BaseSettings):
    # Application settings
    PROJECT_NAME: str = Field(default="FastAPI Starter")
    PROJECT_DESCRIPTION: str = Field(default="FastAPI Starter Application")
    PROJECT_VERSION: str = Field(default="0.1.0")
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)
    
    # Database settings
    DATABASE_URL: str = Field(default="sqlite:///./medbridge.db")
    
    # CORS settings
    BACKEND_CORS_ORIGINS: Union[list[str], str] = Field(default=["http://localhost:3000"])
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v
    
    # Load environment variables from .env file
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

settings = Settings()