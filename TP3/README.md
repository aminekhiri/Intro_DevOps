# TP3 : Industrialiser le pipeline CI/CD

Petite API Express déployée sur Kubernetes avec Helm par le pipeline [`.gitlab-ci.yml`](.gitlab-ci.yml)
(inclus par le `.gitlab-ci.yml` racine).

## Pipeline

`lint → test → build → scan → deploy`

- **lint** : ESLint, quelques secondes. S'il échoue, rien d'autre ne tourne (fail fast).
- **test** : Jest avec couverture et rapport JUnit.
- **build** : image taguée `$CI_COMMIT_SHA`, poussée dans le registre GitLab.
- **scan** : `trivy image`, le pipeline casse sur une vulnérabilité HIGH ou CRITICAL.
- **deploy** : `deploy-staging` se lance automatiquement depuis `main`. `deploy-prod` se lance sur un tag, en manuel.

## Déploiement rolling

Le Deployment utilise `RollingUpdate` avec `maxSurge: 1` et `maxUnavailable: 0`. Un nouveau pod doit
passer sa readinessProbe (`/health`) avant qu'un ancien pod soit supprimé : il n'y a pas de coupure.

## Rollback

- **Automatique** : `helm upgrade --atomic`. Si les nouveaux pods ne deviennent pas prêts en 3 min,
  Helm revient tout seul à la version précédente.
- **Manuel** :
  ```bash
  helm history tp3-api -n tp3-staging        # lister les révisions
  helm rollback tp3-api -n tp3-staging       # revenir à la révision précédente
  helm rollback tp3-api 3 -n tp3-staging     # revenir à la révision 3
  ```
  On peut aussi passer par GitLab : *Operate > Environments > staging*, puis **Re-deploy** sur un ancien déploiement.

## Environnements et secrets

- **staging** : namespace `tp3-staging`, fichier `values-staging.yaml`.
- **production** : namespace `tp3-prod`, fichier `values-prod.yaml`.

Aucun secret n'est écrit dans le YAML. Ils sont tous dans *Settings > CI/CD > Variables* :

| Variable | Type | Scope |
|---|---|---|
| `KUBECONFIG` | File, Protected | une variable pour `staging`, une pour `production` |
| `APP_API_KEY` | Masked, Protected | une variable pour `staging`, une pour `production` |

`CI_REGISTRY_*` sont fournies automatiquement par GitLab. Pour que le cluster puisse télécharger l'image,
il faut créer un deploy token nommé `gitlab-deploy-token` (scope `read_registry`). GitLab fournit alors
`CI_DEPLOY_USER` et `CI_DEPLOY_PASSWORD`.
