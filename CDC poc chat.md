Vous développez une preuve de concept (PoC) afin de valider la faisabilité de l’architecture. Cette PoC se focalise uniquement sur une fonctionnalité—la fonctionnalité de tchat—afin que limite son périmètre.

La preuve de concept de la fonctionnalité de tchat démontre la viabilité des choix architecturaux.
Recommandations.

stack : 
selon architecture, peupler une base minimale de voiture de location (france, principales ville avec aeroport), faq minimale(10 question reponses).
Micro-frontend Module Federation (via @angular-architects/module-federation).
API Gateway.
chat:Redis sert de "pont" (via son mécanisme Pub/Sub) pour synchroniser les messages Node.js + Socket.io + Redis.
---
V1:
la page generale du site est statique pour tester le poc mais devellopée selon l'architecture microservice
page acceuil figma :https://www.figma.com/design/AFzOH4GK3YGrDmL7GhYSZz/Sans-titre?node-id=1-2&m=dev
mon-projet-web/
├── microservices/
│   ├── auth-service/           # Service d'authentification (Node.js)
│   │   ├── src/
│   │   ├── Dockerfile          # Construction de l'image du service Auth
│   │   └── package.json
│   ├── product-service/        # Service Catalogue (Python ou Java)
│   │   ├── src/
│   │   ├── Dockerfile          # Construction de l'image du service Produit
│   │   └── requirements.txt
├── frontend/                   # Votre application Angular
│   ├── src/
│   ├── Dockerfile              # Pour servir l'app Angular via Nginx
│   └── angular.json
├── gateway/                    # L'API Gateway (ex: Nginx ou Kong)
│   └── nginx.conf
├── docker-compose.yml          # LE fichier chef d'orchestre
└── README.md
page chat sur page acceuil
page dedié au service client qui apparait apres le log du service client: liste des chats initées par les clients avec le nom du client+le message du chat + heure d'envoi. filtre et classement. choisir un message pour ce connecter a la page client et commencer le chat (meme style que le chat client).
---
V2:
Chatbot
un fichier .yaml ou en base qui est generer a partir d'un schema .drawio avec les etapes+le texte+type affichage(question,bouton,lien)+lien entre etapes selon reponse.
api reponses faq
liens pages site
lien connection humain
---
devops CI/CD
monorepo
generer les fichiers
github, gitaction,terraform,argocd, aws, S3(terraform state)
les secret seront ajoute manuellement (fichier README.md procedure pour ajouter les secrets)
mon-projet/
├── .github/workflows/
│   ├── bootstrap.yml  (S'occupe du S3)
│   ├── infra.yml      (S'occupe de l'EC2/EKS)
│   └── app.yml        (S'occupe du déploiement Docker/ArgoCD)
├── 01-bootstrap/      (Code Terraform pour le S3)
├── 02-infra/          (Code Terraform pour le serveur)
└── 03-app/            (Code pour ton application + manifests ArgoCD)

📁 .github/
   └── 📁 workflows/
       ├── 📄 01-bootstrap.yml  <-- Gère le dossier /01-bootstrap
       ├── 📄 02-infra.yml      <-- Gère le dossier /02-infra
       └── 📄 03-app.yml        <-- Gère le dossier /03-app
📁 01-bootstrap/
   └── 📄 main.tf
📁 02-infra/
   └── 📄 main.tf
📁 03-app/
   ├── 📄 Dockerfile
   └── 📄 index.html
---
ne fait que la V1, la V2 servira plus tard pour valider le pipeline CI/CD d'ajout de fonctionnalité.
