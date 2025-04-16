-- Script: 12_change.sql
-- Description: Données de test pour les tables de gestion des changements
-- Date: 2025-04-16

-- Begin transaction
BEGIN;

-- A/ Données pour TYPE de changement
-- Insertion des codes
INSERT INTO configuration.change_setup_codes (uuid, metadata, code, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'TYPE', 'STANDARD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'TYPE', 'NORMAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'TYPE', 'URGENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en français
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'STANDARD', 'fr', 'Standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NORMAL', 'fr', 'Normal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'URGENT', 'fr', 'Urgent', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en anglais
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'STANDARD', 'en', 'Standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NORMAL', 'en', 'Normal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'URGENT', 'en', 'Urgent', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en portugais
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'STANDARD', 'pt', 'Padrão', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NORMAL', 'pt', 'Normal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'URGENT', 'pt', 'Urgente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en espagnol
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'STANDARD', 'es', 'Estándar', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NORMAL', 'es', 'Normal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'URGENT', 'es', 'Urgente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- B/ Données pour JUSTIFICATION de changement
-- Insertion des codes
INSERT INTO configuration.change_setup_codes (uuid, metadata, code, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'JUSTIFICATION', 'SECURITY_VULNERABILITY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'JUSTIFICATION', 'INCIDENT_RESOLUTION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'JUSTIFICATION', 'KNOWN_PROBLEM_RESOLUTION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'JUSTIFICATION', 'REGULATORY_COMPLIANCE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'JUSTIFICATION', 'STRATEGIC_BUSINESS_REQUEST', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'JUSTIFICATION', 'SYSTEM_PERFORMANCE_OPTIMIZATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'JUSTIFICATION', 'TECHNICAL_OBSOLESCENCE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'JUSTIFICATION', 'POTENTIAL_INCIDENT_PREVENTION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'JUSTIFICATION', 'AUDIT_RESULT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'JUSTIFICATION', 'PRODUCT_ROADMAP_ALIGNMENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'JUSTIFICATION', 'SERVICE_REVIEW_ACTION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en français
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'SECURITY_VULNERABILITY', 'fr', 'Correction d''une faille de sécurité', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INCIDENT_RESOLUTION', 'fr', 'Résolution d''un incident', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'KNOWN_PROBLEM_RESOLUTION', 'fr', 'Résolution d''un problème connu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REGULATORY_COMPLIANCE', 'fr', 'Mise en conformité réglementaire', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'STRATEGIC_BUSINESS_REQUEST', 'fr', 'Demande métier stratégique', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SYSTEM_PERFORMANCE_OPTIMIZATION', 'fr', 'Optimisation des performances système', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'TECHNICAL_OBSOLESCENCE', 'fr', 'Obsolescence technique / fin de support', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POTENTIAL_INCIDENT_PREVENTION', 'fr', 'Prévention d''un incident potentiel', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'AUDIT_RESULT', 'fr', 'Résultat d''un audit interne ou externe', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PRODUCT_ROADMAP_ALIGNMENT', 'fr', 'Alignement avec une roadmap produit', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SERVICE_REVIEW_ACTION', 'fr', 'Action issue d''une revue de service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en anglais
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'SECURITY_VULNERABILITY', 'en', 'Security vulnerability fix', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INCIDENT_RESOLUTION', 'en', 'Incident resolution', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'KNOWN_PROBLEM_RESOLUTION', 'en', 'Known problem resolution', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REGULATORY_COMPLIANCE', 'en', 'Regulatory compliance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'STRATEGIC_BUSINESS_REQUEST', 'en', 'Strategic business request', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SYSTEM_PERFORMANCE_OPTIMIZATION', 'en', 'System performance optimization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'TECHNICAL_OBSOLESCENCE', 'en', 'Technical obsolescence / end of support', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POTENTIAL_INCIDENT_PREVENTION', 'en', 'Potential incident prevention', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'AUDIT_RESULT', 'en', 'Internal or external audit result', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PRODUCT_ROADMAP_ALIGNMENT', 'en', 'Product roadmap alignment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SERVICE_REVIEW_ACTION', 'en', 'Service review action', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en portugais
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'SECURITY_VULNERABILITY', 'pt', 'Correção de vulnerabilidade de segurança', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INCIDENT_RESOLUTION', 'pt', 'Resolução de incidente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'KNOWN_PROBLEM_RESOLUTION', 'pt', 'Resolução de problema conhecido', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REGULATORY_COMPLIANCE', 'pt', 'Conformidade regulatória', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'STRATEGIC_BUSINESS_REQUEST', 'pt', 'Solicitação estratégica de negócios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SYSTEM_PERFORMANCE_OPTIMIZATION', 'pt', 'Otimização de desempenho do sistema', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'TECHNICAL_OBSOLESCENCE', 'pt', 'Obsolescência técnica / fim do suporte', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POTENTIAL_INCIDENT_PREVENTION', 'pt', 'Prevenção de incidente potencial', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'AUDIT_RESULT', 'pt', 'Resultado de auditoria interna ou externa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PRODUCT_ROADMAP_ALIGNMENT', 'pt', 'Alinhamento com roadmap do produto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SERVICE_REVIEW_ACTION', 'pt', 'Ação de revisão de serviço', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en espagnol
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'SECURITY_VULNERABILITY', 'es', 'Corrección de vulnerabilidad de seguridad', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INCIDENT_RESOLUTION', 'es', 'Resolución de incidente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'KNOWN_PROBLEM_RESOLUTION', 'es', 'Resolución de problema conocido', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REGULATORY_COMPLIANCE', 'es', 'Cumplimiento normativo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'STRATEGIC_BUSINESS_REQUEST', 'es', 'Solicitud estratégica de negocio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SYSTEM_PERFORMANCE_OPTIMIZATION', 'es', 'Optimización del rendimiento del sistema', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'TECHNICAL_OBSOLESCENCE', 'es', 'Obsolescencia técnica / fin de soporte', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POTENTIAL_INCIDENT_PREVENTION', 'es', 'Prevención de incidente potencial', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'AUDIT_RESULT', 'es', 'Resultado de auditoría interna o externa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PRODUCT_ROADMAP_ALIGNMENT', 'es', 'Alineación con hoja de ruta del producto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SERVICE_REVIEW_ACTION', 'es', 'Acción de revisión de servicio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- C/ Données pour OBJECTIVE de changement
-- Insertion des codes
INSERT INTO configuration.change_setup_codes (uuid, metadata, code, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'OBJECTIVE', 'IMPROVE_SERVICE_AVAILABILITY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'OBJECTIVE', 'REDUCE_OPERATIONAL_RISKS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'OBJECTIVE', 'INCREASE_PERFORMANCE_CAPACITY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'OBJECTIVE', 'ENSURE_LEGAL_COMPLIANCE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'OBJECTIVE', 'INTEGRATE_NEW_FEATURE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'OBJECTIVE', 'REDUCE_OPERATING_COSTS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'OBJECTIVE', 'STANDARDIZE_TECHNICAL_ENVIRONMENTS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'OBJECTIVE', 'ENHANCE_SYSTEM_SECURITY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'OBJECTIVE', 'IMPROVE_USER_EXPERIENCE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'OBJECTIVE', 'ANTICIPATE_FUTURE_NEEDS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en français
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'IMPROVE_SERVICE_AVAILABILITY', 'fr', 'Améliorer la disponibilité du service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REDUCE_OPERATIONAL_RISKS', 'fr', 'Réduire les risques opérationnels', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INCREASE_PERFORMANCE_CAPACITY', 'fr', 'Accroître la performance ou la capacité', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENSURE_LEGAL_COMPLIANCE', 'fr', 'Garantir la conformité légale ou normative', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INTEGRATE_NEW_FEATURE', 'fr', 'Intégrer une nouvelle fonctionnalité', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REDUCE_OPERATING_COSTS', 'fr', 'Réduire les coûts d''exploitation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'STANDARDIZE_TECHNICAL_ENVIRONMENTS', 'fr', 'Standardiser les environnements techniques', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENHANCE_SYSTEM_SECURITY', 'fr', 'Renforcer la sécurité des systèmes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPROVE_USER_EXPERIENCE', 'fr', 'Améliorer l''expérience utilisateur', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ANTICIPATE_FUTURE_NEEDS', 'fr', 'Anticiper une montée en charge ou un besoin futur', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en anglais
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'IMPROVE_SERVICE_AVAILABILITY', 'en', 'Improve service availability', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REDUCE_OPERATIONAL_RISKS', 'en', 'Reduce operational risks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INCREASE_PERFORMANCE_CAPACITY', 'en', 'Increase performance or capacity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENSURE_LEGAL_COMPLIANCE', 'en', 'Ensure legal or regulatory compliance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INTEGRATE_NEW_FEATURE', 'en', 'Integrate new feature', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REDUCE_OPERATING_COSTS', 'en', 'Reduce operating costs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'STANDARDIZE_TECHNICAL_ENVIRONMENTS', 'en', 'Standardize technical environments', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENHANCE_SYSTEM_SECURITY', 'en', 'Enhance system security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPROVE_USER_EXPERIENCE', 'en', 'Improve user experience', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ANTICIPATE_FUTURE_NEEDS', 'en', 'Anticipate future needs or capacity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en portugais
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'IMPROVE_SERVICE_AVAILABILITY', 'pt', 'Melhorar a disponibilidade do serviço', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REDUCE_OPERATIONAL_RISKS', 'pt', 'Reduzir riscos operacionais', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INCREASE_PERFORMANCE_CAPACITY', 'pt', 'Aumentar desempenho ou capacidade', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENSURE_LEGAL_COMPLIANCE', 'pt', 'Garantir conformidade legal ou regulatória', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INTEGRATE_NEW_FEATURE', 'pt', 'Integrar nova funcionalidade', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REDUCE_OPERATING_COSTS', 'pt', 'Reduzir custos operacionais', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'STANDARDIZE_TECHNICAL_ENVIRONMENTS', 'pt', 'Padronizar ambientes técnicos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENHANCE_SYSTEM_SECURITY', 'pt', 'Reforçar a segurança dos sistemas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPROVE_USER_EXPERIENCE', 'pt', 'Melhorar a experiência do usuário', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ANTICIPATE_FUTURE_NEEDS', 'pt', 'Antecipar necessidades futuras ou aumento de capacidade', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en espagnol
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'IMPROVE_SERVICE_AVAILABILITY', 'es', 'Mejorar la disponibilidad del servicio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REDUCE_OPERATIONAL_RISKS', 'es', 'Reducir riesgos operacionales', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INCREASE_PERFORMANCE_CAPACITY', 'es', 'Aumentar rendimiento o capacidad', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENSURE_LEGAL_COMPLIANCE', 'es', 'Garantizar cumplimiento legal o normativo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INTEGRATE_NEW_FEATURE', 'es', 'Integrar nueva funcionalidad', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REDUCE_OPERATING_COSTS', 'es', 'Reducir costos operativos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'STANDARDIZE_TECHNICAL_ENVIRONMENTS', 'es', 'Estandarizar entornos técnicos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENHANCE_SYSTEM_SECURITY', 'es', 'Reforzar la seguridad de los sistemas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPROVE_USER_EXPERIENCE', 'es', 'Mejorar la experiencia del usuario', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ANTICIPATE_FUTURE_NEEDS', 'es', 'Anticipar necesidades futuras o aumento de capacidad', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- D/ Données pour CAB_VALIDATION_STATUS de changement
-- Insertion des codes
INSERT INTO configuration.change_setup_codes (uuid, metadata, code, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'CAB_VALIDATION_STATUS', 'PENDING_VALIDATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CAB_VALIDATION_STATUS', 'VALIDATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CAB_VALIDATION_STATUS', 'VALIDATED_WITH_CONDITIONS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CAB_VALIDATION_STATUS', 'REJECTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CAB_VALIDATION_STATUS', 'POSTPONED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CAB_VALIDATION_STATUS', 'CANCELLED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CAB_VALIDATION_STATUS', 'NOT_APPLICABLE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CAB_VALIDATION_STATUS', 'UNDER_REVIEW', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CAB_VALIDATION_STATUS', 'APPROVED_BY_EXCEPTION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en français
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'PENDING_VALIDATION', 'fr', 'En attente de validation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATED', 'fr', 'Validé', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATED_WITH_CONDITIONS', 'fr', 'Validé avec conditions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REJECTED', 'fr', 'Rejeté', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POSTPONED', 'fr', 'Reporté', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CANCELLED', 'fr', 'Annulé', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NOT_APPLICABLE', 'fr', 'Non applicable (pour les changements standard)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'UNDER_REVIEW', 'fr', 'En révision (besoin d\'informations complémentaires)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'APPROVED_BY_EXCEPTION', 'fr', 'Approuvé par dérogation (urgences validées en dehors du CAB formel)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en anglais
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'PENDING_VALIDATION', 'en', 'Pending validation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATED', 'en', 'Validated', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATED_WITH_CONDITIONS', 'en', 'Validated with conditions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REJECTED', 'en', 'Rejected', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POSTPONED', 'en', 'Postponed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CANCELLED', 'en', 'Cancelled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NOT_APPLICABLE', 'en', 'Not applicable (for standard changes)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'UNDER_REVIEW', 'en', 'Under review (additional information needed)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'APPROVED_BY_EXCEPTION', 'en', 'Approved by exception (emergencies validated outside formal CAB)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en portugais
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'PENDING_VALIDATION', 'pt', 'Aguardando validação', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATED', 'pt', 'Validado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATED_WITH_CONDITIONS', 'pt', 'Validado com condições', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REJECTED', 'pt', 'Rejeitado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POSTPONED', 'pt', 'Adiado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CANCELLED', 'pt', 'Cancelado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NOT_APPLICABLE', 'pt', 'Não aplicável (para mudanças padrão)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'UNDER_REVIEW', 'pt', 'Em revisão (informações adicionais necessárias)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'APPROVED_BY_EXCEPTION', 'pt', 'Aprovado por exceção (emergências validadas fora do CAB formal)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en espagnol
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'PENDING_VALIDATION', 'es', 'Pendiente de validación', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATED', 'es', 'Validado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATED_WITH_CONDITIONS', 'es', 'Validado con condiciones', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'REJECTED', 'es', 'Rechazado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POSTPONED', 'es', 'Pospuesto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CANCELLED', 'es', 'Cancelado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NOT_APPLICABLE', 'es', 'No aplicable (para cambios estándar)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'UNDER_REVIEW', 'es', 'En revisión (información adicional necesaria)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'APPROVED_BY_EXCEPTION', 'es', 'Aprobado por excepción (emergencias validadas fuera del CAB formal)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- E/ Données pour VALIDATION_LEVEL de changement
-- Insertion des codes
INSERT INTO configuration.change_setup_codes (uuid, metadata, code, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'VALIDATION_LEVEL', 'TECHNICAL_VALIDATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATION_LEVEL', 'SECURITY_VALIDATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATION_LEVEL', 'BUSINESS_VALIDATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATION_LEVEL', 'FINANCIAL_VALIDATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATION_LEVEL', 'CAB_VALIDATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATION_LEVEL', 'EMERGENCY_CAB_VALIDATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATION_LEVEL', 'CIO_VALIDATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATION_LEVEL', 'VENDOR_VALIDATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATION_LEVEL', 'PROCESS_VALIDATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VALIDATION_LEVEL', 'NO_VALIDATION_REQUIRED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en français
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'TECHNICAL_VALIDATION', 'fr', 'Validation technique (ex. architecte, expert infra)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SECURITY_VALIDATION', 'fr', 'Validation sécurité (RSSI, DPO)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'BUSINESS_VALIDATION', 'fr', 'Validation métier (responsable de service, product owner)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'FINANCIAL_VALIDATION', 'fr', 'Validation financière (contrôle de gestion, budget)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CAB_VALIDATION', 'fr', 'Validation du CAB', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'EMERGENCY_CAB_VALIDATION', 'fr', 'Validation du CAB urgence', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CIO_VALIDATION', 'fr', 'Validation DSI / IT Manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VENDOR_VALIDATION', 'fr', 'Validation fournisseur (si prestataire impliqué)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PROCESS_VALIDATION', 'fr', 'Validation processus (change manager, ITSM)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NO_VALIDATION_REQUIRED', 'fr', 'Pas de validation requise (pour les changements standard)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en anglais
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'TECHNICAL_VALIDATION', 'en', 'Technical validation (e.g. architect, infra expert)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SECURITY_VALIDATION', 'en', 'Security validation (CISO, DPO)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'BUSINESS_VALIDATION', 'en', 'Business validation (service owner, product owner)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'FINANCIAL_VALIDATION', 'en', 'Financial validation (financial control, budget)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CAB_VALIDATION', 'en', 'CAB validation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'EMERGENCY_CAB_VALIDATION', 'en', 'Emergency CAB validation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CIO_VALIDATION', 'en', 'CIO / IT Manager validation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VENDOR_VALIDATION', 'en', 'Vendor validation (if provider involved)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PROCESS_VALIDATION', 'en', 'Process validation (change manager, ITSM)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NO_VALIDATION_REQUIRED', 'en', 'No validation required (for standard changes)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en portugais
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'TECHNICAL_VALIDATION', 'pt', 'Validação técnica (ex. arquiteto, especialista em infra)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SECURITY_VALIDATION', 'pt', 'Validação de segurança (CISO, DPO)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'BUSINESS_VALIDATION', 'pt', 'Validação de negócios (responsável pelo serviço, product owner)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'FINANCIAL_VALIDATION', 'pt', 'Validação financeira (controle financeiro, orçamento)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CAB_VALIDATION', 'pt', 'Validação do CAB', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'EMERGENCY_CAB_VALIDATION', 'pt', 'Validação do CAB de emergência', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CIO_VALIDATION', 'pt', 'Validação do CIO / Gerente de TI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VENDOR_VALIDATION', 'pt', 'Validação do fornecedor (se provedor envolvido)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PROCESS_VALIDATION', 'pt', 'Validação de processo (gerente de mudanças, ITSM)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NO_VALIDATION_REQUIRED', 'pt', 'Nenhuma validação necessária (para mudanças padrão)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en espagnol
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'TECHNICAL_VALIDATION', 'es', 'Validación técnica (ej. arquitecto, experto en infraestructura)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SECURITY_VALIDATION', 'es', 'Validación de seguridad (CISO, DPO)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'BUSINESS_VALIDATION', 'es', 'Validación de negocio (responsable de servicio, product owner)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'FINANCIAL_VALIDATION', 'es', 'Validación financiera (control financiero, presupuesto)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CAB_VALIDATION', 'es', 'Validación del CAB', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'EMERGENCY_CAB_VALIDATION', 'es', 'Validación del CAB de emergencia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CIO_VALIDATION', 'es', 'Validación del CIO / Gerente de TI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VENDOR_VALIDATION', 'es', 'Validación del proveedor (si está involucrado)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PROCESS_VALIDATION', 'es', 'Validación de proceso (gestor de cambios, ITSM)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NO_VALIDATION_REQUIRED', 'es', 'No se requiere validación (para cambios estándar)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- F/ Données pour POST_IMPLEMENTATION_EVALUATION de changement
-- Insertion des codes
INSERT INTO configuration.change_setup_codes (uuid, metadata, code, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'POST_IMPLEMENTATION_EVALUATION', 'TOTAL_SUCCESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POST_IMPLEMENTATION_EVALUATION', 'SUCCESS_MINOR_IMPACTS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POST_IMPLEMENTATION_EVALUATION', 'PARTIAL_SUCCESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POST_IMPLEMENTATION_EVALUATION', 'FAILURE_ROLLBACK', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POST_IMPLEMENTATION_EVALUATION', 'FAILURE_OPERATIONAL_IMPACT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POST_IMPLEMENTATION_EVALUATION', 'NOT_EVALUATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'POST_IMPLEMENTATION_EVALUATION', 'EVALUATION_IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en français
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'TOTAL_SUCCESS', 'fr', 'Succès total, sans incident', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SUCCESS_MINOR_IMPACTS', 'fr', 'Succès avec impacts mineurs maîtrisés', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PARTIAL_SUCCESS', 'fr', 'Succès partiel, avec impacts modérés', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'FAILURE_ROLLBACK', 'fr', 'Echec, retour arrière effectué', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'FAILURE_OPERATIONAL_IMPACT', 'fr', 'Échec, avec conséquences opérationnelles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NOT_EVALUATED', 'fr', 'Non évalué', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'EVALUATION_IN_PROGRESS', 'fr', 'Évaluation en cours', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en anglais
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'TOTAL_SUCCESS', 'en', 'Total success, no incident', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SUCCESS_MINOR_IMPACTS', 'en', 'Success with minor controlled impacts', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PARTIAL_SUCCESS', 'en', 'Partial success with moderate impacts', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'FAILURE_ROLLBACK', 'en', 'Failure, rollback completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'FAILURE_OPERATIONAL_IMPACT', 'en', 'Failure with operational consequences', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NOT_EVALUATED', 'en', 'Not evaluated', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'EVALUATION_IN_PROGRESS', 'en', 'Evaluation in progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en portugais
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'TOTAL_SUCCESS', 'pt', 'Sucesso total, sem incidente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SUCCESS_MINOR_IMPACTS', 'pt', 'Sucesso com impactos menores controlados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PARTIAL_SUCCESS', 'pt', 'Sucesso parcial com impactos moderados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'FAILURE_ROLLBACK', 'pt', 'Falha, rollback concluído', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'FAILURE_OPERATIONAL_IMPACT', 'pt', 'Falha com consequências operacionais', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NOT_EVALUATED', 'pt', 'Não avaliado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'EVALUATION_IN_PROGRESS', 'pt', 'Avaliação em andamento', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en espagnol
INSERT INTO translations.change_setup_label (uuid, rel_change_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'TOTAL_SUCCESS', 'es', 'Éxito total, sin incidentes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SUCCESS_MINOR_IMPACTS', 'es', 'Éxito con impactos menores controlados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PARTIAL_SUCCESS', 'es', 'Éxito parcial con impactos moderados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'FAILURE_ROLLBACK', 'es', 'Fallo, rollback completado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'FAILURE_OPERATIONAL_IMPACT', 'es', 'Fallo con consecuencias operativas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NOT_EVALUATED', 'es', 'No evaluado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'EVALUATION_IN_PROGRESS', 'es', 'Evaluación en curso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Commit transaction
COMMIT;
