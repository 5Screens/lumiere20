/**
 * Service de mapping entre les noms de classes (string) et les classes JavaScript
 * Utilisé pour résoudre le problème de sérialisation des classes dans localStorage
 */

import { Entity } from '@/models/Entity'
import { Symptom } from '@/models/Symptom'
import { Task } from '@/models/Task'
import { Incident } from '@/models/Incident'
import { Problem } from '@/models/Problem'
import { Change } from '@/models/Change'
import { Knowledge_article } from '@/models/Knowledge_article'
import { Project } from '@/models/Project'
import { Sprint } from '@/models/Sprint'
import { Epic } from '@/models/Epic'
import { Story } from '@/models/Story'
import { Defect } from '@/models/Defect'
import { ContactType } from '@/models/ContactType'
import { DefectSetup } from '@/models/DefectSetup'
import { KnowledgeSetup } from '@/models/KnowledgeSetup'
import { ProjectSetup } from '@/models/ProjectSetup'
import { ChangeOptions } from '@/models/ChangeOptions'
import { ChangeQuestions } from '@/models/ChangeQuestions'
import { ChangeSetup } from '@/models/ChangeSetup'
import { ProblemCategories } from '@/models/ProblemCategories'
import { EntitySetup } from '@/models/EntitySetup'
import { IncidentSetup } from '@/models/IncidentSetup'
import { Group } from '@/models/Group'
import { Person } from '@/models/Person'
import { Location } from '@/models/Location'

/**
 * Mapping des noms de classes vers les classes JavaScript
 */
const CLASS_MAP = {
  'Entity': Entity,
  'Symptom': Symptom,
  'Task': Task,
  'Incident': Incident,
  'Problem': Problem,
  'Change': Change,
  'Knowledge_article': Knowledge_article,
  'Project': Project,
  'Sprint': Sprint,
  'Epic': Epic,
  'Story': Story,
  'Defect': Defect,
  'ContactType': ContactType,
  'DefectSetup': DefectSetup,
  'KnowledgeSetup': KnowledgeSetup,
  'ProjectSetup': ProjectSetup,
  'ChangeOptions': ChangeOptions,
  'ChangeQuestions': ChangeQuestions,
  'ChangeSetup': ChangeSetup,
  'ProblemCategories': ProblemCategories,
  'EntitySetup': EntitySetup,
  'IncidentSetup': IncidentSetup,
  'Group': Group,
  'Person': Person,
  'Location': Location
}

/**
 * Récupère une classe JavaScript à partir de son nom
 * @param {string} className - Nom de la classe (ex: 'Incident')
 * @returns {Function|null} - La classe correspondante ou null si non trouvée
 */
export const getClassByName = (className) => {
  if (!className || typeof className !== 'string') {
    console.warn('[ClassMapping] Nom de classe invalide:', className)
    return null
  }

  const ModelClass = CLASS_MAP[className]
  
  if (!ModelClass) {
    console.warn('[ClassMapping] Classe non trouvée pour le nom:', className)
    return null
  }

  console.log(`[ClassMapping] Classe trouvée: ${className} ->`, ModelClass.name)
  return ModelClass
}

/**
 * Récupère le nom de classe à partir d'une classe JavaScript
 * @param {Function} ModelClass - La classe JavaScript
 * @returns {string|null} - Le nom de la classe ou null si non trouvée
 */
export const getNameByClass = (ModelClass) => {
  if (!ModelClass || typeof ModelClass !== 'function') {
    console.warn('[ClassMapping] Classe invalide:', ModelClass)
    return null
  }

  // Recherche inverse dans le mapping
  for (const [name, cls] of Object.entries(CLASS_MAP)) {
    if (cls === ModelClass) {
      console.log(`[ClassMapping] Nom trouvé: ${ModelClass.name} -> ${name}`)
      return name
    }
  }

  console.warn('[ClassMapping] Nom non trouvé pour la classe:', ModelClass.name)
  return null
}

/**
 * Vérifie si un nom de classe est valide
 * @param {string} className - Nom de la classe à vérifier
 * @returns {boolean} - true si le nom est valide, false sinon
 */
export const isValidClassName = (className) => {
  return typeof className === 'string' && CLASS_MAP.hasOwnProperty(className)
}

/**
 * Retourne la liste de tous les noms de classes disponibles
 * @returns {string[]} - Liste des noms de classes
 */
export const getAvailableClassNames = () => {
  return Object.keys(CLASS_MAP)
}

/**
 * Mapping des noms de classes vers les types de tickets pour l'API
 */
const TICKET_TYPE_MAP = {
  'Task': 'TASK',
  'Incident': 'INCIDENT',
  'Problem': 'PROBLEM',
  'Change': 'CHANGE',
  'Defect': 'DEFECT',
  'Knowledge_article': 'KNOWLEDGE',
  'Project': 'PROJECT',
  'Sprint': 'SPRINT',
  'Epic': 'EPIC',
  'Story': 'STORY'
}

/**
 * Récupère le type de ticket pour l'API à partir du nom de classe
 * @param {string} className - Nom de la classe (ex: 'Task', 'Incident')
 * @returns {string|null} - Le type de ticket en majuscules (ex: 'TASK') ou null si non applicable
 */
export const getTicketTypeFromClassName = (className) => {
  if (!className || typeof className !== 'string') {
    return null
  }
  
  return TICKET_TYPE_MAP[className] || null
}

/**
 * Vérifie si une classe est un type de ticket
 * @param {string} className - Nom de la classe
 * @returns {boolean} - true si c'est un type de ticket, false sinon
 */
export const isTicketClass = (className) => {
  return TICKET_TYPE_MAP.hasOwnProperty(className)
}
