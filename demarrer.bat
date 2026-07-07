@echo off
REM ============================================================================
REM  NovaBank - Lancement en un double-clic (Windows)
REM
REM  Ce script demarre TOUTE la plateforme (base de donnees + backend + frontend)
REM  avec Docker. Le collegue n'a besoin QUE de Docker Desktop installe.
REM
REM  Utilisation : double-cliquer sur ce fichier.
REM ============================================================================
title NovaBank - Demarrage
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo   ========================================
echo      NovaBank - Plateforme bancaire IA
echo   ========================================
echo.

REM --- 1. Verifier que Docker est installe ---
where docker >nul 2>nul
if errorlevel 1 (
    echo   [ERREUR] Docker n'est pas installe.
    echo.
    echo   Installe Docker Desktop puis relance ce script :
    echo   https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

REM --- 2. Verifier que Docker Desktop est demarre ---
docker info >nul 2>nul
if errorlevel 1 (
    echo   [INFO] Docker Desktop n'est pas encore demarre.
    echo   Lancement de Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo   Patiente pendant que Docker demarre (environ 30 secondes)...
    :attente_docker
    timeout /t 5 >nul
    docker info >nul 2>nul
    if errorlevel 1 goto attente_docker
    echo   [OK] Docker Desktop est pret.
)

echo.
echo   Construction et demarrage des services...
echo   (la premiere fois, cela peut prendre 2 a 4 minutes)
echo.

REM --- 3. Construire et lancer toute la stack ---
docker compose up -d --build
if errorlevel 1 (
    echo.
    echo   [ERREUR] Le demarrage a echoue. Verifie les messages ci-dessus.
    pause
    exit /b 1
)

echo.
echo   Initialisation de la base de donnees et des donnees de demo...
timeout /t 12 >nul

echo.
echo   ========================================
echo      NovaBank est prete !
echo   ========================================
echo.
echo   Application  :  http://localhost:8090
echo   API (Swagger):  http://localhost:8000/docs
echo.
echo   Comptes de demonstration :
echo     Directeur   : directeur@novabank.ma  / Directeur@2026!
echo     Conseiller  : conseiller@novabank.ma / Conseiller@2026!
echo     Admin       : admin@novabank.ma      / Admin@2026!
echo.
echo   Pour arreter la plateforme : double-clic sur "arreter.bat"
echo.

REM --- 4. Ouvrir le navigateur sur l'application ---
start "" http://localhost:8090

pause
