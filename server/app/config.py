from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import Any, Union
import json


class Settings(BaseSettings):
    # Application settings
    PROJECT_NAME: str = Field(default="MedBridge")
    PROJECT_DESCRIPTION: str = Field(default="Healthcare Web Application Backend")
    PROJECT_VERSION: str = Field(default="1.0.0")
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)

    # Database settings
    DATABASE_URL: str = Field(default="sqlite:///./medbridge.db")

    # JWT settings
    SECRET_KEY: str = Field(default="medbridge-super-secret-key-change-in-production")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440)

    # Gemini API
    GEMINI_API_KEY: str = Field(default="")

    # Encryption
    AES_SECRET_KEY: str = Field(default="medbridge-aes-key-please-replace")

    # File upload settings
    UPLOAD_DIR: str = Field(default="uploads")

    # CORS settings
    BACKEND_CORS_ORIGINS: Union[list[str], str] = Field(default=["http://localhost:3000"])

    # Twilio & SMS Triage settings
    TWILIO_ACCOUNT_SID: str = Field(default="")
    TWILIO_AUTH_TOKEN: str = Field(default="")
    TWILIO_PHONE_NUMBER: str = Field(default="")
    TWILIO_WHATSAPP_NUMBER: str = Field(default="")
    APP_BASE_URL: str = Field(default="http://localhost:3000")

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

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()