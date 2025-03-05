-- Script: rel_subscribers_serviceofferings.sql
-- Description: Test data for data.rel_subscribers_serviceofferings table
-- Date: 2025-03-05

BEGIN;

-- Declare variables for UUIDs
DO $$
DECLARE
    -- Service offerings
    basic_network_uuid UUID;
    enterprise_network_uuid UUID;
    secure_remote_uuid UUID;
    virtual_basic_uuid UUID;
    virtual_premium_uuid UUID;
    physical_server_uuid UUID;
    standard_storage_uuid UUID;
    high_perf_storage_uuid UUID;
    backup_recovery_uuid UUID;
    basic_email_uuid UUID;
    premium_email_uuid UUID;
    email_archiving_uuid UUID;
    basic_security_uuid UUID;
    advanced_security_uuid UUID;
    compliance_security_uuid UUID;
    
    -- Subscribers (entities)
    lumiere_group_uuid UUID;
    lumiere_tech_uuid UUID;
    lumiere_services_uuid UUID;
    paris_branch_uuid UUID;
    lyon_branch_uuid UUID;
    marseille_branch_uuid UUID;
BEGIN
    -- Get service offering UUIDs
    SELECT uuid INTO basic_network_uuid FROM data.service_offerings WHERE name = 'Basic Network Connectivity' LIMIT 1;
    SELECT uuid INTO enterprise_network_uuid FROM data.service_offerings WHERE name = 'Enterprise Network Suite' LIMIT 1;
    SELECT uuid INTO secure_remote_uuid FROM data.service_offerings WHERE name = 'Secure Remote Access' LIMIT 1;
    SELECT uuid INTO virtual_basic_uuid FROM data.service_offerings WHERE name = 'Virtual Server - Basic' LIMIT 1;
    SELECT uuid INTO virtual_premium_uuid FROM data.service_offerings WHERE name = 'Virtual Server - Premium' LIMIT 1;
    SELECT uuid INTO physical_server_uuid FROM data.service_offerings WHERE name = 'Physical Server Hosting' LIMIT 1;
    SELECT uuid INTO standard_storage_uuid FROM data.service_offerings WHERE name = 'Standard Storage' LIMIT 1;
    SELECT uuid INTO high_perf_storage_uuid FROM data.service_offerings WHERE name = 'High-Performance Storage' LIMIT 1;
    SELECT uuid INTO backup_recovery_uuid FROM data.service_offerings WHERE name = 'Backup & Recovery' LIMIT 1;
    SELECT uuid INTO basic_email_uuid FROM data.service_offerings WHERE name = 'Basic Email' LIMIT 1;
    SELECT uuid INTO premium_email_uuid FROM data.service_offerings WHERE name = 'Premium Email' LIMIT 1;
    SELECT uuid INTO email_archiving_uuid FROM data.service_offerings WHERE name = 'Email Archiving' LIMIT 1;
    SELECT uuid INTO basic_security_uuid FROM data.service_offerings WHERE name = 'Basic Security Suite' LIMIT 1;
    SELECT uuid INTO advanced_security_uuid FROM data.service_offerings WHERE name = 'Advanced Threat Protection' LIMIT 1;
    SELECT uuid INTO compliance_security_uuid FROM data.service_offerings WHERE name = 'Security Compliance Package' LIMIT 1;
    
    -- Get entity UUIDs
    SELECT uuid INTO lumiere_group_uuid FROM configuration.entities WHERE entity_id = 'LUM001' LIMIT 1;
    SELECT uuid INTO lumiere_tech_uuid FROM configuration.entities WHERE entity_id = 'LUM002' LIMIT 1;
    SELECT uuid INTO lumiere_services_uuid FROM configuration.entities WHERE entity_id = 'LUM003' LIMIT 1;
    SELECT uuid INTO paris_branch_uuid FROM configuration.entities WHERE name = 'Lumiere Paris Branch' LIMIT 1;
    SELECT uuid INTO lyon_branch_uuid FROM configuration.entities WHERE name = 'Lumiere Lyon Branch' LIMIT 1;
    SELECT uuid INTO marseille_branch_uuid FROM configuration.entities WHERE name = 'Lumiere Marseille Branch' LIMIT 1;
    
    -- Lumiere Group subscriptions (headquarters)
    INSERT INTO data.rel_subscribers_serviceofferings (
        subscriber_uuid, 
        service_offering_uuid, 
        start_date, 
        end_date
    ) VALUES 
    (lumiere_group_uuid, enterprise_network_uuid, '2025-01-01', NULL),
    (lumiere_group_uuid, secure_remote_uuid, '2025-01-15', NULL),
    (lumiere_group_uuid, virtual_premium_uuid, '2025-01-01', NULL),
    (lumiere_group_uuid, physical_server_uuid, '2025-02-01', NULL),
    (lumiere_group_uuid, high_perf_storage_uuid, '2025-01-15', NULL),
    (lumiere_group_uuid, backup_recovery_uuid, '2025-02-01', NULL),
    (lumiere_group_uuid, premium_email_uuid, '2025-01-01', NULL),
    (lumiere_group_uuid, email_archiving_uuid, '2025-02-15', NULL),
    (lumiere_group_uuid, advanced_security_uuid, '2025-01-15', NULL),
    (lumiere_group_uuid, compliance_security_uuid, '2025-02-01', NULL);
    
    -- Lumiere Technologies subscriptions
    INSERT INTO data.rel_subscribers_serviceofferings (
        subscriber_uuid, 
        service_offering_uuid, 
        start_date, 
        end_date
    ) VALUES 
    (lumiere_tech_uuid, enterprise_network_uuid, '2025-01-01', NULL),
    (lumiere_tech_uuid, secure_remote_uuid, '2025-01-15', NULL),
    (lumiere_tech_uuid, virtual_premium_uuid, '2025-01-01', NULL),
    (lumiere_tech_uuid, high_perf_storage_uuid, '2025-01-15', NULL),
    (lumiere_tech_uuid, premium_email_uuid, '2025-01-01', NULL),
    (lumiere_tech_uuid, advanced_security_uuid, '2025-01-15', NULL);
    
    -- Lumiere Services subscriptions
    INSERT INTO data.rel_subscribers_serviceofferings (
        subscriber_uuid, 
        service_offering_uuid, 
        start_date, 
        end_date
    ) VALUES 
    (lumiere_services_uuid, enterprise_network_uuid, '2025-01-01', NULL),
    (lumiere_services_uuid, secure_remote_uuid, '2025-01-15', NULL),
    (lumiere_services_uuid, virtual_basic_uuid, '2025-01-01', NULL),
    (lumiere_services_uuid, standard_storage_uuid, '2025-01-01', NULL),
    (lumiere_services_uuid, premium_email_uuid, '2025-01-01', NULL),
    (lumiere_services_uuid, basic_security_uuid, '2025-01-01', NULL);
    
    -- Paris Branch subscriptions
    INSERT INTO data.rel_subscribers_serviceofferings (
        subscriber_uuid, 
        service_offering_uuid, 
        start_date, 
        end_date
    ) VALUES 
    (paris_branch_uuid, enterprise_network_uuid, '2025-01-01', NULL),
    (paris_branch_uuid, virtual_basic_uuid, '2025-01-01', NULL),
    (paris_branch_uuid, standard_storage_uuid, '2025-01-01', NULL),
    (paris_branch_uuid, basic_email_uuid, '2025-01-01', NULL),
    (paris_branch_uuid, basic_security_uuid, '2025-01-01', NULL);
    
    -- Lyon Branch subscriptions
    INSERT INTO data.rel_subscribers_serviceofferings (
        subscriber_uuid, 
        service_offering_uuid, 
        start_date, 
        end_date
    ) VALUES 
    (lyon_branch_uuid, basic_network_uuid, '2025-01-01', NULL),
    (lyon_branch_uuid, virtual_basic_uuid, '2025-01-01', NULL),
    (lyon_branch_uuid, standard_storage_uuid, '2025-01-01', NULL),
    (lyon_branch_uuid, basic_email_uuid, '2025-01-01', NULL),
    (lyon_branch_uuid, basic_security_uuid, '2025-01-01', NULL);
    
    -- Marseille Branch subscriptions
    INSERT INTO data.rel_subscribers_serviceofferings (
        subscriber_uuid, 
        service_offering_uuid, 
        start_date, 
        end_date
    ) VALUES 
    (marseille_branch_uuid, basic_network_uuid, '2025-01-01', NULL),
    (marseille_branch_uuid, virtual_basic_uuid, '2025-01-01', NULL),
    (marseille_branch_uuid, standard_storage_uuid, '2025-01-01', NULL),
    (marseille_branch_uuid, basic_email_uuid, '2025-01-01', NULL),
    (marseille_branch_uuid, basic_security_uuid, '2025-01-01', NULL);
END $$;

COMMIT;
