// types/invoice.ts - TYPES COMPLETS CORRIGÉS

export interface Patient {
  id: number;
  firstname: string;
  lastname: string;
  email?: string;
  telephone?: string;  // AJOUTÉ
  phone?: string;      // AJOUTÉ
}

export interface Clinique {
  id: number;
  nom: string;
  phone?: string;      // AJOUTÉ
  email?: string;      // AJOUTÉ
  address?: string;    // AJOUTÉ
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantite: number;
  prix_unitaire_ht: number;
  montant_ht?: number;
  montant_total_ht?: number;
  montant_total_ttc?: number;
}

export interface InvoiceCreateItem {
  description: string;
  quantite: number;
  prix_unitaire_ht: number;
}

export interface Invoice {
  id: number;
  numero: string;
  patient: Patient;
  clinique: Clinique;
  issued_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  appointment?: {
    id: number;
    date: string;
  };
  
  // Champs DateTime
  date_emission: string;
  date_echeance?: string;
  
  // Champs formatés
  date_emission_formatted?: string;
  date_echeance_formatted?: string;
  date_emission_short?: string;
  date_echeance_short?: string;
  
  // Montants
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  
  description: string;
  status: 'BROUILLON' | 'EMISE' | 'PAYEE' | 'ANNULEE';
  status_display?: string;
  payment_status?: string;
  is_overdue?: boolean;
  days_overdue?: number;
  can_edit?: boolean;
  can_delete?: boolean;
  items_count?: number;
  issued_by_name?: string;
  
  items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceForCard {
  id: number;
  numero: string;
  patient: Patient;
  clinique: Clinique;
  date_emission: string;
  date_echeance?: string;
  date_emission_formatted?: string;
  date_echeance_formatted?: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  description: string;
  status: 'BROUILLON' | 'EMISE' | 'PAYEE' | 'ANNULEE';
  is_overdue?: boolean;
  days_overdue?: number;
  payment_status?: string;
  can_edit?: boolean;
  can_delete?: boolean;
}

export interface InvoiceCreateData {
  patient: number;
  appointment?: number;
  description: string;
  tva: number;
  date_echeance?: string;
  items: InvoiceCreateItem[];
  status?: string;
}

export interface FinancialStats {
  period: string;
  total_revenu: number;
  total_paye: number;
  impaye: number;
  taux_recouvrement: number;
  nombre_factures: number;
  factures_payees: number;
  factures_en_retard: number;
  taux_paiement: number;
  top_patients: Array<{
    patient_id: number;
    patient_name: string;
    total: number;
    invoice_count: number;
  }>;
  repartition_statut: Array<{
    status: string;
    count: number;
    total_amount: number;
  }>;
}

export interface MonthlyStats {
  month: string;
  year: number;
  total_revenue: number;
  paid_revenue: number;
  unpaid_revenue: number;
  invoice_count: number;
  paid_count: number;
  payment_rate: number;
}