-- Script: sprints.sql
-- Description: Generation of 3000 SPRINT tickets for testing purposes
-- Date: 2025-10-31
-- Structure: Sprints with various statuses, assignments, and linked to projects

-- ============================================================================
-- SECTION: SPRINT TICKETS GENERATION
-- ============================================================================

DO $$
DECLARE
    v_person_uuid UUID;
    v_writer_uuid UUID;
    v_group_uuid UUID;
    v_assigned_person_uuid UUID;
    v_sprint_uuid UUID;
    v_project_uuid UUID;
    v_status_code VARCHAR(50);
    v_title TEXT;
    v_description TEXT;
    v_counter INTEGER := 0;
    v_random_val FLOAT;
    v_sprint_statuses VARCHAR(50)[];
    v_status_count INTEGER;
    v_created_at TIMESTAMP WITH TIME ZONE;
    v_updated_at TIMESTAMP WITH TIME ZONE;
    v_closed_at TIMESTAMP WITH TIME ZONE;
    v_assignment_created_at TIMESTAMP WITH TIME ZONE;
    v_assignment_updated_at TIMESTAMP WITH TIME ZONE;
    v_assignment_ended_at TIMESTAMP WITH TIME ZONE;
    v_core_extended_attributes JSONB;
    v_start_date TIMESTAMP WITH TIME ZONE;
    v_end_date TIMESTAMP WITH TIME ZONE;
    v_actual_velocity INTEGER;
    v_estimated_velocity INTEGER;
    v_sprint_number INTEGER;
    v_project_count INTEGER;
BEGIN
    -- Get all existing SPRINT statuses
    SELECT ARRAY_AGG(code) INTO v_sprint_statuses
    FROM configuration.ticket_status
    WHERE rel_ticket_type = 'SPRINT';
    
    v_status_count := array_length(v_sprint_statuses, 1);
    
    -- Get count of existing projects
    SELECT COUNT(*) INTO v_project_count
    FROM core.tickets
    WHERE ticket_type_code = 'PROJECT';
    
    RAISE NOTICE 'Starting generation of 3000 SPRINT tickets...';
    RAISE NOTICE 'Found % sprint statuses', v_status_count;
    RAISE NOTICE 'Found % existing projects', v_project_count;
    
    -- Generate 3000 SPRINT tickets
    FOR i IN 1..3000 LOOP
        -- Select random persons for different roles
        SELECT uuid INTO v_writer_uuid FROM configuration.persons ORDER BY RANDOM() LIMIT 1;
        
        -- Select random group and person for assignment
        SELECT uuid INTO v_group_uuid FROM configuration.groups ORDER BY RANDOM() LIMIT 1;
        SELECT uuid INTO v_assigned_person_uuid 
        FROM configuration.persons 
        WHERE uuid IN (
            SELECT rel_member FROM configuration.rel_persons_groups WHERE rel_group = v_group_uuid
        )
        ORDER BY RANDOM() LIMIT 1;
        
        -- Select random project to link sprint to (80% chance of having a project)
        IF RANDOM() < 0.8 AND v_project_count > 0 THEN
            SELECT uuid INTO v_project_uuid 
            FROM core.tickets 
            WHERE ticket_type_code = 'PROJECT' 
            ORDER BY RANDOM() LIMIT 1;
        ELSE
            v_project_uuid := NULL;
        END IF;
        
        -- Select random status
        v_random_val := RANDOM();
        v_status_code := v_sprint_statuses[1 + FLOOR(v_random_val * v_status_count)];
        
        -- Generate timestamps (sprints created over the last year)
        v_created_at := NOW() - (RANDOM() * INTERVAL '365 days');
        v_updated_at := v_created_at + (RANDOM() * INTERVAL '30 days');
        
        -- Generate start and end dates (sprints typically last 2-4 weeks)
        v_start_date := v_created_at + (RANDOM() * INTERVAL '7 days');
        v_end_date := v_start_date + (INTERVAL '14 days' + (RANDOM() * INTERVAL '14 days'));
        
        -- Closed date for completed sprints
        IF v_status_code IN ('CLOSED', 'CANCELLED', 'COMPLETED') THEN
            v_closed_at := v_end_date + (RANDOM() * INTERVAL '7 days');
        ELSE
            v_closed_at := NULL;
        END IF;
        
        -- Generate sprint number (1-20)
        v_sprint_number := 1 + FLOOR(RANDOM() * 20);
        
        -- Generate velocity values
        v_estimated_velocity := 20 + FLOOR(RANDOM() * 60); -- 20-80 story points
        
        -- Actual velocity is 70-110% of estimated for closed sprints
        IF v_status_code IN ('CLOSED', 'COMPLETED') THEN
            v_actual_velocity := FLOOR(v_estimated_velocity * (0.7 + RANDOM() * 0.4));
        ELSE
            v_actual_velocity := NULL;
        END IF;
        
        -- Generate title and description
        v_title := 'Sprint ' || v_sprint_number || ' - ' || 
            CASE 
                WHEN RANDOM() < 0.3 THEN 'Feature Development'
                WHEN RANDOM() < 0.5 THEN 'Bug Fixes & Improvements'
                WHEN RANDOM() < 0.7 THEN 'Infrastructure Work'
                WHEN RANDOM() < 0.9 THEN 'Technical Debt Reduction'
                ELSE 'Mixed Priorities'
            END;
        
        v_description := '<p><strong>Sprint Goal:</strong></p>' ||
            '<p>Complete high-priority items and deliver value to stakeholders.</p>' ||
            '<p><strong>Sprint Duration:</strong> ' || 
            EXTRACT(DAY FROM (v_end_date - v_start_date)) || ' days</p>' ||
            '<p><strong>Team Capacity:</strong> ' || v_estimated_velocity || ' story points</p>' ||
            CASE 
                WHEN v_actual_velocity IS NOT NULL THEN 
                    '<p><strong>Actual Velocity:</strong> ' || v_actual_velocity || ' story points</p>'
                ELSE ''
            END ||
            '<p><strong>Key Objectives:</strong></p>' ||
            '<ul>' ||
            '<li>Deliver committed user stories</li>' ||
            '<li>Maintain code quality standards</li>' ||
            '<li>Complete testing and documentation</li>' ||
            '</ul>';
        
        -- Build core_extended_attributes JSONB
        v_core_extended_attributes := jsonb_build_object(
            'start_date', v_start_date::TEXT,
            'end_date', v_end_date::TEXT,
            'estimated_velocity', v_estimated_velocity
        );
        
        -- Add actual_velocity only if sprint is closed
        IF v_actual_velocity IS NOT NULL THEN
            v_core_extended_attributes := v_core_extended_attributes || 
                jsonb_build_object('actual_velocity', v_actual_velocity);
        END IF;
        
        -- Insert SPRINT ticket
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
            'SPRINT',
            v_status_code,
            v_writer_uuid,  -- For sprints, requested_by = writer
            v_writer_uuid,  -- For sprints, requested_for = writer
            v_writer_uuid,
            NULL,  -- Sprints typically don't have a CI
            v_core_extended_attributes,
            '{}'::jsonb,
            v_created_at,
            v_updated_at,
            v_closed_at
        ) RETURNING uuid INTO v_sprint_uuid;
        
        -- Create assignment relation (ASSIGNED type)
        v_assignment_created_at := v_created_at;
        v_assignment_updated_at := v_updated_at;
        
        -- End assignment if sprint is closed
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
            v_sprint_uuid,
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
                v_sprint_uuid,
                'SPRINT',
                v_created_at,
                v_updated_at,
                v_assignment_ended_at
            );
        END IF;
        
        v_counter := v_counter + 1;
        
        -- Progress indicator every 500 sprints
        IF v_counter % 500 = 0 THEN
            RAISE NOTICE 'Generated % SPRINT tickets...', v_counter;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully generated % SPRINT tickets', v_counter;
    
END $$;
