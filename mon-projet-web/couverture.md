# Rapport de couverture des tests unitaires

Date du contrôle : 2026-05-01
Projet : `mon-projet-web`

## Résumé global

- **auth-service** : couverture globale **84.04% lignes**, **71.43% branches**, **100% fonctions**
- **chat-service** : couverture globale **94.90% lignes**, **80.77% branches**, **89.47% fonctions**
- **product-service** : couverture totale **97%**

---

## 1) auth-service

Commande exécutée :

```bash
node --test --experimental-test-coverage test/auth.test.js
```

Résultats :

- Tests : **3/3** OK
- Couverture :
  - `src/app.js` : **76.92% lignes**, **60.00% branches**, **100% fonctions**
  - `test/auth.test.js` : **100%**
  - Total : **84.04% lignes**, **71.43% branches**, **100% fonctions**
- Lignes non couvertes dans `src/app.js` : `24-25`, `49-61`

---

## 2) chat-service

Commande exécutée :

```bash
node --test --experimental-test-coverage test/chat.test.js
```

Résultats :

- Tests : **4/4** OK
- Couverture :
  - `src/app.js` : **92.08% lignes**, **70.59% branches**, **81.82% fonctions**
  - `test/chat.test.js` : **100%**
  - Total : **94.90% lignes**, **80.77% branches**, **89.47% fonctions**
- Lignes non couvertes dans `src/app.js` : `46-47`, `53-54`, `61-62`, `88-89`

---

## 3) product-service

Commandes exécutées :

```bash
.venv/bin/pip install coverage
.venv/bin/python -m coverage run -m unittest discover -s tests -v
.venv/bin/python -m coverage report -m
```

Résultats :

- Tests : **3/3** OK
- Couverture :
  - `src/main.py` : **100%**
  - `tests/test_main.py` : **96%** (ligne non couverte : `34`)
  - Total : **97%**

---

## Observations

- L’état général de couverture est bon.
- Les principaux axes d’amélioration concernent :
  - les branches non couvertes d’`auth-service/src/app.js`,
  - certains cas d’erreur/validation non testés dans `chat-service/src/app.js`.
