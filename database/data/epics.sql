-- Script: epics.sql
-- Description: Generation of 3000 EPIC tickets for testing purposes
-- Date: 2025-10-31
-- Structure: Epics with various statuses, assignments, and linked to projects

-- ============================================================================
-- SECTION: EPIC TICKETS GENERATION
-- ============================================================================

DO $$
DECLARE
    v_person_uuid UUID;
    v_writer_uuid UUID;
    v_group_uuid UUID;
    v_assigned_person_uuid UUID;
    v_epic_uuid UUID;
    v_project_uuid UUID;
    v_status_code VARCHAR(50);
    v_title TEXT;
    v_description TEXT;
    v_counter INTEGER := 0;
    v_random_val FLOAT;
    v_epic_statuses VARCHAR(50)[];
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
    v_progress_percent INTEGER;
    v_color VARCHAR(20);
    v_tags JSONB;
    v_project_count INTEGER;
    v_epic_themes TEXT[];
    v_colors TEXT[];
BEGIN
    -- Get all existing EPIC statuses
    SELECT ARRAY_AGG(code) INTO v_epic_statuses
    FROM configuration.ticket_status
    WHERE rel_ticket_type = 'EPIC';
    
    v_status_count := array_length(v_epic_statuses, 1);
    
    -- Get count of existing projects
    SELECT COUNT(*) INTO v_project_count
    FROM core.tickets
    WHERE ticket_type_code = 'PROJECT';
    
    -- Define epic themes for variety
    v_epic_themes := ARRAY[
        'User Authentication & Security',
        'Payment Processing',
        'Mobile Application',
        'API Development',
        'Data Migration',
        'Performance Optimization',
        'User Interface Redesign',
        'Reporting & Analytics',
        'Third-Party Integration',
        'Infrastructure Upgrade',
        'Customer Portal',
        'Admin Dashboard',
        'Notification System',
        'Search Functionality',
        'Content Management',
        'E-commerce Features',
        'Social Media Integration',
        'Multi-language Support',
        'Accessibility Improvements',
        'DevOps Automation'
    ];
    
    -- Define colors for epics
    v_colors := ARRAY['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'];
    
    RAISE NOTICE 'Starting generation of 3000 EPIC tickets...';
    RAISE NOTICE 'Found % epic statuses', v_status_count;
    RAISE NOTICE 'Found % existing projects', v_project_count;
    
    -- Generate 3000 EPIC tickets
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
        
        -- Select random project to link epic to (85% chance of having a project)
        IF RANDOM() < 0.85 AND v_project_count > 0 THEN
            SELECT uuid INTO v_project_uuid 
            FROM core.tickets 
            WHERE ticket_type_code = 'PROJECT' 
            ORDER BY RANDOM() LIMIT 1;
        ELSE
            v_project_uuid := NULL;
        END IF;
        
        -- Select random status
        v_random_val := RANDOM();
        v_status_code := v_epic_statuses[1 + FLOOR(v_random_val * v_status_count)];
        
        -- Generate timestamps (epics created over the last 18 months)
        v_created_at := NOW() - (RANDOM() * INTERVAL '540 days');
        v_updated_at := v_created_at + (RANDOM() * INTERVAL '60 days');
        
        -- Generate start and end dates (epics typically last 2-6 months)
        v_start_date := v_created_at + (RANDOM() * INTERVAL '14 days');
        v_end_date := v_start_date + (INTERVAL '60 days' + (RANDOM() * INTERVAL '120 days'));
        
        -- Closed date for completed epics
        IF v_status_code IN ('CLOSED', 'CANCELLED', 'COMPLETED', 'DONE') THEN
            v_closed_at := v_end_date + (RANDOM() * INTERVAL '14 days');
        ELSE
            v_closed_at := NULL;
        END IF;
        
        -- Generate progress percentage (0-100)
        IF v_status_code IN ('CLOSED', 'COMPLETED', 'DONE') THEN
            v_progress_percent := 100;
        ELSIF v_status_code IN ('NEW', 'BACKLOG') THEN
            v_progress_percent := FLOOR(RANDOM() * 20); -- 0-20%
        ELSIF v_status_code IN ('IN_PROGRESS', 'ACTIVE') THEN
            v_progress_percent := 20 + FLOOR(RANDOM() * 60); -- 20-80%
        ELSE
            v_progress_percent := FLOOR(RANDOM() * 100);
        END IF;
        
        -- Select random color
        v_color := v_colors[1 + FLOOR(RANDOM() * array_length(v_colors, 1))];
        
        -- Generate tags (1-4 tags per epic)
        v_tags := jsonb_build_array();
        FOR j IN 1..(1 + FLOOR(RANDOM() * 4)) LOOP
            v_tags := v_tags || jsonb_build_array(
                CASE FLOOR(RANDOM() * 10)
                    WHEN 0 THEN 'frontend'
                    WHEN 1 THEN 'backend'
                    WHEN 2 THEN 'database'
                    WHEN 3 THEN 'security'
                    WHEN 4 THEN 'performance'
                    WHEN 5 THEN 'ux'
                    WHEN 6 THEN 'api'
                    WHEN 7 THEN 'mobile'
                    WHEN 8 THEN 'infrastructure'
                    ELSE 'feature'
                END
            );
        END LOOP;
        
        -- Generate title and description
        v_title := 'Epic ' || i || ': ' || v_epic_themes[1 + FLOOR(RANDOM() * array_length(v_epic_themes, 1))];
        
        v_description := '<p><strong>Epic Overview:</strong></p>' ||
            '<p>This epic encompasses a major initiative to deliver significant business value.</p>' ||
            '<p><strong>Business Value:</strong></p>' ||
            '<ul>' ||
            '<li>Improve user experience and satisfaction</li>' ||
            '<li>Increase operational efficiency</li>' ||
            '<li>Enable new revenue streams</li>' ||
            '<li>Reduce technical debt</li>' ||
            '</ul>' ||
            '<p><strong>Success Criteria:</strong></p>' ||
            '<ul>' ||
            '<li>All user stories completed and tested</li>' ||
            '<li>Performance benchmarks met</li>' ||
            '<li>Stakeholder approval obtained</li>' ||
            '<li>Documentation updated</li>' ||
            '</ul>' ||
            '<p><strong>Timeline:</strong> ' || 
            EXTRACT(DAY FROM (v_end_date - v_start_date)) || ' days</p>' ||
            '<p><strong>Progress:</strong> ' || v_progress_percent || '%</p>';
        
        -- Build core_extended_attributes JSONB
        v_core_extended_attributes := jsonb_build_object(
            'start_date', v_start_date::TEXT,
            'end_date', v_end_date::TEXT,
            'progress_percent', v_progress_percent,
            'color', v_color,
            'tags', v_tags
        );
        
        -- Insert EPIC ticket
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
            'EPIC',
            v_status_code,
            v_writer_uuid,  -- For epics, requested_by = writer
            v_writer_uuid,  -- For epics, requested_for = writer
            v_writer_uuid,
            NULL,  -- Epics typically don't have a CI
            v_core_extended_attributes,
            '{}'::jsonb,
            v_created_at,
            v_updated_at,
            v_closed_at
        ) RETURNING uuid INTO v_epic_uuid;
        
        -- Create assignment relation (ASSIGNED type)
        v_assignment_created_at := v_created_at;
        v_assignment_updated_at := v_updated_at;
        
        -- End assignment if epic is closed
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
            v_epic_uuid,
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
                v_epic_uuid,
                'EPIC',
                v_created_at,
                v_updated_at,
                v_assignment_ended_at
            );
        END IF;
        
        v_counter := v_counter + 1;
        
        -- Progress indicator every 500 epics
        IF v_counter % 500 = 0 THEN
            RAISE NOTICE 'Generated % EPIC tickets...', v_counter;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully generated % EPIC tickets', v_counter;
    
END $$;
