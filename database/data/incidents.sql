-- Script: incidents.sql
-- Description: Generation of 3000 INCIDENT tickets for testing purposes
-- Date: 2025-10-24
-- Structure: Incidents with various statuses, assignments, impacts, urgencies, and configurations

-- ============================================================================
-- SECTION: INCIDENT TICKETS GENERATION
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
    v_incident_uuid UUID;
    v_status_code VARCHAR(50);
    v_title TEXT;
    v_description TEXT;
    v_counter INTEGER := 0;
    v_random_val FLOAT;
    v_incident_statuses VARCHAR(50)[];
    v_status_count INTEGER;
    v_created_at TIMESTAMP WITH TIME ZONE;
    v_updated_at TIMESTAMP WITH TIME ZONE;
    v_closed_at TIMESTAMP WITH TIME ZONE;
    v_assignment_created_at TIMESTAMP WITH TIME ZONE;
    v_assignment_updated_at TIMESTAMP WITH TIME ZONE;
    v_assignment_ended_at TIMESTAMP WITH TIME ZONE;
    v_impact_code VARCHAR(50);
    v_urgency_code VARCHAR(50);
    v_priority INTEGER;
    v_cause_code VARCHAR(50);
    v_resolution_code VARCHAR(50);
    v_contact_type VARCHAR(50);
    v_symptom_uuid UUID;
    v_service_uuid UUID;
    v_core_extended_attributes JSONB;
    v_impacts VARCHAR(50)[];
    v_urgencies VARCHAR(50)[];
    v_cause_codes VARCHAR(50)[];
    v_resolution_codes VARCHAR(50)[];
    v_contact_types VARCHAR(50)[];
BEGIN
    -- Get all existing INCIDENT statuses
    SELECT ARRAY_AGG(code) INTO v_incident_statuses
    FROM configuration.ticket_status
    WHERE rel_ticket_type = 'INCIDENT';
    
    v_status_count := array_length(v_incident_statuses, 1);
    
    IF v_status_count IS NULL OR v_status_count = 0 THEN
        RAISE EXCEPTION 'No INCIDENT statuses found in configuration.ticket_status';
    END IF;
    
    RAISE NOTICE 'Found % INCIDENT statuses: %', v_status_count, v_incident_statuses;
    
    -- Get all impacts, urgencies, cause codes, resolution codes, contact types
    SELECT ARRAY_AGG(code) INTO v_impacts
    FROM configuration.incident_setup_codes
    WHERE metadata = 'IMPACT';
    
    SELECT ARRAY_AGG(code) INTO v_urgencies
    FROM configuration.incident_setup_codes
    WHERE metadata = 'URGENCY';
    
    SELECT ARRAY_AGG(code) INTO v_cause_codes
    FROM configuration.incident_setup_codes
    WHERE metadata = 'CAUSE_CODE';
    
    SELECT ARRAY_AGG(code) INTO v_resolution_codes
    FROM configuration.incident_setup_codes
    WHERE metadata = 'RESOLUTION_CODE';
    
    SELECT ARRAY_AGG(code) INTO v_contact_types
    FROM configuration.contact_types;
    
    RAISE NOTICE 'Found % impacts, % urgencies, % cause codes, % resolution codes, % contact types',
        array_length(v_impacts, 1), array_length(v_urgencies, 1), array_length(v_cause_codes, 1),
        array_length(v_resolution_codes, 1), array_length(v_contact_types, 1);
    
    -- Get a default writer (first person in database)
    SELECT uuid INTO v_writer_uuid FROM configuration.persons LIMIT 1;
    
    -- Incident titles and descriptions templates
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
        
        -- Randomly select a configuration item (80% chance - incidents usually have CI)
        v_random_val := random();
        IF v_random_val > 0.2 THEN
            SELECT uuid INTO v_ci_uuid 
            FROM data.configuration_items 
            ORDER BY random() 
            LIMIT 1;
        ELSE
            v_ci_uuid := NULL;
        END IF;
        
        -- Randomly select a symptom (70% chance)
        v_random_val := random();
        IF v_random_val > 0.3 THEN
            SELECT uuid INTO v_symptom_uuid 
            FROM configuration.symptoms 
            ORDER BY random() 
            LIMIT 1;
        ELSE
            v_symptom_uuid := NULL;
        END IF;
        
        -- Randomly select a service (50% chance)
        v_random_val := random();
        IF v_random_val > 0.5 THEN
            SELECT uuid INTO v_service_uuid 
            FROM data.services 
            ORDER BY random() 
            LIMIT 1;
        ELSE
            v_service_uuid := NULL;
        END IF;
        
        -- Randomly select a status from existing INCIDENT statuses
        v_status_code := v_incident_statuses[1 + floor(random() * v_status_count)::INTEGER];
        
        -- Randomly select impact and urgency
        v_impact_code := v_impacts[1 + floor(random() * array_length(v_impacts, 1))::INTEGER];
        v_urgency_code := v_urgencies[1 + floor(random() * array_length(v_urgencies, 1))::INTEGER];
        
        -- Calculate priority based on impact and urgency (simplified)
        -- ENTERPRISE/CRITICAL -> P1, DEPARTMENT/HIGH -> P2, etc.
        IF v_impact_code = 'ENTERPRISE' AND v_urgency_code = 'CRITICAL' THEN
            v_priority := 1;
        ELSIF v_impact_code IN ('ENTERPRISE', 'DEPARTMENT') AND v_urgency_code IN ('CRITICAL', 'HIGH') THEN
            v_priority := 2;
        ELSIF v_impact_code IN ('DEPARTMENT', 'WORKGROUP') AND v_urgency_code IN ('HIGH', 'MEDIUM') THEN
            v_priority := 3;
        ELSIF v_impact_code IN ('WORKGROUP', 'USER') AND v_urgency_code IN ('MEDIUM', 'LOW') THEN
            v_priority := 4;
        ELSE
            v_priority := 5;
        END IF;
        
        -- Randomly select contact type
        v_contact_type := v_contact_types[1 + floor(random() * array_length(v_contact_types, 1))::INTEGER];
        
        -- For closed incidents, select cause and resolution codes
        IF v_status_code IN ('COMPLETED', 'CANCELLED', 'CLOSED', 'RESOLVED') THEN
            v_cause_code := v_cause_codes[1 + floor(random() * array_length(v_cause_codes, 1))::INTEGER];
            v_resolution_code := v_resolution_codes[1 + floor(random() * array_length(v_resolution_codes, 1))::INTEGER];
        ELSE
            v_cause_code := NULL;
            v_resolution_code := NULL;
        END IF;
        
        -- Generate incident title and description based on counter
        CASE (v_counter % 30)
            WHEN 0 THEN
                v_title := 'Application server not responding';
                v_description := 'The main application server is not responding to requests. Users are unable to access the application.';
            WHEN 1 THEN
                v_title := 'Database connection timeout';
                v_description := 'Database queries are timing out causing application errors and slow performance.';
            WHEN 2 THEN
                v_title := 'Email service down';
                v_description := 'Email service is not working. Users cannot send or receive emails.';
            WHEN 3 THEN
                v_title := 'Network connectivity issues';
                v_description := 'Intermittent network connectivity issues affecting multiple users in building A.';
            WHEN 4 THEN
                v_title := 'Printer not working';
                v_description := 'Office printer on floor 3 is not printing. Paper jam error displayed.';
            WHEN 5 THEN
                v_title := 'VPN connection failure';
                v_description := 'Remote users unable to connect to VPN. Authentication errors reported.';
            WHEN 6 THEN
                v_title := 'Website loading slowly';
                v_description := 'Company website is loading very slowly. Page load times exceeding 30 seconds.';
            WHEN 7 THEN
                v_title := 'File server inaccessible';
                v_description := 'Shared file server is not accessible. Users getting "network path not found" error.';
            WHEN 8 THEN
                v_title := 'Software license expired';
                v_description := 'Software license has expired preventing users from accessing the application.';
            WHEN 9 THEN
                v_title := 'Login page not loading';
                v_description := 'Application login page returns 500 error. Users cannot authenticate.';
            WHEN 10 THEN
                v_title := 'Backup job failed';
                v_description := 'Nightly backup job failed with error code 0x80070005. Data not backed up.';
            WHEN 11 THEN
                v_title := 'Disk space critical';
                v_description := 'Server disk space at 98% capacity. System performance degraded.';
            WHEN 12 THEN
                v_title := 'SSL certificate expired';
                v_description := 'SSL certificate for main website has expired. Browser showing security warning.';
            WHEN 13 THEN
                v_title := 'API service unavailable';
                v_description := 'REST API service returning 503 errors. Mobile app cannot connect.';
            WHEN 14 THEN
                v_title := 'Memory leak detected';
                v_description := 'Application server showing memory leak. Memory usage increasing continuously.';
            WHEN 15 THEN
                v_title := 'Firewall blocking traffic';
                v_description := 'Firewall rules blocking legitimate traffic to new service endpoint.';
            WHEN 16 THEN
                v_title := 'Password reset not working';
                v_description := 'Password reset functionality not sending emails. Users locked out of accounts.';
            WHEN 17 THEN
                v_title := 'Data synchronization failed';
                v_description := 'Data sync between primary and backup servers failed. Data inconsistency detected.';
            WHEN 18 THEN
                v_title := 'Mobile app crashing';
                v_description := 'Mobile application crashing on startup for iOS users. Error code 0xC0000005.';
            WHEN 19 THEN
                v_title := 'Load balancer malfunction';
                v_description := 'Load balancer not distributing traffic evenly. One server overloaded.';
            WHEN 20 THEN
                v_title := 'Antivirus blocking application';
                v_description := 'Antivirus software quarantining application executable as false positive.';
            WHEN 21 THEN
                v_title := 'Report generation failing';
                v_description := 'Scheduled reports not generating. Report service showing error in logs.';
            WHEN 22 THEN
                v_title := 'Search functionality broken';
                v_description := 'Search feature returning no results. Search index appears corrupted.';
            WHEN 23 THEN
                v_title := 'Video conference system down';
                v_description := 'Video conferencing system not working. Users cannot join meetings.';
            WHEN 24 THEN
                v_title := 'Payment gateway timeout';
                v_description := 'Payment processing timing out. Customers unable to complete transactions.';
            WHEN 25 THEN
                v_title := 'Monitoring alerts not sending';
                v_description := 'System monitoring alerts not being sent to operations team.';
            WHEN 26 THEN
                v_title := 'Cache server down';
                v_description := 'Redis cache server not responding. Application performance severely degraded.';
            WHEN 27 THEN
                v_title := 'Log files filling disk';
                v_description := 'Application generating excessive logs filling up disk space rapidly.';
            WHEN 28 THEN
                v_title := 'Authentication service slow';
                v_description := 'Authentication service responding slowly. Login times exceeding 2 minutes.';
            ELSE
                v_title := 'System performance degraded';
                v_description := 'Overall system performance degraded. Multiple users reporting slowness.';
        END CASE;
        
        -- Generate coherent dates: created -> updated -> closed
        v_created_at := CURRENT_TIMESTAMP - (random() * INTERVAL '180 days');
        v_updated_at := v_created_at + (random() * INTERVAL '90 days');
        
        IF v_status_code IN ('COMPLETED', 'CANCELLED', 'CLOSED', 'RESOLVED') THEN
            v_closed_at := v_updated_at + (random() * INTERVAL '30 days');
        ELSE
            v_closed_at := NULL;
        END IF;
        
        -- Build core_extended_attributes JSONB
        v_core_extended_attributes := jsonb_build_object(
            'impact', v_impact_code,
            'urgency', v_urgency_code,
            'priority', v_priority,
            'contact_type', v_contact_type,
            'reopen_count', floor(random() * 3)::INTEGER,
            'standby_count', floor(random() * 2)::INTEGER,
            'assignment_count', floor(random() * 5 + 1)::INTEGER,
            'assignment_to_count', floor(random() * 3)::INTEGER
        );
        
        -- Add optional fields to JSONB
        IF v_symptom_uuid IS NOT NULL THEN
            v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object('symptoms_uuid', v_symptom_uuid::TEXT);
        END IF;
        
        IF v_service_uuid IS NOT NULL THEN
            v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object('rel_service', v_service_uuid::TEXT);
        END IF;
        
        IF v_cause_code IS NOT NULL THEN
            v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object('cause_code', v_cause_code);
        END IF;
        
        IF v_resolution_code IS NOT NULL THEN
            v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object('resolution_code', v_resolution_code);
            v_core_extended_attributes := v_core_extended_attributes || jsonb_build_object('resolution_notes', 'Issue resolved. Root cause identified and fixed.');
        END IF;
        
        -- Insert the incident ticket
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
            'INCIDENT',
            v_status_code,
            v_core_extended_attributes,
            v_created_at,
            v_updated_at,
            v_closed_at
        )
        RETURNING uuid INTO v_incident_uuid;
        
        -- Create assignment relation if group is selected with coherent dates
        IF v_group_uuid IS NOT NULL THEN
            -- Assignment dates: created slightly after ticket creation, updated after assignment creation, ended at ticket close
            v_assignment_created_at := v_created_at + (random() * INTERVAL '4 hours');
            v_assignment_updated_at := v_assignment_created_at + (random() * INTERVAL '80 days');
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
                v_incident_uuid,
                v_group_uuid,
                v_assigned_person_uuid,
                'ASSIGNED',
                v_assignment_created_at,
                v_assignment_updated_at,
                v_assignment_ended_at
            );
        END IF;
        
        -- Add watchers (15% chance, 1-2 watchers)
        v_random_val := random();
        IF v_random_val > 0.85 THEN
            FOR i IN 1..(1 + floor(random() * 2)::INTEGER) LOOP
                SELECT uuid INTO v_person_uuid 
                FROM configuration.persons 
                WHERE uuid NOT IN (v_requested_by_uuid, v_requested_for_uuid, v_assigned_person_uuid)
                ORDER BY random() 
                LIMIT 1;
                
                IF v_person_uuid IS NOT NULL THEN
                    -- Watcher dates: created after ticket creation, updated after watcher creation
                    v_assignment_created_at := v_created_at + (random() * INTERVAL '20 days');
                    v_assignment_updated_at := v_assignment_created_at + (random() * INTERVAL '60 days');
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
                        v_incident_uuid,
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
        
        -- Progress notification every 500 incidents
        IF v_counter % 500 = 0 THEN
            RAISE NOTICE 'Created % incidents...', v_counter;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'Successfully created 3000 INCIDENT tickets';
    
END $$;

COMMIT;
