// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  CLIENTS: {
    BASE: '/clients',
    BY_ID: (id) => `/clients/${id}`,
    STATUS: (id) => `/clients/${id}/status`,
    SEND_CREDENTIALS: (id) => `/clients/${id}/send-credentials`,
  },
  SUPER_ADMIN: {
    CA_USERS: '/super-admin/ca-users',
    CA_USER_BY_ID: (id) => `/super-admin/ca-users/${id}`,
    CA_USER_STATUS: (id) => `/super-admin/ca-users/${id}/status`,
    AUDIT_LOGS: '/super-admin/audit-logs',
    SYSTEM_SETTINGS: '/super-admin/settings',
    DASHBOARD_STATS: '/super-admin/dashboard-stats',
  },
  DOCUMENTS: {
    BASE: '/documents',
    BY_ID: (id) => `/documents/${id}`,
    STATUS: (id) => `/documents/${id}/status`,
    DOWNLOAD: (id) => `/documents/${id}/download`,
  },
  FEES: {
    BASE: '/fees',
    BY_ID: (id) => `/fees/${id}`,
  },
  INVOICES: {
    BASE: '/invoices',
    BY_ID: (id) => `/invoices/${id}`,
    SEND: (id) => `/invoices/${id}/send`,
    PAYMENT_LINK: (id) => `/invoices/${id}/generate-payment-link`,
  },
  AI: {
    ANALYZE: '/ai/analyze-document',
    GENERATE_BILL: '/ai/generate-bill',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    READ: (id) => `/notifications/${id}/read`,
  },
  CLIENT: {
    PROFILE: '/client/profile',
    DOCUMENTS: '/client/documents',
    INVOICES: '/client/invoices',
    PROPOSALS: '/client/proposals',
    STATUS: '/client/status',
    SUPPORT_TICKET: '/client/support-ticket',
  },
}

// Document Status
export const DOCUMENT_STATUS = {
  PENDING_UPLOAD: 'pending_upload',
  UPLOADED: 'uploaded',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RE_UPLOAD: 're_upload_required',
}

// Client Status
export const CLIENT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
}

// Workflow Status
export const WORKFLOW_STATUS = {
  CREATED: 0,
  DOCUMENTS_REQUESTED: 1,
  DOCUMENTS_UPLOADED: 2,
  UNDER_VERIFICATION: 3,
  PROCESSING: 4,
  RETURN_PREPARED: 5,
  WAITING_APPROVAL: 6,
  COMPLETED: 7,
}

export const WORKFLOW_STATUS_LABELS = {
  0: 'Created',
  1: 'Documents Requested',
  2: 'Documents Uploaded',
  3: 'Under Verification',
  4: 'Processing',
  5: 'Return Prepared',
  6: 'Waiting for Approval',
  7: 'Completed',
}

export const WORKFLOW_STATUS_COLORS = {
  0: 'gray',
  1: 'blue',
  2: 'yellow',
  3: 'orange',
  4: 'purple',
  5: 'indigo',
  6: 'pink',
  7: 'green',
}

// Fee Categories
export const FEE_CATEGORIES = {
  1: { code: 'ITR', name: 'Income Tax Return' },
  2: { code: 'GST', name: 'GST Return' },
  3: { code: 'COMPANY', name: 'Company Registration' },
  4: { code: 'TRADEMARK', name: 'Trademark Registration' },
  5: { code: 'PAN', name: 'PAN Application' },
  6: { code: 'TDS', name: 'TDS Filing' },
  7: { code: 'AUDIT', name: 'Audit Services' },
  8: { code: 'ACCOUNTING', name: 'Accounting Services' },
  9: { code: 'HOUSE_PROPERTY', name: 'House Property' },
}

// Document Types
export const DOCUMENT_TYPES = [
  { value: 'pan_card', label: 'PAN Card' },
  { value: 'aadhaar_card', label: 'Aadhaar Card' },
  { value: 'bank_statement', label: 'Bank Statements' },
  { value: 'salary_slip', label: 'Salary Slips' },
  { value: 'investment_proof', label: 'Investment Proofs' },
  { value: 'rental_agreement', label: 'Rental Agreements' },
  { value: 'property_paper', label: 'Property Papers' },
  { value: 'form_16', label: 'Form 16' },
  { value: 'gst_return', label: 'GST Returns' },
]

// File Upload Limits
export const FILE_UPLOAD = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'application/zip'],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.zip'],
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 20, 50, 100],
}

// Invoice Status
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
}

export const INVOICE_STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

export const INVOICE_STATUS_COLORS = {
  draft: 'gray',
  pending: 'yellow',
  paid: 'green',
  overdue: 'red',
  cancelled: 'red',
}

// GST Rate
export const GST_RATE = 18

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  MONTH_YEAR: 'MMM YYYY',
}

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
}

// Routes
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  CA: {
    DASHBOARD: '/ca/dashboard',
    CLIENTS: '/ca/clients',
    CLIENT_DETAIL: '/ca/clients/:id',
    DOCUMENTS: '/ca/documents',
    FEES: '/ca/fees',
    INVOICES: '/ca/invoices',
    REPORTS: '/ca/reports',
    SETTINGS: '/ca/settings',
  },
  SUPER_ADMIN: {
    DASHBOARD: '/super-admin/dashboard',
    CA_MANAGEMENT: '/super-admin/ca-management',
    CA_DETAIL: '/super-admin/ca-management/:id',
    SYSTEM_SETTINGS: '/super-admin/settings',
    AUDIT_LOGS: '/super-admin/audit-logs',
  },
  
  CLIENT: {
    DASHBOARD: '/client/dashboard',
    DOCUMENTS: '/client/documents',
    INVOICES: '/client/invoices',
    STATUS: '/client/status',
  },
}

export const SUPER_ADMIN = {
  ROLES: {
    SUPER_ADMIN: 'SuperAdmin',
    CA: 'CA',
    STAFF: 'Staff',
    CLIENT: 'Client',
  },
  PERMISSIONS: {
    CREATE_CA: 'create_ca',
    EDIT_CA: 'edit_ca',
    DELETE_CA: 'delete_ca',
    VIEW_CA: 'view_ca',
    VIEW_AUDIT_LOGS: 'view_audit_logs',
    SYSTEM_SETTINGS: 'system_settings',
  },
}

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  CA: 'CA',
  STAFF: 'Staff',
  CLIENT: 'Client',
}


// Regex Patterns
export const PATTERNS = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  AADHAAR: /^[0-9]{12}$/,
  PHONE: /^[0-9]{10}$/,
  GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  PINCODE: /^[0-9]{6}$/,
}

// Notification Types
export const NOTIFICATION_TYPES = {
  CLIENT_CREATED: 'client_created',
  DOCUMENT_REQUESTED: 'document_requested',
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_APPROVED: 'document_approved',
  DOCUMENT_REJECTED: 'document_rejected',
  BILL_GENERATED: 'bill_generated',
  PAYMENT_RECEIVED: 'payment_received',
  STATUS_UPDATED: 'status_updated',
  PROPOSAL_GENERATED: 'proposal_generated',
}