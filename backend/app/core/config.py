from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Airline Dynamic Pricing API"
    api_v1_prefix: str = "/api/v1"
    # Comma-separated list, e.g. "http://localhost:3000,https://yourapp.vercel.app"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    model_version: str = "v1.0.0"
    database_url: str = "sqlite:///./app.db"
    brevo_api_key: str = ""
    brevo_sender_email: str = ""
    # Base URL of the deployed frontend — used to build the reset-password link in emails.
    frontend_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
