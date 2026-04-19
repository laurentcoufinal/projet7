Vous développez une preuve de concept (PoC) afin de valider la faisabilité de l’architecture. Cette PoC se focalise uniquement sur une fonctionnalité—la fonctionnalité de tchat—afin que limite son périmètre.

Prérequis

avoir finalisé la proposition d’architecture.
Résultat attendu

La preuve de concept de la fonctionnalité de tchat démontre la viabilité des choix architecturaux.
Recommandations

stack : 
Micro-frontend Module Federation (via @angular-architects/module-federation)
API Gateway
Redis :sert de "pont" (via son mécanisme Pub/Sub) pour synchroniser les messages Node.js + Socket.io + Redis

V1:
la page generale du site est statique pour tester le poc mais devellopée selon l'architecture microservice
page accuiell figma :https://www.figma.com/design/AFzOH4GK3YGrDmL7GhYSZz/Sans-titre?node-id=1-2&m=dev
plus une page dedié au service client qui apparait apres le log du service client: liste des chats initées par les clients avec le nom du client+le message du chat + heure d'envoi. filtre et classement. choisir un message pour ce connecter a la page client et commencer le chat (meme style que le chat client).
V2:
Chatbot
un fichier .drawio avec les etapes+le texte+type affichage(question,bouton,lien)+lien entre etapes selon reponse.
lien faq
lien page voiture
lien connection chat humain

