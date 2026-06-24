from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Airline Dynamic Pricing API"
    api_v1_prefix: str = "/api/v1"
    # Comma-separated list, e.g. "http://localhost:3000,https://yourapp.vercel.app"
    cors_origins: str = "http://localhost:3000"
    model_version: str = "v1.0.0"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
