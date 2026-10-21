export interface PrintDocumentItem {
  id: string;
  position?: number;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalPrice: number;
  isHeader?: boolean;
}

export interface PrintCompanyInfo {
  company_name?: string;
  activity_title?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  bank_name?: string;
  bank_rib?: string;
  bank_iban?: string;
  website?: string;
  rne?: string;
  default_footer?: string;
}

export interface PrintDocumentData {
  type: 'devis' | 'facture';
  title: string;
  documentNumber: string;
  date: string;
  dueDate?: string;
  validityDays?: number;
  quoteReference?: string;
  status?: string;

  client: {
    name: string;
    companyName?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    matricule_fiscal?: string | null;
  };

  poolInfo?: {
    name?: string;
    location?: string;
  } | null;

  items: PrintDocumentItem[];

  subtotalHT: number;
  discountRate?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  stampDuty?: number;
  totalTTC: number;
  paidAmount?: number;
  balanceDue?: number;

  paymentTerms?: string;
  notes?: string;
  headerContent?: string;
  footerContent?: string;
}

