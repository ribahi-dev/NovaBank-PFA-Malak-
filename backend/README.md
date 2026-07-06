# Backend

Ce dossier contient l'API FastAPI et la couche base de données du projet.

## Première étape

Créer l'environnement virtuel Python :

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Créer un fichier `.env` à partir de `.env.example`, puis adapter `DATABASE_URL`.

## Base de données

Le projet utilise SQLAlchemy pour représenter les tables sous forme de classes Python.

Entités principales :

- `User` : utilisateur de la plateforme
- `Client` : client bancaire simulé
- `Account` : compte bancaire simulé
- `Transaction` : dépôt, retrait ou virement simulé
- `RiskScore` : score IA associé à une transaction
- `Alert` : alerte créée si le score est élevé
- `AuditLog` : journalisation des actions sensibles

