const { prisma } = require('../client');

async function seedPortals() {
  console.log('Seeding portals...');

  // Create portals
  const portals = [
    {
      code: 'demo',
      name: 'Demo Portal',
      base_url: 'http://localhost:5175/portal/',
      is_active: true,
      view_component: 'PortalViewV2',
      title: 'Demo Portal',
      subtitle: 'Portal de démonstration',
      welcome_template: 'Bienvenue {firstName} !',
      theme_primary_color: '#FF6B00',
      theme_secondary_color: '#111111',
      show_chat: true,
      show_alerts: true,
      show_actions: true,
      show_widgets: true,
      chat_default_message: 'Comment puis-je vous aider ?'
    },
    {
      code: 'self-service-l',
      name: 'Self-Service Lumière',
      base_url: 'http://localhost:5175/portal/',
      is_active: true,
      view_component: 'PortalViewV2',
      title: 'Lumière Self-service',
      subtitle: 'Portail des employés',
      welcome_template: 'Bienvenue {firstName} !',
      theme_primary_color: '#FF6B00',
      theme_secondary_color: '#111111',
      show_chat: true,
      show_alerts: true,
      show_actions: true,
      show_widgets: true,
      chat_default_message: 'Assistant virtuel disponible 24/7'
    },
    {
      code: 'self-service-s',
      name: 'Self-Service Support',
      base_url: 'http://localhost:5175/portal/',
      is_active: true,
      view_component: 'PortalViewV2',
      title: 'Support Technique',
      subtitle: 'Portail de support IT',
      welcome_template: 'Bonjour {firstName}, comment puis-je vous aider ?',
      theme_primary_color: '#2196F3',
      theme_secondary_color: '#111111',
      show_chat: true,
      show_alerts: true,
      show_actions: true,
      show_widgets: true,
      chat_default_message: 'Support technique disponible'
    }
  ];

  for (const portal of portals) {
    await prisma.portals.upsert({
      where: { code: portal.code },
      update: portal,
      create: portal
    });
    console.log(`  Created/updated portal: ${portal.code}`);
  }

  // Create some quick actions
  const actions = [
    {
      code: 'CREATE_INCIDENT',
      label: 'Signaler un incident',
      description: 'Signalez un problème technique',
      icon: 'pi pi-exclamation-triangle',
      action_type: 'form',
      is_active: true
    },
    {
      code: 'CREATE_REQUEST',
      label: 'Nouvelle demande',
      description: 'Faites une demande de service',
      icon: 'pi pi-plus',
      action_type: 'form',
      is_active: true
    },
    {
      code: 'VIEW_TICKETS',
      label: 'Mes tickets',
      description: 'Consultez vos tickets en cours',
      icon: 'pi pi-list',
      action_type: 'link',
      action_url: '/tickets',
      is_active: true
    }
  ];

  for (const action of actions) {
    await prisma.portal_actions.upsert({
      where: { code: action.code },
      update: action,
      create: action
    });
    console.log(`  Created/updated action: ${action.code}`);
  }

  // Create some alerts
  const alerts = [
    {
      code: 'WELCOME',
      message: 'Bienvenue sur le nouveau portail Lumière 16 !',
      severity: 'info',
      icon: 'pi pi-info-circle',
      is_active: true
    },
    {
      code: 'MAINTENANCE',
      message: 'Maintenance programmée ce week-end.',
      severity: 'warn',
      icon: 'pi pi-exclamation-triangle',
      is_active: true
    }
  ];

  for (const alert of alerts) {
    await prisma.portal_alerts.upsert({
      where: { code: alert.code },
      update: alert,
      create: alert
    });
    console.log(`  Created/updated alert: ${alert.code}`);
  }

  // Create some widgets
  const widgets = [
    {
      code: 'PENDING_TICKETS',
      title: 'Tickets en attente',
      description: 'Vos tickets nécessitant une action',
      icon: 'pi pi-clock',
      widget_type: 'counter',
      is_active: true
    },
    {
      code: 'RECENT_ACTIVITY',
      title: 'Activité récente',
      description: 'Dernières mises à jour',
      icon: 'pi pi-history',
      widget_type: 'list',
      is_active: true
    }
  ];

  for (const widget of widgets) {
    await prisma.portal_widgets.upsert({
      where: { code: widget.code },
      update: widget,
      create: widget
    });
    console.log(`  Created/updated widget: ${widget.code}`);
  }

  // Link actions, alerts, widgets to demo portal
  const demoPortal = await prisma.portals.findUnique({ where: { code: 'demo' } });
  const allActions = await prisma.portal_actions.findMany();
  const allAlerts = await prisma.portal_alerts.findMany();
  const allWidgets = await prisma.portal_widgets.findMany();

  // Link actions
  for (let i = 0; i < allActions.length; i++) {
    await prisma.portal_portal_actions.upsert({
      where: {
        rel_portal_rel_portal_action: {
          rel_portal: demoPortal.uuid,
          rel_portal_action: allActions[i].uuid
        }
      },
      update: { display_order: i + 1 },
      create: {
        rel_portal: demoPortal.uuid,
        rel_portal_action: allActions[i].uuid,
        display_order: i + 1
      }
    });
  }
  console.log(`  Linked ${allActions.length} actions to demo portal`);

  // Link alerts
  for (let i = 0; i < allAlerts.length; i++) {
    await prisma.portal_portal_alerts.upsert({
      where: {
        rel_portal_rel_portal_alert: {
          rel_portal: demoPortal.uuid,
          rel_portal_alert: allAlerts[i].uuid
        }
      },
      update: { display_order: i + 1 },
      create: {
        rel_portal: demoPortal.uuid,
        rel_portal_alert: allAlerts[i].uuid,
        display_order: i + 1
      }
    });
  }
  console.log(`  Linked ${allAlerts.length} alerts to demo portal`);

  // Link widgets
  for (let i = 0; i < allWidgets.length; i++) {
    await prisma.portal_portal_widgets.upsert({
      where: {
        rel_portal_rel_portal_widget: {
          rel_portal: demoPortal.uuid,
          rel_portal_widget: allWidgets[i].uuid
        }
      },
      update: { display_order: i + 1 },
      create: {
        rel_portal: demoPortal.uuid,
        rel_portal_widget: allWidgets[i].uuid,
        display_order: i + 1
      }
    });
  }
  console.log(`  Linked ${allWidgets.length} widgets to demo portal`);

  console.log('Portals seeding completed!');
}

module.exports = { seedPortals };

// Run directly if called as script
if (require.main === module) {
  seedPortals()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
