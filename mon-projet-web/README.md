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

- `JWT_SECRET` : meme secret pour `auth-service` et `chat-service` (signature JWT). Minimum 16 caracteres recommande ; en CI GitHub le secret du meme nom est **obligatoire** (pas de valeur par defaut).
- `ALLOWED_ORIGINS` : origines CORS autorisees pour auth et chat, separees par des virgules (defaut local : `http://localhost:8081,http://localhost:4200`). Sur AWS, le script Terraform derive automatiquement les origines depuis les metadonnees de l’instance.

Exemple:

```bash
export JWT_SECRET="votre-secret-local-long"
export ALLOWED_ORIGINS="http://localhost:8081,http://localhost:4200"
```

ou fichier `.env`:

```bash
JWT_SECRET=votre-secret-local-long
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:4200
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

## Secrets GitHub pour le CD

Cette section liste les secrets et variables a configurer dans GitHub Actions pour un pipeline CD avec AWS, DockerHub, Terraform et ArgoCD.

### DockerHub

- `DOCKERHUB_USERNAME`
  - Type: `Variable` (non sensible)
  - Portee: repository ou environment (`dev`, `prod`)
  - Role: nom d utilisateur DockerHub pour `docker login` et push d images
- `DOCKERHUB_TOKEN`
  - Type: `Secret`
  - Portee: environment recommande
  - Role: token DockerHub (preferer un access token limite)

Exemple workflow:

```yaml
- name: Login DockerHub
  uses: docker/login-action@v3
  with:
    username: ${{ vars.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

### CI tests (auth / chat)

- `JWT_SECRET`
  - Type: `Secret`
  - Portee: repository
  - Role: cle partagee par les tests Node ; **obligatoire**, au moins 16 caracteres (voir etape `Verifier secret JWT CI` du workflow).

### AWS (OIDC recommande)

- `AWS_ROLE_TO_ASSUME`
  - Type: `Secret` (ou Variable si vous considerez la valeur non sensible)
  - Portee: environment recommande
  - Role: ARN du role IAM assume par GitHub Actions (OIDC)
- `AWS_REGION`
  - Type: `Variable`
  - Portee: repository ou environment
  - Role: region AWS cible (`eu-west-3`, etc.)

Exemple workflow:

```yaml
permissions:
  id-token: write
  contents: read

- name: Configure AWS credentials (OIDC)
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
    aws-region: ${{ vars.AWS_REGION }}
```

### AWS (fallback cles statiques)

- `AWS_ACCESS_KEY_ID`
  - Type: `Secret`
  - Portee: environment uniquement
  - Role: cle d acces IAM
- `AWS_SECRET_ACCESS_KEY`
  - Type: `Secret`
  - Portee: environment uniquement
  - Role: secret IAM associe
- `AWS_REGION`
  - Type: `Variable`
  - Portee: repository ou environment
  - Role: region AWS cible

Exemple workflow:

```yaml
- name: Configure AWS credentials (static keys)
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ vars.AWS_REGION }}
```

### Terraform state S3 et variables sensibles

- `TF_STATE_BUCKET`
  - Type: `Variable`
  - Portee: repository ou environment
  - Role: bucket S3 du state Terraform
- `TF_STATE_KEY`
  - Type: `Variable`
  - Portee: environment recommande
  - Role: chemin du fichier state (`projet7/dev/terraform.tfstate`, etc.)
- `TF_STATE_REGION`
  - Type: `Variable`
  - Portee: repository ou environment
  - Role: region du bucket state
- `TF_VAR_*` sensibles (exemples)
  - `TF_VAR_db_password`, `TF_VAR_argocd_token`, `TF_VAR_private_subnet_ids`
  - Type: `Secret`
  - Portee: environment
  - Role: injection des variables Terraform sensibles sans les versionner

Exemple workflow:

```yaml
- name: Terraform init
  run: |
    terraform init \
      -backend-config="bucket=${TF_STATE_BUCKET}" \
      -backend-config="key=${TF_STATE_KEY}" \
      -backend-config="region=${TF_STATE_REGION}"
  env:
    TF_STATE_BUCKET: ${{ vars.TF_STATE_BUCKET }}
    TF_STATE_KEY: ${{ vars.TF_STATE_KEY }}
    TF_STATE_REGION: ${{ vars.TF_STATE_REGION }}
    TF_VAR_db_password: ${{ secrets.TF_VAR_db_password }}
```

### ArgoCD

- `ARGOCD_SERVER`
  - Type: `Variable`
  - Portee: environment
  - Role: URL/API server ArgoCD
- `ARGOCD_AUTH_TOKEN`
  - Type: `Secret`
  - Portee: environment
  - Role: token API ArgoCD (compte robot/service account)
- `ARGOCD_PROJECT`
  - Type: `Variable`
  - Portee: environment
  - Role: projet ArgoCD cible
- `ARGOCD_APP_NAME`
  - Type: `Variable`
  - Portee: environment
  - Role: application ArgoCD a synchroniser

Exemple workflow:

```yaml
- name: Sync ArgoCD app
  run: |
    argocd login "${ARGOCD_SERVER}" --auth-token "${ARGOCD_AUTH_TOKEN}" --insecure
    argocd app sync "${ARGOCD_APP_NAME}" --project "${ARGOCD_PROJECT}"
  env:
    ARGOCD_SERVER: ${{ vars.ARGOCD_SERVER }}
    ARGOCD_AUTH_TOKEN: ${{ secrets.ARGOCD_AUTH_TOKEN }}
    ARGOCD_PROJECT: ${{ vars.ARGOCD_PROJECT }}
    ARGOCD_APP_NAME: ${{ vars.ARGOCD_APP_NAME }}
```

### Procedure d ajout dans GitHub

1. Ouvrir le repository GitHub.
2. Aller dans `Settings > Secrets and variables > Actions`.
3. Ajouter les valeurs non sensibles dans `Variables`.
4. Ajouter les valeurs sensibles dans `Secrets`.
5. Creer des `Environments` (`dev`, `staging`, `prod`) et y placer les secrets de deploiement.
6. Dans les workflows, cibler l environment pour recuperer les bons secrets selon la branche.

### Bonnes pratiques

- Preferer OIDC pour AWS et eviter les cles statiques longue duree.
- Appliquer le principe du moindre privilege sur les roles IAM, tokens DockerHub et ArgoCD.
- Isoler les secrets par environment (`dev` != `prod`).
- Rotater regulierement tous les secrets/tokens.
- Ne jamais afficher les secrets dans les logs (`echo` interdit).
- Conserver en `Variables` uniquement les donnees non sensibles.
- Ajouter des protections GitHub Environment (reviewers/approvals) pour la prod.

## Scenarios de validation V1

1. Ouvrir `Chat client`, saisir un nom, creer une session, envoyer des messages.
2. Ouvrir `Service client`, visualiser la liste des sessions avec tri/filtre.
3. Selectionner une session cote agent et repondre.
4. Verifier la reception temps reel des messages des deux cotes.
