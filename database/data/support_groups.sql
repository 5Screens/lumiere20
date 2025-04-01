-- Script: support_groups.sql
-- Description: Test data for configuration.groups table with support groups
-- Date: 2025-04-01

BEGIN;

-- Declare variables for UUIDs
DO $$
DECLARE
    supervisor_uuid UUID;
    manager_uuid UUID;
BEGIN
    -- Get UUIDs from existing data
    SELECT uuid INTO supervisor_uuid FROM configuration.persons WHERE email = 'jane.smith@lumiere.com' LIMIT 1;
    SELECT uuid INTO manager_uuid FROM configuration.persons WHERE email = 'john.doe@lumiere.com' LIMIT 1;
    
    -- If UUIDs don't exist, create default ones
    IF supervisor_uuid IS NULL THEN
        INSERT INTO configuration.persons (first_name, last_name, email) 
        VALUES ('Jane', 'Smith', 'jane.smith@lumiere.com') 
        RETURNING uuid INTO supervisor_uuid;
    END IF;
    
    IF manager_uuid IS NULL THEN
        INSERT INTO configuration.persons (first_name, last_name, email) 
        VALUES ('John', 'Doe', 'john.doe@lumiere.com') 
        RETURNING uuid INTO manager_uuid;
    END IF;
    
    -- Insert support groups
    INSERT INTO configuration.groups (
        groupe_name,
        support_level,
        description,
        rel_supervisor,
        rel_manager,
        email,
        phone
    ) VALUES 
    -- Level 1 Support Groups
    (
        'IT Helpdesk',
        1,
        'First level IT support for all employees',
        supervisor_uuid,
        manager_uuid,
        'helpdesk@lumiere.com',
        '+33123456001'
    ),
    (
        'Customer Service',
        1,
        'First level customer support',
        supervisor_uuid,
        manager_uuid,
        'customer.service@lumiere.com',
        '+33123456002'
    ),
    (
        'Technical Support',
        1,
        'General technical support for products',
        supervisor_uuid,
        manager_uuid,
        'tech.support@lumiere.com',
        '+33123456003'
    ),
    (
        'Reception Desk',
        1,
        'Front office support and reception',
        supervisor_uuid,
        manager_uuid,
        'reception@lumiere.com',
        '+33123456004'
    ),
    (
        'User Access Management',
        1,
        'User account and access management',
        supervisor_uuid,
        manager_uuid,
        'access.management@lumiere.com',
        '+33123456005'
    ),
    (
        'Field Support Paris',
        1,
        'On-site support for Paris region',
        supervisor_uuid,
        manager_uuid,
        'field.paris@lumiere.com',
        '+33123456006'
    ),
    (
        'Field Support Lyon',
        1,
        'On-site support for Lyon region',
        supervisor_uuid,
        manager_uuid,
        'field.lyon@lumiere.com',
        '+33123456007'
    ),
    (
        'Field Support Marseille',
        1,
        'On-site support for Marseille region',
        supervisor_uuid,
        manager_uuid,
        'field.marseille@lumiere.com',
        '+33123456008'
    ),
    (
        'Remote Assistance Team',
        1,
        'Remote desktop support for employees',
        supervisor_uuid,
        manager_uuid,
        'remote.assistance@lumiere.com',
        '+33123456009'
    ),
    (
        'Password Reset Team',
        1,
        'Password reset and account recovery',
        supervisor_uuid,
        manager_uuid,
        'password.reset@lumiere.com',
        '+33123456010'
    ),
    
    -- Level 2 Support Groups
    (
        'Network Support',
        2,
        'Network infrastructure support',
        supervisor_uuid,
        manager_uuid,
        'network.support@lumiere.com',
        '+33123456011'
    ),
    (
        'Server Support',
        2,
        'Server infrastructure support',
        supervisor_uuid,
        manager_uuid,
        'server.support@lumiere.com',
        '+33123456012'
    ),
    (
        'Application Support',
        2,
        'Business application support',
        supervisor_uuid,
        manager_uuid,
        'app.support@lumiere.com',
        '+33123456013'
    ),
    (
        'Database Support',
        2,
        'Database management and support',
        supervisor_uuid,
        manager_uuid,
        'db.support@lumiere.com',
        '+33123456014'
    ),
    (
        'Security Operations',
        2,
        'Security monitoring and incident response',
        supervisor_uuid,
        manager_uuid,
        'security.ops@lumiere.com',
        '+33123456015'
    ),
    (
        'Cloud Services Support',
        2,
        'Cloud infrastructure and services support',
        supervisor_uuid,
        manager_uuid,
        'cloud.support@lumiere.com',
        '+33123456016'
    ),
    (
        'Virtualization Team',
        2,
        'Virtual infrastructure support',
        supervisor_uuid,
        manager_uuid,
        'virtualization@lumiere.com',
        '+33123456017'
    ),
    (
        'Storage Management',
        2,
        'Data storage and backup support',
        supervisor_uuid,
        manager_uuid,
        'storage@lumiere.com',
        '+33123456018'
    ),
    (
        'Middleware Support',
        2,
        'Middleware and integration support',
        supervisor_uuid,
        manager_uuid,
        'middleware@lumiere.com',
        '+33123456019'
    ),
    (
        'Email Systems Support',
        2,
        'Email infrastructure and services support',
        supervisor_uuid,
        manager_uuid,
        'email.support@lumiere.com',
        '+33123456020'
    ),
    
    -- Level 3 Support Groups
    (
        'Network Engineering',
        3,
        'Advanced network design and troubleshooting',
        supervisor_uuid,
        manager_uuid,
        'network.engineering@lumiere.com',
        '+33123456021'
    ),
    (
        'Database Administration',
        3,
        'Advanced database administration and optimization',
        supervisor_uuid,
        manager_uuid,
        'dba@lumiere.com',
        '+33123456022'
    ),
    (
        'Security Engineering',
        3,
        'Advanced security architecture and incident investigation',
        supervisor_uuid,
        manager_uuid,
        'security.engineering@lumiere.com',
        '+33123456023'
    ),
    (
        'System Architecture',
        3,
        'System design and architecture',
        supervisor_uuid,
        manager_uuid,
        'architecture@lumiere.com',
        '+33123456024'
    ),
    (
        'Cloud Architecture',
        3,
        'Cloud platform design and optimization',
        supervisor_uuid,
        manager_uuid,
        'cloud.architecture@lumiere.com',
        '+33123456025'
    ),
    (
        'Enterprise Applications',
        3,
        'Enterprise application development and customization',
        supervisor_uuid,
        manager_uuid,
        'enterprise.apps@lumiere.com',
        '+33123456026'
    ),
    (
        'Infrastructure Engineering',
        3,
        'Advanced infrastructure design and implementation',
        supervisor_uuid,
        manager_uuid,
        'infrastructure.engineering@lumiere.com',
        '+33123456027'
    ),
    (
        'DevOps Team',
        3,
        'DevOps practices and CI/CD pipeline support',
        supervisor_uuid,
        manager_uuid,
        'devops@lumiere.com',
        '+33123456028'
    ),
    (
        'Data Center Operations',
        3,
        'Data center management and operations',
        supervisor_uuid,
        manager_uuid,
        'datacenter@lumiere.com',
        '+33123456029'
    ),
    (
        'Change Advisory Board',
        3,
        'Change management and approval',
        supervisor_uuid,
        manager_uuid,
        'cab@lumiere.com',
        '+33123456030'
    );
    
END $$;

COMMIT;
