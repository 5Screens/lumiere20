# Script de reconstruction complète de la base de données lumiere-db-v17
# Usage: .\rebuild_database.ps1

$ErrorActionPreference = "Stop"

# Forcer l'encodage UTF-8 pour la console
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:PGCLIENTENCODING = "UTF8"
$env:PGOPTIONS = "--client-min-messages=warning"

# Configuration
$DB_USER = "postgres"
$DB_NAME = "lumiere_db_v17"
$SCRIPT_DIR = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$SCRIPTS_PATH = Join-Path $SCRIPT_DIR "scripts"
$DATA_PATH = Join-Path $SCRIPT_DIR "data"

# Créer un fichier de log avec timestamp
$logFile = "rebuild_$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$logPath = Join-Path $PSScriptRoot $logFile

# Fonction pour logger et afficher
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
    Add-Content -Path $logPath -Value $Message -Encoding UTF8
}

Write-Log "========================================" "Cyan"
Write-Log "Reconstruction de la base $DB_NAME" "Cyan"
Write-Log "========================================" "Cyan"
Write-Log "Fichier de log: $logFile" "Gray"
Write-Log ""

# Demander le mot de passe une seule fois
$securePassword = Read-Host "Mot de passe PostgreSQL" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$env:PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
Write-Log ""

# Étape 1: Création de la base de données
Write-Log "[1/5] Creation de la base de donnees..." "Yellow"
psql -U $DB_USER -f "$SCRIPTS_PATH\00_init_database.sql" > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "ERREUR lors de la creation de la base" "Red"
    exit 1
}
Write-Log "  OK - Base de donnees creee" "Green"
Write-Log ""

# Étape 2: Structure de base
Write-Log "[2/5] Creation de la structure..." "Yellow"
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
    Write-Log "  - $script" "Gray"
    psql -U $DB_USER -d $DB_NAME -f "$SCRIPTS_PATH\$script" > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "    ERREUR" "Red"
        exit 1
    }
    Write-Log "    OK" "Green"
}
Write-Log "Structure creee avec succes" "Green"
Write-Log ""

# Étape 3: Données obligatoires (configuration système)
Write-Log "[3/5] Insertion des donnees obligatoires..." "Yellow"
$requiredDataScripts = @(
    "04_ticket_status.sql",
    "10_problem_categories.sql",
    "19_location_status.sql",
    "data_symptoms.sql",
    "incident_config.sql",
    "07_entity_setup.sql",
    "12_change.sql",
    "12_changes_qa.sql",
    "13_knowledge_articles_setup.sql",
    "14_project_setup.sql",
    "15_defect_setup.sql"
)

foreach ($script in $requiredDataScripts) {
    Write-Log "  - $script" "Gray"
    psql -U $DB_USER -d $DB_NAME -f "$DATA_PATH\$script" > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "    ERREUR" "Red"
        exit 1
    }
    Write-Log "    OK" "Green"
}
Write-Log "Donnees obligatoires inserees avec succes" "Green"
Write-Log ""

# Étape 4: Données de test (optionnelles)
Write-Log "[4/5] Insertion des donnees de test (optionnelles)..." "Yellow"
$testDataScripts = @(
    "entities.sql",
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

foreach ($script in $testDataScripts) {
    Write-Log "  - $script" "Gray"
    psql -U $DB_USER -d $DB_NAME -f "$DATA_PATH\$script" > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "    OK" "Green"
    } else {
        Write-Log "    ERREUR (non bloquante)" "Yellow"
    }
}
Write-Log "Donnees de test inserees" "Green"
Write-Log ""

# Étape 5: Vérification
Write-Log "[5/5] Verification..." "Yellow"
$tableCount = psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');" 2>$null
if ($tableCount) {
    Write-Log "Nombre de tables creees: $($tableCount.Trim())" "Green"
} else {
    Write-Log "Impossible de compter les tables" "Yellow"
}
Write-Log ""

Write-Log "========================================" "Cyan"
Write-Log "Base de donnees reconstruite avec succes!" "Green"
Write-Log "========================================" "Cyan"
Write-Log ""
Write-Log "Prochaine etape: Modifier le fichier backend\.env avec:" "Yellow"
Write-Log "DB_NAME=lumiere_db_v17" "White"
Write-Log ""
Write-Log "Log complet disponible: $logFile" "Gray"

# Nettoyer le mot de passe de l'environnement
$env:PGPASSWORD = $null
