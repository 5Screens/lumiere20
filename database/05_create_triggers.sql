-- Triggers pour la mise à jour automatique des dates

-- Configuration Items
CREATE TRIGGER update_configuration_items_date_modification
    BEFORE UPDATE ON data.configuration_items
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();

-- Persons
CREATE TRIGGER update_persons_date_modification
    BEFORE UPDATE ON configuration.persons
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();

CREATE TRIGGER validate_persons_email
    BEFORE INSERT OR UPDATE ON configuration.persons
    FOR EACH ROW
    EXECUTE FUNCTION validate_person_email();

-- Tickets
CREATE TRIGGER update_tickets_date_modification
    BEFORE UPDATE ON core.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();

-- Entities
CREATE TRIGGER update_entities_date_modification
    BEFORE UPDATE ON configuration.entities
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();

-- Ticket Types
CREATE TRIGGER update_ticket_types_date_modification
    BEFORE UPDATE ON configuration.ticket_types
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();

-- Ticket Status
CREATE TRIGGER update_ticket_status_date_modification
    BEFORE UPDATE ON configuration.ticket_status
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();

-- Symptoms
CREATE TRIGGER update_symptoms_date_modification
    BEFORE UPDATE ON configuration.symptoms
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();

-- Translations
CREATE TRIGGER update_ticket_types_translation_date_modification
    BEFORE UPDATE ON translations.ticket_types_translation
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();

CREATE TRIGGER update_ticket_status_translation_date_modification
    BEFORE UPDATE ON translations.ticket_status_translation
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();

CREATE TRIGGER update_symptoms_translation_date_modification
    BEFORE UPDATE ON translations.symptoms_translation
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();

-- Persons Entities
CREATE TRIGGER update_persons_entities_date_modification
    BEFORE UPDATE ON configuration.persons_entities
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();

-- Fonctions de validation pour les triggers
CREATE OR REPLACE FUNCTION validate_person_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_email(NEW.email) THEN
        RAISE EXCEPTION 'Format d''email invalide';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour valider les dates (création/modification)
CREATE OR REPLACE FUNCTION validate_modification_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_dates(NEW.date_creation, NEW.date_modification) THEN
        RAISE EXCEPTION 'La date de modification doit être postérieure ou égale à la date de création';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application du trigger de validation des dates sur toutes les tables
CREATE TRIGGER validate_configuration_items_dates
    BEFORE UPDATE ON data.configuration_items
    FOR EACH ROW
    EXECUTE FUNCTION validate_modification_date();

CREATE TRIGGER validate_persons_dates
    BEFORE UPDATE ON configuration.persons
    FOR EACH ROW
    EXECUTE FUNCTION validate_modification_date();

CREATE TRIGGER validate_tickets_dates
    BEFORE UPDATE ON core.tickets
    FOR EACH ROW
    EXECUTE FUNCTION validate_modification_date();

CREATE TRIGGER validate_entities_dates
    BEFORE UPDATE ON configuration.entities
    FOR EACH ROW
    EXECUTE FUNCTION validate_modification_date();

CREATE TRIGGER validate_ticket_types_dates
    BEFORE UPDATE ON configuration.ticket_types
    FOR EACH ROW
    EXECUTE FUNCTION validate_modification_date();

CREATE TRIGGER validate_ticket_status_dates
    BEFORE UPDATE ON configuration.ticket_status
    FOR EACH ROW
    EXECUTE FUNCTION validate_modification_date();

CREATE TRIGGER validate_symptoms_dates
    BEFORE UPDATE ON configuration.symptoms
    FOR EACH ROW
    EXECUTE FUNCTION validate_modification_date();

CREATE TRIGGER validate_ticket_types_translation_dates
    BEFORE UPDATE ON translations.ticket_types_translation
    FOR EACH ROW
    EXECUTE FUNCTION validate_modification_date();

CREATE TRIGGER validate_ticket_status_translation_dates
    BEFORE UPDATE ON translations.ticket_status_translation
    FOR EACH ROW
    EXECUTE FUNCTION validate_modification_date();

CREATE TRIGGER validate_symptoms_translation_dates
    BEFORE UPDATE ON translations.symptoms_translation
    FOR EACH ROW
    EXECUTE FUNCTION validate_modification_date();

CREATE TRIGGER validate_persons_entities_dates
    BEFORE UPDATE ON configuration.persons_entities
    FOR EACH ROW
    EXECUTE FUNCTION validate_modification_date();
