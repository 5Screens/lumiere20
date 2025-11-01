-- Script: defects.sql
-- Description: Generation of 3000 DEFECT tickets for testing purposes
-- Date: 2025-11-01
-- Structure: Defects with various statuses, severities, environments, and linked to projects

-- ============================================================================
-- SECTION: DEFECT TICKETS GENERATION
-- ============================================================================

DO $$
DECLARE
    v_person_uuid UUID;
    v_writer_uuid UUID;
    v_requested_by_uuid UUID;
    v_requested_for_uuid UUID;
    v_group_uuid UUID;
    v_assigned_person_uuid UUID;
    v_defect_uuid UUID;
    v_project_uuid UUID;
    v_status_code VARCHAR(50);
    v_severity_code VARCHAR(50);
    v_environment_code VARCHAR(50);
    v_impact_area_code VARCHAR(50);
    v_title TEXT;
    v_description TEXT;
    v_steps_to_reproduce TEXT;
    v_expected_behavior TEXT;
    v_workaround TEXT;
    v_counter INTEGER := 0;
    v_random_val FLOAT;
    v_defect_statuses VARCHAR(50)[];
    v_status_count INTEGER;
    v_created_at TIMESTAMP WITH TIME ZONE;
    v_updated_at TIMESTAMP WITH TIME ZONE;
    v_closed_at TIMESTAMP WITH TIME ZONE;
    v_assignment_created_at TIMESTAMP WITH TIME ZONE;
    v_assignment_updated_at TIMESTAMP WITH TIME ZONE;
    v_assignment_ended_at TIMESTAMP WITH TIME ZONE;
    v_core_extended_attributes JSONB;
    v_tags JSONB;
    v_project_count INTEGER;
    v_severities VARCHAR(50)[];
    v_environments VARCHAR(50)[];
    v_impact_areas VARCHAR(50)[];
BEGIN
    -- Get all existing DEFECT statuses
    SELECT ARRAY_AGG(code) INTO v_defect_statuses
    FROM configuration.ticket_status
    WHERE rel_ticket_type = 'DEFECT';
    
    v_status_count := array_length(v_defect_statuses, 1);
    
    -- Get defect setup codes
    SELECT ARRAY_AGG(code) INTO v_severities
    FROM configuration.defect_setup_codes
    WHERE metadata = 'SEVERITY';
    
    SELECT ARRAY_AGG(code) INTO v_environments
    FROM configuration.defect_setup_codes
    WHERE metadata = 'ENVIRONMENT';
    
    SELECT ARRAY_AGG(code) INTO v_impact_areas
    FROM configuration.defect_setup_codes
    WHERE metadata = 'IMPACT';
    
    -- Get count of existing projects
    SELECT COUNT(*) INTO v_project_count
    FROM core.tickets
    WHERE ticket_type_code = 'PROJECT';
    
    RAISE NOTICE 'Starting generation of 3000 DEFECT tickets...';
    RAISE NOTICE 'Found % defect statuses', v_status_count;
    RAISE NOTICE 'Found % severities', array_length(v_severities, 1);
    RAISE NOTICE 'Found % environments', array_length(v_environments, 1);
    RAISE NOTICE 'Found % impact areas', array_length(v_impact_areas, 1);
    RAISE NOTICE 'Found % existing projects', v_project_count;
    
    -- Generate 3000 DEFECT tickets
    FOR i IN 1..3000 LOOP
        -- Select random persons for different roles
        SELECT uuid INTO v_writer_uuid FROM configuration.persons ORDER BY RANDOM() LIMIT 1;
        SELECT uuid INTO v_requested_by_uuid FROM configuration.persons ORDER BY RANDOM() LIMIT 1;
        SELECT uuid INTO v_requested_for_uuid FROM configuration.persons ORDER BY RANDOM() LIMIT 1;
        
        -- Select random group and person for assignment
        SELECT uuid INTO v_group_uuid FROM configuration.groups ORDER BY RANDOM() LIMIT 1;
        SELECT uuid INTO v_assigned_person_uuid 
        FROM configuration.persons 
        WHERE uuid IN (
            SELECT rel_member FROM configuration.rel_persons_groups WHERE rel_group = v_group_uuid
        )
        ORDER BY RANDOM() LIMIT 1;
        
        -- Select random project to link defect to (70% chance of having a project)
        IF RANDOM() < 0.7 AND v_project_count > 0 THEN
            SELECT uuid INTO v_project_uuid 
            FROM core.tickets 
            WHERE ticket_type_code = 'PROJECT' 
            ORDER BY RANDOM() LIMIT 1;
        ELSE
            v_project_uuid := NULL;
        END IF;
        
        -- Select random status
        v_random_val := RANDOM();
        v_status_code := v_defect_statuses[1 + FLOOR(v_random_val * v_status_count)];
        
        -- Select random severity, environment, and impact area
        v_severity_code := v_severities[1 + FLOOR(RANDOM() * array_length(v_severities, 1))];
        v_environment_code := v_environments[1 + FLOOR(RANDOM() * array_length(v_environments, 1))];
        v_impact_area_code := v_impact_areas[1 + FLOOR(RANDOM() * array_length(v_impact_areas, 1))];
        
        -- Generate timestamps (defects created over the last year)
        v_created_at := NOW() - (RANDOM() * INTERVAL '365 days');
        v_updated_at := v_created_at + (RANDOM() * INTERVAL '60 days');
        
        -- Closed date for resolved defects
        IF v_status_code IN ('CLOSED', 'RESOLVED', 'VERIFIED', 'REJECTED') THEN
            v_closed_at := v_updated_at + (RANDOM() * INTERVAL '14 days');
        ELSE
            v_closed_at := NULL;
        END IF;
        
        -- Generate title based on severity and type
        v_title := 
            CASE 
                WHEN RANDOM() < 0.2 THEN 'UI Issue: '
                WHEN RANDOM() < 0.4 THEN 'Performance Problem: '
                WHEN RANDOM() < 0.6 THEN 'Data Inconsistency: '
                WHEN RANDOM() < 0.8 THEN 'Functionality Error: '
                ELSE 'System Crash: '
            END ||
            CASE 
                WHEN RANDOM() < 0.25 THEN 'Login page not responding'
                WHEN RANDOM() < 0.5 THEN 'Report generation fails'
                WHEN RANDOM() < 0.75 THEN 'Data export incomplete'
                ELSE 'Search function returns wrong results'
            END ||
            ' [' || v_severity_code || ']';
        
        -- Generate description
        v_description := '<p><strong>Summary:</strong></p>' ||
            '<p>This defect was identified in the ' || v_environment_code || ' environment.</p>' ||
            '<p><strong>Severity:</strong> ' || v_severity_code || '</p>' ||
            '<p><strong>Impact Area:</strong> ' || v_impact_area_code || '</p>' ||
            '<p><strong>Affected Users:</strong> ' || 
            CASE 
                WHEN v_severity_code IN ('CRITICAL', 'HIGH') THEN 'Multiple users affected'
                WHEN v_severity_code = 'MEDIUM' THEN 'Some users affected'
                ELSE 'Few users affected'
            END || '</p>';
        
        -- Generate steps to reproduce
        v_steps_to_reproduce := '<ol>' ||
            '<li>Navigate to the affected page or module</li>' ||
            '<li>Perform the action that triggers the defect</li>' ||
            '<li>Observe the unexpected behavior</li>' ||
            '<li>Verify the issue is reproducible</li>' ||
            '</ol>';
        
        -- Generate expected behavior
        v_expected_behavior := '<p>The system should function correctly without errors. ' ||
            'All data should be processed accurately and displayed properly to the user.</p>';
        
        -- Generate workaround (50% chance)
        IF RANDOM() < 0.5 THEN
            v_workaround := '<p><strong>Temporary Workaround:</strong></p>' ||
                '<p>' ||
                CASE 
                    WHEN RANDOM() < 0.33 THEN 'Use alternative navigation path to avoid the issue.'
                    WHEN RANDOM() < 0.66 THEN 'Clear browser cache and retry the operation.'
                    ELSE 'Contact support for manual processing.'
                END ||
                '</p>';
        ELSE
            v_workaround := NULL;
        END IF;
        
        -- Generate tags
        v_tags := jsonb_build_array(
            CASE WHEN RANDOM() < 0.3 THEN 'bug' ELSE NULL END,
            CASE WHEN RANDOM() < 0.3 THEN 'ui' ELSE NULL END,
            CASE WHEN RANDOM() < 0.3 THEN 'performance' ELSE NULL END,
            CASE WHEN RANDOM() < 0.3 THEN 'data-quality' ELSE NULL END,
            CASE WHEN RANDOM() < 0.3 THEN 'regression' ELSE NULL END
        );
        
        -- Remove null values from tags
        v_tags := (
            SELECT jsonb_agg(elem)
            FROM jsonb_array_elements(v_tags) elem
            WHERE elem IS NOT NULL AND elem::text != 'null'
        );
        
        -- Build core_extended_attributes JSONB
        v_core_extended_attributes := jsonb_build_object(
            'severity', v_severity_code,
            'environment', v_environment_code,
            'impact_area', v_impact_area_code,
            'steps_to_reproduce', v_steps_to_reproduce,
            'expected_behavior', v_expected_behavior,
            'tags', COALESCE(v_tags, '[]'::jsonb)
        );
        
        -- Add workaround if exists
        IF v_workaround IS NOT NULL THEN
            v_core_extended_attributes := v_core_extended_attributes || 
                jsonb_build_object('workaround', v_workaround);
        END IF;
        
        -- Insert DEFECT ticket
        INSERT INTO core.tickets (
            uuid,
            title,
            description,
            ticket_type_code,
            ticket_status_code,
            requested_by_uuid,
            requested_for_uuid,
            writer_uuid,
            configuration_item_uuid,
            core_extended_attributes,
            user_extended_attributes,
            created_at,
            updated_at,
            closed_at
        ) VALUES (
            uuid_generate_v4(),
            v_title,
            v_description,
            'DEFECT',
            v_status_code,
            v_requested_by_uuid,
            v_requested_for_uuid,
            v_writer_uuid,
            NULL,  -- Defects typically don't have a CI initially
            v_core_extended_attributes,
            '{}'::jsonb,
            v_created_at,
            v_updated_at,
            v_closed_at
        ) RETURNING uuid INTO v_defect_uuid;
        
        -- Create assignment relation (ASSIGNED type)
        v_assignment_created_at := v_created_at;
        v_assignment_updated_at := v_updated_at;
        
        -- End assignment if defect is closed
        IF v_closed_at IS NOT NULL THEN
            v_assignment_ended_at := v_closed_at;
        ELSE
            v_assignment_ended_at := NULL;
        END IF;
        
        INSERT INTO core.rel_tickets_groups_persons (
            uuid,
            rel_ticket,
            rel_assigned_to_group,
            rel_assigned_to_person,
            type,
            created_at,
            updated_at,
            ended_at
        ) VALUES (
            uuid_generate_v4(),
            v_defect_uuid,
            v_group_uuid,
            v_assigned_person_uuid,
            'ASSIGNED',
            v_assignment_created_at,
            v_assignment_updated_at,
            v_assignment_ended_at
        );
        
        -- Create parent-child relationship with project if applicable
        IF v_project_uuid IS NOT NULL THEN
            INSERT INTO core.rel_parent_child_tickets (
                uuid,
                rel_parent_ticket_uuid,
                rel_child_ticket_uuid,
                dependency_code,
                created_at,
                updated_at,
                ended_at
            ) VALUES (
                uuid_generate_v4(),
                v_project_uuid,
                v_defect_uuid,
                'DEFECT',
                v_created_at,
                v_updated_at,
                v_assignment_ended_at
            );
        END IF;
        
        v_counter := v_counter + 1;
        
        -- Progress indicator every 500 defects
        IF v_counter % 500 = 0 THEN
            RAISE NOTICE 'Generated % DEFECT tickets...', v_counter;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully generated % DEFECT tickets', v_counter;
    
END $$;
