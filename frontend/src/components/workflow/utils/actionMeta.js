// Shared action type metadata (icons & colors)
export const ACTION_META = {
  look_up_record:    { icon: 'pi pi-search',             color: '#6366f1' },
  create_record:     { icon: 'pi pi-plus-circle',        color: '#22c55e' },
  update_record:     { icon: 'pi pi-pencil',             color: '#f59e0b' },
  delete_record:     { icon: 'pi pi-trash',              color: '#ef4444' },
  log:               { icon: 'pi pi-file',               color: '#6b7280' },
  ask_for_approval:  { icon: 'pi pi-check-circle',       color: '#8b5cf6' },
  wait_for_condition:{ icon: 'pi pi-clock',              color: '#f97316' },
  wait_for_duration: { icon: 'pi pi-hourglass',          color: '#f97316' },
  if_condition:      { icon: 'pi pi-question-circle',    color: '#0ea5e9' },
  for_each:          { icon: 'pi pi-replay',             color: '#0ea5e9' },
  parallel:          { icon: 'pi pi-arrows-h',           color: '#0ea5e9' },
  assign_values:     { icon: 'pi pi-equals',             color: '#14b8a6' },
  send_email:        { icon: 'pi pi-envelope',           color: '#ec4899' },
  send_notification: { icon: 'pi pi-bell',               color: '#ec4899' },
  rest_step:         { icon: 'pi pi-globe',              color: '#64748b' }
}

export const getActionIcon = (actionType) => {
  return ACTION_META[actionType]?.icon || 'pi pi-cog'
}

export const getActionColor = (actionType) => {
  return ACTION_META[actionType]?.color || '#6b7280'
}
