-- Create languages table
CREATE TABLE translations.languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(5) NOT NULL,                     -- Ex : 'en', 'fr', 'es'
    locale VARCHAR(10) NOT NULL UNIQUE,           -- Ex : 'en-US', 'fr-FR', 'pt-BR'
    name VARCHAR(100) NOT NULL,                   -- Ex : 'Français', 'English', 'Español'
    native_name VARCHAR(100),                     -- Ex : 'Français', 'Español', 'Deutsch'
    date_format VARCHAR(20) NOT NULL,             -- Ex : 'YYYY-MM-DD', 'DD/MM/YYYY'
    time_format VARCHAR(10) NOT NULL,             -- Ex : 'HH:mm:ss', 'hh:mm A'
    timezone VARCHAR(50) NOT NULL,                -- Ex : 'Europe/Paris', 'America/Sao_Paulo'
    currency_code VARCHAR(3) NOT NULL,            -- Ex : 'EUR', 'USD', 'BRL'
    currency_symbol VARCHAR(5) NOT NULL,          -- Ex : '€', '$', 'R$'
    text_direction VARCHAR(3) NOT NULL DEFAULT 'LTR', -- 'LTR' ou 'RTL'
    is_active BOOLEAN DEFAULT false,              -- Langue activée ou non
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to update updated_at timestamp
-- Note: The function update_updated_at() is created in 04_create_functions.sql
CREATE TRIGGER update_languages_updated_at
    BEFORE UPDATE ON languages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Insert EU official languages
INSERT INTO languages (
    code, locale, name, native_name, date_format, time_format, 
    timezone, currency_code, currency_symbol, text_direction, is_active
{{ ... }}
-- Existing languages
('fr', 'fr-FR', 'French', 'Français', 'DD/MM/YYYY', 'HH:mm:ss', 'Europe/Paris', 'EUR', '€', 'LTR', true),
('en', 'en-US', 'English (US)', 'English (US)', 'MM/DD/YYYY', 'hh:mm A', 'America/New_York', 'USD', '$', 'LTR', false),
('en', 'en-GB', 'English (UK)', 'English (UK)', 'DD/MM/YYYY', 'HH:mm:ss', 'Europe/London', 'GBP', '£', 'LTR', true),
('es', 'es-ES', 'Spanish', 'Español', 'DD/MM/YYYY', 'HH:mm:ss', 'Europe/Madrid', 'EUR', '€', 'LTR', true),
('pt', 'pt-PT', 'Portuguese', 'Português', 'DD/MM/YYYY', 'HH:mm:ss', 'Europe/Lisbon', 'EUR', '€', 'LTR', true),
('bg', 'bg-BG', 'Bulgarian', 'български', 'DD.MM.YYYY', 'HH:mm:ss', 'Europe/Sofia', 'BGN', 'лв', 'LTR', false),
('hr', 'hr-HR', 'Croatian', 'Hrvatski', 'DD.MM.YYYY', 'HH:mm:ss', 'Europe/Zagreb', 'EUR', '€', 'LTR', false),
('cs', 'cs-CZ', 'Czech', 'Čeština', 'DD.MM.YYYY', 'HH:mm:ss', 'Europe/Prague', 'CZK', 'Kč', 'LTR', false),
('da', 'da-DK', 'Danish', 'Dansk', 'DD.MM.YYYY', 'HH:mm:ss', 'Europe/Copenhagen', 'DKK', 'kr', 'LTR', false),
('nl', 'nl-NL', 'Dutch', 'Nederlands', 'DD-MM-YYYY', 'HH:mm:ss', 'Europe/Amsterdam', 'EUR', '€', 'LTR', false),
('et', 'et-EE', 'Estonian', 'Eesti', 'DD.MM.YYYY', 'HH:mm:ss', 'Europe/Tallinn', 'EUR', '€', 'LTR', false),
('fi', 'fi-FI', 'Finnish', 'Suomi', 'DD.MM.YYYY', 'HH:mm:ss', 'Europe/Helsinki', 'EUR', '€', 'LTR', false),
('de', 'de-DE', 'German', 'Deutsch', 'DD.MM.YYYY', 'HH:mm:ss', 'Europe/Berlin', 'EUR', '€', 'LTR', false),
('el', 'el-GR', 'Greek', 'Ελληνικά', 'DD/MM/YYYY', 'HH:mm:ss', 'Europe/Athens', 'EUR', '€', 'LTR', false),
('hu', 'hu-HU', 'Hungarian', 'Magyar', 'YYYY.MM.DD.', 'HH:mm:ss', 'Europe/Budapest', 'HUF', 'Ft', 'LTR', false),
('ga', 'ga-IE', 'Irish', 'Gaeilge', 'DD/MM/YYYY', 'HH:mm:ss', 'Europe/Dublin', 'EUR', '€', 'LTR', false),
('it', 'it-IT', 'Italian', 'Italiano', 'DD/MM/YYYY', 'HH:mm:ss', 'Europe/Rome', 'EUR', '€', 'LTR', false),
('lv', 'lv-LV', 'Latvian', 'Latviešu', 'DD.MM.YYYY', 'HH:mm:ss', 'Europe/Riga', 'EUR', '€', 'LTR', false),
('lt', 'lt-LT', 'Lithuanian', 'Lietuvių', 'YYYY-MM-DD', 'HH:mm:ss', 'Europe/Vilnius', 'EUR', '€', 'LTR', false),
('mt', 'mt-MT', 'Maltese', 'Malti', 'DD/MM/YYYY', 'HH:mm:ss', 'Europe/Malta', 'EUR', '€', 'LTR', false),
('pl', 'pl-PL', 'Polish', 'Polski', 'DD.MM.YYYY', 'HH:mm:ss', 'Europe/Warsaw', 'PLN', 'zł', 'LTR', false),
('ro', 'ro-RO', 'Romanian', 'Română', 'DD.MM.YYYY', 'HH:mm:ss', 'Europe/Bucharest', 'RON', 'lei', 'LTR', false),
('sk', 'sk-SK', 'Slovak', 'Slovenčina', 'DD.MM.YYYY', 'HH:mm:ss', 'Europe/Bratislava', 'EUR', '€', 'LTR', false),
('sl', 'sl-SI', 'Slovenian', 'Slovenščina', 'DD.MM.YYYY', 'HH:mm:ss', 'Europe/Ljubljana', 'EUR', '€', 'LTR', false),
('sv', 'sv-SE', 'Swedish', 'Svenska', 'YYYY-MM-DD', 'HH:mm:ss', 'Europe/Stockholm', 'SEK', 'kr', 'LTR', false);