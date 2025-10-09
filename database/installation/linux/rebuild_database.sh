#!/bin/bash
# Script de reconstruction complète de la base de données lumiere-db-v17
# Usage: ./rebuild_database.sh

set -e  # Exit on error

# Configuration
DB_USER="postgres"
DB_NAME="lumiere_db_v17"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "Reconstruction de la base $DB_NAME"
echo "========================================"
echo ""

# Étape 1: Création de la base de données
echo "[1/4] Creation de la base de donnees..."
psql -U $DB_USER -f "$SCRIPT_DIR/00_init_database.sql"
echo "✓ Base de donnees creee avec succes"
echo ""

# Étape 2: Structure de base
echo "[2/4] Creation de la structure..."
structure_scripts=(
    "01_create_extensions.sql"
    "02_create_tables.sql"
    "03_alter_headquarters_location.sql"
    "03_create_audit_schema.sql"
    "03_create_indexes.sql"
    "04_create_functions.sql"
    "04_update_audit_triggers.sql"
    "05_create_triggers.sql"
    "06_CreateLanguages.sql"
    "07_CreateEntitiesTypesTranslation.sql"
    "08_createTicketTypes.sql"
    "09_assignation_and_watch_table.sql"
    "10_create_incident_tables.sql"
    "11_create_problem_tables.sql"
    "12_create_change_tables.sql"
    "13_create_km_tables.sql"
    "14_create_project_tables.sql"
    "15_create_defect_tables.sql"
    "16_create_table_metadata.sql"
    "17_populate_table_metadata.sql"
)

for script in "${structure_scripts[@]}"; do
    echo "  - Execution de $script"
    psql -U $DB_USER -d $DB_NAME -f "$SCRIPT_DIR/$script"
done
echo "✓ Structure creee avec succes"
echo ""

# Étape 3: Données obligatoires (configuration système)
echo "[3/5] Insertion des donnees obligatoires..."
required_data_scripts=(
    "data/04_ticket_status.sql"
    "data/10_problem_categories.sql"
    "data/19_location_status.sql"
    "data/data_symptoms.sql"
    "data/incident_config.sql"
    "data/07_entity_setup.sql"
    "data/12_change.sql"
    "data/12_changes_qa.sql"
    "data/13_knowledge_articles_setup.sql"
    "data/14_project_setup.sql"
    "data/15_defect_setup.sql"
)

for script in "${required_data_scripts[@]}"; do
    echo "  - Execution de $script"
    psql -U $DB_USER -d $DB_NAME -f "$SCRIPT_DIR/$script"
done
echo "✓ Donnees obligatoires inserees avec succes"
echo ""

# Étape 4: Données de test (optionnelles)
echo "[4/5] Insertion des donnees de test (optionnelles)..."
test_data_scripts=(
    "data/entities.sql"
    "data/locations.sql"
    "data/support_groups.sql"
    "data/persons.sql"
    "data/services.sql"
    "data/service_offerings.sql"
    "data/configuration_items_seed.sql"
    "data/rel_entities_locations.sql"
    "data/rel_persons_groups.sql"
    "data/rel_subscribers_serviceofferings.sql"
)

for script in "${test_data_scripts[@]}"; do
    echo "  - Execution de $script"
    if psql -U $DB_USER -d $DB_NAME -f "$SCRIPT_DIR/$script" 2>/dev/null; then
        echo "    OK"
    else
        echo "    ERREUR (non bloquante)"
    fi
done
echo "✓ Donnees de test inserees (avec erreurs non bloquantes)"
echo ""

# Étape 5: Vérification
echo "[5/5] Verification..."
table_count=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');")
echo "Nombre de tables creees: $table_count"
echo ""

echo "========================================"
echo "✓ Base de donnees reconstruite avec succes!"
echo "========================================"
echo ""
echo "Prochaine etape: Modifier le fichier backend/.env avec:"
echo "DB_NAME=lumiere_db_v17"
