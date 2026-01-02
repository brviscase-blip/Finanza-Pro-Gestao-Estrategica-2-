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
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
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
        else if (isSelectionModalOpen) setIsSelectionModalOpen(false);
        else if (editingNodeId) setEditingNodeId(null);
      }
    };
    window.addEventListener('keydown', handleGlobalEsc);
    return () => window.removeEventListener('keydown', handleGlobalEsc);
  }, [personalizingEntry, isSelectionModalOpen, editingNodeId]);

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

  const currentMonthIncomes = useMemo(() => (incomeEntries || []).filter(i => i.year === activeYear && i.month === activeMonth), [incomeEntries, activeYear, activeMonth]);
  const currentMonthStrategies = useMemo(() => (strategyBlocks || []).filter(s => s.year === activeYear && s.month === activeMonth).sort((a, b) => a.order - b.order), [strategyBlocks, activeYear, activeMonth]);

  const subCategoriesList = useMemo(() => {
    const tags = new Set<string>();
    currentMonthEntries.forEach(e => {
      if (e.subCategory && e.subCategory !== '-') tags.add(e.subCategory);
    });
    return Array.from(tags).sort();
  }, [currentMonthEntries]);

  const totals = useMemo(() => {
    const inflow = currentMonthIncomes.reduce((acc, curr) => acc + curr.value, 0);
    const outflowPlanned = currentMonthEntries.reduce((acc, curr) => acc + curr.estimatedValue, 0);
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
    const activeNode = (strategyBlocks || []).find(b => b.entryId === entry.id);
    if (activeNode && activeNode.status !== 'completed') return;
    
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

  const handleReturnToOrigin = (entry: MonthlyEntry) => {
    const originalMonth = entry.competenceMonth ?? entry.month;
    const originalYear = entry.competenceYear ?? entry.year;
    updateEntry(entry.id, { month: originalMonth, year: originalYear });
  };

  const addStrategyBlock = (entry: MonthlyEntry) => {
    const newBlock: StrategyBlock = { id: crypto.randomUUID(), entryId: entry.id, itemTitle: entry.item, title: `ESTRATÉGIA: ${entry.item.toUpperCase()}`, content: '', mode: 'text', status: 'draft', month: activeMonth, year: activeYear, order: (strategyBlocks || []).length, color: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
    setStrategyBlocks((prev: StrategyBlock[]) => [...(prev || []), newBlock]);
    setIsSelectionModalOpen(false);
  };

  const updateStrategyBlock = (id: string, updates: Partial<StrategyBlock>) => setStrategyBlocks((prev: StrategyBlock[]) => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  const removeStrategyBlock = (id: string) => setStrategyBlocks((prev: StrategyBlock[]) => prev.filter(s => s.id !== id));

  const getCategoryStyles = (category: string) => {
    switch (category.toUpperCase()) {
      case 'ESSENCIAIS': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'QUALIDADE DE VIDA': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'FUTURO': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'DÍVIDAS': return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getStatusConfig = (status: PaymentStatus, entryId: string) => {
    const node = (strategyBlocks || []).find(b => b.entryId === entryId);
    const isLocked = node && node.status !== 'completed';
    switch(status) {
      case 'Pago': return { icon: <ShieldCheck className="w-4 h-4" />, bgColor: 'bg-emerald-500', rowClass: 'bg-emerald-500/[0.05] dark:bg-emerald-500/[0.03]', textClass: 'text-emerald-700 dark:text-emerald-400 line-through opacity-60' };
      case 'Não Pago': return { icon: <AlertCircle className="w-4 h-4" />, bgColor: 'bg-rose-500', rowClass: 'bg-rose-500/[0.05] dark:bg-rose-500/[0.03]', textClass: 'text-rose-600 dark:text-rose-400 italic' };
      case 'Planejado': return { icon: isLocked ? <Lock className="w-3.5 h-3.5" /> : <Calendar className="w-4 h-4" />, bgColor: isLocked ? 'bg-slate-400' : 'bg-sky-500', rowClass: 'bg-sky-500/[0.03] dark:bg-sky-500/[0.02]', textClass: 'text-slate-900 dark:text-white font-black' };
      default: return { icon: <Clock className="w-4 h-4" />, bgColor: 'bg-white dark:bg-slate-950', rowClass: '', textClass: 'text-slate-900 dark:text-white' };
    }
  };

  // Grade calibrada rigorosamente para as porcentagens solicitadas (Total 100%)
  const auditGridCols = "grid-cols-[5%_5%_10%_10%_10%_10%_5%_10%_5%_5%_10%_5%_10%]";

  const getDebtTypeLabel = (type?: DebtType) => {
    if (!type) return 'FIXA';
    if (type === 'DESPESAS FIXAS') return 'FIXA';
    if (type === 'GASTOS VARIÁVEIS') return 'VARIÁVEL';
    return type; // 'PASSIVOS'
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      {isSelectionModalOpen && <SelectionModal entries={currentMonthEntries.filter(e => e.status === 'Planejado' && !strategyBlocks.some(b => b.entryId === e.id))} onClose={() => setIsSelectionModalOpen(false)} onSelect={addStrategyBlock} />}
      {editingNodeId && <StrategyNodeEditor block={(strategyBlocks || []).find(b => b.id === editingNodeId)!} onClose={() => setEditingNodeId(null)} onSave={(updates: any) => { updateStrategyBlock(editingNodeId, updates); setEditingNodeId(null); }} />}
      {personalizingEntry && <PersonalizationModal item={personalizingEntry} onClose={() => setPersonalizingEntry(null)} onSave={handleSavePersonalization} onCancelItem={handleCancelItem} />}

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
              {(currentMonthIncomes || []).length === 0 ? (<div className="h-full flex items-center justify-center border border-dashed border-slate-100 dark:border-slate-800/50 rounded-lg bg-slate-50/20 dark:bg-slate-950/20 text-center"><p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">Caixa Vazio</p></div>) : (currentMonthIncomes.map(income => (<div key={income.id} className="group p-3 bg-slate-50/40 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-lg transition-all flex flex-col gap-3"><div className="flex items-center gap-2"><div className="flex-grow flex flex-col gap-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Fonte</label><input type="text" placeholder="..." value={income.source} onChange={(e) => updateIncome(income.id, 'source', e.target.value)} className="theme-transition w-full h-[28px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 rounded font-black text-[11px] outline-none text-slate-900 dark:text-white" /></div><div className="w-[100px] flex flex-col gap-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor</label><input type="number" placeholder="0,00" value={income.value || ''} onChange={(e) => updateIncome(income.id, 'value', parseFloat(e.target.value) || 0)} className="theme-transition w-full h-[28px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 rounded font-black text-[11px] text-emerald-600 text-right outline-none" /></div><div className="w-[45px] flex flex-col gap-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">Dia</label><input type="number" min="1" max="31" value={income.receivedDay ?? ''} onChange={(e) => updateIncome(income.id, 'receivedDay', e.target.value ? parseInt(e.target.value) : undefined)} className="theme-transition w-full h-[28px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-1 rounded font-black text-[11px] text-slate-500 text-center outline-none" /></div><button onClick={() => removeIncome(income.id)} className="p-1 mt-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button></div></div>)))}
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
                        className="w-full h-9 pl-9 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-all shadow-inner"
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
              <div className={`grid ${auditGridCols} gap-2 px-4 py-2.5 bg-slate-900 dark:bg-[#020617] text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 sticky top-0 z-10 items-center select-none`}>
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
                    case 'hasOverride': label = 'PERSONALIZAÇÃO'; break;
                    case 'observation': label = 'OBSERVAÇÃO'; break;
                    default: label = k.toUpperCase();
                  }
                  return (<button key={k} onClick={() => k !== 'PONTUALIDADE' && handleSort(k as SortKey)} className={`group flex items-center gap-1.5 py-1 px-1 hover:bg-white/5 rounded transition-colors justify-center whitespace-nowrap`}>{label} {k !== 'PONTUALIDADE' && renderSortIcon(k as SortKey)}</button>);
                })}
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar overflow-x-visible">
                {currentMonthEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                    <Search className="w-10 h-10 text-slate-400" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Nenhum registro encontrado</p>
                    {hasActiveFilters && <button onClick={clearFilters} className="text-[9px] font-black uppercase text-sky-500 hover:underline">Limpar filtros ativos</button>}
                  </div>
                ) : currentMonthEntries.map((entry, idx) => {
                  const tagStyles = entry.subCategoryColor || getCategoryStyles(entry.category);
                  const st = getStatusConfig(entry.status, entry.id);
                  const termometro = getPontualidadeStatus(entry);
                  const baseTagStyle = "flex items-center justify-center px-1.5 py-1 rounded-md bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 shadow-sm w-full h-[28px]";

                  return (
                    <div key={entry.id} className={`grid ${auditGridCols} gap-2 px-4 py-1.5 items-center border-b border-slate-100 dark:border-slate-800 transition-all ${st.rowClass} relative`}>
                      <div className="flex justify-center"><button onClick={() => togglePaymentStatus(entry)} className={`w-6 h-6 rounded flex items-center justify-center transition-all ${st.bgColor} text-white shadow-sm`}>{st.icon}</button></div>
                      <div className="flex justify-center"><OrdemSelector value={entry.order || 5} onChange={(newOrder) => updateEntry(entry.id, { order: newOrder })} /></div>
                      <div className="flex justify-center"><span className={`text-[8px] font-black px-1.5 py-1 rounded-md border text-center w-full truncate ${entry.debtType === 'PASSIVOS' ? 'bg-violet-500/10 text-violet-600 border-violet-500/20' : 'bg-sky-500/10 text-sky-600 border-sky-500/20'}`}>{getDebtTypeLabel(entry.debtType)}</span></div>
                      
                      <div className="flex justify-center overflow-hidden">
                        <div className={`${baseTagStyle} truncate`}>
                          <span className={`text-[10px] font-black uppercase tracking-tight truncate ${st.textClass}`}>{entry.item}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-center"><div className={`px-1.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest truncate ${getCategoryStyles(entry.category)} w-full text-center`}>{entry.category}</div></div>
                      <div className="flex justify-center"><div className={`px-1.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest truncate ${tagStyles} w-full text-center`}>{entry.subCategory || '—'}</div></div>
                      
                      <div className="flex justify-center">
                        <div className={baseTagStyle}>
                          <span className="text-[9px] font-black uppercase text-slate-500 tabular-nums">{entry.installments}</span>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div className={`${baseTagStyle} ${entry.hasOverride ? 'border-amber-500/30' : ''}`}>
                          <span className={`text-[10px] font-black uppercase tabular-nums ${entry.hasOverride ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                            {formatCurrency(entry.estimatedValue)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div className={`${baseTagStyle} bg-slate-900 dark:bg-slate-950`}>
                          <span className="text-[9px] font-black uppercase text-slate-400 tabular-nums">
                            {formatDate(entry.dueDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-center relative"><CustomDatePicker value={entry.paymentDate} onChange={(date) => updateEntry(entry.id, { paymentDate: date, status: date ? 'Pago' : entry.status, paidValue: date ? entry.estimatedValue : 0 })} onToggle={(isOpen) => setOpenDatePickerId(isOpen ? entry.id : null)} /></div>
                      <div className="flex justify-center">{termometro && (<div className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm ${termometro.color} w-full justify-center`}><termometro.icon className="w-3.5 h-3.5" /><span className="text-[8px] font-black uppercase whitespace-nowrap">{termometro.label}</span></div>)}</div>
                      <div className="flex justify-center gap-1">
                        <button onClick={() => setPersonalizingEntry(entry)} className={`p-1 rounded border transition-all ${entry.hasOverride ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800/50 text-slate-400'}`} title="Personalizar"><History className="w-3 h-3" /></button>
                      </div>
                      <div className="flex justify-center h-full items-center">
                        <input type="text" placeholder="..." value={entry.observation || ''} onChange={(e) => updateEntry(entry.id, { observation: e.target.value })} className="w-full h-[28px] bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 px-1.5 rounded-md text-[10px] font-black text-slate-500 outline-none truncate shadow-sm focus:border-sky-500/50" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={`${isStrategyCollapsed ? 'flex-none' : 'flex-1'} flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-0 transition-all duration-500`}>
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20"><Target className="w-4 h-4" /></div><div className="flex flex-col"><h3 className="text-[12px] font-black text-slate-950 dark:text-white uppercase tracking-tight">Ação Estratégica</h3><span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Centro de Modelagem Tática</span></div></div><div className="flex items-center gap-2">{!isStrategyCollapsed && (<button onClick={() => setIsSelectionModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"><Zap className="w-3.5 h-3.5 text-amber-400" /> Adicionar Nódulo</button>)}<button onClick={() => setIsStrategyCollapsed(!isStrategyCollapsed)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all">{isStrategyCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}</button></div></div>
            {!isStrategyCollapsed && (
              <div className="flex-grow overflow-x-auto custom-scrollbar p-6 bg-slate-50/20 dark:bg-slate-950/20 animate-in slide-in-from-bottom-4 duration-500"><div className="flex gap-6 h-full items-start">{(currentMonthStrategies || []).length === 0 ? (<div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/30 dark:bg-white/[0.01]"><div className="w-12 h-12 bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mb-4"><Lightbulb className="w-6 h-6" /></div><p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em] max-w-[200px] text-center">Nenhum nódulo tático no canvas</p></div>) : (currentMonthStrategies.map((block) => (<div key={block.id} className={`w-[300px] shrink-0 flex flex-col rounded-2xl border-2 transition-all shadow-xl h-full max-h-[320px] relative ${block.status === 'completed' ? 'border-emerald-500 ring-4 ring-emerald-500/10' : ''} ${block.color || 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>{block.status === 'completed' && <div className="absolute -top-3 -right-3 bg-emerald-500 text-white rounded-full p-1 shadow-lg z-20"><CheckCircle2 className="w-5 h-5" /></div>}<div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between shrink-0"><div className="flex flex-col gap-0.5"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Vínculo: {block.itemTitle}</span><input type="text" value={block.title} onChange={(e) => updateStrategyBlock(block.id, { title: e.target.value.toUpperCase() })} className="bg-transparent border-none text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest outline-none w-full" /></div><div className="flex items-center gap-1"><button onClick={() => setEditingNodeId(block.id)} className="p-1.5 text-slate-400 hover:text-sky-500 transition-colors"><Edit3 className="w-4 h-4" /></button><button onClick={() => removeStrategyBlock(block.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><Target className="w-4 h-4" /></button></div></div><div className="p-4 flex flex-col gap-3 flex-grow overflow-hidden"><div className="flex items-center gap-2"><div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${block.mode === 'table' ? 'bg-sky-500/10 text-sky-600' : block.mode === 'form' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-500/10 text-slate-600'}`}>{block.mode}</div><div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${block.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-600'}`}>{block.status}</div></div><div className="flex-grow flex-col bg-black/[0.02] dark:bg-white/[0.01] rounded-xl p-3 border border-black/5 dark:border-white/5"><div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 line-clamp-6">{block.content || 'Nenhuma descrição tática definida. Abra o editor para configurar o planejamento.'}</div></div></div><div className="px-4 py-3 bg-black/[0.01] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex gap-2 shrink-0">{['bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700', 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30', 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-500/30', 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/30'].map(c => (<button key={c} onClick={() => updateStrategyBlock(block.id, { color: c })} className={`w-4 h-4 rounded-full border shrink-0 transition-transform hover:scale-125 ${c} ${block.color === c ? 'ring-2 ring-slate-900 dark:ring-white ring-offset-4 ring-offset-slate-900' : ''}`} />))}</div></div>)))}</div></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SelectionModal = ({ entries, onClose, onSelect }: any) => (
  <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-6">
      <h3 className="text-sm font-black uppercase mb-4">Selecionar Item Tático</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {entries.map((e: any) => (
          <button key={e.id} onClick={() => onSelect(e)} className="w-full p-3 text-left border rounded-lg text-xs font-black uppercase hover:border-emerald-500 transition-all">{e.item}</button>
        ))}
        {entries.length === 0 && <p className="text-center py-4 text-xs text-slate-400">Nenhum item disponível.</p>}
      </div>
      <button onClick={onClose} className="w-full mt-4 py-3 text-xs font-black text-slate-400 uppercase">Fechar</button>
    </div>
  </div>
);

const StrategyNodeEditor = ({ block, onClose, onSave }: any) => {
  const [content, setContent] = useState(block.content);
  const [status, setStatus] = useState(block.status);
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 w-full max-lg rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4">
        <h3 className="text-sm font-black uppercase">Editor Tático: {block.itemTitle}</h3>
        <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full h-40 p-3 bg-slate-50 dark:bg-slate-950 border-2 rounded-xl text-xs outline-none focus:border-sky-500" placeholder="Plano de ação..." />
        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border-2 rounded-xl text-xs font-black">
          <option value="draft">Rascunho</option>
          <option value="completed">Concluído</option>
        </select>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-xs font-black text-slate-400">Cancelar</button>
          <button onClick={() => onSave({ content, status })} className="px-6 py-2 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] rounded-xl text-xs font-black">Salvar Mudanças</button>
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
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-[0.2em]">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><ChevronRight className="w-4 h-4" /></button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(d => <div key={d} className="text-center text-[10px] font-black text-slate-400 py-1">{d}</div>)}
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
                  className={`h-9 w-9 text-[11px] font-black rounded-xl transition-all flex items-center justify-center
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
      case 3: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/10';
      case 4: return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 dark:border-sky-500/10';
      case 5: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 dark:border-slate-800';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 dark:border-slate-800';
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-7 rounded-lg border flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm ${getOrderStyle(value)}`}
      >
        <span className="text-[11px] font-black">{value}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-[5000] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-1 grid grid-cols-1 gap-1 animate-in fade-in zoom-in-95 duration-200 min-w-[44px]">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => { onChange(num); setIsOpen(false); }}
              className={`w-full h-8 px-3 rounded-lg border font-black text-[11px] transition-all hover:brightness-95 flex items-center justify-center ${getOrderStyle(num)} ${value === num ? 'ring-2 ring-slate-900 dark:ring-white scale-90' : 'opacity-80 hover:opacity-100'}`}
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
        className={`h-[28px] px-3 rounded-md border text-[10px] font-black flex items-center gap-2 transition-all hover:scale-105 active:scale-95 w-full justify-center ${value ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 text-slate-400'}`}
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