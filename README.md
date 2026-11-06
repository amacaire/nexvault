# NEXVAULT

NEXVAULT est un gestionnaire de mots de passe auto-hébergé, conçu selon une architecture zero-knowledge et orienté sécurité, confidentialité et fiabilité.

## Objectif

- Gestion de mots de passe et secrets côté client
- Stockage chiffré sur un serveur autonome
- Multi-utilisateurs avec isolation des coffres
- Synchronisation multi-appareils
- Déploiement Docker/Compose
- Sans dépendance à un service cloud externe

## Architecture cible

- Frontend : React + TypeScript + Vite + Tailwind + shadcn/ui
- Backend : Rust + Axum + Tokio + SQLx
- Base de données : PostgreSQL en production, SQLite optionnel
- Sécurité : Argon2id, XChaCha20-Poly1305/AES-256-GCM, HKDF
- Infrastructure : Docker, Compose, Nginx/Caddy, volumes persistants

## Démarrage rapide

1. Copier `.env.example` et configurer les variables.
2. Lancer `docker compose up -d`.
3. Vérifier l’état des services via les health checks.

## Documentation

- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/CRYPTOGRAPHY.md`
- `docs/API.md`
- `docs/DEPLOYMENT.md`
- `docs/BACKUP.md`

## Phase active

La première phase sert à poser les fondations de conception et la sécurité.
