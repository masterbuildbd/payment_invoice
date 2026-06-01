export type CompanySettings = {
  id: string;
  companyName: string;
  slogan: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  bankName: string;
  branchName: string;
  accountNo: string;
  terms: string;
  logoUrl?: string;
  loginPageName?: string;
  loginPageLogoUrl?: string;
  signatureName?: string;
  signatureText?: string;
  appLabel?: string;
  decoderLabel?: string;
  panelLabel?: string;
  userLabel?: string;
  sidebarAdminName?: string;
  sidebarTitle?: string;
  appVersion?: string;

  // Dynamic Client Menu Systems Settings
  clientDashboardLabel?: string;
  clientDashboardEnabled?: boolean;
  clientInvoicesLabel?: string;
  clientInvoicesEnabled?: boolean;
  clientAccountLabel?: string;
  clientAccountEnabled?: boolean;
  clientPaymentLabel?: string;
  clientPaymentEnabled?: boolean;
  clientSmsLabel?: string;
  clientSmsEnabled?: boolean;
  clientSettingsLabel?: string;
  clientSettingsEnabled?: boolean;

  // Active Payment Gateways Configurations
  bkashNumber?: string;
  bkashEnabled?: boolean;
  nagadNumber?: string;
  nagadEnabled?: boolean;
  binancePayId?: string;
  binanceEnabled?: boolean;
  binanceUsdtAddress?: string;
  paypalEmail?: string;
  paypalEnabled?: boolean;
  bankEnabled?: boolean;
  runningNotice?: string;

  // Customizable Reseller Panel Duration Rates
  panelPrice1m?: number;
  panelPrice2m?: number;
  panelPrice3m?: number;
  panelPrice4m?: number;
  panelPrice5m?: number;
  panelPrice6m?: number;
  panelPrice12m?: number;

  // Customizable Decoder Duration Rates
  decoderPrice1m?: number;
  decoderPrice2m?: number;
  decoderPrice3m?: number;
  decoderPrice4m?: number;
  decoderPrice5m?: number;
  decoderPrice6m?: number;
  decoderPrice12m?: number;
};

export type User = {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'reseller' | 'user';
  status?: 'pending' | 'approved' | 'rejected';
  price?: number;
  paidAmount?: number;
  dueAmount?: number;
  region?: string;
  countryCode?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  paymentMethod?: string;
  transactionId?: string;
  note?: string;
};

export type Invoice = {
  id: string;
  customerName: string;
  customerNumber: string;
  paymentMethod: string;
  transactionId: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'pending' | 'overdue' | 'rejected';
  createdAt: string;
  cashierName?: string;
  type?: string;
  note?: string;
  region?: string;
  username?: string;
  items: { description: string; quantity: number; price: number }[];
  appName?: string;
  packageName?: string;
  protocol?: string;
  appsQuality?: 'Normal security' | 'medium security' | 'high security';
  appsTrying?: 'Paid apps' | 'Free apps';
  appWorkType?: 'New app' | 'Old app' | 'Update app';
  panelName?: string;
  panelUrl?: string;
  panelDuration?: string;
  panelType?: 'New panel' | 'Panel Rent';
  decoderUsername?: string;
  decoderUserType?: 'New user' | 'Old user' | 'Renew';
  decoderDuration?: string;
  serviceDetails?: string;
};

export type AppData = {
  id: string;
  name: string;
  packageName: string;
  protocol: string;
  appType: 'Free' | 'Paid';
  category: string;
  status: 'active' | 'inactive';
  price?: number;
  version?: string;
  region?: string;
  countryCode?: string;
  phone?: string;
  paymentMethod?: string;
  transactionId?: string;
  note?: string;
  appsTrying?: 'Paid apps' | 'Free apps';
  appsQuality?: 'Normal security' | 'medium security' | 'high security';
  paidAmount?: number;
  dueAmount?: number;
  appWorkType?: 'New app' | 'Old app' | 'Update app';
};

export type DecoderData = {
  id: string;
  model: string;
  serialNumber: string;
  username: string;
  duration: string;
  price: number;
  status: 'online' | 'offline';
  region?: string;
  countryCode?: string;
  phone?: string;
  paymentMethod?: string;
  transactionId?: string;
  note?: string;
};

export type PanelData = {
  id: string;
  name: string;
  url: string;
  region: string;
  duration: string;
  price: number;
  panelType: 'New' | 'Rent' | 'Try';
  tier: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'maintenance';
  countryCode?: string;
  phone?: string;
  paymentMethod?: string;
  transactionId?: string;
  note?: string;
};

export type ActivityLog = {
  id: string;
  type: 'create' | 'update' | 'delete' | 'payment';
  message: string;
  timestamp: string;
  user: string;
  category: 'apps' | 'panels' | 'decoders' | 'users' | 'investments' | 'invoices';
};

export type Investment = {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  note?: string;
};
