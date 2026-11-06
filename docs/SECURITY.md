# Modèle de menace NEXVAULT

## Objectif

Définir les menaces, les garanties et les hypothèses de sécurité du système.

## Hypothèses

- Le client est l’unique point où les données du coffre sont lisibles à l’état clair.
- Le serveur ne doit pas avoir accès à la clé de chiffrement du coffre.
- L’authentification du compte est gérée par le backend.
- Les partage et synchronisation sont sécurisés par des clés cryptographiques côté client.

## Menaces principales

### 1. Serveur compromis

Impact :
- Accès aux métadonnées non sensibles
- Tentatives de manipulation des données chiffrées
- Exposition des sessions ou cookies

Garantie :
- Les données chiffrées du coffre restent inutilisables sans la clé locale 
- Les mots de passe en clair ne sont pas stockés

### 2. Utilisateur compromis / machine infectée

Impact :
- Vol du mot de passe maître
- Vol du navigateur session
- Exécutions de code malveillant dans le client

Garantie :
- Aucune protection totale contre un terminal compromis
- Le système doit limiter les dégâts par TOTP, sessions courtes, révocation, et bonnes pratiques de sécurité

### 3. Attaques réseau

Risques :
- interception de trafic
- CSRF
- injection
- brute force

Mesures :
- TLS seulement
- SameSite cookies
- rate limiting
- validation stricte des entrées
- anti-CSRF

### 4. Attaques internes ou admin malveillant

Principe :
- L’administrateur ne peut pas déchiffrer les coffres utilisateur
- Seuls les utilisateurs authentifiés possédant la clé de chiffrement peuvent lire les contenus

### 5. Requêtes malveillantes

- SQL injection
- XSS
- SSRF (si applicable)
- uploads malveillants

Mesures :
- Prepared statements
- validation Zod / validation backend
- CSP
- fichiers joints chiffrés et paramètres stricts

## Principe de sécurité

Le système repose sur un modèle zero-knowledge :
- le serveur stocke des blobs chiffrés ; il ne détient pas les clés de chiffrement utilisateur.
- les secrets de coffre sont visibles uniquement dans le client authentifié.

## Protection complémentaire

- verrouillage automatique du coffre
- déconnexion automatique
- session courte ou renouvelable
- TOTP obligatoire optionnel
- codes de récupération
- journaux épurés

## Limites

Même avec un modèle robuste, un terminal compromis expose le mot de passe maître et les clés en mémoire. Le système ne garantit pas la sécurité d’un client piraté.
