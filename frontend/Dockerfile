# =============================================================================
# Dockerfile du frontend — build en 2 étapes (multi-stage).
#
# Pourquoi 2 étapes :
#   ÉTAPE 1 (build) : Node compile React/TypeScript en fichiers statiques
#     (HTML/CSS/JS). Node et les 355 paquets npm ne servent QU'à ça.
#   ÉTAPE 2 (serve) : on repart d'une image nginx minuscule et on n'y copie
#     QUE les fichiers compilés. Résultat : image finale ~50 Mo au lieu de
#     ~500 Mo, sans Node ni node_modules (surface d'attaque réduite).
# =============================================================================

# ---- Étape 1 : compilation ----
FROM node:22-alpine AS build
WORKDIR /app

# package.json copié AVANT le code : le cache Docker ne réinstalle les
# dépendances que si package.json change, pas à chaque édition de code.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build          # produit /app/dist (fichiers statiques)

# ---- Étape 2 : service via nginx ----
FROM nginx:1.27-alpine

# Config nginx sur mesure : sert l'app React et relaie /api vers le backend.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# On ne copie QUE le résultat compilé de l'étape 1.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
