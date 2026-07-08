# 📘 Guide complet du projet NovaBank

> **But de ce document** : te faire comprendre **chaque fichier**, son rôle et son
> pourquoi, pour que tu maîtrises le projet de A à Z et répondes à **n'importe quelle
> question du jury**. Lis-le dans l'ordre une première fois, puis utilise-le comme
> référence.

## Sommaire
1. [Vision d'ensemble en 1 minute](#1-vision-densemble)
2. [Les 3 couches et le flux d'une requête](#2-les-3-couches)
3. [Arborescence commentée](#3-arborescence)
4. [Le BACKEND fichier par fichier](#4-backend)
5. [Le FRONTEND fichier par fichier](#5-frontend)
6. [L'INFRASTRUCTURE (Docker, CI, scripts)](#6-infrastructure)
7. [Les 12 concepts clés à maîtriser](#7-concepts)
8. [Glossaire](#8-glossaire)
9. [Questions du jury + réponses](#9-jury)

---

<a name="1-vision-densemble"></a>
## 1. Vision d'ensemble en 1 minute

NovaBank est une **application web** pour une agence bancaire. Un **conseiller** saisit
des opérations (dépôt, retrait, virement). À chaque opération, un **moteur de scoring**
calcule un risque de 0 à 100 **avec une explication**. Si le risque est élevé, une
**alerte** est créée et le **directeur** la traite depuis un tableau de bord. Tout est
**sécurisé** (connexion, rôles, audit) et **conteneurisé** (Docker).

Le projet a **3 grandes parties** :
- **`frontend/`** — ce que l'utilisateur voit (React + TypeScript).
- **`backend/`** — le cerveau : l'API qui reçoit les requêtes, applique la logique, parle à la base (FastAPI + Python).
- **`docker-compose.yml` + Dockerfiles** — l'emballage qui fait tourner le tout d'un coup.

---

<a name="2-les-3-couches"></a>
## 2. Les 3 couches et le flux d'une requête

### Le schéma mental le plus important

```
  UTILISATEUR (navigateur)
        │  clique "valider un dépôt"
        ▼
┌─────────────────────┐
│  FRONTEND (React)   │   construit une requête HTTP + jeton JWT
└─────────────────────┘
        │  POST /transactions  { montant, compte... }
        ▼
┌─────────────────────────────────────────────────────┐
│  BACKEND (FastAPI)                                   │
│                                                      │
│  1. ROUTER      reçoit la requête HTTP               │
│  2. SCHÉMA      valide les données (Pydantic)        │
│  3. DÉPENDANCE  vérifie le jeton + le rôle (RBAC)    │
│  4. SERVICE     applique la logique métier :         │
│                 verrou du compte, calcul du score,   │
│                 création de l'alerte, audit          │
│  5. MODÈLE      traduit en SQL (SQLAlchemy)          │
└─────────────────────────────────────────────────────┘
        │  INSERT / UPDATE
        ▼
┌─────────────────────┐
│  BASE (PostgreSQL)  │   stocke durablement
└─────────────────────┘
```

### La règle de dépendance (à connaître par cœur)

> **`router → service → modèle`**. Une route ne parle **jamais** directement à la base ;
> un service ne connaît **jamais** le protocole HTTP.

**Pourquoi ?** Parce que ça sépare les responsabilités : on peut tester la logique métier
sans lancer de serveur web, changer la base sans réécrire les routes, et réutiliser un
service ailleurs. C'est le principe qui rend un code **professionnel et maintenable**.

---

<a name="3-arborescence"></a>
## 3. Arborescence commentée

```
NovaBank/
├── docker-compose.yml      Orchestre les 3 services (base + api + frontend)
├── demarrer.bat / .sh      Lancement en 1 clic (Windows / Mac-Linux)
├── arreter.bat             Arrêt de la plateforme
├── .gitattributes          Force les bonnes fins de ligne (CRLF pour .bat)
├── .gitignore              Fichiers que git doit ignorer
├── README.md               Vitrine du projet (démarrage, comptes de démo)
│
├── .github/workflows/
│   └── ci.yml              Intégration continue : tests auto à chaque push
│
├── docs/                   Documentation
│   ├── GUIDE_COMPLET.md    (ce fichier)
│   ├── plan_directeur.md   Vision et étapes du projet
│   ├── base_de_donnees.md  Explication du modèle de données
│   └── schema_cible.sql    Architecture BDD "grande échelle" (perspective)
│
├── backend/                L'API (le cerveau)
│   ├── app/
│   │   ├── main.py         Point d'entrée : assemble l'application FastAPI
│   │   ├── core/           Config, sécurité, dépendances transverses
│   │   ├── db/             Connexion à la base (Engine, Session, Base)
│   │   ├── models/         Les 7 tables (classes SQLAlchemy)
│   │   ├── schemas/        Contrats d'entrée/sortie de l'API (Pydantic)
│   │   ├── services/       La logique métier
│   │   └── routers/        Les points d'entrée HTTP (endpoints)
│   ├── scripts/            Outils : créer les tables, remplir, démarrer
│   ├── tests/              Les tests automatisés
│   ├── requirements.txt    Dépendances Python
│   ├── pytest.ini          Configuration des tests
│   └── Dockerfile          Recette de l'image Docker du backend
│
└── frontend/               L'interface (ce que l'on voit)
    ├── index.html          Page HTML de base
    ├── src/
    │   ├── main.tsx        Point d'entrée : monte l'application React
    │   ├── App.tsx         Le routage (quelle page pour quelle URL)
    │   ├── api/            Communication avec le backend (axios + types)
    │   ├── contexts/       États globaux (utilisateur, thème, notifications)
    │   ├── components/     Composants réutilisables (boutons, cartes, layout)
    │   ├── pages/          Les écrans (Login, Dashboard, Clients...)
    │   ├── lib/            Fonctions utilitaires
    │   └── styles/         Le design (couleurs, thème clair/sombre)
    ├── package.json        Dépendances JavaScript
    ├── vite.config.ts      Configuration de l'outil de build
    ├── nginx.conf          Config du serveur web (en production Docker)
    └── Dockerfile          Recette de l'image Docker du frontend
```

---

<a name="4-backend"></a>
## 4. Le BACKEND fichier par fichier

> 💡 **Astuce** : chaque fichier du code contient déjà un **en-tête de commentaires** qui
> explique son rôle. Ce guide en donne la synthèse. Ouvre les fichiers en parallèle.

### 4.1 — Point d'entrée & configuration (`app/main.py`, `app/core/`)

| Fichier | Rôle | Point clé pour le jury |
|---|---|---|
| **`app/main.py`** | Crée l'application FastAPI et **branche** tous les routers + le CORS. Ne contient aucune logique métier. | « Un `main.py` qui grossit est le signe d'une mauvaise architecture. Le nôtre ne fait qu'assembler. » |
| **`app/core/config.py`** | Charge la configuration depuis le fichier `.env` (mot de passe base, clé JWT, seuils) et la **valide au démarrage**. | « Le code et la configuration sont séparés (principe *12-factor*). Une variable manquante fait échouer le démarrage **tout de suite**, pas en pleine démo. » |
| **`app/core/security.py`** | Les primitives de sécurité : **hachage bcrypt** des mots de passe, **création et vérification des JWT**. | « On rejette explicitement l'algorithme `none` — une attaque JWT classique. Le mot de passe n'est jamais stocké, seulement son hachage. » |
| **`app/core/deps.py`** | Les **dépendances** réutilisables : `get_current_user` (qui est connecté ?) et `require_role` (a-t-il le droit ?). | « C'est ici que vit le **RBAC**. 401 = "je ne sais pas qui tu es" ; 403 = "je sais, mais tu n'as pas le droit". » |

### 4.2 — Base de données (`app/db/`)

| Fichier | Rôle | Point clé |
|---|---|---|
| **`app/db/base.py`** | Définit `Base`, la classe mère de tous les modèles. | Toute table hérite de `Base` pour être "reconnue" par SQLAlchemy. |
| **`app/db/session.py`** | Crée l'**Engine** (le moteur de connexion + pool) et la **Session** (l'espace de travail d'une requête). Fournit `get_db()`. | « Chaque requête HTTP obtient **sa propre** session, fermée à la fin quoi qu'il arrive — sinon fuite de connexions. » |

### 4.3 — Les modèles = les tables (`app/models/`)

Chaque fichier = une table. Un modèle décrit les colonnes en Python ; SQLAlchemy génère
le SQL correspondant.

| Fichier | Table | Contenu |
|---|---|---|
| **`user.py`** | `users` | Les utilisateurs de la plateforme (admin, directeur, conseiller) : email, mot de passe **haché**, rôle, compteur d'échecs de connexion. |
| **`client.py`** | `clients` | Les clients bancaires : nom, CIN, téléphone, profession, revenu mensuel. |
| **`account.py`** | `accounts` | Les comptes : numéro, type, **solde**, statut, lien vers le client. |
| **`transaction.py`** | `transactions` | Les opérations : type, montant, ville, compte source et destinataire. |
| **`risk_score.py`** | `risk_scores` | Le verdict du scoring : score 0-100, confiance, **explication**, version du modèle. |
| **`alert.py`** | `alerts` | Les alertes : type, niveau, statut, lien vers la transaction. |
| **`audit_log.py`** | `audit_logs` | Le journal : qui a fait quoi, quand, depuis quelle IP. |

> **Points clés à retenir :**
> - **Distinction `User` vs `Client`** : `User` = qui se **connecte** à l'app ; `Client` = qui possède des **comptes** à la banque. Les confondre est l'erreur n°1.
> - **Les montants sont en `Numeric` (décimal exact), jamais en `float`** : un float ne représente pas 0,10 exactement, les arrondis s'accumuleraient — inacceptable en banque.
> - **Les dates sont horodatées par PostgreSQL** (`server_default=func.now()`), pas par Python : une seule horloge de référence.

### 4.4 — Les schémas Pydantic (`app/schemas/`)

Les schémas définissent ce que l'API **accepte** et **renvoie**. Ils **valident** les
données à la frontière et **protègent** les données internes.

| Fichier | Contenu |
|---|---|
| **`client.py`**, **`account.py`**, **`transaction.py`**, **`user.py`**, **`alert.py`** | Pour chaque entité, 3 variantes : `...Create` (entrée à la création), `...Update` (modification partielle), `...Response` (sortie). |
| **`auth.py`** | Le format des jetons renvoyés à la connexion. |
| **`analytics.py`** | Le format des indicateurs du tableau de bord. |

> **LA question de jury classique : « pourquoi ne pas renvoyer directement les objets de
> la base ? »** Trois raisons :
> 1. **Sécurité** : le modèle `User` contient `password_hash`. Le renvoyer serait une faille. Le schéma de sortie garantit qu'il ne sort jamais.
> 2. **Découplage** : si on renomme une colonne, ça ne casse pas le frontend.
> 3. **Validation** : Pydantic rejette une donnée invalide (CIN mal formé, montant négatif) **avant** qu'elle n'atteigne la logique ou la base, avec une erreur 422 claire.

### 4.5 — Les services = la logique métier (`app/services/`)

C'est le cœur intelligent. Aucun code HTTP ici.

| Fichier | Rôle | Point clé ⭐ |
|---|---|---|
| **`transaction_service.py`** | Exécute dépôt/retrait/virement : vérifie le solde, **verrouille les comptes**, met à jour les soldes, déclenche le scoring et l'audit — **le tout de façon atomique**. | « On utilise `SELECT ... FOR UPDATE` : deux virements simultanés s'exécutent **en série**, jamais de solde corrompu. C'est le **A** et le **I** de ACID. » |
| **`scoring_service.py`** | Le moteur de risque : analyse 5 signaux, calcule le score, génère l'explication lisible. | « Il est **modulaire** : on peut remplacer les règles par un modèle de Machine Learning sans toucher au reste. » |
| **`auth_service.py`** | La connexion : vérifie le mot de passe, **verrouille le compte** après 5 échecs, journalise chaque tentative. | « Le message d'erreur est **identique** pour "email inconnu" et "mauvais mot de passe" — sinon on révélerait quels emails existent (énumération). » |
| **`audit_service.py`** | Enregistre chaque action sensible dans le journal (append-only). | « Un journal d'audit ne se modifie **jamais** : on insère, on ne met pas à jour. » |

### 4.6 — Les routers = les points d'entrée HTTP (`app/routers/`)

Chaque fichier regroupe les endpoints d'un domaine. Un router **valide → délègue au
service → traduit en réponse HTTP**.

| Fichier | Endpoints (exemples) | Accès |
|---|---|---|
| **`auth.py`** | `POST /auth/login`, `/refresh`, `GET /auth/me` | Public |
| **`users.py`** | `GET/POST/PATCH /users` | Admin |
| **`clients.py`** | `GET/POST/PATCH/DELETE /clients` | Conseiller, Directeur |
| **`accounts.py`** | `GET/POST/PATCH /accounts` | Conseiller, Directeur |
| **`transactions.py`** | `POST /transactions`, `GET /transactions` | Conseiller (saisie) |
| **`alerts.py`** | `GET/PATCH /alerts` | Directeur |
| **`analytics.py`** | `GET /analytics/kpi`, `/trends`, `/distribution` | Directeur |
| **`audit.py`** | `GET /audit-logs` | Admin |

> **Point clé : les codes HTTP.** 200 = OK, 201 = créé, 400 = requête métier refusée
> (solde insuffisant), 401 = non authentifié, 403 = non autorisé, 404 = introuvable,
> 409 = conflit (CIN déjà utilisé), 422 = données invalides. Savoir les distinguer
> montre une vraie compréhension des API REST.

### 4.7 — Les scripts (`app/scripts/`)

| Fichier | Rôle |
|---|---|
| **`create_tables.py`** | Crée les tables dans la base à partir des modèles. |
| **`seed.py`** | Remplit la base avec des **données de démo réalistes** (30 clients, ~405 transactions, 5 alertes). Reproductible (graine fixe). |
| **`docker_entrypoint.py`** | Au démarrage du conteneur : attend la base, crée les tables, injecte les données, puis lance le serveur. **C'est ce qui rend le `docker compose up` "magique".** |

### 4.8 — Les tests (`app/tests/`)

| Fichier | Vérifie |
|---|---|
| **`conftest.py`** | La "plomberie" des tests : base de test isolée, chaque test dans une transaction annulée à la fin, fabriques d'utilisateurs et de jetons. |
| **`test_health.py`** | L'API démarre et répond. |
| **`test_auth.py`** | Connexion, verrouillage après 5 échecs, refresh token. |
| **`test_rbac.py`** | Un conseiller reçoit 403 sur les routes du directeur/admin. |
| **`test_clients_api.py`**, **`test_accounts_api.py`** | CRUD complet, unicité du CIN, désactivation logique. |
| **`test_transactions_api.py`** | Soldes corrects, virement atomique, refus si solde insuffisant, alerte créée si risque élevé. |
| **`test_alerts_analytics_api.py`** | Cycle de vie d'une alerte, exactitude des indicateurs. |
| **`test_schemas_client.py`** | La validation Pydantic (rejets de données invalides). |

> **Point clé : ~40 tests, dont un tiers testent les ÉCHECS.** « Savoir qu'un système
> refuse correctement une mauvaise opération est aussi important que de savoir qu'il
> accepte une bonne. »

### 4.9 — Les fichiers de configuration du backend

| Fichier | Rôle |
|---|---|
| **`requirements.txt`** | La liste des dépendances Python, **versions figées** (`==`) pour que tout le monde installe exactement la même chose. |
| **`requirements-dev.txt`** | Outils de dev uniquement (tests, linter) — pas dans l'image de production. |
| **`pytest.ini`** | Configuration des tests (`pythonpath = .` pour que `pytest` trouve le module `app`). |
| **`Dockerfile`** | La recette pour construire l'image Docker de l'API (image légère, utilisateur non-root). |
| **`.dockerignore`** | Ce que Docker ne doit **pas** copier dans l'image (venv, caches) — build plus rapide. |
| **`.env.example`** | Le modèle de configuration (à copier en `.env`). Le vrai `.env` n'est **jamais** versionné (secrets). |

---

<a name="5-frontend"></a>
## 5. Le FRONTEND fichier par fichier

### 5.1 — Point d'entrée et routage

| Fichier | Rôle |
|---|---|
| **`index.html`** | La page HTML minimale qui accueille l'application React. |
| **`src/main.tsx`** | Monte l'application et l'**enveloppe** dans les fournisseurs globaux (Thème, Notifications, Authentification, Router). |
| **`src/App.tsx`** | Le **routage** : quelle page afficher pour quelle URL, avec **gardes de rôle** (un conseiller ne peut pas ouvrir `/dashboard`). |

### 5.2 — Communication avec le backend (`src/api/`)

| Fichier | Rôle | Point clé |
|---|---|---|
| **`api/client.ts`** | L'outil (axios) qui envoie **toutes** les requêtes. Ajoute automatiquement le jeton JWT et **renouvelle** le jeton expiré de façon transparente. | « L'utilisateur n'est jamais déconnecté brutalement : le refresh se fait tout seul. » |
| **`api/types.ts`** | Les **types TypeScript** qui décrivent les données de l'API (User, Client, Transaction...). | « Ils sont le miroir des schémas Pydantic : le typage attrape les erreurs **avant** l'exécution. » |

### 5.3 — États globaux (`src/contexts/`)

| Fichier | Rôle |
|---|---|
| **`AuthContext.tsx`** | Sait qui est connecté et son rôle. Gère `login` / `logout`. Détermine la page d'accueil selon le rôle. |
| **`ThemeContext.tsx`** | Le mode clair / sombre, mémorisé dans le navigateur. |
| **`ToastContext.tsx`** | Les petites notifications animées (« Client créé », « Erreur »). |

### 5.4 — Composants réutilisables (`src/components/`)

- **`components/ui/`** — les briques de base, style *shadcn/ui* : `button`, `card`, `input`, `badge`, `table`, `dialog` (modale), `skeleton` (chargement). **Écrits une fois, utilisés partout** → cohérence visuelle et moins de code.
- **`components/layout/`** — la structure : `Sidebar` (menu latéral animé, adapté au rôle), `Navbar` (barre du haut, recherche, thème), `AppLayout` (assemble le tout).
- **`components/shared/`** — spécifiques au métier : `KpiCard` (carte d'indicateur), `ScoreBadge` (pastille de score colorée), `Plot` (graphiques).

> **Point clé : la réutilisabilité.** « Nous avons construit nos propres composants pour
> garder le contrôle et la cohérence. Le score, par exemple, s'affiche partout via un
> seul composant `ScoreBadge` : sa couleur EST l'information. »

### 5.5 — Les pages (`src/pages/`)

Chaque fichier = un écran.

| Fichier | Écran |
|---|---|
| **`Login.tsx`** | Connexion (dégradé de marque + carte en verre). |
| **`Dashboard.tsx`** | Tableau de bord directeur (KPI + graphiques). |
| **`Clients.tsx`** / **`ClientDetail.tsx`** | Liste/recherche des clients / fiche détaillée. |
| **`Accounts.tsx`** | Gestion des comptes (filtres, blocage). |
| **`NewTransaction.tsx`** | Saisie d'opération avec **le score affiché en temps réel** ⭐. |
| **`Transactions.tsx`** | Historique filtrable. |
| **`Fraud.tsx`** | Centre d'alertes du directeur (détail + explication). |
| **`Reports.tsx`** | Export des données. |
| **`Assistant.tsx`** | Assistant qui répond avec les vraies données de l'API. |
| **`Users.tsx`** / **`Audit.tsx`** | Gestion des utilisateurs / journal d'audit (admin). |
| **`Settings.tsx`** | Profil et thème. |

### 5.6 — Utilitaires et style

| Fichier | Rôle |
|---|---|
| **`lib/format.ts`** | Formatage des montants (dirhams) et des dates, au même endroit. |
| **`lib/utils.ts`** | Fusion intelligente des classes CSS. |
| **`styles/index.css`** | **Le système de design** : les couleurs (orange Attijari), le thème clair/sombre, le glassmorphism. **Changer la marque = changer ce fichier.** |

### 5.7 — Configuration du frontend

| Fichier | Rôle |
|---|---|
| **`package.json`** | Dépendances JavaScript + commandes (`npm run dev`, `npm run build`). |
| **`vite.config.ts`** | L'outil de build. En dev, il **relaie** `/api` vers le backend (évite les problèmes CORS). |
| **`tsconfig.json`** | Configuration TypeScript (typage strict). |
| **`nginx.conf`** | En production (Docker) : sert l'app et relaie `/api` vers le conteneur backend. |
| **`Dockerfile`** | Construit l'app puis la sert avec nginx (image finale ~50 Mo). |

---

<a name="6-infrastructure"></a>
## 6. L'INFRASTRUCTURE (Docker, CI, scripts)

| Fichier | Rôle | Point clé |
|---|---|---|
| **`docker-compose.yml`** | Décrit les **3 services** (postgres, api, frontend) et comment ils communiquent. | « Une seule commande lance tout. Les services se parlent par leur **nom de service** sur un réseau Docker privé. » |
| **`demarrer.bat` / `.sh`** | Lancement en 1 clic : vérifie Docker, construit, démarre, ouvre le navigateur. | Pensé pour des collègues non techniques. |
| **`.github/workflows/ci.yml`** | **Intégration continue** : à chaque `push`, GitHub installe, lint et lance les 40 tests sur une machine neuve avec un vrai PostgreSQL. | « Le badge vert prouve que tout fonctionne, à chaque modification. » |
| **`.gitattributes`** | Force les fins de ligne correctes (CRLF pour les `.bat`, sinon Windows les rejette). | Détail qui évite le bug "la fenêtre se ferme toute seule". |
| **`.env` / `.env.example`** | La configuration (secrets). Le `.env` réel n'est jamais sur GitHub. | Séparation code / configuration. |

### Comment les conteneurs communiquent (schéma)

```
  Navigateur ──► http://localhost:8090 ──► [ conteneur FRONTEND (nginx) ]
                                                    │  /api/... 
                                                    ▼
                                          [ conteneur API (FastAPI) ]
                                                    │  postgres:5432
                                                    ▼
                                          [ conteneur BASE (PostgreSQL) ]
```

---

<a name="7-concepts"></a>
## 7. Les 12 concepts clés à maîtriser

1. **API REST** — une façon standard pour le frontend et le backend de communiquer via HTTP (GET pour lire, POST pour créer, PATCH pour modifier, DELETE pour supprimer).
2. **ORM (SQLAlchemy)** — traduit des objets Python en tables SQL. On écrit du Python, pas du SQL brut → plus sûr (protège des injections SQL) et plus lisible.
3. **Pydantic vs SQLAlchemy** — SQLAlchemy décrit la **base** ; Pydantic décrit le **contrat de l'API**. Deux choses différentes (voir §4.4).
4. **JWT (JSON Web Token)** — un "badge" signé remis à la connexion. Le serveur le vérifie à chaque requête sans stocker de session. Contient l'identité + le rôle, mais **jamais** de secret.
5. **RBAC (contrôle d'accès par rôle)** — chaque rôle (admin/directeur/conseiller) a des droits. Vérifié **côté serveur, à chaque requête** — un menu caché ne suffit pas.
6. **bcrypt** — algorithme de hachage des mots de passe. Sens unique : on ne peut pas retrouver le mot de passe depuis le hachage.
7. **ACID + verrou (`FOR UPDATE`)** — garantit qu'une transaction est **atomique** (tout ou rien) et **isolée** (deux virements simultanés ne se corrompent pas).
8. **Injection de dépendances (`Depends`)** — FastAPI fournit automatiquement à chaque endpoint ce dont il a besoin (une session de base, l'utilisateur courant). Rend le code testable.
9. **Architecture en couches** — router → service → modèle. Séparation des responsabilités (voir §2).
10. **Docker & conteneur** — un "colis" qui contient l'application ET son environnement. Tourne à l'identique sur n'importe quelle machine.
11. **Intégration continue (CI)** — les tests s'exécutent automatiquement à chaque modification, pour attraper les régressions tôt.
12. **CORS** — sécurité du navigateur qui contrôle quels sites peuvent appeler l'API. Géré par une liste blanche.

---

<a name="8-glossaire"></a>
## 8. Glossaire express

- **MVP** — *Minimum Viable Product* : la plus petite version qui résout le problème de bout en bout.
- **Endpoint** — une adresse de l'API (ex. `POST /transactions`).
- **CRUD** — Create, Read, Update, Delete (créer, lire, modifier, supprimer).
- **Migration** — une modification versionnée du schéma de la base.
- **Seed** — remplir la base avec des données de départ.
- **Frontend / Backend** — l'interface visible / le serveur invisible.
- **Suppression logique** — marquer "inactif" au lieu de supprimer (garde l'historique).
- **Feature (IA)** — une caractéristique numérique extraite d'une donnée (ex. "montant/revenu").
- **Baseline** — une solution simple de référence (ici, le moteur de règles) qu'un modèle plus avancé devra battre.

---

<a name="9-jury"></a>
## 9. Questions du jury + réponses

> Prépare ces réponses à voix haute. Ce sont les questions les plus probables.

**Q : Pourquoi FastAPI plutôt que Django ou Flask ?**
R : FastAPI est très performant, offre une **validation forte** avec Pydantic, génère la
**documentation Swagger automatiquement**, et c'est du Python — idéal pour intégrer plus
tard un module d'IA (scikit-learn). Flask est plus minimal (il aurait fallu tout ajouter
à la main), Django plus lourd pour une simple API.

**Q : Pourquoi PostgreSQL ?**
R : Nos données sont très relationnelles (un client → des comptes → des transactions).
PostgreSQL est un SGBD relationnel robuste, open-source, standard en entreprise, et il
gère nativement les verrous transactionnels dont nous avions besoin pour les virements.

**Q : Comment garantissez-vous qu'un virement ne corrompt pas les soldes ?**
R : Nous verrouillons les lignes des comptes avec `SELECT ... FOR UPDATE` avant de
modifier les soldes, dans une transaction unique. Deux virements simultanés s'exécutent
donc en série. C'est le respect des propriétés **ACID**.

**Q : Votre IA, c'est du vrai Machine Learning ?**
R : Soyons transparents : dans cette version MVP, c'est un **moteur de règles pondérées**,
interprétable et déjà fonctionnel. Nous l'avons conçu **modulaire** pour pouvoir le
remplacer par un modèle supervisé (Random Forest) — c'est notre première perspective.
Nous avons privilégié un cœur complet et honnête plutôt qu'un modèle mal évalué.

**Q : Comment sécurisez-vous l'application ?**
R : Mots de passe hachés (bcrypt), authentification JWT à expiration courte, contrôle
d'accès par rôle vérifié côté serveur, protection contre les injections SQL via l'ORM,
validation des entrées, journal d'audit, et verrouillage du compte après plusieurs
échecs. Nos choix suivent l'**OWASP API Security Top 10**.

**Q : Pourquoi ne pas renvoyer directement les objets de la base à l'API ?**
R : Pour trois raisons — sécurité (ne jamais exposer le mot de passe haché), découplage
(la base peut évoluer sans casser le frontend), et validation. Les schémas Pydantic sont
cette couche de protection. (voir §4.4)

**Q : Comment testez-vous le projet ?**
R : ~40 tests automatisés (pytest) couvrant l'auth, les rôles, les transactions et le
scoring, dont un tiers testent les cas d'échec. Ils tournent dans une base isolée et
s'exécutent automatiquement à chaque push via GitHub Actions.

**Q : Un collègue peut-il lancer le projet facilement ?**
R : Oui, avec **une seule commande** (`docker compose up`) ou un double-clic. Docker
construit et démarre la base, l'API et l'interface, crée les tables et injecte les
données de démo automatiquement. Le seul prérequis est Docker Desktop.

**Q : Quelle est la différence entre `User` et `Client` ?**
R : `User` est un utilisateur de la **plateforme** (qui se connecte : admin, directeur,
conseiller). `Client` est un client **de la banque** (qui possède des comptes). Ce sont
deux notions distinctes.

**Q : Quelles sont les limites de votre projet ?**
R : Les données sont simulées (pas de connexion au SI réel de la banque), le moteur est
à base de règles et non un ML entraîné, et il n'y a pas de temps réel par streaming.
Ces limites sont **assumées et documentées** ; elles correspondent au périmètre réaliste
d'un stage et constituent nos perspectives d'évolution.

**Q : Qu'avez-vous appris ?**
R : Le cycle complet d'une application professionnelle : conception d'une base, backend
avec FastAPI/SQLAlchemy, sécurité JWT/RBAC, frontend React/TypeScript, conteneurisation
Docker, tests et intégration continue, et le travail collaboratif avec Git.

---

> ✅ **Si tu comprends ce guide, tu maîtrises le projet.** Relis-le, ouvre les fichiers en
> parallèle, et entraîne-toi à répondre aux questions du §9 à voix haute. Bonne chance !
