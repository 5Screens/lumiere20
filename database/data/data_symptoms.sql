-- Script: 03_insert_symptoms.sql
-- Description: Insertion des symptômes dans la table configuration.symptoms
-- Date: 2025-02-03

BEGIN;

INSERT INTO configuration.symptoms (code) VALUES
    ('NETWORK_SLOW'),
    ('INTERNET_CONNECTION_LOST'),
    ('APPLICATION_ACCESS_ISSUE'),
    ('PASSWORD_FORGOTTEN'),
    ('WINDOWS_BLUE_SCREEN'),
    ('PRINTING_FAILURE'),
    ('DEVICE_NOT_RECOGNIZED'),
    ('ERROR_404_PAGE_NOT_FOUND'),
    ('ERROR_500_INTERNAL_SERVER'),
    ('EMAIL_NOT_RECEIVED'),
    ('APPLICATION_SLOW'),
    ('LOGIN_FAILURE'),
    ('SOFTWARE_CRASH'),
    ('HARDWARE_OVERHEATING'),
    ('KEYBOARD_NOT_WORKING'),
    ('MOUSE_NOT_RESPONDING'),
    ('DISK_SPACE_LOW'),
    ('VPN_CONNECTION_FAILED'),
    ('AUDIO_NOT_WORKING'),
    ('SCREEN_FLICKERING');

-- Insertion des traductions
INSERT INTO translations.symptoms_translation (symptom_code, langue, libelle) VALUES
    -- NETWORK_SLOW
    ('NETWORK_SLOW', 'fr', 'Lenteur réseau'),
    ('NETWORK_SLOW', 'en', 'Network slowness'),
    ('NETWORK_SLOW', 'pt', 'Lentidão da rede'),
    ('NETWORK_SLOW', 'es', 'Lentitud de la red'),
    
    -- INTERNET_CONNECTION_LOST
    ('INTERNET_CONNECTION_LOST', 'fr', 'Perte de connexion Internet'),
    ('INTERNET_CONNECTION_LOST', 'en', 'Internet connection lost'),
    ('INTERNET_CONNECTION_LOST', 'pt', 'Conexão com a Internet perdida'),
    ('INTERNET_CONNECTION_LOST', 'es', 'Pérdida de conexión a Internet'),
    
    -- APPLICATION_ACCESS_ISSUE
    ('APPLICATION_ACCESS_ISSUE', 'fr', 'Problème d''accès à l''application'),
    ('APPLICATION_ACCESS_ISSUE', 'en', 'Application access issue'),
    ('APPLICATION_ACCESS_ISSUE', 'pt', 'Problema de acesso ao aplicativo'),
    ('APPLICATION_ACCESS_ISSUE', 'es', 'Problema de acceso a la aplicación'),
    
    -- PASSWORD_FORGOTTEN
    ('PASSWORD_FORGOTTEN', 'fr', 'Mot de passe oublié'),
    ('PASSWORD_FORGOTTEN', 'en', 'Forgotten password'),
    ('PASSWORD_FORGOTTEN', 'pt', 'Senha esquecida'),
    ('PASSWORD_FORGOTTEN', 'es', 'Contraseña olvidada'),
    
    -- WINDOWS_BLUE_SCREEN
    ('WINDOWS_BLUE_SCREEN', 'fr', 'Écran bleu Windows'),
    ('WINDOWS_BLUE_SCREEN', 'en', 'Windows blue screen'),
    ('WINDOWS_BLUE_SCREEN', 'pt', 'Tela azul do Windows'),
    ('WINDOWS_BLUE_SCREEN', 'es', 'Pantalla azul de Windows'),
    
    -- PRINTING_FAILURE
    ('PRINTING_FAILURE', 'fr', 'Échec d''impression'),
    ('PRINTING_FAILURE', 'en', 'Printing failure'),
    ('PRINTING_FAILURE', 'pt', 'Falha na impressão'),
    ('PRINTING_FAILURE', 'es', 'Fallo de impresión'),
    
    -- DEVICE_NOT_RECOGNIZED
    ('DEVICE_NOT_RECOGNIZED', 'fr', 'Périphérique non reconnu'),
    ('DEVICE_NOT_RECOGNIZED', 'en', 'Device not recognized'),
    ('DEVICE_NOT_RECOGNIZED', 'pt', 'Dispositivo não reconhecido'),
    ('DEVICE_NOT_RECOGNIZED', 'es', 'Dispositivo no reconocido'),
    
    -- ERROR_404_PAGE_NOT_FOUND
    ('ERROR_404_PAGE_NOT_FOUND', 'fr', 'Erreur 404 - Page non trouvée'),
    ('ERROR_404_PAGE_NOT_FOUND', 'en', 'Error 404 - Page not found'),
    ('ERROR_404_PAGE_NOT_FOUND', 'pt', 'Erro 404 - Página não encontrada'),
    ('ERROR_404_PAGE_NOT_FOUND', 'es', 'Error 404 - Página no encontrada'),
    
    -- ERROR_500_INTERNAL_SERVER
    ('ERROR_500_INTERNAL_SERVER', 'fr', 'Erreur 500 - Erreur interne du serveur'),
    ('ERROR_500_INTERNAL_SERVER', 'en', 'Error 500 - Internal server error'),
    ('ERROR_500_INTERNAL_SERVER', 'pt', 'Erro 500 - Erro interno do servidor'),
    ('ERROR_500_INTERNAL_SERVER', 'es', 'Error 500 - Error interno del servidor'),
    
    -- EMAIL_NOT_RECEIVED
    ('EMAIL_NOT_RECEIVED', 'fr', 'Email non reçu'),
    ('EMAIL_NOT_RECEIVED', 'en', 'Email not received'),
    ('EMAIL_NOT_RECEIVED', 'pt', 'E-mail não recebido'),
    ('EMAIL_NOT_RECEIVED', 'es', 'Correo electrónico no recibido'),
    
    -- APPLICATION_SLOW
    ('APPLICATION_SLOW', 'fr', 'Application lente'),
    ('APPLICATION_SLOW', 'en', 'Slow application'),
    ('APPLICATION_SLOW', 'pt', 'Aplicativo lento'),
    ('APPLICATION_SLOW', 'es', 'Aplicación lenta'),
    
    -- LOGIN_FAILURE
    ('LOGIN_FAILURE', 'fr', 'Échec de connexion'),
    ('LOGIN_FAILURE', 'en', 'Login failure'),
    ('LOGIN_FAILURE', 'pt', 'Falha no login'),
    ('LOGIN_FAILURE', 'es', 'Fallo de inicio de sesión'),
    
    -- SOFTWARE_CRASH
    ('SOFTWARE_CRASH', 'fr', 'Plantage du logiciel'),
    ('SOFTWARE_CRASH', 'en', 'Software crash'),
    ('SOFTWARE_CRASH', 'pt', 'Falha do software'),
    ('SOFTWARE_CRASH', 'es', 'Fallo del software'),
    
    -- HARDWARE_OVERHEATING
    ('HARDWARE_OVERHEATING', 'fr', 'Surchauffe matérielle'),
    ('HARDWARE_OVERHEATING', 'en', 'Hardware overheating'),
    ('HARDWARE_OVERHEATING', 'pt', 'Superaquecimento do hardware'),
    ('HARDWARE_OVERHEATING', 'es', 'Sobrecalentamiento del hardware'),
    
    -- KEYBOARD_NOT_WORKING
    ('KEYBOARD_NOT_WORKING', 'fr', 'Clavier ne fonctionne pas'),
    ('KEYBOARD_NOT_WORKING', 'en', 'Keyboard not working'),
    ('KEYBOARD_NOT_WORKING', 'pt', 'Teclado não funciona'),
    ('KEYBOARD_NOT_WORKING', 'es', 'Teclado no funciona'),
    
    -- MOUSE_NOT_RESPONDING
    ('MOUSE_NOT_RESPONDING', 'fr', 'Souris ne répond pas'),
    ('MOUSE_NOT_RESPONDING', 'en', 'Mouse not responding'),
    ('MOUSE_NOT_RESPONDING', 'pt', 'Mouse não responde'),
    ('MOUSE_NOT_RESPONDING', 'es', 'Ratón no responde'),
    
    -- DISK_SPACE_LOW
    ('DISK_SPACE_LOW', 'fr', 'Espace disque faible'),
    ('DISK_SPACE_LOW', 'en', 'Low disk space'),
    ('DISK_SPACE_LOW', 'pt', 'Pouco espaço em disco'),
    ('DISK_SPACE_LOW', 'es', 'Poco espacio en disco'),
    
    -- VPN_CONNECTION_FAILED
    ('VPN_CONNECTION_FAILED', 'fr', 'Échec de connexion VPN'),
    ('VPN_CONNECTION_FAILED', 'en', 'VPN connection failed'),
    ('VPN_CONNECTION_FAILED', 'pt', 'Falha na conexão VPN'),
    ('VPN_CONNECTION_FAILED', 'es', 'Fallo de conexión VPN'),
    
    -- AUDIO_NOT_WORKING
    ('AUDIO_NOT_WORKING', 'fr', 'Audio ne fonctionne pas'),
    ('AUDIO_NOT_WORKING', 'en', 'Audio not working'),
    ('AUDIO_NOT_WORKING', 'pt', 'Áudio não funciona'),
    ('AUDIO_NOT_WORKING', 'es', 'Audio no funciona'),
    
    -- SCREEN_FLICKERING
    ('SCREEN_FLICKERING', 'fr', 'Scintillement de l''écran'),
    ('SCREEN_FLICKERING', 'en', 'Screen flickering'),
    ('SCREEN_FLICKERING', 'pt', 'Tremulação da tela'),
    ('SCREEN_FLICKERING', 'es', 'Parpadeo de pantalla');

COMMIT;
