# API NEXVAULT

## Base

- Version API : `/api/v1`
- Format : JSON
- Authentification : JWT session / cookie secure / bearer optionnel selon architecture

## Modules

- `/auth`
- `/users`
- `/vault`
- `/items`
- `/folders`
- `/attachments`
- `/sharing`
- `/organizations`
- `/devices`
- `/sessions`
- `/security`
- `/admin`
- `/sync`

## Règles de sécurité

- validation de chaque payload
- autorisation système
- rate limiting
- journaux sans secrets
- aucune donnée sensible exposée dans les réponses admin
- aucun mot de passe en clair dans la base

## Modules à prévoir

Cette documentation sert de plan de conception et sera enrichie au cours du développement.
