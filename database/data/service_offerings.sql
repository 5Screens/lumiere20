-- Script: service_offerings.sql
-- Description: Test data for data.service_offerings table
-- Date: 2025-03-05

BEGIN;

-- Declare variables for UUIDs
DO $$
DECLARE
    network_service_uuid UUID;
    server_hosting_uuid UUID;
    storage_service_uuid UUID;
    email_service_uuid UUID;
    security_service_uuid UUID;
    operator_entity_uuid UUID;
BEGIN
    -- Get UUIDs from existing data
    SELECT uuid INTO network_service_uuid FROM data.services WHERE name = 'Network Services' LIMIT 1;
    SELECT uuid INTO server_hosting_uuid FROM data.services WHERE name = 'Server Hosting' LIMIT 1;
    SELECT uuid INTO storage_service_uuid FROM data.services WHERE name = 'Storage Services' LIMIT 1;
    SELECT uuid INTO email_service_uuid FROM data.services WHERE name = 'Email Services' LIMIT 1;
    SELECT uuid INTO security_service_uuid FROM data.services WHERE name = 'Security Services' LIMIT 1;
    SELECT uuid INTO operator_entity_uuid FROM configuration.entities WHERE entity_id = 'LUM002' LIMIT 1; -- Lumiere Technologies
    
    -- Insert service offerings for Network Services
    INSERT INTO data.service_offerings (
        name, 
        description, 
        start_date, 
        end_date, 
        business_criticality, 
        environment, 
        price_model, 
        currency, 
        service_uuid, 
        operator_entity_uuid
    ) VALUES 
    (
        'Basic Network Connectivity', 
        'Standard network connectivity for small offices', 
        '2025-01-01', 
        NULL, 
        'Medium', 
        'Production', 
        'Fixed Monthly', 
        'EUR', 
        network_service_uuid, 
        operator_entity_uuid
    ),
    (
        'Enterprise Network Suite', 
        'Advanced network services with redundancy for large offices', 
        '2025-01-01', 
        NULL, 
        'High', 
        'Production', 
        'Tiered', 
        'EUR', 
        network_service_uuid, 
        operator_entity_uuid
    ),
    (
        'Secure Remote Access', 
        'VPN and secure remote access services', 
        '2025-01-15', 
        NULL, 
        'High', 
        'Production', 
        'Per User', 
        'EUR', 
        network_service_uuid, 
        operator_entity_uuid
    );
    
    -- Insert service offerings for Server Hosting
    INSERT INTO data.service_offerings (
        name, 
        description, 
        start_date, 
        end_date, 
        business_criticality, 
        environment, 
        price_model, 
        currency, 
        service_uuid, 
        operator_entity_uuid
    ) VALUES 
    (
        'Virtual Server - Basic', 
        'Basic virtual server hosting with limited resources', 
        '2025-01-01', 
        NULL, 
        'Medium', 
        'Production', 
        'Fixed Monthly', 
        'EUR', 
        server_hosting_uuid, 
        operator_entity_uuid
    ),
    (
        'Virtual Server - Premium', 
        'Premium virtual server hosting with dedicated resources', 
        '2025-01-01', 
        NULL, 
        'High', 
        'Production', 
        'Tiered', 
        'EUR', 
        server_hosting_uuid, 
        operator_entity_uuid
    ),
    (
        'Physical Server Hosting', 
        'Dedicated physical server hosting in secure data center', 
        '2025-02-01', 
        NULL, 
        'Critical', 
        'Production', 
        'Fixed Monthly', 
        'EUR', 
        server_hosting_uuid, 
        operator_entity_uuid
    );
    
    -- Insert service offerings for Storage Services
    INSERT INTO data.service_offerings (
        name, 
        description, 
        start_date, 
        end_date, 
        business_criticality, 
        environment, 
        price_model, 
        currency, 
        service_uuid, 
        operator_entity_uuid
    ) VALUES 
    (
        'Standard Storage', 
        'Standard storage solution for business data', 
        '2025-01-01', 
        NULL, 
        'Medium', 
        'Production', 
        'Per GB', 
        'EUR', 
        storage_service_uuid, 
        operator_entity_uuid
    ),
    (
        'High-Performance Storage', 
        'SSD-based high-performance storage for critical applications', 
        '2025-01-15', 
        NULL, 
        'High', 
        'Production', 
        'Per GB', 
        'EUR', 
        storage_service_uuid, 
        operator_entity_uuid
    ),
    (
        'Backup & Recovery', 
        'Comprehensive backup and recovery services', 
        '2025-02-01', 
        NULL, 
        'High', 
        'Production', 
        'Tiered', 
        'EUR', 
        storage_service_uuid, 
        operator_entity_uuid
    );
    
    -- Insert service offerings for Email Services
    INSERT INTO data.service_offerings (
        name, 
        description, 
        start_date, 
        end_date, 
        business_criticality, 
        environment, 
        price_model, 
        currency, 
        service_uuid, 
        operator_entity_uuid
    ) VALUES 
    (
        'Basic Email', 
        'Standard email service with 10GB mailbox', 
        '2025-01-01', 
        NULL, 
        'Medium', 
        'Production', 
        'Per User', 
        'EUR', 
        email_service_uuid, 
        operator_entity_uuid
    ),
    (
        'Premium Email', 
        'Advanced email service with 50GB mailbox and advanced features', 
        '2025-01-01', 
        NULL, 
        'High', 
        'Production', 
        'Per User', 
        'EUR', 
        email_service_uuid, 
        operator_entity_uuid
    ),
    (
        'Email Archiving', 
        'Email archiving and compliance service', 
        '2025-02-15', 
        NULL, 
        'Medium', 
        'Production', 
        'Per User', 
        'EUR', 
        email_service_uuid, 
        operator_entity_uuid
    );
    
    -- Insert service offerings for Security Services
    INSERT INTO data.service_offerings (
        name, 
        description, 
        start_date, 
        end_date, 
        business_criticality, 
        environment, 
        price_model, 
        currency, 
        service_uuid, 
        operator_entity_uuid
    ) VALUES 
    (
        'Basic Security Suite', 
        'Standard security monitoring and protection', 
        '2025-01-01', 
        NULL, 
        'High', 
        'Production', 
        'Fixed Monthly', 
        'EUR', 
        security_service_uuid, 
        operator_entity_uuid
    ),
    (
        'Advanced Threat Protection', 
        'Advanced security monitoring and threat detection', 
        '2025-01-15', 
        NULL, 
        'Critical', 
        'Production', 
        'Tiered', 
        'EUR', 
        security_service_uuid, 
        operator_entity_uuid
    ),
    (
        'Security Compliance Package', 
        'Security services tailored for regulatory compliance', 
        '2025-02-01', 
        NULL, 
        'Critical', 
        'Production', 
        'Fixed Monthly', 
        'EUR', 
        security_service_uuid, 
        operator_entity_uuid
    );
END $$;

COMMIT;
