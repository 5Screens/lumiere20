-- Script: changes.sql
-- Description: Generation of 3000 CHANGE tickets for testing purposes
-- Date: 2025-10-27
-- Structure: Changes with various statuses, assignments, types, and configurations

-- ============================================================================
-- SECTION: CHANGE TICKETS GENERATION
-- ============================================================================

DO $$
DECLARE
    v_person_uuid UUID;
    v_writer_uuid UUID;
    v_requested_for_uuid UUID;
    v_group_uuid UUID;
    v_assigned_person_uuid UUID;
    v_ci_uuid UUID;
    v_change_uuid UUID;
    v_status_code VARCHAR(50);
    v_title TEXT;
    v_description TEXT;
    v_counter INTEGER := 0;
    v_random_val FLOAT;
    v_change_statuses VARCHAR(50)[];
    v_status_count INTEGER;
    v_created_at TIMESTAMP WITH TIME ZONE;
    v_updated_at TIMESTAMP WITH TIME ZONE;
    v_closed_at TIMESTAMP WITH TIME ZONE;
    v_assignment_created_at TIMESTAMP WITH TIME ZONE;
    v_assignment_updated_at TIMESTAMP WITH TIME ZONE;
    v_assignment_ended_at TIMESTAMP WITH TIME ZONE;
    v_change_type_code VARCHAR(50);
    v_justification_code VARCHAR(50);
    v_objective_code VARCHAR(50);
    v_cab_validation_code VARCHAR(50);
    v_post_eval_code VARCHAR(50);
    v_service_uuid UUID;
    v_service_offering_uuid UUID;
    v_core_extended_attributes JSONB;
    v_change_types VARCHAR(50)[];
    v_justifications VARCHAR(50)[];
    v_objectives VARCHAR(50)[];
    v_cab_validations VARCHAR(50)[];
    v_post_evals VARCHAR(50)[];
    v_requested_start TIMESTAMP WITH TIME ZONE;
    v_requested_end TIMESTAMP WITH TIME ZONE;
    v_planned_start TIMESTAMP WITH TIME ZONE;
    v_planned_end TIMESTAMP WITH TIME ZONE;
    v_actual_start TIMESTAMP WITH TIME ZONE;
    v_actual_end TIMESTAMP WITH TIME ZONE;
    v_validated_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get all existing CHANGE statuses
    SELECT ARRAY_AGG(code) INTO v_change_statuses
    FROM configuration.ticket_status
    WHERE rel_ticket_type = 'CHANGE';
    
    v_status_count := array_length(v_change_statuses, 1);
    
    -- Get all change types
    SELECT ARRAY_AGG(code) INTO v_change_types
    FROM configuration.change_setup_codes
    WHERE metadata = 'TYPE';
    
    -- Get all justifications
    SELECT ARRAY_AGG(code) INTO v_justifications
    FROM configuration.change_setup_codes
    WHERE metadata = 'JUSTIFICATION';
    
    -- Get all objectives
    SELECT ARRAY_AGG(code) INTO v_objectives
    FROM configuration.change_setup_codes
    WHERE metadata = 'OBJECTIVE';
    
    -- Get all CAB validation statuses
    SELECT ARRAY_AGG(code) INTO v_cab_validations
    FROM configuration.change_setup_codes
    WHERE metadata = 'CAB_VALIDATION_STATUS';
    
    -- Get all post-implementation evaluations
    SELECT ARRAY_AGG(code) INTO v_post_evals
    FROM configuration.change_setup_codes
    WHERE metadata = 'POST_IMPLEMENTATION_EVALUATION';
    
    RAISE NOTICE 'Starting generation of 3000 CHANGE tickets...';
    RAISE NOTICE 'Found % change statuses', v_status_count;
    RAISE NOTICE 'Found % change types', array_length(v_change_types, 1);
    
    -- Generate 3000 CHANGE tickets
    FOR i IN 1..3000 LOOP
        -- Select random persons for different roles
        SELECT uuid INTO v_writer_uuid FROM configuration.persons ORDER BY RANDOM() LIMIT 1;
        SELECT uuid INTO v_requested_for_uuid FROM configuration.persons ORDER BY RANDOM() LIMIT 1;
        
        -- Select random group and person for assignment
        SELECT uuid INTO v_group_uuid FROM configuration.groups ORDER BY RANDOM() LIMIT 1;
        SELECT uuid INTO v_assigned_person_uuid 
        FROM configuration.persons 
        WHERE uuid IN (
            SELECT rel_member FROM configuration.rel_persons_groups WHERE rel_group = v_group_uuid
        )
        ORDER BY RANDOM() LIMIT 1;
        
        -- Select random CI
        SELECT uuid INTO v_ci_uuid FROM data.configuration_items ORDER BY RANDOM() LIMIT 1;
        
        -- Select random service and service offering
        SELECT uuid INTO v_service_uuid FROM data.services ORDER BY RANDOM() LIMIT 1;
        SELECT uuid INTO v_service_offering_uuid 
        FROM data.service_offerings 
        WHERE service_uuid = v_service_uuid
        ORDER BY RANDOM() LIMIT 1;
        
        -- Select random status
        v_random_val := RANDOM();
        v_status_code := v_change_statuses[1 + FLOOR(v_random_val * v_status_count)::INTEGER];
        
        -- Select random change attributes
        v_change_type_code := v_change_types[1 + FLOOR(RANDOM() * array_length(v_change_types, 1))::INTEGER];
        v_justification_code := v_justifications[1 + FLOOR(RANDOM() * array_length(v_justifications, 1))::INTEGER];
        v_objective_code := v_objectives[1 + FLOOR(RANDOM() * array_length(v_objectives, 1))::INTEGER];
        v_cab_validation_code := v_cab_validations[1 + FLOOR(RANDOM() * array_length(v_cab_validations, 1))::INTEGER];
        v_post_eval_code := v_post_evals[1 + FLOOR(RANDOM() * array_length(v_post_evals, 1))::INTEGER];
        
        -- Generate title and description
        v_title := 'Change #' || i || ' - ' || 
                   CASE 
                       WHEN RANDOM() < 0.2 THEN 'Infrastructure Upgrade'
                       WHEN RANDOM() < 0.4 THEN 'Software Deployment'
                       WHEN RANDOM() < 0.6 THEN 'Configuration Update'
                       WHEN RANDOM() < 0.8 THEN 'Security Patch'
                       ELSE 'System Maintenance'
                   END;
        
        v_description := '<p>This is a test change ticket #' || i || ' generated for testing purposes.</p>' ||
                        '<p><strong>Change Type:</strong> ' || v_change_type_code || '</p>' ||
                        '<p><strong>Justification:</strong> ' || v_justification_code || '</p>' ||
                        '<p><strong>Objective:</strong> ' || v_objective_code || '</p>';
        
        -- Generate timestamps
        v_created_at := NOW() - (RANDOM() * INTERVAL '180 days');
        v_updated_at := v_created_at + (RANDOM() * INTERVAL '30 days');
        
        -- Generate dates for change planning
        v_requested_start := v_created_at + INTERVAL '7 days' + (RANDOM() * INTERVAL '30 days');
        v_requested_end := v_requested_start + INTERVAL '2 hours' + (RANDOM() * INTERVAL '48 hours');
        v_planned_start := v_requested_start + (RANDOM() * INTERVAL '5 days');
        v_planned_end := v_requested_end + (RANDOM() * INTERVAL '5 days');
        
        -- For closed changes, set actual dates and closed_at
        IF v_status_code IN ('CHANGE_CLOSED', 'CHANGE_COMPLETED', 'CHANGE_CANCELLED') THEN
            v_closed_at := v_updated_at + (RANDOM() * INTERVAL '7 days');
            v_actual_start := v_planned_start + (RANDOM() * INTERVAL '2 days' - INTERVAL '1 day');
            v_actual_end := v_planned_end + (RANDOM() * INTERVAL '2 days' - INTERVAL '1 day');
            v_validated_at := v_planned_start - INTERVAL '2 days';
        ELSE
            v_closed_at := NULL;
            v_actual_start := NULL;
            v_actual_end := NULL;
            v_validated_at := NULL;
        END IF;
        
        -- Build core_extended_attributes JSONB
        v_core_extended_attributes := jsonb_build_object(
            'rel_services', v_service_uuid::TEXT,
            'rel_service_offerings', v_service_offering_uuid::TEXT,
            'rel_change_type_code', v_change_type_code,
            'rel_change_justifications_code', v_justification_code,
            'rel_change_objective', v_objective_code,
            'rel_cab_validation_status', v_cab_validation_code,
            'post_change_evaluation', v_post_eval_code,
            'requested_start_date_at', v_requested_start::TEXT,
            'requested_end_date_at', v_requested_end::TEXT,
            'planned_start_date_at', v_planned_start::TEXT,
            'planned_end_date_at', v_planned_end::TEXT,
            'actual_start_date_at', v_actual_start::TEXT,
            'actual_end_date_at', v_actual_end::TEXT,
            'validated_at', v_validated_at::TEXT,
            'elapsed_time', (RANDOM() * 100)::INTEGER,
            'test_plan', '<p>Test plan for change #' || i || '</p>',
            'implementation_plan', '<p>Implementation plan for change #' || i || '</p>',
            'rollbcak_plan', '<p>Rollback plan for change #' || i || '</p>',
            'post_implementation_plan', '<p>Post-implementation plan for change #' || i || '</p>',
            'cab_comments', '<p>CAB comments for change #' || i || '</p>',
            'success_criteria', '<p>Success criteria for change #' || i || '</p>',
            'post_change_comment', '<p>Post-change comments for change #' || i || '</p>',
            'required_validations', '["VALIDATION_LEVEL_1", "VALIDATION_LEVEL_2"]'::JSONB,
            'r_q1', 'RISK_LOW',
            'r_q2', 'RISK_MEDIUM',
            'r_q3', 'RISK_LOW',
            'r_q4', 'RISK_LOW',
            'r_q5', 'RISK_MEDIUM',
            'i_q1', 'IMPACT_LOW',
            'i_q2', 'IMPACT_MEDIUM',
            'i_q3', 'IMPACT_LOW',
            'i_q4', 'IMPACT_MEDIUM'
        );
        
        -- Insert CHANGE ticket
        INSERT INTO core.tickets (
            uuid,
            title,
            description,
            configuration_item_uuid,
            ticket_status_code,
            ticket_type_code,
            requested_for_uuid,
            writer_uuid,
            created_at,
            updated_at,
            closed_at,
            core_extended_attributes
        ) VALUES (
            gen_random_uuid(),
            v_title,
            v_description,
            v_ci_uuid,
            v_status_code,
            'CHANGE',
            v_requested_for_uuid,
            v_writer_uuid,
            v_created_at,
            v_updated_at,
            v_closed_at,
            v_core_extended_attributes
        ) RETURNING uuid INTO v_change_uuid;
        
        -- Create assignment
        v_assignment_created_at := v_created_at + (RANDOM() * INTERVAL '1 day');
        v_assignment_updated_at := v_assignment_created_at;
        
        -- For closed changes, end the assignment
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
            gen_random_uuid(),
            v_change_uuid,
            v_group_uuid,
            v_assigned_person_uuid,
            'ASSIGNED',
            v_assignment_created_at,
            v_assignment_updated_at,
            v_assignment_ended_at
        );
        
        -- Add watchers (20% of changes have watchers)
        IF RANDOM() < 0.2 THEN
            FOR j IN 1..(1 + FLOOR(RANDOM() * 3)::INTEGER) LOOP
                SELECT uuid INTO v_person_uuid FROM configuration.persons ORDER BY RANDOM() LIMIT 1;
                
                INSERT INTO core.rel_tickets_groups_persons (
                    uuid,
                    rel_ticket,
                    rel_assigned_to_person,
                    type,
                    created_at,
                    updated_at,
                    ended_at
                ) VALUES (
                    gen_random_uuid(),
                    v_change_uuid,
                    v_person_uuid,
                    'WATCHER',
                    v_assignment_created_at,
                    v_assignment_updated_at,
                    NULL
                )
                ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;
        
        v_counter := v_counter + 1;
        
        -- Log progress every 500 tickets
        IF v_counter % 500 = 0 THEN
            RAISE NOTICE 'Generated % CHANGE tickets...', v_counter;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully generated % CHANGE tickets', v_counter;
    
END $$;

-- ============================================================================
-- SECTION: VERIFICATION
-- ============================================================================

-- Count total CHANGE tickets
SELECT COUNT(*) as total_changes FROM core.tickets WHERE ticket_type_code = 'CHANGE';

-- Count CHANGE tickets by status
SELECT 
    ticket_status_code,
    COUNT(*) as count
FROM core.tickets
WHERE ticket_type_code = 'CHANGE'
GROUP BY ticket_status_code
ORDER BY count DESC;

-- Count CHANGE tickets by type
SELECT 
    core_extended_attributes->>'rel_change_type_code' as change_type,
    COUNT(*) as count
FROM core.tickets
WHERE ticket_type_code = 'CHANGE'
GROUP BY core_extended_attributes->>'rel_change_type_code'
ORDER BY count DESC;
