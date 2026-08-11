# Les tests du projet

Ce dossier contient la suite de tests automatisés du jeu. Elle vérifie rapidement les règles importantes sans devoir refaire toute une partie à la main : transitions entre niveaux, inventaire, objets, guide lumineux, sauvegardes, traductions, commandes, contenants, armes et compatibilité du mode debug.

Le fichier principal est [`run-tests.mjs`](run-tests.mjs).

## Pourquoi l’extension `.mjs` ?

`.mjs` signifie **JavaScript Module**. Cette extension indique directement à Node.js que le fichier utilise le système de modules JavaScript moderne :

```js
import { createItem } from "../js/systems/item-registry.js";
```

Cela permet d’importer les mêmes modules que le jeu sans ajouter de framework ni créer de `package.json` avec `"type": "module"`.

Un fichier `.mjs` peut également utiliser `await` directement au niveau principal. C’est utilisé à la fin de la suite pour tester le chargement facultatif du module debug.

## Prérequis

Installez une version récente de [Node.js](https://nodejs.org/). Node.js 18 ou plus récent est recommandé.

Vérifiez son installation depuis la racine du projet :

```bash
node --version
```

Les tests n’installent aucune dépendance et ne contactent aucun service externe. Le moteur Three.js nécessaire au test des objets est déjà présent dans `vendor/`.

## Lancer tous les tests

Placez-vous à la racine du dépôt, puis exécutez :

```bash
node tests/run-tests.mjs
```

Il n’est pas nécessaire de démarrer le serveur local pour cette commande.

Un test réussi produit une ligne de ce type :

```text
✓ sauvegarde v2 : instantané complet et aller-retour JSON
```

La fin d’une exécution réussie indique le nombre total de scénarios validés :

```text
69 scénarios de parcours et 2 scénarios d’absence debug validés.
```

En cas d’erreur, le scénario concerné commence par `✗`, son message est affiché et Node.js termine avec un code d’échec. Cette sortie peut donc être utilisée dans un script, une intégration continue ou une GitHub Action.

## Comment fonctionne `run-tests.mjs` ?

Le fichier contient volontairement un mini-outil de test très simple :

```js
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function test(name, callback) {
  try {
    callback();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}: ${error.message}`);
    throw error;
  }
}
```

Chaque scénario suit le même déroulement :

1. préparer un état connu ;
2. exécuter une fonction du jeu ;
3. vérifier son résultat avec `assert(...)` ;
4. libérer les objets Three.js créés lorsque cela est nécessaire.

Exemple simplifié :

```js
test("une bouteille perd une dose", () => {
  const bottle = createWaterBottleContainer(2);
  const result = drinkWaterDose(bottle, { thirst: 40 });

  assert(result.changed, "la bouteille n’a pas été utilisée");
  assert(result.container.units === 1, "la dose n’a pas été retirée");
  assert(result.thirst === 25, "la soif n’a pas diminué");
});
```

Les fonctions testées sont importées depuis `js/`, exactement comme elles le sont par le jeu. Les scénarios peuvent donc détecter une régression après une modification du code.

## Ajouter un test au fichier existant

### 1. Importer la fonction à tester

Ajoutez l’import en haut de `run-tests.mjs` :

```js
import { maFonction } from "../js/systems/mon-module.js";
```

Le chemin est relatif au dossier `tests/`, d’où le préfixe `../` pour revenir à la racine.

### 2. Ajouter un scénario

Placez le test près des scénarios traitant du même système :

```js
test("mon système : comportement attendu", () => {
  const result = maFonction({ valeur: 2 });

  assert(result.ok === true, "l’opération a été refusée");
  assert(result.valeur === 1, "la valeur obtenue est incorrecte");
});
```

Le nom doit décrire le comportement vérifié. Le message de chaque assertion doit expliquer ce qui serait incorrect, pas seulement écrire « test échoué ».

### 3. Tester aussi les refus

Un bon scénario vérifie le fonctionnement normal et les cas dangereux :

```js
assert(transferUnits(source, target, 1).changed, "transfert valide refusé");
assert(transferUnits(source, wrongTarget, 1).reason === "incompatible", "ressource incompatible acceptée");
assert(transferUnits(source, target, -1).reason === "invalid-amount", "quantité négative acceptée");
```

### 4. Nettoyer les objets Three.js

Lorsqu’un test appelle `createItem(...)` ou crée des objets graphiques, libérez leurs ressources à la fin :

```js
const object = createItem("water_bottle");

// vérifications…

disposeObjectTree(object);
```

Cela évite que la suite de tests elle-même masque des fuites de mémoire.

### 5. Relancer la suite

```bash
node tests/run-tests.mjs
```

Si vous ajoutez un nouveau bloc `test(...)`, pensez à actualiser le total affiché par le dernier `console.log(...)` du fichier.

## Créer un nouveau fichier `.mjs` de test

Pour isoler un futur groupe de tests, créez par exemple `tests/mon-systeme.mjs` :

```js
import { maFonction } from "../js/systems/mon-module.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function test(name, callback) {
  try {
    callback();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}: ${error.message}`);
    throw error;
  }
}

test("mon système : cas normal", () => {
  const result = maFonction();
  assert(result !== null, "aucun résultat obtenu");
});
```

Lancez-le directement :

```bash
node tests/mon-systeme.mjs
```

Si plusieurs fichiers apparaissent, il pourra devenir utile de créer plus tard un lanceur commun ou un script npm. Pour le moment, `run-tests.mjs` reste le point d’entrée officiel et ne demande aucune installation supplémentaire.

## Tester du code asynchrone

Le mini-runner `test(...)` actuel est synchrone. Pour un contrôle asynchrone isolé, utilisez `await` directement dans le fichier `.mjs` :

```js
const result = await chargerQuelqueChose();
assert(result.loaded, "le chargement a échoué");
console.log("✓ chargement asynchrone");
```

Ne passez pas directement une fonction `async` au mini-runner actuel : il n’attendrait pas correctement sa fin. Si de nombreux tests asynchrones deviennent nécessaires, il faudra faire évoluer `test(...)` en fonction `async` ou adopter le module natif `node:test`.

## Ce que cette suite ne remplace pas

Ces tests vérifient principalement la logique JavaScript et certains contrats de structure. Ils ne remplacent pas :

- un parcours réel dans le labyrinthe ;
- le contrôle visuel sur ordinateur et mobile ;
- l’écoute des sons et de leurs transitions ;
- la sensation des commandes, collisions et animations ;
- un essai final depuis l’adresse GitHub Pages publiée.

Après une modification graphique ou interactive, lancez donc la suite automatisée puis effectuez également un contrôle dans le navigateur.

## Conseils pour écrire un bon scénario

- Utilisez des valeurs fixes et reproductibles, notamment pour les seeds.
- Testez un comportement précis par scénario.
- Vérifiez les identifiants d’instance lorsque des objets passent entre un niveau et l’inventaire.
- Comparez les quantités avant et après un transfert pour détecter pertes et duplications.
- Pour une sauvegarde, testez un aller-retour complet : création, sérialisation, lecture et restauration.
- N’accédez pas au réseau et ne dépendez pas d’une sauvegarde réelle du navigateur.
- Un test de régression doit échouer avant la correction du bug et réussir après celle-ci.
