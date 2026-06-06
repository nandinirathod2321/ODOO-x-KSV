export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  PROCUREMENT_OFFICER: 'PROCUREMENT_OFFICER',
  VENDOR: 'VENDOR'
};

export const PERMISSIONS = {
  [ROLES.ADMIN]: ['*'],
  [ROLES.MANAGER]: [
    'view_dashboard',
    'view_vendors',
    'view_rfqs',
    'view_quotations',
    'approve_request',
    'reject_request',
    'view_pos',
    'view_invoices',
    'view_reports',
    'view_activity_logs'
  ],
  [ROLES.PROCUREMENT_OFFICER]: [
    'view_dashboard',
    'create_rfq',
    'update_rfq',
    'publish_rfq',
    'close_rfq',
    'view_vendors',
    'manage_vendors',
    'view_quotations',
    'compare_quotations',
    'select_winner',
    'create_po',
    'generate_invoice',
    'send_invoice_email'
  ],
  [ROLES.VENDOR]: [
    'view_rfqs',
    'submit_quotation',
    'update_quotation',
    'view_own_pos',
    'view_own_invoices'
  ]
};
