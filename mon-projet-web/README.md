# PoC V1 - Plateforme de location (chat focal)

Ce monorepo implemente la V1 du PoC avec une architecture microservices et une fonctionnalite chat temps reel.

## Contenu

- `frontend/`: application Angular (Accueil, Chat client, Espace agent).
- `microservices/auth-service/`: login mock client/agent + profil.
- `microservices/product-service/`: catalogue minimal de voitures + FAQ (10 Q/R).
- `microservices/chat-service/`: API chat + Socket.io + Redis Pub/Sub.
- `gateway/nginx.conf`: API Gateway (proxy HTTP + WebSocket).
- `docker-compose.yml`: orchestration locale.

## Prerequis

- Docker + Docker Compose.

## Variables et secrets

Les secrets sont ajoutes manuellement dans votre environnement local ou dans un fichier `.env` non versionne.

Variables utilisees:

- `JWT_SECRET`: secret signe JWT pour `auth-service`.

Exemple:

```bash
export JWT_SECRET="votre-secret-local"
```

ou fichier `.env`:

```bash
JWT_SECRET=votre-secret-local
```

## Demarrage local

Depuis `mon-projet-web/`:

```bash
docker compose up --build
```

Acces:

- App via gateway: [http://localhost:8081](http://localhost:8081)
- Health auth: [http://localhost:8081/api/auth/health](http://localhost:8081/api/auth/health)
- Cars: [http://localhost:8081/api/products/cars](http://localhost:8081/api/products/cars)
- FAQ: [http://localhost:8081/api/products/faq](http://localhost:8081/api/products/faq)

## Comptes de demo

- Client: `client` / `client123`
- Agent: `agent` / `agent123`

## Tests unitaires par microservice

Les tests peuvent etre lances independamment, service par service:

### Auth service

```bash
cd microservices/auth-service
npm install
npm test
```

### Product service

```bash
cd microservices/product-service
make install
make test
```

### Chat service

```bash
cd microservices/chat-service
npm install
npm test
```

## Tests E2E

Le test E2E valide le flux complet via la gateway: auth, profile, catalogue, FAQ, creation session chat et persistance message.

```bash
cd mon-projet-web
./e2e/run-e2e.sh
```

## Scenarios de validation V1

1. Ouvrir `Chat client`, saisir un nom, creer une session, envoyer des messages.
2. Ouvrir `Service client`, visualiser la liste des sessions avec tri/filtre.
3. Selectionner une session cote agent et repondre.
4. Verifier la reception temps reel des messages des deux cotes.
