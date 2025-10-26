-- Script: problems.sql
-- Description: Generation of 3000 PROBLEM tickets for testing purposes
-- Date: 2025-10-26
-- Structure: Problems with various statuses, assignments, impacts, urgencies, and configurations

-- ============================================================================
-- SECTION: PROBLEM TICKETS GENERATION
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_person_uuid UUID;
    v_writer_uuid UUID;
    v_requested_by_uuid UUID;
    v_requested_for_uuid UUID;
    v_group_uuid UUID;
    v_assigned_person_uuid UUID;
    v_ci_uuid UUID;
    v_problem_uuid UUID;
    v_status_code VARCHAR(50);
    v_title TEXT;
    v_description TEXT;
    v_counter INTEGER := 0;
    v_random_val FLOAT;
    v_problem_statuses VARCHAR(50)[];
    v_status_count INTEGER;
    v_created_at TIMESTAMP WITH TIME ZONE;
    v_updated_at TIMESTAMP WITH TIME ZONE;
    v_closed_at TIMESTAMP WITH TIME ZONE;
    v_assignment_created_at TIMESTAMP WITH TIME ZONE;
    v_assignment_updated_at TIMESTAMP WITH TIME ZONE;
    v_assignment_ended_at TIMESTAMP WITH TIME ZONE;
    v_impact_code VARCHAR(50);
    v_urgency_code VARCHAR(50);
    v_problem_category_code VARCHAR(50);
    v_service_uuid UUID;
    v_core_extended_attributes JSONB;
    v_impacts VARCHAR(50)[];
    v_urgencies VARCHAR(50)[];
    v_problem_categories VARCHAR(50)[];
BEGIN
    -- Get all existing PROBLEM statuses
    SELECT ARRAY_AGG(code) INTO v_problem_statuses
    FROM configuration.ticket_status
    WHERE rel_ticket_type = 'PROBLEM';
    
    v_status_count := array_length(v_problem_statuses, 1);
    
    IF v_status_count IS NULL OR v_status_count = 0 THEN
        RAISE EXCEPTION 'No PROBLEM statuses found in configuration.ticket_status';
    END IF;
    
    RAISE NOTICE 'Found % PROBLEM statuses: %', v_status_count, v_problem_statuses;
    
    -- Get all impacts, urgencies, and problem categories
    SELECT ARRAY_AGG(code) INTO v_impacts
    FROM configuration.incident_setup_codes
    WHERE metadata = 'IMPACT';
    
    SELECT ARRAY_AGG(code) INTO v_urgencies
    FROM configuration.incident_setup_codes
    WHERE metadata = 'URGENCY';
    
    SELECT ARRAY_AGG(code) INTO v_problem_categories
    FROM configuration.problem_categories;
    
    RAISE NOTICE 'Found % impacts, % urgencies, % problem categories',
        array_length(v_impacts, 1), array_length(v_urgencies, 1), array_length(v_problem_categories, 1);
    
    -- Get a default writer (first person in database)
    SELECT uuid INTO v_writer_uuid FROM configuration.persons LIMIT 1;
    
    -- Problem titles and descriptions templates
    FOR v_counter IN 1..3000 LOOP
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
        
        -- Randomly select a person for assignment (60% chance)
        v_random_val := random();
        IF v_random_val > 0.4 THEN
            SELECT uuid INTO v_assigned_person_uuid 
            FROM configuration.persons 
            ORDER BY random() 
            LIMIT 1;
        ELSE
            v_assigned_person_uuid := NULL;
        END IF;
        
        -- Randomly select a configuration item (70% chance - problems often have CI)
        v_random_val := random();
        IF v_random_val > 0.3 THEN
            SELECT uuid INTO v_ci_uuid 
            FROM data.configuration_items 
            ORDER BY random() 
            LIMIT 1;
        ELSE
            v_ci_uuid := NULL;
        END IF;
        
        -- Randomly select a service (40% chance)
        v_random_val := random();
        IF v_random_val > 0.6 THEN
            SELECT uuid INTO v_service_uuid 
            FROM data.services 
            ORDER BY random() 
            LIMIT 1;
        ELSE
            v_service_uuid := NULL;
        END IF;
        
        -- Randomly select a status from existing PROBLEM statuses
        v_status_code := v_problem_statuses[1 + floor(random() * v_status_count)::INTEGER];
        
        -- Randomly select impact and urgency
        v_impact_code := v_impacts[1 + floor(random() * array_length(v_impacts, 1))::INTEGER];
        v_urgency_code := v_urgencies[1 + floor(random() * array_length(v_urgencies, 1))::INTEGER];
        
        -- Randomly select problem category
        v_problem_category_code := v_problem_categories[1 + floor(random() * array_length(v_problem_categories, 1))::INTEGER];
        
        -- Generate problem title and description based on counter
        CASE (v_counter % 30)
            WHEN 0 THEN
                v_title := 'Recurring application crashes';
                v_description := 'Application crashes multiple times per day affecting productivity. Root cause investigation required.';
            WHEN 1 THEN
                v_title := 'Database performance degradation';
                v_description := 'Database queries becoming progressively slower over time. Pattern analysis needed.';
            WHEN 2 THEN
                v_title := 'Email delivery delays';
                v_description := 'Systematic delays in email delivery. Multiple incidents reported. Underlying cause unknown.';
            WHEN 3 THEN
                v_title := 'Network latency spikes';
                v_description := 'Periodic network latency spikes affecting multiple services. Pattern investigation ongoing.';
            WHEN 4 THEN
                v_title := 'Memory leaks in production';
                v_description := 'Servers experiencing memory leaks requiring daily restarts. Root cause analysis needed.';
            WHEN 5 THEN
                v_title := 'Authentication failures pattern';
                v_description := 'Pattern of authentication failures during peak hours. Systematic issue suspected.';
            WHEN 6 THEN
                v_title := 'Backup failures recurring';
                v_description := 'Backup jobs failing intermittently. Common pattern across multiple servers.';
            WHEN 7 THEN
                v_title := 'API timeout issues';
                v_description := 'API endpoints timing out under load. Architectural review required.';
            WHEN 8 THEN
                v_title := 'Data synchronization errors';
                v_description := 'Recurring data sync errors between primary and secondary systems. Root cause unknown.';
            WHEN 9 THEN
                v_title := 'Certificate renewal failures';
                v_description := 'Automated certificate renewal process failing. Multiple services affected.';
            WHEN 10 THEN
                v_title := 'Disk space exhaustion pattern';
                v_description := 'Servers running out of disk space faster than expected. Log analysis needed.';
            WHEN 11 THEN
                v_title := 'Load balancer instability';
                v_description := 'Load balancer showing unstable behavior. Traffic distribution issues.';
            WHEN 12 THEN
                v_title := 'Cache invalidation issues';
                v_description := 'Cache not invalidating properly causing stale data. Design flaw suspected.';
            WHEN 13 THEN
                v_title := 'Session timeout problems';
                v_description := 'Users experiencing premature session timeouts. Configuration issue suspected.';
            WHEN 14 THEN
                v_title := 'Report generation slowness';
                v_description := 'Report generation taking increasingly longer. Performance optimization needed.';
            WHEN 15 THEN
                v_title := 'Mobile app sync failures';
                v_description := 'Mobile app failing to sync data reliably. Protocol issue suspected.';
            WHEN 16 THEN
                v_title := 'Search indexing delays';
                v_description := 'Search index updates delayed causing outdated results. Indexing strategy review needed.';
            WHEN 17 THEN
                v_title := 'File upload failures';
                v_description := 'Large file uploads failing intermittently. Size limit or timeout issue suspected.';
            WHEN 18 THEN
                v_title := 'Notification delivery gaps';
                v_description := 'System notifications not delivered reliably. Message queue issue suspected.';
            WHEN 19 THEN
                v_title := 'Password policy conflicts';
                v_description := 'Password policy causing lockouts. Policy review and adjustment needed.';
            WHEN 20 THEN
                v_title := 'Integration failures pattern';
                v_description := 'Third-party integrations failing periodically. API compatibility issue suspected.';
            WHEN 21 THEN
                v_title := 'Monitoring blind spots';
                v_description := 'Critical services not properly monitored. Monitoring coverage gaps identified.';
            WHEN 22 THEN
                v_title := 'Logging inconsistencies';
                v_description := 'Application logs missing critical information. Logging framework issue.';
            WHEN 23 THEN
                v_title := 'Deployment rollback issues';
                v_description := 'Deployment rollback process unreliable. Process improvement needed.';
            WHEN 24 THEN
                v_title := 'Configuration drift detected';
                v_description := 'Server configurations drifting from standard. Configuration management issue.';
            WHEN 25 THEN
                v_title := 'Security scan false positives';
                v_description := 'Security scans generating excessive false positives. Tuning required.';
            WHEN 26 THEN
                v_title := 'Resource allocation inefficiency';
                v_description := 'Resources not allocated efficiently causing waste. Optimization opportunity.';
            WHEN 27 THEN
                v_title := 'Dependency version conflicts';
                v_description := 'Library version conflicts causing compatibility issues. Dependency management needed.';
            WHEN 28 THEN
                v_title := 'Concurrent access issues';
                v_description := 'Race conditions under concurrent access. Locking mechanism review needed.';
            ELSE
                v_title := 'System architecture limitation';
                v_description := 'Current architecture reaching limits. Scalability review and redesign needed.';
        END CASE;
        
        -- Generate coherent dates: created -> updated -> closed
        v_created_at := CURRENT_TIMESTAMP - (random() * INTERVAL '365 days');
        v_updated_at := v_created_at + (random() * INTERVAL '180 days');
        
        IF v_status_code IN ('COMPLETED', 'CANCELLED', 'CLOSED', 'RESOLVED') THEN
            v_closed_at := v_updated_at + (random() * INTERVAL '60 days');
        ELSE
            v_closed_at := NULL;
        END IF;
        
        -- Build core_extended_attributes JSONB
        v_core_extended_attributes := jsonb_build_object(
            'impact', v_impact_code,
            'urgency', v_urgency_code,
            'rel_problem_categories_code', v_problem_category_code
        );
        
        -- Add optional fields to JSONB
        IF v_service_uuid IS NOT NULL THEN
            v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object('rel_service', v_service_uuid::TEXT);
        END IF;
        
        -- Add symptoms description (70% chance)
        v_random_val := random();
        IF v_random_val > 0.3 THEN
            v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object(
                'symptoms_description', 
                'Multiple related incidents showing similar symptoms. Pattern analysis indicates systematic issue.'
            );
        END IF;
        
        -- Add workaround (50% chance)
        v_random_val := random();
        IF v_random_val > 0.5 THEN
            v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object(
                'workaround', 
                'Temporary workaround implemented: restart service daily until permanent fix deployed.'
            );
        END IF;
        
        -- Add root cause for closed problems (80% chance)
        IF v_status_code IN ('COMPLETED', 'CLOSED', 'RESOLVED') THEN
            v_random_val := random();
            IF v_random_val > 0.2 THEN
                v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object(
                    'root_cause', 
                    'Root cause identified: configuration error in production environment causing resource contention.'
                );
            END IF;
        END IF;
        
        -- Add definitive solution for closed problems (75% chance)
        IF v_status_code IN ('COMPLETED', 'CLOSED', 'RESOLVED') THEN
            v_random_val := random();
            IF v_random_val > 0.25 THEN
                v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object(
                    'definitive_solution', 
                    'Permanent solution implemented: updated configuration, deployed patch, and added monitoring.'
                );
            END IF;
        END IF;
        
        -- Add target resolution date (60% chance)
        v_random_val := random();
        IF v_random_val > 0.4 THEN
            v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object(
                'target_resolution_date', 
                (v_created_at + INTERVAL '90 days')::TEXT
            );
        END IF;
        
        -- Add actual resolution date for closed problems
        IF v_status_code IN ('COMPLETED', 'CLOSED', 'RESOLVED') THEN
            v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object(
                'actual_resolution_date', 
                v_closed_at::TEXT
            );
            
            -- Add actual workload (hours)
            v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object(
                'actual_resolution_workload', 
                (10 + floor(random() * 200))::INTEGER
            );
        END IF;
        
        -- Add closure justification for closed problems
        IF v_status_code IN ('COMPLETED', 'CANCELLED', 'CLOSED', 'RESOLVED') THEN
            v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object(
                'closure_justification', 
                'Problem resolved with permanent fix deployed. No further incidents reported.'
            );
        END IF;
        
        -- Insert the problem ticket
        INSERT INTO core.tickets (
            title,
            description,
            configuration_item_uuid,
            requested_by_uuid,
            requested_for_uuid,
            writer_uuid,
            ticket_type_code,
            ticket_status_code,
            core_extended_attributes,
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
            'PROBLEM',
            v_status_code,
            v_core_extended_attributes,
            v_created_at,
            v_updated_at,
            v_closed_at
        )
        RETURNING uuid INTO v_problem_uuid;
        
        -- Create assignment relation if group is selected with coherent dates
        IF v_group_uuid IS NOT NULL THEN
            -- Assignment dates: created slightly after ticket creation, updated after assignment creation, ended at ticket close
            v_assignment_created_at := v_created_at + (random() * INTERVAL '8 hours');
            v_assignment_updated_at := v_assignment_created_at + (random() * INTERVAL '150 days');
            -- Ensure updated_at doesn't exceed ticket's updated_at
            IF v_assignment_updated_at > v_updated_at THEN
                v_assignment_updated_at := v_updated_at;
            END IF;
            
            IF v_status_code IN ('COMPLETED', 'CANCELLED', 'CLOSED', 'RESOLVED') THEN
                v_assignment_ended_at := v_closed_at;
                -- Ensure ended_at is after created_at (constraint requirement)
                IF v_assignment_ended_at <= v_assignment_created_at THEN
                    v_assignment_ended_at := v_assignment_created_at + INTERVAL '1 hour';
                END IF;
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
                v_problem_uuid,
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
        IF v_random_val > 0.80 THEN
            FOR i IN 1..(1 + floor(random() * 3)::INTEGER) LOOP
                SELECT uuid INTO v_person_uuid 
                FROM configuration.persons 
                WHERE uuid NOT IN (v_requested_by_uuid, v_requested_for_uuid, v_assigned_person_uuid)
                ORDER BY random() 
                LIMIT 1;
                
                IF v_person_uuid IS NOT NULL THEN
                    -- Watcher dates: created after ticket creation, updated after watcher creation
                    v_assignment_created_at := v_created_at + (random() * INTERVAL '30 days');
                    v_assignment_updated_at := v_assignment_created_at + (random() * INTERVAL '120 days');
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
                        v_problem_uuid,
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
        
        -- Progress notification every 500 problems
        IF v_counter % 500 = 0 THEN
            RAISE NOTICE 'Created % problems...', v_counter;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'Successfully created 3000 PROBLEM tickets';
    
END $$;
