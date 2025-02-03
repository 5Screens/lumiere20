-- Function pour mettre à jour automatiquement la date de modification
CREATE OR REPLACE FUNCTION update_date_modification()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function pour valider le format email
CREATE OR REPLACE FUNCTION validate_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Function pour valider que la date de modification est postérieure à la date de création
CREATE OR REPLACE FUNCTION validate_dates(date_creation TIMESTAMP, date_modification TIMESTAMP)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN date_modification >= date_creation;
END;
$$ LANGUAGE plpgsql;

-- Function pour vérifier si une personne appartient à une entité
CREATE OR REPLACE FUNCTION is_person_in_entity(p_person_uuid UUID, p_entity_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM persons_entities 
        WHERE person_uuid = p_person_uuid 
        AND entity_uuid = p_entity_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Function pour obtenir toutes les entités d'une personne
CREATE OR REPLACE FUNCTION get_person_entities(p_person_uuid UUID)
RETURNS TABLE (
    entity_uuid UUID,
    entity_nom TEXT,
    entity_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.uuid, e.nom, e.description
    FROM entities e
    INNER JOIN persons_entities pe ON e.uuid = pe.entity_uuid
    WHERE pe.person_uuid = p_person_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function pour obtenir tous les tickets d'une personne (comme demandeur)
CREATE OR REPLACE FUNCTION get_person_tickets(p_person_uuid UUID)
RETURNS TABLE (
    ticket_uuid UUID,
    ticket_titre TEXT,
    ticket_description TEXT,
    ticket_status TEXT,
    ticket_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.uuid,
        t.titre,
        t.description,
        ts_tr.libelle as status,
        tt_tr.libelle as type
    FROM tickets t
    LEFT JOIN ticket_status_translation ts_tr ON t.ticket_status_uuid = ts_tr.ticket_status_uuid
    LEFT JOIN ticket_types_translation tt_tr ON t.ticket_type_uuid = tt_tr.ticket_type_uuid
    WHERE t.requested_by_uuid = p_person_uuid
    AND ts_tr.langue = 'FR'
    AND tt_tr.langue = 'FR';
END;
$$ LANGUAGE plpgsql;
