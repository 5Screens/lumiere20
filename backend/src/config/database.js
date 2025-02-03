const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test de connexion au démarrage
pool.connect((err, client, release) => {
    if (err) {
        logger.error('Erreur lors de la connexion à la base de données:', err.stack);
    } else {
        logger.info('Connexion à la base de données établie avec succès');
        release();
    }
});

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
};
