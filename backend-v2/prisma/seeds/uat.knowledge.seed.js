/**
 * UAT seed for creating real knowledge articles for testing.
 * Creates practical, detailed knowledge articles with proper extended_core_fields.
 *
 * Usage:
 *   node prisma/seeds/run-single.js uat-knowledge
 */

const seedUatKnowledge = async (prisma) => {
  console.log('UAT Knowledge seed starting...');

  // Get a writer (first person found)
  const writer = await prisma.persons.findFirst({
    where: { is_active: true },
    select: { uuid: true }
  });

  if (!writer) {
    console.log('No active person found to use as writer. Run uat seed first.');
    return;
  }

  console.log(`Using writer: ${writer.uuid}`);

  // Real knowledge articles with detailed content
  const knowledgeArticles = [
    {
      title: 'Comment créer un tableau croisé dynamique (TCD) dans Excel',
      description: `# Comment créer un tableau croisé dynamique (TCD) dans Excel

## Introduction
Un tableau croisé dynamique (TCD) est un outil puissant d'Excel qui permet d'analyser, résumer et présenter des données de manière interactive. Ce guide vous explique étape par étape comment créer votre premier TCD.

## Étapes de création

### 1. Préparer vos données
Avant de créer un TCD, assurez-vous que vos données sont bien structurées :
- Chaque colonne doit avoir un en-tête unique
- Pas de lignes ou colonnes vides dans vos données
- Les données doivent être cohérentes (même format par colonne)

### 2. Sélectionner vos données
1. Cliquez sur une cellule dans votre plage de données
2. Excel détectera automatiquement la plage complète

### 3. Insérer le tableau croisé dynamique
1. Allez dans l'onglet **Insertion**
2. Cliquez sur **Tableau croisé dynamique**
3. Vérifiez que la plage de données est correcte
4. Choisissez l'emplacement : nouvelle feuille ou feuille existante
5. Cliquez sur **OK**

### 4. Configurer le TCD
Dans le volet **Champs de tableau croisé dynamique** à droite :
- **Filtres** : Glissez les champs pour filtrer l'ensemble du rapport
- **Colonnes** : Glissez les champs pour créer des en-têtes de colonnes
- **Lignes** : Glissez les champs pour créer des en-têtes de lignes
- **Valeurs** : Glissez les champs numériques à agréger (somme, moyenne, etc.)

### 5. Personnaliser l'affichage
- Clic droit sur une valeur > **Paramètres des champs de valeurs** pour changer le calcul
- Onglet **Création** pour modifier le style du tableau
- Double-clic sur un en-tête pour renommer

## Exemple pratique
Pour analyser des ventes par région et par produit :
1. Glissez "Région" dans Lignes
2. Glissez "Produit" dans Colonnes
3. Glissez "Montant" dans Valeurs

## Actualiser les données
Quand vos données source changent :
1. Clic droit sur le TCD
2. Sélectionnez **Actualiser**

Ou utilisez le raccourci **Alt + F5**

## Conseils avancés
- Utilisez les **segments** (slicers) pour un filtrage visuel interactif
- Créez des **graphiques croisés dynamiques** pour visualiser vos données
- Utilisez **Grouper** pour regrouper des dates par mois/trimestre/année`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Guide complet pour créer et configurer un tableau croisé dynamique (TCD) dans Microsoft Excel. Couvre la préparation des données, l\'insertion, la configuration et la personnalisation.',
        keywords: ['excel', 'tcd', 'tableau croisé dynamique', 'pivot table', 'analyse données', 'rapport', 'microsoft office'],
        prerequisites: 'Microsoft Excel 2016 ou version ultérieure. Connaissances de base d\'Excel (navigation, sélection de cellules).',
        limitations: 'Les TCD ne peuvent pas modifier les données sources directement. Limite de 1 048 576 lignes par feuille Excel.',
        security_notes: 'Attention aux données sensibles lors du partage de fichiers contenant des TCD.',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Comment importer un fichier CSV dans Excel',
      description: `# Comment importer un fichier CSV dans Excel

## Introduction
Les fichiers CSV (Comma-Separated Values) sont un format standard pour l'échange de données. Ce guide explique comment les importer correctement dans Excel.

## Méthode 1 : Ouverture directe

### Étapes
1. Ouvrez Excel
2. Allez dans **Fichier** > **Ouvrir**
3. Changez le type de fichier en "Tous les fichiers" ou "Fichiers texte"
4. Sélectionnez votre fichier CSV
5. Cliquez sur **Ouvrir**

### Attention
Cette méthode peut mal interpréter les séparateurs si votre CSV utilise un point-virgule (;) au lieu d'une virgule (,).

## Méthode 2 : Assistant d'importation (recommandée)

### Étapes
1. Ouvrez un nouveau classeur Excel
2. Allez dans l'onglet **Données**
3. Cliquez sur **Obtenir des données** > **À partir d'un fichier** > **À partir d'un fichier texte/CSV**
4. Sélectionnez votre fichier
5. Dans l'aperçu, vérifiez :
   - **Délimiteur** : virgule, point-virgule, tabulation, etc.
   - **Encodage** : UTF-8 pour les caractères spéciaux
   - **Détection des types** : automatique ou manuel
6. Cliquez sur **Charger** ou **Transformer les données** pour plus d'options

## Méthode 3 : Power Query (Excel 2016+)

### Avantages
- Transformation des données avant import
- Connexion actualisable aux données sources
- Gestion avancée des types de données

### Étapes
1. Onglet **Données** > **Obtenir des données** > **À partir d'un fichier** > **À partir d'un fichier texte/CSV**
2. Cliquez sur **Transformer les données**
3. Utilisez l'éditeur Power Query pour nettoyer vos données
4. Cliquez sur **Fermer et charger**

## Problèmes courants et solutions

### Les accents sont mal affichés
- Choisissez l'encodage **UTF-8** lors de l'import

### Les nombres sont en texte
- Sélectionnez la colonne > **Données** > **Convertir** > choisissez le format

### Les dates sont inversées (MM/JJ/AAAA)
- Utilisez Power Query pour définir le format de date correct

### Le séparateur décimal est incorrect
- Vérifiez les paramètres régionaux de Windows
- Ou utilisez Rechercher/Remplacer pour convertir les points en virgules`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Guide pour importer des fichiers CSV dans Excel avec différentes méthodes : ouverture directe, assistant d\'importation et Power Query.',
        keywords: ['csv', 'excel', 'import', 'données', 'power query', 'délimiteur', 'encodage', 'utf-8'],
        prerequisites: 'Microsoft Excel 2016 ou version ultérieure.',
        limitations: 'Les fichiers CSV très volumineux (>1M lignes) peuvent nécessiter des outils spécialisés.',
        security_notes: 'Vérifiez la source des fichiers CSV avant import pour éviter les macros malveillantes.',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Comment réinitialiser son mot de passe Windows',
      description: `# Comment réinitialiser son mot de passe Windows

## Méthode 1 : Via l'écran de connexion (Windows 10/11)

### Compte Microsoft
1. Sur l'écran de connexion, cliquez sur **J'ai oublié mon mot de passe**
2. Entrez votre adresse email Microsoft
3. Choisissez une méthode de vérification (SMS, email, application)
4. Entrez le code reçu
5. Créez un nouveau mot de passe

### Compte local avec questions de sécurité
1. Sur l'écran de connexion, entrez un mot de passe incorrect
2. Cliquez sur **Réinitialiser le mot de passe**
3. Répondez aux questions de sécurité
4. Créez un nouveau mot de passe

## Méthode 2 : Via un autre compte administrateur

1. Connectez-vous avec un compte administrateur
2. Ouvrez **Paramètres** > **Comptes** > **Autres utilisateurs**
3. Sélectionnez le compte à réinitialiser
4. Cliquez sur **Modifier le mot de passe**

## Méthode 3 : Via le Panneau de configuration

1. Connectez-vous en tant qu'administrateur
2. Ouvrez le **Panneau de configuration**
3. Allez dans **Comptes d'utilisateurs**
4. Cliquez sur **Gérer un autre compte**
5. Sélectionnez le compte concerné
6. Cliquez sur **Modifier le mot de passe**

## Méthode 4 : Contacter le support IT

Si vous êtes sur un ordinateur d'entreprise :
1. Contactez le helpdesk au **+33 1 23 45 67 89**
2. Ou envoyez un email à **support@entreprise.com**
3. Fournissez votre identifiant utilisateur
4. Le support réinitialisera votre mot de passe

## Bonnes pratiques pour les mots de passe

- Minimum 12 caractères
- Mélange de majuscules, minuscules, chiffres et symboles
- Ne pas réutiliser d'anciens mots de passe
- Ne jamais partager son mot de passe
- Changer régulièrement (tous les 90 jours recommandé)`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Procédures pour réinitialiser un mot de passe Windows oublié, que ce soit un compte Microsoft ou un compte local.',
        keywords: ['mot de passe', 'password', 'windows', 'réinitialisation', 'compte', 'connexion', 'oublié'],
        prerequisites: 'Accès à l\'écran de connexion Windows ou à un compte administrateur.',
        limitations: 'Les comptes d\'entreprise (Active Directory) nécessitent l\'intervention du support IT.',
        security_notes: 'Ne jamais communiquer votre mot de passe par email ou téléphone. Le support IT ne vous demandera jamais votre mot de passe actuel.',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'PUBLIC',
        version: '1.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Comment configurer Outlook avec une boîte mail professionnelle',
      description: `# Comment configurer Outlook avec une boîte mail professionnelle

## Prérequis
- Microsoft Outlook installé (version 2016 ou ultérieure)
- Vos identifiants de messagerie (email et mot de passe)
- Connexion internet active

## Configuration automatique (recommandée)

### Étapes
1. Ouvrez **Outlook**
2. Si c'est la première ouverture, l'assistant de configuration se lance automatiquement
3. Sinon, allez dans **Fichier** > **Ajouter un compte**
4. Entrez votre adresse email professionnelle
5. Cliquez sur **Connexion**
6. Entrez votre mot de passe
7. Outlook détecte automatiquement les paramètres du serveur
8. Cliquez sur **Terminé**

## Configuration manuelle (si nécessaire)

### Paramètres IMAP
- **Serveur entrant** : imap.entreprise.com
- **Port** : 993
- **Chiffrement** : SSL/TLS

### Paramètres SMTP
- **Serveur sortant** : smtp.entreprise.com
- **Port** : 587
- **Chiffrement** : STARTTLS
- **Authentification** : Oui (mêmes identifiants)

### Paramètres Exchange/Microsoft 365
- **Serveur** : outlook.office365.com
- **Domaine** : laisser vide
- **Nom d'utilisateur** : votre email complet

## Synchronisation du calendrier et des contacts

Une fois le compte configuré :
1. Allez dans **Fichier** > **Paramètres du compte** > **Paramètres du compte**
2. Sélectionnez votre compte > **Modifier**
3. Cochez **Calendrier** et **Contacts** si disponibles

## Résolution des problèmes courants

### "Impossible de se connecter au serveur"
- Vérifiez votre connexion internet
- Vérifiez que les paramètres du serveur sont corrects
- Désactivez temporairement le pare-feu/antivirus

### "Mot de passe incorrect"
- Vérifiez les majuscules/minuscules
- Réinitialisez votre mot de passe si nécessaire

### Les emails n'arrivent pas
- Vérifiez le dossier Spam/Courrier indésirable
- Vérifiez les règles de filtrage

## Support
Pour toute assistance, contactez le helpdesk :
- Email : support@entreprise.com
- Téléphone : +33 1 23 45 67 89`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Guide de configuration de Microsoft Outlook avec une boîte mail professionnelle, incluant les paramètres IMAP, SMTP et Exchange.',
        keywords: ['outlook', 'email', 'messagerie', 'configuration', 'imap', 'smtp', 'exchange', 'microsoft 365'],
        prerequisites: 'Microsoft Outlook 2016 ou version ultérieure. Identifiants de messagerie fournis par le service IT.',
        limitations: 'Certaines fonctionnalités avancées (partage de calendrier, salles de réunion) nécessitent Exchange ou Microsoft 365.',
        security_notes: 'Activez l\'authentification à deux facteurs (2FA) si disponible. Ne jamais enregistrer le mot de passe sur un ordinateur partagé.',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'INTERNAL',
        version: '1.2',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    },
    {
      title: 'Comment se connecter au VPN de l\'entreprise',
      description: `# Comment se connecter au VPN de l'entreprise

## Introduction
Le VPN (Virtual Private Network) permet d'accéder aux ressources internes de l'entreprise de manière sécurisée depuis l'extérieur.

## Prérequis
- Client VPN installé (GlobalProtect, Cisco AnyConnect, ou FortiClient selon votre entreprise)
- Identifiants d'entreprise (login/mot de passe Active Directory)
- Token d'authentification à deux facteurs (si activé)

## Connexion avec GlobalProtect

### Première connexion
1. Ouvrez l'application **GlobalProtect**
2. Dans le champ "Portal", entrez : **vpn.entreprise.com**
3. Cliquez sur **Connect**
4. Entrez votre identifiant (format : prenom.nom)
5. Entrez votre mot de passe
6. Si demandé, entrez le code de votre application d'authentification
7. Attendez la connexion (icône verte = connecté)

### Connexions suivantes
1. Cliquez sur l'icône GlobalProtect dans la barre des tâches
2. Cliquez sur **Connect**
3. Entrez vos identifiants

## Connexion avec Cisco AnyConnect

1. Ouvrez **Cisco AnyConnect Secure Mobility Client**
2. Entrez l'adresse du serveur : **vpn.entreprise.com**
3. Cliquez sur **Connect**
4. Sélectionnez le groupe approprié (ex: "Employees")
5. Entrez vos identifiants
6. Validez le code 2FA si demandé

## Vérifier la connexion

Une fois connecté :
1. Ouvrez un navigateur
2. Accédez à une ressource interne (ex: intranet.entreprise.com)
3. Si la page s'affiche, vous êtes bien connecté

## Déconnexion

**Important** : Déconnectez-vous du VPN quand vous n'en avez plus besoin.
1. Cliquez sur l'icône VPN dans la barre des tâches
2. Cliquez sur **Disconnect**

## Résolution des problèmes

### "Connexion impossible"
- Vérifiez votre connexion internet
- Redémarrez le client VPN
- Redémarrez votre ordinateur

### "Identifiants incorrects"
- Vérifiez que Caps Lock n'est pas activé
- Réinitialisez votre mot de passe si nécessaire

### Connexion lente
- Évitez les réseaux Wi-Fi publics
- Utilisez une connexion filaire si possible

## Support
Helpdesk : +33 1 23 45 67 89
Email : support@entreprise.com`,
      extended_core_fields: {
        rel_category: 'HOW_TO',
        summary: 'Guide de connexion au VPN d\'entreprise avec GlobalProtect ou Cisco AnyConnect, incluant la résolution des problèmes courants.',
        keywords: ['vpn', 'connexion', 'télétravail', 'remote', 'globalprotect', 'cisco', 'anyconnect', 'sécurité'],
        prerequisites: 'Client VPN installé par le service IT. Identifiants Active Directory valides. Application d\'authentification configurée (si 2FA activé).',
        limitations: 'Certaines applications gourmandes en bande passante peuvent être lentes via VPN. Le split tunneling peut être désactivé pour des raisons de sécurité.',
        security_notes: 'Ne jamais partager vos identifiants VPN. Toujours se déconnecter sur un ordinateur partagé. Signaler immédiatement toute activité suspecte.',
        rel_target_audience: 'END_USER',
        business_scope: 'GLOBAL',
        rel_lang: 'fr',
        rel_confidentiality_level: 'INTERNAL',
        version: '2.0',
        last_review_at: new Date().toISOString().split('T')[0]
      }
    }
  ];

  let insertedCount = 0;

  for (const article of knowledgeArticles) {
    try {
      await prisma.tickets.create({
        data: {
          title: article.title,
          description: article.description,
          ticket_type_code: 'KNOWLEDGE',
          writer_uuid: writer.uuid,
          extended_core_fields: article.extended_core_fields
        }
      });
      insertedCount++;
      console.log(`  Created: ${article.title.substring(0, 50)}...`);
    } catch (error) {
      console.error(`  Error creating article "${article.title}": ${error.message}`);
    }
  }

  console.log(`\nUAT Knowledge seed completed: ${insertedCount} articles created`);
};

module.exports = { seedUatKnowledge };
