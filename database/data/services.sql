-- Script: services.sql
-- Description: Test data for data.services table
-- Date: 2025-03-05

BEGIN;

-- Declare variables for UUIDs
DO $$
DECLARE
    owning_entity_uuid UUID;
    owned_by_uuid UUID;
    managed_by_uuid UUID;
    cab_uuid UUID;
    parent_service_uuid UUID;
BEGIN
    -- Get UUIDs from existing data
    SELECT uuid INTO owning_entity_uuid FROM configuration.entities WHERE name = 'IT Department' LIMIT 1;
    SELECT uuid INTO owned_by_uuid FROM configuration.persons WHERE email = 'john.doe@lumiere.com' LIMIT 1;
    SELECT uuid INTO managed_by_uuid FROM configuration.persons WHERE email = 'jane.smith@lumiere.com' LIMIT 1;
    SELECT uuid INTO cab_uuid FROM configuration.groups WHERE name = 'Change Advisory Board' LIMIT 1;
    
    -- If UUIDs don't exist, create default ones
    IF owning_entity_uuid IS NULL THEN
        INSERT INTO configuration.entities (name, entity_id, entity_type) 
        VALUES ('IT Department', 'IT-DEPT', 'DEPARTMENT') 
        RETURNING uuid INTO owning_entity_uuid;
    END IF;
    
    IF owned_by_uuid IS NULL THEN
        INSERT INTO configuration.persons (first_name, last_name, email) 
        VALUES ('John', 'Doe', 'john.doe@lumiere.com') 
        RETURNING uuid INTO owned_by_uuid;
    END IF;
    
    IF managed_by_uuid IS NULL THEN
        INSERT INTO configuration.persons (first_name, last_name, email) 
        VALUES ('Jane', 'Smith', 'jane.smith@lumiere.com') 
        RETURNING uuid INTO managed_by_uuid;
    END IF;
    
    IF cab_uuid IS NULL THEN
        INSERT INTO configuration.groups (name, description) 
        VALUES ('Change Advisory Board', 'CAB Team') 
        RETURNING uuid INTO cab_uuid;
    END IF;
    
    -- Insert parent services
    INSERT INTO data.services (
        name, 
        description, 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        business_criticality, 
        lifecycle_status, 
        version, 
        operational, 
        legal_regulatory, 
        reputational, 
        financial, 
        comments, 
        cab_uuid
    ) VALUES (
        'IT Infrastructure Services', 
        'Core IT infrastructure services including network, servers, and storage', 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'High', 
        'Production', 
        '1.0', 
        'Medium', 
        'Low', 
        'Medium', 
        'High', 
        'Critical services supporting business operations', 
        cab_uuid
    ) RETURNING uuid INTO parent_service_uuid;
    
    -- Insert child services
    INSERT INTO data.services (
        name, 
        description, 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        business_criticality, 
        lifecycle_status, 
        version, 
        operational, 
        legal_regulatory, 
        reputational, 
        financial, 
        comments, 
        cab_uuid, 
        parent_uuid
    ) VALUES 
    (
        'Network Services', 
        'Network connectivity, firewalls, and security services', 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'High', 
        'Production', 
        '2.1', 
        'High', 
        'Medium', 
        'Medium', 
        'Medium', 
        'Network services for all locations', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Server Hosting', 
        'Physical and virtual server hosting services', 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'High', 
        'Production', 
        '3.0', 
        'Medium', 
        'Low', 
        'Medium', 
        'High', 
        'Server hosting for all business applications', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Storage Services', 
        'Data storage and backup services', 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'High', 
        'Production', 
        '2.5', 
        'Medium', 
        'High', 
        'High', 
        'Medium', 
        'Storage services for all business data', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Email Services', 
        'Corporate email and messaging services', 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'High', 
        'Production', 
        '4.2', 
        'Medium', 
        'Medium', 
        'High', 
        'Medium', 
        'Email services for all employees', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Collaboration Tools', 
        'Team collaboration and document sharing services', 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'Medium', 
        'Production', 
        '2.0', 
        'Low', 
        'Low', 
        'Medium', 
        'Low', 
        'Collaboration tools for team productivity', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Help Desk', 
        'IT support and help desk services', 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'Medium', 
        'Production', 
        '3.1', 
        'Low', 
        'Low', 
        'High', 
        'Medium', 
        'Support services for all employees', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Security Services', 
        'Information security and compliance services', 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'Critical', 
        'Production', 
        '2.3', 
        'High', 
        'High', 
        'High', 
        'High', 
        'Security services for all systems and data', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Business Applications', 
        'Core business application hosting and support', 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'Critical', 
        'Production', 
        '1.5', 
        'High', 
        'High', 
        'High', 
        'Critical', 
        'Business-critical applications', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Disaster Recovery', 
        'Disaster recovery and business continuity services', 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'Critical', 
        'Production', 
        '2.0', 
        'Critical', 
        'High', 
        'High', 
        'High', 
        'DR services for all critical systems', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Desktop Support', 
        'Desktop and laptop support services', 
        owning_entity_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'Medium', 
        'Production', 
        '3.0', 
        'Low', 
        'Low', 
        'Medium', 
        'Medium', 
        'Desktop support for all employees', 
        cab_uuid, 
        parent_service_uuid
    );
END $$;

COMMIT;
