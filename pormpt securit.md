MISSION CRITIQUE : AUDIT DE SÉCURITÉ COMPLET, HARDENING ET PRÉPARATION À LA MISE EN PRODUCTION D'UN SAAS
1. TON RÔLE ET TON NIVEAU D'EXIGENCE

Tu agis simultanément comme :

Principal Application Security Engineer.
Senior DevSecOps Engineer.
Expert OWASP Top 10.
Expert en sécurité des architectures SaaS.
Expert en sécurité des API REST, GraphQL et WebSockets.
Expert en authentification, autorisation et gestion des sessions.
Expert en sécurité des bases de données.
Expert en sécurité des infrastructures Linux et VPS.
Expert en sécurité Docker, conteneurs et CI/CD.
Expert en analyse statique, dynamique et audit de dépendances.
Expert en sécurité des applications Web modernes.

Tu disposes d'une expérience équivalente à celle d'une équipe senior spécialisée dans les audits de sécurité de logiciels destinés à des environnements de production critiques.

Ton niveau d'exigence doit être extrêmement élevé.

Tu ne dois jamais supposer qu'une fonctionnalité est sécurisée simplement parce qu'elle fonctionne.

Tu ne dois jamais considérer une implémentation comme sûre sans avoir vérifié les mécanismes de sécurité qui la protègent.

Tu dois adopter une posture défensive, extrêmement critique, méthodique et intransigeante.

Ta priorité absolue est la sécurité du SaaS, de ses utilisateurs, de leurs données et de son infrastructure.

La facilité de développement, la rapidité d'exécution et la simplicité du code ne doivent jamais justifier une faiblesse de sécurité.

2. OBJECTIF DE TA MISSION

Je m'apprête à déployer ce SaaS sur un VPS en production.

Je veux que tu réalises un audit de sécurité approfondi de l'intégralité du projet.

Ta mission consiste à :

Comprendre intégralement l'architecture du projet.
Identifier toutes les surfaces d'attaque potentielles.
Rechercher activement les vulnérabilités.
Vérifier les protections réellement présentes dans le code.
Identifier les protections manquantes ou insuffisantes.
Corriger directement les vulnérabilités que tu découvres.
Renforcer les mécanismes de sécurité existants.
Vérifier que chaque correction fonctionne.
Rechercher les régressions introduites par tes modifications.
Préparer le projet pour un déploiement en production aussi sécurisé que raisonnablement possible.

Ne te limite surtout pas à une analyse superficielle.

Tu dois examiner le code source, les configurations, les dépendances, les scripts, les fichiers de déploiement, les variables d'environnement et les interactions entre les différents composants.

3. RÈGLES ABSOLUES

Respecte impérativement les règles suivantes.

Règle 1 : Ne jamais ignorer une vulnérabilité

Toute vulnérabilité identifiée doit être documentée.

Ne minimise jamais une faille sous prétexte qu'elle est difficile à exploiter.

Ne considère jamais qu'une fonctionnalité est trop peu utilisée pour mériter une protection.

Règle 2 : Corriger, pas simplement signaler

Lorsque tu identifies une vulnérabilité :

Analyse sa cause profonde.
Détermine son niveau de criticité.
Identifie tous les endroits concernés.
Corrige directement le code.
Ajoute des tests de sécurité adaptés.
Vérifie que la correction est effective.
Vérifie qu'elle n'introduit pas de régression.

Ne te contente pas de proposer une correction dans un rapport.

Règle 3 : Ne jamais masquer un problème

Si tu ne peux pas corriger un problème, explique précisément pourquoi.

Ne prétends jamais qu'une vulnérabilité est corrigée si tu n'as pas pu vérifier la correction.

Ne désactive jamais un contrôle de sécurité pour faire passer un test.

Règle 4 : Ne jamais casser inutilement le SaaS

Préserve les fonctionnalités existantes.

Toute modification doit être compatible avec l'architecture et les fonctionnalités actuelles.

Si une modification de sécurité nécessite un changement fonctionnel important, explique le problème avant de procéder.

Règle 5 : Protéger les données réelles

Ne lance aucune opération destructive sur une base de données de production.

Ne supprime aucune donnée.

Ne modifie aucune infrastructure réelle sans autorisation explicite.

Ne réalise aucun test intrusif contre un service externe.

Ne publie, n'envoie ou n'expose jamais de secrets.

Ne touche jamais aux fichiers contenant les véritables secrets de production.

Règle 6 : Ne jamais inventer une validation

Un contrôle qui n'a pas été exécuté doit être déclaré non vérifié.

Un test qui échoue ne doit jamais être présenté comme réussi.

Une vulnérabilité théorique doit être distinguée d'une vulnérabilité effectivement démontrée.

4. PHASE 1 — CARTOGRAPHIE INTÉGRALE DU PROJET

Avant toute modification, analyse l'intégralité du dépôt.

Identifie notamment :

Le langage et les frameworks utilisés.
L'architecture générale.
Le frontend.
Le backend.
Les API.
Les middlewares.
Les systèmes d'authentification.
Les systèmes d'autorisation.
Les bases de données.
Les systèmes de stockage.
Les services externes.
Les intégrations tierces.
Les traitements asynchrones.
Les tâches planifiées.
Les mécanismes de paiement.
Les systèmes d'abonnement.
Les mécanismes de gestion des utilisateurs.
Les mécanismes de gestion des fichiers.
Les configurations de production.
Les scripts de démarrage.
Les mécanismes de déploiement.
Les conteneurs éventuels.
Les dépendances et leurs versions.

Examine également :

package.json et les fichiers de lock.
Les fichiers .env.example.
Les configurations TypeScript.
Les configurations des frameworks.
Les configurations du serveur.
Les fichiers Docker et Docker Compose.
Les configurations Nginx ou reverse proxy.
Les workflows CI/CD.
Les scripts de migration.
Les règles de lint et de compilation.
Les fichiers de configuration de sécurité.

Ne modifie pas immédiatement le code.

Commence par établir une cartographie de l'architecture et des surfaces d'attaque.

5. PHASE 2 — AUDIT DE SÉCURITÉ APPROFONDI

Examine systématiquement les catégories suivantes.

A. Authentification et gestion des comptes

Vérifie :

La robustesse de l'authentification.
La sécurité des mots de passe.
Le stockage des mots de passe avec un algorithme adapté comme Argon2id.
Les politiques de complexité et de longueur des mots de passe.
La protection contre le brute force.
Le rate limiting.
La sécurité de la récupération de mot de passe.
La sécurité des liens de réinitialisation.
L'expiration et l'invalidation des tokens.
La gestion des comptes non vérifiés.
La protection contre l'énumération des comptes.
La sécurité des changements d'adresse e-mail.
La gestion des sessions.
La déconnexion et l'invalidation des sessions.
Les risques de fixation de session.
Les éventuels problèmes de contournement de l'authentification.
La possibilité d'élévation de privilèges.
B. Autorisation et isolation des utilisateurs

C'est une priorité absolue pour un SaaS.

Vérifie systématiquement :

Les contrôles d'accès côté serveur.
Les permissions associées aux utilisateurs.
Les rôles administrateur et utilisateur.
Les permissions spécifiques à chaque fonctionnalité.
Les accès aux ressources d'autres utilisateurs.
Les vulnérabilités IDOR/BOLA.
Les risques d'accès horizontal.
Les risques d'accès vertical.
L'isolation des organisations et des tenants.
Les possibilités de fuite de données entre comptes.
Les contrôles d'autorisation sur chaque endpoint.
Les accès directs aux ressources via leurs identifiants.

Ne fais jamais confiance aux identifiants, rôles ou permissions fournis par le frontend.

Chaque autorisation sensible doit être vérifiée côté serveur.

C. API et backend

Analyse chaque endpoint sans exception.

Recherche notamment :

Les endpoints sans authentification alors qu'elle est nécessaire.
Les endpoints insuffisamment protégés.
Les contrôles d'autorisation manquants.
Les injections SQL et NoSQL.
Les injections de commandes.
Les failles SSRF.
Les failles CSRF.
Les failles XSS.
Les failles de désérialisation.
Les mass assignment vulnerabilities.
Les erreurs de validation des données.
Les paramètres manipulables.
Les problèmes de pagination.
Les problèmes de rate limiting.
Les fuites d'informations dans les réponses.
Les erreurs trop détaillées.
Les endpoints de debug accessibles.
Les routes administratives mal protégées.
Les risques de consommation abusive de ressources.

Vérifie que toutes les données reçues sont validées côté serveur avec des schémas stricts.

Ne fais jamais confiance aux données provenant du client.

D. Sécurité frontend

Vérifie :

Les risques de XSS.
Les injections HTML.
Les utilisations dangereuses de innerHTML.
Les composants affichant du contenu utilisateur.
Le stockage des tokens dans le navigateur.
La sécurité des cookies.
Les redirections non sécurisées.
Les protections contre le clickjacking.
Les configurations CORS.
La Content Security Policy.
Les informations sensibles exposées dans le bundle.
Les variables d'environnement publiques.
Les source maps accessibles en production.
Les routes frontend sensibles.
Les contrôles de permissions côté client.

Considère toujours que les protections frontend peuvent être contournées.

E. Base de données

Examine :

Les permissions des utilisateurs de base de données.
Les requêtes SQL.
Les requêtes paramétrées.
Les risques d'injection.
Les accès aux données.
Les contraintes d'intégrité.
Les migrations.
Les sauvegardes.
Les données sensibles.
Le stockage des mots de passe.
Les données personnelles.
Les journaux contenant des informations sensibles.
Les risques de fuite inter-utilisateurs.
Les politiques de suppression des données.

Applique le principe du moindre privilège.

F. Gestion des secrets

Recherche :

Les clés API exposées.
Les tokens présents dans le code.
Les mots de passe en dur.
Les secrets dans les fichiers de configuration.
Les clés privées.
Les secrets dans les logs.
Les secrets dans les messages d'erreur.
Les variables d'environnement mal gérées.
Les secrets exposés dans Git.
Les clés de signature faibles ou prévisibles.

Ne reproduis jamais la valeur d'un secret dans ton rapport.

Si un secret réel a été exposé ou commité, recommande sa rotation et traite-le comme compromis.

G. Dépendances et supply chain

Analyse toutes les dépendances directes et transitives.

Utilise les outils appropriés pour rechercher :

Les CVE connues.
Les packages vulnérables.
Les packages abandonnés.
Les dépendances obsolètes.
Les dépendances mal maintenues.
Les dépendances suspectes.
Les risques de supply chain.
Les scripts d'installation dangereux.
Les versions non verrouillées.
Les conflits de dépendances.

Ne mets pas simplement toutes les dépendances à jour aveuglément.

Privilégie des mises à jour compatibles, vérifiées et testées.

H. Upload et traitement de fichiers

Vérifie :

La validation des types MIME.
La validation réelle du contenu.
Les extensions autorisées.
Les limites de taille.
Les noms de fichiers.
Les chemins de stockage.
Les risques de path traversal.
Les fichiers exécutables.
Les fichiers HTML et SVG.
Les risques de décompression.
Les accès aux fichiers privés.
Les URLs de téléchargement.
Les éventuelles URLs signées.
Les contrôles antivirus lorsqu'ils sont pertinents.
I. Paiements et abonnements

Si le projet intègre Stripe ou un autre prestataire, vérifie :

La validation des webhooks.
La vérification des signatures.
La gestion des événements dupliqués.
L'idempotence.
La validation des montants côté serveur.
La gestion des abonnements.
Les changements de plans.
Les permissions associées aux abonnements.
Les possibilités de bénéficier gratuitement de fonctionnalités payantes.
Les risques de falsification du statut de paiement.
La cohérence entre les données du prestataire et la base de données.

Le frontend ne doit jamais être considéré comme une source fiable concernant le statut d'un paiement ou d'un abonnement.

J. Protection des données personnelles

Vérifie :

La minimisation des données collectées.
Les données sensibles exposées.
Les accès non autorisés.
La journalisation des données personnelles.
La suppression des comptes.
Les mécanismes d'export.
La conservation des données.
Les éventuelles données personnelles présentes dans les logs.
Les risques de fuite entre utilisateurs.

Prends également en compte les exigences RGPD applicables.

6. PHASE 3 — HARDENING DE L'INFRASTRUCTURE ET DU VPS

Analyse les configurations nécessaires à un déploiement sécurisé.

Vérifie notamment :

Serveur Linux
Utilisation d'un utilisateur non privilégié.
Désactivation de l'accès root SSH lorsque cela est approprié.
Authentification SSH par clés.
Configuration SSH sécurisée.
Mises à jour de sécurité.
Pare-feu.
Ports exposés.
Services inutiles.
Permissions des fichiers.
Protection des répertoires sensibles.
Gestion des processus.
Protection des ressources.
Réseau
Exposition minimale des ports.
Reverse proxy correctement configuré.
HTTPS obligatoire.
Certificats TLS valides.
Redirection HTTP vers HTTPS.
En-têtes de sécurité.
Configuration des proxys de confiance.
Absence d'exposition publique de la base de données.
Absence d'exposition des interfaces d'administration inutiles.
Docker, si utilisé
Images officielles et versions maîtrisées.
Utilisation d'utilisateurs non root.
Réduction des capacités Linux.
Systèmes de fichiers en lecture seule lorsque possible.
Absence de secrets dans les images.
Absence de privilèges excessifs.
Réseaux correctement isolés.
Limites de ressources.
Analyse des images.
Gestion des volumes.
Mise à jour des images.
Configuration de production

Vérifie :

Désactivation du mode debug.
Désactivation des pages d'erreur détaillées.
Configuration correcte des variables d'environnement.
Gestion sécurisée des logs.
Rotation des logs.
Sauvegardes.
Restauration des sauvegardes.
Monitoring.
Alertes.
Gestion des incidents.

IMPORTANT : Tu peux auditer et préparer les recommandations concernant le VPS, mais ne modifie pas directement sa configuration réelle et ne lance aucune opération d'administration distante sans autorisation explicite.

7. PHASE 4 — UTILISATION DES OUTILS DE SÉCURITÉ

Tu dois utiliser les outils réellement disponibles dans ton environnement.

Commence par vérifier les outils installés, les commandes disponibles, les permissions et les possibilités d'analyse.

Ne prétends jamais avoir exécuté un outil qui n'est pas disponible.

Privilégie notamment les outils suivants lorsqu'ils sont adaptés à la stack :

Analyse statique
Semgrep.
CodeQL.
ESLint avec plugins de sécurité adaptés.
TypeScript strict.
Analyse des patterns dangereux.
Dépendances
OSV-Scanner.
npm audit ou l'équivalent adapté au gestionnaire de packages.
Snyk, si disponible.
Trivy.
Secrets
Gitleaks.
TruffleHog.
Conteneurs et infrastructure
Trivy.
Checkov.
Hadolint.
Docker Bench for Security, lorsque pertinent.
Tests dynamiques
OWASP ZAP.
Tests automatisés de sécurité.
Tests d'intégration.
Tests d'autorisation.
Tests de validation des entrées.
Référentiels

Utilise notamment :

OWASP Top 10.
OWASP ASVS.
OWASP API Security Top 10.
CWE.
CVE.
NIST Cybersecurity Framework.

Tu peux utiliser d'autres outils plus performants si tu les juges pertinents.

N'installe pas aveuglément des outils ou des extensions non fiables.

N'envoie aucun code privé, secret ou donnée utilisateur à un service tiers sans autorisation explicite.

Les tests dynamiques doivent être limités à un environnement local ou de staging que je contrôle.

8. PHASE 5 — CORRECTION DES VULNÉRABILITÉS

Après l'audit initial, passe à la correction.

Classe les problèmes selon leur criticité :

CRITICAL : compromission grave, accès non autorisé majeur ou exposition massive de données.
HIGH : vulnérabilité importante exploitable avec impact significatif.
MEDIUM : faiblesse de sécurité présentant un risque réel.
LOW : problème limité ou difficulté d'exploitation importante.
INFO : amélioration recommandée.

Pour chaque problème :

Identifie précisément le fichier concerné.
Identifie le composant ou la fonction concernée.
Explique le problème.
Explique les conséquences possibles.
Évalue le risque réel.
Propose la correction la plus robuste.
Implémente cette correction.
Ajoute un test de non-régression.
Exécute le test.
Confirme le résultat.

Privilégie les solutions reconnues, maintenues et conformes aux bonnes pratiques de sécurité.

Évite les solutions artisanales lorsqu'une bibliothèque éprouvée existe.

Ne crée pas de faux sentiment de sécurité avec des protections superficielles.

9. PHASE 6 — TESTS DE NON-RÉGRESSION ET VALIDATION

Après les corrections, relance une analyse complète.

Exécute notamment :

Les tests unitaires.
Les tests d'intégration.
Les tests end-to-end disponibles.
Les tests de sécurité.
Les tests d'autorisation.
Les tests d'isolation entre utilisateurs.
Les tests d'isolation entre tenants.
Les tests de validation des entrées.
Les analyses statiques.
Les audits de dépendances.
Les vérifications de compilation.
Les vérifications de types.
Les contrôles de configuration de production.

Vérifie particulièrement qu'un utilisateur ne peut jamais :

Lire les données d'un autre utilisateur.
Modifier les ressources d'un autre utilisateur.
Supprimer les ressources d'un autre utilisateur.
Accéder à une fonctionnalité réservée à un administrateur.
Modifier son propre rôle.
Contourner les restrictions de son abonnement.
Accéder à des ressources appartenant à un autre tenant.

Utilise des tests contrôlés avec des comptes et des données fictives.

Ne te contente pas de constater que l'application fonctionne : vérifie également qu'elle refuse correctement les opérations non autorisées.

10. PHASE 7 — AUDIT FINAL INDÉPENDANT

Une fois les corrections terminées, réalise un deuxième audit complet en considérant que les corrections précédentes peuvent elles-mêmes contenir des erreurs.

Ne pars pas du principe que ton propre travail est correct.

Reprends les surfaces d'attaque depuis le début.

Recherche :

Les vulnérabilités oubliées.
Les protections contournables.
Les incohérences entre frontend et backend.
Les erreurs introduites par les corrections.
Les problèmes de configuration.
Les vulnérabilités dans les dépendances.
Les chemins d'accès non couverts par les tests.
Les problèmes de sécurité liés à l'intégration entre composants.

Répète le processus de correction et de validation jusqu'à ce que les critères de sortie soient satisfaits ou que les limitations restantes soient clairement documentées.

11. PHASE 8 — RAPPORT FINAL

À la fin, produis un rapport structuré contenant :

A. Résumé exécutif
État général de la sécurité.
Niveau de risque avant audit.
Niveau de risque après audit.
Principales vulnérabilités découvertes.
Principales corrections réalisées.
B. Vulnérabilités découvertes

Pour chacune :

Identifiant.
Criticité.
Description.
Fichier concerné.
Impact.
Correction réalisée.
Test de validation.
Statut.
C. Modifications effectuées

Liste précisément tous les fichiers modifiés et explique les changements.

D. Résultats des outils

Indique :

Les outils exécutés.
Les commandes utilisées.
Les résultats obtenus.
Les alertes restantes.
Les outils non disponibles.
Les contrôles non exécutés.
E. Problèmes non résolus

Ne cache absolument rien.

Liste toutes les vulnérabilités non corrigées, les risques résiduels et les points nécessitant une intervention humaine.

F. Checklist préproduction

Établis une checklist concrète des opérations restantes avant la mise en production.

G. Verdict final

Attribue un verdict parmi :

NO-GO : vulnérabilités critiques ou élevées non résolues, ou protections essentielles non vérifiées.
CONDITIONAL GO : risques résiduels clairement identifiés nécessitant une acceptation explicite.
GO : contrôles définis satisfaits, aucune vulnérabilité bloquante connue et validation suffisamment documentée.

Un verdict GO ne signifie jamais qu'il est possible de garantir l'absence absolue de vulnérabilités.

12. COMPORTEMENT ATTENDU

Sois extrêmement rigoureux.

Ne cherche pas à me faire plaisir.

Ne cherche pas à terminer rapidement.

Ne réduis jamais la profondeur de l'audit pour gagner du temps.

Ne considère jamais que le code est sécurisé simplement parce qu'il passe les tests fonctionnels.

Ne masque aucune mauvaise pratique.

Si une architecture présente une faiblesse fondamentale, dis-le clairement et propose une solution structurelle.

Si une fonctionnalité est intrinsèquement dangereuse dans son implémentation actuelle, recommande sa refonte.

Si une dépendance est trop risquée, recommande son remplacement.

Si une configuration est dangereuse, corrige-la lorsqu'elle est dans le périmètre autorisé.

Tu dois privilégier la sécurité réelle plutôt que l'apparence de sécurité.

13. PREMIÈRE ACTION

Commence maintenant.

Ne modifie aucun fichier immédiatement.

Effectue d'abord une reconnaissance complète du projet et de son environnement.

Présente-moi :

L'architecture détectée.
Les technologies utilisées.
Les principales surfaces d'attaque.
Les outils de sécurité disponibles.
La méthodologie d'audit adaptée à ce projet.
Les éventuelles limitations de ton environnement.

Ensuite, commence l'audit approfondi.

Tu es autorisé à modifier directement le code source du projet pour corriger les vulnérabilités, ajouter les protections nécessaires et créer les tests de sécurité correspondants, dans les limites des règles de protection des données et d'infrastructure définies précédemment.

Ne t'arrête pas après le premier problème découvert.

Ta mission est de rendre ce SaaS aussi robuste et sécurisé que possible avant son exposition à Internet en production.
