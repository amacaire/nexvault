# Sauvegarde et restauration NEXVAULT

## Stratégie

- Sauvegarde PostgreSQL régulière
- Sauvegarde des pièces jointes chiffrées
- Sauvegarde des paramètres et config
- Rotation des sauvegardes
- Vérification d’intégrité

## Règles

- Le serveur ne déchiffre pas les contenus utilisateurs
- Les exports de coffre sont chiffrés côté client
- Les restaurations doivent respecter les versions et la synchronisation

## Procédure

1. Sauvegarder la base
2. Sauvegarder les volumes
3. Vérifier l’intégrité du dump
4. Restaurer la base sur un environnement identique
5. Vérifier le schéma et les health checks

## Risques

- perte de clé maître non récupérable
- mauvaise restauration des volumes
- incompatibilité de version

