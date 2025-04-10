-- Script: 10_problem_categories.sql
-- Description: Insertion des catégories de problèmes et leurs traductions
-- Date: 2025-04-10

BEGIN;

-- Insertion des catégories de problèmes
INSERT INTO configuration.problem_categories (code) VALUES
    -- Catégories métier
    ('CRITICAL_INCIDENT_FOLLOWUP'),     -- Suite incident critique
    ('MULTIPLE_INCIDENTS_FOLLOWUP'),    -- Suite plusieurs incidents du même type
    ('SERVICE_QUALITY_IMPROVEMENT'),    -- Amélioration de la qualité d'un service
    ('SYSTEM_ANALYSIS'),                -- Analyse du SI
    
    -- Catégories techniques
    ('HARDWARE_FAILURE'),               -- Défaillance matérielle
    ('SOFTWARE_BUG'),                   -- Bug logiciel
    ('CONFIGURATION_ERROR'),            -- Erreur de configuration
    ('CAPACITY_ISSUE'),                 -- Problème de capacité
    ('PERFORMANCE_DEGRADATION'),        -- Dégradation des performances
    ('SECURITY_VULNERABILITY'),         -- Vulnérabilité de sécurité
    ('INTEGRATION_ISSUE'),              -- Problème d'intégration
    ('DATA_CORRUPTION'),                -- Corruption de données
    ('NETWORK_ISSUE'),                  -- Problème réseau
    ('THIRD_PARTY_FAILURE'),            -- Défaillance d'un tiers
    ('DESIGN_FLAW'),                    -- Défaut de conception
    ('DOCUMENTATION_ERROR'),            -- Erreur de documentation
    ('TRAINING_ISSUE');                 -- Problème de formation

-- Insertion des traductions en français
INSERT INTO translations.problem_categories_labels (rel_problem_category_code, lang, label)
SELECT 
    code,
    'fr',
    CASE code
        -- Catégories métier
        WHEN 'CRITICAL_INCIDENT_FOLLOWUP' THEN 'Suite incident critique'
        WHEN 'MULTIPLE_INCIDENTS_FOLLOWUP' THEN 'Suite plusieurs incidents du même type'
        WHEN 'SERVICE_QUALITY_IMPROVEMENT' THEN 'Amélioration de la qualité d''un service'
        WHEN 'SYSTEM_ANALYSIS' THEN 'Analyse du SI'
        
        -- Catégories techniques
        WHEN 'HARDWARE_FAILURE' THEN 'Défaillance matérielle'
        WHEN 'SOFTWARE_BUG' THEN 'Bug logiciel'
        WHEN 'CONFIGURATION_ERROR' THEN 'Erreur de configuration'
        WHEN 'CAPACITY_ISSUE' THEN 'Problème de capacité'
        WHEN 'PERFORMANCE_DEGRADATION' THEN 'Dégradation des performances'
        WHEN 'SECURITY_VULNERABILITY' THEN 'Vulnérabilité de sécurité'
        WHEN 'INTEGRATION_ISSUE' THEN 'Problème d''intégration'
        WHEN 'DATA_CORRUPTION' THEN 'Corruption de données'
        WHEN 'NETWORK_ISSUE' THEN 'Problème réseau'
        WHEN 'THIRD_PARTY_FAILURE' THEN 'Défaillance d''un tiers'
        WHEN 'DESIGN_FLAW' THEN 'Défaut de conception'
        WHEN 'DOCUMENTATION_ERROR' THEN 'Erreur de documentation'
        WHEN 'TRAINING_ISSUE' THEN 'Problème de formation'
    END
FROM configuration.problem_categories;

-- Insertion des traductions en anglais
INSERT INTO translations.problem_categories_labels (rel_problem_category_code, lang, label)
SELECT 
    code,
    'en',
    CASE code
        -- Catégories métier
        WHEN 'CRITICAL_INCIDENT_FOLLOWUP' THEN 'Critical incident follow-up'
        WHEN 'MULTIPLE_INCIDENTS_FOLLOWUP' THEN 'Multiple incidents of the same type follow-up'
        WHEN 'SERVICE_QUALITY_IMPROVEMENT' THEN 'Service quality improvement'
        WHEN 'SYSTEM_ANALYSIS' THEN 'Information system analysis'
        
        -- Catégories techniques
        WHEN 'HARDWARE_FAILURE' THEN 'Hardware Failure'
        WHEN 'SOFTWARE_BUG' THEN 'Software Bug'
        WHEN 'CONFIGURATION_ERROR' THEN 'Configuration Error'
        WHEN 'CAPACITY_ISSUE' THEN 'Capacity Issue'
        WHEN 'PERFORMANCE_DEGRADATION' THEN 'Performance Degradation'
        WHEN 'SECURITY_VULNERABILITY' THEN 'Security Vulnerability'
        WHEN 'INTEGRATION_ISSUE' THEN 'Integration Issue'
        WHEN 'DATA_CORRUPTION' THEN 'Data Corruption'
        WHEN 'NETWORK_ISSUE' THEN 'Network Issue'
        WHEN 'THIRD_PARTY_FAILURE' THEN 'Third Party Failure'
        WHEN 'DESIGN_FLAW' THEN 'Design Flaw'
        WHEN 'DOCUMENTATION_ERROR' THEN 'Documentation Error'
        WHEN 'TRAINING_ISSUE' THEN 'Training Issue'
    END
FROM configuration.problem_categories;

-- Insertion des traductions en espagnol
INSERT INTO translations.problem_categories_labels (rel_problem_category_code, lang, label)
SELECT 
    code,
    'es',
    CASE code
        -- Catégories métier
        WHEN 'CRITICAL_INCIDENT_FOLLOWUP' THEN 'Seguimiento de incidente crítico'
        WHEN 'MULTIPLE_INCIDENTS_FOLLOWUP' THEN 'Seguimiento de múltiples incidentes del mismo tipo'
        WHEN 'SERVICE_QUALITY_IMPROVEMENT' THEN 'Mejora de la calidad del servicio'
        WHEN 'SYSTEM_ANALYSIS' THEN 'Análisis del sistema de información'
        
        -- Catégories techniques
        WHEN 'HARDWARE_FAILURE' THEN 'Fallo de hardware'
        WHEN 'SOFTWARE_BUG' THEN 'Error de software'
        WHEN 'CONFIGURATION_ERROR' THEN 'Error de configuración'
        WHEN 'CAPACITY_ISSUE' THEN 'Problema de capacidad'
        WHEN 'PERFORMANCE_DEGRADATION' THEN 'Degradación del rendimiento'
        WHEN 'SECURITY_VULNERABILITY' THEN 'Vulnerabilidad de seguridad'
        WHEN 'INTEGRATION_ISSUE' THEN 'Problema de integración'
        WHEN 'DATA_CORRUPTION' THEN 'Corrupción de datos'
        WHEN 'NETWORK_ISSUE' THEN 'Problema de red'
        WHEN 'THIRD_PARTY_FAILURE' THEN 'Fallo de terceros'
        WHEN 'DESIGN_FLAW' THEN 'Defecto de diseño'
        WHEN 'DOCUMENTATION_ERROR' THEN 'Error de documentación'
        WHEN 'TRAINING_ISSUE' THEN 'Problema de formación'
    END
FROM configuration.problem_categories;

-- Insertion des traductions en portugais
INSERT INTO translations.problem_categories_labels (rel_problem_category_code, lang, label)
SELECT 
    code,
    'pt',
    CASE code
        -- Catégories métier
        WHEN 'CRITICAL_INCIDENT_FOLLOWUP' THEN 'Acompanhamento de incidente crítico'
        WHEN 'MULTIPLE_INCIDENTS_FOLLOWUP' THEN 'Acompanhamento de múltiplos incidentes do mesmo tipo'
        WHEN 'SERVICE_QUALITY_IMPROVEMENT' THEN 'Melhoria da qualidade do serviço'
        WHEN 'SYSTEM_ANALYSIS' THEN 'Análise do sistema de informação'
        
        -- Catégories techniques
        WHEN 'HARDWARE_FAILURE' THEN 'Falha de hardware'
        WHEN 'SOFTWARE_BUG' THEN 'Erro de software'
        WHEN 'CONFIGURATION_ERROR' THEN 'Erro de configuração'
        WHEN 'CAPACITY_ISSUE' THEN 'Problema de capacidade'
        WHEN 'PERFORMANCE_DEGRADATION' THEN 'Degradação de desempenho'
        WHEN 'SECURITY_VULNERABILITY' THEN 'Vulnerabilidade de segurança'
        WHEN 'INTEGRATION_ISSUE' THEN 'Problema de integração'
        WHEN 'DATA_CORRUPTION' THEN 'Corrupção de dados'
        WHEN 'NETWORK_ISSUE' THEN 'Problema de rede'
        WHEN 'THIRD_PARTY_FAILURE' THEN 'Falha de terceiros'
        WHEN 'DESIGN_FLAW' THEN 'Falha de design'
        WHEN 'DOCUMENTATION_ERROR' THEN 'Erro de documentação'
        WHEN 'TRAINING_ISSUE' THEN 'Problema de treinamento'
    END
FROM configuration.problem_categories;

COMMIT;
