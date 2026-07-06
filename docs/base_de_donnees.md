# Base de donnees - explication encadrant

## 1. Role de la base de donnees

La base de donnees est le coeur persistant du projet. Elle garde les informations meme si l'application s'arrete.

Dans ton MVP, elle sert a stocker :

- les utilisateurs de la plateforme ;
- les clients bancaires simules ;
- les comptes bancaires simules ;
- les transactions ;
- les scores de risque calcules par l'IA ;
- les alertes ;
- le journal d'audit.

## 2. Pourquoi PostgreSQL ?

PostgreSQL est un SGBD relationnel robuste, utilise dans beaucoup de projets professionnels.

Il est adapte a ton projet parce que les donnees sont tres relationnelles :

- un client possede plusieurs comptes ;
- un compte contient plusieurs transactions ;
- une transaction possede un score de risque ;
- une transaction peut generer une ou plusieurs alertes ;
- un utilisateur cree des transactions et laisse des traces dans le journal d'audit.

## 3. Tables du MVP

### users

Stocke les comptes applicatifs :

- administrateur ;
- directeur d'agence ;
- conseiller bancaire.

Cette table permet l'authentification et les permissions.

### clients

Stocke les clients bancaires simules.

On garde le CIN, le telephone, l'adresse, la profession et le revenu mensuel pour enrichir les analyses.

### accounts

Stocke les comptes bancaires simules.

Chaque compte appartient a un client. Le solde est stocke dans cette table.

### transactions

Stocke les operations :

- depot ;
- retrait ;
- virement simule.

Chaque transaction est creee par un conseiller et rattachee a un compte.

### risk_scores

Stocke le resultat du module IA.

Chaque transaction recoit :

- un score de 0 a 100 ;
- un niveau de confiance ;
- une explication lisible.

### alerts

Stocke les alertes.

Exemple : si une transaction recoit un score de 82/100, le systeme cree une alerte de niveau eleve.

### audit_logs

Stocke les traces des actions sensibles.

Exemples :

- connexion reussie ;
- echec de connexion ;
- creation d'une transaction ;
- fermeture d'une alerte.

## 4. Difference entre modele et table

Dans SQLAlchemy, une classe Python represente une table.

Exemple :

```python
class Client(Base):
    __tablename__ = "clients"
```

Cette classe deviendra une table `clients` dans PostgreSQL.

## 5. Prochaine etape

La prochaine etape consiste a :

1. installer les dependances Python ;
2. lancer PostgreSQL ;
3. creer le fichier `.env` ;
4. creer les tables ;
5. ajouter les premiers endpoints API.

