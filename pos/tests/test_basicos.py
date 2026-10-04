from pos import config, formato


def test_precio_como_la_web():
    # Igual que formatearPrecio: sin decimales, punto de miles.
    assert formato.precio(0) == "$ 0"
    assert formato.precio(18000) == "$ 18.000"
    assert formato.precio(1480000.4) == "$ 1.480.000"


def test_config_prefiere_variables_de_entorno(monkeypatch):
    monkeypatch.setenv("POS_SUPABASE_URL", "https://ejemplo.supabase.co")
    monkeypatch.setenv("POS_SUPABASE_KEY", "sb_publishable_prueba")
    assert config.cargar() == config.Config("https://ejemplo.supabase.co", "sb_publishable_prueba")


def test_web_env_lee_solo_las_variables_publicas(tmp_path):
    env = tmp_path / ".env"
    env.write_text(
        "# comentario\n"
        "DATABASE_URL=postgres://usuario:secreto@host/db\n"
        "NEXT_PUBLIC_SUPABASE_URL=https://x.supabase.co\n"
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_x"\n'
        "SUPABASE_SECRET_KEY=sb_secret_no\n",
        encoding="utf-8",
    )
    assert config._desde_web_env(env) == config.Config("https://x.supabase.co", "sb_publishable_x")


def test_web_env_incompleto_no_sirve(tmp_path):
    env = tmp_path / ".env"
    env.write_text("NEXT_PUBLIC_SUPABASE_URL=https://x.supabase.co\n", encoding="utf-8")
    assert config._desde_web_env(env) is None
