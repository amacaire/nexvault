# Architecture NEXVAULT

## Objectif architectural

NEXVAULT vise un modèle zero-knowledge où le serveur ne reçoit que des données chiffrées, des métadonnées de contrôle et des journaux non sensibles. Les mots de passe, secrets, clés de chiffrement et contenus de coffre restent uniquement dans le navigateur ou l’application cliente.

## Vue d’ensemble

- Frontend web : interface utilisateur de gestion du coffre, génération de mots de passe, chiffrement local, synchronisation
- Backend API : authentification, gestion des utilisateurs, stockage chiffré, API REST versionnée, partage, sessions
- Base de données : PostgreSQL avec schéma relationnel et données chiffrées uniquement
- Stockage des pièces jointes : fichiers chiffrés côté client avant envoi au serveur
- Reverse proxy : TLS, CORS, rate limiting, headers de sécurité

## Composants

### 1. Frontend

Responsabilités :
- Authentification utilisateur
- Dérivation de clés maître depuis le mot de passe maître
- Chiffrement/déchiffrement des éléments du coffre
- Génération de mots de passe
- UI de navigation, recherche, favoris, dossiers, tags
- Synchronisation de données chiffrées entre appareils
- Gestion locale des sessions et des appareils

### 2. Backend

Responsabilités :
- Inscription, connexion et autorisations
- Validation des entrées et sécurité des endpoints
- Stockage des blobs chiffrés, métadonnées, index, permissions
- Gestion des sessions, appareils, TOTP, codes de récupération
- API de partage cryptographique et synchronisation
- Administration non sensible

### 3. Base de données

Stockage des données sensibles :
- uids, email, hachage de mot de passe (pas le mot de passe en clair)
- chiffrement des éléments de coffre stockés dans texte chiffré
- métadonnées : types d’items, libellés, tags, dossiers, permissions
- fichiers joints chiffrés, hachés et références

### 4. Sécurité de transport

- TLS 1.2+ obligatoire côté reverse proxy
- Cookies HttpOnly/Secure/SameSite
- CSP stricte
- HSTS si exposé sur Internet

## Modèle de données (conceptuel)

- users
- user_sessions
- user_devices
- vault_items
- vault_folders
- vault_tags
- vault_item_notes
- attachments
- shared_items
- security_events
- admin_events

## Flux de chiffrement

1. L’utilisateur fournit un mot de passe maître.
2. Le client dérive une clé racine avec Argon2id.
3. Le client dérive des sous-clés pour :
   - chiffrement de coffre
   - authentification TOTP
   - clés de partage
4. Les éléments du coffre sont chiffrés côté client avant transmission.
5. Le serveur ne reçoit pas les structures de contenu en clair.

## Répartition des responsabilités

- Serveur : mot de passe d’authentification, hachage, sessions, règles, permissions, logs
- Client : contenu du coffre, clé racine, données privées, dérivation de sous-clés

## Risques architecturaux identifiés

- Défaillance de la clé maître ou perte du coffre
- Chiffrement client mal implémenté
- Sessions compromises
- déni de service / brute force
- attaques de type XSS si le frontend n’est pas strictement protégé

## Décision d’architecture

Le système adopte une séparation stricte entre:
- identité/administration backend
- contenu utilisateur chiffré côté client
- clé de chiffrement non accessible au backend

