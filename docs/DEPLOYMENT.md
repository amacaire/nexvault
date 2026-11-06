# Déploiement NEXVAULT

## Objectif

Livre un environnement auto-hébergé exécutable via Docker Compose.

## Composants

- Frontend
- Backend API
- PostgreSQL
- Reverse proxy (Nginx ou Caddy)
- Volumes persistants
- Health checks

## Commande cible

```bash
docker compose up -d
```

## Variables d’environnement

- Database credentials
- backend secret keys
- domain
- TLS config
- rate limit values

## Bonnes pratiques

- utiliser des secrets via `.env` local
- chiffrer les volumes si possible
- conserver des sauvegardes hors ligne
- éviter le stockage de dérivés de clés sur le serveur

## Mise à jour

- sauvegarder les volumes et le schéma DB
- déployer la nouvelle image
- lancer les migrations
- vérifier les health checks

## Configuration HTTPS

Le reverse proxy doit servir en HTTPS avec certs TLS et redirection HTTP vers HTTPS.
