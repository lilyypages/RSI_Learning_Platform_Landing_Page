from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # FastAPI
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_debug: bool = True

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_db_url: str = ""

    @property
    def database_url(self) -> str:
        if self.supabase_db_url:
            return self.supabase_db_url
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # Fallback PostgreSQL (for local dev without Supabase)
    postgres_user: str = "sipanda"
    postgres_password: str = "sipanda123"
    postgres_db: str = "sipanda"
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
