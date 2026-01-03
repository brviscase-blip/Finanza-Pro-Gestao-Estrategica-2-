import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, Home, Heart, Rocket, CreditCard, TrendingUp, Layers, Settings2, X, Tag as TagIcon, ChevronDown, Check, Maximize2, AlertTriangle, Hash, CalendarDays, FileText, ChevronUp, Info, Zap, CalendarRange, Clock, Edit2, Lock, Ban, Landmark, ArrowRight, Percent, SlidersHorizontal, Calculator, Undo2, ShieldAlert, RefreshCw, LayoutGrid, ListFilter } from 'lucide-react';
import { CategoryType, FinancialItem, FrequencyConfig, FrequencyType, SubCategoryTag, MonthlyEntry, MasterDebt, DebtType } from '../types';
import { CATEGORIES } from '../constants';

interface RegistroProps {
  data: Record<CategoryType, FinancialItem[]>;
  setData: React.Dispatch<React.SetStateAction<Record<CategoryType, FinancialItem[]>>>;
  customTags: Record<CategoryType, SubCategoryTag[]>;
  setCustomTags: React.Dispatch<React.SetStateAction<Record<CategoryType, SubCategoryTag[]>>>;
  entries: MonthlyEntry[];
  isHeaderPinned: boolean;
  activeYear: number;
  masterDebts: MasterDebt[];
  setMasterDebts: React.Dispatch<React.SetStateAction<MasterDebt[]>>;
}

interface CategoryCardProps {
  displayTitle: string;
  themeCategory: CategoryType | 'FIXA' | 'VARIÁVEL' | 'PASSIVOS';
  items: (FinancialItem & { category: CategoryType })[];
  onAdd?: () => void;
  onRequestRemove: (category: CategoryType, id: string, name: string) => void;
  onUpdate: (category: CategoryType, id: string, field: keyof FinancialItem, value: any) => void;
  onReactivate: (id: string) => void;
  onOpenFreq: (category: CategoryType, id: string) => void;
  onOpenAddTag: (category: CategoryType, id: string) => void;
  onOpenEditTag: (category: CategoryType, tag: SubCategoryTag) => void;
  onRequestRemoveTag: (category: CategoryType, tagName: string) => void;
  isTagInUse: (category: CategoryType, tagName: string) => boolean;
  total: number;
  totalGeral: number;
  formatCurrency: (value: number) => string;
  registeredTags: SubCategoryTag[];
  onExpand?: () => void;
  isExpanded?: boolean;
  onClose?: () => void;
  isItemQuitado: (item: FinancialItem, category: CategoryType) => boolean;
  isHeaderPinned: boolean;
  onLinkMaster?: () => void;
  onOpenInstallments: (category: CategoryType, id: string) => void;
  masterDebts: MasterDebt[];
  isEmptyView?: boolean;
}

const DebtTypeSelector: React.FC<{ category: CategoryType, value?: DebtType, onChange: (val: DebtType) => void, disabled?: boolean }> = ({ category, value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allOptions: { label: string, value: DebtType, color: string }[] = [
    { label: 'PASSIVOS', value: 'PASSIVOS' as DebtType, color: 'border-violet-500/30 text-violet-600' },
    { label: 'FIXA', value: 'DESPESAS FIXAS' as DebtType, color: 'border-sky-500/30 text-sky-600' },
    { label: 'VARIÁVEL', value: 'GASTOS VARIÁVEIS' as DebtType, color: 'border-amber-500/30 text-amber-600' }
  ];

  const options = allOptions.filter(opt => {
    if (category === 'DÍVIDAS') return true;
    return opt.value === 'DESPESAS FIXAS';
  });

  const defaultValue = category === 'DÍVIDAS' ? 'PASSIVOS' : 'DESPESAS FIXAS';
  const effectiveValue = value || defaultValue;

  const current = options.find(o => o.value === effectiveValue) || options[0] || { label: 'FIXA', color: 'border-sky-500/30 text-sky-600' };
  const isSingleOption = options.length <= 1;

  return (
    <div className={`relative w-full ${disabled ? 'opacity-60 pointer-events-none' : ''}`} ref={containerRef}>
      <button 
        onClick={() => !isSingleOption && setIsOpen(!isOpen)}
        disabled={disabled || isSingleOption}
        className={`w-full flex items-center justify-between px-2 h-[26px] bg-white dark:bg-slate-950 border rounded shadow-sm transition-all ${isSingleOption ? 'cursor-default' : 'hover:brightness-95 active:scale-95'} ${isOpen ? 'ring-2 ring-sky-500/20 border-sky-500' : current.color}`}
      >
        <span className="text-[9px] font-black uppercase truncate tracking-tighter">{current.label}</span>
        {!isSingleOption && <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </button>
      {isOpen && !isSingleOption && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl z-[100] p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-200">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`w-full px-2 py-1.5 text-left text-[8px] font-black uppercase rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${opt.color} border border-transparent hover:border-current`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TagInput: React.FC<any> = ({ value, customColor, onChange, onOpenModal, onOpenEditTag, onRemoveTag, isTagInUse, suggestions, theme, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const handleClickOutside = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
  const currentTag = suggestions.find((t: any) => t.name === value);
  const colorClass = customColor || currentTag?.colorClass || theme.bg + ' ' + theme.text + ' ' + theme.border;
  return (
    <div className={`relative w-full ${disabled ? 'pointer-events-none opacity-60' : ''}`} ref={dropdownRef}>
      <div onClick={() => !disabled && setIsOpen(!isOpen)} className={`flex items-center justify-between gap-1 px-1.5 h-[26px] rounded border shadow-sm cursor-pointer transition-all hover:brightness-95 active:scale-95 ${colorClass}`}><TagIcon className="w-2.5 h-2.5 shrink-0 opacity-70" /><span className="text-[10px] font-black truncate uppercase tracking-tighter flex-grow">{value || 'Tag'}</span><ChevronDown className={`w-2.5 h-2.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></div>
      {isOpen && (
        <div className="absolute top-full left-0 w-44 mt-1 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30"><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Categorias</span></div>
          <div className="max-h-40 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
            {suggestions.map((tag: any) => { const inUse = isTagInUse(tag.name); return (<div key={tag.name} className="relative group/tag-option"><button onClick={() => { onChange(tag.name, tag.colorClass); setIsOpen(false); }} className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all text-left ${tag.colorClass} hover:brightness-90`}><div className="w-1 h-1 rounded-full bg-current opacity-60" />{tag.name}</button><div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/tag-option:opacity-100 transition-all"><button onClick={(e) => { e.stopPropagation(); onOpenEditTag(tag); setIsOpen(false); }} className="p-1 text-slate-400 hover:text-sky-500 transition-colors" title="Editar"><Edit2 className="w-2.5 h-2.5" /></button>{!inUse && (<button onClick={(e) => { e.stopPropagation(); onRemoveTag(tag.name); }} className="p-1 text-slate-400 hover:text-rose-500 transition-all" title="Excluir"><X className="w-2.5 h-2.5" /></button>)}</div></div>); })}
            <button onClick={() => { onOpenModal(); setIsOpen(false); }} className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left border border-dashed border-slate-200 dark:border-slate-700"><Plus className="w-3 h-3" />Nova Tag</button>
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  displayTitle, themeCategory, items, onAdd, onRequestRemove, onUpdate, onReactivate, onOpenFreq, onOpenAddTag, onOpenEditTag, onRequestRemoveTag, isTagInUse,
  total, totalGeral, formatCurrency, registeredTags, onExpand, isExpanded = false, onClose,
  isItemQuitado, isHeaderPinned, onLinkMaster, onOpenInstallments, masterDebts, isEmptyView = false
}) => {
  const isDividas = themeCategory === 'DÍVIDAS' || themeCategory === 'PASSIVOS';
  
  const getTheme = () => {
    switch (themeCategory) {
      case 'ESSENCIAIS': return { color: 'emerald', icon: Home, target: '55%', bg: 'bg-emerald-500/10 dark:bg-emerald-500/10', border: 'border-emerald-500/20 dark:border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' };
      case 'QUALIDADE DE VIDA': return { color: 'sky', icon: Heart, target: '25%', bg: 'bg-sky-500/10 dark:bg-sky-500/10', border: 'border-sky-500/20 dark:border-sky-500/20', text: 'text-sky-600 dark:text-sky-400' };
      case 'FUTURO': return { color: 'rose', icon: Rocket, target: '20%', bg: 'bg-rose-500/10 dark:bg-rose-500/10', border: 'border-rose-500/20 dark:border-rose-500/10', text: 'text-rose-600 dark:text-rose-400' };
      case 'DÍVIDAS': return { color: 'violet', icon: CreditCard, target: '0%', bg: 'bg-violet-500/10 dark:bg-violet-500/10', border: 'border-violet-500/20 dark:border-violet-500/20', text: 'text-violet-600 dark:text-violet-400' };
      case 'FIXA': return { color: 'sky', icon: Layers, target: 'FIXA', bg: 'bg-sky-500/10 dark:bg-sky-500/10', border: 'border-sky-500/20 dark:border-sky-500/20', text: 'text-sky-600 dark:text-sky-400' };
      case 'VARIÁVEL': return { color: 'amber', icon: TrendingUp, target: 'VARIÁVEL', bg: 'bg-amber-500/10 dark:bg-amber-500/10', border: 'border-amber-500/20 dark:border-amber-500/20', text: 'text-amber-600 dark:text-amber-400' };
      case 'PASSIVOS': return { color: 'violet', icon: CreditCard, target: 'PASSIVO', bg: 'bg-violet-500/10 dark:bg-violet-500/10', border: 'border-violet-500/20 dark:border-violet-500/20', text: 'text-violet-600 dark:text-violet-400' };
      default: return { color: 'slate', icon: Layers, target: '0%', bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-600 dark:text-slate-400' };
    }
  };
  const theme = getTheme();
  const Icon = theme.icon;
  const percentage = totalGeral > 0 ? (total / totalGeral) * 100 : 0;
  const textColor = { emerald: 'text-emerald-800 dark:text-emerald-400', sky: 'text-sky-800 dark:text-sky-400', rose: 'text-rose-800 dark:text-rose-400', violet: 'text-violet-800 dark:text-violet-400', slate: 'text-slate-800 dark:text-slate-400', amber: 'text-amber-800 dark:text-amber-400' }[theme.color as any] || 'text-slate-800';
  
  const getFreqLabel = (freq?: FrequencyConfig) => {
    if (!freq) return 'SET';
    if (freq.type === 'semanal') { const weekdaysShort = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']; return `SEM | ${weekdaysShort[freq.weeklyDay || 0]}`; }
    const typeShort = freq.type === 'personalizado' ? `${freq.customInterval}${freq.customUnit?.substring(0,1).toUpperCase() || 'M'}` : freq.type.substring(0,3).toUpperCase();
    const monthsShort = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const m = monthsShort[freq.startMonth - 1] || '---';
    const d = String(freq.dueDay || 1).padStart(2, '0');
    const y = String(freq.startYear).slice(-2);
    return `${typeShort} | ${d}-${m}-${y}`;
  };

  const getMasterInstallmentLabel = (item: FinancialItem) => {
    if (item.masterDebtId) {
      const master = (masterDebts || []).find(d => d.id === item.masterDebtId);
      if (!master) return '-';
      const paidCount = master.installments.filter(i => i.status === 'paid').length;
      return `${String(paidCount).padStart(2, '0')}/${String(master.installmentsCount).padStart(2, '0')}`;
    }
    const count = item.installments || 1;
    if (count <= 1) return '-';
    const isManual = item.installmentValues && item.installmentValues.length > 0;
    return isManual ? `${count} (M)` : `${count}`;
  };

  const gridClass = isDividas 
    ? "grid-cols-[0.8fr_0.8fr_1fr_0.8fr_0.8fr_0.4fr]" 
    : "grid-cols-[0.8fr_0.8fr_1.2fr_1fr_1fr_0.4fr]";

  if (isEmptyView) {
    return (
      <div className="flex flex-col bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl h-full min-h-0 items-center justify-center p-10 opacity-40">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 shadow-inner mb-4">
          <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Slot Reservado</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm h-full min-h-0 transition-all duration-300 relative overflow-hidden`}>
      <div className={`p-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 rounded-t-xl shrink-0`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${textColor}`}><Icon className="w-3.5 h-3.5" /></div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[10px] font-black text-slate-950 dark:text-white uppercase leading-none">{displayTitle}</h3>
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">{theme.target} {themeCategory === 'FIXA' || themeCategory === 'VARIÁVEL' || themeCategory === 'PASSIVOS' ? '' : 'META'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-0 leading-none">
            <span className={`text-base font-black text-slate-900 dark:text-white tabular-nums`}>{formatCurrency(total)}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{percentage.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-0.5 ml-2 border-l border-slate-200 dark:border-slate-800 pl-1.5">
            {isDividas && (
              <button 
                onClick={() => {
                  console.log('[DEBUG] Botão MASTER clicado para a categoria:', themeCategory);
                  onLinkMaster?.();
                }} 
                className="p-1.5 hover:bg-violet-500/10 dark:hover:bg-violet-500/20 rounded-lg text-violet-500 transition-all group flex items-center gap-1.5" 
                title="Vincular Dívida Master"
              >
                <Landmark className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-black uppercase tracking-widest hidden lg:inline">Master</span>
              </button>
            )}
            {!isDividas && onAdd && (
              <button onClick={onAdd} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group" title="Novo Lançamento">
                <Plus className="w-3.5 h-3.5 transition-transform group-hover:scale-125" />
              </button>
            )}
            {!isExpanded && onExpand && (<button onClick={onExpand} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all group" title="Expandir"><Maximize2 className="w-3.5 h-3.5" /></button>)}
          </div>
        </div>
      </div>
      <div className={`p-2 flex-grow flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden`}>
        <div className={`grid ${gridClass} gap-2 px-2 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 pb-1 shrink-0`}>
          <div className="text-left">TAG</div>
          <div className="text-left">TIPO</div>
          <div className="text-left">Item</div>
          <div className="text-center">Valor</div>
          {isDividas ? (
            <div className="text-center">Parcelas</div>
          ) : (
            <div className="text-center">Ciclo</div>
          )}
          <div className="text-right"></div>
        </div>
        <div className={`flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-0.5 relative min-h-0`}>
          {items.length === 0 ? (<div className="h-full flex items-center justify-center border border-dashed border-slate-100 dark:border-slate-800/50 rounded-lg bg-slate-50/20 dark:bg-slate-950/20"><p className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">Nenhum Dado</p></div>) : (
            items.map((item) => {
              const quitado = isItemQuitado?.(item, item.category);
              const isCancelled = item.isCancelled === true;
              const isMaster = !!item.masterDebtId;
              const isManualParcels = item.installmentValues && item.installmentValues.length > 0;
              
              return (
                <div key={item.id} className={`grid ${gridClass} gap-2 items-center p-1 transition-all group/item rounded-lg relative z-0 hover:z-[10] ${isCancelled ? 'bg-rose-500/5 opacity-80 grayscale' : quitado ? 'bg-emerald-500/5 opacity-60' : 'bg-slate-50/40 dark:bg-slate-950/20'} hover:bg-slate-200/40 dark:hover:bg-slate-800/40`}>
                  <div className="min-w-0"><TagInput value={item.subCategory} customColor={item.subCategoryColor} onChange={(val: string, color?: string) => { if (!isCancelled) { onUpdate(item.category, item.id, 'subCategory', val); onUpdate(item.category, item.id, 'subCategoryColor', color); } }} onOpenModal={() => !isCancelled && onOpenAddTag(item.category, item.id)} onOpenEditTag={(tag: SubCategoryTag) => onOpenEditTag(item.category, tag)} onRemoveTag={(tagName: string) => onRequestRemoveTag(item.category, tagName)} isTagInUse={(tagName: string) => isTagInUse(item.category, tagName)} suggestions={registeredTags} theme={theme} disabled={isCancelled || isMaster} /></div>
                  <div className="flex"><DebtTypeSelector category={item.category} value={item.debtType} onChange={(val) => onUpdate(item.category, item.id, 'debtType', val)} disabled={isCancelled || isMaster} /></div>
                  <div className="flex"><div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-[26px] px-1.5 rounded shadow-sm w-full"><FileText className="w-3 h-3 text-slate-300 mr-1 shrink-0" /><input type="text" disabled={isCancelled || isMaster} placeholder="..." value={item.item} onChange={(e) => onUpdate(item.category, item.id, 'item', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} className={`w-full bg-transparent border-none outline-none font-black text-[10px] text-slate-800 dark:text-slate-200 placeholder:text-slate-300 truncate ${isCancelled ? 'line-through' : ''}`} />{isCancelled ? <Ban className="w-3 h-3 text-rose-500 shrink-0 ml-1" /> : quitado ? <Check className="w-3 h-3 text-emerald-500 shrink-0 ml-1" /> : isMaster ? <Landmark className="w-2.5 h-2.5 text-violet-500 ml-1 shrink-0" /> : null}</div></div>
                  <div className="flex"><div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-[26px] px-1.5 rounded shadow-sm w-full"><span className="text-[10px] text-slate-400 font-black mr-0.5">R$</span><input type="number" disabled={isCancelled || isMaster || isManualParcels} value={item.value || ''} onChange={(e) => onUpdate(item.category, item.id, 'value', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} className={`bg-transparent border-none outline-none text-right w-full font-black text-[10px] ${isManualParcels ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`} />{isManualParcels && <SlidersHorizontal className="w-2.5 h-2.5 text-amber-500 ml-1" />}</div></div>
                  {isDividas ? (
                    <div className="flex">
                      <button 
                        onClick={() => !isCancelled && !isMaster && onOpenInstallments(item.category, item.id)}
                        disabled={isCancelled || isMaster}
                        className={`flex items-center justify-center bg-white dark:bg-slate-950 border h-[26px] px-1.5 rounded shadow-sm w-full transition-all ${isMaster ? 'border-slate-200 dark:border-slate-800 cursor-not-allowed' : 'border-slate-200 dark:border-slate-800 hover:border-sky-500/50'}`}
                      >
                        <Hash className={`w-3 h-3 mr-1 shrink-0 ${isManualParcels ? 'text-amber-500' : 'text-slate-300'}`} />
                        <span className={`text-[10px] font-black ${isManualParcels ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400'}`}>
                          {getMasterInstallmentLabel(item)}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex">
                      <button onClick={() => !isCancelled && onOpenFreq(item.category, item.id)} disabled={isCancelled} className="h-[26px] w-full px-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[10px] font-black uppercase flex items-center justify-between gap-1 hover:border-slate-400 dark:hover:border-slate-600 transition-all shadow-sm group/btn overflow-hidden"><CalendarDays className="w-3 h-3 text-slate-400 group-hover/btn:text-slate-900 dark:group-hover/btn:text-white shrink-0" /><span className="truncate flex-grow text-center text-slate-600 dark:text-slate-400 group-hover/btn:text-slate-900 dark:group-hover/btn:text-white tabular-nums tracking-tighter">{getFreqLabel(item.frequency)}</span><Settings2 className="w-2.5 h-2.5 text-slate-300 group-hover/btn:text-slate-500 shrink-0" /></button>
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-1">
                    {isCancelled && (
                      <button onClick={() => onReactivate(item.id)} className="h-[26px] px-2 rounded border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[9px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-sky-500 hover:text-white transition-all shadow-sm group/reactivate" title="Reativar Item">
                        <Undo2 className="w-3 h-3 group-hover/reactivate:scale-110 transition-transform" />
                        <span className="hidden lg:inline">Reativar</span>
                      </button>
                    )}
                    <button onClick={() => onRequestRemove(item.category, item.id, item.item || 'Item')} className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const Registro: React.FC<RegistroProps> = ({ 
  data, setData, customTags, setCustomTags, entries, isHeaderPinned, activeYear, masterDebts, setMasterDebts 
}) => {
  const [groupMode, setGroupMode] = useState<'CATEGORIA' | 'TIPO'>('CATEGORIA');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingFreq, setEditingFreq] = useState<{ cat: CategoryType, id: string } | null>(null);
  const [tagModalConfig, setTagModalConfig] = useState<{ cat: CategoryType, itemId?: string, editTag?: SubCategoryTag } | null>(null);
  const [itemToRemove, setItemToRemove] = useState<{ category: CategoryType, id: string, name: string } | null>(null);
  const [tagToRemove, setTagToRemove] = useState<{ category: CategoryType, name: string } | null>(null);
  const [isLinkingMaster, setIsLinkingMaster] = useState(false);
  const [editingInstallments, setEditingInstallments] = useState<{ cat: CategoryType, id: string } | null>(null);
  const [viewStatus, setViewStatus] = useState<'ABERTO' | 'QUITADO' | 'CANCELADO'>('ABERTO');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => { if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setIsAddMenuOpen(false); };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const isItemQuitado = (item: FinancialItem, category: string): boolean => {
    if (item.masterDebtId) {
      const master = (masterDebts || []).find(d => d.id === item.masterDebtId);
      return master ? master.status === 'paid' : false;
    }
    if (!item.installments || item.installments <= 1) return false;
    const itemEntries = (entries || []).filter(e => e.itemId === item.id && e.category === category);
    if (itemEntries.length === 0) return false;
    const paidEntries = itemEntries.filter(e => e.status === 'Pago');
    return paidEntries.length >= item.installments;
  };

  const allItems = useMemo(() => {
    return (Object.entries(data) as [CategoryType, FinancialItem[]][]).flatMap(([cat, items]) => 
      items.map(i => ({ ...i, category: cat }))
    );
  }, [data]);

  const displayGroups = useMemo(() => {
    const filterByStatus = (items: (FinancialItem & { category: CategoryType })[]) => {
      return items.filter(item => {
        if (viewStatus === 'CANCELADO') return item.isCancelled === true;
        if (item.isCancelled) return false;
        const quitado = isItemQuitado(item, item.category);
        if (viewStatus === 'ABERTO') return !quitado;
        if (viewStatus === 'QUITADO') return quitado;
        return true;
      });
    };

    if (groupMode === 'CATEGORIA') {
      return CATEGORIES.map(cat => ({
        id: cat,
        label: cat,
        themeCategory: cat,
        items: filterByStatus((data[cat] || []).map(i => ({ ...i, category: cat }))),
        onAdd: () => handleAddItem(cat)
      }));
    } else {
      const getItemsByType = (type: DebtType) => {
        return allItems.filter(i => {
          const effectiveType = i.debtType || (i.category === 'DÍVIDAS' ? 'PASSIVOS' : 'DESPESAS FIXAS');
          return effectiveType === type;
        });
      };

      return [
        { 
          id: 'DESPESAS FIXAS', 
          label: 'FIXA', 
          themeCategory: 'FIXA' as const, 
          items: filterByStatus(getItemsByType('DESPESAS FIXAS')),
          onAdd: () => handleAddItem('ESSENCIAIS')
        },
        { 
          id: 'GASTOS VARIÁVEIS', 
          label: 'VARIÁVEL', 
          themeCategory: 'VARIÁVEL' as const, 
          items: filterByStatus(getItemsByType('GASTOS VARIÁVEIS')),
          onAdd: () => handleAddItem('QUALIDADE DE VIDA')
        },
        { 
          id: 'PASSIVOS', 
          label: 'PASSIVOS', 
          themeCategory: 'PASSIVOS' as const, 
          items: filterByStatus(getItemsByType('PASSIVOS')),
          // DÍVIDAS card doesn't have onAdd as per user request to prevent direct add
          onAdd: undefined
        },
        { 
          id: 'EMPTY', 
          label: 'RESERVA', 
          themeCategory: 'ESSENCIAIS' as const, 
          items: [], 
          isEmpty: true,
          onAdd: undefined
        }
      ];
    }
  }, [groupMode, data, allItems, viewStatus, masterDebts]);

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    let geral = 0;
    
    displayGroups.forEach(group => {
      const groupTotal = group.items.reduce((acc, item) => {
        if (item.installmentValues && item.installmentValues.length > 0) {
          return acc + (Number(item.installmentValues[0]) || 0);
        }
        return acc + (Number(item.value) || 0);
      }, 0);
      t[group.id] = groupTotal;
      if (!group.isEmpty) geral += groupTotal;
    });

    const categoryTotals: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      categoryTotals[cat] = (data[cat] || []).filter(item => {
        if (viewStatus === 'CANCELADO') return item.isCancelled === true;
        if (item.isCancelled) return false;
        const quitado = isItemQuitado(item, cat);
        if (viewStatus === 'ABERTO') return !quitado;
        if (viewStatus === 'QUITADO') return quitado;
        return true;
      }).reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    });

    return { groups: t, categories: categoryTotals, GERAL: geral };
  }, [displayGroups, data, viewStatus, masterDebts]);

  const handleAddItem = (category: CategoryType) => {
    const newItem: FinancialItem = {
      id: crypto.randomUUID(),
      item: '',
      value: 0,
      subCategory: '-',
      debtType: category === 'DÍVIDAS' ? 'PASSIVOS' : 'DESPESAS FIXAS',
      frequency: {
        type: 'mensal',
        startMonth: 1,
        startYear: activeYear,
        dueDay: 10
      }
    };
    setData(prev => ({ ...prev, [category]: [...(prev[category] || []), newItem] }));
    setIsAddMenuOpen(false);
  };

  const handleUpdateItem = (category: CategoryType, id: string, field: keyof FinancialItem, value: any) => {
    setData(prev => ({
      ...prev,
      [category]: (prev[category] || []).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleReactivateItem = (id: string) => {
    setData(prev => {
      const next = { ...prev };
      (Object.keys(next) as CategoryType[]).forEach(cat => {
        next[cat] = next[cat].map(item => 
          item.id === id ? { ...item, isCancelled: false, cancelledMonth: undefined, cancelledYear: undefined } : item
        );
      });
      return next;
    });
  };

  const handleRemoveItem = () => {
    if (!itemToRemove) return;
    setData(prev => ({
      ...prev,
      [itemToRemove.category]: prev[itemToRemove.category].filter(i => i.id !== itemToRemove.id)
    }));
    setItemToRemove(null);
  };

  const handleSaveTag = (category: CategoryType, tag: SubCategoryTag, itemId?: string, oldTagName?: string) => {
    if (oldTagName) {
      setData(prev => ({
        ...prev,
        [category]: (prev[category] || []).map(item => 
          item.subCategory === oldTagName ? { ...item, subCategory: tag.name, subCategoryColor: tag.colorClass } : item
        )
      }));
    }
    setCustomTags(prev => {
      const tags = [...(prev[category] || [])];
      if (oldTagName) {
        const idx = tags.findIndex(t => t.name === oldTagName);
        if (idx > -1) tags[idx] = tag;
      } else {
        tags.push(tag);
        if (itemId) handleUpdateItem(category, itemId, 'subCategory', tag.name);
      }
      return { ...prev, [category]: tags };
    });
    setTagModalConfig(null);
  };

  const handleRemoveTag = () => {
    if (!tagToRemove) return;
    setCustomTags(prev => ({
      ...prev,
      [tagToRemove.category]: prev[tagToRemove.category].filter(t => t.name !== tagToRemove.name)
    }));
    setTagToRemove(null);
  };

  const handleLinkMasterDebt = (debt: MasterDebt) => {
    console.log('[DEBUG] Processando vínculo da dívida master:', debt.item);
    
    const newItem: FinancialItem = {
      id: crypto.randomUUID(),
      item: debt.item,
      value: debt.totalValue / debt.installmentsCount,
      subCategory: debt.subCategory || '-',
      subCategoryColor: debt.subCategoryColor,
      debtType: 'PASSIVOS',
      masterDebtId: debt.id,
      installments: debt.installmentsCount,
      frequency: {
        type: 'mensal',
        startMonth: 1,
        startYear: activeYear,
        dueDay: debt.dueDay
      }
    };

    setData(prev => {
      const next = { ...prev };
      next['DÍVIDAS'] = [...(next['DÍVIDAS'] || []), newItem];
      console.log('[DEBUG] Novo estado de dados de DÍVIDAS após vínculo:', next['DÍVIDAS']);
      return next;
    });

    setIsLinkingMaster(false);
    console.log('[DEBUG] Dívida master vinculada e modal fechado.');
  };

  const activeItem = editingFreq ? (data[editingFreq.cat] || []).find(i => i.id === editingFreq.id) : null;
  const activeInstallmentItem = editingInstallments ? (data[editingInstallments.cat] || []).find(i => i.id === editingInstallments.id) : null;

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col overflow-hidden relative animate-in fade-in duration-500">
      {editingFreq && activeItem && (
        <FrequencyModal item={activeItem} onClose={() => setEditingFreq(null)} onSave={(config) => { handleUpdateItem(editingFreq.cat, editingFreq.id, 'frequency', config); setEditingFreq(null); }} activeYear={activeYear} />
      )}
      {editingInstallments && activeInstallmentItem && (
        <InstallmentManagerModal item={activeInstallmentItem} onClose={() => setEditingInstallments(null)} onSave={(count, values) => { handleUpdateItem(editingInstallments.cat, editingInstallments.id, 'installments', count); handleUpdateItem(editingInstallments.cat, editingInstallments.id, 'installmentValues', values); setEditingInstallments(null); }} />
      )}
      {tagModalConfig && (
        <TagModal 
          category={tagModalConfig.cat} 
          initialTag={tagModalConfig.editTag}
          onClose={() => setTagModalConfig(null)} 
          onSave={(tag: SubCategoryTag) => handleSaveTag(tagModalConfig.cat, tag, tagModalConfig.itemId, tagModalConfig.editTag?.name)} 
        />
      )}
      {itemToRemove && (
        <DeleteConfirmModal category={itemToRemove.category} itemName={itemToRemove.name} onClose={() => setItemToRemove(null)} onConfirm={handleRemoveItem} />
      )}
      {tagToRemove && (
        <DeleteTagConfirmModal tagName={tagToRemove.name} onClose={() => setTagToRemove(null)} onConfirm={handleRemoveTag} />
      )}
      {isLinkingMaster && (
        <LinkMasterModal 
          debts={masterDebts || []} 
          linkedDebtIds={allItems.filter(i => !!i.masterDebtId).map(i => i.masterDebtId!)} 
          onClose={() => setIsLinkingMaster(false)} 
          onSelect={handleLinkMasterDebt} 
        />
      )}

      {!isHeaderPinned && <div onMouseEnter={() => setIsHeaderHovered(true)} className="fixed top-[76px] left-0 w-full h-8 z-[950] bg-transparent" />}

      <div onMouseEnter={() => setIsHeaderHovered(true)} onMouseLeave={() => setIsHeaderHovered(false)} className={`transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 ${isHeaderPinned ? 'opacity-100 mb-3' : 'h-0 opacity-0 mb-0 overflow-visible'}`}>
        <div className={`transition-all duration-500 ${(isHeaderPinned || isHeaderHovered) ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
            <div className="flex items-center gap-4 border-r border-slate-100 dark:border-slate-800 pr-4">
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5 mb-0.5"><span className="h-0.5 w-2.5 bg-slate-900 dark:bg-white rounded-full"></span><span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-700 dark:text-slate-50">Ativos {activeYear}</span></div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">Inventário Patrimonial</h2>
              </div>
              <div className="relative" ref={addMenuRef}>
                <button 
                  onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all ml-2"
                >
                  <Plus className="w-4 h-4" /> Novo Item
                </button>
                {isAddMenuOpen && (
                  <div className="absolute top-full left-2 mt-2 w-48 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[1500] p-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <span className="block px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 mb-1">Selecionar Destino</span>
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => handleAddItem(cat)}
                        className="w-full px-3 py-2 text-left text-[10px] font-black uppercase rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 flex items-center gap-2"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${cat === 'ESSENCIAIS' ? 'bg-emerald-500' : cat === 'QUALIDADE DE VIDA' ? 'bg-sky-500' : cat === 'FUTURO' ? 'bg-rose-500' : 'bg-violet-500'}`} />
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
              {CATEGORIES.map(cat => {
                const catTotal = totals.categories[cat] || 0;
                const catPercentage = totals.GERAL > 0 ? (catTotal / totals.GERAL) * 100 : 0;
                const getColors = (c: CategoryType) => { switch (c) { case 'ESSENCIAIS': return { bar: 'bg-emerald-500', text: 'text-emerald-600' }; case 'QUALIDADE DE VIDA': return { bar: 'bg-sky-500', text: 'text-sky-600' }; case 'FUTURO': return { bar: 'bg-rose-500', text: 'text-rose-600' }; case 'DÍVIDAS': return { bar: 'bg-violet-500', text: 'text-violet-600' }; default: return { bar: 'bg-slate-500', text: 'text-slate-600' }; } };
                const colors = getColors(cat);
                return (
                  <div key={cat} className="flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-0.5"><span className={`text-[9px] font-black uppercase tracking-widest ${colors.text}`}>{cat}</span><span className="text-[9px] font-black text-slate-950 dark:text-slate-300">{catPercentage.toFixed(1)}%</span></div>
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${colors.bar} transition-all duration-700`} style={{ width: `${catPercentage}%` }}></div></div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 border-l border-slate-100 dark:border-slate-800/80 pl-4">
              <div className="flex flex-col gap-1 mr-4">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Visão</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button onClick={() => setGroupMode('CATEGORIA')} className={`p-1.5 rounded-md transition-all ${groupMode === 'CATEGORIA' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Visão por Categorias"><LayoutGrid className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setGroupMode('TIPO')} className={`p-1.5 rounded-md transition-all ${groupMode === 'TIPO' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Visão por Tipo de Dívida"><ListFilter className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 mb-0.5"><TrendingUp className="w-2.5 h-2.5 text-slate-700 dark:text-slate-50" /><span className="text-[9px] font-black text-slate-700 dark:text-slate-50 uppercase tracking-widest">Patrimônio</span></div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{formatCurrency(totals.GERAL)}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 mx-1"></div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  {(['ABERTO', 'QUITADO', 'CANCELADO'] as const).map((status) => (
                    <button key={status} onClick={() => setViewStatus(status)} className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${viewStatus === status ? 'bg-[#0F172A] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{status}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex-grow grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-3 min-h-0`}>
        {displayGroups.map((group) => (
          <CategoryCard 
            key={group.id}
            displayTitle={group.label}
            themeCategory={group.themeCategory}
            items={group.items}
            onAdd={group.onAdd}
            onRequestRemove={(cat, id, name) => setItemToRemove({ category: cat, id, name })}
            onUpdate={handleUpdateItem}
            onReactivate={handleReactivateItem}
            onOpenFreq={(cat, id) => setEditingFreq({ cat: cat as CategoryType, id })}
            onOpenAddTag={(cat, id) => setTagModalConfig({ cat: cat as CategoryType, itemId: id })}
            onOpenEditTag={(cat, tag) => setTagModalConfig({ cat: cat as CategoryType, editTag: tag })}
            onRequestRemoveTag={(cat, name) => setTagToRemove({ category: cat as CategoryType, name })}
            isTagInUse={(cat, name) => (data[cat as CategoryType] || []).some(item => item.subCategory === name)}
            total={totals.groups[group.id] || 0}
            totalGeral={totals.GERAL}
            formatCurrency={formatCurrency}
            registeredTags={groupMode === 'CATEGORIA' ? (customTags[group.id as CategoryType] || []) : Object.values(customTags).flat()}
            onExpand={() => setExpandedCategory(group.id)}
            isItemQuitado={isItemQuitado}
            isHeaderPinned={isHeaderPinned}
            onLinkMaster={() => setIsLinkingMaster(true)}
            onOpenInstallments={(cat, id) => setEditingInstallments({ cat: cat as CategoryType, id })}
            masterDebts={masterDebts}
            isEmptyView={group.isEmpty}
          />
        ))}
      </div>

      {expandedCategory && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-10 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-7xl h-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 relative">
             <div className="absolute top-6 right-6 z-[2001]"><button onClick={() => setExpandedCategory(null)} className="p-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-200 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 transition-all hover:scale-110"><X className="w-6 h-6" /></button></div>
             <div className="flex-grow rounded-2xl shadow-2xl overflow-hidden">
                {(() => {
                  const group = displayGroups.find(g => g.id === expandedCategory);
                  if (!group) return null;
                  return (
                    <CategoryCard 
                      isExpanded={true}
                      displayTitle={group.label}
                      themeCategory={group.themeCategory}
                      items={group.items}
                      onAdd={group.onAdd}
                      onRequestRemove={(cat, id, name) => setItemToRemove({ category: cat, id, name })}
                      onUpdate={handleUpdateItem}
                      onReactivate={handleReactivateItem}
                      onOpenFreq={(cat, id) => setEditingFreq({ cat: cat as CategoryType, id })}
                      onOpenAddTag={(cat, id) => setTagModalConfig({ cat: cat as CategoryType, itemId: id })}
                      onOpenEditTag={(cat, tag) => setTagModalConfig({ cat: cat as CategoryType, editTag: tag })}
                      onRequestRemoveTag={(cat, name) => setTagToRemove({ category: cat as CategoryType, name })}
                      isTagInUse={(cat, name) => (data[cat as CategoryType] || []).some(item => item.subCategory === name)}
                      total={totals.groups[group.id] || 0}
                      totalGeral={totals.GERAL}
                      formatCurrency={formatCurrency}
                      registeredTags={groupMode === 'CATEGORIA' ? (customTags[group.id as CategoryType] || []) : Object.values(customTags).flat()}
                      onClose={() => setExpandedCategory(null)}
                      isItemQuitado={isItemQuitado}
                      isHeaderPinned={isHeaderPinned}
                      onLinkMaster={() => setIsLinkingMaster(true)}
                      onOpenInstallments={(cat, id) => setEditingInstallments({ cat: cat as CategoryType, id })}
                      masterDebts={masterDebts}
                    />
                  );
                })()}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface InstallmentManagerModalProps {
  item: FinancialItem;
  onClose: () => void;
  onSave: (count: number, values?: number[]) => void;
}

const InstallmentManagerModal: React.FC<InstallmentManagerModalProps> = ({ item, onClose, onSave }) => {
  const [count, setCount] = useState<string>(item.installments?.toString() || '1');
  const [calcMode, setCalcMode] = useState<'auto' | 'manual'>(item.installmentValues && item.installmentValues.length > 0 ? 'manual' : 'auto');
  const [localValues, setLocalValues] = useState<number[]>(item.installmentValues || []);

  useEffect(() => {
    if (calcMode === 'auto') {
      setLocalValues([]);
    } else if (calcMode === 'manual' && localValues.length === 0) {
      const n = parseInt(count) || 1;
      setLocalValues(Array(n).fill(Number(item.value) || 0));
    }
  }, [calcMode]);

  useEffect(() => {
    const n = parseInt(count) || 1;
    if (calcMode === 'manual') {
      if (localValues.length < n) {
        setLocalValues([...localValues, ...Array(n - localValues.length).fill(Number(item.value) || 0)]);
      } else if (localValues.length > n) {
        setLocalValues(localValues.slice(0, n));
      }
    }
  }, [count]);

  const updateVal = (idx: number, val: string) => {
    const next = [...localValues];
    next[idx] = parseFloat(val) || 0;
    setLocalValues(next);
  };

  const totalSum = useMemo(() => {
    if (calcMode === 'auto') return (parseFloat(count) || 1) * (Number(item.value) || 0);
    return localValues.reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [count, calcMode, localValues, item.value]);

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#020617] w-full max-w-7xl rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#020617]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-600 text-white rounded-2xl shadow-lg"><SlidersHorizontal className="w-5 h-5" /></div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">Gestor de Parcelamento Real</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.item || 'Lançamento Estratégico'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-80 shrink-0 p-8 bg-slate-50/50 dark:bg-slate-950/40 border-r border-slate-100 dark:border-slate-800 space-y-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Qtd de Parcelas</label>
              <input 
                type="number" 
                min="1" 
                max="120"
                value={count} 
                onChange={(e) => setCount(e.target.value)}
                className="w-full h-14 px-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-base font-black text-center outline-none focus:border-sky-500 transition-all text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Modo de Operação</label>
              <button 
                onClick={() => setCalcMode('auto')}
                className={`w-full py-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between px-6 ${calcMode === 'auto' ? 'bg-sky-600 text-white border-transparent shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}
              >
                <span>Automático</span>
                <Check className={`w-4 h-4 ${calcMode === 'auto' ? 'opacity-100' : 'opacity-0'}`} />
              </button>
              <button 
                onClick={() => setCalcMode('manual')}
                className={`w-full py-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between px-6 ${calcMode === 'manual' ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}
              >
                <span>Manual (Auditoria)</span>
                <Check className={`w-4 h-4 ${calcMode === 'manual' ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            </div>

            <div className="p-6 bg-slate-900 dark:bg-[#0F172A] rounded-2xl border-2 border-sky-500/20 shadow-2xl mt-auto">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 block">Valor Total Ciclo</span>
              <span className="text-2xl font-black text-white tabular-nums leading-none block">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSum)}
              </span>
            </div>
          </div>

          <div className="flex-grow p-8 bg-white dark:bg-slate-950 overflow-y-auto custom-scrollbar">
            {calcMode === 'auto' ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-20 space-y-6">
                <div className="p-6 bg-sky-500/10 rounded-full"><Info className="w-12 h-12 text-sky-500" /></div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Modo Automático Ativo</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[320px]">O sistema sincronizará o valor fixo de <span className="font-black text-slate-700 dark:text-slate-300">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.value) || 0)}</span> em todas as <span className="font-black text-slate-700 dark:text-slate-300">{count} parcelas</span> projetadas.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl w-fit">
                   <Calculator className="w-5 h-5 text-amber-500" />
                   <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Auditoria de Valores Individuais Ativa</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-20">
                  {localValues.map((v, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-amber-500/30 transition-all hover:shadow-lg">
                       <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[11px] font-black text-slate-400 shadow-sm group-hover:text-amber-500 transition-colors">{String(i+1).padStart(2, '0')}</div>
                       <div className="flex-grow">
                          <span className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1 tracking-widest">Parcela</span>
                          <div className="relative">
                             <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">R$</span>
                             <input 
                               type="number" 
                               value={v} 
                               onChange={(e) => updateVal(i, e.target.value)}
                               className="w-full bg-transparent border-none outline-none font-black text-base text-slate-900 dark:text-white pl-7 tabular-nums" 
                             />
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="px-10 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-rose-500 transition-colors">Cancelar</button>
          <button 
            onClick={() => onSave(parseInt(count) || 1, calcMode === 'manual' ? localValues : undefined)}
            className="px-16 py-4 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4"
          >
            <Check className="w-5 h-5" /> Aplicar Configuração Estratégica
          </button>
        </div>
      </div>
    </div>
  );
};

interface FrequencyModalProps {
  item: FinancialItem;
  onClose: () => void;
  onSave: (config: FrequencyConfig) => void;
  activeYear: number;
}

const FrequencyModal: React.FC<FrequencyModalProps> = ({ item, onClose, onSave, activeYear }) => {
  const initialConfig: FrequencyConfig = item.frequency || { type: 'mensal', startMonth: 1, startYear: activeYear, dueDay: 10 };
  const [draft, setDraft] = useState<FrequencyConfig>(initialConfig);
  
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') onSave(draft);
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [onClose, onSave, draft]);

  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const weekDays = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
  const weekDaysShort = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const cycleOptions: FrequencyType[] = ['mensal', 'quinzenal', 'semanal', 'trimestral', 'semestral', 'anual'];
  
  const freqData = useMemo(() => {
    const getFreqMultiplier = (type: FrequencyType) => { switch (type) { case 'mensal': return 12; case 'quinzenal': return 24; case 'semanal': return 52; case 'trimestral': return 4; case 'semestral': return 2; case 'anual': return 1; default: return 12; } };
    const multiplier = getFreqMultiplier(draft.type);
    const totalAnnual = (item.value || 0) * multiplier;
    let monthlyProjection = 0;
    if (draft.type === 'mensal') monthlyProjection = item.value;
    else if (draft.type === 'quinzenal') monthlyProjection = item.value * 2;
    else if (draft.type === 'semanal') monthlyProjection = (item.value * 52) / 12;
    else monthlyProjection = totalAnnual / 12;
    return { multiplier, totalAnnual, monthlyProjection };
  }, [draft.type, item.value]);

  const daysInMonth = useMemo(() => new Date(activeYear, draft.startMonth, 0).getDate(), [activeYear, draft.startMonth]);
  
  const secondQuinzenaDay = useMemo(() => {
    if (draft.type !== 'quinzenal') return null;
    const day = draft.dueDay || 1;
    const next = day + 15;
    return Math.min(next, daysInMonth);
  }, [draft.type, draft.dueDay, daysInMonth]);

  const formatCurrencyLocal = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const renderStrategicSummary = () => {
    const valMês = formatCurrencyLocal(freqData.monthlyProjection);
    const valAno = formatCurrencyLocal(freqData.totalAnnual);
    const dia = String(draft.dueDay || 1).padStart(2, '0');
    switch (draft.type) {
      case 'mensal': return (<>Pagamento todo dia <span className="text-white font-black">{dia}</span>. Custo projetado: <span className="text-emerald-400 font-black">{valMês}/mês</span> x <span className="text-emerald-400 font-black">{valAno}/ano</span>.</>);
      case 'quinzenal': 
        const dia2 = String(secondQuinzenaDay).padStart(2, '0');
        return (<>Ciclo quinzenal: 1ª Q: <span className="text-white font-black">{dia}</span> | 2ª Q: <span className="text-white font-black">{dia2}</span>. Custo projetado: <span className="text-emerald-400 font-black">{valMês}/mês</span> x <span className="text-emerald-400 font-black">{valAno}/ano</span>.</>);
      case 'semanal': return (<>Pagamento toda <span className="text-white font-black">{weekDays[draft.weeklyDay || 0]}</span>. Custo projetado: <span className="text-emerald-400 font-black">{valMês}/mês</span> x <span className="text-emerald-400 font-black">{valAno}/ano</span>.</>);
      default: return (<>Ciclo <span className="text-white font-black uppercase">{draft.type}</span>. Custo médio: <span className="text-emerald-400 font-black">{valMês}/mês</span> x <span className="text-emerald-400 font-black">{valAno}/ano</span>.</>);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-[900px] h-[580px] rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="px-6 h-[64px] shrink-0 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900"><div className="flex items-center gap-4"><div className="p-2 bg-[#0F172A] dark:bg-white rounded-xl shadow-lg"><CalendarRange className="w-4 h-4 text-white dark:text-[#0F172A]" /></div><div><h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1">Configurador Estratégico {activeYear}</h2><p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Sincronização do Ciclo Temporal</p></div></div><button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all"><X className="w-5 h-5" /></button></div>
        <div className="flex-grow flex overflow-hidden"><div className="w-[315px] shrink-0 p-5 border-r border-slate-100 dark:border-slate-800 flex flex-col gap-8 overflow-y-auto custom-scrollbar bg-slate-50/20 dark:bg-slate-950/20"><div><label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3"><Layers className="w-3 h-3" /> Tipo de Ciclo</label><div className="grid grid-cols-2 gap-1.5">{cycleOptions.map(opt => (<button key={opt} onClick={() => setDraft({...draft, type: opt, dueDay: opt === 'quinzenal' && (draft.dueDay || 0) > 15 ? 1 : draft.dueDay})} className={`h-9 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all border-2 ${draft.type === opt ? 'bg-[#0F172A] dark:bg-slate-200 text-white dark:text-slate-950 border-transparent shadow-md' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>{opt}</button>))}</div></div><div><label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3"><CalendarDays className="w-3 h-3" /> Mês de Início</label><div className="grid grid-cols-4 gap-1.5">{months.map((m, i) => (<button key={m} onClick={() => setDraft({...draft, startMonth: i + 1})} className={`h-8 rounded-lg text-[11px] font-black uppercase transition-all border-2 ${draft.startMonth === i + 1 ? 'bg-[#0F172A] dark:bg-slate-200 text-white dark:text-slate-950 border-transparent shadow-md' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>{m}</button>))}</div></div></div><div className="flex-grow p-6 flex flex-col bg-white dark:bg-slate-900 overflow-hidden"><div className="flex items-center justify-between mb-3 shrink-0"><label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest"><Clock className="w-3.5 h-3.5" /> Dia do Vencimento</label>{draft.type !== 'semanal' && (<span className="text-[11px] font-black text-slate-300 dark:text-slate-600 italic uppercase tracking-widest">Limite do mês: {daysInMonth} Dias</span>)}</div><div className="flex-grow bg-[#F8FAFC] dark:bg-slate-950/40 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-center mb-4 overflow-hidden shadow-inner">{draft.type === 'semanal' ? (<div className="grid grid-cols-7 gap-2.5 w-full max-w-[460px] justify-items-center">{weekDaysShort.map((day, idx) => (<div key={day} className="flex flex-col gap-1.5 items-center"><span className="text-[11px] font-black text-slate-400 dark:text-slate-50">{day}</span><button onClick={() => setDraft({...draft, weeklyDay: idx})} className={`w-12 h-12 rounded-xl flex items-center justify-center text-[12px] font-black border-2 transition-all ${draft.weeklyDay === idx ? 'bg-[#0F172A] dark:bg-slate-200 text-white dark:text-slate-950 border-transparent shadow-lg scale-105' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'}`}>{day.substring(0, 1)}</button></div>))}</div>) : (<div className="grid grid-cols-7 gap-1.5 w-full max-w-[380px] justify-items-center">{weekDaysShort.map(d => (<div key={d} className="text-center text-[11px] font-black text-slate-300 dark:text-slate-600 mb-1 uppercase tracking-widest w-full">{d}</div>))}{Array.from({ length: 31 }).map((_, i) => { 
                  const day = i + 1; 
                  const isOutOfRange = day > daysInMonth; 
                  const isForbiddenQuinzenal = draft.type === 'quinzenal' && day > 15;
                  const isDisabled = isOutOfRange || isForbiddenQuinzenal;
                  const isSelected = draft.dueDay === day; 
                  const isSecondQuinzena = draft.type === 'quinzenal' && secondQuinzenaDay === day; 
                  return (
                    <button 
                      key={day} 
                      disabled={isDisabled} 
                      onClick={() => !isDisabled && setDraft({...draft, dueDay: day})} 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-black transition-all border-2 
                        ${isOutOfRange ? 'opacity-0 pointer-events-none' : isForbiddenQuinzenal ? 'opacity-20 cursor-not-allowed border-slate-200/50 text-slate-300 dark:text-slate-700 bg-slate-100/50 dark:bg-slate-900/50 pointer-events-none' : isSelected ? 'bg-[#0F172A] dark:bg-slate-200 text-white dark:text-slate-950 border-transparent shadow-lg scale-110 z-10' : isSecondQuinzena ? 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/40 border-dashed animate-pulse' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'}`}
                    >
                      {day}
                    </button>
                  ); 
                })}</div>)}</div><div className="bg-[#0F172A] dark:bg-slate-800 p-4 rounded-2xl flex items-center gap-5 shrink-0 relative overflow-hidden group border-2 border-slate-800/20 dark:border-slate-700 max-h-[120px]"><div className="p-2.5 bg-white/10 dark:bg-white/5 rounded-lg shadow-inner shrink-0"><Info className="w-4 h-4 text-white" /></div><div className="flex flex-col min-w-0"><h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">Resumo Estratégico {activeYear} <Zap className="w-2.5 h-2.5 text-amber-400 animate-pulse" /></h4><div className="text-[11px] text-slate-400 dark:text-slate-300 leading-snug font-black">{renderStrategicSummary()}</div></div></div></div></div>
        <div className="px-6 h-[80px] shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4"><button onClick={() => setDraft(initialConfig)} className="flex-grow max-w-[280px] h-[48px] rounded-xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]">Restaurar</button><button onClick={() => onSave(draft)} disabled={draft.type === 'semanal' ? draft.weeklyDay === undefined : !draft.dueDay} className="flex-grow h-[48px] bg-[#0F172A] dark:bg-slate-100 text-white dark:text-[#0F172A] rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl disabled:opacity-30 disabled:grayscale transition-all active:scale-[0.98]">Confirmar Ciclo {activeYear}</button></div>
      </div>
    </div>
  );
};

const TagModal: React.FC<any> = ({ category, initialTag, onClose, onSave }) => {
  const [tagName, setTagName] = useState(initialTag?.name || '');
  const [selectedColor, setSelectedColor] = useState(initialTag?.colorClass || 'bg-slate-500/10 text-slate-600 border-slate-500/20');
  
  const colorOptions = [{ label: 'Esmeralda', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }, { label: 'Céu', class: 'bg-sky-500/10 text-sky-600 border-sky-500/20' }, { label: 'Rosa', class: 'bg-rose-500/10 text-rose-600 border-rose-500/20' }, { label: 'Violeta', class: 'bg-violet-500/10 text-violet-600 border-violet-500/20' }, { label: 'Âmbar', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }, { label: 'Slate', class: 'bg-slate-500/10 text-slate-600 border-slate-500/20' }];
  const handleSave = () => { if (tagName.trim()) onSave({ name: tagName.trim(), colorClass: selectedColor }); };
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3"><div className="p-2 bg-slate-900 dark:bg-white rounded-lg">{initialTag ? <Edit2 className="w-5 h-5 text-white dark:text-slate-900" /> : <Plus className="w-5 h-5 text-white dark:text-slate-900" />}</div><h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{initialTag ? 'Editar Sub-Categoria' : 'Nova Sub-Categoria'}</h3></div>
        <div className="p-6 space-y-6">
          <div><label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Identificação Visual</label><input type="text" placeholder="Ex: MORADIA, LAZER..." value={tagName} onChange={(e) => setTagName(e.target.value.toUpperCase())} className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-black outline-none focus:border-slate-900 dark:focus:border-emerald-500 transition-all text-slate-900 dark:text-white placeholder:opacity-30" /></div>
          <div><label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Esquema de Cores</label><div className="grid grid-cols-3 gap-2">{colorOptions.map(opt => (<button key={opt.label} onClick={() => setSelectedColor(opt.class)} className={`px-2 py-2 rounded-lg text-[11px] font-black uppercase border-2 transition-all ${opt.class} ${selectedColor === opt.class ? 'ring-2 ring-slate-900 dark:ring-white scale-95 shadow-lg' : 'opacity-60 hover:opacity-100'}`}>{opt.label}</button>))}</div></div>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3"><button onClick={onClose} className="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500">Cancelar</button><button disabled={!tagName.trim()} onClick={handleSave} className="px-8 py-2.5 bg-[#0F172A] dark:bg-emerald-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest shadow-lg disabled:opacity-30 active:scale-95 transition-all">{initialTag ? 'Salvar Alterações' : 'Registrar Tag'}</button></div>
      </div>
    </div>
  );
};

const DeleteConfirmModal: React.FC<any> = ({ category, itemName, onClose, onConfirm }) => {
  const [confirmationText, setConfirmationText] = useState('');
  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border-2 border-rose-500/20 dark:border-rose-500/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-500/10"><AlertTriangle className="w-8 h-8" /></div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Excluir Registro?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Você está prestes a remover permanentemente <span className="font-black text-slate-900 dark:text-white uppercase">"{itemName}"</span> da categoria <span className="font-black text-slate-900 dark:text-white uppercase">"{category}"</span>.</p>
          <div className="mb-6"><label className="block text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">Digite "DELETAR" para confirmar</label><input type="text" value={confirmationText} onChange={(e) => setConfirmationText(e.target.value.toUpperCase())} autoFocus placeholder="CONFIRMAÇÃO..." className={`w-full h-12 bg-slate-50 dark:bg-slate-950 border-2 rounded-2xl text-center text-sm font-black outline-none transition-all ${confirmationText === 'DELETAR' ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 dark:border-slate-800 text-rose-500'}`} /></div>
          <div className="flex flex-col gap-3"><button disabled={confirmationText !== 'DELETAR'} onClick={onConfirm} className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Confirmar Exclusão</button><button onClick={onClose} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Manter Registro</button></div>
        </div>
      </div>
    </div>
  );
};

const DeleteTagConfirmModal: React.FC<any> = ({ tagName, onClose, onConfirm }) => {
  const [confirmationText, setConfirmationText] = useState('');
  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border-2 border-amber-500/20 dark:border-amber-500/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-500/10"><AlertTriangle className="w-8 h-8" /></div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Remover Tag?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Deseja excluir a tag <span className="font-black text-slate-900 dark:text-white uppercase">"{tagName}"</span>? Ela deixará de aparecer como sugestão.</p>
          <div className="mb-6"><label className="block text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2">Digite "DELETAR" para confirmar</label><input type="text" value={confirmationText} onChange={(e) => setConfirmationText(e.target.value.toUpperCase())} autoFocus placeholder="CONFIRMAÇÃO..." className={`w-full h-12 bg-slate-50 dark:bg-slate-950 border-2 rounded-2xl text-center text-sm font-black outline-none transition-all ${confirmationText === 'DELETAR' ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 dark:border-slate-800 text-amber-600'}`} /></div>
          <div className="flex flex-col gap-3"><button disabled={confirmationText !== 'DELETAR'} onClick={onConfirm} className="w-full py-4 bg-amber-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Confirmar Remoção</button><button onClick={onClose} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Manter Tag</button></div>
        </div>
      </div>
    </div>
  );
};

const LinkMasterModal: React.FC<{ debts: MasterDebt[], linkedDebtIds: string[], onClose: () => void, onSelect: (debt: MasterDebt) => void }> = ({ debts, linkedDebtIds, onClose, onSelect }) => {
  const availableDebts = (debts || []).filter(d => d.status !== 'paid' && !linkedDebtIds.includes(d.id));
  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500 text-white rounded-lg"><Landmark className="w-5 h-5" /></div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Ativar Dívida Master</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-3">
          {availableDebts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full"><Info className="w-8 h-8 text-slate-300" /></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest max-w-[300px]">Nenhuma dívida master disponível para vínculo</p>
            </div>
          ) : (
            availableDebts.map(d => (
              <button 
                key={d.id} 
                onClick={() => {
                  console.log('[DEBUG] Item da lista selecionado no modal MASTER:', d.item);
                  onSelect(d);
                }} 
                className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-violet-500 rounded-2xl transition-all group text-left"
              >
                <div className="flex-grow">
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-violet-500 transition-colors">{d.item}</span>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-black text-slate-500">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.totalValue)}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Registro;