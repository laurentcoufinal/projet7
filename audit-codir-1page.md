# Audit projet - Synthese CODIR (1 page)

## 1) Objet et decision attendue

Le projet vise a remplacer les applications client historiques heterogenes par une plateforme internationale unifiee.

**Decision attendue du CODIR :** valider un **GO conditionnel** avec execution par vagues, gouvernance centralisee, et priorite immediate sur securite + socle de delivery.

## 2) Pourquoi maintenant

- Fragmentation actuelle (applications, stacks, donnees, regles pays) qui freine la vitesse d'execution.
- Risque securitaire non negligeable sur certains perimetres historiques.
- Opportunite de gains mesurables sur experience client, fiabilite et cout total d'exploitation.

## 3) Lecture executive en 30 secondes

| Dimension | Constat | Impact business | Priorite |
|---|---|---|---|
| Valeur | Besoins V1 clairs et transverses | Acceleration time-to-market | Haute |
| Risque | Dette securite + heterogeneite technique | Exposition cyber / conformite / incidents | Critique |
| Faisabilite | Capacites modernes deja presentes (cloud, stacks recentes) | Transformation realisable sans rupture brutale | Haute |
| Conduite du changement | Divergences locales fortes | Risque planning/couts sans gouvernance stricte | Critique |

## 4) Recommendation Go / No-Go

### Recommandation
**GO conditionnel** sur la base des garde-fous suivants :
1. Scope V1 ferme (fonctions communes + gestion explicite des variantes pays).
2. Plan securite immediate (hashage, TLS, secrets, dependances critiques).
3. API communes contract-first pour clients et agences.
4. Migration par vagues avec KPI de pilotage et jalons de go/no-go intermediaires.

### Cas No-Go (a eviter)
- Lancement global "big bang".
- Demarrage sans remediation securite prioritaire.
- Demarrage sans architecture d'API cible et sans gouvernance transverse.

## 5) Trois scenarios d'execution

| Scenario | Description | Delai relatif | Risque | Investissement | Quand le choisir |
|---|---|---|---|---|---|
| Prudent | Stabilisation + securite + standardisation avant migration large | Plus long | Plus faible | Modere | Contrainte de risque forte (reglementaire/cyber) |
| Cible | Equilibre valeur/risque : socle commun puis migration progressive par vagues | Intermediaire | Maitrise | Intermediaire | Option recommandee pour maitriser execution et ROI |
| Accelere | Migration rapide multi-pays avec parallelisation maximale | Plus court | Plus eleve | Eleve | Fenetre business urgente, forte capacite d'absorption |

## 6) Trajectoire recommandee (scenario cible)

### 0-90 jours
- Cadrage V1 final et gouvernance produit/technique.
- Lancement remediation securite prioritaire.
- Definition du contrat d'API unifie.
- Mise en place socle CI/CD, observabilite, tests de restauration.

### 3-9 mois
- Livraison V1 sur un premier lot pilote.
- Migration de donnees outillee et reversible.
- Mesure KPI de stabilite, performance et conversion.

### 9-18 mois
- Generalisation par vagues pays.
- Rationalisation des applications legacy.
- Industrialisation continue et optimisation cout/performance.

## 7) KPI de pilotage CODIR

- Disponibilite, MTTR, taux d'erreur en pics de trafic.
- Taux de succes de deploiement et delai de stabilisation post-release.
- Exposition securite (vulnerabilites critiques ouvertes, couverture remediation).
- KPI metier : conversion reservation, taux d'annulation, satisfaction client.

## 8) Decision proposee

Valider **GO conditionnel - scenario cible** avec revue CODIR mensuelle et points de passage go/no-go a chaque vague de migration.
