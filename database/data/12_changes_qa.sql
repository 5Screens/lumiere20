-- Script: 12_changes_qa.sql
-- Description: Données de test pour les tables de gestion des questions d'évaluation des changements
-- Date: 2025-04-16

-- Begin transaction
BEGIN;

-- A/ Données pour change_questions_codes
-- Insertion des codes de questions
INSERT INTO configuration.change_questions_codes (uuid, metadata, question_id, code, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'RISK', 'R_Q1', 'R_Q1_CODE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q2', 'R_Q2_CODE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q3', 'R_Q3_CODE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q4', 'R_Q4_CODE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q5', 'R_Q5_CODE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q1', 'I_Q1_CODE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q2', 'I_Q2_CODE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q3', 'I_Q3_CODE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q4', 'I_Q4_CODE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- B/ Données pour change_questions_labels
-- Insertion des libellés en français
INSERT INTO translations.change_questions_labels (uuid, rel_change_question_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'R_Q1_CODE', 'fr', 'Connaissance de l''élément de configuration concerné', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_CODE', 'fr', 'Conflit de calendrier', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_CODE', 'fr', 'Retour arrière / capacité de remédiation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_CODE', 'fr', 'Maturité technilogique', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q5_CODE', 'fr', 'Est-ce la première itération du changement ?', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_CODE', 'fr', 'Durée de la mise en œuvre', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_CODE', 'fr', 'Disponibilité des services aux métiers', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_CODE', 'fr', 'Impact sur les utilisateurs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_CODE', 'fr', 'Impact sur les services métiers', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des libellés en anglais
INSERT INTO translations.change_questions_labels (uuid, rel_change_question_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'R_Q1_CODE', 'en', 'Knowledge of the configuration item concerned', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_CODE', 'en', 'Schedule conflict', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_CODE', 'en', 'Rollback / remediation capability', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_CODE', 'en', 'Technological maturity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q5_CODE', 'en', 'Is this the first iteration of the change?', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_CODE', 'en', 'Implementation duration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_CODE', 'en', 'Availability of business services', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_CODE', 'en', 'Impact on users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_CODE', 'en', 'Impact on business services', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des libellés en espagnol
INSERT INTO translations.change_questions_labels (uuid, rel_change_question_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'R_Q1_CODE', 'es', 'Conocimiento del elemento de configuración afectado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_CODE', 'es', 'Conflicto de calendario', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_CODE', 'es', 'Capacidad de retroceso / remediación', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_CODE', 'es', 'Madurez tecnológica', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q5_CODE', 'es', '¿Es esta la primera iteración del cambio?', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_CODE', 'es', 'Duración de la implementación', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_CODE', 'es', 'Disponibilidad de servicios empresariales', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_CODE', 'es', 'Impacto en los usuarios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_CODE', 'es', 'Impacto en los servicios empresariales', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des libellés en portugais
INSERT INTO translations.change_questions_labels (uuid, rel_change_question_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'R_Q1_CODE', 'pt', 'Conhecimento do item de configuração em questão', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_CODE', 'pt', 'Conflito de agenda', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_CODE', 'pt', 'Capacidade de reversão / remediação', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_CODE', 'pt', 'Maturidade tecnológica', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q5_CODE', 'pt', 'Esta é a primeira iteração da mudança?', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_CODE', 'pt', 'Duração da implementação', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_CODE', 'pt', 'Disponibilidade de serviços de negócios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_CODE', 'pt', 'Impacto nos usuários', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_CODE', 'pt', 'Impacto nos serviços de negócios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- C/ Données pour change_options_codes
-- Insertion des codes d'options
INSERT INTO configuration.change_options_codes (uuid, metadata, question_id, code, weight, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'RISK', 'R_Q1', 'R_Q1_OPT1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q1', 'R_Q1_OPT2', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q1', 'R_Q1_OPT3', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q2', 'R_Q2_OPT1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q2', 'R_Q2_OPT2', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q2', 'R_Q2_OPT3', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q3', 'R_Q3_OPT1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q3', 'R_Q3_OPT2', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q3', 'R_Q3_OPT3', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q4', 'R_Q4_OPT1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q4', 'R_Q4_OPT2', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q4', 'R_Q4_OPT3', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q5', 'R_Q5_OPT1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RISK', 'R_Q5', 'R_Q5_OPT2', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q1', 'I_Q1_OPT1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q1', 'I_Q1_OPT2', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q1', 'I_Q1_OPT3', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q2', 'I_Q2_OPT1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q2', 'I_Q2_OPT2', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q2', 'I_Q2_OPT3', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q3', 'I_Q3_OPT1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q3', 'I_Q3_OPT2', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q3', 'I_Q3_OPT3', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q4', 'I_Q4_OPT1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q4', 'I_Q4_OPT2', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'I_Q4', 'I_Q4_OPT3', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- D/ Données pour change_options_labels
-- Insertion des libellés en français
INSERT INTO translations.change_options_labels (uuid, rel_change_option_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'R_Q1_OPT1', 'fr', 'Tous les éléments modifiés et touchés sont identifiés', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q1_OPT2', 'fr', 'Une partie des éléments modifiées et touchés est identifiée', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q1_OPT3', 'fr', 'Les éléments modifiés et impactés ne sont pas identifiés', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_OPT1', 'fr', 'Il n''y a pas de conflit de calendrier avec ce changement', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_OPT2', 'fr', 'Il y a un conflit de calendrier identifié, évalué et convenu avec ce changement', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_OPT3', 'fr', 'Il y a un conflit de calendrier identifié mais pas encore évalué avec ce changement', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_OPT1', 'fr', 'Les plans de retour arrière sont bien documentés, testés et ont été exécutés avec succès ou ne sont pas applicables', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_OPT2', 'fr', 'Les plans de retour arrière sont bien documentés, mais n''ont pas été testés et/ou n''ont été que rarement mis en œuvre', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_OPT3', 'fr', 'Les plans de retour arrière ne sont pas documentés, et/ou n''ont pas été testés, ou n''ont pas été exécutés avec succès', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_OPT1', 'fr', 'Le changement est appliqué à une infrastructure/application existante et stable', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_OPT2', 'fr', 'Le changement est appliqué à une infrastructure/application existante qui présente un problème de stabilité connu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_OPT3', 'fr', 'Le changement est appliqué à une nouvelle infrastructure / application', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q5_OPT1', 'fr', 'Non', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q5_OPT2', 'fr', 'Oui', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_OPT1', 'fr', 'La mise en œuvre sera achevée en moins d''une heure', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_OPT2', 'fr', 'La mise en œuvre prendra jusqu''à 4 h', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_OPT3', 'fr', 'La mise en œuvre prendra plus de 4 heures', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_OPT1', 'fr', 'La modification est appliquée en dehors des heures de bureau', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_OPT2', 'fr', 'Le changement est appliqué pendant les heures de bureau sans interruption de service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_OPT3', 'fr', 'Le changement est appliqué pendant les heures de bureau avec interruption de service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_OPT1', 'fr', 'Le changement est visible par un seul pays', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_OPT2', 'fr', 'Le changement est visible par plusieurs pays', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_OPT3', 'fr', 'Le changement est visible pour les patients', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_OPT1', 'fr', 'Un service bronze est impactés.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_OPT2', 'fr', 'Un service argent est affectés.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_OPT3', 'fr', 'Un service or est affectés.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des libellés en anglais
INSERT INTO translations.change_options_labels (uuid, rel_change_option_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'R_Q1_OPT1', 'en', 'All modified and affected elements are identified', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q1_OPT2', 'en', 'Some of the modified and affected elements are identified', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q1_OPT3', 'en', 'Modified and impacted elements are not identified', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_OPT1', 'en', 'There is no schedule conflict with this change', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_OPT2', 'en', 'There is an identified, assessed and agreed schedule conflict with this change', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_OPT3', 'en', 'There is an identified but not yet assessed schedule conflict with this change', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_OPT1', 'en', 'Rollback plans are well documented, tested and have been successfully executed or are not applicable', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_OPT2', 'en', 'Rollback plans are well documented, but have not been tested and/or have rarely been implemented', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_OPT3', 'en', 'Rollback plans are not documented, and/or have not been tested, or have not been successfully executed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_OPT1', 'en', 'The change is applied to an existing and stable infrastructure/application', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_OPT2', 'en', 'The change is applied to an existing infrastructure/application that has a known stability issue', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_OPT3', 'en', 'The change is applied to a new infrastructure/application', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q5_OPT1', 'en', 'No', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q5_OPT2', 'en', 'Yes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_OPT1', 'en', 'Implementation will be completed in less than one hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_OPT2', 'en', 'Implementation will take up to 4 hours', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_OPT3', 'en', 'Implementation will take more than 4 hours', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_OPT1', 'en', 'The change is applied outside of business hours', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_OPT2', 'en', 'The change is applied during business hours without service interruption', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_OPT3', 'en', 'The change is applied during business hours with service interruption', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_OPT1', 'en', 'The change is visible to a single country', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_OPT2', 'en', 'The change is visible to multiple countries', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_OPT3', 'en', 'The change is visible to patients', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_OPT1', 'en', 'A bronze service is impacted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_OPT2', 'en', 'A silver service is affected', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_OPT3', 'en', 'A gold service is affected', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des libellés en espagnol
INSERT INTO translations.change_options_labels (uuid, rel_change_option_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'R_Q1_OPT1', 'es', 'Todos los elementos modificados y afectados están identificados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q1_OPT2', 'es', 'Algunos de los elementos modificados y afectados están identificados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q1_OPT3', 'es', 'Los elementos modificados e impactados no están identificados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_OPT1', 'es', 'No hay conflicto de calendario con este cambio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_OPT2', 'es', 'Hay un conflicto de calendario identificado, evaluado y acordado con este cambio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_OPT3', 'es', 'Hay un conflicto de calendario identificado pero aún no evaluado con este cambio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_OPT1', 'es', 'Los planes de retroceso están bien documentados, probados y se han ejecutado con éxito o no son aplicables', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_OPT2', 'es', 'Los planes de retroceso están bien documentados, pero no se han probado y/o rara vez se han implementado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_OPT3', 'es', 'Los planes de retroceso no están documentados, y/o no se han probado, o no se han ejecutado con éxito', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_OPT1', 'es', 'El cambio se aplica a una infraestructura/aplicación existente y estable', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_OPT2', 'es', 'El cambio se aplica a una infraestructura/aplicación existente que tiene un problema de estabilidad conocido', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_OPT3', 'es', 'El cambio se aplica a una nueva infraestructura/aplicación', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q5_OPT1', 'es', 'No', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q5_OPT2', 'es', 'Sí', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_OPT1', 'es', 'La implementación se completará en menos de una hora', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_OPT2', 'es', 'La implementación tomará hasta 4 horas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_OPT3', 'es', 'La implementación tomará más de 4 horas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_OPT1', 'es', 'El cambio se aplica fuera del horario laboral', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_OPT2', 'es', 'El cambio se aplica durante el horario laboral sin interrupción del servicio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_OPT3', 'es', 'El cambio se aplica durante el horario laboral con interrupción del servicio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_OPT1', 'es', 'El cambio es visible para un solo país', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_OPT2', 'es', 'El cambio es visible para varios países', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_OPT3', 'es', 'El cambio es visible para los pacientes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_OPT1', 'es', 'Un servicio de bronce está afectado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_OPT2', 'es', 'Un servicio de plata está afectado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_OPT3', 'es', 'Un servicio de oro está afectado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des libellés en portugais
INSERT INTO translations.change_options_labels (uuid, rel_change_option_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'R_Q1_OPT1', 'pt', 'Todos os elementos modificados e afetados estão identificados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q1_OPT2', 'pt', 'Alguns dos elementos modificados e afetados estão identificados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q1_OPT3', 'pt', 'Elementos modificados e impactados não estão identificados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_OPT1', 'pt', 'Não há conflito de agenda com esta mudança', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_OPT2', 'pt', 'Há um conflito de agenda identificado, avaliado e acordado com esta mudança', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q2_OPT3', 'pt', 'Há um conflito de agenda identificado, mas ainda não avaliado com esta mudança', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_OPT1', 'pt', 'Os planos de rollback estão bem documentados, testados e foram executados com sucesso ou não são aplicáveis', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_OPT2', 'pt', 'Os planos de rollback estão bem documentados, mas não foram testados e/ou raramente foram implementados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q3_OPT3', 'pt', 'Os planos de rollback não estão documentados, e/ou não foram testados, ou não foram executados com sucesso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_OPT1', 'pt', 'A mudança é aplicada a uma infraestrutura/aplicação existente e estável', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_OPT2', 'pt', 'A mudança é aplicada a uma infraestrutura/aplicação existente que tem um problema de estabilidade conhecido', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q4_OPT3', 'pt', 'A mudança é aplicada a uma nova infraestrutura/aplicação', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q5_OPT1', 'pt', 'Não', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'R_Q5_OPT2', 'pt', 'Sim', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_OPT1', 'pt', 'A implementação será concluída em menos de uma hora', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_OPT2', 'pt', 'A implementação levará até 4 horas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q1_OPT3', 'pt', 'A implementação levará mais de 4 horas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_OPT1', 'pt', 'A mudança é aplicada fora do horário comercial', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_OPT2', 'pt', 'A mudança é aplicada durante o horário comercial sem interrupção de serviço', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q2_OPT3', 'pt', 'A mudança é aplicada durante o horário comercial com interrupção de serviço', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_OPT1', 'pt', 'A mudança é visível para um único país', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_OPT2', 'pt', 'A mudança é visível para vários países', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q3_OPT3', 'pt', 'A mudança é visível para os pacientes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_OPT1', 'pt', 'Um serviço bronze é afetado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_OPT2', 'pt', 'Um serviço prata é afetado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'I_Q4_OPT3', 'pt', 'Um serviço ouro é afetado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Commit transaction
COMMIT;
