# Audit SWOT – Comité de direction

## Introduction

Your Car Your Way engage un programme de transformation visant à remplacer des applications historiques hétérogènes par une expérience client unifiée, déployable à l’international.

L’objectif business est de renforcer l’expérience client, de réduire les coûts et risques opérationnels, et d’accélérer le lancement de nouvelles offres.

Cet audit SWOT s’appuie sur le cahier des charges client (`cdcClient.md`) et surtout sur l’état des lieux technique ([etat des lieux client.md](etat%20des%20lieux%20client.md)) : chaque point indique les **pays concernés**, un **détail factuel**, et une **lecture par rapport aux bonnes pratiques** courantes (OWASP, NIST, TLS moderne, gestion des secrets, SRE/DORA, sauvegardes testées).

---

## Résumé général (tous pays confondus)

| Thème | Synthèse transversale |
|--------|------------------------|
| **Périmètre** | Quatre stacks pays (France / Allemagne / Espagne / Italie d’un côté, Royaume-Uni, Canada, États-Unis de l’autre), monolithes, bases et schémas divergents, APIs peu unifiées. |
| **Sécurité** | Le socle **France, Allemagne, Espagne, Italie** concentre les écarts les plus critiques (SHA-1, TLS 1.0 sur FR et IT, secrets en fichiers). **Canada** se distingue par Argon2id ; **Royaume-Uni** et **États-Unis** par bcrypt ; **États-Unis** a la dette de paquets vulnérables la plus faible (11 %). |
| **Fiabilité / exploitation** | Disponibilité et MTTR meilleurs sur **Royaume-Uni, Canada, États-Unis** (cloud) que sur **France, Allemagne, Espagne, Italie** (OVH, déploiements manuels). Taux d’erreurs en pic plus élevé sur le socle OVH (jusqu’à 4 %). |
| **Résilience / données** | Pas de réplication applicative sur **France, Allemagne, Espagne, Italie** ; réplication partielle **Royaume-Uni, Canada** ; **États-Unis** conteneurisé mais base non redondante. Backups testés documentés surtout **États-Unis**. |
| **Lecture globale** | Les bonnes pratiques actuelles sont le mieux reflétées par **Canada** (hachage) et **États-Unis** (conteneurs, restauration périodique, moins de vulnérabilités dans les dépendances), avec **Royaume-Uni** en position intermédiaire. Le socle **France, Allemagne, Espagne, Italie** porte la dette technique et sécurité la plus lourde au regard des standards actuels. |

---

## Référence « bonnes pratiques » (rappel court)

- **Mots de passe** : algorithmes adaptatifs modernes (OWASP / NIST : Argon2id, bcrypt ou scrypt avec paramètres adaptés au contexte) ; éviter les fonctions de hachage rapides ou obsolètes pour le stockage « password ».
- **Transport** : TLS 1.2 minimum, TLS 1.3 recommandé ; abandon de TLS 1.0/1.1 (interopérabilité et conformité).
- **Secrets** : coffre (Key Vault, Secrets Manager, etc.), pas de secrets en clair sur disque ; rotation automatisée lorsque possible.
- **Livraison** : pipelines CI/CD, faible taux d’échec de déploiement, rollback rapide (indicateurs proches des travaux DORA).
- **Disponibilité** : objectifs souvent exprimés en SLO (ex. 99,9 % ≈ 43 min d’indisponibilité par mois) ; redondance et capacité dimensionnée pour les pics.
- **Sauvegardes** : automatisation, fréquence adaptée, **tests de restauration** documentés (continuité / DR).

---

## Forces (alignement ou proximité avec les bonnes pratiques)

Chaque point rappelle explicitement les **pays concernés**.

### F1 – Industrialisation et résilience opérationnelle sur la zone cloud US

- **Pays concernés** : **États-Unis**.
- **Détail** : Disponibilité 98,9 % ; erreurs sous pic 0,8 % ; dépendances avec vulnérabilités connues : 11 % ; Spring Boot sur Azure (App Services / Conteneurs) ; seule application containerisée ; sauvegardes Azure automatisées avec test de restauration tous les 90 jours ; Azure Key Vault utilisé partiellement (API).
- **Bonne pratique** : livraison sur plateforme managée, conteneurisation, preuve de restauration, limitation de la surface vulnérable dans la chaîne de dépendances.
- **Constat** : alignement relativement bon avec les attentes « cloud natif » et sécurité supply-chain, malgré Key Vault partiel et base non redondante (voir faiblesses).

### F2 – Hachage des mots de passe à l’état de l’art sur le périmètre Canada

- **Pays concernés** : **Canada**.
- **Détail** : Argon2id côté Node.js ; React / Node.js ; AWS ; charge max sans dégradation ≈ 300 req/s ; disponibilité 98,1 % ; MTTR cloud ≈ 1 h 10 (comme UK et US).
- **Bonne pratique** : Argon2id est explicitement dans les recommandations OWASP pour le stockage des secrets d’authentification.
- **Constat** : point fort net sur la cryptographie applicative ; le reste (monolithe, secrets sans rotation) reste perfectible.

### F3 – Stack Laravel et cloud AWS avec indicateurs supérieurs au socle OVH

- **Pays concernés** : **Royaume-Uni**.
- **Détail** : bcrypt (cost 10) ; Laravel sur AWS EC2 ; disponibilité 98,6 % ; taux de paquets vulnérables 18 % ; déploiements cloud avec 91 % de réussite ; stabilisation post-release 1,7 jour (comme CA/US).
- **Bonne pratique** : bcrypt largement accepté ; cloud et déploiements plus fiables que le manuel OVH.
- **Constat** : bon compromis sécurité / modernité par rapport à FR/DE/ES/IT ; écart vs elite DORA et rotation des secrets.

### F4 – Patrimoine fonctionnel et couverture multi-pays sur un socle commun Java

- **Pays concernés** : **France** (socle historique), **Allemagne**, **Espagne**, **Italie** (déclinaisons du même cœur Java EE).
- **Détail** : Base fonctionnelle riche ; JSP/JSF, Java EE, OVH ; divergences locales maîtrisées métier mais dette technique accumulée.
- **Bonne pratique** : ne pas « jeter » un socle riche ; capitaliser par remédiation ciblée et extraction progressive d’API.
- **Constat** : force produit et opérationnelle (une équipe peut couvrir quatre marchés) malgré les faiblesses techniques listées ailleurs.

---

## Faiblesses (écarts marqués par rapport aux bonnes pratiques)

### W1 – Protocoles TLS obsolètes encore exposés

- **Pays concernés** : **France**, **Italie** (TLS 1.0 documenté pour compatibilité). Les autres pays ne sont pas indiqués comme concernés sur ce point dans l’état des lieux.
- **Détail** : HTTPS partout mais TLS 1.0 encore utilisé sur FR et IT.
- **Bonne pratique** : TLS 1.2+ obligatoire ; viser TLS 1.3 ; désactivation des suites obsolètes.
- **Constat** : écart majeur conformité et sécurité transport.

### W2 – Stockage des mots de passe non conforme aux standards actuels

- **Pays concernés** : **France**, **Allemagne**, **Espagne**, **Italie** (SHA-1, héritage).
- **Détail** : À l’inverse, **Royaume-Uni** (bcrypt), **Canada** (Argon2id) et **États-Unis** (bcrypt strength 12) ne sont pas concernés par ce constat sur le hashage.
- **Bonne pratique** : migrer vers Argon2id ou bcrypt avec politique de re-hachage à la connexion ou reset contrôlé.
- **Constat** : risque critique en cas de fuite de base ; priorité absolue de remediation.

### W3 – Gestion des secrets et rotation

- **Pays concernés** : **France**, **Allemagne**, **Espagne**, **Italie** (secrets dans fichiers de configuration sur serveur OVH) ; **Royaume-Uni**, **Canada** (variables d’environnement AWS, pas de rotation automatisée) ; **États-Unis** (Key Vault partiel – API seulement).
- **Bonne pratique** : coffre central, accès IAM, rotation ; pas de secrets en clair sur le filesystem de prod.
- **Constat** : écart généralisé, moindre sur US, aggravé sur FR/DE/ES/IT.

### W4 – Livraison manuelle et qualité de déploiement sur OVH

- **Pays concernés** : **France**, **Allemagne**, **Espagne**, **Italie**.
- **Détail** : Déploiements manuels ; 82 % de réussite ; stabilisation 3,4 jours ; MTTR OVH ≈ 2 h 45.
- **Bonne pratique** : pipelines automatisés, tests, canary/blue-green ou rollback rapide ; taux d’échec faible.
- **Constat** : écart DORA significatif. **Royaume-Uni**, **Canada**, **États-Unis** : 91 % de réussite – mieux mais encore perfectible vs objectifs « elite ».

### W5 – Résilience applicative, charge et erreurs en pic

- **Pays concernés** : **France**, **Allemagne**, **Espagne**, **Italie** (aucune réplication applicative ; 21–28 min d’indispo mensuelle ; jusqu’à 4 % d’erreurs en pic ; ≈ 150 req/s) ; **Royaume-Uni** (réplication partielle ; 9–16 min ; 1,5 % erreurs ; ≈ 250 req/s) ; **Canada** (idem réplication partielle ; 1,5 % ; ≈ 300 req/s) ; **États-Unis** (7 min/mois ; 0,8 % erreurs ; ≈ 350 req/s mais **base non redondante**).
- **Bonne pratique** : redondance multi-AZ, autoscalage, SLO par chemin critique.
- **Constat** : gradient favorable US > CA ≈ UK > FR/DE/ES/IT ; point faible US sur la base de données.

### W6 – Sauvegardes et preuve de restauration

- **Pays concernés** : **France**, **Allemagne**, **Espagne**, **Italie** (backups manuels 1×/jour, restauration non testée) ; **Royaume-Uni**, **Canada** (snapshots AWS quotidiens, pas de tests réguliers documentés) ; **États-Unis** (sauvegardes automatisées + test tous les 90 jours).
- **Bonne pratique** : restaurations éprouvées sur un rythme défini (ex. trimestriel ou plus fréquent selon criticité).
- **Constat** : seuls les **États-Unis** sont explicitement au niveau « preuve » ; les autres pays sont en retard.

### W7 – Fragmentation architecture et données

- **Pays concernés** : **Tous** (France, Allemagne, Espagne, Italie, Royaume-Uni, Canada, États-Unis).
- **Détail** : 100 % monolithes ; APIs limitées et non unifiées ; une base par pays, schémas divergents ; partage d’information inexistant ou manuel ; **Royaume-Uni** avec modèle métier et données très différents du socle Java.
- **Bonne pratique** : plateforme, contrats d’API, stratégie données (master data, événements).
- **Constat** : faiblesse structurante pour la transformation « une app internationale ».

---

## Opportunités (levier par pays et bonnes pratiques)

### O1 – Modèles cibles Canada + États-Unis

- **Pays concernés** : **Canada**, **États-Unis** (sources de patterns) ; bénéficiaires prioritaires : **France**, **Allemagne**, **Espagne**, **Italie**, **Royaume-Uni**.
- **Détail** : Réutiliser Argon2id (CA), conteneurs et tests de restauration (US), Key Vault / équivalent (US) comme gabarit pour standards groupe.
- **Bonne pratique** : standard de sécurité et d’exploitation unique avec déclinaisons réglementaires locales si besoin.

### O2 – Mutualisation AWS Royaume-Uni – Canada

- **Pays concernés** : **Royaume-Uni**, **Canada**.
- **Détail** : Même fournisseur cloud ; possibilité de CI/CD, Secrets Manager / Parameter Store, observabilité et runbooks communs.
- **Bonne pratique** : réduire le nombre de modèles opérationnels distincts.

### O3 – Remédiation progressive du socle OVH (FR / DE / ES / IT)

- **Pays concernés** : **France**, **Allemagne**, **Espagne**, **Italie**.
- **Détail** : TLS 1.2+, remplacement SHA-1, coffre de secrets, déploiements automatisés, réduction des 41 % / 35–40 % de paquets vulnérables.
- **Bonne pratique** : vagues de migration sans big-bang ; métriques MTTR et taux de déploiement comme preuves de progrès.

### O4 – Programme supply-chain unifié

- **Pays concernés** : **Tous** ; écart le plus marqué **France** (41 %) vs **États-Unis** (11 %).
- **Détail** : SBOM, dépendabot/équivalent, politique de mise à jour et gates en CI.
- **Bonne pratique** : viser une courbe de vulnérabilités connues basse partout.

---

## Menaces (risques aggravés par l’écart aux bonnes pratiques)

### T1 – Risque cyber et conformité (données personnelles, UE)

- **Pays concernés** : surtout **France**, **Allemagne**, **Espagne**, **Italie** (SHA-1, TLS 1.0 FR/IT, secrets fichiers) ; risque réputationnel **tous pays** en cas d’incident transversal.
- **Détail** : Exposition RGPD et audits clients/partenaires si les contrôles techniques restent en retard.
- **Bonne pratique** : alignement explicite sur cadres de sécurité et preuves (logs, chiffrement, accès).

### T2 – Complexité de convergence métier et données

- **Pays concernés** : **Tous** ; accent **Royaume-Uni** vs socle Java FR/DE/ES/IT.
- **Détail** : Divergence de schémas et de règles de réservation ; migrations coûteuses et risque de régression.
- **Bonne pratique** : strangler fig legacy, anti-corruption layer, migration par vagues avec feature flags.

### T3 – Continuité d’activité (OVH et backups)

- **Pays concernés** : **France**, **Allemagne**, **Espagne**, **Italie** (pas de réplication, backups non testés) ; **Royaume-Uni**, **Canada** (pas de tests réguliers documentés).
- **Détail** : RPO/RTO non maîtrisés en incident majeur.
- **Bonne pratique** : scénarios DR documentés et répétés ; rapprocher UK/CA du niveau **États-Unis** sur les tests.

### T4 – Risque politique / adoption sur la modernisation locale Canada

- **Pays concernés** : **Canada**.
- **Détail** : Modernisation jugée insuffisante ; unification visuelle restée locale.
- **Menace** : frein à l’adhésion métier si la trajectoire globale ne clarifie pas le rôle du socle CA dans la cible.

### T5 – Îlot technique États-Unis sans généralisation

- **Pays concernés** : **États-Unis** (pile Azure isolée) ; **Tous** si la dérive continue.
- **Détail** : Compétences rares, coûts, dette de « spécialité US » non amortie au niveau groupe.

---

## Priorités à valider avec le métier (proposition)

À traiter comme liste de travail direction ; les **pays** entre parenthèses sont les plus impactés en premier.

1. **Sécurité immédiate** : sortie TLS 1.0 (**France**, **Italie**) ; plan de migration mots de passe (**France**, **Allemagne**, **Espagne**, **Italie**) ; durcissement secrets (**France**, **Allemagne**, **Espagne**, **Italie**, puis **Royaume-Uni**, **Canada**, compléter **États-Unis**).
2. **Industrialisation** : CI/CD et objectif de taux de déploiement (priorité **France**, **Allemagne**, **Espagne**, **Italie**).
3. **Données et API** : socle commun et gouvernance (**tous pays**, **Royaume-Uni** cas critique).
4. **Preuve de restauration** : calendrier pour **Royaume-Uni**, **Canada** aligné sur la pratique **États-Unis**.

---

## Cibles indicatives (à cadrer avec la direction – SRE / DORA)

Repères « ambition » à affiner par criticité métier ; les **pays** listés sont ceux les plus en retard sur l’état des lieux actuel.

| Indicateur | Cible indicative | Pays prioritairement concernés |
|------------|------------------|--------------------------------|
| Disponibilité annuelle | ≥ 99,5 % puis ≥ 99,9 % selon SLO | **France**, **Allemagne**, **Espagne**, **Italie** |
| MTTR incident | Moins d’1 h en médiane | **France**, **Allemagne**, **Espagne**, **Italie** |
| Réussite déploiement | Plus de 95 % | **France**, **Allemagne**, **Espagne**, **Italie**, puis **Royaume-Uni**, **Canada**, **États-Unis** |
| Stabilisation post-release | Moins de 48 h | **France**, **Allemagne**, **Espagne**, **Italie** |
| Erreurs en pic | Moins de 1 % | **France**, **Allemagne**, **Espagne**, **Italie** |
| Tests de restauration | Trimestriel minimum | **France**, **Allemagne**, **Espagne**, **Italie**, **Royaume-Uni**, **Canada** |

---

## Feuille de route par pays (réutilisation des patterns)

| Pays | Appui sur patterns existants | Axes principaux |
|------|------------------------------|-----------------|
| **France**, **Allemagne**, **Espagne**, **Italie** | Cible sécurité / TLS / hashage alignée **Canada** ; industrialisation alignée **Royaume-Uni** / **Canada** / **États-Unis** | Remédiation crypto et transport ; secrets ; CI/CD ; réplication ; tests backup |
| **Royaume-Uni** | Même cloud **Canada** (AWS) ; sécurité proche **États-Unis** sur bcrypt | Rotation secrets ; tests restauration ; rapprochement API/données vers socle cible |
| **Canada** | Déjà Argon2id ; UX moderne | Rotation secrets ; tests restauration ; rôle dans plateforme globale |
| **États-Unis** | Référence Key Vault, conteneurs, backups testés | HA base de données ; généraliser patterns au groupe |

---

## Tableau récapitulatif (lecture exécutif)

| Axe | Constat clé | Pays concernés (principaux) | Niveau |
|-----|-------------|----------------------------|--------|
| Forces | Briques modernes et métriques favorables (cloud, Argon2id, conteneurs, backups testés US) | **États-Unis**, **Canada**, **Royaume-Uni** ; patrimoine **FR/DE/ES/IT** | Fort à moyen |
| Faiblesses | Dette sécurité et ops sur socle OVH ; fragmentation globale | **FR/DE/ES/IT** (max) ; **UK/CA/US** (points ciblés) | Critique |
| Opportunités | Standardisation à partir CA/US ; mutualisation AWS UK/CA | **Tous** ; levier **CA**, **US**, **UK** | Fort |
| Menaces | Cyber, migration, îlot US, adoption CA | **FR/DE/ES/IT** ; **UK** ; **CA** ; **US** | Critique à fort |

---

## Message clé pour décision

Le projet est stratégiquement pertinent, mais la réussite repose sur une **priorisation sans ambiguïté** : remédiation **France / Allemagne / Espagne / Italie** sur la cryptographie et le transport, **preuve de restauration** pour tous sauf le niveau déjà documenté aux **États-Unis**, et **convergence données / API** impliquant fortement le **Royaume-Uni**.

La recommandation reste une trajectoire par vagues, avec mesures de suivi (disponibilité, erreurs, MTTR, taux de déploiement, dette vulnérabilités) **par pays** jusqu’à alignement groupe.

---

## Priorités 90 jours (proposition – inchangée dans l’esprit, précisée par pays)

1. Cadrage fonctionnel V1 global + variantes pays (scope fermé) – **tous pays**.
2. Plan de remédiation sécurité prioritaire : TLS (**France**, **Italie**), hashage (**France**, **Allemagne**, **Espagne**, **Italie**), secrets (**FR/DE/ES/IT** en priorité), dépendances critiques – **tous pays**, effort max **FR/DE/ES/IT**.
3. Contrat d’API unifié et gouvernance de version – **tous pays**, **Royaume-Uni** en point d’attention.
4. Socle d’exécution cible (CI/CD, observabilité, tests de restauration) – priorité **FR/DE/ES/IT**, alignement **Royaume-Uni**, **Canada**, patterns **États-Unis**.
5. Plan de migration par vagues avec KPI direction – **tous pays**.
