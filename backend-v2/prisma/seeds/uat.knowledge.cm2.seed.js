/**
 * UAT seed for creating CM2-level knowledge articles for testing.
 * Creates 10 educational knowledge articles adapted for elementary school level.
 *
 * Usage:
 *   node prisma/seeds/run-single.js uat-knowledge-cm2
 */

const seedUatKnowledgeCm2 = async (prisma) => {
  console.log('UAT Knowledge CM2 seed starting...');

  // Get a writer (first person found)
  const writer = await prisma.persons.findFirst({
    where: { is_active: true },
    select: { uuid: true }
  });

  if (!writer) {
    console.log('No active person found to use as writer. Run uat seed first.');
    return;
  }

  console.log(`Using writer: ${writer.uuid}`);

  // CM2-level knowledge articles
  const knowledgeArticles = [
    {
      title: 'Comprendre une consigne',
      description: `# Comprendre une consigne

## Introduction
Savoir comprendre une consigne est essentiel pour bien réussir son travail. Voici les étapes à suivre pour ne rien oublier !

## Étape 1 : Lire entièrement la consigne
- Ne commence pas à travailler tout de suite
- Lis la consigne du début à la fin
- Prends ton temps, ne te précipite pas

## Étape 2 : Repérer les mots importants
Les mots importants te disent ce que tu dois faire :
- **Souligne** = trace un trait sous les mots
- **Entoure** = fais un cercle autour
- **Recopie** = écris la même chose
- **Calcule** = fais une opération
- **Explique** = dis pourquoi avec tes mots

## Étape 3 : Identifier ce qui est demandé
Pose-toi ces questions :
- Qu'est-ce que je dois faire exactement ?
- Combien de choses je dois faire ?
- Où dois-je écrire ma réponse ?

## Étape 4 : Vérifier que tout est fait
Avant de dire "j'ai fini" :
- Relis la consigne
- Vérifie que tu as tout fait
- Compte le nombre de réponses demandées

## Astuce
Si tu ne comprends pas un mot, demande à ton enseignant. C'est normal de ne pas tout savoir !`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Guide pour apprendre à bien lire et comprendre une consigne scolaire. Explique comment repérer les mots importants et vérifier son travail.',
        keywords: ['consigne', 'lecture', 'compréhension', 'école', 'travail', 'vérification', 'mots importants'],
        prerequisites: 'Savoir lire.',
        limitations: 'Adapté au niveau CM2.',
        security_notes: '',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Bases des mathématiques du quotidien',
      description: `# Bases des mathématiques du quotidien

## Introduction
Les mathématiques sont partout dans notre vie ! Voici comment les utiliser tous les jours.

## Le calcul mental simple
Le calcul mental, c'est calculer dans sa tête sans crayon ni calculatrice.

### Astuces pour additionner
- Pour ajouter 9 : ajoute 10 puis enlève 1
- Pour ajouter 11 : ajoute 10 puis ajoute 1
- Exemple : 45 + 9 = 45 + 10 - 1 = 55 - 1 = 54

### Astuces pour soustraire
- Pour enlever 9 : enlève 10 puis ajoute 1
- Exemple : 63 - 9 = 63 - 10 + 1 = 53 + 1 = 54

## Les 4 opérations de base

| Opération | Symbole | Exemple |
|-----------|---------|---------|
| Addition | + | 5 + 3 = 8 |
| Soustraction | - | 8 - 3 = 5 |
| Multiplication | × | 4 × 3 = 12 |
| Division | ÷ | 12 ÷ 3 = 4 |

## Estimer un résultat
Avant de calculer, essaie de deviner à peu près le résultat :
- 48 + 31 → environ 50 + 30 = 80
- Le vrai résultat (79) est proche de 80 ✓

## Résoudre un problème concret
1. **Lis** le problème en entier
2. **Cherche** les nombres importants
3. **Trouve** quelle opération faire
4. **Calcule** 
5. **Vérifie** que ta réponse a du sens

### Exemple
"Marie a 15 bonbons. Elle en donne 6 à Paul. Combien lui en reste-t-il ?"
- Nombres : 15 et 6
- Opération : elle donne = elle enlève = soustraction
- Calcul : 15 - 6 = 9
- Vérification : 9 bonbons, c'est logique ✓`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Guide des bases mathématiques pour la vie quotidienne : calcul mental, les 4 opérations, estimation et résolution de problèmes.',
        keywords: ['mathématiques', 'calcul mental', 'addition', 'soustraction', 'multiplication', 'division', 'problème', 'quotidien'],
        prerequisites: 'Connaître les nombres jusqu\'à 1000.',
        limitations: 'Niveau CM2, opérations simples.',
        security_notes: '',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Gérer son temps',
      description: `# Gérer son temps

## Introduction
Bien gérer son temps permet de finir son travail sans stress et d'avoir du temps pour jouer !

## Lire l'heure

### L'heure digitale
- 14:30 = 14 heures et 30 minutes
- Après 12h00, on est l'après-midi
- 14h00 = 2 heures de l'après-midi

### L'heure sur une horloge
- La petite aiguille montre les heures
- La grande aiguille montre les minutes
- Quand la grande aiguille est sur le 6 = et demie
- Quand la grande aiguille est sur le 3 = et quart

## Comprendre les durées

| Durée | C'est combien ? |
|-------|-----------------|
| 1 minute | 60 secondes |
| 1 heure | 60 minutes |
| 1 journée | 24 heures |
| 1 semaine | 7 jours |

### Calculer une durée
Si je commence à 14h00 et je finis à 15h30 :
- De 14h00 à 15h00 = 1 heure
- De 15h00 à 15h30 = 30 minutes
- Total = 1 heure et 30 minutes

## Planifier son travail
1. **Fais une liste** de ce que tu dois faire
2. **Commence** par le plus important ou le plus difficile
3. **Estime** combien de temps chaque tâche va prendre
4. **Fais des pauses** entre les tâches (5-10 minutes)

## Respecter un temps donné
Quand on te dit "tu as 20 minutes" :
- Regarde l'heure de départ
- Calcule l'heure de fin
- Vérifie régulièrement où tu en es
- Garde 2-3 minutes pour relire

## Astuce
Utilise un minuteur ou un sablier pour mieux voir le temps qui passe !`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Guide pour apprendre à lire l\'heure, comprendre les durées, planifier son travail et respecter les délais.',
        keywords: ['temps', 'heure', 'durée', 'planification', 'organisation', 'horloge', 'minutes'],
        prerequisites: 'Connaître les nombres jusqu\'à 60.',
        limitations: 'Niveau CM2.',
        security_notes: '',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Différence entre chiffre et nombre',
      description: `# Différence entre chiffre et nombre

## Introduction
Beaucoup de gens confondent "chiffre" et "nombre". Pourtant, ce n'est pas la même chose !

## Les chiffres : il n'y en a que 10 !
Les chiffres sont comme les lettres de l'alphabet des mathématiques :

**0 - 1 - 2 - 3 - 4 - 5 - 6 - 7 - 8 - 9**

C'est tout ! Il n'existe que ces 10 chiffres.

## Les nombres : il y en a une infinité !
Un nombre est fait avec un ou plusieurs chiffres :
- **7** est un nombre fait avec 1 chiffre
- **42** est un nombre fait avec 2 chiffres (4 et 2)
- **1 589** est un nombre fait avec 4 chiffres

## La valeur des chiffres selon leur position
Dans un nombre, chaque chiffre a une valeur différente selon sa place :

### Exemple avec 3 527
| Position | Chiffre | Valeur |
|----------|---------|--------|
| Milliers | 3 | 3 000 |
| Centaines | 5 | 500 |
| Dizaines | 2 | 20 |
| Unités | 7 | 7 |

3 527 = 3 000 + 500 + 20 + 7

## Écrire et lire les nombres

### En chiffres → En lettres
- 21 → vingt-et-un
- 80 → quatre-vingts
- 200 → deux cents
- 1 000 → mille

### Attention aux pièges !
- Quatre-vingt**s** (avec s) mais quatre-vingt-**un** (sans s)
- Deux cent**s** (avec s) mais deux cent **un** (sans s)

## Résumé
| | Chiffre | Nombre |
|---|---------|--------|
| Combien ? | 10 (de 0 à 9) | Infini |
| Exemple | 5 | 5, 15, 555, 5000... |
| Comparaison | Comme une lettre | Comme un mot |`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Explication de la différence entre chiffre et nombre, la valeur positionnelle des chiffres et comment écrire les nombres en lettres.',
        keywords: ['chiffre', 'nombre', 'mathématiques', 'position', 'unités', 'dizaines', 'centaines', 'milliers'],
        prerequisites: 'Connaître les chiffres de 0 à 9.',
        limitations: 'Niveau CM2, nombres jusqu\'aux milliers.',
        security_notes: '',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Écrire correctement',
      description: `# Écrire correctement

## Introduction
Bien écrire, c'est se faire comprendre ! Voici les règles de base pour écrire sans fautes.

## La majuscule
On met une majuscule :
- **Au début d'une phrase** : Le chat dort.
- **Aux noms propres** : Marie, Paris, la France
- **Après un point** : Il pleut. Je prends mon parapluie.

## La ponctuation

| Signe | Nom | Quand l'utiliser |
|-------|-----|------------------|
| . | Point | Fin de phrase normale |
| ? | Point d'interrogation | Question |
| ! | Point d'exclamation | Surprise, ordre, émotion |
| , | Virgule | Petite pause, liste |

### Exemples
- Tu viens ? (question)
- Attention ! (exclamation)
- J'ai acheté des pommes, des poires et des bananes. (liste)

## L'accord sujet / verbe
Le verbe s'accorde toujours avec son sujet :
- **Je** mange → avec "je", le verbe finit souvent par **-e**
- **Tu** manges → avec "tu", le verbe finit par **-es**
- **Il/Elle** mange → avec "il/elle", le verbe finit par **-e**
- **Nous** mangeons → avec "nous", le verbe finit par **-ons**
- **Vous** mangez → avec "vous", le verbe finit par **-ez**
- **Ils/Elles** mangent → avec "ils/elles", le verbe finit par **-ent**

## Orthographe des mots fréquents
Mots souvent mal écrits :
- **beaucoup** (pas "baucoup")
- **toujours** (pas "toujour")
- **maintenant** (pas "maintenan")
- **aujourd'hui** (avec apostrophe)
- **peut-être** (avec trait d'union)

## Astuces pour ne pas faire de fautes
1. **Relis** ton texte à voix basse
2. **Vérifie** les accords (singulier/pluriel)
3. **Cherche** les mots dont tu doutes dans le dictionnaire
4. **Fais attention** aux homophones : a/à, et/est, son/sont`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Règles de base pour bien écrire : majuscules, ponctuation, accords sujet/verbe et orthographe des mots fréquents.',
        keywords: ['écriture', 'orthographe', 'grammaire', 'majuscule', 'ponctuation', 'accord', 'verbe', 'sujet'],
        prerequisites: 'Savoir écrire en lettres cursives ou script.',
        limitations: 'Niveau CM2, règles de base.',
        security_notes: '',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Se repérer dans le monde',
      description: `# Se repérer dans le monde

## Introduction
Savoir où on se trouve dans le monde, c'est important ! Découvrons ensemble notre planète.

## Les continents
Il y a **6 continents** sur Terre :

| Continent | Particularité |
|-----------|---------------|
| **Europe** | Notre continent ! |
| **Afrique** | Le plus chaud |
| **Asie** | Le plus grand |
| **Amérique** | Divisée en Nord et Sud |
| **Océanie** | Avec l'Australie |
| **Antarctique** | Le plus froid (pôle Sud) |

## Les océans
Il y a **5 océans** :
- **Atlantique** : entre l'Europe et l'Amérique
- **Pacifique** : le plus grand
- **Indien** : au sud de l'Asie
- **Arctique** : au pôle Nord
- **Antarctique** : au pôle Sud

## La France et l'Europe
- La France est en **Europe**
- Elle a la forme d'un **hexagone** (6 côtés)
- Sa capitale est **Paris**
- Elle est bordée par l'océan Atlantique et la mer Méditerranée

### Les pays voisins de la France
- Belgique (nord)
- Luxembourg (nord-est)
- Allemagne (est)
- Suisse (est)
- Italie (sud-est)
- Espagne (sud)

## Les points cardinaux
Pour se repérer, on utilise 4 directions :

        NORD (N)
            ↑
  OUEST (O) ← → EST (E)
            ↓
        SUD (S)

**Astuce pour retenir** : "Jamais Evelyne Ne Sera Ouvrière"
- J(amais) = à gauche, E = en haut, N = à droite, S = en bas, O = à gauche
Ou plus simple : le soleil se lève à l'**Est** et se couche à l'**Ouest**

## Lecture simple de carte
Sur une carte :
- Le **Nord** est en haut
- L'**échelle** indique la taille réelle (ex: 1 cm = 10 km)
- La **légende** explique les symboles`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Guide pour se repérer dans le monde : continents, océans, la France en Europe, points cardinaux et lecture de carte.',
        keywords: ['géographie', 'continents', 'océans', 'France', 'Europe', 'carte', 'points cardinaux', 'nord', 'sud', 'est', 'ouest'],
        prerequisites: 'Aucun.',
        limitations: 'Niveau CM2, géographie de base.',
        security_notes: '',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Vivre ensemble et respecter les règles',
      description: `# Vivre ensemble et respecter les règles

## Introduction
Pour bien vivre ensemble, il faut des règles. Mais pourquoi ? Et comment les respecter ?

## Le respect des autres
Respecter les autres, c'est :
- **Écouter** quand quelqu'un parle
- **Ne pas se moquer** des différences
- **Accepter** que les autres pensent différemment
- **Partager** et aider ceux qui en ont besoin

### Ce qui n'est PAS du respect
- Insulter ou dire des gros mots
- Frapper ou pousser
- Exclure quelqu'un d'un jeu
- Se moquer du physique ou des vêtements

## La politesse
Les mots magiques qui changent tout :

| Situation | Mot magique |
|-----------|-------------|
| On demande quelque chose | S'il te plaît / S'il vous plaît |
| On reçoit quelque chose | Merci |
| On fait une erreur | Pardon / Excuse-moi |
| On arrive | Bonjour |
| On part | Au revoir |
| On dérange | Excusez-moi |

## Droits et devoirs
Chacun a des **droits** (ce qu'on peut faire) et des **devoirs** (ce qu'on doit faire).

### Exemples de droits
- Aller à l'école gratuitement
- Être protégé
- Donner son avis
- Jouer et se reposer

### Exemples de devoirs
- Respecter les autres
- Faire son travail scolaire
- Prendre soin du matériel
- Suivre les règles de la classe

## Différence entre règle et punition

| Règle | Punition |
|-------|----------|
| Dit ce qu'il faut faire | Conséquence quand on ne respecte pas la règle |
| Avant | Après |
| Pour tout le monde | Pour celui qui n'a pas respecté |
| Exemple : "On lève la main pour parler" | Exemple : "Tu n'as pas levé la main, tu attends ton tour" |

## Pourquoi des règles ?
Les règles servent à :
- Protéger tout le monde
- Permettre de vivre ensemble
- Être juste (les mêmes règles pour tous)
- Apprendre à devenir responsable`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Guide sur le vivre ensemble : respect des autres, politesse, droits et devoirs, et comprendre la différence entre règle et punition.',
        keywords: ['respect', 'règles', 'politesse', 'droits', 'devoirs', 'vivre ensemble', 'citoyenneté', 'punition'],
        prerequisites: 'Aucun.',
        limitations: 'Niveau CM2.',
        security_notes: '',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Utiliser le numérique intelligemment',
      description: `# Utiliser le numérique intelligemment

## Introduction
Internet et les écrans sont partout ! Voici comment les utiliser de façon intelligente et sûre.

## Recherche simple sur internet
Pour trouver une information :

### Étapes
1. **Ouvre** un moteur de recherche (Google, Qwant Junior...)
2. **Tape** des mots-clés simples (pas une phrase entière)
3. **Lis** les premiers résultats
4. **Vérifie** l'information sur plusieurs sites

### Exemple
❌ "Je voudrais savoir quelle est la capitale de l'Italie s'il vous plaît"
✅ "capitale Italie"

## Esprit critique face aux informations
**Attention !** Tout ce qui est sur internet n'est pas vrai !

### Questions à se poser
- **Qui** a écrit ça ? (un expert ? un inconnu ?)
- **Quand** ça a été écrit ? (c'est récent ?)
- **Pourquoi** c'est écrit ? (pour informer ? pour vendre ?)
- **Est-ce que** d'autres sites disent la même chose ?

### Sites fiables
- Sites officiels (.gouv.fr, .edu)
- Encyclopédies (Vikidia, Wikipédia avec prudence)
- Sites de médias connus

## Protection des données personnelles
**Ne donne JAMAIS sur internet :**
- Ton nom complet
- Ton adresse
- Ton école
- Ton numéro de téléphone
- Des photos de toi
- Ton mot de passe

### Créer un bon mot de passe
- Au moins 8 caractères
- Des lettres, des chiffres et des symboles
- Pas ton prénom ou ta date de naissance !
- Exemple : Chat2024!Bleu

## Bon usage des écrans

### Règles d'or
- **Pas d'écran** pendant les repas
- **Pas d'écran** avant de dormir (au moins 1h avant)
- **Faire des pauses** toutes les 30 minutes
- **Alterner** avec des activités sans écran

### Temps recommandé
- Maximum **2 heures** par jour d'écrans de loisir
- Les devoirs sur ordinateur ne comptent pas pareil

## En cas de problème
Si tu vois quelque chose qui te met mal à l'aise :
1. **Ferme** la page
2. **Parle** à un adulte de confiance
3. **Ne réponds pas** aux messages bizarres`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Guide pour utiliser internet et les écrans intelligemment : recherche efficace, esprit critique, protection des données et bon usage.',
        keywords: ['numérique', 'internet', 'écrans', 'recherche', 'sécurité', 'mot de passe', 'données personnelles', 'esprit critique'],
        prerequisites: 'Savoir lire et utiliser un clavier.',
        limitations: 'Niveau CM2.',
        security_notes: 'Ne jamais partager ses données personnelles en ligne.',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Savoir apprendre',
      description: `# Savoir apprendre

## Introduction
Apprendre, ça s'apprend ! Voici des techniques pour mieux retenir et comprendre.

## Mémoriser efficacement

### La répétition espacée
Ne révise pas tout la veille ! Révise :
- Le jour même (5 min)
- Le lendemain (5 min)
- 3 jours après (5 min)
- 1 semaine après (5 min)

### Les moyens mnémotechniques
Des astuces pour retenir :
- **Phrase** : "Mais où est donc Ornicar ?" → mais, ou, et, donc, or, ni, car
- **Image mentale** : imagine ce que tu apprends
- **Chanson** : mets les informations en musique
- **Acronyme** : prends les premières lettres

## Relire efficacement
Relire 10 fois sans réfléchir ne sert à rien !

### La bonne méthode
1. **Lis** une première fois pour comprendre
2. **Ferme** le cahier
3. **Récite** ce que tu as retenu
4. **Vérifie** en rouvrant
5. **Recommence** pour ce que tu as oublié

## S'entraîner
La pratique est la clé !

### Pour les maths
- Refais les exercices du cahier
- Invente des exercices similaires
- Explique à quelqu'un comment tu fais

### Pour le français
- Écris des phrases avec les mots nouveaux
- Fais des dictées
- Lis à voix haute

### Pour les leçons
- Fais des fiches résumées
- Dessine des schémas
- Pose-toi des questions

## Comprendre plutôt que réciter
Réciter par cœur sans comprendre, ça ne marche pas longtemps !

### Comment savoir si tu as compris ?
- Tu peux **expliquer** avec tes propres mots
- Tu peux **donner des exemples**
- Tu peux **répondre à des questions** différentes
- Tu peux **faire des liens** avec d'autres choses

### Si tu ne comprends pas
1. Relis plus lentement
2. Cherche les mots difficiles
3. Demande à quelqu'un d'expliquer autrement
4. Cherche des exemples concrets

## Conditions pour bien apprendre
- **Calme** : pas de bruit, pas de télé
- **Reposé** : pas fatigué
- **Organisé** : tout le matériel prêt
- **Concentré** : téléphone éteint !`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Techniques pour apprendre efficacement : mémorisation, relecture active, entraînement et compréhension plutôt que récitation.',
        keywords: ['apprendre', 'mémoriser', 'réviser', 'comprendre', 'concentration', 'techniques', 'étude', 'école'],
        prerequisites: 'Aucun.',
        limitations: 'Niveau CM2.',
        security_notes: '',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Comprendre et gérer ses émotions',
      description: `# Comprendre et gérer ses émotions

## Introduction
Tout le monde ressent des émotions, c'est normal ! L'important est de les reconnaître et de savoir les gérer.

## Identifier ses émotions
Il existe 6 émotions de base :

| Émotion | Quand je la ressens | Ce que mon corps fait |
|---------|---------------------|----------------------|
| **Joie** | Quelque chose de bien arrive | Je souris, j'ai de l'énergie |
| **Tristesse** | Je perds quelque chose/quelqu'un | J'ai envie de pleurer, je suis fatigué |
| **Colère** | Quelque chose me semble injuste | Mon cœur bat vite, je serre les poings |
| **Peur** | Je sens un danger | Je tremble, j'ai froid |
| **Dégoût** | Quelque chose me repousse | J'ai envie de m'éloigner |
| **Surprise** | Quelque chose d'inattendu | J'ouvre grand les yeux |

## Mettre des mots sur ses ressentis
Plus tu es précis, mieux tu te comprends !

### Nuances de la colère
- Agacé (un peu)
- Énervé (moyen)
- Furieux (beaucoup)

### Nuances de la tristesse
- Déçu (un peu)
- Triste (moyen)
- Désespéré (beaucoup)

### Nuances de la peur
- Inquiet (un peu)
- Effrayé (moyen)
- Terrorisé (beaucoup)

## Se calmer quand on est en colère ou stressé

### La respiration
1. **Inspire** lentement par le nez (compte jusqu'à 4)
2. **Retiens** ta respiration (compte jusqu'à 4)
3. **Expire** lentement par la bouche (compte jusqu'à 4)
4. **Recommence** 3 fois

### Autres techniques
- **Compte** jusqu'à 10 avant de réagir
- **Éloigne-toi** de la situation
- **Serre** une balle anti-stress
- **Pense** à un endroit calme que tu aimes
- **Bouge** : fais quelques pas, étire-toi

## Demander de l'aide
C'est **courageux** de demander de l'aide, pas faible !

### Quand demander de l'aide ?
- Tu te sens triste depuis longtemps
- Tu as peur de quelque chose ou quelqu'un
- Tu ne sais pas comment gérer une situation
- Quelqu'un te fait du mal

### À qui parler ?
- Tes parents
- Un enseignant
- L'infirmière scolaire
- Un autre adulte de confiance

### Comment demander ?
- "J'ai besoin de parler de quelque chose"
- "Je ne me sens pas bien en ce moment"
- "Est-ce que tu peux m'aider ?"

## Rappel important
- Toutes les émotions sont **normales**
- Ce qui compte, c'est ce qu'on **fait** avec
- On a le droit d'être triste ou en colère
- On n'a **pas le droit** de faire du mal aux autres`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Guide pour comprendre et gérer ses émotions : identifier ce qu\'on ressent, mettre des mots dessus, se calmer et demander de l\'aide.',
        keywords: ['émotions', 'sentiments', 'colère', 'tristesse', 'peur', 'joie', 'calme', 'respiration', 'aide'],
        prerequisites: 'Aucun.',
        limitations: 'Niveau CM2.',
        security_notes: 'En cas de mal-être persistant, consulter un adulte de confiance.',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    }
  ];

  let insertedCount = 0;

  for (const article of knowledgeArticles) {
    try {
      await prisma.tickets.create({
        data: {
          title: article.title,
          description: article.description,
          ticket_type_code: 'KNOWLEDGE',
          writer_uuid: writer.uuid,
          extended_core_fields: article.extended_core_fields
        }
      });
      insertedCount++;
      console.log(`  Created: ${article.title}`);
    } catch (error) {
      console.error(`  Error creating article "${article.title}": ${error.message}`);
    }
  }

  console.log(`\nUAT Knowledge CM2 seed completed: ${insertedCount} articles created`);
};

module.exports = { seedUatKnowledgeCm2 };
