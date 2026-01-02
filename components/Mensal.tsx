import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Trash2, Clock, Tag, Layers, DollarSign, CalendarDays, ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, ArrowDownCircle, ArrowUpCircle, RotateCcw, FileText, Hash, CheckCircle, Repeat, ShieldCheck, Flame, AlertTriangle, AlertCircle, Maximize2, Minimize2, TrendingDown } from 'lucide-react';
import { MonthlyEntry, PaymentStatus, CategoryType, FinancialItem, FrequencyConfig, DebtType } from '../types';

interface MensalProps {
  entries: MonthlyEntry[];
  setEntries: (newEntriesAction: any) => void;
  financialData: Record<CategoryType, FinancialItem[]>;
  isHeaderPinned: boolean;
  activeYear: number;
}

const Mensal: React.FC<MensalProps> = ({ entries, setEntries, financialData, isHeaderPinned, activeYear }) => {
  // FUNÇÃO AUXILIAR PARA RECUPERAR ESTADO DO LOCALSTORAGE
  const getStoredFilter = (key: string, defaultValue: any) => {
    const saved = localStorage.getItem(`finanza-mensal-filter-${key}`);
    if (!saved) return defaultValue;
    try {
      const parsed = JSON.parse(saved);
      if (defaultValue instanceof Set) return new Set(parsed);
      return parsed;
    } catch {
      return defaultValue;
    }
  };

  const [searchTerm, setSearchTerm] = useState(() => getStoredFilter('search', ''));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth() + 1);
  const [collapsedMonths, setCollapsedMonths] = useState<Set<number>>(new Set());
  
  // Estados de Filtro Avançado Persistentes
  const [filterMonths, setFilterMonths] = useState<Set<number>>(() => getStoredFilter('months', new Set()));
  const [filterCategories, setFilterCategories] = useState<Set<string>>(() => getStoredFilter('categories', new Set()));
  const [filterStatus, setFilterStatus] = useState<Set<PaymentStatus>>(() => getStoredFilter('status', new Set()));
  const [filterFreq, setFilterFreq] = useState<Set<string>>(() => getStoredFilter('freq', new Set()));
  const [filterSubCategory, setFilterSubCategory] = useState<Set<string>>(() => getStoredFilter('subcategory', new Set()));
  const [filterPontualidade, setFilterPontualidade] = useState<Set<string>>(() => getStoredFilter('pontualidade', new Set()));
  const [filterOnlyInstallments, setFilterOnlyInstallments] = useState<boolean>(() => getStoredFilter('installments', false));
  const [filterValMin, setFilterValMin] = useState<string>(() => getStoredFilter('valmin', ''));
  const [filterValMax, setFilterValMax] = useState<string>(() => getStoredFilter('valmax', ''));
  const [filterDueDay, setFilterDueDay] = useState<string>(() => getStoredFilter('dueday', ''));
  const [filterPaymentDay, setFilterPaymentDay] = useState<string>(() => getStoredFilter('payday', ''));
  
  const [showFilters, setShowFilters] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  // EFEITO PARA PERSISTIR FILTROS
  useEffect(() => {
    const filters = {
      search: searchTerm,
      months: Array.from(filterMonths),
      categories: Array.from(filterCategories),
      status: Array.from(filterStatus),
      freq: Array.from(filterFreq),
      subcategory: Array.from(filterSubCategory),
      pontualidade: Array.from(filterPontualidade),
      installments: filterOnlyInstallments,
      valmin: filterValMin,
      valmax: filterValMax,
      dueday: filterDueDay,
      payday: filterPaymentDay
    };
    Object.entries(filters).forEach(([k, v]) => {
      localStorage.setItem(`finanza-mensal-filter-${k}`, JSON.stringify(v));
    });
  }, [searchTerm, filterMonths, filterCategories, filterStatus, filterFreq, filterSubCategory, filterPontualidade, filterOnlyInstallments, filterValMin, filterValMax, filterDueDay, filterPaymentDay]);

  const monthsLabel: string[] = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const categories: CategoryType[] = ['ESSENCIAIS', 'QUALIDADE DE VIDA', 'FUTURO', 'DÍVIDAS'];
  const statuses: PaymentStatus[] = ['Pago', 'Pendente', 'Atrasado', 'Planejado', 'Não Pago', 'Agendado'];
  const freqOptions = ['MEN', 'SEM', 'QUI', 'TRI', 'ANU'];
  const pontualidadeOptions = ['PONTUAL', 'ATRASADO', 'NO PRAZO', 'PRAZO'];

  const subCategories = useMemo(() => {
    const tags = new Set<string>();
    (Object.values(financialData) as FinancialItem[][]).forEach(items => {
      items.forEach(item => {
        if (item.subCategory) tags.add(item.subCategory);
      });
    });
    return Array.from(tags).sort();
  }, [financialData]);

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
      return { label: 'NO PRAZO', color: 'text-slate-400', icon: CalendarIcon };
    }
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

  const removeEntry = (id: string) => {
    setEntries((prev: MonthlyEntry[]) => prev.filter(e => e.id !== id));
  };

  const groupedEntries = useMemo(() => {
    const groups: Record<number, MonthlyEntry[]> = {};
    entries.forEach(entry => {
      if (entry.year === activeYear) {
        if (!groups[entry.month]) groups[entry.month] = [];
        groups[entry.month].push(entry);
      }
    });
    return groups;
  }, [entries, activeYear]);

  const monthlyTotals = useMemo(() => {
    const totals: Record<number, { estimated: number, paid: number }> = {};
    for (let m = 1; m <= 12; m++) {
      const monthEntries = groupedEntries[m] || [];
      const estimated = monthEntries.reduce((acc, curr) => acc + curr.estimatedValue, 0);
      const paid = monthEntries.reduce((acc, curr) => acc + (curr.status === 'Pago' ? curr.estimatedValue : 0), 0);
      totals[m] = { estimated, paid };
    }
    return totals;
  }, [groupedEntries]);

  const filteredSortedMonths = useMemo(() => {
    const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    let baseMonths = filterMonths.size > 0 ? allMonths.filter(m => filterMonths.has(m)) : allMonths;
    baseMonths = baseMonths.filter(month => {
      const monthEntries = groupedEntries[month] || [];
      return monthEntries.some(e => {
        const matchesSearch = searchTerm.trim() === '' || e.item.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFreq = filterFreq.size === 0 || Array.from(filterFreq).some(f => e.frequencyLabel?.startsWith(f));
        const matchesCategory = filterCategories.size === 0 || filterCategories.has(e.category);
        const matchesSubCategory = filterSubCategory.size === 0 || filterSubCategory.has(e.subCategory);
        const matchesInstallments = !filterOnlyInstallments || e.installments !== '-';
        const valMin = filterValMin ? parseFloat(filterValMin) : -Infinity;
        const valMax = filterValMax ? parseFloat(filterValMax) : Infinity;
        const matchesValue = e.estimatedValue >= valMin && e.estimatedValue <= valMax;
        const dueDayStr = e.dueDate ? e.dueDate.split('-')[2] : '';
        const matchesDueDay = filterDueDay === '' || dueDayStr === filterDueDay.padStart(2, '0');
        const payDayStr = e.paymentDate ? e.paymentDate.split('-')[2] : '';
        const matchesPaymentDay = filterPaymentDay === '' || payDayStr === filterPaymentDay.padStart(2, '0');
        const termometro = getPontualidadeStatus(e);
        const matchesPontualidade = filterPontualidade.size === 0 || (termometro && Array.from(filterPontualidade).some((p: string) => termometro.label.includes(p)));
        const matchesStatus = filterStatus.size === 0 || filterStatus.has(e.status);
        return matchesSearch && matchesFreq && matchesCategory && matchesSubCategory && matchesInstallments && matchesValue && matchesDueDay && matchesPaymentDay && matchesPontualidade && matchesStatus;
      });
    });
    return baseMonths;
  }, [filterMonths, searchTerm, filterFreq, filterCategories, filterSubCategory, filterOnlyInstallments, filterValMin, filterValMax, filterDueDay, filterPaymentDay, filterPontualidade, filterStatus, groupedEntries]);

  const annualTotals = useMemo(() => {
    return entries.reduce((acc, curr) => {
      if (curr.year === activeYear) {
        acc.estimated += curr.estimatedValue;
        acc.paid += curr.status === 'Pago' ? curr.estimatedValue : 0;
      }
      return acc;
    }, { estimated: 0, paid: 0 });
  }, [entries, activeYear]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateStr: string) => { 
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return '--/--/----'; 
    const [year, month, day] = dateStr.split('-'); 
    return `${day}/${month}/${year}`; 
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const base = "relative flex items-center gap-1.5 px-3 h-[27px] rounded-md border-2 text-[11px] font-black uppercase transition-all shadow-sm w-full justify-center cursor-default";
    switch (status) {
      case 'Pago': return <span className={`${base} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/10`}><ShieldCheck className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" /> PAGO</span>;
      case 'Pendente': return <span className={`${base} bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800`}><Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" /> PENDENTE</span>;
      case 'Atrasado': return <span className={`${base} bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/10`}><AlertCircle className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" /> ATRASADO</span>;
      case 'Planejado': return <span className={`${base} bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 dark:border-sky-500/10`}><CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" /> PLANEJADO</span>;
      case 'Não Pago': return <span className={`${base} bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/10`}><RotateCcw className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" /> NÃO PAGO</span>;
      case 'Agendado': return <span className={`${base} bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 dark:border-violet-500/10`}><Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" /> AGENDADO</span>;
      default: return <span className={`${base} bg-slate-100 text-slate-400 border-transparent`}>{status}</span>;
    }
  };

  const getDebtTypeLabel = (type?: DebtType) => {
    if (!type) return 'FIXA';
    if (type === 'DESPESAS FIXAS') return 'FIXA';
    if (type === 'GASTOS VARIÁVEIS') return 'VARIÁVEL';
    return type; // 'PASSIVOS'
  };

  // Grade refinada para o Mensal
  const gridTemplate = "grid-cols-[1.2fr_0.7fr_1fr_1.1fr_1.1fr_0.6fr_1.2fr_1fr_1fr_1fr_1fr]";

  const scrollToMonth = (month: number) => {
    const el = document.getElementById(`month-section-${month}`);
    if (el) {
      setActiveMonth(month);
      const offset = 140;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: elementPosition, behavior: 'smooth' });
    }
  };

  const toggleSetFilter = (set: Set<any>, setter: (s: Set<any>) => void, val: any) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMonths(new Set());
    setFilterCategories(new Set());
    setFilterStatus(new Set());
    setFilterFreq(new Set());
    setFilterSubCategory(new Set());
    setFilterPontualidade(new Set());
    setFilterOnlyInstallments(false);
    setFilterValMin('');
    setFilterValMax('');
    setFilterDueDay('');
    setFilterPaymentDay('');
    
    const keys = ['search', 'months', 'categories', 'status', 'freq', 'subcategory', 'pontualidade', 'installments', 'valmin', 'valmax', 'dueday', 'payday'];
    keys.forEach(k => localStorage.removeItem(`finanza-mensal-filter-${k}`));
  };

  const isHeaderVisible = isHeaderPinned || isHeaderHovered;
  const annualCompletion = annualTotals.estimated > 0 ? (annualTotals.paid / annualTotals.estimated) * 100 : 0;
  
  const hasActiveFilters = useMemo(() => {
    return searchTerm || filterMonths.size > 0 || filterCategories.size > 0 || 
           filterStatus.size > 0 || filterFreq.size > 0 || filterSubCategory.size > 0 || 
           filterPontualidade.size > 0 || filterOnlyInstallments || 
           filterValMin || filterValMax || filterDueDay || filterPaymentDay;
  }, [searchTerm, filterMonths, filterCategories, filterStatus, filterFreq, filterSubCategory, filterPontualidade, filterOnlyInstallments, filterValMin, filterValMax, filterDueDay, filterPaymentDay]);

  return (
    <div className="w-full relative">
      {!isHeaderPinned && <div onMouseEnter={() => setIsHeaderHovered(true)} className="fixed top-[76px] left-0 w-full h-8 z-[950] bg-transparent" />}
      
      <div 
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
        className={`sticky top-[76px] z-[900] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${isHeaderPinned ? 'opacity-100 pt-2 pb-4 mb-4' : 'h-0 opacity-0 mb-0 overflow-visible'}
        `}
      >
        <div className={`transition-all duration-500 ${!isHeaderVisible ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'}`}>
          <div className="bg-white dark:bg-[#020617] border-2 border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-4 flex flex-col gap-4 relative">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0F172A] dark:bg-white rounded-lg shadow-sm"><TrendingUp className="w-4 h-4 text-white dark:text-[#0F172A]" /></div>
                  <div>
                    <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Anual {activeYear}</span>
                    <div className="flex items-center gap-2 leading-none">
                      <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">Efetivação</span>
                      <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[11px] font-black">{annualCompletion.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex gap-6">
                  <div>
                    <span className="flex items-center gap-1 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none"><CheckCircle className="w-3 h-3" /> Pago</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">{formatCurrency(annualTotals.paid)}</span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none"><ArrowDownCircle className="w-3 h-3" /> Informado</span>
                    <span className="text-base font-black text-slate-900 dark:text-white leading-none">{formatCurrency(annualTotals.estimated)}</span>
                  </div>
                </div>
              </div>

              <div className="flex-grow flex items-center justify-center px-4">
                <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-[#0F172A]/40 p-1 rounded-xl border-2 border-slate-100 dark:border-slate-800 shadow-inner w-full max-w-[800px]">
                  {monthsLabel.map((m: string, i: number) => {
                    const monthNum = i + 1;
                    const mProgress = monthlyTotals[monthNum]?.estimated > 0 ? (monthlyTotals[monthNum].paid / monthlyTotals[monthNum].estimated) * 100 : 0;
                    const abbreviation = m.substring(0, 3).toUpperCase();
                    const isFilteredOut = filterMonths.size > 0 && !filterMonths.has(monthNum);
                    
                    return (
                      <button key={m} onClick={() => scrollToMonth(monthNum)} className={`flex-1 min-w-0 px-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all text-center truncate relative ${activeMonth === monthNum ? 'bg-[#0F172A] dark:bg-slate-700 text-white shadow-md scale-[1.05] z-10' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'} ${isFilteredOut ? 'opacity-25 grayscale' : 'opacity-100'}`}>
                        {abbreviation}{mProgress > 0 && (<div className={`absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all`} style={{ width: `${mProgress}%` }} />)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setCollapsedMonths(prev => prev.size === 12 ? new Set() : new Set([1,2,3,4,5,6,7,8,9,10,11,12]))} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all bg-slate-100 dark:bg-[#0F172A] text-slate-700 dark:text-slate-300 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 whitespace-nowrap shadow-sm">
                  {collapsedMonths.size === 12 ? <><Maximize2 className="w-3.5 h-3.5" /> Expandir</> : <><Minimize2 className="w-3.5 h-3.5" /> Recolher</>}
                </button>
                <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${showFilters || hasActiveFilters ? 'bg-[#0F172A] dark:bg-[#0F172A] text-white border-transparent' : 'bg-white dark:bg-[#020617] text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}>
                  <Filter className="w-3.5 h-3.5" /> Filtros {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse"></span>}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="border-t-2 border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Painel de Filtragem Avançada</span>
                    {hasActiveFilters && <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 text-[9px] font-black uppercase">Ativo</span>}
                  </div>
                  <button onClick={clearFilters} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm">
                    <RotateCcw className="w-3 h-3" /> Limpar Filtros
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">01. Item</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input type="text" placeholder="Busca..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-8 pl-8 pr-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black text-slate-900 dark:text-white outline-none focus:border-[#0F172A]" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mês</label>
                      <div className="grid grid-cols-6 gap-0.5">
                        {monthsLabel.map((m: string, i: number) => (
                          <button key={m} onClick={() => toggleSetFilter(filterMonths, setFilterMonths, i + 1)} className={`h-7 rounded text-[8px] font-black uppercase transition-all ${filterMonths.has(i + 1) ? 'bg-[#0F172A] dark:bg-slate-700 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'}`}>{m.substring(0, 1)}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">02. Frequência</label>
                      <div className="grid grid-cols-3 gap-1">
                        {freqOptions.map(f => (
                          <button key={f} onClick={() => toggleSetFilter(filterFreq, setFilterFreq, f)} className={`h-7 rounded text-[8px] font-black uppercase transition-all ${filterFreq.has(f) ? 'bg-[#0F172A] dark:bg-slate-700 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">09. Pontualidade</label>
                      <div className="grid grid-cols-2 gap-1">
                        {pontualidadeOptions.map(p => (
                          <button key={p} onClick={() => toggleSetFilter(filterPontualidade, setFilterPontualidade, p)} className={`h-7 rounded px-1 text-[8px] font-black uppercase transition-all truncate ${filterPontualidade.has(p) ? 'bg-[#0F172A] dark:bg-slate-700 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'}`}>{p}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">03. Categoria</label>
                    <div className="flex flex-col gap-1">
                      {categories.map(cat => (
                        <button key={cat} onClick={() => toggleSetFilter(filterCategories, setFilterCategories, cat)} className={`h-7 px-2 rounded text-[8px] font-black uppercase transition-all text-left truncate ${filterCategories.has(cat) ? 'bg-[#0F172A] dark:bg-slate-700 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'}`}>{cat}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">04. Sub-Categoria</label>
                    <div className="flex-grow overflow-y-auto custom-scrollbar max-h-[140px] pr-1 flex flex-col gap-1">
                      {subCategories.length === 0 ? <span className="text-[8px] text-slate-400 italic">Sem Tags</span> : subCategories.map(tag => (
                        <button key={tag} onClick={() => toggleSetFilter(filterSubCategory, setFilterSubCategory, tag)} className={`h-7 px-2 rounded text-[8px] font-black uppercase transition-all text-left truncate ${filterSubCategory.has(tag) ? 'bg-[#0F172A] dark:bg-slate-700 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'}`}>{tag}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">05. Parcelas</label>
                      <button onClick={() => setFilterOnlyInstallments(!filterOnlyInstallments)} className={`h-8 rounded px-2 text-[9px] font-black uppercase transition-all ${filterOnlyInstallments ? 'bg-[#0F172A] dark:bg-slate-700 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-2 border-slate-200 dark:border-slate-800'}`}>Apenas Parcelados</button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">06. Valor (Range)</label>
                      <div className="flex gap-1">
                        <input type="number" placeholder="Mín" value={filterValMin} onChange={(e) => setFilterValMin(e.target.value)} className="w-1/2 h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 text-[9px] font-black text-slate-900 dark:text-white outline-none" />
                        <input type="number" placeholder="Máx" value={filterValMax} onChange={(e) => setFilterValMax(e.target.value)} className="w-1/2 h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 text-[9px] font-black text-slate-900 dark:text-white outline-none" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                       <div className="flex flex-col gap-1.5">
                         <label className="text-[8px] font-black uppercase tracking-tighter text-slate-400">07. Dia Venc</label>
                         <input type="number" min="1" max="31" value={filterDueDay} onChange={(e) => setFilterDueDay(e.target.value)} className="w-full h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1 text-[9px] font-black text-slate-900 dark:text-white outline-none" />
                       </div>
                       <div className="flex flex-col gap-1.5">
                         <label className="text-[8px] font-black uppercase tracking-tighter text-slate-400">08. Dia Pag</label>
                         <input type="number" min="1" max="31" value={filterPaymentDay} onChange={(e) => setFilterPaymentDay(e.target.value)} className="w-full h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1 text-[9px] font-black text-slate-900 dark:text-white outline-none" />
                       </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">10. Status</label>
                       <div className="grid grid-cols-3 gap-0.5">
                         {statuses.map(st => (
                           <button key={st} onClick={() => toggleSetFilter(filterStatus, setFilterStatus, st)} className={`h-7 rounded text-[7px] font-black uppercase transition-all border ${filterStatus.has(st) ? 'bg-[#0F172A] dark:bg-slate-700 text-white border-transparent' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'}`}>{st.substring(0, 4)}</button>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-20">
        {filteredSortedMonths.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 animate-in fade-in zoom-in-95 duration-500"><div className="p-6 bg-white dark:bg-slate-900 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-800 mb-6"><Search className="w-12 h-12 text-slate-200 dark:text-slate-800" /></div><p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600 text-center">Nenhum registro encontrado para os filtros ativos</p><button onClick={clearFilters} className="mt-4 px-6 py-2 bg-[#0F172A] dark:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Limpar Filtros</button></div>
        ) : (
          filteredSortedMonths.map(month => {
            const isCollapsed = collapsedMonths.has(month);
            const monthEntries = (groupedEntries[month] || []).filter(e => {
              const matchesSearch = searchTerm.trim() === '' || e.item.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesFreq = filterFreq.size === 0 || Array.from(filterFreq).some(f => e.frequencyLabel?.startsWith(f));
              const matchesCategory = filterCategories.size === 0 || filterCategories.has(e.category);
              const matchesSubCategory = filterSubCategory.size === 0 || filterSubCategory.has(e.subCategory);
              const matchesInstallments = !filterOnlyInstallments || e.installments !== '-';
              const valMin = filterValMin ? parseFloat(filterValMin) : -Infinity;
              const valMax = filterValMax ? parseFloat(filterValMax) : Infinity;
              const matchesValue = e.estimatedValue >= valMin && e.estimatedValue <= valMax;
              const dueDayStr = e.dueDate ? e.dueDate.split('-')[2] : '';
              const matchesDueDay = filterDueDay === '' || dueDayStr === filterDueDay.padStart(2, '0');
              const payDayStr = e.paymentDate ? e.paymentDate.split('-')[2] : '';
              const matchesPaymentDay = filterPaymentDay === '' || payDayStr === filterPaymentDay.padStart(2, '0');
              const termometro = getPontualidadeStatus(e);
              const matchesPontualidade = filterPontualidade.size === 0 || (termometro && Array.from(filterPontualidade).some((p: string) => termometro.label.includes(p)));
              const matchesStatus = filterStatus.size === 0 || filterStatus.has(e.status);
              return matchesSearch && matchesFreq && matchesCategory && matchesSubCategory && matchesInstallments && matchesValue && matchesDueDay && matchesPaymentDay && matchesPontualidade && matchesStatus;
            });
            if (monthEntries.length === 0) return null;
            const totalEstimado = monthEntries.reduce((acc, curr) => acc + curr.estimatedValue, 0);
            const totalPago = monthEntries.reduce((acc, curr) => acc + (curr.status === 'Pago' ? curr.estimatedValue : 0), 0);
            const monthPerc = totalEstimado > 0 ? (totalPago / totalEstimado) * 100 : 0;
            
            const nextMonthNum = month === 12 ? 1 : month + 1;
            const nextMonthTotal = monthlyTotals[nextMonthNum]?.estimated || 0;
            const variationValue = nextMonthTotal - totalEstimado;
            const variationPerc = totalEstimado > 0 ? (variationValue / totalEstimado) * 100 : 0;
            const isIncreasing = variationValue > 0;

            return (
              <div key={month} id={`month-section-${month}`} className="scroll-mt-[250px] min-w-[1400px] bg-white dark:bg-[#020617] rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-visible">
                <div onClick={() => setCollapsedMonths(prev => { const n = new Set(prev); n.has(month) ? n.delete(month) : n.add(month); return n; })} className={`px-5 py-4 flex items-center justify-between transition-all cursor-pointer select-none group/header ${monthEntries.some(e => selectedIds.includes(e.id)) ? 'bg-slate-100 dark:bg-[#0F172A]/40' : 'bg-slate-50/50 dark:bg-[#020617]/30'} hover:bg-slate-100 dark:hover:bg-[#0F172A]/20`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all shadow-sm ${isCollapsed ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-[#0F172A] dark:bg-slate-700 text-white'}`}>{String(month).padStart(2, '0')}</div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2"><h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{monthsLabel[month - 1]}</h3><div className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[11px] font-black">{monthPerc.toFixed(1)}%</div></div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{activeYear} • Operações</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 ml-auto">
                    <div className={`px-4 py-2 rounded-xl border-2 flex items-center gap-3 transition-all animate-in zoom-in-95 duration-500 ${isIncreasing ? 'bg-amber-500/5 border-amber-500/10 text-amber-600' : 'bg-sky-500/5 border-sky-500/10 text-sky-600'}`}>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1 opacity-60">Próximo Ciclo</span>
                        <div className="flex items-center gap-1.5">
                          {isIncreasing ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            {isIncreasing ? 'Crescimento' : 'Otimização'} 
                            <span className="ml-2 tabular-nums">({isIncreasing ? '+' : ''}{variationPerc.toFixed(1)}%)</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-8">
                      <div className="text-right"><span className="block text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Efetivado</span><span className={`text-base font-black tabular-nums ${isCollapsed ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatCurrency(totalPago)}</span></div>
                      <div className="text-right"><span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Informado</span><span className={`text-base font-black tabular-nums ${isCollapsed ? 'text-slate-50' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(totalEstimado)}</span></div>
                    </div>
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="animate-in slide-in-from-top-2 duration-300 relative px-2 pb-2 overflow-visible">
                    <div className={`grid ${gridTemplate} text-[10px] font-black uppercase tracking-widest text-white bg-[#0F172A] dark:bg-[#020617] shadow-md h-[34px] items-center rounded-t-lg`}>
                      <div className="px-1 h-full flex items-center justify-center">Item</div>
                      <div className="px-1 h-full flex items-center justify-center">TIPO</div>
                      <div className="px-1 h-full flex items-center justify-center">Frequência</div>
                      <div className="px-1 h-full flex items-center justify-center">Categoria</div>
                      <div className="px-1 h-full flex items-center justify-center">Sub-Categoria</div>
                      <div className="px-1 h-full flex items-center justify-center">Parcelas</div>
                      <div className="px-1 h-full flex items-center justify-center">Valor Estimado</div>
                      <div className="px-1 h-full flex items-center justify-center">Vencimento</div>
                      <div className="px-1 h-full flex items-center justify-center">Pagamento</div>
                      <div className="px-1 h-full flex items-center justify-center">Pontualidade</div>
                      <div className="px-1 h-full flex items-center justify-center">Status</div>
                    </div>
                    <div className="relative pt-1 space-y-1 overflow-visible">
                      {monthEntries.length === 0 ? (<div className="py-20 text-center"><p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700">Aguardando Lançamentos</p></div>) : (
                        monthEntries.map((entry: MonthlyEntry) => {
                          const isPaid = entry.status === 'Pago';
                          const termometro = getPontualidadeStatus(entry);
                          return (
                            <div key={entry.id} className={`grid ${gridTemplate} min-h-[40px] items-center cursor-pointer relative transition-all duration-100 rounded-md ${isPaid ? 'bg-emerald-500/10 dark:bg-emerald-500/5 z-[5]' : 'hover:bg-slate-200/40 dark:hover:bg-[#0F172A]/20'}`}>
                              <div className="px-1 py-1 flex items-center justify-center min-w-0 h-full"><div className="relative flex items-center justify-start gap-1.5 pl-7 pr-1 h-[27px] rounded border-2 bg-slate-500/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 w-full truncate"><FileText className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" /><span className="text-[11px] font-black truncate uppercase tracking-tighter">{entry.item}</span></div></div>
                              <div className="px-1 py-1 flex justify-center items-center">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border text-center w-full max-w-[80px] ${entry.debtType === 'PASSIVOS' ? 'bg-violet-500/10 text-violet-600 border-violet-500/20' : entry.debtType === 'GASTOS VARIÁVEIS' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-sky-500/10 text-sky-600 border-sky-500/20'}`}>
                                  {getDebtTypeLabel(entry.debtType)}
                                </span>
                              </div>
                              <div className="px-1 py-1 flex items-center justify-center min-w-0 h-full"><div className="relative flex items-center justify-center gap-1.5 px-1 h-[27px] rounded border-2 bg-slate-500/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 w-full truncate"><Repeat className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" /><span className="text-[11px] font-black truncate uppercase tracking-tighter ml-4">{entry.frequencyLabel}</span></div></div>
                              <div className="px-1 py-1 flex items-center justify-center min-w-0 h-full"><div className={`relative flex items-center justify-center gap-1.5 px-1 h-[27px] rounded border-2 ${getCategoryStyles(entry.category)} w-full truncate`}><Layers className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3" /><span className="text-[11px] font-black truncate uppercase tracking-tighter ml-4">{entry.category}</span></div></div>
                              <div className="px-1 py-1 flex items-center justify-center min-w-0 h-full"><div className={`relative flex items-center justify-center gap-1.5 px-1 h-[27px] rounded border-2 ${getCategoryStyles(entry.category)} w-full truncate opacity-80`}><Tag className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3" /><span className="text-[11px] font-black truncate uppercase tracking-tighter ml-4">{entry.subCategory}</span></div></div>
                              <div className="px-1 py-1 flex items-center justify-center min-w-0 h-full"><div className="relative flex items-center gap-1.5 px-1 h-[27px] rounded border-2 bg-slate-500/5 text-slate-500 border-slate-200 dark:border-slate-800 w-full justify-center"><Hash className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" /><span className="text-[11px] font-black uppercase tracking-tighter">{entry.installments}</span></div></div>
                              <div className="px-1 py-1 flex items-center justify-center min-w-0 h-full"><div className="relative flex items-center justify-center h-[27px] px-1 bg-white dark:bg-[#020617] border-2 border-slate-200 dark:border-slate-800 rounded-md shadow-sm w-full"><DollarSign className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-600" /><div className="flex items-center ml-2"><span className="text-[11px] font-black text-slate-400 dark:text-slate-600 mr-0.5">R$</span><span className="text-[11px] font-black text-slate-900 dark:text-slate-100 tabular-nums">{entry.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div></div></div>
                              <div className="px-1 py-1 flex items-center min-w-0 h-full justify-center"><div className="relative flex items-center gap-1.5 px-1 h-[27px] bg-white dark:bg-[#020617] border-2 border-slate-200 dark:border-slate-800 rounded-md shadow-sm w-full justify-center"><CalendarDays className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" /><span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums ml-2">{formatDate(entry.dueDate)}</span></div></div>
                              <div className="px-1 py-1 flex justify-center h-full items-center"><div className="relative flex items-center gap-1.5 px-1 h-[27px] bg-slate-50 dark:bg-slate-950/40 border-2 border-slate-200 dark:border-slate-800 rounded-md w-full justify-center opacity-80 cursor-not-allowed shadow-inner"><CalendarIcon className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" /><span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums ml-2">{formatDate(entry.paymentDate)}</span></div></div>
                              <div className="px-1 py-1 flex justify-center items-center">{termometro && (<div className={`flex items-center gap-1 px-2 py-0.5 rounded border border-transparent transition-all ${termometro.color}`}><termometro.icon className="w-3.5 h-3.5" /><span className="text-[10px] font-black uppercase tracking-tighter">{termometro.label}</span></div>)}</div>
                              <div className="px-1 py-1 flex justify-center group/status relative h-full items-center"><div className="flex items-center w-full">{getStatusBadge(entry.status)}</div><button onClick={(e) => { e.stopPropagation(); removeEntry(entry.id); }} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 opacity-0 group-hover:opacity-100 transition-all p-2 hover:text-rose-600 text-slate-300 z-[60]"><Trash2 className="w-5 h-5" /></button></div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Mensal;