.. CAHIER DES CHARGES
SOMMAIRE
Objet du document 2
Contexte 2
Périmètre 2
Liste des fonctionnalités 2
Gestion du profi l 2
Gestion d’une location de voitures 3
Exigences particulières 3
.. Objet du document
Le document “Cahier des charges” liste les fonctionnalités à implémenter pour le projet Your Car Your Way. Ces fonctionnalités sont exprimées du point de vue métier sous la forme d’actions que l’utilisateur peut effectuer sur l’application.
.. Contexte
Your Car Your Way est une entreprise de location de voitures. Les clients utilisent actuellement des applications web qui ne correspondent plus aux besoins fonctionnels ni aux contraintes techniques.
Une nouvelle application centralisée pour tous les clients doit être créée. .. Périmètre
Les fonctionnalités décrites dans ce document concernent la première version de la nouvelle application Your Car Your Way. Cette application sera déployée à l'international, et utilisée par tous les clients de l’entreprise.
Cette application est à destination des clients, et ne concerne pas les actions que les employés de Your Car Your Way doivent faire en agence.
.. Liste des fonctionnalités
[Note de Leilani : cette section n’est pas exhaustive ni complétée]
Gestion du profi l
● Consulter son profi l via la page de profi l.
● Modifi er ses informations personnelles (nom, prénom, date de naissance, adresse) via la page de profi l.
● Supprimer son compte.
Gestion d’une location de voitures
● Consulter la liste des agences de location.
● Affi cher les offres de location après avoir rempli un formulaire de recherche avec les critères suivants :
○ ville de départ ;
○ ville de retour ;
○ date et heure de début
○ date et heure de retour ;
○ catégorie du véhicule.
● Consulter le détail d’une offre de location.
● Réserver une location correspondant à une offre, ce qui inclut :
○ fournir ses informations personnelles (récupérables depuis le profi l si présentes) ;
○ effectuer le paiement.
● Consulter l’historique de ses réservations (passées et en cours).
● Modifi er et annuler une réservation.
Une offre de location se défi nit par :
● une ville de départ ;
● une ville de retour ;
● une date et une heure de départ ;
● une date et une heure de retour ;
● une catégorie de véhicule ;
● un tarif.
.. Exigences particulières
● La modifi cation d’une réservation est possible jusqu’à 48 h avant le début de cette dernière.
● À moins d'une semaine du début de la réservation, YourCarYourWay ne rembourse que 25 % du montant total de la réservation.
● La gestion du paiement doit être externalisée auprès d’un fournisseur de service de paiement en ligne (par exemple : Stripe).
● Les catégories du véhicule reprennent la norme ACRISS : https://www.acriss.org/car-codes/.
● La suppression du compte implique de saisir le mot de passe du compte.
● Les applications utilisées en agence doivent avoir accès à une API pour consulter et modifi er les données traitées par l’application à destination des clients. Les opérations CRUD standard sont requises pour chaque domaine (exemple : utilisateur, réservation, etc.).