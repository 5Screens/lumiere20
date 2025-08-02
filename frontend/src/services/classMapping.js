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
  'DefectSetup': DefectSetup
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
