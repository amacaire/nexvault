# Nexvault Chrome Extension

Architecture de base pour une extension Manifest V3 connectée au coffre-fort Nexvault.

## Objectifs

- ouvrir l’application Nexvault depuis le navigateur
- capturer les informations de la page active
- préparer le flux d’autofill sur les formulaires de login
- stocker le token et l’URL API dans `chrome.storage.local`

## Charge utile de démonstration

L’extension est prête pour des tests locaux sur Chrome avec :

- API locale : `https://10.238.110.246:5173`
- backend : `http://10.238.110.246:8000`

## Installation

1. Ouvrir `chrome://extensions`
2. Activer le mode développeur
3. Charger l’extension non compressée
4. Choisir le dossier `chrome-extension/`
5. Saisir le token JWT et l’URL API dans la popup

## Limites

Le navigateur Chrome exige un certificat de confiance pour les appels HTTPS locaux sur le port 5173. Si le certificat auto-signé n’est pas accepté, la requête API depuis l’extension peut être refusée. La solution de production consiste à installer un certificat approuvé ou à utiliser un reverse proxy TLS fiable.
