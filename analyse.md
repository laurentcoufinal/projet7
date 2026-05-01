# Analyse fonctionnelle et cadrage client

## 1. Objectif du document

Ce document consolide :
- l'analyse de l'existant technique issue de [etat des lieux client.md](./etat%20des%20lieux%20client.md),
- les besoins fonctionnels du client issus de [cdcClient.md](./cdcClient.md),
- une specification fonctionnelle V1 exploitable pour le cadrage produit et la conception.

---

## 2. Contexte et synthese de l'existant

Your Car Your Way dispose actuellement de plusieurs applications web historiques non unifiees :
- **FR/DE/ES/IT** : socle Java EE monolithique (OVH, deploiements manuels),
- **UK** : Laravel sur AWS (application isolee),
- **CA** : React/Node.js sur AWS (modernisation partielle),
- **US** : Angular/Spring Boot sur Azure (containerisation partielle).

### Constats structurants
- Ecosysteme fragmenté : stacks techniques, regles metier et schemas de donnees divergents selon les pays.
- APIs heterogenes et peu unifiees, partage d'information limite.
- Dominante monolithique, dette technique significative sur le socle historique.

### Constats qualite de service (etats de fait)
- Disponibilite : FR/DE/ES/IT en dessous des autres zones.
- MTTR : environ 2h45 sur OVH vs 1h10 sur AWS/Azure.
- Deploiements : 82% de reussite (OVH manuel) vs 91% (cloud).
- Stabilisation post-release : 3,4 jours (OVH) vs 1,7 jour (cloud).

### Constats securite et exploitation
- Hashage legacy en SHA-1 sur FR/DE/ES/IT (ecart critique).
- TLS 1.0 encore present sur FR et IT.
- Gestion des secrets inegale (fichiers serveur, variables env sans rotation, KeyVault partiel).
- Backups et tests de restauration insuffisants hors US.

### Implication produit
La V1 doit etre pensee comme une **application client internationale unifiee**, avec des regles metier communes et des variantes locales maitrisees, pour sortir de la logique de forks pays.

---

## 3. Besoins fonctionnels client (source CDC)

## 3.1 Perimetre fonctionnel V1
Application a destination des **clients finaux** (pas des operations agence internes), deployee a l'international.

### Gestion du profil
- Consulter son profil.
- Modifier ses informations personnelles (nom, prenom, date de naissance, adresse).
- Supprimer son compte.

### Gestion d'une location
- Consulter la liste des agences.
- Rechercher des offres selon :
  - ville de depart,
  - ville de retour,
  - date/heure de debut,
  - date/heure de retour,
  - categorie vehicule (ACRISS).
- Consulter le detail d'une offre.
- Reserver une offre (incluant saisie/reprise des informations personnelles et paiement).
- Consulter l'historique des reservations (passees et en cours).
- Modifier et annuler une reservation.

### Exigences particulieres explicites
- Modification autorisee jusqu'a 48h avant le debut.
- Annulation a moins de 7 jours : remboursement a 25%.
- Paiement externalise via PSP.
- Categorie vehicule conforme norme ACRISS.
- Suppression de compte avec ressaisie mot de passe.
- API CRUD pour applications agence sur les domaines metier.

---

## 4. Analyse des ecarts (existant vs cible fonctionnelle)

## 4.1 Ecarts fonctionnels
- Le CDC est marque comme **non exhaustif/non complete** : besoin de raffiner les parcours et cas limites.
- Divergence actuelle des regles de reservation entre pays : risque de comportement incoherent en V1 internationale.
- API agence actuellement heterogene : risque d'incompatibilite avec un contrat unique.

## 4.2 Ecarts techniques qui impactent la fonction
- Qualite de service inegale selon pays (risque UX degradee sur reservation/paiement).
- Securite legacy (SHA-1, TLS 1.0, secrets) incompatible avec une mise en production internationale robuste.
- Donnees et schemas divergents : migration fonctionnelle potentiellement complexe (historique, profil, reservations).

## 4.3 Points de vigilance de cadrage
- Definir explicitement les regles transverses (fuseaux horaires, devises, formats locaux).
- Clarifier le comportement de modification/annulation sur cas limites (exactement a 48h, fuseaux, changement d'agence).
- Encadrer les scenarios d'echec paiement et de reprise.

---

## 5. Specification fonctionnelle client (V1)

Cette section formalise un niveau de specification fonctionnelle operable pour design, dev et recette.

## 5.1 Acteurs
- **Client** : utilisateur final de l'application web.
- **Application Agence (via API)** : consommateur machine des operations CRUD autorisees.
- **PSP** : fournisseur de paiement externe.

## 5.2 Parcours fonctionnels

### PF-01 - Consulter profil
- Le client accede a sa page profil.
- Le systeme affiche les donnees personnelles stockees.
- En cas de non-authentification, redirection vers connexion.

### PF-02 - Modifier profil
- Le client edite ses informations.
- Le systeme valide les formats obligatoires.
- Le systeme enregistre puis confirme la mise a jour.

### PF-03 - Supprimer compte
- Le client initie la suppression.
- Le systeme exige la saisie du mot de passe pour confirmation.
- Si la verification est valide, le compte passe en suppression selon la politique appliquee.

### PF-04 - Rechercher offres
- Le client saisit les criteres (villes, dates/heures, categorie).
- Le systeme valide la coherence des dates (retour > depart).
- Le systeme retourne la liste d'offres compatibles.

### PF-05 - Consulter detail offre
- Le client ouvre une offre.
- Le systeme affiche les attributs de l'offre (agences, dates, categorie, tarif, conditions).

### PF-06 - Reserver une offre
- Le client choisit une offre et confirme les informations personnelles.
- Le paiement est declenche via PSP.
- La reservation est confirmee uniquement si paiement autorise/capture selon la regle metier.

### PF-07 - Consulter historique reservations
- Le client visualise les reservations passees et en cours.
- Le systeme permet filtre et acces detail.

### PF-08 - Modifier reservation
- Le client demande une modification.
- Le systeme refuse si la reservation est a moins de 48h du debut.
- Sinon, la modification est appliquee et historisee.

### PF-09 - Annuler reservation
- Le client demande une annulation.
- Le systeme calcule le remboursement selon la regle :
  - moins de 7 jours avant debut : 25% du montant total.
- Le systeme lance la procedure de remboursement via PSP.

### PF-10 - API CRUD Agence
- Les applications agence accedent a une API CRUD sur les domaines autorises (ex. utilisateur, reservation).
- Le contrat API doit etre stable et documente.

## 5.3 Regles fonctionnelles normatives
- RF-01 : une reservation n'est confirmee qu'apres validation paiement.
- RF-02 : les categories vehicules utilisent la norme ACRISS.
- RF-03 : la suppression de compte requiert verification mot de passe.
- RF-04 : modification interdite si moins de 48h avant debut.
- RF-05 : annulation tardive (<7 jours) => remboursement 25%.
- RF-06 : l'historique reservations conserve les changements d'etat significatifs.

## 5.4 Donnees fonctionnelles minimales
- **Profil** : nom, prenom, date de naissance, adresse.
- **Recherche** : ville depart/retour, date/heure debut/retour, categorie.
- **Offre** : agences, dates/heures, categorie, tarif.
- **Reservation** : reference, statut, montant, dates, agences, categorie.
- **Paiement** : reference transaction, statut, montant, devise, horodatage.

## 5.5 Cas d'erreur attendus (fonctionnels)
- Criteres de recherche invalides (dates incoherentes, categorie absente).
- Paiement refuse/interrompu.
- Tentative de modification hors delai.
- Tentative de suppression compte avec mot de passe invalide.

---

## 6. Criteres d'acceptation fonctionnels (base recette)

- CA-01 : un client authentifie peut consulter/editer son profil.
- CA-02 : la suppression de compte est impossible sans mot de passe correct.
- CA-03 : une recherche valide renvoie des offres conformes aux criteres.
- CA-04 : une reservation sans paiement confirme ne passe jamais a l'etat confirmee.
- CA-05 : la modification a moins de 48h est bloquee avec message explicite.
- CA-06 : l'annulation a moins de 7 jours applique bien un remboursement de 25%.
- CA-07 : l'historique affiche les reservations passees et en cours.
- CA-08 : l'API agence expose bien les operations CRUD attendues sur les domaines cibles.

---

## 7. Recommandations de clarification (avant conception detaillee)

Le CDC indiquant que la liste n'est pas exhaustive, il est recommande de completer rapidement :
- matrice des etats reservation/paiement (et transitions autorisees),
- regles timezone (48h/7 jours calculees dans quel fuseau),
- politique de remboursement sur frais annexes (si presents),
- scope exact de l'API agence (ressources, droits, quotas),
- parcours i18n/l10n (langues, devise, formats par pays),
- exigences d'accessibilite fonctionnelle (parcours critiques minimum).

---

## 8. Conclusion

Le besoin fonctionnel client V1 est clair sur les parcours coeur (profil, recherche, reservation, paiement, historique, modification/annulation), mais necessite un **raffinement specifique des regles et cas limites** pour securiser une execution internationale.

L'analyse de l'existant confirme que la cible doit prioriser :
- l'unification fonctionnelle inter-pays,
- la fiabilisation des parcours critiques (reservation/paiement),
- la normalisation des contrats API (client et agence),
- et la reduction des ecarts de securite/exploitation qui degradent directement l'experience utilisateur.
