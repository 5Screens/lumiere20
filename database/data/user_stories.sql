-- Script: user_stories.sql
-- Description: Generation of 3000 USER_STORY tickets for testing purposes
-- Date: 2025-10-31
-- Structure: User stories with various statuses, assignments, and linked to projects/epics/sprints

-- ============================================================================
-- SECTION: USER STORY TICKETS GENERATION
-- ============================================================================

DO $$
DECLARE
    v_person_uuid UUID;
    v_writer_uuid UUID;
    v_assigned_person_uuid UUID;
    v_story_uuid UUID;
    v_project_uuid UUID;
    v_epic_uuid UUID;
    v_sprint_uuid UUID;
    v_status_code VARCHAR(50);
    v_title TEXT;
    v_description TEXT;
    v_counter INTEGER := 0;
    v_random_val FLOAT;
    v_story_statuses VARCHAR(50)[];
    v_status_count INTEGER;
    v_project_count INTEGER;
    v_epic_count INTEGER;
    v_sprint_count INTEGER;
    v_created_at TIMESTAMP WITH TIME ZONE;
    v_updated_at TIMESTAMP WITH TIME ZONE;
    v_closed_at TIMESTAMP WITH TIME ZONE;
    v_assignment_created_at TIMESTAMP WITH TIME ZONE;
    v_assignment_updated_at TIMESTAMP WITH TIME ZONE;
    v_assignment_ended_at TIMESTAMP WITH TIME ZONE;
    v_core_extended_attributes JSONB;
    v_story_points INTEGER;
    v_priority TEXT;
    v_acceptance_criteria TEXT;
    v_tags JSONB;
    v_priorities TEXT[] := ARRAY['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    v_tag_options TEXT[] := ARRAY['frontend', 'backend', 'database', 'api', 'ui', 'ux', 'security', 'performance', 'bugfix', 'feature', 'enhancement', 'refactoring'];
BEGIN
    -- Get all existing USER_STORY statuses
    SELECT ARRAY_AGG(code) INTO v_story_statuses
    FROM configuration.ticket_status
    WHERE rel_ticket_type = 'USER_STORY';
    
    v_status_count := array_length(v_story_statuses, 1);
    
    -- Get count of existing projects, epics, and sprints
    SELECT COUNT(*) INTO v_project_count
    FROM core.tickets
    WHERE ticket_type_code = 'PROJECT';
    
    SELECT COUNT(*) INTO v_epic_count
    FROM core.tickets
    WHERE ticket_type_code = 'EPIC';
    
    SELECT COUNT(*) INTO v_sprint_count
    FROM core.tickets
    WHERE ticket_type_code = 'SPRINT';
    
    RAISE NOTICE 'Starting generation of 3000 USER_STORY tickets...';
    RAISE NOTICE 'Found % user story statuses', v_status_count;
    RAISE NOTICE 'Found % existing projects', v_project_count;
    RAISE NOTICE 'Found % existing epics', v_epic_count;
    RAISE NOTICE 'Found % existing sprints', v_sprint_count;
    
    -- Generate 3000 USER_STORY tickets
    FOR i IN 1..3000 LOOP
        -- Select random persons for different roles
        SELECT uuid INTO v_writer_uuid FROM configuration.persons ORDER BY RANDOM() LIMIT 1;
        SELECT uuid INTO v_person_uuid FROM configuration.persons ORDER BY RANDOM() LIMIT 1;
        
        -- Select random person for assignment (70% chance)
        IF RANDOM() < 0.7 THEN
            SELECT uuid INTO v_assigned_person_uuid FROM configuration.persons ORDER BY RANDOM() LIMIT 1;
        ELSE
            v_assigned_person_uuid := NULL;
        END IF;
        
        -- Select random project to link story to (90% chance of having a project)
        IF RANDOM() < 0.9 AND v_project_count > 0 THEN
            SELECT uuid INTO v_project_uuid 
            FROM core.tickets 
            WHERE ticket_type_code = 'PROJECT' 
            ORDER BY RANDOM() LIMIT 1;
        ELSE
            v_project_uuid := NULL;
        END IF;
        
        -- Select random epic (50% chance if project exists)
        IF v_project_uuid IS NOT NULL AND RANDOM() < 0.5 AND v_epic_count > 0 THEN
            -- Try to find an epic linked to the same project
            SELECT t.uuid INTO v_epic_uuid
            FROM core.tickets t
            JOIN core.rel_parent_child_tickets rpc ON t.uuid = rpc.rel_child_ticket_uuid
            WHERE t.ticket_type_code = 'EPIC' 
              AND rpc.rel_parent_ticket_uuid = v_project_uuid
              AND rpc.dependency_code = 'EPIC'
              AND rpc.ended_at IS NULL
            ORDER BY RANDOM() LIMIT 1;
            
            -- If no epic found for this project, pick any epic
            IF v_epic_uuid IS NULL THEN
                SELECT uuid INTO v_epic_uuid 
                FROM core.tickets 
                WHERE ticket_type_code = 'EPIC' 
                ORDER BY RANDOM() LIMIT 1;
            END IF;
        ELSE
            v_epic_uuid := NULL;
        END IF;
        
        -- Select random sprint (40% chance if project exists)
        IF v_project_uuid IS NOT NULL AND RANDOM() < 0.4 AND v_sprint_count > 0 THEN
            -- Try to find a sprint linked to the same project
            SELECT t.uuid INTO v_sprint_uuid
            FROM core.tickets t
            JOIN core.rel_parent_child_tickets rpc ON t.uuid = rpc.rel_child_ticket_uuid
            WHERE t.ticket_type_code = 'SPRINT' 
              AND rpc.rel_parent_ticket_uuid = v_project_uuid
              AND rpc.dependency_code = 'SPRINT'
              AND rpc.ended_at IS NULL
            ORDER BY RANDOM() LIMIT 1;
            
            -- If no sprint found for this project, pick any sprint
            IF v_sprint_uuid IS NULL THEN
                SELECT uuid INTO v_sprint_uuid 
                FROM core.tickets 
                WHERE ticket_type_code = 'SPRINT' 
                ORDER BY RANDOM() LIMIT 1;
            END IF;
        ELSE
            v_sprint_uuid := NULL;
        END IF;
        
        -- Select random status
        v_random_val := RANDOM();
        v_status_code := v_story_statuses[1 + FLOOR(v_random_val * v_status_count)];
        
        -- Generate timestamps (stories created over the last year)
        v_created_at := NOW() - (RANDOM() * INTERVAL '365 days');
        v_updated_at := v_created_at + (RANDOM() * INTERVAL '60 days');
        
        -- Closed date for completed stories
        IF v_status_code IN ('CLOSED', 'CANCELLED', 'DONE', 'RESOLVED') THEN
            v_closed_at := v_updated_at + (RANDOM() * INTERVAL '7 days');
        ELSE
            v_closed_at := NULL;
        END IF;
        
        -- Generate story points (1-13, Fibonacci-like)
        v_story_points := CASE FLOOR(RANDOM() * 8)
            WHEN 0 THEN 1
            WHEN 1 THEN 2
            WHEN 2 THEN 3
            WHEN 3 THEN 5
            WHEN 4 THEN 8
            WHEN 5 THEN 13
            WHEN 6 THEN 5
            ELSE 3
        END;
        
        -- Generate priority
        v_priority := v_priorities[1 + FLOOR(RANDOM() * 4)];
        
        -- Generate tags (1-4 random tags)
        DECLARE
            v_tag_count INTEGER := 1 + FLOOR(RANDOM() * 4);
            v_selected_tags TEXT[];
            v_tag_index INTEGER;
        BEGIN
            v_selected_tags := ARRAY[]::TEXT[];
            FOR j IN 1..v_tag_count LOOP
                v_tag_index := 1 + FLOOR(RANDOM() * array_length(v_tag_options, 1));
                IF NOT (v_tag_options[v_tag_index] = ANY(v_selected_tags)) THEN
                    v_selected_tags := array_append(v_selected_tags, v_tag_options[v_tag_index]);
                END IF;
            END LOOP;
            v_tags := to_jsonb(v_selected_tags);
        END;
        
        -- Generate title and description
        v_title := 'As a ' || 
            CASE 
                WHEN RANDOM() < 0.25 THEN 'user'
                WHEN RANDOM() < 0.5 THEN 'admin'
                WHEN RANDOM() < 0.75 THEN 'developer'
                ELSE 'customer'
            END || ', I want to ' ||
            CASE 
                WHEN RANDOM() < 0.2 THEN 'view my dashboard'
                WHEN RANDOM() < 0.4 THEN 'manage my profile'
                WHEN RANDOM() < 0.6 THEN 'export data'
                WHEN RANDOM() < 0.8 THEN 'configure settings'
                ELSE 'access reports'
            END;
        
        v_acceptance_criteria := '<p><strong>Acceptance Criteria:</strong></p>' ||
            '<ul>' ||
            '<li>Given the user is authenticated</li>' ||
            '<li>When they navigate to the feature</li>' ||
            '<li>Then they should see the expected functionality</li>' ||
            '<li>And the system should respond within 2 seconds</li>' ||
            '<li>And all data should be validated</li>' ||
            '</ul>' ||
            '<p><strong>Definition of Done:</strong></p>' ||
            '<ul>' ||
            '<li>Code reviewed and approved</li>' ||
            '<li>Unit tests written and passing</li>' ||
            '<li>Integration tests passing</li>' ||
            '<li>Documentation updated</li>' ||
            '<li>Deployed to staging environment</li>' ||
            '</ul>';
        
        v_description := '<p><strong>User Story:</strong></p>' ||
            '<p>' || v_title || '</p>' ||
            '<p><strong>Business Value:</strong></p>' ||
            '<p>This feature will improve user experience and increase productivity by providing ' ||
            'streamlined access to critical functionality.</p>' ||
            '<p><strong>Technical Notes:</strong></p>' ||
            '<ul>' ||
            '<li>Requires API endpoint modifications</li>' ||
            '<li>Frontend component updates needed</li>' ||
            '<li>Database schema changes may be required</li>' ||
            '</ul>';
        
        -- Build core_extended_attributes JSONB
        v_core_extended_attributes := jsonb_build_object(
            'story_points', v_story_points,
            'priority', v_priority,
            'acceptance_criteria', v_acceptance_criteria,
            'tags', v_tags
        );
        
        -- Insert USER_STORY ticket
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
            'USER_STORY',
            v_status_code,
            NULL,  -- User stories typically don't have requested_by
            v_person_uuid,  -- requested_for is the product owner/stakeholder
            v_writer_uuid,
            NULL,  -- User stories typically don't have a CI
            v_core_extended_attributes,
            '{}'::jsonb,
            v_created_at,
            v_updated_at,
            v_closed_at
        ) RETURNING uuid INTO v_story_uuid;
        
        -- Create assignment relation if person assigned (ASSIGNED type)
        IF v_assigned_person_uuid IS NOT NULL THEN
            v_assignment_created_at := v_created_at;
            v_assignment_updated_at := v_updated_at;
            
            -- End assignment if story is closed
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
                v_story_uuid,
                NULL,  -- User stories typically assigned to person, not group
                v_assigned_person_uuid,
                'ASSIGNED',
                v_assignment_created_at,
                v_assignment_updated_at,
                v_assignment_ended_at
            );
        END IF;
        
        -- Create parent-child relationships
        -- Priority 1: Link to epic if exists (EPIC → STORY)
        IF v_epic_uuid IS NOT NULL THEN
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
                v_epic_uuid,
                v_story_uuid,
                'STORY',
                v_created_at,
                v_updated_at,
                v_assignment_ended_at
            );
        -- Priority 2: Link directly to project if no epic (PROJECT → STORY)
        ELSIF v_project_uuid IS NOT NULL THEN
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
                v_story_uuid,
                'STORY',
                v_created_at,
                v_updated_at,
                v_assignment_ended_at
            );
        END IF;
        
        -- Link to sprint if exists (SPRINT → STORY)
        IF v_sprint_uuid IS NOT NULL THEN
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
                v_sprint_uuid,
                v_story_uuid,
                'STORY',
                v_created_at,
                v_updated_at,
                v_assignment_ended_at
            );
        END IF;
        
        v_counter := v_counter + 1;
        
        -- Progress indicator every 500 stories
        IF v_counter % 500 = 0 THEN
            RAISE NOTICE 'Generated % USER_STORY tickets...', v_counter;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully generated % USER_STORY tickets', v_counter;
    
END $$;
