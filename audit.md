# Audit SWOT - Version comite de direction

## Introduction du projet

Your Car Your Way engage un programme de transformation visant a remplacer quatre applications historiques heterogenes par une application client unique, deployable a l'international.

L'objectif business est de renforcer l'experience client, de reduire les couts et risques operationnels, et d'accelerer la capacite de lancement de nouvelles offres.

Cet audit SWOT s'appuie sur le cahier des charges client (`cdcClient.md`) et l'etat des lieux technique existant (`etat des lieux client.md`) afin d'eclairer les decisions de priorisation.

## Tableau recapitulatif (lecture executif)

| Axe | Constat cle | Impact direction | Niveau |
|---|---|---|---|
| Forces | Besoin metier V1 clair et cas d'usage coeur identifies | Base solide pour lancer une V1 ciblee | Fort |
| Forces | Des briques modernes existent deja (AWS/Azure, React/Node, containerisation US) | Accelere la convergence technique | Moyen |
| Faiblesses | SI fragmente (4 applications, stacks et donnees divergentes) | Surcouts, lenteur de delivery, complexite de pilotage | Critique |
| Faiblesses | Dette securite sur perimetres historiques (SHA-1, TLS 1.0, secrets) | Exposition risque cyber et conformite | Critique |
| Opportunites | Plateforme unique + API unifiees + CI/CD | Gains de productivite, fiabilite et time-to-market | Fort |
| Opportunites | Paiement externalise (ex. Stripe) | Reduction risque PCI et acceleration go-to-market | Moyen |
| Menaces | Migration donnees/regles pays complexe | Risque de regression metier et incident de service | Critique |
| Menaces | Pics saisonniers et robustesse inegale selon pays | Risque de perte de revenu et de satisfaction client | Fort |

## SWOT detaille

### Strengths - Forces
- Le perimetre V1 est explicite : profil, recherche d'offres, reservation, paiement, historique, modification/annulation.
- Le patrimoine fonctionnel historique est riche, notamment sur FR/DE/ES/IT.
- Les experimentations techniques deja realisees fournissent des options concretes pour la cible.
- Des pratiques de securite plus matures existent deja sur certains pays, facilitant une harmonisation.

### Weaknesses - Faiblesses
- Forte fragmentation applicative et technologique entre pays.
- APIs limitees et non unifiees, compliquant l'interoperabilite avec les applications agence.
- Dette technique et securitaire notable sur les environnements historiques.
- Fiabilite et exploitation inegales (deploiements manuels, MTTR eleve sur OVH, backups peu testes).
- Divergence progressive des regles metier selon pays, compliquant la standardisation.

### Opportunities - Opportunites
- Construire une plateforme client internationale unique, avec un socle de donnees et d'API commun.
- Standardiser la chaine de delivery (CI/CD, tests, observabilite, rollback) pour reduire incidents et delais.
- Elever le niveau de securite global (hashage moderne, TLS recent, gestion centralisee des secrets, remediations).
- Generaliser l'externalisation paiement afin de reduire le risque de conformite.

### Threats - Menaces
- Risque de migration (donnees, historiques et regles locales) avec impact potentiel sur continuite d'activite.
- Risque cyber et reglementaire en cas de retard de remediation securite.
- Risque de performance en periode de pic si la cible n'integre pas la scalabilite des l'architecture.
- Risque de derapage planning/couts sans gouvernance transversale metier + technique.

## Message cle pour decision

Le projet est strategiquement pertinent et createur de valeur, mais sa reussite depend d'un pilotage strict des risques de convergence et de migration.

La recommandation est d'engager une trajectoire par vagues, avec priorisation immediate des chantiers securite, API communes et industrialisation de la livraison.

## Priorites 90 jours (proposition)

1. Finaliser le cadrage fonctionnel V1 global + variantes pays (scope ferme).
2. Lancer le plan de remediation securite prioritaire (hashage, TLS, secrets, dependances critiques).
3. Definir le contrat d'API unifie et la gouvernance de version.
4. Mettre en place le socle d'execution cible (CI/CD, observabilite, tests de restauration).
5. Construire le plan de migration par vagues avec KPI de suivi direction (disponibilite, erreurs, MTTR, conversion).
