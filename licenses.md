# Audit des licences

Ce rapport est généré à partir des dépendances installées par `npm ci`.
Il inclut les dépendances de production directes et transitives.

Commande :

```bash
npm run audit:licenses
```

La CI et le build Docker exécutent cette commande. L'audit échoue si une
licence est absente de la whitelist ou si une licence GPL, AGPL ou LGPL est
détectée.

## Résumé du scan

| Licence | Nombre de paquets | Décision |
|---|---:|---|
| MIT | 80 | Acceptée |
| Apache-2.0 | 2 | Acceptée |
| ISC | 6 | Acceptée |
| BSD-3-Clause | 1 | Acceptée |

Total audité : **89 paquets**.

Le rapport brut complet est disponible dans
[licenses.json](./licenses.json). Il est régénéré par `npm run audit:licenses`
et doit être relu après chaque modification de dépendance.
