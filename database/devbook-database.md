# Guide de Construction de la Base de Données Lumiere v16

## Table des matières
1. [Prérequis](#prérequis)
2. [Structure des Tables](#structure-des-tables)
3. [Scripts SQL](#scripts-sql)
4. [Ordre d'Exécution](#ordre-dexécution)

## Prérequis
- PostgreSQL installé (version recommandée : 15 ou supérieure)
- Droits d'administration sur la base de données

## Structure des Tables

### Tables Principales

1. **configuration_items**
   - uuid (PK)
   - nom
   - description
   - date_creation
   - date_modification

2. **persons**
   - uuid (PK)
   - nom
   - prenom
   - email
   - date_creation
   - date_modification

3. **tickets**
   - uuid (PK)
   - titre
   - description
   - date_creation
   - date_modification
   - configuration_item_uuid (FK)
   - requested_by_uuid (FK -> persons) - personne qui demande le ticket
   - requested_for_uuid (FK -> persons) - personne pour qui le ticket est créé
   - writer_uuid (FK -> persons) - personne qui écrit le ticket
   - ticket_type_uuid (FK)
   - ticket_status_uuid (FK)

4. **entities**
   - uuid (PK)
   - nom
   - description
   - date_creation
   - date_modification

### Tables de Référence

5. **ticket_types**
   - uuid (PK)
   - code
   - date_creation
   - date_modification

6. **ticket_status**
   - uuid (PK)
   - code
   - date_creation
   - date_modification

7. **symptoms**
   - uuid (PK)
   - code
   - date_creation
   - date_modification

### Tables de Traduction

8. **ticket_types_translation**
   - uuid (PK)
   - ticket_type_uuid (FK)
   - langue
   - libelle
   - date_creation
   - date_modification

9. **ticket_status_translation**
   - uuid (PK)
   - ticket_status_uuid (FK)
   - langue
   - libelle
   - date_creation
   - date_modification

10. **symptoms_translation**
    - uuid (PK)
    - symptom_uuid (FK)
    - langue
    - libelle
    - date_creation
    - date_modification

### Tables de Relations

11. **persons_entities**
    - uuid (PK)
    - person_uuid (FK)
    - entity_uuid (FK)
    - date_creation
    - date_modification

## Scripts SQL

Les scripts seront organisés dans l'ordre suivant :

0. **00_init_database.sql** ✅
   - Création de la base de données lumiere_v16

1. **01_create_extensions.sql** ✅
   - Création de l'extension uuid-ossp pour la gestion des UUID

2. **02_create_tables.sql** ✅
   - Création de toutes les tables avec leurs contraintes

3. **03_create_indexes.sql** ✅
   - Création des index pour optimiser les performances

4. **04_create_functions.sql** ✅
   - Fonctions utilitaires pour la gestion des dates
   - Fonctions de validation

5. **05_create_triggers.sql** ✅
   - Triggers pour la mise à jour automatique des dates
   - Triggers de validation

6. **06_insert_reference_data.sql**
   - Insertion des données de référence (types, statuts)

7. **07_insert_translations.sql**
   - Insertion des traductions (FR, EN)

## Ordre d'Exécution

1. Créer la base de données :
```bash
# Ce script doit être exécuté en premier et sans spécifier de base de données
psql -U postgres -f 00_init_database.sql
```

2. Exécuter les scripts dans l'ordre :
```bash
# Les scripts suivants doivent être exécutés en spécifiant la base de données lumiere_v16
psql -U postgres -d lumiere_v16 -f 01_create_extensions.sql
psql -U postgres -d lumiere_v16 -f 02_create_tables.sql
psql -U postgres -d lumiere_v16 -f 03_create_indexes.sql
psql -U postgres -d lumiere_v16 -f 04_create_functions.sql
psql -U postgres -d lumiere_v16 -f 05_create_triggers.sql
psql -U postgres -d lumiere_v16 -f 06_insert_reference_data.sql
psql -U postgres -d lumiere_v16 -f 07_insert_translations.sql

## Notes Importantes

- Tous les UUID sont générés automatiquement
- Toutes les tables incluent des champs de traçabilité (date_creation, date_modification)
- Les contraintes de clés étrangères sont configurées avec ON DELETE RESTRICT
- Les index sont créés sur toutes les clés étrangères et les champs fréquemment utilisés dans les requêtes
- Les traductions sont gérées dans des tables séparées pour faciliter l'internationalisation
