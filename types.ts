
export type CategoryType = 'ESSENCIAIS' | 'QUALIDADE DE VIDA' | 'FUTURO' | 'DÍVIDAS';

export type FrequencyType = 'mensal' | 'quinzenal' | 'semanal' | 'trimestral' | 'semestral' | 'anual' | 'personalizado';

export type PaymentStatus = 'Pago' | 'Pendente' | 'Atrasado' | 'Agendado' | 'Planejado' | 'Não Pago' | 'Nulo';

export type DebtType = 'PASSIVOS' | 'DESPESAS FIXAS' | 'GASTOS VARIÁVEIS';

export interface FrequencyConfig {
  type: FrequencyType;
  customInterval?: number;
  customUnit?: 'dias' | 'semanas' | 'meses';
  startMonth: number;
  startYear: number;
  dueDay?: number; 
  weeklyDay?: number; 
}

export interface SubCategoryTag {
  name: string;
  colorClass: string;
}

export interface ItemOverride {
  id: string;
  timestamp: string;
  month: number;
  year: number;
  field: 'value' | 'dueDay';
  newValue: any;
  scope: 'one-time' | 'permanent';
}

export interface FinancialItem {
  id: string;
  subCategory: string;
  subCategoryColor?: string;
  item: string;
  value: number;
  frequency?: FrequencyConfig;
  installments?: number; 
  installmentValues?: number[]; // Array para valores específicos de cada parcela
  overrides?: ItemOverride[];
  isCancelled?: boolean;
  cancelledMonth?: number;
  cancelledYear?: number;
  masterDebtId?: string; 
  masterDebtInstallmentIndex?: number; 
  debtType?: DebtType;
}

export interface IncomeEntry {
  id: string;
  source: string;
  value: number;
  responsible: string;
  receivedDay?: number; 
  date: string;
  month: number;
  year: number;
}

export type TableColumnType = 'text' | 'number' | 'currency' | 'date';

export interface StrategyTableColumn {
  id: string;
  title: string;
  type: TableColumnType;
  color?: string;
}

export interface StrategyQuestion {
  id: string;
  text: string;
  type: 'text' | 'number';
  answer: string | number;
}

export interface StrategyBlock {
  id: string;
  entryId: string; 
  itemTitle: string; 
  title: string;
  content: string;
  mode: 'text' | 'table' | 'form';
  tableData?: {
    columns: StrategyTableColumn[];
    rows: Record<string, any>[];
  };
  formData?: StrategyQuestion[];
  status: 'draft' | 'completed';
  date?: string;
  source?: string;
  color?: string;
  month: number;
  year: number;
  order: number;
}

export interface MonthlyEntry {
  id: string;
  itemId: string; 
  item: string;
  emoji?: string;
  year: number;
  month: number;
  competenceMonth?: number; // Mês original
  competenceYear?: number;  // Ano original
  category: string;
  subCategory: string;
  subCategoryColor?: string;
  installments: string; 
  estimatedValue: number;
  paidValue: number;
  dueDate: string;
  paymentDate: string;
  status: PaymentStatus;
  group: string; 
  observation: string;
  observationColor?: string;
  order?: number;
  frequencyLabel?: string;
  hasOverride?: boolean;
  masterDebtId?: string;
  installmentIndex?: number;
  quinzenaIndex?: number; // 1 para primeira quinzena, 2 para segunda
  debtType?: DebtType;
}

export interface YearProfile {
  year: number;
  id?: string;
  financialData: Record<CategoryType, FinancialItem[]>;
  customTags: Record<CategoryType, SubCategoryTag[]>;
  monthlyEntries: MonthlyEntry[];
  incomeEntries: IncomeEntry[];
  strategyBlocks?: StrategyBlock[];
}

export interface MasterDebtInstallment {
  number: number;
  value: number;
  status: 'pending' | 'paid';
  paidDate?: string;
  dueDate?: string; // Data de vencimento da parcela
  historicalDueDate?: string; 
  negotiatedDueDate?: string; 
}

export interface MasterDebt {
  id: string;
  item: string;
  subCategory: string;
  subCategoryColor?: string;
  totalValue: number; // Valor Negociado (Atual)
  originalTotalValue?: number; // Valor Antes (Bruto)
  downPayment?: number; 
  installmentsCount: number; 
  originalInstallmentsCount?: number; 
  installments: MasterDebtInstallment[];
  status: 'waiting' | 'active' | 'paid' | 'negotiation';
  dueDay: number;
  createdAt: string;
  isNegotiation?: boolean;
}

export interface ConquistaDeposit {
  id: string;
  value: number;
  date: string;
  description?: string;
}

export interface Conquista {
  id: string;
  item: string;
  category: string;
  categoryColor?: string;
  targetValue: number;
  savedValue: number;
  imageUrl?: string; // Base64 ou URL
  deadline?: string;
  status: 'planning' | 'saving' | 'achieved';
  createdAt: string;
  deposits?: ConquistaDeposit[];
}

export type Theme = 'light' | 'dark';