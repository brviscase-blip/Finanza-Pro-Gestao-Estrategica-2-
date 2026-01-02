
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, Calendar, TrendingUp, ArrowUpCircle, ArrowDownCircle, Clock, Calculator, StickyNote, ChevronLeft, ChevronRight, ShieldCheck, Hash, FileText, Settings2, History, Check, X, Info, Zap, AlertCircle, Layers, Palette, ArrowUpDown, ArrowUp, ArrowDown, Target, Lightbulb, Map, ArrowRightLeft, Lock, Edit3, Save, Table, Layout, CheckCircle2, ChevronDown, Type, DollarSign, CalendarRange, CalendarDays, ChevronUp, PanelLeftClose, PanelLeftOpen, Maximize2, Minimize2, AlertTriangle, Ban, Flame, ShieldAlert, Percent, ListFilter, Undo2, SlidersHorizontal, CalendarCheck, Filter, RotateCcw, Search, Tag, ShoppingBag, Receipt } from 'lucide-react';
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

// Função para formatar entrada de texto como moeda BRL em tempo real
const formatCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const numberValue = parseInt(digits) / 100;
  if (isNaN(numberValue)) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(numberValue);
};

// Função para extrair o valor numérico puro da string formatada
const parseCurrencyInput = (formattedValue: string): number => {
  const digits = formattedValue.replace(/\D/g, '');
  return parseInt(digits) / 100 || 0;
};

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

  // Estados para o novo item diário
  const [dailyItemName, setDailyItemName] = useState('');
  const [dailyItemValueFormatted, setDailyItemValueFormatted] = useState('');
  const [dailyItemDay, setDailyItemDay] = useState(new Date().getDate().toString());

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

  useEffect(() => {
    localStorage.setItem('finanza-fluxo-active-month', activeMonth.toString());
    localStorage.setItem('finanza-fluxo-income-collapsed', String(isIncomeCollapsed));
    localStorage.setItem('finanza-fluxo-strategy-collapsed', String(isStrategyCollapsed));
  }, [activeMonth, isIncomeCollapsed, isStrategyCollapsed]);

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
      // Fix: CalendarIcon not found, use Calendar which is already imported from lucide-react
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
  const currentMonthStrategies = useMemo(() => (strategyBlocks || []).filter(s => s.year === activeYear && s.month === activeMonth).sort((a, b) => (a.date || '').localeCompare(b.date || '')), [strategyBlocks, activeYear, activeMonth]);

  const totalDailySpent = useMemo(() => {
    return currentMonthStrategies.reduce((acc, curr) => acc + (parseFloat(curr.content) || 0), 0);
  }, [currentMonthStrategies]);

  const totals = useMemo(() => {
    const inflow = currentMonthIncomes.reduce((acc, curr) => acc + curr.value, 0);
    const outflowPlanned = currentMonthEntries.reduce((acc, curr) => acc + curr.estimatedValue, 0);
    const outflowPaid = currentMonthEntries.filter(e => e.status === 'Pago').reduce((acc, curr) => acc + (curr.paidValue || curr.estimatedValue), 0);
    
    // Incluir o gasto diário no balanço de caixa
    const totalOutflowReal = outflowPaid + totalDailySpent;

    return { inflow, outflowPlanned, outflowPaid, strategyBalance: inflow - outflowPlanned - totalDailySpent, currentBalance: inflow - totalOutflowReal };
  }, [currentMonthEntries, currentMonthIncomes, totalDailySpent]);

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
          next[sourceYear!] = { ...sourceProfile, monthlyEntries: (sourceProfile.monthlyEntries || []).filter(e => e.id !== id) };
        }
        const migratedEntry: MonthlyEntry = { ...entryToUpdate!, ...updates, month: activeMonth, year: activeYear, competenceMonth: entryToUpdate!.competenceMonth ?? entryToUpdate!.month, competenceYear: entryToUpdate!.competenceYear ?? sourceYear! };
        const activeYearProfile = next[activeYear];
        if (activeYearProfile) {
          next[activeYear] = { ...activeYearProfile, monthlyEntries: [...(activeYearProfile.monthlyEntries || []), migratedEntry] };
        }
      } else if (isReturning) {
        const targetYear = entryToUpdate!.competenceYear ?? sourceYear!;
        const targetMonth = entryToUpdate!.competenceMonth ?? entryToUpdate!.month;
        const sourceProfile = next[sourceYear!];
        if (sourceProfile) {
          next[sourceYear!] = { ...sourceProfile, monthlyEntries: (sourceProfile.monthlyEntries || []).filter(e => e.id !== id) };
        }
        const restoredEntry: MonthlyEntry = { ...entryToUpdate!, ...updates, month: targetMonth, year: targetYear };
        if (!next[targetYear]) {
           next[targetYear] = { ...(allProfiles[targetYear] || { year: targetYear, financialData: { 'ESSENCIAIS': [], 'QUALIDADE DE VIDA': [], 'FUTURO': [], 'DÍVIDAS': [] }, customTags: { 'ESSENCIAIS': [], 'QUALIDADE DE VIDA': [], 'FUTURO': [], 'DÍVIDAS': [] }, monthlyEntries: [], incomeEntries: [] }), monthlyEntries: [] };
        }
        const targetProfile = next[targetYear];
        if (targetProfile) {
          next[targetYear] = { ...targetProfile, monthlyEntries: [...(targetProfile.monthlyEntries || []), restoredEntry] };
        }
      } else {
        const sourceProfile = next[sourceYear!];
        if (sourceProfile) {
          next[sourceYear!] = { ...sourceProfile, monthlyEntries: (sourceProfile.monthlyEntries || []).map(e => e.id === id ? { ...e, ...updates } : e) };
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
    let nextStatus: PaymentStatus;
    switch(entry.status) {
      case 'Pendente': nextStatus = 'Planejado'; break;
      case 'Planejado': nextStatus = 'Pago'; break;
      case 'Pago': nextStatus = 'Não Pago'; break;
      case 'Não Pago': nextStatus = 'Pendente'; break;
      default: nextStatus = 'Pendente';
    }
    updateEntry(entry.id, { status: nextStatus, paymentDate: nextStatus === 'Pago' ? new Date().toISOString().split('T')[0] : '', paidValue: nextStatus === 'Pago' ? entry.estimatedValue : 0 });
  };

  const handleAddDailyPurchase = () => {
    if (!dailyItemName || !dailyItemValueFormatted) return;
    const numericValue = parseCurrencyInput(dailyItemValueFormatted);
    if (numericValue <= 0) return;

    const newBlock: StrategyBlock = {
      id: crypto.randomUUID(),
      entryId: '',
      itemTitle: 'DIÁRIO',
      title: dailyItemName.toUpperCase(),
      content: numericValue.toString(), // Usamos content para o valor numérico
      mode: 'text',
      status: 'completed',
      date: dailyItemDay.padStart(2, '0'), // Usamos date para o dia do mês
      month: activeMonth,
      year: activeYear,
      order: strategyBlocks.length
    };
    setStrategyBlocks((prev: StrategyBlock[]) => [...(prev || []), newBlock]);
    setDailyItemName('');
    setDailyItemValueFormatted('');
  };

  const removeDailyPurchase = (id: string) => setStrategyBlocks((prev: StrategyBlock[]) => prev.filter(s => s.id !== id));

  const getCategoryStyles = (category: string) => {
    switch (category.toUpperCase()) {
      case 'ESSENCIAIS': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'QUALIDADE DE VIDA': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'FUTURO': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'DÍVIDAS': return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getDebtTypeLabel = (type?: DebtType) => {
    if (!type) return 'FIXA';
    if (type === 'DESPESAS FIXAS') return 'FIXA';
    if (type === 'GASTOS VARIÁVEIS') return 'VARIÁVEL';
    return type; // 'PASSIVOS'
  };

  const getStatusConfig = (status: PaymentStatus, entryId: string) => {
    switch(status) {
      case 'Pago': return { icon: <ShieldCheck className="w-4 h-4" />, bgColor: 'bg-emerald-500', rowClass: 'bg-emerald-500/[0.05] dark:bg-emerald-500/[0.03]', textClass: 'text-emerald-700 dark:text-emerald-400 line-through opacity-60' };
      case 'Não Pago': return { icon: <AlertCircle className="w-4 h-4" />, bgColor: 'bg-rose-500', rowClass: 'bg-rose-500/[0.05] dark:bg-rose-500/[0.03]', textClass: 'text-rose-600 dark:text-rose-400 italic' };
      // Fix: CalendarIcon not found, use Calendar which is already imported from lucide-react
      case 'Planejado': return { icon: <Calendar className="w-4 h-4" />, bgColor: 'bg-sky-500', rowClass: 'bg-sky-500/[0.03] dark:bg-sky-500/[0.02]', textClass: 'text-slate-900 dark:text-white font-black' };
      default: return { icon: <Clock className="w-4 h-4" />, bgColor: 'bg-white dark:bg-slate-950', rowClass: '', textClass: 'text-slate-900 dark:text-white' };
    }
  };

  const auditGridCols = "grid-cols-[0.4fr_0.4fr_0.7fr_1.1fr_0.8fr_0.7fr_0.5fr_0.8fr_0.8fr_0.8fr_0.9fr_0.6fr_1.0fr]";

  const getTranslation = (key: string) => {
    const dict: Record<string, string> = {
      status: 'STATUS',
      order: 'ORDEM',
      debtType: 'TIPO',
      item: 'ITEM',
      category: 'CATEGORIA',
      subCategory: 'TAG',
      installments: 'PARCELA',
      estimatedValue: 'VALOR',
      dueDate: 'VENC.',
      paymentDate: 'PAGAM.',
      PONTUALIDADE: 'PONTUAL.',
      hasOverride: 'AJUSTE',
      observation: 'OBS.'
    };
    return dict[key] || key.toUpperCase();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      {personalizingEntry && <PersonalizationModal item={personalizingEntry} onClose={() => setPersonalizingEntry(null)} onSave={(overrides) => {
        overrides.forEach(o => {
          if (o.field === 'dueDay') updateEntry(personalizingEntry.id, { dueDate: o.newValue, hasOverride: true });
          else if (o.field === 'value') updateEntry(personalizingEntry.id, { estimatedValue: o.newValue, hasOverride: true });
        });
        setPersonalizingEntry(null);
      }} onCancelItem={() => {
        const { itemId, category, month, year } = personalizingEntry;
        setFinancialData((prev: any) => ({ ...prev, [category]: prev[category].map((i: any) => i.id === itemId ? { ...i, isCancelled: true, cancelledMonth: month, cancelledYear: year } : i) }));
        setPersonalizingEntry(null);
      }} />}

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
                {monthsLabel.map((m, i) => (<button key={m} onClick={() => setActiveMonth(i + 1)} className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all text-center min-w-[34px] ${activeMonth === i + 1 ? 'bg-[#0F172A] dark:bg-slate-700 text-white shadow-md scale-[1.05] z-10' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'}`}>{m.substring(0, 3).toUpperCase()}</button>))}
              </div>
              <div className="h-10 w-px bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex gap-8">
                <div className="flex flex-col"><span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><ArrowUpCircle className="w-3 h-3 text-emerald-500" /> Recebido</span><span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(totals.inflow)}</span></div>
                <div className="flex flex-col"><span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><ArrowDownCircle className="w-3 h-3 text-rose-500" /> Planejado</span><span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(totals.outflowPlanned)}</span></div>
                <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all relative ${showFilters || hasActiveFilters ? 'bg-sky-600 border-sky-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><Filter className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Filtro</span>{hasActiveFilters && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>}</button>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right"><span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 block">Margem Operacional</span><span className={`text-xl font-black tabular-nums leading-none ${totals.strategyBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(totals.strategyBalance)}</span></div>
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
            <div className="flex items-center gap-1">{!isIncomeCollapsed && (<button onClick={() => setIncomeEntries((prev: any) => [...(prev || []), { id: crypto.randomUUID(), source: '', value: 0, responsible: '', receivedDay: undefined, date: new Date().toISOString().split('T')[0], month: activeMonth, year: activeYear }])} className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:scale-105 transition-all shadow-md"><Plus className="w-4 h-4" /></button>)}<button onClick={() => setIsIncomeCollapsed(!isIncomeCollapsed)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all">{isIncomeCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}</button></div>
          </div>
          {!isIncomeCollapsed && (
            <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-3">
              {(currentMonthIncomes || []).length === 0 ? (<div className="h-full flex items-center justify-center border border-dashed border-slate-100 dark:border-slate-800/50 rounded-lg bg-slate-50/20 dark:bg-slate-950/20 text-center"><p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">Caixa Vazio</p></div>) : (currentMonthIncomes.map(income => (<div key={income.id} className="group p-3 bg-slate-50/40 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-lg transition-all flex flex-col gap-3"><div className="flex items-center gap-2"><div className="flex-grow flex flex-col gap-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Fonte</label><input type="text" placeholder="..." value={income.source} onChange={(e) => updateIncome(income.id, 'source', e.target.value)} className="w-full h-[28px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 rounded font-black text-[11px] outline-none text-slate-900 dark:text-white" /></div><div className="w-[100px] flex flex-col gap-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor</label><input type="number" placeholder="0,00" value={income.value || ''} onChange={(e) => updateIncome(income.id, 'value', parseFloat(e.target.value) || 0)} className="w-full h-[28px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 rounded font-black text-[11px] text-emerald-600 text-right outline-none" /></div><div className="w-[45px] flex flex-col gap-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">Dia</label><input type="number" min="1" max="31" value={income.receivedDay ?? ''} onChange={(e) => updateIncome(income.id, 'receivedDay', e.target.value ? parseInt(e.target.value) : undefined)} className="w-full h-[28px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-1 rounded font-black text-[11px] text-slate-500 text-center outline-none" /></div><button onClick={() => removeIncome(income.id)} className="p-1 mt-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button></div></div>)))}
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
              <div className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <input type="text" placeholder="Buscar..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black text-slate-900 dark:text-white outline-none focus:border-sky-500" />
                </div>
              </div>
            )}

            <div className="flex-grow flex flex-col min-h-0">
              <div className={`grid ${auditGridCols} gap-2 px-4 py-2.5 bg-slate-900 dark:bg-[#020617] text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 sticky top-0 z-10 items-center`}>
                {['status', 'order', 'debtType', 'item', 'category', 'subCategory', 'installments', 'estimatedValue', 'dueDate', 'paymentDate', 'PONTUALIDADE', 'hasOverride', 'observation'].map(k => (<button key={k} onClick={() => k !== 'PONTUALIDADE' && handleSort(k as any)} className="py-1 px-1 hover:bg-white/5 rounded transition-colors whitespace-nowrap">{getTranslation(k)}</button>))}
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar">
                {currentMonthEntries.map((entry, idx) => {
                  const tagStyles = entry.subCategoryColor || getCategoryStyles(entry.category);
                  const st = getStatusConfig(entry.status, entry.id);
                  const termometro = getPontualidadeStatus(entry);
                  return (
                    <div key={entry.id} className={`grid ${auditGridCols} gap-2 px-4 py-1.5 items-center border-b border-slate-100 dark:border-slate-800 transition-all ${st.rowClass}`}>
                      <div className="flex justify-center"><button onClick={() => togglePaymentStatus(entry)} className={`w-6 h-6 rounded flex items-center justify-center transition-all ${st.bgColor} text-white shadow-sm`}>{st.icon}</button></div>
                      <div className="flex justify-center"><OrdemSelector value={entry.order || 5} onChange={(newOrder) => updateEntry(entry.id, { order: newOrder })} /></div>
                      <div className="flex justify-center"><span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${entry.debtType === 'PASSIVOS' ? 'bg-violet-500/10 text-violet-600 border-violet-500/20' : 'bg-sky-500/10 text-sky-600 border-sky-500/20'}`}>{getDebtTypeLabel(entry.debtType)}</span></div>
                      <div className="overflow-hidden"><span className={`text-[11px] font-black uppercase truncate tracking-tight ${st.textClass}`}>{entry.item}</span></div>
                      <div className="flex justify-center"><div className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest truncate ${getCategoryStyles(entry.category)} w-full text-center`}>{entry.category}</div></div>
                      <div className="flex justify-center"><div className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest truncate ${tagStyles} w-full text-center`}>{entry.subCategory || '—'}</div></div>
                      <div className="text-center"><span className="text-[10px] font-black text-slate-500 tabular-nums">{entry.installments}</span></div>
                      <div className="text-center"><span className={`text-[11px] font-black tabular-nums ${entry.hasOverride ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(entry.estimatedValue)}</span></div>
                      <div className="text-center"><span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 tabular-nums`}>{formatDate(entry.dueDate)}</span></div>
                      <div className="flex justify-center relative"><CustomDatePicker value={entry.paymentDate} onChange={(date) => updateEntry(entry.id, { paymentDate: date, status: date ? 'Pago' : entry.status, paidValue: date ? entry.estimatedValue : 0 })} /></div>
                      <div className="flex justify-center">{termometro && (<div className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm ${termometro.color}`}><termometro.icon className="w-3.5 h-3.5" /><span className="text-[8px] font-black uppercase">{termometro.label}</span></div>)}</div>
                      <div className="flex justify-center"><button onClick={() => setPersonalizingEntry(entry)} className="p-1 rounded border bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800/50 text-slate-400"><History className="w-3 h-3" /></button></div>
                      <div className="flex justify-center"><input type="text" placeholder="..." value={entry.observation || ''} onChange={(e) => updateEntry(entry.id, { observation: e.target.value })} className="w-full h-[24px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-1.5 rounded text-[10px] font-black text-slate-500 outline-none truncate" /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={`${isStrategyCollapsed ? 'flex-none' : 'flex-1'} flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-0 transition-all duration-500`}>
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20"><ShoppingBag className="w-4 h-4" /></div>
                <div className="flex flex-col">
                  <h3 className="text-[12px] font-black text-slate-950 dark:text-white uppercase tracking-tight">Consumo Diário & Microgastos</h3>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Log de Compras Rápidas</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {!isStrategyCollapsed && (
                  <div className="px-4 py-2 bg-slate-900 dark:bg-slate-800 rounded-lg border border-slate-700 shadow-sm flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Diário:</span>
                    <span className="text-sm font-black text-amber-400 tabular-nums">{formatCurrency(totalDailySpent)}</span>
                  </div>
                )}
                <button onClick={() => setIsStrategyCollapsed(!isStrategyCollapsed)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all">{isStrategyCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}</button>
              </div>
            </div>

            {!isStrategyCollapsed && (
              <div className="flex flex-col h-full bg-slate-50/20 dark:bg-slate-950/20 p-6 overflow-hidden">
                {/* Formulário de Adição Rápida */}
                <div className="grid grid-cols-[0.7fr_0.8fr_1fr_0.8fr_0.6fr_auto] items-end gap-3 mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                    <div className="h-11 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                       <span className="text-[10px] font-black text-emerald-600 uppercase">PAGO</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                    <div className="h-11 px-4 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center">
                       <span className="text-[10px] font-black text-sky-600 uppercase">VARIÁVEL</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Item</label>
                    <div className="relative">
                      <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        type="text" 
                        placeholder="Ex: Pão..." 
                        value={dailyItemName}
                        onChange={(e) => setDailyItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddDailyPurchase()}
                        className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="R$ 0,00" 
                        value={dailyItemValueFormatted}
                        onChange={(e) => setDailyItemValueFormatted(formatCurrencyInput(e.target.value))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddDailyPurchase()}
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-amber-600 outline-none focus:border-amber-500 transition-all text-right tabular-nums" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center">Pagamento</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="31" 
                      value={dailyItemDay}
                      onChange={(e) => setDailyItemDay(e.target.value)}
                      className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-500 text-center outline-none focus:border-amber-500 transition-all" 
                    />
                  </div>
                  <button 
                    onClick={handleAddDailyPurchase}
                    disabled={!dailyItemName || !dailyItemValueFormatted}
                    className="h-11 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    Lançar
                  </button>
                </div>

                {/* Lista de Compras */}
                <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2 pr-2">
                  {(currentMonthStrategies || []).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl opacity-30">
                      <Tag className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum gasto diário</p>
                    </div>
                  ) : (
                    currentMonthStrategies.map((item) => (
                      <div key={item.id} className="grid grid-cols-[0.7fr_0.8fr_1fr_0.8fr_0.6fr_auto] items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-right-2">
                        <div className="flex justify-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[8px] font-black border border-emerald-500/20">PAGO</span>
                        </div>
                        <div className="flex justify-center">
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 text-[8px] font-black border border-sky-500/20">VARIÁVEL</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate block">{item.title}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-amber-500 tabular-nums">{formatCurrency(parseFloat(item.content))}</span>
                        </div>
                        <div className="flex justify-center">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-[10px] text-slate-400 border border-slate-100 dark:border-slate-700">
                            {item.date}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button 
                            onClick={() => removeDailyPurchase(item.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrdemSelector = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const handleClickOutside = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); }; if (isOpen) document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, [isOpen]);
  const getOrderStyle = (v: number) => {
    switch (v) {
      case 1: return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 2: return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 3: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 4: return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 5: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };
  return (
    <div className="relative" ref={containerRef}>
      <button onClick={() => setIsOpen(!isOpen)} className={`w-10 h-7 rounded-lg border flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm ${getOrderStyle(value)}`}><span className="text-[11px] font-black">{value}</span></button>
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-[5000] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-1 grid grid-cols-1 gap-1 animate-in fade-in zoom-in-95 duration-200 min-w-[44px]">
          {[1, 2, 3, 4, 5].map((num) => (<button key={num} onClick={() => { onChange(num); setIsOpen(false); }} className={`w-full h-8 px-3 rounded-lg border font-black text-[11px] transition-all hover:brightness-95 flex items-center justify-center ${getOrderStyle(num)} ${value === num ? 'ring-2 ring-slate-900 dark:ring-white scale-90' : 'opacity-80 hover:opacity-100'}`}>{num}</button>))}
        </div>
      )}
    </div>
  );
};

const CustomDatePicker = ({ value, onChange }: { value: string, onChange: (date: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const handleClickOutside = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); }; if (isOpen) document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, [isOpen]);
  return (
    <div className="relative" ref={containerRef}>
      <button onClick={() => setIsOpen(!isOpen)} className={`h-7 px-3 rounded border text-[10px] font-black flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${value ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'}`}><CalendarDays className="w-3.5 h-3.5" /> {value ? value.split('-').reverse().slice(0, 2).join('/') : '--/--'}</button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 z-[5000] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-3 animate-in fade-in zoom-in-95 duration-200">
          <input type="date" value={value} onChange={(e) => { onChange(e.target.value); setIsOpen(false); }} className="bg-transparent border-none outline-none text-xs font-black uppercase dark:text-white" />
        </div>
      )}
    </div>
  );
};

const PersonalizationModal = ({ item, onClose, onSave, onCancelItem }: any) => {
  const [value, setValue] = useState(item.estimatedValue);
  const [dueDate, setDueDate] = useState(item.dueDate);
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-8 space-y-6">
        <h3 className="text-sm font-black uppercase text-center">{item.item}</h3>
        <div className="space-y-4">
          <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Valor Ajustado</label><input type="number" value={value} onChange={e => setValue(parseFloat(e.target.value))} className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border-2 rounded-xl text-sm font-black outline-none" /></div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Novo Vencimento</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border-2 rounded-xl text-sm font-black outline-none" /></div>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => onSave([{ field: 'value', newValue: value }, { field: 'dueDay', newValue: dueDate }])} className="w-full py-4 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] rounded-2xl font-black text-xs uppercase tracking-widest">Salvar Mudanças</button>
          <button onClick={onCancelItem} className="w-full py-4 border-2 border-rose-500/20 text-rose-500 rounded-2xl font-black text-xs uppercase">Cancelar Lançamento</button>
          <button onClick={onClose} className="w-full py-4 text-slate-400 text-xs font-black uppercase">Voltar</button>
        </div>
      </div>
    </div>
  );
};

export default Fluxo;
