@echo off
REM ============================================================================
REM  NovaBank - Arret de la plateforme (Windows)
REM  Double-cliquer pour arreter tous les services. Les donnees sont conservees.
REM ============================================================================
title NovaBank - Arret
cd /d "%~dp0"

echo.
echo   Arret de NovaBank...
docker compose down
echo.
echo   Plateforme arretee. Les donnees sont conservees pour le prochain demarrage.
echo   (Pour tout remettre a zero : docker compose down -v)
echo.
pause
