# Scripts de données

## 🔴 Données obligatoires (configuration système)

Ces scripts sont **nécessaires** au bon fonctionnement de l'application :

1. **04_ticket_status.sql** - Statuts des tickets (NEW, ASSIGNED, CLOSED, etc.)
2. **10_problem_categories.sql** - Catégories de problèmes
3. **19_location_status.sql** - Statuts des locations
4. **data_symptoms.sql** - Symptômes de base
5. **incident_config.sql** - Configuration des incidents
6. **07_entity_setup.sql** - Configuration des entités
7. **12_change.sql** - Configuration des changements
8. **12_changes_qa.sql** - Configuration QA des changements
9. **13_knowledge_articles_setup.sql** - Configuration des articles de connaissance
10. **14_project_setup.sql** - Configuration des projets
11. **15_defect_setup.sql** - Configuration des défauts

## 🟢 Données de test (optionnelles)

Ces scripts contiennent des données de démonstration :
7. **entities.sql** - Entités supplémentaires
8. **locations.sql** - Locations de test
9. **support_groups.sql** - Groupes de support
10. **persons.sql** - Personnes de test
11. **services.sql** - Services de test
12. **service_offerings.sql** - Offres de service
13. **configuration_items_seed.sql** - Items de configuration
14. **rel_entities_locations.sql** - Relations entités-locations
15. **rel_persons_groups.sql** - Relations personnes-groupes
16. **rel_subscribers_serviceofferings.sql** - Relations abonnements

## 📝 Notes

- Les scripts obligatoires doivent être exécutés en premier
- Les scripts de test peuvent être ignorés en production
- Les erreurs dans les scripts de test n'empêchent pas le fonctionnement de l'application
