#!/usr/bin/env bash
# =============================================================================
#  NovaBank - Lancement en une commande (macOS / Linux)
#
#  Demarre TOUTE la plateforme (base + backend + frontend) avec Docker.
#  Prerequis unique : Docker installe et demarre.
#
#  Utilisation :  ./demarrer.sh    (ou double-clic selon le systeme)
# =============================================================================
set -e
cd "$(dirname "$0")"

echo ""
echo "  ========================================"
echo "     NovaBank - Plateforme bancaire IA"
echo "  ========================================"
echo ""

# 1. Docker installe ?
if ! command -v docker >/dev/null 2>&1; then
  echo "  [ERREUR] Docker n'est pas installe."
  echo "  Installe Docker Desktop : https://www.docker.com/products/docker-desktop/"
  exit 1
fi

# 2. Docker demarre ?
if ! docker info >/dev/null 2>&1; then
  echo "  [ERREUR] Docker n'est pas demarre. Lance Docker Desktop puis reessaie."
  exit 1
fi

echo "  Construction et demarrage des services..."
echo "  (la premiere fois : 2 a 4 minutes)"
echo ""
docker compose up -d --build

echo ""
echo "  Initialisation de la base et des donnees de demo..."
sleep 12

echo ""
echo "  ========================================"
echo "     NovaBank est prete !"
echo "  ========================================"
echo ""
echo "  Application  :  http://localhost:8090"
echo "  API (Swagger):  http://localhost:8000/docs"
echo ""
echo "  Comptes de demonstration :"
echo "    Directeur   : directeur@novabank.ma  / Directeur@2026!"
echo "    Conseiller  : conseiller@novabank.ma / Conseiller@2026!"
echo "    Admin       : admin@novabank.ma      / Admin@2026!"
echo ""

# Ouvrir le navigateur (macOS: open, Linux: xdg-open)
if command -v open >/dev/null 2>&1; then open http://localhost:8090
elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:8090
fi
