
import { createClient } from '@supabase/supabase-js';
import { YearProfile, MasterDebt, FinancialItem, CategoryType, SubCategoryTag, MonthlyEntry, IncomeEntry, StrategyBlock, Conquista } from '../types';

const supabaseUrl = 'https://hfvwyblfduofppvdbxva.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmdnd5YmxmZHVvZnBwdmRieHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDQ4OTIsImV4cCI6MjA4MjUyMDg5Mn0.c8g-IpSFOlk5oKiOk1cbMnMKEo2o_MWaWANE-eYCORs';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- Mappers: Master Debt ---
export const masterDebtToSupabase = (d: MasterDebt) => ({
  id: d.id,
  item: d.item,
  sub_categoria: d.subCategory,
  cor_sub_categoria: d.subCategoryColor,
  valor_total: d.totalValue,
  valor_total_original: d.originalTotalValue,
  valor_entrada: d.downPayment,
  qtd_parcelas: d.installmentsCount,
  qtd_parcelas_original: d.originalInstallmentsCount,
  parcelas: d.installments,
  status: d.status,
  dia_vencimento: d.dueDay,
  negociado: d.isNegotiation,
  atualizado_em: new Date().toISOString()
});

export const masterDebtFromSupabase = (d: any): MasterDebt => ({
  id: d.id,
  item: d.item,
  subCategory: d.sub_categoria,
  subCategoryColor: d.cor_sub_categoria,
  totalValue: Number(d.valor_total),
  originalTotalValue: d.valor_total_original ? Number(d.valor_total_original) : undefined,
  downPayment: d.valor_entrada ? Number(d.valor_entrada) : undefined,
  installmentsCount: d.qtd_parcelas,
  originalInstallmentsCount: d.qtd_parcelas_original,
  installments: d.parcelas,
  status: d.status,
  dueDay: d.dia_vencimento,
  isNegotiation: d.negociado,
  createdAt: d.criado_em
});

// --- Mappers: Conquista ---
export const conquistaToSupabase = (c: Conquista) => ({
  id: c.id,
  item: c.item,
  categoria: c.category,
  cor_categoria: c.categoryColor,
  valor_alvo: c.targetValue,
  valor_salvo: c.savedValue,
  url_imagem: c.imageUrl,
  prazo: c.deadline,
  status: c.status,
  depositos: c.deposits || [],
  criado_em: c.createdAt
});

export const conquistaFromSupabase = (c: any): Conquista => ({
  id: c.id,
  item: c.item,
  category: c.categoria,
  categoryColor: c.cor_categoria,
  targetValue: Number(c.valor_alvo),
  savedValue: Number(c.valor_salvo),
  imageUrl: c.url_imagem,
  deadline: c.prazo,
  status: c.status,
  deposits: c.depositos || [],
  createdAt: c.criado_em
});

// --- Mappers: Conquista Tag ---
export const conquistaTagToSupabase = (t: SubCategoryTag) => ({
  nome: t.name,
  classe_cor: t.colorClass,
  atualizado_em: new Date().toISOString()
});

export const conquistaTagFromSupabase = (t: any): SubCategoryTag => ({
  name: t.nome,
  colorClass: t.classe_cor
});

// --- Mappers: Financial Item (Registry) ---
export const financialItemToSupabase = (i: FinancialItem, profileId: string, category: CategoryType) => ({
  id: i.id,
  perfil_ano_id: profileId,
  categoria: category,
  sub_categoria: i.subCategory,
  cor_sub_categoria: i.subCategoryColor,
  item: i.item,
  valor: i.value,
  parcelas: i.installments,
  valores_parcelas: i.installmentValues,
  cancelado: i.isCancelled,
  mes_cancelamento: i.cancelledMonth,
  ano_cancelamento: i.cancelledYear,
  divida_master_id: i.masterDebtId,
  indice_parcela_master: i.masterDebtInstallmentIndex,
  frequencia: i.frequency,
  tipo_divida: i.debtType,
  atualizado_em: new Date().toISOString()
});

export const financialItemFromSupabase = (i: any): FinancialItem => ({
  id: i.id,
  subCategory: i.sub_categoria,
  subCategoryColor: i.cor_sub_categoria,
  item: i.item,
  value: Number(i.valor),
  frequency: i.frequencia,
  installments: i.parcelas,
  installmentValues: i.valores_parcelas,
  isCancelled: i.cancelado,
  cancelledMonth: i.mes_cancelamento,
  cancelledYear: i.ano_cancelamento,
  masterDebtId: i.divida_master_id,
  masterDebtInstallmentIndex: i.indice_parcela_master,
  debtType: i.tipo_divida
});

// --- Mappers: Monthly Entry (Flow) ---
export const monthlyEntryToSupabase = (e: MonthlyEntry, profileId: string) => ({
  id: e.id,
  perfil_ano_id: profileId,
  item_id: e.itemId,
  item: e.item,
  emoji: e.emoji,
  ano: e.year,
  mes: e.month,
  mes_competencia: e.competenceMonth,
  ano_competencia: e.competenceYear,
  categoria: e.category,
  sub_categoria: e.subCategory,
  cor_sub_categoria: e.subCategoryColor,
  parcelas_str: e.installments,
  valor_estimado: e.estimatedValue,
  valor_pago: e.paidValue,
  data_vencimento: e.dueDate || null,
  data_pagamento: e.paymentDate || null,
  status: e.status,
  grupo: e.group,
  observacao: e.observation,
  cor_observacao: e.observationColor,
  ordem: e.order,
  label_frequencia: e.frequencyLabel,
  tem_override: e.hasOverride,
  divida_master_id: e.masterDebtId,
  indice_parcela: e.installmentIndex,
  indice_quinzena: e.quinzenaIndex,
  tipo_divida: e.debtType,
  atualizado_em: new Date().toISOString()
});

export const monthlyEntryFromSupabase = (e: any): MonthlyEntry => ({
  id: e.id,
  itemId: e.item_id,
  item: e.item,
  emoji: e.emoji,
  year: e.ano,
  month: e.mes,
  competenceMonth: e.mes_competencia,
  competenceYear: e.ano_competencia,
  category: e.categoria,
  subCategory: e.sub_categoria,
  subCategoryColor: e.cor_sub_categoria,
  installments: e.parcelas_str,
  estimatedValue: Number(e.valor_estimado),
  paidValue: Number(e.valor_pago),
  dueDate: e.data_vencimento || '',
  paymentDate: e.data_pagamento || '',
  status: e.status,
  group: e.group,
  observation: e.observacao,
  order: e.ordem,
  frequencyLabel: e.label_frequencia,
  hasOverride: e.tem_override,
  masterDebtId: e.divida_master_id,
  installmentIndex: e.indice_parcela,
  quinzenaIndex: e.indice_quinzena,
  debtType: e.tipo_divida
});

// --- Mappers: Income Entry (Revenue) ---
export const incomeEntryToSupabase = (i: IncomeEntry, profileId: string) => ({
  id: i.id,
  perfil_ano_id: profileId,
  fonte: i.source,
  valor: i.value,
  responsavel: i.responsible,
  dia_recebimento: i.receivedDay,
  data_efetiva: i.date || null,
  mes: i.month,
  ano: i.year
});

export const incomeEntryFromSupabase = (i: any): IncomeEntry => ({
  id: i.id,
  source: i.fonte,
  value: Number(i.valor),
  responsible: i.responsavel,
  receivedDay: i.dia_recebimento,
  date: i.data_efetiva || '',
  month: i.mes,
  year: i.ano
});

// --- Mappers: Strategy Block ---
export const strategyBlockToSupabase = (s: StrategyBlock, profileId: string) => ({
  id: s.id,
  perfil_ano_id: profileId,
  entrada_id: s.entryId,
  titulo_item: s.itemTitle,
  titulo: s.title,
  conteudo: s.content,
  modo: s.mode,
  status: s.status,
  mes: s.month,
  ano: s.year,
  ordem: s.order,
  cor: s.color,
  atualizado_em: new Date().toISOString()
});
