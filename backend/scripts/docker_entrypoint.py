"""Point d'entrée du conteneur API : prépare la base puis démarre le serveur.

Séquence exécutée à chaque démarrage du conteneur :
    1. attendre que PostgreSQL accepte les connexions (le healthcheck du
       compose aide déjà, mais on reste robuste face aux redémarrages) ;
    2. créer les tables manquantes (idempotent : ne touche pas l'existant) ;
    3. injecter les données de démonstration SI la base est vide
       (le seed est lui-même idempotent) ;
    4. lancer uvicorn (remplace le processus courant via exec).

Résultat : `docker compose up` suffit pour obtenir une application
entièrement fonctionnelle ET peuplée, sans commande manuelle — exactement
ce qu'un jury ou un recruteur veut voir.
"""

import os
import time

from sqlalchemy import func, select
from sqlalchemy.exc import OperationalError


def wait_for_db(max_attempts: int = 30) -> None:
    from app.db.session import engine

    for attempt in range(1, max_attempts + 1):
        try:
            with engine.connect():
                print(f"[entrypoint] PostgreSQL prêt (tentative {attempt}).")
                return
        except OperationalError:
            print(f"[entrypoint] PostgreSQL indisponible, nouvelle tentative {attempt}/{max_attempts}…")
            time.sleep(2)
    raise SystemExit("[entrypoint] PostgreSQL inatteignable — abandon.")


def create_tables() -> None:
    from app import models  # noqa: F401  (enregistre les tables)
    from app.db.base import Base
    from app.db.session import engine

    Base.metadata.create_all(bind=engine)
    print("[entrypoint] Tables créées / vérifiées.")


def seed_if_empty() -> None:
    from app.db.session import SessionLocal
    from app.models import Client

    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Client)):
            print("[entrypoint] Données déjà présentes — seed ignoré.")
            return
    from scripts.seed import seed

    seed()


def main() -> None:
    wait_for_db()
    create_tables()
    seed_if_empty()
    print("[entrypoint] Démarrage d'uvicorn…")
    os.execvp(
        "uvicorn",
        ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
    )


if __name__ == "__main__":
    main()
