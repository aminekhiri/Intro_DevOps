# Intro_DevOps

# TP1

## Pour lancer les services à la main

Pour le service B : PORT=9091 node service_b.js

Pour le service A : SERVICE_B_URL=http://localhost:9091/api/data node service_a.js

Je mets le numéro de port dès l'appel parce que j'ai une variable générique dans le code qui s'apelle "port"

Sans Docker les deux services ne peuvent pas écouter sur le meme port. Donc temporairemet on les met sur des ports différents.

C'est grace au docker qu'on peut permettre aux services d'écouter sur le meme port parce que les deux services sont dans des conteneurs différents. Chaque conteneur a un environnement réseau différent, une différente ip. Finalement l'un n'interfère pas l'autre. 

## Justification du non-root

On a ajouté dans les dockerfiles USER node pour faire du non-root. Sinon, docker execute le code dans le conteneur avec le compte admin/root. Si une faille est trouvée, l'attaquant peut avoir accès complet au conteneur et peut meme accéder à la machine physique. 

Quand on enleve le USER node, une commande comme :

`docker-compose exec service-b touch /etc/pirate.txt`

Cette commande peut passer silencieusement. Alors que si on est en non-root la permission est refusée. 