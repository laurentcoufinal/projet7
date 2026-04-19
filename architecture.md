# Support Chiox - Synthese architecture, conformite et paiements

## 1) Contexte projet (extrait des documents)

### Objectif produit
- Creer une application client unique internationale pour remplacer 4 applications existantes heterogenes.
- Couvrir en V1 : profil client, recherche d'offres, reservation, paiement, historique, modification/annulation, chat, chatbot.
- Exposer une API CRUD pour les applications agences (backoffice).

### Contraintes techniques imposees
- Conception par DDD.
- Architecture microservices.
- Haute disponibilite.
- CI/CD.
- AWS cible.
- Base de donnees redondante.
- Accessibilite pour personnes en situation de handicap.
- Paiement externalise via PSP.

### Regles metier explicites
- Modification reservation possible jusqu'a 48h avant debut.
- Remboursement 25% seulement si annulation a moins de 7 jours du debut.
- Categorie vehicule selon norme ACRISS.
- Suppression de compte avec ressaisie du mot de passe.

### Regles metier implicites (principales)
- **Securite compte**: mot de passe fort requis (longueur minimale, complexite, interdiction des mots de passe trop faibles ou deja compromis).
- **Securite compte**: apres plusieurs echecs d'authentification, declencher un mecanisme anti-bruteforce (temporisation ou blocage temporaire).
- **Commerce**: une reservation est confirmee uniquement apres autorisation/capture de paiement par le PSP.
- **Commerce**: chaque transaction doit etre tracable (horodatage, montant, devise, statut) pour audit, litiges et rapprochement comptable.
- **Location**: le vehicule attribue doit appartenir a la categorie reservee (ou superieure en surclassement commercial).
- **Location**: les dates et lieux de depart/retour doivent rester coherents (retour strictement apres depart, agence compatible avec l'offre choisie).

---

## 2) Proposition de conception du domaine (DDD)

## Vision globale des domaines
- **Core Domain**: Reservation et tarification de location (coeur business).
- **Supporting Domains**: Identite client, catalogue flotte/offres, paiement, conformite locale, communication (chat V1, chat V2, chatbot), **FAQ** (contenu d'aide self-service).
- **Generic Domains**: Observabilite, IAM, audit, CI/CD, gestion des secrets.

## Bounded Contexts recommandes

### 2.1 Identity & Profile Context
- Responsabilites:
  - Gestion compte client (inscription, authentification, suppression).
  - Donnees profil (nom, prenom, date de naissance, adresse).
  - Gestion consentements privacy/cookies.
- Aggregate principal: `CustomerAccount`.
- Evenements: `CustomerRegistered`, `ProfileUpdated`, `AccountDeletionRequested`, `AccountDeleted`.

### 2.2 Rental Search Context
- Responsabilites:
  - Recherche d'offres selon ville depart/retour, dates, categorie ACRISS.
  - Projection "read-optimized" pour UX rapide.
- Aggregate principal: `SearchQuery` (ephemere) / `OfferProjection`.
- Evenements: `OfferCatalogUpdated`, `OfferComputed`.

### 2.3 Pricing & Policy Context
- Responsabilites:
  - Regles tarifaires.
  - Regles d'annulation/remboursement.
  - Regles locales par pays.
- Aggregate principal: `PricingPolicy`, `CancellationPolicy`.
- Evenements: `PricingCalculated`, `RefundPolicyEvaluated`.

### 2.4 Booking Context (Core)
- Responsabilites:
  - Creation reservation.
  - Modification/annulation avec controle des delais.
  - Historique de reservations.
- Aggregate principal: `Booking`.
- Invariants:
  - Modification interdite si < 48h avant debut.
  - Remboursement 25% si annulation < 7 jours.
- Evenements: `BookingCreated`, `BookingModified`, `BookingCancelled`, `BookingRefundComputed`.

### 2.5 Payment Orchestration Context
- Responsabilites:
  - Orchestration paiement avec PSP.
  - Gestion intents, captures, remboursements.
  - Idempotence, anti-double debit.
- Aggregate principal: `PaymentOrder`.
- Evenements: `PaymentInitiated`, `PaymentAuthorized`, `PaymentCaptured`, `PaymentFailed`, `RefundInitiated`, `RefundCompleted`.

### 2.6 Agency API Context
- Responsabilites:
  - Exposition d'API CRUD agence (utilisateur, reservation, etc.).
  - ACL (Anti-Corruption Layer) entre modeles agence et modeles coeur.
- Aggregate principal: facades orientees domaine.

### 2.7 Compliance & Privacy Context
- Responsabilites:
  - Regles RGPD/UK GDPR/PIPEDA/CCPA et obligations locales.
  - Data retention, legal hold, journalisation de conformite.
  - Registre des traitements, droits des personnes (DSAR).
- Aggregate principal: `CompliancePolicy`, `DataRetentionRule`.
- Evenements: `DataSubjectRequestReceived`, `DataSubjectRequestCompleted`, `RetentionPurgeExecuted`.

### 2.8 Notification Context
- Responsabilites:
  - Emails/SMS transactionnels (confirmation reservation, annulation, facture).
- Evenements: `NotificationRequested`, `NotificationDelivered`, `NotificationFailed`.

### 2.9 Chat V1 Context
- Responsabilites:
  - Messagerie temps reel **client ↔ conseiller** (humain).
  - Session de chat, attribution conversation a un agent, historique minimal cote client et cote service client.
  - Cote agent (apres authentification): **liste des chats** inities par les clients (identite client, dernier message, horodatage), **filtres et tri**, ouverture d'une conversation pour reprendre le fil sur le meme canal que le client.
  - Transport temps reel aligne PoC: synchronisation via **Redis Pub/Sub** et couche temps reel (ex. Node.js + Socket.io), derriere **API Gateway**; decouplage possible via micro-frontend (**Module Federation**) pour le module chat.
- Aggregate principal: `ChatSession`, `AgentQueue` (ou projection file d'attente).
- Evenements: `ChatSessionOpened`, `MessagePosted`, `ChatAssignedToAgent`, `ChatSessionClosed`.

### 2.10 Chat V2 Context
- Responsabilites:
  - **Evolution du canal conversationnel** au-dela du chat humain synchrone: experience unifiee (meme socle UI/API), continuite de session, preparation des **transferts** vers le chatbot ou le conseiller selon le parcours.
  - Integration avec les parcours metier (liens contextuels FAQ, fiche vehicule/offre, compte) sans dupliquer le catalogue dans le contexte chat.
  - Gouvernance des **versions de protocole** et contrats API du module conversation (compatibilite clients web/agence).
- Aggregate principal: `ConversationChannel` (facade) / extension de `ChatSession` selon decoupage equipe.
- Evenements: `ConversationHandoffRequested`, `ConversationChannelUpgraded`, `DeepLinkOffered`.

### 2.11 Chatbot Context
- Responsabilites:
  - **Scenarios conversationnels** structures (etapes, textes, type d'affichage: question, bouton, lien), **graphe de navigation** entre etapes selon les reponses (cadrage type diagramme draw.io exportable en definition executable).
  - Raccourcis vers **FAQ**, vers **pages metier** (ex. recherche vehicule/offre), et **escalade explicite vers le chat humain** (Chat V1) lorsque le besoin depasse le script.
  - Separation claire entre **contenu editable** (copy, ordre des etapes) et **moteur d'execution** (evaluation des branches, journalisation pour conformite et amelioration).
- Aggregate principal: `ChatbotFlow`, `DialogTurn`.
- Evenements: `BotFlowStarted`, `BotStepReached`, `BotEscalationToHumanRequested`, `BotFlowCompleted`.

### 2.12 FAQ Context
- Responsabilites:
  - **Base de connaissances** structuree: questions/reponses, rubriques, ordre d'affichage, visibilite par canal (web, app) et par **pays/langue** (aligne i18n).
  - **Recherche et navigation** (liste, filtres par theme, suggestions) sans dupliquer les regles metier du catalogue ou du booking: renvoi vers les parcours applicatifs via **liens profonds** stables.
  - **Cycle de vie editorial**: brouillon, validation, publication, archivage; tracabilite des versions pour affichage conforme (mentions legales, CGU locales gerees dans `Compliance` mais **references** depuis la FAQ).
  - **Mesure d'utilite** (optionnel): signalement article utile/inutile, metriques anonymisees pour prioriser les contenus; respect du cadre privacy.
  - Integration **Chatbot Context**: identifiants d'articles FAQ exposés pour liens sortants depuis les scenarios; pas de logique de dialogue dans la FAQ.
- Aggregate principal: `FaqArticle` (ou `KnowledgeEntry`), `FaqCategory`.
- Evenements: `FaqArticlePublished`, `FaqArticleDeprecated`, `FaqCategoryReordered`.


---

## 3) Architecture applicative cible (microservices AWS)

## Composants cibles
- API Gateway + WAF en entree.
- BFF web client (optionnel) pour agreger les appels frontend.
- Microservices par bounded context.
- Bus d'evenements (Amazon EventBridge ou SNS/SQS).
- Donnees par service (database per service).
- Cache lecture (ElastiCache) pour recherche offres.
- Stockage documents (S3) pour factures/exports.

## Persistance et resilence
- Base relationnelle managée (Amazon RDS/Aurora) en Multi-AZ.
- Read replicas pour charges de lecture.
- Sauvegardes automatisees + tests de restauration periodiques.
- Chiffrement at-rest (KMS) et in-transit (TLS 1.2+).

## Haute disponibilite
- Deploiement multi-AZ minimum.
- Autoscaling horizontal sur services stateless.
- Health checks, circuit breakers, timeouts, retries bornes.
- Zero-downtime deploy (rolling/blue-green selon criticite).

## CI/CD
- Pipelines automatisees (build, tests, scan secu, deploy).
- SAST + SCA + IaC scan.
- Promotion environnementale (dev -> staging -> prod) avec gates qualite.
- Strategie de migration DB versionnee et reversible.

## Securite
- IAM least privilege.
- Secrets dans AWS Secrets Manager / Parameter Store.
- Rotation secrete automatisee.
- Journalisation securite centralisee (CloudTrail + SIEM).

## Observabilite
- Logs structures centralises.
- Metriques (latence, taux erreur, saturation).
- Traces distribuees (OpenTelemetry/X-Ray).
- SLO/SLI par parcours critique (search, booking, payment).

## 3.1 Interface uniformisee, internationalisation et accessibilite

### Objectif
- Garantir une experience utilisateur unique sur tous les pays, sans divergence fonctionnelle ni visuelle.
- Permettre une adaptation locale (langue, formats, moyens de paiement, regles legales) sans fork applicatif.
- Rendre l'application utilisable par tous, y compris les personnes en situation de handicap.

### Choix d'architecture pour une interface uniformisee
- **Design System unique** (tokens, composants UI, patterns de navigation) partage entre tous les parcours.
- **Frontend modulaire** avec pages et composants communs, et points d'extension limites pour les specificites pays.
- **BFF (Backend for Frontend)** pour exposer des payloads homogenes au client web et eviter les differences de rendering selon les APIs internes.
- **Feature flags par pays** pour activer/desactiver des variations locales sans dupliquer le code.
- **Contrats API stables** (versionnes) pour maintenir une UX coherente lors des evolutions backend.

### Choix d'architecture pour l'internationalisation (i18n / l10n)
- **Framework i18n centralise** cote frontend (catalogues de traductions, fallback par defaut, namespaces par domaine).
- **Localisation pilotee par configuration**: langue, devise, fuseau horaire, format date/heure/adresse/telephone.
- **Contenus metier externalises** (messages transactionnels, emails, CGU locales) hors code applicatif.
- **Moteur de regles par pays** dans le `Compliance & Privacy Context` et `Pricing & Policy Context` pour separer regles locales et logique coeur.
- **Support RTL/LTR** des la conception (styles et composants compatibles langues bidirectionnelles).

### Choix d'architecture pour l'accessibilite (a11y)
- **Standard cible**: WCAG 2.1 AA (socle commun, aligne avec les obligations internationales majeures).
- **Composants accessibles by default** dans le Design System (roles ARIA, navigation clavier, focus management, contrastes).
- **Validation continue** dans CI/CD:
  - tests automatiques (axe/lighthouse),
  - controles manuels sur parcours critiques (recherche, reservation, paiement, profil),
  - non-regression accessibilite a chaque release.
- **Accessibilite des contenus dynamiques** (messages d'erreur, modales, stepper de reservation, recapitulatif paiement).
- **Processus de correction priorisee**: backlog a11y dedie, SLA de correction pour blockers critiques.

### Gouvernance et exploitation
- **Ownership clair**: equipe plateforme frontend responsable du Design System et des standards i18n/a11y.
- **Definition of Done** incluant criteres d'accessibilite et verification des traductions.
- **KPI UX internationaux** suivis par pays (abandon tunnel, erreurs formulaire, completion paiement) pour detecter les regressions locales.

---

## 4) Reponse aux exigences non fonctionnelles (point par point)

## 4.1 Fiabilite
- **Choix architecturaux**
  - Architecture microservices event-driven avec isolation des pannes par domaine.
  - Patterns de resilence: timeouts, retries bornes, circuit breaker, bulkhead.
  - Observabilite complete (logs, metriques, traces) + alerting SLO.
- **Cible chiffree**
  - Taux de succes des parcours critiques (`search`, `booking`, `payment`) >= **99.9%** mensuel.
  - MTTD incident P1 <= **5 min**.

## 4.2 MMTR (MTTR)
- **Choix architecturaux**
  - Runbooks d'incident, dashboards standardises, correlation logs-traces.
  - Rollback/deploy blue-green automatise pour reduire le temps de remediation.
- **Cible chiffree**
  - MTTR P1 <= **30 min**.
  - MTTR P2 <= **2 h**.

## 4.3 Reussite des deployements
- **Choix architecturaux**
  - CI/CD avec gates qualite: tests auto, SAST, SCA, scans IaC, smoke tests.
  - Deploiements progressifs (canary ou blue/green) avec auto-rollback.
- **Cible chiffree**
  - Taux de reussite deploiement >= **98%**.
  - Changement sans interruption de service visible >= **99%** des releases.

## 4.4 Stabilisation post-release
- **Choix architecturaux**
  - Feature flags, progressive delivery, verification post-deploiement automatisee.
  - Monitoring renforce sur 24h post-release.
- **Cible chiffree**
  - Delai de stabilisation moyen <= **24 h**.
  - Defauts critiques post-release <= **1** par release majeure.

## 4.5 Securite applicative
- **Choix architecturaux**
  - Secure SDLC: revues, dependabot/SCA, scans container, hardening runtime.
  - WAF, IAM least privilege, MFA admin, audit trail centralise.
- **Cible chiffree**
  - Vulnerabilites **critiques** ouvertes en production = **0**.
  - Vulnerabilites **hautes** corrigees sous **7 jours**.
  - Couverture MFA comptes privilegies = **100%**.

## 4.6 Chiffrement du trafic
- **Choix architecturaux**
  - TLS termine en edge (ALB/API Gateway) + mTLS interne si necessaire.
  - Desactivation des protocoles obsoletes.
- **Cible chiffree**
  - Trafic externe en **TLS 1.2+ a 100%** (objectif TLS 1.3 > **95%** quand possible).
  - Trafic interne service-a-service chiffre a **100%**.

## 4.7 Gestion des secrets
- **Choix architecturaux**
  - Centralisation AWS Secrets Manager / Parameter Store.
  - Rotation automatique + acces via roles IAM temporaires.
- **Cible chiffree**
  - Secrets en dur dans code/config = **0**.
  - Secrets centralises en coffre = **100%**.
  - Rotation automatique <= **90 jours** (<= **30 jours** pour secrets critiques paiement).

## 4.8 Disponibilite
- **Choix architecturaux**
  - Multi-AZ obligatoire pour composants critiques.
  - Auto-scaling + capacity planning + tests de charge periodiques.
- **Cible chiffree**
  - Disponibilite globale plateforme >= **99.95%** mensuelle.
  - Disponibilite services critiques (`booking`, `payment`) >= **99.99%** mensuelle.

## 4.9 Redondance
- **Choix architecturaux**
  - Aurora/RDS Multi-AZ + read replicas.
  - Composants stateless redondes sur au moins 2 AZ.
- **Cible chiffree**
  - Tous services critiques deploies sur >= **2 AZ**.
  - RPO <= **15 min** et RTO <= **60 min** pour domaines critiques.

## 4.10 Charge (capacite)
- **Choix architecturaux**
  - Cache (ElastiCache), requetes optimisees, autoscaling horizontal.
  - Test de charge continu dans le pipeline pre-prod.
- **Cible chiffree**
  - Capacite nominale sans degradation >= **1000 req/s**.
  - Capacite en pic saisonnier >= **2000 req/s** (burst) avec latence p95 sous SLO.

## 4.11 Taux d'erreur
- **Choix architecturaux**
  - Retry intelligents, idempotence, fallback fonctionnels, protection anti-surcharge.
- **Cible chiffree**
  - Taux d'erreur global 5xx <= **0.3%** mensuel.
  - Taux d'erreur en pic saisonnier <= **0.8%**.

## 4.12 Backups et restauration
- **Choix architecturaux**
  - Backups automatiques, snapshots, PITR, replication inter-region pour donnees critiques.
  - Exercices de restauration planifies.
- **Cible chiffree**
  - Sauvegardes automatiques: **journalieres + PITR** active.
  - Taux de succes des tests de restauration >= **99%**.
  - Tests de restauration: **1/mois** (critique) et **1/trimestre** (non critique).

---

## 5) Reglementations applicables par pays (point de vigilance)

> Note: ce document est une synthese technique de cadrage, pas un avis juridique. Validation finale avec legal/compliance locale requise avant mise en production.

## 5.1 Cadre commun minimum (tous pays)
- **Protection donnees**: minimisation, base legale, droits utilisateurs, registre de traitements.
- **Paiement**:
  - Externalisation via PSP certifie.
  - SCA/3DS quand applicable.
  - PCI DSS v4.0.1 (exposition CB minimisee, tokenisation).
- **Securite**: chiffrement, MFA admin, gestion des incidents, journalisation.
- **Accessibilite**: conformite WCAG/standards locaux.

## 5.2 France (et UE FR)
- **RGPD** + cadre CNIL (cookies, transparence, droits).
- **DSP2/SCA** sur paiements electroniques.
- **PCI DSS** via PSP.
- **ePrivacy/cookies** (consentement granulaire, refus aussi simple).
- **Accessibilite**: alignement fort sur WCAG 2.1 AA (et exigences nationales selon perimetre).

## 5.3 Allemagne
- **RGPD + BDSG**.
- **DSP2/SCA**.
- **BFSG** (application depuis 28/06/2025) pour services numeriques B2C, incluant e-commerce.
- Reference technique usuelle: **EN 301 549 / WCAG 2.1 AA**.

## 5.4 Espagne
- **RGPD + LOPDGDD**.
- **DSP2/SCA**.
- **Royal Decree 933/2021** (obligations de registre/documentation pour location vehicules a moteur; retention, transmission aux autorites selon regles).
- **Loi 11/2023** (transposition EAA) sur accessibilite numerique.

## 5.5 Italie
- **RGPD + Codice Privacy** (D.Lgs 196/2003 amende).
- **DSP2/SCA**.
- **D.Lgs 82/2022** (transposition EAA, exigences accessibilite produits/services des 2025).
- **PCI DSS**.

## 5.6 Royaume-Uni
- **UK GDPR + Data Protection Act 2018**.
- **SCA** via regime PSD2 UK-equivalent (pratique bancaire locale).
- **Consumer law/CMA** (transparence prix et frais obligatoires).
- **Equality Act 2010**: exigence non-discrimination => accessibilite numerique attendue (WCAG recommande).

## 5.7 Canada
- **PIPEDA** (federal) + lois provinciales.
- **Quebec Law 25** (exigences renforcees, PIA, gouvernance, sanctions elevees).
- **AODA** en Ontario (WCAG 2.0 AA pour organisations concernees).
- **Accessible Canada Act** pour entites federales regulees.

## 5.8 Etats-Unis
- **Privacy state-by-state** (priorite CA: CCPA/CPRA, droits opt-out, notices, GPC).
- **PCI DSS** pour cartes.
- **ADA** (accessibilite web, approche DOJ; WCAG 2.1 AA reference de fait).
- **FTC Safeguards Rule** (si activites qualifies "financial institution" selon perimetre legal).

## 5.9 Traduction architecturale de ces obligations
- Isoler un **Compliance Service** configurable par pays.
- Mettre en place un **Policy Engine** (regles retention, consentement, DSAR, annulation/remboursement locaux).
- Ajouter un **Data Residency Strategy** (partition logique et controles transfert hors zone).
- Standardiser un **Audit Trail inviolable**.
- Industrialiser la **preuve de conformite accessibilite** (audit recurrent + backlog correctif).

---

## 6) Fournisseurs de paiement adaptes a une application internationale

## 6.1 Criteres de selection
- Couverture geographique reelle (pays d'encaissement + pays clients).
- Richesse moyens de paiement locaux (cartes + wallets + APM).
- Performance auth (routing local, smart retries).
- Capacites refund/partial refund, idempotence, anti-fraude.
- Qualite API, webhooks, observabilite.
- Gouvernance compliance (PCI, SCA, support legal local).
- Cout total (MDR + FX + frais annexes) et qualite support.

## 6.2 Shortlist recommandee

### Stripe
- Fort DX (integration rapide), tres bon pour equipes produit/engineering.
- Large couverture paiement global et nombreux moyens locaux.
- Adaptation rapide pour MVP international.

### Adyen
- Tres fort en enterprise global et unification online/offline.
- Large panel de methodes locales et capacites d'orchestration avancees.
- Souvent excellent a gros volumes multi-pays.

### Checkout.com
- Bon compromis pour scale-up internationale.
- Large catalogue de methodes et bonne flexibilite de configuration.

### PayPal (en complement)
- Tres forte confiance utilisateur et conversion selon segments.
- Utilisable en wallet complementaire plutot qu'en PSP unique.

### Worldpay
- Acteur historique global, footprint enterprise.
- Pertinent pour organisations avec besoins acquiring etablis.

### dLocal (specialiste marches emergents)
- Tres pertinent pour LATAM/Afrique/Asie emergente avec moyens locaux.
- Fort levier conversion si cible hors marches "core" occidentaux.

## 6.3 Strategie de mise en place conseillee
- **Approche 1 PSP principal + 1 PSP secondaire**:
  - Principal: Stripe ou Adyen (selon taille et capacite interne).
  - Secondaire: dLocal (si priorite emerging markets) ou PayPal wallet.
- Ajouter ensuite une couche **Payment Orchestration** interne pour:
  - bascule PSP,
  - routing par pays/moyen de paiement,
  - resilience et optimisation cout/acceptance.

---

## 7) Recommandation initiale (phase 1)

- Cadrer officiellement les bounded contexts ci-dessus.
- Lancer un **MVP international** sur 2-3 pays pilotes (ex: FR, UK, CA).
- Integrer un PSP principal rapidement (Stripe ou Adyen), avec modeles de paiement event-driven.
- Mettre des le depart:
  - socle compliance (consentement, DSAR, retention),
  - socle accessibilite (WCAG),
  - socle HA/CI-CD/observabilite.
- Prevoir la montee en complexite reglementaire par "country packs" dans le Compliance Context.

---

## 8) Sources de reference (non exhaustif)

- Documents projet:
  - `etat des lieux client.md`
  - `cdcClient.md`
  - `CDC.md`
- References officielles consultees:
  - EBA (PSD2/SCA)
  - PCI SSC (PCI DSS v4.0.1)
  - ICO (UK GDPR guidance)
  - DOJ ADA (web accessibility)
  - FTC Safeguards Rule
  - Ontario AODA
  - Canada Accessible Canada Regulations
  - Normattiva/Gazzetta (Italie D.Lgs 82/2022)
  - Gesetze-im-Internet (Allemagne BFSG)
  - Documentation officielles PSP (Stripe, Adyen, Checkout.com, PayPal, Worldpay, dLocal)

