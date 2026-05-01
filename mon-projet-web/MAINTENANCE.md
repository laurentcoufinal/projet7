# MAINTENANCE - mon-projet-web

## 1) Objet

Ce document decrit les procedures de maintenance applicative et operationnelle du projet `mon-projet-web` :
- maintenance preventive,
- maintenance corrective,
- maintenance evolutive,
- supervision, sauvegarde, restauration et gestion d'incident.

Il sert de reference pour l'exploitation locale, CI/CD, et les environnements de deploiement.

---

## 2) Perimetre technique

- Frontend : `frontend/` (Angular)
- Microservices :
  - `microservices/auth-service/`
  - `microservices/product-service/`
  - `microservices/chat-service/`
- Gateway : `gateway/nginx.conf`
- Orchestration locale : `docker-compose.yml`
- E2E : `e2e/run-e2e.sh`
- IaC : `terraform/`
- Pipeline : `.github/workflows/ci-cd.yml`

---

## 3) Types de maintenance

## 3.1 Maintenance preventive
- Mise a jour reguliere des dependances (npm, images Docker, modules Terraform).
- Rotation des secrets et tokens (JWT, DockerHub, AWS, ArgoCD).
- Verification periodique des workflows CI/CD et du deploiement.
- Verification de la conformite de configuration (`.env`, variables GitHub, Terraform tfvars).

## 3.2 Maintenance corrective
- Correction des incidents de production (erreurs 5xx, indisponibilite, timeout, websocket instable).
- Correctifs de securite (vulnerabilites critiques/hautes).
- Correctifs de regression fonctionnelle (auth, chat, catalogue, FAQ).

## 3.3 Maintenance evolutive
- Ajout de fonctionnalites metier.
- Evolution des APIs inter-services et contrats gateway.
- Evolution de l'infrastructure via Terraform.

---

## 4) Routines de maintenance (checklist)

## 4.1 Quotidien
- Verifier l'etat des services (healthchecks gateway + microservices).
- Verifier le passage de la CI principale.
- Consulter les erreurs applicatives critiques.

## 4.2 Hebdomadaire
- Lancer les tests unitaires de chaque service.
- Lancer les E2E complets.
- Revue des dependances vulnerables et plan de patch.
- Verifier expiration proche des secrets/tokens.

## 4.3 Mensuel
- Mise a jour des images de base Docker et lockfiles.
- Revue des couts/ressources infra (si environnements cloud actifs).
- Exercice de restauration de sauvegarde (si backend stateful deploye).
- Revue de droits IAM et tokens techniques.

---

## 5) Procedure de mise a jour applicative

## 5.1 Pre-requis
- Branche a jour.
- CI verte sur la branche cible.
- Secrets requis disponibles (`JWT_SECRET`, secrets CI/CD).

## 5.2 Etapes
1. Mettre a jour le code et/ou les dependances.
2. Lancer tests locaux :
   - unitaires par microservice,
   - E2E via `./e2e/run-e2e.sh`.
3. Verifier la compatibilite de la gateway (routes HTTP + WebSocket).
4. Construire les images Docker.
5. Laisser la CI/CD executer les scans et validations.
6. Deployer d'abord en environnement non-prod.
7. Valider les parcours critiques :
   - login client/agent,
   - consultation profil,
   - catalogue + FAQ,
   - creation session chat + echange temps reel.
8. Promouvoir en production avec fenetre de changement.

## 5.3 Rollback
- Revenir a l'image precedente stable.
- Reappliquer la configuration precedente (variables/secrets si necessaire).
- Reexecuter les smoke tests.
- Ouvrir un rapport d'incident si rollback declenche.

---

## 6) Supervision et indicateurs

## 6.1 SLI/SLO minimaux recommandes
- Disponibilite API gateway.
- Taux d'erreur HTTP 5xx.
- Latence p95 des endpoints critiques.
- Taux de connexion websocket reussie.
- Delai moyen de traitement message chat.

## 6.2 Alertes prioritaires
- Service down / healthcheck KO.
- Taux d'erreur > seuil.
- Saturation ressources (CPU/Memoire) persistante.
- Echec repetition CI/CD sur branche principale.

---

## 7) Sauvegardes et restauration

## 7.1 Ce qui doit etre sauvegarde
- Donnees persistantes des services (si base/volume actif).
- Etat Terraform (state distant S3 si utilise).
- Configurations critiques (sans exposer les secrets).

## 7.2 Politique minimale
- Sauvegarde quotidienne automatisee.
- Conservation glissante (exemple : 30 jours).
- Test de restauration periodique (au moins trimestriel).

## 7.3 Test de restauration (procedure courte)
1. Isoler un environnement de test.
2. Restaurer la sauvegarde la plus recente.
3. Verifier integrite des donnees et demarrage services.
4. Executer smoke tests fonctionnels.
5. Documenter resultat (OK/KO, duree, actions correctives).

---

## 8) Gestion des incidents

## 8.1 Priorisation
- P1 : indisponibilite globale / fonction critique indisponible.
- P2 : degradation majeure sans indisponibilite totale.
- P3 : anomalie non bloquante.

## 8.2 Processus standard
1. Detection et qualification.
2. Contournement court terme (si possible).
3. Correction / rollback.
4. Validation post-correctif.
5. Communication parties prenantes.
6. Post-mortem et actions preventives.

## 8.3 Contenu minimal du post-mortem
- Chronologie.
- Cause racine.
- Impact utilisateur.
- Correctif applique.
- Actions de prevention (owner + deadline).

---

## 9) Securite operationnelle

- Ne jamais commiter de secrets dans le repo.
- Utiliser les secrets GitHub Actions / variables d'environnement.
- Appliquer le moindre privilege sur IAM/tokens.
- Faire des rotations regulieres.
- Verifier les dependances et images contre les CVE critiques.

---

## 10) Contacts et responsabilites (a completer)

Renseigner les referents avant mise en production :
- Owner technique global :
- Owner frontend :
- Owner auth-service :
- Owner product-service :
- Owner chat-service :
- Owner infra/terraform :
- Astreinte incident :

---

## 11) Historique des revisions

| Version | Date | Auteur | Description |
|---|---|---|---|
| 1.0 | 2026-05-01 | Equipe projet | Creation du document de maintenance |
