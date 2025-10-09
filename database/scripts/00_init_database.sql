-- Script: 00_init_database.sql
-- Description: Création de la base de données Lumiere v17
-- Date: 2025-02-03

-- Suppression de la base de données si elle existe déjà
DROP DATABASE IF EXISTS lumiere_db_v17;

SET CLIENT_ENCODING TO 'UTF8';

-- Création de la base de données
CREATE DATABASE lumiere_db_v17
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'French_France.1252'
    LC_CTYPE = 'French_France.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;
