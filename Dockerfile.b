# ---- Étape 1 : Builder (Construction) ----
# On utilise une image de base figée et légère (Alpine)
FROM node:22-alpine AS builder
WORKDIR /app

# Copie uniquement des fichiers de dépendances pour optimiser le cache Docker
COPY package.json ./
# (Optionnel : COPY package-lock.json ./)

RUN npm install

# Copie du code source
COPY service_b.js ./

# ---- Étape 2 : Runner (Exécution) ----
# On repart d'une image propre et vierge
FROM node:22-alpine
WORKDIR /app

# On change le propriétaire du dossier de travail
RUN chown -R node:node /app

USER node 
# On passe sur l'utilisateur non-root "node" (intégré par défaut)

# On récupère uniquement le résultat de l'étape de build
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/service_b.js ./

# Déclaration du port
EXPOSE 9090

# Commande de démarrage
CMD ["node", "service_b.js"]



# Le miunimum pour le dockerfile c'est :
    #FROM node:22
    #WORKDIR /app
    #COPY . .
    #RUN npm install
    #CMD ["node", "service_b.js"]