const bcrypt = require('bcrypt');

const DEFAULT_COUNT = 10000;
const DEFAULT_BATCH_SIZE = 1000;

/**
 * UAT seed for creating a large dataset of persons.
 *
 * Usage:
 *   node prisma/seeds/run-single.js uat
 *
 * Options (env vars):
 *   - UAT_SEED_COUNT: number of persons to generate (default: 10000)
 *   - UAT_SEED_BATCH_SIZE: insert batch size (default: 1000)
 *   - UAT_SEED_EMAIL_PREFIX: email prefix (default: uat.user)
 *   - UAT_SEED_PASSWORD: password for all generated users (default: LumiereUat2025!)
 */

const parseIntOr = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildName = (index) => {
  const firstNames = [
    // Prénoms masculins français
    'Adam', 'Adrien', 'Alain', 'Albert', 'Alexandre', 'Alexis', 'Alfred', 'Alphonse', 'Amaury', 'Ambroise',
    'André', 'Anthony', 'Antoine', 'Antonin', 'Armand', 'Arnaud', 'Arthur', 'Aurélien', 'Baptiste', 'Barnabé',
    'Barthélémy', 'Basile', 'Bastien', 'Benjamin', 'Benoît', 'Bernard', 'Bertrand', 'Boris', 'Bruno', 'Cédric',
    'César', 'Charles', 'Christian', 'Christophe', 'Claude', 'Clément', 'Colin', 'Corentin', 'Cyril', 'Damien',
    'Daniel', 'David', 'Denis', 'Didier', 'Dimitri', 'Dominique', 'Dylan', 'Edgar', 'Edmond', 'Édouard',
    'Émile', 'Emmanuel', 'Éric', 'Ernest', 'Étienne', 'Eugène', 'Fabien', 'Fabrice', 'Félix', 'Fernand',
    'Florent', 'Florian', 'Francis', 'Franck', 'François', 'Frédéric', 'Gabriel', 'Gaël', 'Gaston', 'Gautier',
    'Gérald', 'Gérard', 'Germain', 'Gilles', 'Grégoire', 'Grégory', 'Guillaume', 'Gustave', 'Guy', 'Henri',
    'Hervé', 'Hubert', 'Hugo', 'Isaac', 'Jacques', 'Jean', 'Jean-Baptiste', 'Jean-Claude', 'Jean-François', 'Jean-Louis',
    'Jean-Luc', 'Jean-Marc', 'Jean-Michel', 'Jean-Paul', 'Jean-Philippe', 'Jean-Pierre', 'Jérémie', 'Jérôme', 'Joël', 'Jonathan',
    'Joseph', 'Julien', 'Justin', 'Kévin', 'Laurent', 'Léo', 'Léon', 'Léonard', 'Lionel', 'Loïc',
    'Louis', 'Luc', 'Lucas', 'Lucien', 'Ludovic', 'Marc', 'Marcel', 'Marius', 'Martin', 'Mathieu',
    'Mathis', 'Matthieu', 'Maurice', 'Maxence', 'Maxime', 'Michel', 'Nathan', 'Nicolas', 'Noël', 'Olivier',
    'Pascal', 'Patrice', 'Patrick', 'Paul', 'Philippe', 'Pierre', 'Pierre-Louis', 'Quentin', 'Raphaël', 'Raymond',
    'Régis', 'Rémi', 'Renaud', 'René', 'Richard', 'Robert', 'Robin', 'Rodolphe', 'Roger', 'Roland',
    'Romain', 'Samuel', 'Sébastien', 'Serge', 'Simon', 'Stanislas', 'Stéphane', 'Sylvain', 'Tanguy', 'Théo',
    'Théodore', 'Thibault', 'Thibaut', 'Thierry', 'Thomas', 'Timothée', 'Tristan', 'Ulysse', 'Valentin', 'Victor',
    'Vincent', 'Xavier', 'Yann', 'Yannick', 'Yves', 'Zacharie',
    // Prénoms féminins français
    'Adèle', 'Adeline', 'Adrienne', 'Agathe', 'Agnès', 'Aimée', 'Albane', 'Alexandra', 'Alice', 'Aline',
    'Amélie', 'Anaïs', 'Andrée', 'Angèle', 'Angélique', 'Anne', 'Anne-Marie', 'Anne-Sophie', 'Annette', 'Antoinette',
    'Ariane', 'Arlette', 'Audrey', 'Aurélie', 'Aurore', 'Béatrice', 'Bénédicte', 'Bernadette', 'Brigitte', 'Camille',
    'Capucine', 'Carine', 'Caroline', 'Catherine', 'Cécile', 'Céline', 'Chantal', 'Charlotte', 'Chloé', 'Christelle',
    'Christine', 'Claire', 'Clara', 'Clarisse', 'Claude', 'Claudine', 'Clémence', 'Clémentine', 'Clotilde', 'Colette',
    'Constance', 'Corinne', 'Danielle', 'Delphine', 'Denise', 'Diane', 'Dominique', 'Dorothée', 'Édith', 'Éléonore',
    'Éliane', 'Élisa', 'Élisabeth', 'Élise', 'Élodie', 'Éloïse', 'Émilie', 'Emma', 'Emmanuelle', 'Estelle',
    'Eugénie', 'Éva', 'Ève', 'Fabienne', 'Fanny', 'Fernande', 'Florence', 'Francine', 'Françoise', 'Frédérique',
    'Gabrielle', 'Geneviève', 'Georgette', 'Germaine', 'Gisèle', 'Hélène', 'Henriette', 'Huguette', 'Inès', 'Irène',
    'Isabelle', 'Jacqueline', 'Jeanne', 'Jeannette', 'Jeannine', 'Jocelyne', 'Joëlle', 'Josette', 'Josiane', 'Judith',
    'Julie', 'Juliette', 'Justine', 'Laetitia', 'Laura', 'Laure', 'Laurence', 'Léa', 'Léonie', 'Liliane',
    'Lisa', 'Lise', 'Louise', 'Luce', 'Lucie', 'Lucienne', 'Lucile', 'Lydie', 'Madeleine', 'Manon',
    'Margot', 'Marguerite', 'Marianne', 'Marie', 'Marie-Ange', 'Marie-Anne', 'Marie-Christine', 'Marie-Claire', 'Marie-Claude', 'Marie-France',
    'Marie-Françoise', 'Marie-Hélène', 'Marie-José', 'Marie-Laure', 'Marie-Louise', 'Marie-Noëlle', 'Marie-Paule', 'Marie-Pierre', 'Marie-Thérèse', 'Marine',
    'Marion', 'Marthe', 'Martine', 'Mathilde', 'Mélanie', 'Michèle', 'Micheline', 'Mireille', 'Monique', 'Muriel',
    'Mylène', 'Nadège', 'Nadine', 'Nathalie', 'Nicole', 'Noémie', 'Odette', 'Odile', 'Olivia', 'Pascale',
    'Patricia', 'Paulette', 'Pauline', 'Perrine', 'Philippine', 'Pierrette', 'Rachel', 'Raymonde', 'Régine', 'Renée',
    'Romane', 'Rose', 'Roseline', 'Sabine', 'Sabrina', 'Sandra', 'Sandrine', 'Sarah', 'Simone', 'Solange',
    'Sonia', 'Sophie', 'Stéphanie', 'Suzanne', 'Sylvie', 'Thérèse', 'Valentine', 'Valérie', 'Vanessa', 'Véronique',
    'Victoire', 'Virginie', 'Viviane', 'Yolande', 'Yvette', 'Yvonne', 'Zoé'
  ];
  const lastNames = [
    'Adam', 'Albert', 'Alexandre', 'Allard', 'Allain', 'André', 'Antoine', 'Arnaud', 'Aubert', 'Aubry',
    'Bailly', 'Barbier', 'Baron', 'Barre', 'Barré', 'Barthelemy', 'Bastien', 'Bauer', 'Bazin', 'Beaulieu',
    'Beaumont', 'Becker', 'Belin', 'Benard', 'Benoit', 'Berger', 'Bernard', 'Bernier', 'Berthelot', 'Bertin',
    'Bertrand', 'Besson', 'Bigot', 'Billard', 'Billon', 'Blanc', 'Blanchard', 'Blanchet', 'Blondel', 'Blot',
    'Bocquet', 'Bodin', 'Boisvert', 'Boivin', 'Bonhomme', 'Bonneau', 'Bonnet', 'Bouchet', 'Boucher', 'Boulanger',
    'Boulay', 'Bourdon', 'Bourgeois', 'Boutin', 'Bouvier', 'Boyer', 'Breton', 'Briand', 'Brice', 'Brun',
    'Brunet', 'Buisson', 'Bureau', 'Camus', 'Caron', 'Carpentier', 'Carré', 'Carrier', 'Castel', 'Chabert',
    'Chambon', 'Champion', 'Chapelle', 'Chapuis', 'Charles', 'Charpentier', 'Chartier', 'Chauvet', 'Chauvin', 'Chevalier',
    'Chevallier', 'Chevrier', 'Clement', 'Clerc', 'Colin', 'Collet', 'Collin', 'Combe', 'Comte', 'Cordier',
    'Corre', 'Costa', 'Coste', 'Coulon', 'Coupé', 'Courtois', 'Cousin', 'Couturier', 'Cros', 'Daniel',
    'Danjou', 'Dasilva', 'David', 'Delattre', 'Delaunay', 'Delorme', 'Delpech', 'Denis', 'Descamps', 'Deschamps',
    'Desjardins', 'Deslauriers', 'Despres', 'Devaux', 'Didier', 'Diallo', 'Dion', 'Doucet', 'Drouet', 'Dubois',
    'Dubos', 'Dubreuil', 'Duchemin', 'Duchesne', 'Duclos', 'Dufour', 'Dufresne', 'Duhamel', 'Dumas', 'Dumont',
    'Dumoulin', 'Dupont', 'Dupré', 'Dupuis', 'Dupuy', 'Durand', 'Duval', 'Evrard', 'Fabre', 'Faure',
    'Favre', 'Fernandez', 'Ferrand', 'Ferreira', 'Ferrer', 'Ferry', 'Fleury', 'Fontaine', 'Forest', 'Forestier',
    'Forget', 'Fortin', 'Foucher', 'Foucault', 'Fouquet', 'Fournier', 'Francois', 'Gaillard', 'Gallet', 'Garnier',
    'Gauthier', 'Gautier', 'Gay', 'Gendre', 'Georges', 'Gerard', 'Germain', 'Gilbert', 'Gilles', 'Gillet',
    'Girard', 'Giraud', 'Girault', 'Girod', 'Godard', 'Godin', 'Gonzalez', 'Gosselin', 'Goujon', 'Gourdon',
    'Grandjean', 'Grange', 'Granger', 'Gras', 'Grégoire', 'Grenier', 'Gros', 'Guérin', 'Guichard', 'Guignard',
    'Guillaume', 'Guillemot', 'Guillot', 'Guillou', 'Guillon', 'Guyon', 'Guyot', 'Hamel', 'Hardy', 'Hamon',
    'Hébert', 'Henry', 'Herve', 'Hoarau', 'Hubert', 'Huet', 'Humbert', 'Imbert', 'Jacob', 'Jacquet',
    'Jacques', 'Jacquot', 'Jamin', 'Janin', 'Jean', 'Joly', 'Joseph', 'Josse', 'Joubert', 'Jourdan',
    'Julien', 'Klein', 'Labbé', 'Lacombe', 'Lacour', 'Lacroix', 'Lafarge', 'Lafon', 'Lafont', 'Lagarde',
    'Laine', 'Lalande', 'Lamarque', 'Lambert', 'Lamy', 'Langlois', 'Lapierre', 'Laporte', 'Laroche', 'Larue',
    'Laurent', 'Lavigne', 'Leblanc', 'Lebrun', 'Leclerc', 'Leclercq', 'Lecomte', 'Leconte', 'Ledoux', 'Leduc',
    'Lefebvre', 'Lefevre', 'Lefèvre', 'Legall', 'Legendre', 'Léger', 'Legrand', 'Legros', 'Lejeune', 'Leleu',
    'Lelièvre', 'Lemaire', 'Lemaitre', 'Lemoine', 'Lenoir', 'Léonard', 'Lepage', 'Lepine', 'Leroux', 'Leroy',
    'Lesage', 'Lescure', 'Lévêque', 'Levy', 'Lopez', 'Louis', 'Lucas', 'Mace', 'Maillard', 'Maillet',
    'Maillot', 'Maire', 'Maitre', 'Mallet', 'Manceau', 'Marchal', 'Marchand', 'Marechal', 'Marie', 'Marion',
    'Marin', 'Marques', 'Marquet', 'Martel', 'Martin', 'Martinez', 'Marty', 'Masson', 'Mathieu', 'Mauger',
    'Maurice', 'Maury', 'Menard', 'Mercier', 'Merle', 'Meunier', 'Meyer', 'Michaud', 'Michel', 'Millet',
    'Monier', 'Monnier', 'Moreau', 'Morel', 'Morin', 'Moulin', 'Mounier', 'Muller', 'Navarro', 'Nguyen',
    'Nicolas', 'Noël', 'Normand', 'Olivier', 'Ollivier', 'Oudin', 'Pages', 'Paillard', 'Papin', 'Parent',
    'Paris', 'Pascal', 'Pasquier', 'Paul', 'Payet', 'Peltier', 'Pelletier', 'Pereira', 'Perez', 'Perret',
    'Perrier', 'Perrin', 'Perrot', 'Perrault', 'Petit', 'Petitjean', 'Philippe', 'Picard', 'Pichon', 'Pierre',
    'Pineau', 'Pinto', 'Piquet', 'Pires', 'Plante', 'Plessis', 'Poirier', 'Poisson', 'Pons', 'Poulain',
    'Poulin', 'Prat', 'Prevost', 'Prévot', 'Prieur', 'Prost', 'Prudhomme', 'Puech', 'Quentin', 'Raynaud',
    'Raymond', 'Regnier', 'Renard', 'Renaud', 'Renault', 'Rey', 'Reynaud', 'Richard', 'Ricard', 'Richer',
    'Richet', 'Rigaud', 'Rivière', 'Robert', 'Robin', 'Roche', 'Rocher', 'Rodrigues', 'Rodriguez', 'Roger',
    'Rolland', 'Romain', 'Rossi', 'Rossignol', 'Rouget', 'Rousseau', 'Roussel', 'Roux', 'Roy', 'Royer',
    'Ruiz', 'Sabatier', 'Saillard', 'Salmon', 'Sanchez', 'Sauvage', 'Schmitt', 'Schneider', 'Seguin', 'Serre',
    'Simon', 'Simonin', 'Simonneau', 'Soulier', 'Tessier', 'Thibault', 'Thierry', 'Thomas', 'Thouvenin', 'Toussaint',
    'Traore', 'Tremblay', 'Turpin', 'Vaillant', 'Valentin', 'Valette', 'Vasseur', 'Vidal', 'Vigneron', 'Vigier',
    'Villain', 'Vincent', 'Voisin', 'Wagner', 'Weber', 'Weiss', 'Zimmermann'
  ];

  const first_name = firstNames[index % firstNames.length];
  const last_name = lastNames[Math.floor(index / firstNames.length) % lastNames.length];

  return { first_name, last_name };
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

// Cities for locations (France, Europe, Australia)
const CITIES = [
  // France (50 cities)
  { name: 'Paris', country: 'France' },
  { name: 'Lyon', country: 'France' },
  { name: 'Marseille', country: 'France' },
  { name: 'Toulouse', country: 'France' },
  { name: 'Nice', country: 'France' },
  { name: 'Nantes', country: 'France' },
  { name: 'Strasbourg', country: 'France' },
  { name: 'Montpellier', country: 'France' },
  { name: 'Bordeaux', country: 'France' },
  { name: 'Lille', country: 'France' },
  { name: 'Rennes', country: 'France' },
  { name: 'Reims', country: 'France' },
  { name: 'Le Havre', country: 'France' },
  { name: 'Saint-Étienne', country: 'France' },
  { name: 'Toulon', country: 'France' },
  { name: 'Grenoble', country: 'France' },
  { name: 'Dijon', country: 'France' },
  { name: 'Angers', country: 'France' },
  { name: 'Nîmes', country: 'France' },
  { name: 'Villeurbanne', country: 'France' },
  { name: 'Clermont-Ferrand', country: 'France' },
  { name: 'Le Mans', country: 'France' },
  { name: 'Aix-en-Provence', country: 'France' },
  { name: 'Brest', country: 'France' },
  { name: 'Tours', country: 'France' },
  { name: 'Amiens', country: 'France' },
  { name: 'Limoges', country: 'France' },
  { name: 'Annecy', country: 'France' },
  { name: 'Perpignan', country: 'France' },
  { name: 'Besançon', country: 'France' },
  { name: 'Orléans', country: 'France' },
  { name: 'Metz', country: 'France' },
  { name: 'Rouen', country: 'France' },
  { name: 'Mulhouse', country: 'France' },
  { name: 'Caen', country: 'France' },
  { name: 'Nancy', country: 'France' },
  { name: 'Saint-Denis', country: 'France' },
  { name: 'Argenteuil', country: 'France' },
  { name: 'Montreuil', country: 'France' },
  { name: 'Roubaix', country: 'France' },
  { name: 'Tourcoing', country: 'France' },
  { name: 'Avignon', country: 'France' },
  { name: 'Dunkerque', country: 'France' },
  { name: 'Créteil', country: 'France' },
  { name: 'Poitiers', country: 'France' },
  { name: 'Fort-de-France', country: 'France' },
  { name: 'Courbevoie', country: 'France' },
  { name: 'Versailles', country: 'France' },
  { name: 'Colombes', country: 'France' },
  { name: 'Vitry-sur-Seine', country: 'France' },
  // Europe (30 cities)
  { name: 'London', country: 'United Kingdom' },
  { name: 'Manchester', country: 'United Kingdom' },
  { name: 'Birmingham', country: 'United Kingdom' },
  { name: 'Edinburgh', country: 'United Kingdom' },
  { name: 'Berlin', country: 'Germany' },
  { name: 'Munich', country: 'Germany' },
  { name: 'Frankfurt', country: 'Germany' },
  { name: 'Hamburg', country: 'Germany' },
  { name: 'Cologne', country: 'Germany' },
  { name: 'Madrid', country: 'Spain' },
  { name: 'Barcelona', country: 'Spain' },
  { name: 'Valencia', country: 'Spain' },
  { name: 'Seville', country: 'Spain' },
  { name: 'Rome', country: 'Italy' },
  { name: 'Milan', country: 'Italy' },
  { name: 'Naples', country: 'Italy' },
  { name: 'Turin', country: 'Italy' },
  { name: 'Amsterdam', country: 'Netherlands' },
  { name: 'Rotterdam', country: 'Netherlands' },
  { name: 'Brussels', country: 'Belgium' },
  { name: 'Antwerp', country: 'Belgium' },
  { name: 'Vienna', country: 'Austria' },
  { name: 'Zurich', country: 'Switzerland' },
  { name: 'Geneva', country: 'Switzerland' },
  { name: 'Lisbon', country: 'Portugal' },
  { name: 'Porto', country: 'Portugal' },
  { name: 'Dublin', country: 'Ireland' },
  { name: 'Copenhagen', country: 'Denmark' },
  { name: 'Stockholm', country: 'Sweden' },
  { name: 'Oslo', country: 'Norway' },
  // Australia (20 cities)
  { name: 'Sydney', country: 'Australia' },
  { name: 'Melbourne', country: 'Australia' },
  { name: 'Brisbane', country: 'Australia' },
  { name: 'Perth', country: 'Australia' },
  { name: 'Adelaide', country: 'Australia' },
  { name: 'Gold Coast', country: 'Australia' },
  { name: 'Newcastle', country: 'Australia' },
  { name: 'Canberra', country: 'Australia' },
  { name: 'Wollongong', country: 'Australia' },
  { name: 'Hobart', country: 'Australia' },
  { name: 'Geelong', country: 'Australia' },
  { name: 'Townsville', country: 'Australia' },
  { name: 'Cairns', country: 'Australia' },
  { name: 'Darwin', country: 'Australia' },
  { name: 'Toowoomba', country: 'Australia' },
  { name: 'Ballarat', country: 'Australia' },
  { name: 'Bendigo', country: 'Australia' },
  { name: 'Launceston', country: 'Australia' },
  { name: 'Mackay', country: 'Australia' },
  { name: 'Rockhampton', country: 'Australia' }
];

// Entity types for BU generation
const ENTITY_TYPES = ['BU', 'DEPARTMENT', 'DIVISION'];

// Business unit name parts for generating realistic names
const BU_PREFIXES = [
  'Global', 'Regional', 'Central', 'Corporate', 'Strategic', 'Digital', 'Advanced', 'Premier', 'Elite', 'Core'
];
const BU_DOMAINS = [
  'Finance', 'Marketing', 'Sales', 'Operations', 'Technology', 'HR', 'Legal', 'R&D', 'Supply Chain', 'Customer Service',
  'Product', 'Engineering', 'Data', 'Analytics', 'Security', 'Infrastructure', 'Cloud', 'Mobile', 'Web', 'AI',
  'Logistics', 'Procurement', 'Quality', 'Compliance', 'Risk', 'Audit', 'Treasury', 'Tax', 'Payroll', 'Benefits'
];
const BU_SUFFIXES = [
  'Services', 'Solutions', 'Group', 'Team', 'Unit', 'Division', 'Department', 'Center', 'Hub', 'Office'
];

// Support group domains
const SUPPORT_DOMAINS = [
  'Network', 'Server', 'Desktop', 'Application', 'Database', 'Security', 'Cloud', 'Infrastructure', 'Middleware', 'Storage',
  'Backup', 'Monitoring', 'Helpdesk', 'Service Desk', 'End User', 'VoIP', 'Email', 'Collaboration', 'Identity', 'Access',
  'Firewall', 'VPN', 'Load Balancer', 'DNS', 'DHCP', 'Active Directory', 'Exchange', 'SharePoint', 'SAP', 'Oracle',
  'Salesforce', 'ServiceNow', 'Jira', 'Confluence', 'GitHub', 'Azure', 'AWS', 'GCP', 'Kubernetes', 'Docker',
  'Linux', 'Windows', 'macOS', 'iOS', 'Android', 'Printing', 'Telephony', 'Video', 'Wireless', 'WAN'
];

// Project domains
const PROJECT_DOMAINS = [
  'Migration', 'Upgrade', 'Implementation', 'Rollout', 'Deployment', 'Integration', 'Transformation', 'Modernization',
  'Optimization', 'Automation', 'Consolidation', 'Expansion', 'Launch', 'Development', 'Enhancement', 'Refresh',
  'Replacement', 'Standardization', 'Harmonization', 'Centralization'
];

const buildEntityName = (index) => {
  const prefix = BU_PREFIXES[index % BU_PREFIXES.length];
  const domain = BU_DOMAINS[Math.floor(index / BU_PREFIXES.length) % BU_DOMAINS.length];
  const suffix = BU_SUFFIXES[Math.floor(index / (BU_PREFIXES.length * BU_DOMAINS.length)) % BU_SUFFIXES.length];
  return `${prefix} ${domain} ${suffix}`;
};

const buildSupportGroupName = (index) => {
  const domain = SUPPORT_DOMAINS[index % SUPPORT_DOMAINS.length];
  const level = (index % 3) + 1; // L1, L2, L3
  return `SUP-${domain} L${level}`;
};

const buildProjectGroupName = (index) => {
  const domain = PROJECT_DOMAINS[index % PROJECT_DOMAINS.length];
  const year = 2024 + (index % 3);
  return `BLD-${domain} ${year}`;
};

const seedUat = async (prisma) => {
  const count = parseIntOr(process.env.UAT_SEED_COUNT, DEFAULT_COUNT);
  const batchSize = parseIntOr(process.env.UAT_SEED_BATCH_SIZE, DEFAULT_BATCH_SIZE);
  const emailPrefix = (process.env.UAT_SEED_EMAIL_PREFIX || 'uat.user').trim();
  const password = process.env.UAT_SEED_PASSWORD || 'LumiereUat2025!';

  if (!prisma) {
    throw new Error('Prisma client is required');
  }

  if (!count || count <= 0) {
    console.log('UAT seed skipped (count <= 0).');
    return;
  }

  // ========================================
  // 1. Seed Locations (~100)
  // ========================================
  console.log(`Seeding UAT locations: count=${CITIES.length}`);
  
  const locations = CITIES.map((city, index) => ({
    name: city.name,
    site_id: `SITE-${String(index + 1).padStart(4, '0')}`,
    type: 'Office',
    city: city.name,
    country: city.country,
    time_zone: city.country === 'Australia' ? 'Australia/Sydney' : 'Europe/Paris'
  }));

  const locationsResult = await prisma.locations.createMany({
    data: locations,
    skipDuplicates: true
  });
  console.log(`Inserted ${locationsResult.count} locations.`);

  // Fetch created locations for entity assignment
  const createdLocations = await prisma.locations.findMany({
    where: { site_id: { startsWith: 'SITE-' } },
    select: { uuid: true }
  });
  const locationUuids = createdLocations.map(l => l.uuid);

  // ========================================
  // 2. Seed Entities (~1000, ~10 per location)
  // ========================================
  const entityCount = 1000;
  console.log(`Seeding UAT entities: count=${entityCount}`);

  const entities = [];
  for (let i = 0; i < entityCount; i++) {
    const entityType = ENTITY_TYPES[i % ENTITY_TYPES.length];
    const locationUuid = locationUuids[i % locationUuids.length];
    
    entities.push({
      name: buildEntityName(i),
      entity_id: `ENT-${String(i + 1).padStart(5, '0')}`,
      entity_type: entityType,
      rel_headquarters_location: locationUuid,
      is_active: true
    });
  }

  const entitiesBatches = chunk(entities, batchSize);
  let entitiesInserted = 0;

  for (let i = 0; i < entitiesBatches.length; i++) {
    const batch = entitiesBatches[i];
    const result = await prisma.entities.createMany({
      data: batch,
      skipDuplicates: true
    });
    entitiesInserted += result.count;
    console.log(`Entities batch ${i + 1}/${entitiesBatches.length} (inserted=${result.count}, total=${entitiesInserted})`);
  }
  console.log(`Inserted ${entitiesInserted} entities.`);

  // ========================================
  // 3. Seed Groups (~150: 100 support + 50 projects)
  // ========================================
  const supportGroupCount = 100;
  const projectGroupCount = 50;
  console.log(`Seeding UAT groups: support=${supportGroupCount}, projects=${projectGroupCount}`);

  const groups = [];

  // Support groups (100)
  for (let i = 0; i < supportGroupCount; i++) {
    groups.push({
      group_name: buildSupportGroupName(i),
      support_level: (i % 3) + 1, // 1, 2, or 3
      description: `Support group for ${SUPPORT_DOMAINS[i % SUPPORT_DOMAINS.length]} - Level ${(i % 3) + 1}`,
      email: `support.${String(i + 1).padStart(3, '0')}@example.local`
    });
  }

  // Project groups (50)
  for (let i = 0; i < projectGroupCount; i++) {
    groups.push({
      group_name: buildProjectGroupName(i),
      support_level: null,
      description: `Project team for ${PROJECT_DOMAINS[i % PROJECT_DOMAINS.length]}`,
      email: `project.${String(i + 1).padStart(3, '0')}@example.local`
    });
  }

  const groupsResult = await prisma.groups.createMany({
    data: groups,
    skipDuplicates: true
  });
  console.log(`Inserted ${groupsResult.count} groups.`);

  // ========================================
  // 4. Seed Persons (existing logic)
  // ========================================
  console.log(`Seeding UAT persons: count=${count}, batchSize=${batchSize}, emailPrefix=${emailPrefix}`);

  const password_hash = await bcrypt.hash(password, 10);

  const persons = [];
  for (let i = 1; i <= count; i += 1) {
    const { first_name, last_name } = buildName(i);
    const email = `${emailPrefix}.${String(i).padStart(6, '0')}@example.local`;

    persons.push({
      email,
      first_name,
      last_name,
      role: 'user',
      password_hash,
      password_needs_reset: false,
      is_active: true,
      notification: true,
      language: 'fr',
      internal_id: `UAT-${String(i).padStart(6, '0')}`
    });
  }

  const batches = chunk(persons, batchSize);
  let insertedTotal = 0;

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];

    const result = await prisma.persons.createMany({
      data: batch,
      skipDuplicates: true
    });

    insertedTotal += result.count;
    console.log(`Persons batch ${i + 1}/${batches.length} (inserted=${result.count}, totalInserted=${insertedTotal})`);
  }

  console.log(`UAT seed completed: locations=${locationsResult.count}, entities=${entitiesInserted}, groups=${groupsResult.count}, persons=${insertedTotal}`);
};

module.exports = { seedUat };
