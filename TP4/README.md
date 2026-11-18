# TP4 : Observabilité, sécurité et reprise après incident

API Express (reprise du TP3) déployée avec Helm par [`.gitlab-ci.yml`](.gitlab-ci.yml)
(inclus par le `.gitlab-ci.yml` racine).

## 1. Logs

[`src/logger.js`](src/logger.js) utilise **pino** : du JSON sur `stdout`, avec les niveaux `info`, `warn` et `error`.
Il n'y a plus de `console.log`. `pino-http` journalise chaque requête : `info` pour une 2xx, `warn` pour une 4xx, `error` pour une 5xx.
Chaque requête reçoit un **`trace_id`**, repris du header `x-trace-id` s'il est fourni et sinon généré.
Il est aussi renvoyé dans la réponse.

```json
{"level":"info","time":"2026-11-18T15:22:56.427Z","service":"tp4-api","trace_id":"abc123","req":{"method":"GET","url":"/api/data"},"res":{"statusCode":200},"responseTime":14,"msg":"request completed"}
```

## 2. Métriques

`/metrics` expose les métriques au format Prometheus ([`src/metrics.js`](src/metrics.js)) :
- `http_requests_total{method,route,status}` sert pour le **R**ate et les **E**rrors.
- `http_request_duration_seconds` (un histogramme) sert pour la **D**uration.

Pour installer Prometheus et Grafana sur le cluster :
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace \
  --set prometheusOperator.admissionWebhooks.enabled=false --set prometheusOperator.tls.enabled=false
kubectl -n monitoring port-forward svc/monitoring-grafana 3000:80   # http://localhost:3000, user admin
kubectl -n monitoring get secret monitoring-grafana -o jsonpath='{.data.admin-password}' | base64 -d   # mot de passe
```
Le webhook d'admission est désactivé : il est optionnel (il ne fait que valider les objets Prometheus) et son job échouait sur notre k3s.

Le chart de l'app ajoute trois objets :
- un `ServiceMonitor`, pour que Prometheus scrape `/metrics` ;
- une `PrometheusRule`, qui contient l'alerte ;
- une ConfigMap `grafana_dashboard`, qui charge automatiquement le dashboard **RED** ([`dashboards/red.json`](helm/tp4-api/dashboards/red.json)).

## 3. SLI / SLO

| | |
|---|---|
| **SLI** | part des requêtes HTTP qui ne sont pas des 5xx : `1 - (5xx / total)` |
| **SLO** | 99 % de requêtes sans erreur, sur 30 jours glissants |
| **Error budget** | 1 % des requêtes, soit environ **7 h 12 min** d'indisponibilité totale par mois |
| **Alerte** | `TP4ApiHighErrorRate` : le taux de 5xx dépasse 14,4 % pendant 2 min |

Le seuil de 14,4 % correspond à un burn rate de 14,4 : à ce rythme, on consomme 2 % du budget mensuel en une heure,
et tout le budget en environ 2 jours. Il faut donc agir tout de suite.
Une petite erreur isolée ne déclenche rien, pour éviter le bruit. L'annotation `runbook_url` de l'alerte pointe vers le runbook ci-dessous.

### Runbook : TP4ApiHighErrorRate

1. Ouvrir le dashboard Grafana **TP4 API - RED** : vérifier depuis quand les erreurs montent.
2. Regarder les logs d'erreur :
   ```bash
   kubectl logs -n tp4-staging -l app.kubernetes.io/name=tp4-api | grep '"level":"error"'
   ```
   Le `trace_id` permet de suivre une requête précise.
3. Si le pic coïncide avec un déploiement, faire un **rollback** (voir section 5).
4. Sinon, regarder `kubectl get pods -n tp4-staging` et `kubectl describe pod ...` (redémarrages, OOM, etc.).

## 4. Sécurité (DevSecOps)

| Contrôle | Où |
|---|---|
| **SCA** (dépendances npm) | job `tp4-sca` : `trivy fs`, échoue sur HIGH/CRITICAL |
| **Scan d'image** | job `tp4-scan` : `trivy image`, échoue sur HIGH/CRITICAL |
| **Secrets dans le code** | job `tp4-gitleaks` sur tout l'historique, plus le hook pre-commit [`../.pre-commit-config.yaml`](../.pre-commit-config.yaml) |

Pour activer le hook en local : `pip install pre-commit && pre-commit install`.
Ensuite, un commit qui contient un secret est bloqué avant même d'arriver dans le dépôt.

**Gestion des secrets.** `APP_API_KEY` et `KUBECONFIG` sont des variables CI *protected* et *masked*, définies séparément pour staging et pour production.
Le pipeline les injecte dans un **Secret Kubernetes** (`templates/secret.yaml`), que l'app lit en variable d'environnement.
Aucun secret n'est écrit dans le dépôt.

**Contrôle d'accès (OWASP A01 – Broken Access Control).** On applique le moindre privilège :
- `/metrics` n'est exposé que dans le cluster (Service `ClusterIP`, pas d'Ingress). Ces métriques révèlent le fonctionnement interne de l'app et ne doivent pas être publiques.
- La kubeconfig de la CI ne doit donner accès qu'aux namespaces `tp4-*`, avec un Role ou RoleBinding et non `cluster-admin`.
- L'environnement `production` est protégé dans GitLab : seuls les Maintainers peuvent lancer `tp4-deploy-prod`.

## 5. Reprise après incident

Comment la chaîne détecte un commit cassé :
- **Le code ne passe plus le lint ou les tests** : le pipeline passe au rouge et rien n'est déployé.
- **L'app ne démarre plus**, ou `/health` ne répond plus : `helm --atomic` annule le déploiement tout seul, et le job passe au rouge.
- **L'app tourne mais renvoie des 5xx** : l'alerte `TP4ApiHighErrorRate` se déclenche environ 2 minutes après.

### Procédure de rollback (une commande, sans réécrire l'historique)

```bash
git revert --no-edit <sha_du_commit_cassé> && git push
```

`git revert` crée un **nouveau** commit qui annule le commit cassé. L'historique reste intact : pas de `reset` ni de `push --force`.
Le push relance le pipeline, qui redéploie la version saine.

Si on ne peut pas attendre le pipeline, on peut d'abord revenir à la version précédente directement sur le cluster :
```bash
helm rollback tp4-api -n tp4-staging
```
Il faut quand même faire le `git revert` ensuite. Sinon, le prochain push redéploie le code cassé.

### Chronométrage

À remplir le jour de l'exercice :

| Étape | Heure | Durée |
|---|---|---|
| Push du commit cassé | | |
| Détection (pipeline rouge / alerte) | | |
| `git revert` poussé | | |
| Pipeline vert, version saine en ligne | | |
| **Total** | | |

## 6. Review

- Dans *Manage > Members*, inviter l'enseignant en rôle **Developer**. Il lui faut des droits d'écriture pour pousser le commit cassé.
- Ouvrir une issue **« Demande de review »** qui le mentionne, avec le lien du dépôt et des tags.
