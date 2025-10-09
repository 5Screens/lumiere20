# Script de reconstruction complète de la base de données lumiere-db-v17
# Usage: .\rebuild_database.ps1

$ErrorActionPreference = "Stop"

# Configuration
$DB_USER = "postgres"
$DB_NAME = "lumiere_db_v17"
$SCRIPT_DIR = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$SCRIPTS_PATH = Join-Path $SCRIPT_DIR "scripts"
$DATA_PATH = Join-Path $SCRIPT_DIR "data"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Reconstruction de la base $DB_NAME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Création de la base de données
Write-Host "[1/4] Creation de la base de donnees..." -ForegroundColor Yellow
psql -U $DB_USER -f "$SCRIPTS_PATH\00_init_database.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la creation de la base" -ForegroundColor Red
    exit 1
}
Write-Host "Base de donnees creee avec succes" -ForegroundColor Green
Write-Host ""

# Étape 2: Structure de base
Write-Host "[2/4] Creation de la structure..." -ForegroundColor Yellow
$structureScripts = @(
    "01_create_extensions.sql",
    "02_create_tables.sql",
    "03_alter_headquarters_location.sql",
    "03_create_audit_schema.sql",
    "03_create_indexes.sql",
    "04_create_functions.sql",
    "04_update_audit_triggers.sql",
    "05_create_triggers.sql",
    "06_CreateLanguages.sql",
    "07_CreateEntitiesTypesTranslation.sql",
    "08_createTicketTypes.sql",
    "09_assignation_and_watch_table.sql",
    "10_create_incident_tables.sql",
    "11_create_problem_tables.sql",
    "12_create_change_tables.sql",
    "13_create_km_tables.sql",
    "14_create_project_tables.sql",
    "15_create_defect_tables.sql",
    "16_create_table_metadata.sql",
    "17_populate_table_metadata.sql"
)

foreach ($script in $structureScripts) {
    Write-Host "  - Execution de $script" -ForegroundColor Gray
    psql -U $DB_USER -d $DB_NAME -f "$SCRIPTS_PATH\$script"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors de l'execution de $script" -ForegroundColor Red
        exit 1
    }
}
Write-Host "Structure creee avec succes" -ForegroundColor Green
Write-Host ""

# Étape 3: Données de test
Write-Host "[3/4] Insertion des donnees de test..." -ForegroundColor Yellow
$dataScripts = @(
    "04_ticket_status.sql",
    "07_entity_setup.sql",
    "10_problem_categories.sql",
    "12_change.sql",
    "12_changes_qa.sql",
    "13_knowledge_articles_setup.sql",
    "14_project_setup.sql",
    "15_defect_setup.sql",
    "19_location_status.sql",
    "data_symptoms.sql",
    "entities.sql",
    "incident_config.sql",
    "locations.sql",
    "support_groups.sql",
    "persons.sql",
    "services.sql",
    "service_offerings.sql",
    "configuration_items_seed.sql",
    "rel_entities_locations.sql",
    "rel_persons_groups.sql",
    "rel_subscribers_serviceofferings.sql"
)

foreach ($script in $dataScripts) {
    Write-Host "  - Execution de $script" -ForegroundColor Gray
    psql -U $DB_USER -d $DB_NAME -f "$DATA_PATH\$script"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors de l'execution de $script" -ForegroundColor Red
        exit 1
    }
}
Write-Host "Donnees inserees avec succes" -ForegroundColor Green
Write-Host ""

# Étape 4: Vérification
Write-Host "[4/4] Verification..." -ForegroundColor Yellow
$tableCount = psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');"
Write-Host "Nombre de tables creees: $tableCount" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Base de donnees reconstruite avec succes!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaine etape: Modifier le fichier backend\.env avec:" -ForegroundColor Yellow
Write-Host "DB_NAME=lumiere_db_v17" -ForegroundColor White
