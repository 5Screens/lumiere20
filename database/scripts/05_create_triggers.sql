-- Triggers pour la mise à jour automatique des dates

-- Configuration Items
CREATE TRIGGER update_configuration_items_updated_at
    BEFORE UPDATE ON data.configuration_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Services
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON data.services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Persons
CREATE TRIGGER update_persons_updated_at
    BEFORE UPDATE ON configuration.persons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER validate_persons_email
    BEFORE INSERT OR UPDATE ON configuration.persons
    FOR EACH ROW
    EXECUTE FUNCTION validate_person_email();

-- Tickets
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON core.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Entities
CREATE TRIGGER update_entities_updated_at
    BEFORE UPDATE ON configuration.entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Ticket Types
CREATE TRIGGER update_ticket_types_updated_at
    BEFORE UPDATE ON configuration.ticket_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Ticket Status
CREATE TRIGGER update_ticket_status_updated_at
    BEFORE UPDATE ON configuration.ticket_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Symptoms
CREATE TRIGGER update_symptoms_updated_at
    BEFORE UPDATE ON configuration.symptoms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Translations
CREATE TRIGGER update_ticket_types_translation_updated_at
    BEFORE UPDATE ON translations.ticket_types_translation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ticket_status_translation_updated_at
    BEFORE UPDATE ON translations.ticket_status_translation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_symptoms_translation_updated_at
    BEFORE UPDATE ON translations.symptoms_translation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Persons Entities
CREATE TRIGGER update_persons_entities_updated_at
    BEFORE UPDATE ON configuration.persons_entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

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
CREATE OR REPLACE FUNCTION valiupdated_at_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_dates(NEW.created_at, NEW.updated_at) THEN
        RAISE EXCEPTION 'La date de modification doit être postérieure ou égale à la date de création';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application du trigger de validation des dates sur toutes les tables
CREATE TRIGGER validate_configuration_items_dates
    BEFORE UPDATE ON data.configuration_items
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();

CREATE TRIGGER validate_persons_dates
    BEFORE UPDATE ON configuration.persons
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();

CREATE TRIGGER validate_tickets_dates
    BEFORE UPDATE ON core.tickets
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();

CREATE TRIGGER validate_entities_dates
    BEFORE UPDATE ON configuration.entities
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();

CREATE TRIGGER validate_ticket_types_dates
    BEFORE UPDATE ON configuration.ticket_types
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();

CREATE TRIGGER validate_ticket_status_dates
    BEFORE UPDATE ON configuration.ticket_status
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();

CREATE TRIGGER validate_ticket_types_translation_dates
    BEFORE UPDATE ON translations.ticket_types_translation
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();

CREATE TRIGGER validate_ticket_status_translation_dates
    BEFORE UPDATE ON translations.ticket_status_translation
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();

CREATE TRIGGER validate_symptoms_translation_dates
    BEFORE UPDATE ON translations.symptoms_translation
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();

CREATE TRIGGER validate_persons_entities_dates
    BEFORE UPDATE ON configuration.persons_entities
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();

CREATE TRIGGER validate_services_dates
    BEFORE UPDATE ON data.services
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();

CREATE TRIGGER validate_services_created_at
    BEFORE INSERT OR UPDATE ON data.services
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();
