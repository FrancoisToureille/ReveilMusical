# TP — Réveil musical - François TOUREILLE

## 1. Présentation du sujet

L'objectif de ce TP est de réaliser le service de déclenchement d'un réveil musical.
À partir d'un identifiant utilisateur, d'un jour de la semaine et de la météo du
jour, le service :

1. récupère les préférences de l'utilisateur ;
2. choisit un morceau adapté ;
3. recherche les informations de ce morceau auprès d'un fournisseur musical ;
4. utilise un morceau local de secours si nécessaire ;
5. envoie une notification sur le canal préféré de l'utilisateur.

L'ordonnancement n'est pas traité dans ce TP. Le point d'entrée est l'appel
`POST /wake-up`.

Les contraintes principales sont :

- pouvoir changer de fournisseur musical sans modifier le métier ;
- pouvoir ajouter ou changer un canal de notification ;
- ne pas bloquer le réveil en cas de panne externe ;
- contrôler les dépendances utilisées ;
- fournir des tests et une exécution reproductible avec Docker.

## 2. Choix techniques

Le projet est réalisé en TypeScript avec Node.js et Express.
L'assemblage des dépendances est réalisé avec Awilix.
Les entrées HTTP sont validées avec Zod.
Les tests sont écrits avec Vitest.

Le projet est volontairement organisé en ports et adaptateurs :

```text
HTTP
  |
  v
Cas d'utilisation TriggerWakeUp
  |
  +--> UserProfileProvider
  +--> MusicProvider
  +--> SongFallback
  +--> Notification
          |
          +--> email
          +--> SMS
          +--> push
```

Le domaine ne dépend ni d'Express, ni de `fetch`, ni d'iTunes, ni de
MusicBrainz.

## 3. Organisation du projet

```text
src/
├── domain/
│   ├── models.ts              # Modèles métier et types
│   └── ports.ts               # Interfaces utilisées par le métier
├── application/
│   ├── trigger-wake-up.ts     # Cas d'utilisation principal
│   └── cached-music-provider.ts
├── adapters/
│   ├── inbound/http/          # Adaptateur HTTP Express
│   └── outbound/
│       ├── music/              # iTunes, MusicBrainz et fallback local
│       ├── notification/       # Mocks email, SMS, push et fallback
│       └── profile/            # Profil utilisateur simulé
├── composition/
│   └── container.ts            # Composition root Awilix
└── main.ts                     # Démarrage de l'application
```

## 4. Fonctionnement du cas d'utilisation

Le profil utilisateur de démonstration contient un exemple pour chacun des
sept jours. Les morceaux de la liste locale de secours couvrent également
plusieurs situations. Ces données sont des fixtures de TP : dans une vraie
application, elles viendraient d'un stockage utilisateur.

Le profil utilisateur contient :

- des morceaux associés à un couple jour/météo ;
- des morceaux associés uniquement à une météo ;
- un morceau de secours ;
- un canal de notification préféré.

La recherche est effectuée dans l'ordre suivant :

1. morceau correspondant au jour et à la météo ;
2. morceau correspondant uniquement à la météo ;
3. morceau de secours du profil ;
4. morceau de la liste locale si le fournisseur musical est indisponible.

Les types de météo acceptés sont :

```text
SOLEIL, PLUIE, NEIGE, NUAGEUX
```

Les jours acceptés sont :

```text
LUNDI, MARDI, MERCREDI, JEUDI, VENDREDI, SAMEDI, DIMANCHE
```

## 5. Fournisseurs musicaux

Deux fournisseurs sont disponibles :

- iTunes Search API ;
- MusicBrainz.

Le choix se fait par configuration :

```env
MUSIC_PROVIDER=itunes
```

ou :

```env
MUSIC_PROVIDER=musicbrainz
```

L'adaptateur iTunes convertit les champs propres à iTunes (`trackName`,
`artistName`, `trackViewUrl`) vers le modèle métier `Song`.
Ces détails ne sont donc pas visibles par le cas d'utilisation.

L'adaptateur MusicBrainz envoie un `User-Agent` identifiable, comme demandé par
l'API :

```env
MUSICBRAINZ_USER_AGENT=ReveilMusical/1.0 votre.email@ecole.fr
```

Les recherches sont mises en cache par morceau afin de limiter les appels
réseau et de respecter la limitation annoncée pour iTunes.

## 6. Notifications

Les envois réels ne sont pas nécessaires pour ce TP. Trois mocks sont donc
utilisés :

- email ;
- SMS ;
- notification push.

Chaque mock écrit le message dans la sortie standard. Le métier utilise
uniquement l'interface commune `Notification`.

Si le canal préféré échoue, une notification locale de secours est utilisée.
Le service ne reste donc pas silencieux en cas de panne du canal principal.

### Mode test

Le mode `mock` est le mode utilisé pour le TP. Les classes
`EmailNotification`, `SmsNotification` et `PushNotification` n'appellent aucun
service externe : elles écrivent seulement dans les logs du conteneur Docker.

Le mode est explicite dans `.env` :

```env
NOTIFICATION_MODE=mock
```

La valeur `mock` est également la valeur par défaut de Docker. Une structure
de production existe avec `NOTIFICATION_MODE=prod` et des adaptateurs séparés,
mais leurs appels fournisseurs sont volontairement marqués « à implémenter ».
Ils échouent explicitement tant qu'aucun fournisseur, secret et format de
requête n'a été configuré : aucun faux succès n'est produit.

Pour préparer ce mode :

```env
NOTIFICATION_MODE=prod
```

Les adaptateurs concernés sont dans
`src/adapters/outbound/notification/production.ts`. Il faudra y brancher les
fournisseurs choisis (par exemple SMTP/Resend pour l'email, Twilio pour le SMS
et Firebase Cloud Messaging pour le push), puis déplacer leurs secrets dans
des variables d'environnement ou un gestionnaire de secrets.

Pour observer les notifications simulées :

```bash
sg docker -c 'docker compose up'
```

Les lignes `[email]`, `[sms]` ou `[push]` apparaissent dans les logs Docker.

Pour tester le mode dégradé sans couper l'accès HTTP du conteneur, configure
temporairement une URL musicale inaccessible :

```bash
sg docker -c 'docker rm -f trusting_cray 2>/dev/null || true'
sg docker -c 'ITUNES_BASE_URL=http://127.0.0.1:9/search docker compose up'
```

L'API reste alors accessible sur `http://localhost:3000`, mais l'appel musical
échoue et la réponse contient `"degraded": true`. Pour revenir au mode normal,
arrêter le service puis relancer `docker compose up` sans cette variable.

## 7. Design patterns utilisés

### Adapter

Les adaptateurs iTunes et MusicBrainz transforment les réponses externes en
objets du domaine. Les mocks de notification jouent également le rôle
d'adaptateurs entre leurs signatures propres et l'interface `Notification`.

### Boundary / Ports and Adapters

Les interfaces de [src/domain/ports.ts](./src/domain/ports.ts) définissent les
frontières entre le métier et les détails techniques. Le métier dépend de ces
ports et non des fournisseurs concrets.

### Facade / Application Service

`TriggerWakeUp` fournit un point d'entrée unique pour le déclenchement d'un
réveil. Il orchestre les différentes étapes sans exposer leur complexité à
l'adaptateur HTTP.

### Factory / Composition Root

`createApplicationContainer` constitue la composition root. Awilix y assemble
les objets et injecte leurs dépendances. Il n'y a pas de création manuelle de
fournisseur dans le cas d'utilisation.

### Decorator

`CachedMusicProvider` ajoute le cache autour d'un `MusicProvider` sans modifier
les adaptateurs iTunes ou MusicBrainz.

Le cache mémoire utilise un TTL configurable avec `MUSIC_CACHE_TTL_MS`
(300000 ms, soit 5 minutes, par défaut). Son expiration est testée sans
dépendre de l'horloge réelle.

### Fallback de résilience

Le fallback musical local et le fallback de notification permettent de
continuer le traitement en mode dégradé.

## 8. Injection de dépendances et limitation de `new`

Le cas d'utilisation reçoit ses dépendances dans son constructeur :

```ts
constructor(
  userProfileProvider,
  musicProvider,
  songFallback,
  notifications
)
```

Les classes concrètes sont enregistrées dans Awilix et ne sont pas instanciées
dans le code métier. Les occurrences de `new` dans les tests servent uniquement
à tester directement les classes. Le `new Map()` du cache correspond à une
structure technique interne et non à une dépendance métier.

## 9. Lancement avec Docker

Toutes les dépendances, les tests, l'audit des licences et la compilation sont
exécutés dans Docker. Il n'est pas nécessaire d'installer Node.js, npm ou
`node_modules` sur la machine hôte.

Après avoir cloné le dépôt, le lancement ne nécessite aucun fichier
supplémentaire ni aucune installation de dépendance :

```bash
cd ReveilMusical
sg docker -c 'docker compose up --build'
```

Compose fournit automatiquement les valeurs par défaut :

- fournisseur iTunes ;
- `NOTIFICATION_MODE=mock` ;
- User-Agent MusicBrainz de démonstration.

Il n'est donc pas nécessaire de créer un fichier `.env`. Le fichier
`.env.example` est uniquement fourni comme référence des variables
configurables ; il n'est requis ni pour lancer, ni pour tester, ni pour
compiler le projet.

Si la session Linux n'a pas encore rechargé le groupe Docker, `sg docker`
recharge temporairement l'appartenance au groupe. Après une reconnexion, la
commande peut être raccourcie en :

```bash
docker compose up --build
```

L'image exécute automatiquement les tests et la compilation pendant sa phase
de build :

```dockerfile
RUN npm test && npm run build
```

Arrêt du service :

```bash
sg docker -c 'docker compose down'
```

## 10. Appels HTTP

Vérification de santé :

```bash
curl --fail http://localhost:3000/health
```

Déclenchement d'un réveil :

```bash
curl -X POST http://localhost:3000/wake-up \
  -H 'content-type: application/json' \
  -d '{"userId":"user-1","day":"LUNDI","weather":"SOLEIL"}'
```

Exemple de réponse :

```json
{
  "userId": "user-1",
  "day": "LUNDI",
  "weather": "SOLEIL",
  "song": {
    "title": "Here Comes the Sun",
    "artist": "The Beatles"
  },
  "channel": "email",
  "degraded": true
}
```

La propriété `degraded` indique que le morceau local de secours a été utilisé.

## 10.1. Documentation OpenAPI et test manuel

Une documentation OpenAPI est disponible directement dans l'application :

- interface Swagger UI : [http://localhost:3000/docs](http://localhost:3000/docs) ;
- document OpenAPI JSON : [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json).

Swagger UI permet de tester `POST /wake-up` avec le bouton **Try it out**, sans
préparer manuellement une commande `curl`. Les valeurs possibles pour `day` et
`weather`, le format du corps et les réponses HTTP y sont documentés.

## 11. Tests et CI

La suite de tests vérifie notamment :

- le choix d'un morceau selon la météo ;
- le choix prioritaire selon le jour et la météo ;
- le fallback musical ;
- le cache des recherches ;
- le mapping de la réponse iTunes ;
- l'en-tête `User-Agent` de MusicBrainz ;
- le fallback de notification.

Lors du dernier build Docker :

```text
Test Files  3 passed
Tests       7 passed
TypeScript build: success
```

La CI GitHub Actions située dans
[.github/workflows/ci.yml](./.github/workflows/ci.yml) :

1. construit l'image Docker ;
2. exécute les tests et la compilation ;
3. démarre le conteneur ;
4. vérifie l'endpoint `/health` ;
5. arrête les conteneurs.

Il s'agit d'une CI de validation. Aucun déploiement automatique vers un
environnement de production n'est configuré dans ce TP.

## 12. Dépendances, licences et fraîcheur

Les versions installées sont verrouillées par
[package-lock.json](./package-lock.json).

L'inventaire des dépendances de production directes et transitives est généré
par `license-checker` dans [licenses.json](./licenses.json), avec son résumé
dans [licenses.md](./licenses.md). L'audit est lancé par :

```bash
npm run audit:licenses
```

Il est également exécuté pendant le build Docker et bloque la construction si
une licence inconnue, GPL, AGPL ou LGPL apparaît.

| Package | Version installée | Licence | Dernière version stable vérifiée | Utilisation |
|---|---:|---|---:|---|
| awilix | 13.0.5 | MIT | 13.0.5 | IoC et injection de dépendances |
| express | 5.2.1 | MIT | 5.2.1 | Serveur HTTP |
| swagger-ui-express | 5.0.1 | MIT | 5.0.1 | Documentation et test OpenAPI |
| zod | 4.6.5 | MIT | 4.6.5 | Validation des entrées |
| typescript | 7.0.2 | Apache-2.0 | 7.0.2 | Compilation |
| vitest | 5.0.3 | MIT | 5.0.3 | Tests unitaires |
| supertest | 7.3.1 | MIT | 7.3.1 | Tests HTTP |

La date de vérification des versions est le 08/10/2026.

`npm audit` signale des vulnérabilités transitives liées à Awilix et à
`fast-glob`/`micromatch`. La correction automatique proposée impose une
rétrogradation majeure d'Awilix. Cette situation est documentée et doit faire
l'objet d'une décision avant une mise en production. Les licences des
dépendances directes sont identifiées dans ce document.

## 13. Version mock : qualité et limites

Dans le cadre du TP, le profil utilisateur est simulé en mémoire et les
notifications sont des mocks. La version mock inclut déjà les améliorations réalisables sans infrastructure
externe :

- remplacer le profil en mémoire par un stockage réel ;
- métriques en mémoire pour les réveils, fallbacks et erreurs fournisseur ;
- journalisation structurée en JSON ;
- expiration TTL du cache mémoire ;
- audit automatisé des licences ;
- mesure de couverture avec seuil dans la CI ;
- tests de panne des fournisseurs et notifications.

La couverture est mesurée par Vitest avec des seuils minimum de 70 % pour les
instructions et les lignes, 60 % pour les branches et 50 % pour les fonctions.

Les éléments suivants restent réservés à une version de production :

- stockage utilisateur réel ;
- fournisseurs de notifications réels ;
- cache partagé comme Redis ;
- gestionnaire de secrets ;
- déploiement CD.

## 14. Bilan

Cette première version respecte les objectifs principaux du sujet :

- les fournisseurs sont interchangeables ;
- le métier est isolé des détails techniques ;
- les dépendances sont injectées ;
- les appels externes sont adaptés par des ports ;
- un mode dégradé empêche le silence ;
- les tests et la compilation sont exécutés dans Docker ;
- la CI vérifie la construction et la disponibilité du service.
