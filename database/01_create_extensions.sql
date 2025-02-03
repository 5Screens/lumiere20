-- Script: 01_create_extensions.sql
-- Description: Installation des extensions nécessaires pour Lumiere v16
-- Date: 2025-02-03

-- Activation du mode transaction
BEGIN;

-- Extension pour la génération d'UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour la gestion des accents et caractères spéciaux
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Extension pour les opérations textuelles avancées
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Validation des modifications
COMMIT;

-- Vérification des extensions installées
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'unaccent', 'pg_trgm');
