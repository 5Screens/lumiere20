-- Script: projects.sql
-- Description: Generation of 500 PROJECT tickets for testing purposes
-- Date: 2025-10-30
-- Structure: Projects with various statuses, assignments, types, and configurations

-- ============================================================================
-- SECTION: PROJECT TICKETS GENERATION
-- ============================================================================

DO $$
DECLARE
    v_person_uuid UUID;
    v_writer_uuid UUID;
    v_group_uuid UUID;
    v_assigned_person_uuid UUID;
    v_project_uuid UUID;
    v_status_code VARCHAR(50);
    v_title TEXT;
    v_description TEXT;
    v_counter INTEGER := 0;
    v_random_val FLOAT;
    v_project_statuses VARCHAR(50)[];
    v_status_count INTEGER;
    v_created_at TIMESTAMP WITH TIME ZONE;
    v_updated_at TIMESTAMP WITH TIME ZONE;
    v_closed_at TIMESTAMP WITH TIME ZONE;
    v_assignment_created_at TIMESTAMP WITH TIME ZONE;
    v_assignment_updated_at TIMESTAMP WITH TIME ZONE;
    v_assignment_ended_at TIMESTAMP WITH TIME ZONE;
    v_project_type_code VARCHAR(50);
    v_visibility_code VARCHAR(50);
    v_core_extended_attributes JSONB;
    v_project_types VARCHAR(50)[];
    v_visibilities VARCHAR(50)[];
    v_start_date TIMESTAMP WITH TIME ZONE;
    v_end_date TIMESTAMP WITH TIME ZONE;
    v_key TEXT;
BEGIN
    -- Get all existing PROJECT statuses
    SELECT ARRAY_AGG(code) INTO v_project_statuses
    FROM configuration.ticket_status
    WHERE rel_ticket_type = 'PROJECT';
    
    v_status_count := array_length(v_project_statuses, 1);
    
    -- Get all project types
    SELECT ARRAY_AGG(code) INTO v_project_types
    FROM configuration.project_setup_codes
    WHERE metadata = 'CATEGORY';
    
    -- Get all visibility levels
    SELECT ARRAY_AGG(code) INTO v_visibilities
    FROM configuration.project_setup_codes
    WHERE metadata = 'VISIBILITY';
    
    RAISE NOTICE 'Starting generation of 500 PROJECT tickets...';
    RAISE NOTICE 'Found % project statuses', v_status_count;
    RAISE NOTICE 'Found % project types', array_length(v_project_types, 1);
    RAISE NOTICE 'Found % visibility levels', array_length(v_visibilities, 1);
    
    -- Generate 500 PROJECT tickets
    FOR i IN 1..500 LOOP
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
        
        -- Select random status
        v_random_val := RANDOM();
        v_status_code := v_project_statuses[1 + FLOOR(v_random_val * v_status_count)];
        
        -- Select random project type
        v_random_val := RANDOM();
        v_project_type_code := v_project_types[1 + FLOOR(v_random_val * array_length(v_project_types, 1))];
        
        -- Select random visibility
        v_random_val := RANDOM();
        v_visibility_code := v_visibilities[1 + FLOOR(v_random_val * array_length(v_visibilities, 1))];
        
        -- Generate timestamps (projects created over the last 2 years)
        v_created_at := NOW() - (RANDOM() * INTERVAL '730 days');
        v_updated_at := v_created_at + (RANDOM() * INTERVAL '180 days');
        
        -- Generate start and end dates
        v_start_date := v_created_at + (RANDOM() * INTERVAL '30 days');
        v_end_date := v_start_date + (RANDOM() * INTERVAL '365 days');
        
        -- Closed date for completed projects
        IF v_status_code IN ('CLOSED', 'CANCELLED', 'COMPLETED') THEN
            v_closed_at := v_updated_at + (RANDOM() * INTERVAL '30 days');
        ELSE
            v_closed_at := NULL;
        END IF;
        
        -- Generate project key (e.g., PROJ-001, PROJ-002, etc.)
        v_key := 'PROJ-' || LPAD(i::TEXT, 3, '0');
        
        -- Generate title and description
        v_title := 'Project ' || v_key || ' - ' || 
            CASE 
                WHEN v_project_type_code = 'SOFTWARE' THEN 'Software Development'
                WHEN v_project_type_code = 'BUSINESS' THEN 'Business Transformation'
                WHEN v_project_type_code = 'SERVICE' THEN 'Service Improvement'
                WHEN v_project_type_code = 'INFRASTRUCTURE' THEN 'Infrastructure Upgrade'
                WHEN v_project_type_code = 'SECURITY' THEN 'Security Enhancement'
                WHEN v_project_type_code = 'COMPLIANCE' THEN 'Compliance Initiative'
                WHEN v_project_type_code = 'RESEARCH' THEN 'Research & Development'
                ELSE 'General Project'
            END;
        
        v_description := '<p>This is a ' || LOWER(v_project_type_code) || ' project with ' || 
            LOWER(v_visibility_code) || ' visibility.</p>' ||
            '<p><strong>Objectives:</strong></p>' ||
            '<ul>' ||
            '<li>Deliver high-quality results on time</li>' ||
            '<li>Maintain budget constraints</li>' ||
            '<li>Ensure stakeholder satisfaction</li>' ||
            '</ul>' ||
            '<p><strong>Key Deliverables:</strong></p>' ||
            '<ul>' ||
            '<li>Project documentation</li>' ||
            '<li>Implementation plan</li>' ||
            '<li>Testing and validation</li>' ||
            '</ul>';
        
        -- Build core_extended_attributes JSONB
        v_core_extended_attributes := jsonb_build_object(
            'key', v_key,
            'project_type', v_project_type_code,
            'visibility', v_visibility_code,
            'start_date', v_start_date::TEXT,
            'end_date', v_end_date::TEXT,
            'issue_type_scheme_id', '[]'::jsonb
        );
        
        -- Insert PROJECT ticket
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
            'PROJECT',
            v_status_code,
            v_writer_uuid,  -- For projects, requested_by = writer
            v_writer_uuid,  -- For projects, requested_for = writer
            v_writer_uuid,
            NULL,  -- Projects typically don't have a CI
            v_core_extended_attributes,
            '{}'::jsonb,
            v_created_at,
            v_updated_at,
            v_closed_at
        ) RETURNING uuid INTO v_project_uuid;
        
        -- Create assignment relation (ASSIGNED type)
        v_assignment_created_at := v_created_at;
        v_assignment_updated_at := v_updated_at;
        
        -- End assignment if project is closed
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
            v_project_uuid,
            v_group_uuid,
            v_assigned_person_uuid,
            'ASSIGNED',
            v_assignment_created_at,
            v_assignment_updated_at,
            v_assignment_ended_at
        );
        
        v_counter := v_counter + 1;
        
        -- Progress indicator every 100 projects
        IF v_counter % 100 = 0 THEN
            RAISE NOTICE 'Generated % PROJECT tickets...', v_counter;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully generated % PROJECT tickets', v_counter;
    
END $$;
