# Cryptographie NEXVAULT

## Principes

L’application adopte une architecture zero-knowledge où les données du coffre sont chiffrées par le client avant envoi au serveur.

## Algorithmes recommandés

- Argon2id : dérivation de clé maître from password
- HKDF : dérivation de sous-clés
- XChaCha20-Poly1305 : chiffrement authentifié des données sensibles
- AES-256-GCM : alternative si nécessaire
- CSPRNG : génération de clés, nonces et identifiants

## Schéma de clé

1. `masterPassword` fourni par l’utilisateur
2. Argon2id dérive `rootKey`
3. HKDF dérive :
   - `vaultEncryptionKey`
   - `shareKey`
   - `deviceKey`
   - `totpKey`
4. Chaque item est chiffré avec une clé de coffre ou de morceau unique

## Séquence de chiffrement

Pour chaque entrée du coffre :
- générer un nonce unique
- chiffrer le JSON de l’item
- ajouter un tag d’authentification
- stocker le payload chiffré côté serveur

## Séquence de déchiffrement

- récupérer le payload chiffré depuis l’API
- dériver la clé locale nécessaire
- vérifier l’authentification du tag
- déchiffrer le contenu
- reconstruire l’objet métier sur le client

## Gestion des clés

- les clés ne sont pas stockées en clair sur le serveur
- les clés sont seulement conservées dans le client
- les appareils partagés reçoivent des clés chiffrées par un mécanisme de partage
- la rotation de clé se fait par ancien-nouveau verrouillage et re-chiffrement

## Limites

- un mot de passe maître faible ou réutilisé compromet la sécurité du coffre
- un navigateur compromis peut accéder à la clé en mémoire
- le serveur ne peut pas rétablir les éléments sans la clé cliente

## Tests requis

- tests de dérivation Argon2id
- tests XChaCha20-Poly1305
- tests de nonce unique
- tests de rotation de clé
- tests de partage cryptographique
