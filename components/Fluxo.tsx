
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, Calendar, TrendingUp, ArrowUpCircle, ArrowDownCircle, Clock, Calculator, StickyNote, ChevronLeft, ChevronRight, ShieldCheck, Hash, FileText, Settings2, History, Check, X, Info, Zap, AlertCircle, Layers, Palette, ArrowUpDown, ArrowUp, ArrowDown, Target, Lightbulb, Map, ArrowRightLeft, Lock, Edit3, Save, Table, Layout, CheckCircle2, ChevronDown, Type, DollarSign, CalendarRange, CalendarDays, ChevronUp, PanelLeftClose, PanelLeftOpen, Maximize2, Minimize2, AlertTriangle, Ban, Flame, ShieldAlert, Percent, ListFilter, Undo2, SlidersHorizontal, CalendarCheck, Filter, RotateCcw, Search, Tag } from 'lucide-react';
import { MonthlyEntry, IncomeEntry, PaymentStatus, CategoryType, FinancialItem, ItemOverride, StrategyBlock, StrategyTableColumn, StrategyQuestion, TableColumnType, MasterDebt, YearProfile, FrequencyConfig, DebtType } from '../types';

type SortKey = 'status' | 'order' | 'item' | 'category' | 'subCategory' | 'installments' | 'estimatedValue' | 'dueDate' | 'paymentDate' | 'hasOverride' | 'observation' | 'debtType';

const formatDate = (dateStr: string) => { 
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return '--/---'; 
  const [, month, day] = dateStr.split('-'); 
  const monthsAbbr = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const monthIdx = parseInt(month) - 1;
  return `${day} ${monthsAbbr[monthIdx] || '???'}`;
};

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

interface FluxoProps {
  entries: MonthlyEntry[];
  setEntries: (newEntriesAction: any) => void;
  incomeEntries: IncomeEntry[];
  setIncomeEntries: (newIncomesAction: any) => void;
  financialData: Record<CategoryType, FinancialItem[]>;
  setFinancialData: (newDataAction: any) => void;
  activeYear: number;
  isHeaderPinned: boolean;
  strategyBlocks: StrategyBlock[];
  setStrategyBlocks: (newBlocksAction: any) => void;
  masterDebts: MasterDebt[];
  setMasterDebts: React.Dispatch<React.SetStateAction<MasterDebt[]>>;
  allProfiles: Record<number, YearProfile>;
  setProfiles: React.Dispatch<React.SetStateAction<Record<number, YearProfile>>>;
}

const Fluxo: React.FC<FluxoProps> = ({ entries, setEntries, incomeEntries, setIncomeEntries, financialData, setFinancialData, activeYear, isHeaderPinned, strategyBlocks, setStrategyBlocks, masterDebts, setMasterDebts, allProfiles, setProfiles }) => {
  // Inicialização com Memória Local
  const [activeMonth, setActiveMonth] = useState<number>(() => {
    const saved = localStorage.getItem('finanza-fluxo-active-month');
    return saved ? parseInt(saved) : new Date().getMonth() + 1;
  });

  const [isIncomeCollapsed, setIsIncomeCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('finanza-fluxo-income-collapsed');
    return saved === 'true';
  });

  const [isStrategyCollapsed, setIsStrategyCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('finanza-fluxo-strategy-collapsed');
    return saved === 'true';
  });

  // Estados de Filtro
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [filterSubCategories, setFilterSubCategories] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<Set<string>>(new Set());
  const [filterPunctuality, setFilterPunctuality] = useState<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<'mes' | 'atrasadas' | 'geral'>('geral');
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [personalizingEntry, setPersonalizingEntry] = useState<MonthlyEntry | null>(null);
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null);
  const [isAddVariableModalOpen, setIsAddVariableModalOpen] = useState(false);
  const [openDatePickerId, setOpenDatePickerId] = useState<string | null>(null);
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'order', direction: 'asc' });

  const monthsLabel = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const categoriesOptions = ['ESSENCIAIS', 'QUALIDADE DE VIDA', 'FUTURO', 'DÍVIDAS'];
  const statusOptions = ['Pago', 'Pendente', 'Atrasado', 'Planejado', 'Não Pago', 'Agendado'];
  const punctualityOptions = ['PONTUAL', 'ATRASADO', 'NO PRAZO', 'PRAZO'];

  // Persistência de Estado UI
  useEffect(() => {
    localStorage.setItem('finanza-fluxo-active-month', activeMonth.toString());
    localStorage.setItem('finanza-fluxo-income-collapsed', String(isIncomeCollapsed));
    localStorage.setItem('finanza-fluxo-strategy-collapsed', String(isStrategyCollapsed));
  }, [activeMonth, isIncomeCollapsed, isStrategyCollapsed]);

  useEffect(() => {
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (personalizingEntry) setPersonalizingEntry(null);
        else if (editingObservationId) setEditingObservationId(null);
        else if (isAddVariableModalOpen) setIsAddVariableModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalEsc);
    return () => window.removeEventListener('keydown', handleGlobalEsc);
  }, [personalizingEntry, editingObservationId, isAddVariableModalOpen]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: SortKey) => {
    const isActive = sortConfig?.key === key;
    if (!isActive) return <ArrowUpDown className="w-4 h-4 opacity-40 text-slate-400 group-hover:opacity-70 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-sky-600 dark:text-sky-400" /> : <ArrowDown className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
  };

  const getPontualidadeStatus = (entry: MonthlyEntry) => {
    if (!entry.dueDate || !entry.dueDate.includes('-')) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(entry.dueDate + 'T00:00:00');
    const isPaid = entry.status === 'Pago';
    if (isPaid) {
      if (!entry.paymentDate) return { label: 'PONTUAL', color: 'text-emerald-500', icon: ShieldCheck };
      const paymentDate = new Date(entry.paymentDate + 'T00:00:00');
      return paymentDate <= dueDate ? { label: 'PONTUAL', color: 'text-emerald-500', icon: ShieldCheck } : { label: 'ATRASADO', color: 'text-rose-500', icon: Flame };
    } else {
      if (today > dueDate) return { label: 'ATRASADO', color: 'text-rose-500', icon: AlertTriangle };
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7 && diffDays >= 0) return { label: `PRAZO (${diffDays}d)`, color: 'text-amber-500', icon: Clock };
      return { label: 'NO PRAZO', color: 'text-slate-400', icon: Calendar };
    }
  };

  const currentMonthEntries = useMemo(() => {
    const thisMonth = (entries || []).filter(e => e.year === activeYear && e.month === activeMonth);
    const missedItems = Object.values(allProfiles || {}).flatMap((p: YearProfile) => 
      (p.monthlyEntries || []).filter(e => {
        const isPast = e.year < activeYear || (e.year === activeYear && e.month < activeMonth);
        return isPast && e.status === 'Não Pago';
      })
    );

    let filtered: MonthlyEntry[] = [];
    if (activeTab === 'mes') filtered = thisMonth;
    else if (activeTab === 'atrasadas') filtered = missedItems;
    else filtered = [...thisMonth, ...missedItems];

    filtered = filtered.filter(e => {
      const matchesSearch = filterSearch === '' || e.item.toLowerCase().includes(filterSearch.toLowerCase());
      const matchesCategory = filterCategories.size === 0 || filterCategories.has(e.category);
      const matchesSubCategory = filterSubCategories.size === 0 || filterSubCategories.has(e.subCategory);
      const matchesStatus = filterStatus.size === 0 || filterStatus.has(e.status);
      
      const termometro = getPontualidadeStatus(e);
      const matchesPunctuality = filterPunctuality.size === 0 || (termometro && Array.from(filterPunctuality).some((p: string) => termometro.label.includes(p)));

      return matchesSearch && matchesCategory && matchesSubCategory && matchesStatus && matchesPunctuality;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let valA: any;
        let valB: any;
        switch (sortConfig.key) {
          case 'status':
            const statusOrder = { 'Não Pago': 5, 'Atrasado': 4, 'Pendente': 3, 'Planejado': 2, 'Agendado': 1.5, 'Pago': 1 };
            valA = (statusOrder as any)[a.status] || 0;
            valB = (statusOrder as any)[b.status] || 0;
            break;
          case 'dueDate': valA = a.dueDate; valB = b.dueDate; break;
          case 'paymentDate': valA = a.paymentDate || '9999-99-99'; valB = b.paymentDate || '9999-99-99'; break;
          default: valA = (a as any)[sortConfig.key]; valB = (b as any)[sortConfig.key];
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [entries, activeYear, activeMonth, activeTab, sortConfig, allProfiles, filterSearch, filterCategories, filterSubCategories, filterStatus, filterPunctuality]);

  // SEGREGAÇÃO DOS DADOS PARA OS CARDS
  const operationalEntries = useMemo(() => {
    return currentMonthEntries.filter(e => e.debtType !== 'GASTOS VARIÁVEIS');
  }, [currentMonthEntries]);

  const variableExpensesEntries = useMemo(() => {
    return currentMonthEntries.filter(e => e.debtType === 'GASTOS VARIÁVEIS');
  }, [currentMonthEntries]);

  const currentMonthIncomes = useMemo(() => (incomeEntries || []).filter(i => i.year === activeYear && i.month === activeMonth), [incomeEntries, activeYear, activeMonth]);
  
  const subCategoriesList = useMemo(() => {
    const tags = new Set<string>();
    currentMonthEntries.forEach(e => {
      if (e.subCategory && e.subCategory !== '-') tags.add(e.subCategory);
    });
    return Array.from(tags).sort();
  }, [currentMonthEntries]);

  const totals = useMemo(() => {
    const inflow = currentMonthIncomes.reduce((acc, curr) => acc + curr.value, 0);
    
    // ATUALIZAÇÃO SOLICITADA: Itens com status 'Não Pago' não são debitados da Margem Estratégica
    const outflowPlanned = currentMonthEntries
      .filter(e => e.status !== 'Não Pago')
      .reduce((acc, curr) => acc + curr.estimatedValue, 0);
      
    const outflowPaid = currentMonthEntries.filter(e => e.status === 'Pago').reduce((acc, curr) => acc + (curr.paidValue || curr.estimatedValue), 0);
    
    return { inflow, outflowPlanned, outflowPaid, strategyBalance: inflow - outflowPlanned, currentBalance: inflow - outflowPaid };
  }, [currentMonthEntries, currentMonthIncomes]);

  const statusSummary = useMemo(() => {
    const summary = { Pago: 0, Planejado: 0, Pendente: 0, 'Não Pago': 0 };
    currentMonthEntries.forEach(e => { if (summary.hasOwnProperty(e.status)) summary[e.status as keyof typeof summary]++; });
    return summary;
  }, [currentMonthEntries]);

  const hasActiveFilters = filterSearch !== '' || filterCategories.size > 0 || filterSubCategories.size > 0 || filterStatus.size > 0 || filterPunctuality.size > 0;

  const clearFilters = () => {
    setFilterSearch('');
    setFilterCategories(new Set());
    setFilterSubCategories(new Set());
    setFilterStatus(new Set());
    setFilterPunctuality(new Set());
  };

  const toggleSetFilter = (set: Set<any>, setter: (s: Set<any>) => void, val: any) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  };

  const updateIncome = (id: string, field: keyof IncomeEntry, value: any) => setIncomeEntries((prev: IncomeEntry[]) => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  const removeIncome = (id: string) => setIncomeEntries((prev: IncomeEntry[]) => prev.filter(i => i.id !== id));
  
  const updateEntry = (id: string, updates: Partial<MonthlyEntry>) => {
    let sourceYear: number | null = null;
    let entryToUpdate: MonthlyEntry | null = null;

    for (const [yearStr, profile] of Object.entries(allProfiles) as [string, YearProfile][]) {
      const year = parseInt(yearStr);
      const found = (profile.monthlyEntries || []).find(e => e.id === id);
      if (found) {
        sourceYear = year;
        entryToUpdate = found;
        break;
      }
    }

    if (!entryToUpdate || sourceYear === null) return;

    // Se o item for um gasto variável, não permitir atualização de status
    if (entryToUpdate.debtType === 'GASTOS VARIÁVEIS' && updates.status !== undefined && updates.status !== 'Pago') {
        return;
    }

    const isPast = sourceYear < activeYear || (sourceYear === activeYear && entryToUpdate.month < activeMonth);
    const isReturning = updates.month !== undefined && updates.month === entryToUpdate.competenceMonth;
    const shouldMigrate = !isReturning && isPast && entryToUpdate.status === 'Não Pago' && updates.status !== undefined;

    setProfiles((prev: Record<number, YearProfile>) => {
      const next: Record<number, YearProfile> = { ...prev };
      
      if (shouldMigrate) {
        const sourceProfile = next[sourceYear!];
        if (sourceProfile) {
          next[sourceYear!] = {
            ...sourceProfile,
            monthlyEntries: (sourceProfile.monthlyEntries || []).filter(e => e.id !== id)
          };
        }
        const migratedEntry: MonthlyEntry = { 
          ...entryToUpdate!, 
          ...updates, 
          month: activeMonth, 
          year: activeYear,
          competenceMonth: entryToUpdate!.competenceMonth ?? entryToUpdate!.month,
          competenceYear: entryToUpdate!.competenceYear ?? sourceYear!
        };
        const activeYearProfile = next[activeYear];
        if (activeYearProfile) {
          next[activeYear] = {
            ...activeYearProfile,
            monthlyEntries: [...(activeYearProfile.monthlyEntries || []), migratedEntry]
          };
        }
      } else if (isReturning) {
        const targetYear = entryToUpdate!.competenceYear ?? sourceYear!;
        const targetMonth = entryToUpdate!.competenceMonth ?? entryToUpdate!.month;
        
        const sourceProfile = next[sourceYear!];
        if (sourceProfile) {
          next[sourceYear!] = {
            ...sourceProfile,
            monthlyEntries: (sourceProfile.monthlyEntries || []).filter(e => e.id !== id)
          };
        }
        
        const restoredEntry: MonthlyEntry = { 
          ...entryToUpdate!, 
          ...updates, 
          month: targetMonth, 
          year: targetYear 
        };
        
        if (!next[targetYear]) {
           next[targetYear] = { 
             ...(allProfiles[targetYear] || { 
               year: targetYear, 
               financialData: { 'ESSENCIAIS': [], 'QUALIDADE DE VIDA': [], 'FUTURO': [], 'DÍVIDAS': [] }, 
               customTags: { 'ESSENCIAIS': [], 'QUALIDADE DE VIDA': [], 'FUTURO': [], 'DÍVIDAS': [] }, 
               monthlyEntries: [], 
               incomeEntries: [] 
             }), 
             monthlyEntries: [] 
           };
        }
        
        const targetProfile = next[targetYear];
        if (targetProfile) {
          next[targetYear] = {
            ...targetProfile,
            monthlyEntries: [...(targetProfile.monthlyEntries || []), restoredEntry]
          };
        }
      } else {
        const sourceProfile = next[sourceYear!];
        if (sourceProfile) {
          next[sourceYear!] = {
            ...sourceProfile,
            monthlyEntries: (sourceProfile.monthlyEntries || []).map(e => e.id === id ? { ...e, ...updates } : e)
          };
        }
      }
      return next;
    });

    if (entryToUpdate.masterDebtId && updates.status !== undefined) {
      const { masterDebtId, installmentIndex } = entryToUpdate;
      const isPaid = updates.status === 'Pago';
      setMasterDebts(prevMaster => prevMaster.map(md => {
        if (md.id === masterDebtId) {
          const nextInstallments = [...md.installments];
          if (installmentIndex !== undefined && nextInstallments[installmentIndex]) {
            nextInstallments[installmentIndex] = { ...nextInstallments[installmentIndex], status: isPaid ? 'paid' : 'pending', paidDate: isPaid ? (updates.paymentDate || new Date().toISOString().split('T')[0]) : undefined };
          }
          const allPaid = nextInstallments.every(inst => inst.status === 'paid');
          return { ...md, installments: nextInstallments, status: allPaid ? 'paid' : (md.isNegotiation ? 'negotiation' : 'active') };
        }
        return md;
      }));
    }
  };

  const togglePaymentStatus = (entry: MonthlyEntry) => {
    // Bloquear alteração se for gasto variável
    if (entry.debtType === 'GASTOS VARIÁVEIS') return;

    let nextStatus: PaymentStatus;
    switch(entry.status) {
      case 'Pendente': nextStatus = 'Planejado'; break;
      case 'Planejado': nextStatus = 'Pago'; break;
      case 'Pago': nextStatus = 'Não Pago'; break;
      case 'Não Pago': nextStatus = 'Pendente'; break;
      default: nextStatus = 'Pendente';
    }
    
    updateEntry(entry.id, { 
      status: nextStatus, 
      paymentDate: nextStatus === 'Pago' ? new Date().toISOString().split('T')[0] : '', 
      paidValue: nextStatus === 'Pago' ? entry.estimatedValue : 0 
    });
  };

  const handleSavePersonalization = (overrides: { field: 'value' | 'dueDay', newValue: any, scope: 'one-time' | 'permanent' }[]) => {
    if (!personalizingEntry) return;

    overrides.forEach(override => {
      if (override.scope === 'permanent') {
        const { itemId, category } = personalizingEntry;
        setFinancialData((prev: Record<CategoryType, FinancialItem[]>) => {
          const cat = category as CategoryType;
          if (!prev[cat]) return prev;
          return {
            ...prev,
            [cat]: prev[cat].map(item => {
              if (item.id === itemId) {
                const updatedItem = { ...item };
                if (override.field === 'value') updatedItem.value = override.newValue;
                if (override.field === 'dueDay') {
                   if (updatedItem.frequency) {
                      const day = typeof override.newValue === 'string' ? parseInt(override.newValue.split('-')[2]) : override.newValue;
                      updatedItem.frequency = { ...updatedItem.frequency, dueDay: day };
                   }
                }
                return updatedItem;
              }
              return item;
            })
          };
        });
      }

      if (override.field === 'dueDay') {
        const dateStr = String(override.newValue);
        if (dateStr.includes('-')) {
          const [yearVal, monthVal] = dateStr.split('-').map(Number);
          if (monthVal !== personalizingEntry.month || yearVal !== personalizingEntry.year) {
            updateEntry(personalizingEntry.id, { month: monthVal, year: yearVal, dueDate: override.newValue, hasOverride: true });
          } else {
            updateEntry(personalizingEntry.id, { dueDate: override.newValue, hasOverride: true });
          }
        }
      } else if (override.field === 'value') {
        const updates: Partial<MonthlyEntry> = { 
          estimatedValue: override.newValue, 
          hasOverride: true 
        };
        
        if (personalizingEntry.status === 'Pago') {
          updates.paidValue = override.newValue;
        }
        
        updateEntry(personalizingEntry.id, updates);
      }
    });

    setPersonalizingEntry(null);
  };

  const handleCancelItem = () => {
    if (!personalizingEntry) return;
    const { itemId, category, month, year } = personalizingEntry;
    setFinancialData((prev: Record<CategoryType, FinancialItem[]>) => {
      const cat = category as CategoryType;
      if (!prev[cat]) return prev;
      return { ...prev, [cat]: prev[cat].map(item => item.id === itemId ? { ...item, isCancelled: true, cancelledMonth: month, cancelledYear: year } : item) };
    });
    
    setProfiles(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(y => {
        const yr = parseInt(y);
        const currentYearProfile = next[yr];
        if (currentYearProfile) {
          next[yr] = {
            ...currentYearProfile,
            monthlyEntries: (currentYearProfile.monthlyEntries || []).filter(e => {
              const isPastMonth = e.year < year || (e.year === year && e.month < month);
              return e.itemId !== itemId || isPastMonth;
            })
          };
        }
      });
      return next;
    });
    setPersonalizingEntry(null);
  };

  const getCategoryStyles = (category: string) => {
    switch (category.toUpperCase()) {
      case 'ESSENCIAIS': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/10';
      case 'QUALIDADE DE VIDA': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 dark:border-sky-500/10';
      case 'FUTURO': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/10';
      case 'DÍVIDAS': return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 dark:border-violet-500/10';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getStatusConfig = (status: PaymentStatus, entryId: string) => {
    switch(status) {
      case 'Pago': return { icon: <ShieldCheck className="w-4 h-4" />, bgColor: 'bg-emerald-500', rowClass: 'bg-emerald-500/[0.05] dark:bg-emerald-500/[0.03]', textClass: 'text-emerald-700 dark:text-emerald-400 line-through opacity-60' };
      case 'Não Pago': return { icon: <AlertCircle className="w-4 h-4" />, bgColor: 'bg-rose-500', rowClass: 'bg-rose-500/[0.05] dark:bg-rose-500/[0.03]', textClass: 'text-rose-600 dark:text-rose-400 italic' };
      case 'Planejado': return { icon: <Calendar className="w-4 h-4" />, bgColor: 'bg-sky-500', rowClass: 'bg-sky-500/[0.03] dark:bg-sky-500/[0.02]', textClass: 'text-slate-900 dark:text-white font-black' };
      default: return { icon: <Clock className="w-4 h-4" />, bgColor: 'bg-white dark:bg-slate-950', rowClass: '', textClass: 'text-slate-900 dark:text-white' };
    }
  };

  // Grade calibrada rigorosamente para as porcentagens solicitadas (Distribuição fracional para ocupar 100%)
  const auditGridCols = "grid-cols-[5%_5%_5%_10%_10%_10%_5%_5%_5%_5%_10%_5%_10%]";

  const getDebtTypeLabel = (type?: DebtType) => {
    if (!type) return 'FIXA';
    if (type === 'DESPESAS FIXAS') return 'FIXA';
    if (type === 'GASTOS VARIÁVEIS') return 'VARIÁVEL';
    return type; // 'PASSIVOS'
  };

  const handleAddVariableItem = (newItemData: any) => {
    const newEntry: MonthlyEntry = {
      id: crypto.randomUUID(),
      itemId: crypto.randomUUID(), // Item isolado
      item: newItemData.item.toUpperCase(),
      year: activeYear,
      month: activeMonth,
      category: newItemData.category,
      subCategory: newItemData.subCategory,
      installments: '-',
      estimatedValue: newItemData.value,
      paidValue: newItemData.value, // Valor pago preenchido
      dueDate: newItemData.dueDate,
      paymentDate: new Date().toISOString().split('T')[0], // Data de pagamento de hoje
      status: 'Pago', // Status 'Pago' por padrão conforme solicitado
      group: newItemData.category,
      observation: newItemData.observation,
      order: 5,
      debtType: 'GASTOS VARIÁVEIS'
    };

    updateActiveProfile(prev => ({
      ...prev,
      monthlyEntries: [...(prev.monthlyEntries || []), newEntry]
    }));
    setIsAddVariableModalOpen(false);
  };

  const updateActiveProfile = (updater: (prev: YearProfile) => YearProfile) => {
    setProfiles(prev => {
      const currentProfile = prev[activeYear];
      if (!currentProfile) return prev;
      return { ...prev, [activeYear]: updater(currentProfile) };
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      {personalizingEntry && <PersonalizationModal item={personalizingEntry} onClose={() => setPersonalizingEntry(null)} onSave={handleSavePersonalization} onCancelItem={handleCancelItem} />}
      {editingObservationId && (
        <ObservationModal 
          entry={entries.find(e => e.id === editingObservationId)!} 
          onClose={() => setEditingObservationId(null)} 
          onSave={(text) => { updateEntry(editingObservationId, { observation: text }); setEditingObservationId(null); }} 
        />
      )}
      {isAddVariableModalOpen && (
        <AddVariableModal 
          onClose={() => setIsAddVariableModalOpen(false)} 
          onSave={handleAddVariableItem} 
          activeMonth={activeMonth}
          activeYear={activeYear}
        />
      )}

      <div onMouseEnter={() => setIsHeaderHovered(true)} onMouseLeave={() => setIsHeaderHovered(false)} className={`transition-all duration-500 shrink-0 ${isHeaderPinned ? 'opacity-100 mb-6' : 'h-0 opacity-0 mb-0 overflow-visible'}`}>
        <div className={`bg-white dark:bg-[#020617] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-500 ${!(isHeaderPinned || isHeaderHovered) ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <button onClick={() => setActiveMonth(m => Math.max(1, m - 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                <div className="text-center min-w-[100px]"><h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-0.5">{monthsLabel[activeMonth - 1]}</h2><span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{activeYear}</span></div>
                <button onClick={() => setActiveMonth(m => Math.min(12, m + 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="h-10 w-px bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-[#0F172A]/40 p-1 rounded-xl border-2 border-slate-100 dark:border-slate-800 shadow-inner max-w-[500px]">
                {monthsLabel.map((m, i) => {
                  const abbreviation = m.substring(0, 3).toUpperCase();
                  return (<button key={m} onClick={() => setActiveMonth(i + 1)} className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all text-center min-w-[34px] ${activeMonth === i + 1 ? 'bg-[#0F172A] dark:bg-slate-700 text-white shadow-md scale-[1.05] z-10' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'}`}>{abbreviation}</button>);
                })}
              </div>
              <div className="h-10 w-px bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex gap-8">
                <div className="flex flex-col"><span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><ArrowUpCircle className="w-3 h-3 text-emerald-500" /> Recebido</span><span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(totals.inflow)}</span></div>
                <div className="flex flex-col"><span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><ArrowDownCircle className="w-3 h-3 text-rose-500" /> Planejado</span><span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(totals.outflowPlanned)}</span></div>
                
                <div className="flex items-center ml-2">
                  <button 
                    onClick={() => setShowFilters(!showFilters)} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all relative ${showFilters || hasActiveFilters ? 'bg-sky-600 border-sky-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filtro</span>
                    {hasActiveFilters && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right"><span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 block">Margem Estratégica</span><span className={`text-xl font-black tabular-nums leading-none ${totals.strategyBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(totals.strategyBalance)}</span></div>
              <div className="h-10 w-px bg-slate-100 dark:bg-slate-800"></div>
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"><div className="flex items-center gap-1.5 mb-0.5"><Calculator className="w-3 h-3 text-sky-500" /><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saldo Caixa</span></div><span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(totals.currentBalance)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex-grow grid grid-cols-1 ${isIncomeCollapsed ? 'lg:grid-cols-[64px_1fr]' : 'lg:grid-cols-[420px_1fr]'} gap-6 min-h-0 transition-all duration-500`}>
        <div className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden h-full transition-all duration-500`}>
          <div className={`p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 ${isIncomeCollapsed ? 'flex-col gap-4' : ''}`}>
            <div className="flex items-center gap-3"><div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-500 rounded-lg"><ArrowUpCircle className="w-4 h-4" /></div>{!isIncomeCollapsed && <h3 className="text-[12px] font-black text-slate-950 dark:text-white uppercase tracking-tight">Fluxo de Entradas</h3>}</div>
            <div className="flex items-center gap-1">{!isIncomeCollapsed && (<button onClick={() => setIncomeEntries((prev: IncomeEntry[]) => [...(prev || []), { id: crypto.randomUUID(), source: '', value: 0, responsible: '', receivedDay: undefined, date: new Date().toISOString().split('T')[0], month: activeMonth, year: activeYear }])} className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:scale-105 transition-all shadow-md"><Plus className="w-4 h-4" /></button>)}<button onClick={() => setIsIncomeCollapsed(!isIncomeCollapsed)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all">{isIncomeCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}</button></div>
          </div>
          {!isIncomeCollapsed && (
            <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-3 animate-in fade-in duration-500">
              {(currentMonthIncomes || []).length === 0 ? (<div className="h-full flex items-center justify-center border border-dashed border-slate-100 dark:border-slate-800/50 rounded-lg bg-slate-50/20 dark:bg-slate-950/20 text-center"><p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">Caixa Vazio</p></div>) : (currentMonthIncomes.map(income => (<div key={income.id} className="group p-3 bg-slate-50/40 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-lg transition-all flex flex-col gap-3"><div className="flex items-center gap-2"><div className="flex-grow flex flex-col gap-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Fonte</label><input type="text" placeholder="..." value={income.source} onChange={(e) => updateIncome(income.id, 'source', e.target.value)} className="theme-transition w-full h-[24px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 rounded font-black text-[9px] outline-none text-slate-900 dark:text-white" /></div><div className="w-[100px] flex flex-col gap-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor</label><input type="number" placeholder="0,00" value={income.value || ''} onChange={(e) => updateIncome(income.id, 'value', parseFloat(e.target.value) || 0)} className="theme-transition w-full h-[24px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 rounded font-black text-[9px] text-emerald-600 text-right outline-none" /></div><div className="w-[45px] flex flex-col gap-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">Dia</label><input type="number" min="1" max="31" value={income.receivedDay ?? ''} onChange={(e) => updateIncome(income.id, 'receivedDay', e.target.value ? parseInt(e.target.value) : undefined)} className="theme-transition w-full h-[24px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-1 rounded font-black text-[9px] text-slate-500 text-center outline-none" /></div><button onClick={() => removeIncome(income.id)} className="p-1 mt-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button></div></div>)))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 min-h-0 overflow-hidden">
          <div className={`${isStrategyCollapsed ? 'flex-grow' : 'flex-1'} flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-0 transition-all duration-500`}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3"><div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-500 rounded-lg"><ArrowDownCircle className="w-4 h-4" /></div><h3 className="text-[12px] font-black text-slate-950 dark:text-white uppercase tracking-tight">Execução Operacional</h3></div>
                
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 ml-4">
                  <button onClick={() => setActiveTab('mes')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'mes' ? 'bg-[#0F172A] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Dívidas do Mês</button>
                  <button onClick={() => setActiveTab('atrasadas')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'atrasadas' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Não Pagas <span className="w-4 h-4 rounded-full bg-rose-500/20 text-[8px] flex items-center justify-center border border-rose-500/30">{Object.values(allProfiles || {}).flatMap((p: YearProfile) => (p.monthlyEntries || []).filter(e => (e.year < activeYear || (e.year === activeYear && e.month < activeMonth)) && e.status === 'Não Pago')).length}</span></button>
                  <button onClick={() => setActiveTab('geral')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'geral' ? 'bg-[#0F172A] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Geral</button>
                </div>
              </div>

              <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/5 shadow-inner">
                {[['Pend', 'Pendente', 'slate-400'], ['Plan', 'Planejado', 'sky-400'], ['Pago', 'Pago', 'emerald-400'], ['Não', 'Não Pago', 'rose-400']].map(([lbl, st, color]) => (
                  <div key={lbl} className={`flex items-center px-2 border-r border-white/5 last:border-none gap-1.5 min-w-[75px] justify-center`}><span className={`text-[9px] font-black text-${color} uppercase tracking-widest`}>{lbl}</span><span className="text-[10px] font-black text-slate-900 dark:text-white tabular-nums">{statusSummary[st as keyof typeof statusSummary] || 0}</span></div>
                ))}
              </div>
            </div>

            {showFilters && (
              <div className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 p-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                  <div className="flex items-center gap-2">
                    <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Filtragem Operacional</span>
                  </div>
                  <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95">
                    <RotateCcw className="w-3 h-3" /> Limpar Tudo
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">01. Buscar Item</label>
                    <div className="relative group">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 transition-colors group-focus-within:text-sky-500" />
                      <input 
                        type="text" 
                        placeholder="Nome do lançamento..." 
                        value={filterSearch} 
                        onChange={(e) => setFilterSearch(e.target.value)} 
                        className="w-full h-9 pl-9 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-black text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">02. Categoria</label>
                    <div className="grid grid-cols-2 gap-1">
                      {categoriesOptions.map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => toggleSetFilter(filterCategories, setFilterCategories, cat)}
                          className={`h-7 px-2 rounded-md text-[7px] font-black uppercase transition-all border ${filterCategories.has(cat) ? 'bg-sky-600 text-white border-transparent shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}
                        >
                          {cat.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">03. Sub-Categoria (Tags)</label>
                    <div className="max-h-24 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                      {subCategoriesList.length === 0 ? (
                        <span className="text-[8px] text-slate-400 italic">Sem tags registradas</span>
                      ) : subCategoriesList.map(tag => (
                        <button 
                          key={tag} 
                          onClick={() => toggleSetFilter(filterSubCategories, setFilterSubCategories, tag)}
                          className={`h-7 px-2 rounded-md text-[7px] font-black uppercase transition-all border flex items-center gap-2 ${filterSubCategories.has(tag) ? 'bg-sky-600 text-white border-transparent shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}
                        >
                          <Tag className="w-2.5 h-2.5 opacity-60" /> {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">04. Status</label>
                    <div className="grid grid-cols-2 gap-1">
                      {statusOptions.map(st => (
                        <button 
                          key={st} 
                          onClick={() => toggleSetFilter(filterStatus, setFilterStatus, st)}
                          className={`h-7 px-2 rounded-md text-[7px] font-black uppercase transition-all border ${filterStatus.has(st) ? 'bg-sky-600 text-white border-transparent shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">05. Pontualidade</label>
                    <div className="grid grid-cols-1 gap-1">
                      {punctualityOptions.map(p => (
                        <button 
                          key={p} 
                          onClick={() => toggleSetFilter(filterPunctuality, setFilterPunctuality, p)}
                          className={`h-7 px-2 rounded-md text-[7px] font-black uppercase transition-all border flex items-center justify-center gap-2 ${filterPunctuality.has(p) ? 'bg-sky-600 text-white border-transparent shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}
                        >
                          {p === 'PONTUAL' && <ShieldCheck className="w-2.5 h-2.5" />}
                          {p === 'ATRASADO' && <Flame className="w-2.5 h-2.5" />}
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-grow flex flex-col min-h-0">
              <div className={`grid ${auditGridCols} gap-2 px-4 py-2.5 bg-slate-900 dark:bg-[#0A1022] text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 sticky top-0 z-10 items-center select-none`}>
                {['status', 'order', 'debtType', 'item', 'category', 'subCategory', 'installments', 'estimatedValue', 'dueDate', 'paymentDate', 'PONTUALIDADE', 'hasOverride', 'observation'].map(k => {
                  let label = '';
                  switch(k) {
                    case 'status': label = 'STATUS'; break;
                    case 'order': label = 'ORDEM'; break;
                    case 'debtType': label = 'TIPO'; break;
                    case 'item': label = 'ITEM'; break;
                    case 'category': label = 'CATEGORIA'; break;
                    case 'subCategory': label = 'TAG'; break;
                    case 'installments': label = 'PARCELA'; break;
                    case 'estimatedValue': label = 'VALOR'; break;
                    case 'dueDate': label = 'VENCIMENTO'; break;
                    case 'paymentDate': label = 'PAGAMENTO'; break;
                    case 'PONTUALIDADE': label = 'PONTUALIDADE'; break;
                    case 'hasOverride': label = 'AJUSTE'; break;
                    case 'observation': label = 'OBSERVAÇÃO'; break;
                    default: label = k.toUpperCase();
                  }
                  return (<button key={k} onClick={() => k !== 'PONTUALIDADE' && handleSort(k as SortKey)} className={`group flex items-center gap-1.5 py-1 px-1 hover:bg-white/5 rounded transition-colors justify-center whitespace-nowrap`}>{label} {k !== 'PONTUALIDADE' && renderSortIcon(k as SortKey)}</button>);
                })}
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar overflow-x-visible">
                {operationalEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                    <Search className="w-10 h-10 text-slate-400" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Nenhum registro operacional nesta visão</p>
                  </div>
                ) : operationalEntries.map((entry) => {
                  const tagStyles = entry.subCategoryColor || getCategoryStyles(entry.category);
                  const st = getStatusConfig(entry.status, entry.id);
                  const termometro = getPontualidadeStatus(entry);
                  const baseTagStyle = "flex items-center justify-center px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-[#0A1022] border border-slate-100 dark:border-slate-800 shadow-sm w-full h-[24px]";

                  return (
                    <div key={entry.id} className={`grid ${auditGridCols} gap-2 px-4 py-1.5 items-center border-b border-slate-100 dark:border-slate-800 transition-all ${st.rowClass} relative`}>
                      <div className="flex justify-center"><button onClick={() => togglePaymentStatus(entry)} className={`w-6 h-6 rounded flex items-center justify-center transition-all ${st.bgColor} text-white shadow-sm`}>{st.icon}</button></div>
                      <div className="flex justify-center"><OrdemSelector value={entry.order || 5} onChange={(newOrder) => updateEntry(entry.id, { order: newOrder })} /></div>
                      <div className="flex justify-center"><span className={`text-[9px] font-black px-1.5 py-1 rounded-md border text-center w-full truncate dark:bg-[#0A1022] dark:border-slate-800 ${entry.debtType === 'PASSIVOS' ? 'bg-violet-500/10 text-violet-600 border-violet-500/20' : entry.debtType === 'GASTOS VARIÁVEIS' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-sky-500/10 text-sky-600 border-sky-500/20'}`}>{getDebtTypeLabel(entry.debtType)}</span></div>
                      
                      <div className="flex justify-center overflow-hidden">
                        <div className={`${baseTagStyle} max-w-[178px] truncate`}>
                          <span className={`text-[9px] font-black uppercase tracking-tight truncate ${st.textClass}`}>{entry.item}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-center"><div className={`px-1.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest truncate ${getCategoryStyles(entry.category)} dark:bg-[#0A1022] dark:border-slate-800 w-full max-w-[178px] text-center h-[24px] flex items-center justify-center`}>{entry.category}</div></div>
                      <div className="flex justify-center"><div className={`px-1.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest truncate ${tagStyles} dark:bg-[#0A1022] dark:border-slate-800 w-full max-w-[178px] text-center h-[24px] flex items-center justify-center`}>{entry.subCategory || '—'}</div></div>
                      
                      <div className="flex justify-center">
                        <div className={baseTagStyle}>
                          <span className="text-[9px] font-black uppercase text-slate-500 tabular-nums">{entry.installments}</span>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div className={`${baseTagStyle} ${entry.hasOverride ? 'border-amber-500/30' : ''}`}>
                          <span className={`text-[9px] font-black uppercase tabular-nums ${entry.hasOverride ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                            {formatCurrency(entry.estimatedValue)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div className={`${baseTagStyle} bg-slate-900 dark:bg-[#0A1022]`}>
                          <span className="text-[9px] font-black uppercase text-slate-400 tabular-nums">
                            {formatDate(entry.dueDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-center relative"><CustomDatePicker value={entry.paymentDate} onChange={(date) => updateEntry(entry.id, { paymentDate: date, status: date ? 'Pago' : entry.status, paidValue: date ? entry.estimatedValue : 0 })} onToggle={(isOpen) => setOpenDatePickerId(isOpen ? entry.id : null)} /></div>
                      <div className="flex justify-center">{termometro && (<div className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-[#0A1022] border border-slate-100 dark:border-slate-800 shadow-sm ${termometro.color} w-full max-w-[178px] h-[24px] justify-center`}><termometro.icon className="w-3.5 h-3.5" /><span className="text-[8px] font-black uppercase whitespace-nowrap">{termometro.label}</span></div>)}</div>
                      <div className="flex justify-center gap-1">
                        <button onClick={() => setPersonalizingEntry(entry)} className={`w-6 h-6 rounded border transition-all flex items-center justify-center ${entry.hasOverride ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800/50 text-slate-400'}`} title="Personalizar"><History className="w-4 h-4" /></button>
                      </div>
                      <div className="flex justify-center h-full items-center gap-1 w-full px-1">
                        <input type="text" placeholder="..." value={entry.observation || ''} onChange={(e) => updateEntry(entry.id, { observation: e.target.value })} className="flex-grow h-[24px] bg-slate-50 dark:bg-[#0A1022] border border-slate-100 dark:border-slate-800 px-1.5 rounded-md text-[9px] font-black text-slate-500 outline-none truncate shadow-sm focus:border-sky-500/50" />
                        <button onClick={() => setEditingObservationId(entry.id)} className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-500/30 transition-all shrink-0"><Maximize2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={`${isStrategyCollapsed ? 'flex-none' : 'flex-1'} flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-0 transition-all duration-500`}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20"><TrendingUp className="w-4 h-4" /></div>
                <div className="flex flex-col">
                  <h3 className="text-[12px] font-black text-slate-950 dark:text-white uppercase tracking-tight">GASTOS VARIÁVEIS</h3>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Painel de Monitoramento Flexível</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isStrategyCollapsed && (
                  <button 
                    onClick={() => setIsAddVariableModalOpen(true)}
                    className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:scale-105 transition-all shadow-md flex items-center justify-center"
                    title="Adicionar Gasto Variável"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setIsStrategyCollapsed(!isStrategyCollapsed)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all">
                  {isStrategyCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {!isStrategyCollapsed && (
              <div className="flex-grow flex flex-col min-h-0">
                <div className={`grid ${auditGridCols} gap-2 px-4 py-2.5 bg-slate-900 dark:bg-[#0A1022] text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 sticky top-0 z-10 items-center select-none`}>
                  {['status', '#', 'debtType', 'item', 'category', 'subCategory', 'installments', 'estimatedValue', 'dueDate', 'paymentDate', 'PONTUALIDADE', 'hasOverride', 'observation'].map(k => {
                    let label = '';
                    switch(k) {
                      case 'status': label = 'STATUS'; break;
                      case '#': label = '#'; break;
                      case 'debtType': label = 'TIPO'; break;
                      case 'item': label = 'ITEM'; break;
                      case 'category': label = 'CATEGORIA'; break;
                      case 'subCategory': label = 'TAG'; break;
                      case 'installments': label = 'PARCELA'; break;
                      case 'estimatedValue': label = 'VALOR'; break;
                      case 'dueDate': label = 'VENCIMENTO'; break;
                      case 'paymentDate': label = 'PAGAMENTO'; break;
                      case 'PONTUALIDADE': label = 'PONTUALIDADE'; break;
                      case 'hasOverride': label = 'AJUSTE'; break;
                      case 'observation': label = 'OBSERVAÇÃO'; break;
                      default: label = k.toUpperCase();
                    }
                    return (<button key={k} onClick={() => !['PONTUALIDADE', '#'].includes(k) && handleSort(k as SortKey)} className={`group flex items-center gap-1.5 py-1 px-1 hover:bg-white/5 rounded transition-colors justify-center whitespace-nowrap`}>{label} {!['PONTUALIDADE', '#'].includes(k) && renderSortIcon(k as SortKey)}</button>);
                  })}
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar overflow-x-visible">
                  {variableExpensesEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                      <TrendingUp className="w-10 h-10 text-slate-400" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Nenhum gasto variável identificado</p>
                    </div>
                  ) : variableExpensesEntries.map((entry, index) => {
                    const tagStyles = entry.subCategoryColor || getCategoryStyles(entry.category);
                    const st = getStatusConfig(entry.status, entry.id);
                    const termometro = getPontualidadeStatus(entry);
                    const baseTagStyle = "flex items-center justify-center px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-[#0A1022] border border-slate-100 dark:border-slate-800 shadow-sm w-full h-[24px]";

                    return (
                      <div key={entry.id} className={`grid ${auditGridCols} gap-2 px-4 py-1.5 items-center border-b border-slate-100 dark:border-slate-800 transition-all ${st.rowClass} relative`}>
                        <div className="flex justify-center">
                          {/* BOTÃO DE STATUS BLOQUEADO PARA GASTOS VARIÁVEIS */}
                          <button 
                            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${st.bgColor} text-white shadow-sm cursor-default opacity-100`}
                            title="Itens variáveis são registrados automaticamente como pagos"
                          >
                            {st.icon}
                          </button>
                        </div>
                        {/* COLUNA ORDEM TRANSFORMADA EM CONTADOR (#) COM ESTILO PADRÃO ORDEM 5 */}
                        <div className="flex justify-center">
                          <div className="w-10 h-[24px] rounded-lg border flex items-center justify-center transition-all shadow-sm bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 dark:border-slate-800">
                            <span className="text-[9px] font-black">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex justify-center"><span className={`text-[9px] font-black px-1.5 py-1 rounded-md border text-center w-full truncate dark:bg-[#0A1022] dark:border-slate-800 bg-amber-500/10 text-amber-600 border-amber-500/20`}>{getDebtTypeLabel(entry.debtType)}</span></div>
                        
                        <div className="flex justify-center overflow-hidden">
                          <div className={`${baseTagStyle} max-w-[178px] truncate`}>
                            <span className={`text-[9px] font-black uppercase tracking-tight truncate ${st.textClass}`}>{entry.item}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-center"><div className={`px-1.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest truncate ${getCategoryStyles(entry.category)} dark:bg-[#0A1022] dark:border-slate-800 w-full max-w-[178px] text-center h-[24px] flex items-center justify-center`}>{entry.category}</div></div>
                        <div className="flex justify-center"><div className={`px-1.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest truncate ${tagStyles} dark:bg-[#0A1022] dark:border-slate-800 w-full max-w-[178px] text-center h-[24px] flex items-center justify-center`}>{entry.subCategory || '—'}</div></div>
                        
                        <div className="flex justify-center">
                          <div className={baseTagStyle}>
                            <span className="text-[9px] font-black uppercase text-slate-500 tabular-nums">{entry.installments}</span>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <div className={`${baseTagStyle} ${entry.hasOverride ? 'border-amber-500/30' : ''}`}>
                            <span className={`text-[9px] font-black uppercase tabular-nums ${entry.hasOverride ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                              {formatCurrency(entry.estimatedValue)}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <div className={`${baseTagStyle} bg-slate-900 dark:bg-[#0A1022]`}>
                            <span className="text-[9px] font-black uppercase text-slate-400 tabular-nums">
                              {formatDate(entry.dueDate)}
                            </span>
                          </div>
                        </div>

                        {/* DATA DE PAGAMENTO BLOQUEADA PARA VARIÁVEIS */}
                        <div className="flex justify-center relative">
                          <div className={`h-[24px] px-3 rounded-md border text-[9px] font-black flex items-center gap-2 transition-all w-full justify-center bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm cursor-default`}>
                            <CalendarDays className="w-3.5 h-3.5" /> 
                            {entry.paymentDate ? entry.paymentDate.split('-').reverse().slice(0, 2).join('/') : '--/--'}
                          </div>
                        </div>
                        <div className="flex justify-center">{termometro && (<div className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-[#0A1022] border border-slate-100 dark:border-slate-800 shadow-sm ${termometro.color} w-full max-w-[178px] h-[24px] justify-center`}><termometro.icon className="w-3.5 h-3.5" /><span className="text-[8px] font-black uppercase whitespace-nowrap">{termometro.label}</span></div>)}</div>
                        <div className="flex justify-center gap-1">
                          <button onClick={() => setPersonalizingEntry(entry)} className={`w-6 h-6 rounded border transition-all flex items-center justify-center ${entry.hasOverride ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800/50 text-slate-400'}`} title="Personalizar"><History className="w-4 h-4" /></button>
                        </div>
                        <div className="flex justify-center h-full items-center gap-1 w-full px-1">
                          <input type="text" placeholder="..." value={entry.observation || ''} onChange={(e) => updateEntry(entry.id, { observation: e.target.value })} className="flex-grow h-[24px] bg-slate-50 dark:bg-[#0A1022] border border-slate-100 dark:border-slate-800 px-1.5 rounded-md text-[9px] font-black text-slate-500 outline-none truncate shadow-sm focus:border-sky-500/50" />
                          <button onClick={() => setEditingObservationId(entry.id)} className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-500/30 transition-all shrink-0"><Maximize2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AddVariableModal = ({ onClose, onSave, activeMonth, activeYear }: any) => {
  const [item, setItem] = useState('');
  const [value, setValue] = useState(0);
  const [category, setCategory] = useState<CategoryType>('QUALIDADE DE VIDA');
  const [subCategory, setSubCategory] = useState('CONSUMO');
  const [dueDate, setDueDate] = useState(`${activeYear}-${String(activeMonth).padStart(2, '0')}-10`);
  const [observation, setObservation] = useState('');

  const formatCurrencyInput = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return (parseInt(digits) / 100) || 0;
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#020617] w-full max-w-lg rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#020617]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg"><Plus className="w-5 h-5" /></div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">Cadastrar Gasto Variável</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrada Direta no Fluxo Mensal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição do Item</label>
              <input type="text" placeholder="EX: LANCHE, TAXI, EXTRA..." value={item} onChange={(e) => setItem(e.target.value.toUpperCase())} className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black outline-none focus:border-sky-500 transition-all text-slate-900 dark:text-white" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor Estimado</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00" 
                    value={value || ''} 
                    onChange={(e) => setValue(parseFloat(e.target.value) || 0)} 
                    className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black outline-none focus:border-sky-500 transition-all text-emerald-600 tabular-nums" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Data Vencimento</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black outline-none focus:border-sky-500 transition-all text-slate-900 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Categoria</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as CategoryType)} className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase outline-none">
                  <option value="ESSENCIAIS">ESSENCIAIS</option>
                  <option value="QUALIDADE DE VIDA">QUALIDADE DE VIDA</option>
                  <option value="FUTURO">FUTURO</option>
                  <option value="DÍVIDAS">DÍVIDAS</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tag (Sub-Cat)</label>
                <input type="text" placeholder="TAG..." value={subCategory} onChange={(e) => setSubCategory(e.target.value.toUpperCase())} className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Anotação Adicional</label>
              <textarea placeholder="..." value={observation} onChange={(e) => setObservation(e.target.value)} className="w-full h-24 p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-medium outline-none focus:border-sky-500 transition-all resize-none shadow-inner" />
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button onClick={onClose} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-colors">Descartar</button>
          <button 
            disabled={!item || value <= 0}
            onClick={() => onSave({ item, value, category, subCategory, dueDate, observation })}
            className="px-12 py-4 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-30"
          >
            <Check className="w-4 h-4" /> Finalizar Cadastro
          </button>
        </div>
      </div>
    </div>
  );
};

const ObservationModal = ({ entry, onClose, onSave }: { entry: MonthlyEntry, onClose: () => void, onSave: (text: string) => void }) => {
  const [text, setText] = useState(entry.observation || '');
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#020617] w-full max-w-xl rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#020617]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-600 text-white rounded-2xl shadow-lg"><FileText className="w-5 h-5" /></div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">Notas de Operação</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[300px]">{entry.item}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Observação Detalhada</label>
            <textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite aqui anotações importantes sobre este lançamento..."
              autoFocus
              className="w-full h-48 p-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-[9px] font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500 transition-all resize-none shadow-inner leading-relaxed"
            />
          </div>
          <div className="flex items-center gap-3 p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl">
            <Info className="w-4 h-4 text-sky-500 shrink-0" />
            <p className="text-[9px] font-black text-sky-600/80 uppercase leading-snug">As notas expansíveis permitem o registro de detalhes operacionais que não cabem na visualização compacta da grade.</p>
          </div>
        </div>
        <div className="p-8 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-colors">Cancelar</button>
          <button 
            onClick={() => onSave(text)}
            className="px-12 py-4 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4"
          >
            <Check className="w-5 h-5" /> Salvar Nota
          </button>
        </div>
      </div>
    </div>
  );
};

const PersonalizationModal = ({ item, onClose, onSave, onCancelItem }: any) => {
  const [value, setValue] = useState(item.estimatedValue);
  const [dueDate, setDueDate] = useState(item.dueDate);
  const [scope, setScope] = useState<'one-time' | 'permanent'>('one-time');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelConfirmationText, setCancelConfirmationText] = useState('');

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#0F172A] dark:bg-white rounded-2xl shadow-lg">
              <SlidersHorizontal className="w-6 h-6 text-white dark:text-[#0F172A]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">Personalizar</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[200px]">{item.emoji} {item.item}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                <DollarSign className="w-3.5 h-3.5" /> Valor Operacional
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-300 dark:text-slate-600 transition-colors group-focus-within:text-sky-500">R$</div>
                <input 
                  type="number" 
                  value={value} 
                  onChange={e => setValue(parseFloat(e.target.value) || 0)} 
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-base font-black text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-all tabular-nums shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                <CalendarRange className="w-3.5 h-3.5" /> Data de Vencimento
              </label>
              <div className="relative group">
                <ModalDatePicker value={dueDate} onChange={setDueDate} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              <Layers className="w-3.5 h-3.5" /> Abrangência da Alteração
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setScope('one-time')}
                className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${scope === 'one-time' ? 'bg-sky-500/10 border-sky-500 shadow-lg shadow-sky-500/10' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'}`}
              >
                <div className={`p-2 rounded-lg w-fit ${scope === 'one-time' ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-[10px] font-black uppercase block ${scope === 'one-time' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500'}`}>Pontual</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase leading-tight">Somente este mês</span>
                </div>
              </button>

              <button 
                onClick={() => setScope('permanent')}
                className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${scope === 'permanent' ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'}`}
              >
                <div className={`p-2 rounded-lg w-fit ${scope === 'permanent' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-[10px] font-black uppercase block ${scope === 'permanent' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>Permanente</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase leading-tight">Daqui em diante</span>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[9px] font-black text-amber-600/80 uppercase leading-snug">
              {scope === 'one-time' 
                ? "Alterações pontuais criam uma exceção no fluxo sem mudar o valor registrado no inventário base." 
                : "Alterações permanentes atualizarão o valor base no seu registro geral para todos os meses futuros."}
            </p>
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
          <button 
            onClick={() => onSave([{ field: 'value', newValue: value, scope }, { field: 'dueDay', newValue: dueDate, scope }])} 
            className="w-full h-14 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Check className="w-5 h-5" /> Aplicar Alterações
          </button>
          
          <div className="flex flex-col gap-3 mt-1">
            {showCancelConfirm && (
              <div className="space-y-3 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <p className="text-[8px] font-black text-rose-600/90 uppercase leading-tight">O cancelamento é irreversível. Digite "CANCELAR" para confirmar.</p>
                </div>
                <input 
                  type="text" 
                  value={cancelConfirmationText} 
                  onChange={(e) => setCancelConfirmationText(e.target.value.toUpperCase())}
                  placeholder="CHAVE DE SEGURANÇA..."
                  autoFocus
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border-2 border-rose-500/30 rounded-xl text-center text-[10px] font-black text-rose-600 outline-none focus:border-rose-500 transition-all placeholder:text-rose-200"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={showCancelConfirm ? (cancelConfirmationText === 'CANCELAR' ? onCancelItem : undefined) : () => setShowCancelConfirm(true)} 
                disabled={showCancelConfirm && cancelConfirmationText !== 'CANCELAR'}
                className={`h-12 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${showCancelConfirm ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 disabled:opacity-20 disabled:grayscale' : 'border-2 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
              >
                {showCancelConfirm ? <><ShieldAlert className="w-3.5 h-3.5" /> EXCLUIR AGORA</> : <><Ban className="w-3.5 h-3.5" /> Cancelar Item</>}
              </button>
              <button 
                onClick={showCancelConfirm ? () => { setShowCancelConfirm(false); setCancelConfirmationText(''); } : onClose} 
                className="h-12 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center"
              >
                {showCancelConfirm ? 'DESISTIR' : 'Voltar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ModalDatePicker = ({ value, onChange }: { value: string, onChange: (date: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value + 'T00:00:00') : new Date());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const { blanks, days } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      blanks: Array(firstDay.getDay()).fill(null),
      days: Array.from({ length: lastDay.getDate() }, (_, i) => i + 1)
    };
  }, [viewDate]);

  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-full h-14 px-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between transition-all group hover:border-sky-500/50 ${isOpen ? 'ring-2 ring-sky-500/20 border-sky-500' : ''}`}
      >
        <div className="flex items-center gap-3">
          <CalendarDays className={`w-5 h-5 transition-colors ${isOpen ? 'text-sky-500' : 'text-slate-400 group-hover:text-sky-500'}`} />
          <span className={`text-base font-black tabular-nums ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
            {value ? value.split('-').reverse().join('/') : 'Selecionar Data'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 z-[9999] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-[0.2em]">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(d => <div key={d} className="text-center text-[9px] font-black text-slate-400 py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {blanks.map((_, i) => <div key={`b-${i}`} />)}
            {days.map(day => {
              const dStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === dStr;
              const isToday = new Date().toISOString().split('T')[0] === dStr;
              return (
                <button 
                  key={day} 
                  type="button"
                  onClick={() => handleSelectDay(day)} 
                  className={`h-9 w-9 text-[9px] font-black rounded-xl transition-all flex items-center justify-center
                    ${isSelected ? 'bg-sky-500 text-white shadow-lg scale-105 z-10' : isToday ? 'text-sky-500 border border-sky-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <button type="button" onClick={handleToday} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-sky-500 hover:bg-sky-500/10 rounded-xl transition-all">Hoje</button>
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

const OrdemSelector = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getOrderStyle = (v: number) => {
    switch (v) {
      case 1: return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/10';
      case 2: return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/10';
      case 3: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-orange-500/20 dark:border-orange-500/10';
      case 4: return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 dark:border-sky-500/10';
      case 5: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 dark:border-slate-800';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 dark:border-slate-800';
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-[24px] rounded-lg border flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm ${getOrderStyle(value)}`}
      >
        <span className="text-[9px] font-black">{value}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-[5000] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-1 grid grid-cols-1 gap-1 animate-in fade-in zoom-in-95 duration-200 min-w-[44px]">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => { onChange(num); setIsOpen(false); }}
              className={`w-full h-8 px-3 rounded-lg border font-black text-[9px] transition-all hover:brightness-95 flex items-center justify-center ${getOrderStyle(num)} ${value === num ? 'ring-2 ring-slate-900 dark:ring-white scale-90' : 'opacity-80 hover:opacity-100'}`}
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomDatePicker = ({ value, onChange, onToggle }: { value: string, onChange: (date: string) => void, onToggle?: (open: boolean) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value + 'T00:00:00') : new Date());
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onToggle?.(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const handleOpen = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + rect.width / 2
      });
    }
    setIsOpen(true);
    onToggle?.(true);
  };

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const { blanks, days } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      blanks: Array(firstDay.getDay()).fill(null),
      days: Array.from({ length: lastDay.getDate() }, (_, i) => i + 1)
    };
  }, [viewDate]);

  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
    onToggle?.(false);
  };

  const handleToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
    onToggle?.(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    onToggle?.(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={handleOpen} 
        className={`h-[24px] px-3 rounded-md border text-[9px] font-black flex items-center gap-2 transition-all hover:scale-105 active:scale-95 w-full justify-center ${value ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm' : 'bg-slate-50 dark:bg-[#0A1022] border-slate-100 dark:border-slate-800 text-slate-400'}`}
      >
        <CalendarDays className="w-3.5 h-3.5" /> 
        {value ? value.split('-').reverse().slice(0, 2).join('/') : '--/--'}
      </button>

      {isOpen && (
        <div 
          className="fixed z-[9999] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 min-w-[260px]"
          style={{ 
            top: `${coords.top - window.scrollY}px`, 
            left: `${coords.left - window.scrollX}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><ChevronRight className="w-4 h-4" /></button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(d => <div key={d} className="text-center text-[9px] font-black text-slate-400 py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {blanks.map((_, i) => <div key={`b-${i}`} />)}
            {days.map(day => {
              const dStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === dStr;
              const isToday = new Date().toISOString().split('T')[0] === dStr;
              return (
                <button 
                  key={day} 
                  type="button"
                  onClick={() => handleSelectDay(day)} 
                  className={`h-7 w-7 text-[10px] font-black rounded-lg transition-all flex items-center justify-center
                    ${isSelected ? 'bg-sky-500 text-white shadow-md scale-110 z-10' : isToday ? 'text-sky-500 border border-sky-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
            <button onClick={handleClear} className="py-2 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">Limpar</button>
            <button onClick={handleToday} className="py-2 text-[9px] font-black uppercase tracking-widest text-sky-500 hover:bg-sky-500/10 rounded-lg transition-all">Hoje</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fluxo;
