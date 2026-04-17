.. DESCRIPTION TECHNIQUE DE L’EXISTANT
SOMMAIRE
Contexte 2
Architectures par pays 2
France (application historique) 2
Allemagne, Espagne, Italie 2
Royaume-Uni 3
Canada 3
États-Unis 4
Architecture globale 4
État des lieux techniques 4
Fiabilité 4
Sécurité 5
Disponibilité 6
.. Contexte
Your Car Your Way dispose aujourd’hui de quatre applications distinctes, issues de contextes historiques différents.
Elles ont été développées indépendamment, avec des technologies hétérogènes et sans stratégie d’unifi cation technique.
L’architecture globale repose principalement sur des monolithes web déployés dans des environnements variés.
.. Architectures par pays
France (application historique)
● Contexte : première version du produit, base technique la plus ancienne.
● Technologies :
○ Backend : Java EE
○ Frontend : JSP/JSF
● Architecture : monolithe complet (authentifi cation, catalogue, réservation, paiement).
● Hébergement : serveurs OVH, déploiements manuels.
● Particularités :
○ Base fonctionnelle riche mais vieillissante.
○ Ajout progressif des déclinaisons : DE, ES, IT (mêmes fondations techniques et code source dérivé).
Allemagne, Espagne, Italie
● Contexte : dérivés du produit français.
● Technologies : Java EE identique au coeur FR, avec variations locales.
● Hébergement : OVH également.
● Particularités :
○ Code souvent copié/adapté, entraînant une divergence progressive.
○ Fonctionnalités parfois différentes d’un pays à l’autre (règles métier locales).
Royaume-Uni
● Contexte : rachat d’un produit existant.
● Technologies :
○ PHP Laravel
● Déploiement : AWS, instances EC2 classiques.
● Particularités :
○ Application plus récente mais isolée.
○ Différences fortes sur le modèle de données et les règles de réservation.
Canada
● Contexte : Nouveau développement dont l’objectif était de moderniser la stack technique mais le résultat n’a pas été à la hauteur
● Technologies :
○ Frontend : React
○ Backend : Node.js
● Hébergement : AWS, architecture plus moderne mais toujours monolithique côté backend.
● Particularités :
○ Meilleure expérience utilisateur.
○ Première tentative d’unifi cation visuelle, restée locale.
États-Unis
● Contexte : Mise à l’essai d’une nouvelle stack technique à l’occasion de ce nouveau projet
● Technologies :
○ Frontend : Angular
○ Backend : Spring Boot
● Déploiement : Azure (App Services / Containers).
● Particularités :
○ Seule application containerisée.
○ Projet plus ambitieux mais jamais généralisé à d’autres pays. .. Architecture globale
● Architecture dominante : 100 % monolithes web (aucun microservice).
● APIs : limitées, hétérogènes, non unifi ées.
● Données : chaque pays possède sa propre base, avec schémas divergents.
● Partage d’information : inexistants ou via échanges manuels.
.. État des lieux techniques
Fiabilité
Taux de disponibilité moyen des 4 applications (sur 12 mois) :
● FR/DE/ES/IT : 97,2 %
● UK : 98,6 %
● CA : 98,1 %
● US : 98,9 %
Temps moyen de récupération après incident (MTTR) :
● Environ 2 h 45 pour les environnements OVH
● Environ 1 h 10 pour les environnements AWS/Azure
Taux de réussite des déploiements :
● FR/DE/ES/IT (OVH) : 82 % (déploiements manuels)
● UK/CA/US (cloud) : 91 %
Délai moyen de stabilisation après une mise à jour (bugs post‑release jusqu’à stabilisation) :
● FR/DE/ES/IT : 3,4 jours
● UK/CA/US : 1,7 jour
Sécurité
Hashage des mots de passe :
● FR/DE/ES/IT : SHA‑1 (héritage historique)
● UK (Laravel) : bcrypt (cost 10)
● CA (Node.js) : argon2id
● US (Spring Boot) : bcrypt (strength 12)
Chiffrement du trafi c :
● HTTPS activé partout mais TLS 1.0 encore utilisé sur FR et IT pour compatibilité.
Gestion des secrets :
● FR/DE/ES/IT : secrets stockés dans fi chiers de confi guration sur serveur OVH
● UK/CA : variables d’environnement AWS, pas de rotation automatisée
● US : Azure KeyVault utilisé partiellement (API seulement)
Taux de dépendances présentant des vulnérabilités connues (scan interne) :
● FR : 41 % des packages
● DE/ES/IT : entre 35 % et 40 %
● UK : 18 %
● CA : 22 %
● US : 11 %
Disponibilité
Temps moyen d’indisponibilité mensuel :
● FR/DE/ES/IT : 21 à 28 minutes
● UK/CA : 9 à 16 minutes
● US : 7 minutes
Redondance :
● FR/DE/ES/IT : aucune réplication des instances applicatives
● UK/CA : réplication partielle
● US : application containerisée mais base non redondante
Charge maximale sans dégradation :
● FR/DE/ES/IT : ≈ 150 requêtes / seconde
● UK : ≈ 250 req/s
● CA : ≈ 300 req/s
● US : ≈ 350 req/s
Taux d’erreur lors des pics de trafi c saisonniers (ex : vacances) :
● FR/DE/ES/IT : jusqu’à 4 % d’erreurs
● UK/CA : 1,5 %
● US : 0,8 %
Backups :
● FR/DE/ES/IT : backups manuels, fréquence de 1 × / jour, restauration non testée
● UK/CA : snapshots quotidiens AWS, pas de tests réguliers
● US : sauvegardes Azure automatisées, test de restauration tous les 90 jours