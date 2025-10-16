-- Script: tasks.sql
-- Description: Generation of 1000 TASK tickets for testing purposes
-- Date: 2025-10-16
-- Structure: Tasks with various statuses, assignments, and configurations

-- ============================================================================
-- SECTION 2: TASK TICKETS GENERATION
-- ============================================================================

DO $$
DECLARE
    v_person_uuid UUID;
    v_writer_uuid UUID;
    v_requested_by_uuid UUID;
    v_requested_for_uuid UUID;
    v_group_uuid UUID;
    v_assigned_person_uuid UUID;
    v_ci_uuid UUID;
    v_task_uuid UUID;
    v_status_code VARCHAR(50);
    v_title TEXT;
    v_description TEXT;
    v_counter INTEGER := 0;
    v_random_val FLOAT;
    v_task_statuses VARCHAR(50)[];
    v_status_count INTEGER;
    v_created_at TIMESTAMP WITH TIME ZONE;
    v_updated_at TIMESTAMP WITH TIME ZONE;
    v_closed_at TIMESTAMP WITH TIME ZONE;
    v_assignment_created_at TIMESTAMP WITH TIME ZONE;
    v_assignment_updated_at TIMESTAMP WITH TIME ZONE;
    v_assignment_ended_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get all existing TASK statuses
    SELECT ARRAY_AGG(code) INTO v_task_statuses
    FROM configuration.ticket_status
    WHERE rel_ticket_type = 'TASK';
    
    v_status_count := array_length(v_task_statuses, 1);
    
    IF v_status_count IS NULL OR v_status_count = 0 THEN
        RAISE EXCEPTION 'No TASK statuses found in configuration.ticket_status';
    END IF;
    
    RAISE NOTICE 'Found % TASK statuses: %', v_status_count, v_task_statuses;
    
    -- Get a default writer (first person in database)
    SELECT uuid INTO v_writer_uuid FROM configuration.persons LIMIT 1;
    
    -- Task titles and descriptions templates
    FOR v_counter IN 1..1000 LOOP
        -- Randomly select persons for requested_by and requested_for
        SELECT uuid INTO v_requested_by_uuid 
        FROM configuration.persons 
        ORDER BY random() 
        LIMIT 1;
        
        SELECT uuid INTO v_requested_for_uuid 
        FROM configuration.persons 
        ORDER BY random() 
        LIMIT 1;
        
        -- Randomly select a group for assignment
        SELECT uuid INTO v_group_uuid 
        FROM configuration.groups 
        ORDER BY random() 
        LIMIT 1;
        
        -- Randomly select a person for assignment (50% chance)
        v_random_val := random();
        IF v_random_val > 0.5 THEN
            SELECT uuid INTO v_assigned_person_uuid 
            FROM configuration.persons 
            ORDER BY random() 
            LIMIT 1;
        ELSE
            v_assigned_person_uuid := NULL;
        END IF;
        
        -- Randomly select a configuration item (70% chance)
        v_random_val := random();
        IF v_random_val > 0.3 THEN
            SELECT uuid INTO v_ci_uuid 
            FROM data.configuration_items 
            ORDER BY random() 
            LIMIT 1;
        ELSE
            v_ci_uuid := NULL;
        END IF;
        
        -- Randomly select a status from existing TASK statuses
        v_status_code := v_task_statuses[1 + floor(random() * v_status_count)::INTEGER];
        
        -- Generate task title and description based on counter
        CASE (v_counter % 20)
            WHEN 0 THEN
                v_title := 'Update server configuration for production environment';
                v_description := 'Update the server configuration files to optimize performance and security settings for the production environment.';
            WHEN 1 THEN
                v_title := 'Create user documentation for new feature';
                v_description := 'Write comprehensive user documentation for the newly released feature, including screenshots and step-by-step instructions.';
            WHEN 2 THEN
                v_title := 'Review and approve code changes';
                v_description := 'Review the submitted pull request, verify code quality, run tests, and approve or request changes.';
            WHEN 3 THEN
                v_title := 'Deploy application to staging environment';
                v_description := 'Deploy the latest version of the application to the staging environment for testing and validation.';
            WHEN 4 THEN
                v_title := 'Configure backup system for database';
                v_description := 'Set up automated backup system for the production database with retention policy and monitoring.';
            WHEN 5 THEN
                v_title := 'Investigate performance issues on web server';
                v_description := 'Analyze server logs and metrics to identify the root cause of recent performance degradation.';
            WHEN 6 THEN
                v_title := 'Update security certificates for SSL';
                v_description := 'Renew and install SSL certificates for all production domains before expiration date.';
            WHEN 7 THEN
                v_title := 'Migrate data from legacy system';
                v_description := 'Extract, transform, and load data from the old system to the new platform with validation.';
            WHEN 8 THEN
                v_title := 'Configure monitoring alerts for critical services';
                v_description := 'Set up monitoring alerts for critical services with appropriate thresholds and notification channels.';
            WHEN 9 THEN
                v_title := 'Optimize database queries for better performance';
                v_description := 'Identify slow queries, add appropriate indexes, and optimize query execution plans.';
            WHEN 10 THEN
                v_title := 'Implement new API endpoint for mobile app';
                v_description := 'Develop and test new REST API endpoint to support mobile application requirements.';
            WHEN 11 THEN
                v_title := 'Update firewall rules for new service';
                v_description := 'Configure firewall rules to allow traffic for the newly deployed service while maintaining security.';
            WHEN 12 THEN
                v_title := 'Create automated test suite for login functionality';
                v_description := 'Develop comprehensive automated tests covering all login scenarios including edge cases.';
            WHEN 13 THEN
                v_title := 'Refactor legacy code module';
                v_description := 'Refactor the legacy module to improve code quality, maintainability, and test coverage.';
            WHEN 14 THEN
                v_title := 'Setup CI/CD pipeline for new project';
                v_description := 'Configure continuous integration and deployment pipeline with automated testing and deployment stages.';
            WHEN 15 THEN
                v_title := 'Upgrade framework to latest version';
                v_description := 'Upgrade the application framework to the latest stable version and resolve compatibility issues.';
            WHEN 16 THEN
                v_title := 'Configure load balancer for high availability';
                v_description := 'Set up and configure load balancer to distribute traffic across multiple servers for high availability.';
            WHEN 17 THEN
                v_title := 'Implement caching strategy for API responses';
                v_description := 'Design and implement caching mechanism to improve API response times and reduce server load.';
            WHEN 18 THEN
                v_title := 'Audit user access permissions';
                v_description := 'Review and audit all user access permissions to ensure compliance with security policies.';
            ELSE
                v_title := 'Cleanup temporary files and logs';
                v_description := 'Remove old temporary files and archived logs to free up disk space on servers.';
        END CASE;
        
        -- Generate coherent dates: created -> updated -> closed
        v_created_at := CURRENT_TIMESTAMP - (random() * INTERVAL '90 days');
        v_updated_at := v_created_at + (random() * INTERVAL '60 days');
        
        IF v_status_code IN ('COMPLETED', 'CANCELLED', 'CLOSED', 'RESOLVED') THEN
            v_closed_at := v_updated_at + (random() * INTERVAL '15 days');
        ELSE
            v_closed_at := NULL;
        END IF;
        
        -- Insert the task ticket
        INSERT INTO core.tickets (
            title,
            description,
            configuration_item_uuid,
            requested_by_uuid,
            requested_for_uuid,
            writer_uuid,
            ticket_type_code,
            ticket_status_code,
            created_at,
            updated_at,
            closed_at
        ) VALUES (
            v_title || ' #' || v_counter,
            v_description,
            v_ci_uuid,
            v_requested_by_uuid,
            v_requested_for_uuid,
            v_writer_uuid,
            'TASK',
            v_status_code,
            v_created_at,
            v_updated_at,
            v_closed_at
        )
        RETURNING uuid INTO v_task_uuid;
        
        -- Create assignment relation if group is selected with coherent dates
        IF v_group_uuid IS NOT NULL THEN
            -- Assignment dates: created slightly after ticket creation, updated after assignment creation, ended at ticket close
            v_assignment_created_at := v_created_at + (random() * INTERVAL '2 days');
            v_assignment_updated_at := v_assignment_created_at + (random() * INTERVAL '50 days');
            -- Ensure updated_at doesn't exceed ticket's updated_at
            IF v_assignment_updated_at > v_updated_at THEN
                v_assignment_updated_at := v_updated_at;
            END IF;
            
            IF v_status_code IN ('COMPLETED', 'CANCELLED', 'CLOSED', 'RESOLVED') THEN
                v_assignment_ended_at := v_closed_at;
            ELSE
                v_assignment_ended_at := NULL;
            END IF;
            
            INSERT INTO core.rel_tickets_groups_persons (
                rel_ticket,
                rel_assigned_to_group,
                rel_assigned_to_person,
                type,
                created_at,
                updated_at,
                ended_at
            ) VALUES (
                v_task_uuid,
                v_group_uuid,
                v_assigned_person_uuid,
                'ASSIGNED',
                v_assignment_created_at,
                v_assignment_updated_at,
                v_assignment_ended_at
            );
        END IF;
        
        -- Add watchers (20% chance, 1-3 watchers)
        v_random_val := random();
        IF v_random_val > 0.8 THEN
            FOR i IN 1..(1 + floor(random() * 3)::INTEGER) LOOP
                SELECT uuid INTO v_person_uuid 
                FROM configuration.persons 
                WHERE uuid NOT IN (v_requested_by_uuid, v_requested_for_uuid, v_assigned_person_uuid)
                ORDER BY random() 
                LIMIT 1;
                
                IF v_person_uuid IS NOT NULL THEN
                    -- Watcher dates: created after ticket creation, updated after watcher creation
                    v_assignment_created_at := v_created_at + (random() * INTERVAL '10 days');
                    v_assignment_updated_at := v_assignment_created_at + (random() * INTERVAL '40 days');
                    -- Ensure updated_at doesn't exceed ticket's updated_at
                    IF v_assignment_updated_at > v_updated_at THEN
                        v_assignment_updated_at := v_updated_at;
                    END IF;
                    
                    INSERT INTO core.rel_tickets_groups_persons (
                        rel_ticket,
                        rel_assigned_to_group,
                        rel_assigned_to_person,
                        type,
                        created_at,
                        updated_at,
                        ended_at
                    ) VALUES (
                        v_task_uuid,
                        v_group_uuid,
                        v_person_uuid,
                        'WATCHER',
                        v_assignment_created_at,
                        v_assignment_updated_at,
                        NULL
                    );
                END IF;
            END LOOP;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'Successfully created 1000 TASK tickets';
    
END $$;

COMMIT;
