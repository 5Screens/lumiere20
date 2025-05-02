-- Insert ticket types
INSERT INTO configuration.ticket_types (code) VALUES 
('TICKET'),
('INCIDENT'),
('PROBLEM'),
('CHANGE'),
('REQUEST'),
('KNOWLEDGE'),
('PROJECT'),
('DEFECT'),
('STORY'),
('EPIC'),
('SPRINT');

COMMIT;

-- Insert translations for each ticket type
-- French (fr-FR)
INSERT INTO translations.ticket_types_translation (ticket_type_uuid, lang, label)
SELECT 
    tt.uuid,
    l.code,
    CASE tt.code
        WHEN 'TICKET' THEN 'Ticket'
        WHEN 'INCIDENT' THEN 'Incident'
        WHEN 'PROBLEM' THEN 'Problème'
        WHEN 'CHANGE' THEN 'Changement'
        WHEN 'REQUEST' THEN 'Demande'
        WHEN 'KNOWLEDGE' THEN 'Connaissance'
        WHEN 'PROJECT' THEN 'Projet'
        WHEN 'DEFECT' THEN 'Anomalie'
        WHEN 'STORY' THEN 'Histoire utilisateur'
        WHEN 'EPIC' THEN 'Épopée'
        WHEN 'SPRINT' THEN 'Sprint'
    END
FROM configuration.ticket_types tt
CROSS JOIN translations.languages l
WHERE l.locale = 'fr-FR';

-- English UK (en-GB)
INSERT INTO translations.ticket_types_translation (ticket_type_uuid, lang, label)
SELECT 
    tt.uuid,
    l.code,
    CASE tt.code
        WHEN 'TICKET' THEN 'Ticket'
        WHEN 'INCIDENT' THEN 'Incident'
        WHEN 'PROBLEM' THEN 'Problem'
        WHEN 'CHANGE' THEN 'Change'
        WHEN 'REQUEST' THEN 'Request'
        WHEN 'KNOWLEDGE' THEN 'Knowledge article'
        WHEN 'PROJECT' THEN 'Project'
        WHEN 'DEFECT' THEN 'Defect'
        WHEN 'STORY' THEN 'User Story'
        WHEN 'EPIC' THEN 'Epic'
        WHEN 'SPRINT' THEN 'Sprint'
    END
FROM configuration.ticket_types tt
CROSS JOIN translations.languages l
WHERE l.locale = 'en-GB';

-- Spanish (es-ES)
INSERT INTO translations.ticket_types_translation (ticket_type_uuid, lang, label)
SELECT 
    tt.uuid,
    l.code,
    CASE tt.code
        WHEN 'TICKET' THEN 'Ticket'
        WHEN 'INCIDENT' THEN 'Incidente'
        WHEN 'PROBLEM' THEN 'Problema'
        WHEN 'CHANGE' THEN 'Cambio'
        WHEN 'REQUEST' THEN 'Solicitud'
        WHEN 'KNOWLEDGE' THEN 'Base de conocimiento'
        WHEN 'PROJECT' THEN 'Proyecto'
        WHEN 'DEFECT' THEN 'Defecto'
        WHEN 'STORY' THEN 'Historia de usuario'
        WHEN 'EPIC' THEN 'Épica'
        WHEN 'SPRINT' THEN 'Sprint'
    END
FROM configuration.ticket_types tt
CROSS JOIN translations.languages l
WHERE l.locale = 'es-ES';

-- Portuguese (pt-PT)
INSERT INTO translations.ticket_types_translation (ticket_type_uuid, lang, label)
SELECT 
    tt.uuid,
    l.code,
    CASE tt.code
        WHEN 'TICKET' THEN 'Ticket'
        WHEN 'INCIDENT' THEN 'Incidente'
        WHEN 'PROBLEM' THEN 'Problema'
        WHEN 'CHANGE' THEN 'Mudança'
        WHEN 'REQUEST' THEN 'Solicitação'
        WHEN 'KNOWLEDGE' THEN 'Base de conhecimento'
        WHEN 'PROJECT' THEN 'Projeto'
        WHEN 'DEFECT' THEN 'Defeito'
        WHEN 'STORY' THEN 'História de usuário'
        WHEN 'EPIC' THEN 'Épico'
        WHEN 'SPRINT' THEN 'Sprint'
    END
FROM configuration.ticket_types tt
CROSS JOIN translations.languages l
WHERE l.locale = 'pt-PT';

-- Bulgarian (bg-BG)
INSERT INTO translations.ticket_types_translation (ticket_type_uuid, lang, label)
SELECT 
    tt.uuid,
    l.code,
    CASE tt.code
        WHEN 'TICKET' THEN 'Билет'
        WHEN 'INCIDENT' THEN 'Инцидент'
        WHEN 'PROBLEM' THEN 'Проблем'
        WHEN 'CHANGE' THEN 'Промяна'
        WHEN 'REQUEST' THEN 'Заявка'
        WHEN 'KNOWLEDGE' THEN 'База знания'
        WHEN 'PROJECT' THEN 'Проект'
        WHEN 'DEFECT' THEN 'Дефект'
        WHEN 'STORY' THEN 'Потребителска история'
        WHEN 'EPIC' THEN 'Епик'
        WHEN 'SPRINT' THEN 'Спринт'
    END
FROM configuration.ticket_types tt
CROSS JOIN translations.languages l
WHERE l.locale = 'bg-BG';

-- Croatian (hr-HR)
INSERT INTO translations.ticket_types_translation (ticket_type_uuid, lang, label)
SELECT 
    tt.uuid,
    l.code,
    CASE tt.code
        WHEN 'TICKET' THEN 'Tiket'
        WHEN 'INCIDENT' THEN 'Incident'
        WHEN 'PROBLEM' THEN 'Problem'
        WHEN 'CHANGE' THEN 'Promjena'
        WHEN 'REQUEST' THEN 'Zahtjev'
        WHEN 'KNOWLEDGE' THEN 'Baza znanja'
        WHEN 'PROJECT' THEN 'Projekt'
        WHEN 'DEFECT' THEN 'Defekt'
        WHEN 'STORY' THEN 'Korisnička priča'
        WHEN 'EPIC' THEN 'Epika'
        WHEN 'SPRINT' THEN 'Sprint'
    END
FROM configuration.ticket_types tt
CROSS JOIN translations.languages l
WHERE l.locale = 'hr-HR';
