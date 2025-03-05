-- Script: services.sql
-- Description: Test data for data.services table
-- Date: 2025-03-05

BEGIN;

-- Declare variables for UUIDs
DO $$
DECLARE
    service_provider_uuid UUID;
    owing_group_uuid UUID;
    owned_by_uuid UUID;
    managed_by_uuid UUID;
    cab_uuid UUID;
    parent_service_uuid UUID;
BEGIN
    -- Get UUIDs from existing data
    SELECT uuid INTO service_provider_uuid FROM configuration.groups WHERE name = 'IT Operations' LIMIT 1;
    SELECT uuid INTO owing_group_uuid FROM configuration.groups WHERE name = 'Service Management' LIMIT 1;
    SELECT uuid INTO owned_by_uuid FROM configuration.persons WHERE email = 'john.doe@lumiere.com' LIMIT 1;
    SELECT uuid INTO managed_by_uuid FROM configuration.persons WHERE email = 'jane.smith@lumiere.com' LIMIT 1;
    SELECT uuid INTO cab_uuid FROM configuration.groups WHERE name = 'Change Advisory Board' LIMIT 1;
    
    -- If UUIDs don't exist, create default ones
    IF service_provider_uuid IS NULL THEN
        INSERT INTO configuration.groups (name, description) VALUES ('IT Operations', 'IT Operations Team') RETURNING uuid INTO service_provider_uuid;
    END IF;
    
    IF owing_group_uuid IS NULL THEN
        INSERT INTO configuration.groups (name, description) VALUES ('Service Management', 'Service Management Team') RETURNING uuid INTO owing_group_uuid;
    END IF;
    
    IF owned_by_uuid IS NULL THEN
        INSERT INTO configuration.persons (first_name, last_name, email) VALUES ('John', 'Doe', 'john.doe@lumiere.com') RETURNING uuid INTO owned_by_uuid;
    END IF;
    
    IF managed_by_uuid IS NULL THEN
        INSERT INTO configuration.persons (first_name, last_name, email) VALUES ('Jane', 'Smith', 'jane.smith@lumiere.com') RETURNING uuid INTO managed_by_uuid;
    END IF;
    
    IF cab_uuid IS NULL THEN
        INSERT INTO configuration.groups (name, description) VALUES ('Change Advisory Board', 'CAB Team') RETURNING uuid INTO cab_uuid;
    END IF;
    
    -- Insert parent services
    INSERT INTO data.services (
        name, 
        description, 
        service_provider_uuid, 
        owing_group_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        business_criticality, 
        lifecycle_status, 
        version, 
        operational_risk, 
        legal_regulatory_risk, 
        reputational_risk, 
        financial_risk, 
        comments, 
        cab_uuid
    ) VALUES (
        'IT Infrastructure Services', 
        'Core IT infrastructure services including network, servers, and storage', 
        service_provider_uuid, 
        owing_group_uuid, 
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
        service_provider_uuid, 
        owing_group_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        business_criticality, 
        lifecycle_status, 
        version, 
        operational_risk, 
        legal_regulatory_risk, 
        reputational_risk, 
        financial_risk, 
        comments, 
        cab_uuid, 
        parent_uuid
    ) VALUES 
    (
        'Network Services', 
        'Network connectivity, firewalls, and security services', 
        service_provider_uuid, 
        owing_group_uuid, 
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
        service_provider_uuid, 
        owing_group_uuid, 
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
        service_provider_uuid, 
        owing_group_uuid, 
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
        service_provider_uuid, 
        owing_group_uuid, 
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
        service_provider_uuid, 
        owing_group_uuid, 
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
        service_provider_uuid, 
        owing_group_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'Medium', 
        'Production', 
        '3.1', 
        'Low', 
        'Low', 
        'High', 
        'Low', 
        'Help desk services for all employees', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Security Services', 
        'IT security monitoring and management', 
        service_provider_uuid, 
        owing_group_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'Critical', 
        'Production', 
        '5.0', 
        'High', 
        'High', 
        'High', 
        'High', 
        'Security services protecting all IT assets', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Database Services', 
        'Database hosting and management', 
        service_provider_uuid, 
        owing_group_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'High', 
        'Production', 
        '3.5', 
        'Medium', 
        'High', 
        'Medium', 
        'High', 
        'Database services for all applications', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Printing Services', 
        'Corporate printing and scanning services', 
        service_provider_uuid, 
        owing_group_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'Low', 
        'Production', 
        '2.0', 
        'Low', 
        'Low', 
        'Low', 
        'Low', 
        'Printing services for all locations', 
        cab_uuid, 
        parent_service_uuid
    ),
    (
        'Mobile Device Management', 
        'Management of corporate mobile devices', 
        service_provider_uuid, 
        owing_group_uuid, 
        owned_by_uuid, 
        managed_by_uuid, 
        'Medium', 
        'Production', 
        '2.3', 
        'Medium', 
        'Medium', 
        'Medium', 
        'Low', 
        'Mobile device management for all corporate devices', 
        cab_uuid, 
        parent_service_uuid
    );
END $$;

COMMIT;
