from supabase import create_client, Client

from src.config import settings

supabase: Client = create_client(
    supabase_url=settings.supabase_url,
    supabase_key=settings.supabase_service_role_key,
)


def get_supabase_admin() -> Client:
    return supabase


def get_supabase_public() -> Client:
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_anon_key,
    )
