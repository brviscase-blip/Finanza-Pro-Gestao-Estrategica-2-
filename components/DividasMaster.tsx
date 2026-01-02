
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, Landmark, DollarSign, Calendar, CalendarDays, Hash, Tag, X, Edit3, CheckCircle2, AlertCircle, Info, ChevronLeft, ChevronRight, Save, Calculator, PieChart, ShieldCheck, Clock, FileText, LayoutGrid, List, AlertTriangle, History, ArrowRight, ArrowDownCircle, Percent, Undo2, Link2, ChevronDown, ShieldAlert, RefreshCw, Copy, ClipboardCheck, Award, Sparkles } from 'lucide-react';
import { MasterDebt, MasterDebtInstallment, MonthlyEntry } from '../types';

const formatCurrency = (val: number) => {
  const safeVal = isNaN(val) ? 0 : val;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeVal);
};

const CustomDatePicker: React.FC<{ 
  value: string, 
  onChange: (date: string) => void, 
  placeholder?: string,
  icon?: React.ReactNode,
  activeColor?: string,
  disabled?: boolean
}> = ({ value, onChange, placeholder = "--/--/----", icon, activeColor = "text-sky-500", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [showYearSelector, setShowYearSelector] = useState(false);

  useEffect(() => {
    if (value && value.includes('-')) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) setViewDate(d);
    } else {
      setViewDate(new Date());
    }
  }, [value, isOpen]);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowYearSelector(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    const formattedDate = value.split('-').reverse().join('/');
    navigator.clipboard.writeText(formattedDate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    const pastedText = e.clipboardData.getData('text').trim();
    
    // Suporte a DD/MM/AAAA
    const brDateMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(pastedText);
    if (brDateMatch) {
      const [, d, m, y] = brDateMatch;
      onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
      return;
    }

    // Suporte a AAAA-MM-DD
    const isoDateMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(pastedText);
    if (isoDateMatch) {
      onChange(pastedText);
      return;
    }
  };

  const changeMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const selectYear = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setShowYearSelector(false);
  };

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

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 20 }, (_, i) => current - 5 + i);
  }, []);

  const displayValue = value ? value.split('-').reverse().join('/') : '';

  return (
    <div className={`relative w-full ${disabled ? 'opacity-70 grayscale' : ''}`} ref={containerRef}>
      <div className="flex items-center gap-1.5">
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex-grow flex items-center gap-2 h-10 px-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl transition-all hover:border-sky-500/50 cursor-pointer group ${isOpen ? 'ring-2 ring-sky-500/20' : ''}`}
          title="Clique para abrir ou cole uma data (Ctrl+V)"
        >
          <div className={value ? activeColor : 'text-slate-400 dark:text-slate-600'}>
            {icon || <CalendarDays className="w-3.5 h-3.5" />}
          </div>
          <input
            ref={inputRef}
            type="text"
            readOnly
            value={displayValue}
            placeholder={placeholder}
            onPaste={handlePaste}
            className={`bg-transparent border-none outline-none text-[10px] font-black tabular-nums tracking-widest w-full cursor-pointer placeholder:text-slate-400 dark:placeholder:text-slate-600 ${value ? 'text-slate-900 dark:text-white' : ''}`}
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button 
              type="button"
              onClick={handleCopy}
              className={`p-2 rounded-xl border-2 transition-all shadow-sm flex items-center justify-center ${copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-sky-500/50 hover:text-sky-500'}`}
              title="Copiar Data"
            >
              {copied ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          
          {value && !disabled && (
            <button 
              type="button"
              onClick={() => onChange('')}
              className="p-2 text-rose-400 hover:text-rose-600 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl transition-colors hover:border-rose-500/30 shadow-sm"
              title="Limpar Data"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed mt-2 w-[280px] bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[7000] animate-in fade-in zoom-in-95 duration-200 p-4" 
          style={{ 
            top: `${(containerRef.current?.getBoundingClientRect().bottom || 0)}px`, 
            left: `${(containerRef.current?.getBoundingClientRect().left || 0)}px` 
          }}
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            
            <div className="flex flex-col items-center gap-0.5">
               <div className="flex items-center gap-1 cursor-pointer hover:text-sky-500 transition-colors" onClick={() => setShowYearSelector(!showYearSelector)}>
                  <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest">{months[viewDate.getMonth()]}</span>
                  <span className="text-[10px] font-black text-sky-500">{viewDate.getFullYear()}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showYearSelector ? 'rotate-180' : ''}`} />
               </div>
            </div>

            <button type="button" onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>

          {showYearSelector ? (
            <div className="grid grid-cols-3 gap-1 h-[200px] overflow-y-auto custom-scrollbar p-1 animate-in slide-in-from-top-2">
               {years.map(y => (
                 <button 
                    key={y} 
                    onClick={() => selectYear(y)}
                    className={`py-2 rounded-lg text-[10px] font-black transition-all ${viewDate.getFullYear() === y ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                 >
                   {y}
                 </button>
               ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map(d => <div key={d} className="text-center text-[9px] font-black text-slate-400 py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`b-${i}`} />)}
                {days.map(day => {
                  const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = value === dateStr;
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  return (
                    <button 
                      key={day} 
                      type="button"
                      onClick={() => handleSelectDay(day)} 
                      className={`h-8 w-8 text-[10px] font-black rounded-lg transition-all flex items-center justify-center
                        ${isSelected ? 'bg-sky-500 text-white shadow-lg' : isToday ? 'border border-sky-500/50 text-sky-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
             <button 
               type="button"
               onClick={() => {
                 const today = new Date();
                 onChange(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
                 setIsOpen(false);
               }}
               className="text-[9px] font-black text-sky-500 uppercase tracking-widest hover:underline"
             >
               Hoje
             </button>
             <button 
               type="button"
               onClick={() => setIsOpen(false)}
               className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
             >
               Fechar
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface DividasMasterProps {
  masterDebts: MasterDebt[];
  setMasterDebts: React.Dispatch<React.SetStateAction<MasterDebt[]>>;
  allEntries: MonthlyEntry[];
}

const DividasMaster: React.FC<DividasMasterProps> = ({ masterDebts, setMasterDebts, allEntries }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<MasterDebt | null>(null);
  const [debtToDelete, setDebtToDelete] = useState<MasterDebt | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'ledger'>('cards');

  const stats = useMemo(() => {
    const safeDebts = masterDebts || [];
    
    // Cálculo robusto derivado das parcelas reais para garantir integridade
    const totals = safeDebts.reduce((acc, curr) => {
      const installmentsTotal = (curr.installments || []).reduce((sum, inst) => sum + (Number(inst.value) || 0), 0);
      const currentDebtTotal = installmentsTotal + (Number(curr.downPayment) || 0);
      
      const installmentsPaid = (curr.installments || [])
        .filter(i => i.status === 'paid')
        .reduce((sum, inst) => sum + (Number(inst.value) || 0), 0);
      const currentDebtPaid = installmentsPaid + (Number(curr.downPayment) || 0);
      
      const currentDebtPending = (curr.installments || [])
        .filter(i => i.status === 'pending')
        .reduce((sum, inst) => sum + (Number(inst.value) || 0), 0);

      return {
        total: acc.total + currentDebtTotal,
        paid: acc.paid + currentDebtPaid,
        pending: acc.pending + currentDebtPending
      };
    }, { total: 0, paid: 0, pending: 0 });

    return { ...totals, count: safeDebts.length };
  }, [masterDebts]);

  const handleSave = (debt: MasterDebt) => {
    setMasterDebts(prev => {
      const exists = (prev || []).find(d => d.id === debt.id);
      return exists ? prev.map(d => d.id === debt.id ? debt : d) : [...(prev || []), debt];
    });
    setIsModalOpen(false);
    setEditingDebt(null);
  };

  const confirmDeletion = () => {
    if (debtToDelete) {
      setMasterDebts(prev => (prev || []).filter(d => d.id !== debtToDelete.id));
      setDebtToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
        <StatCard icon={<Landmark className="w-5 h-5" />} label="Passivo Total" value={formatCurrency(stats.total)} color="text-slate-900 dark:text-white" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Total Liquidado" value={formatCurrency(stats.paid)} color="text-emerald-500" />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Saldo Devedor" value={formatCurrency(stats.pending)} color="text-rose-500" />
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
           <button onClick={() => setIsModalOpen(true)} className="flex-grow h-12 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
             <Plus className="w-4 h-4" /> Novo Registro
           </button>
           <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button onClick={() => setViewMode('cards')} className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('ledger')} className={`p-2 rounded-lg transition-all ${viewMode === 'ledger' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}><List className="w-4 h-4" /></button>
           </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 pb-10">
        {(masterDebts || []).length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-white/50 dark:bg-slate-900/30 text-center p-10">
            <Calculator className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
            <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600">Ledger Universal Vazio</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {masterDebts.map(debt => (
              <DebtCard key={debt.id} debt={debt} onDelete={() => setDebtToDelete(debt)} onEdit={() => { setEditingDebt(debt); setIsModalOpen(true); }} allEntries={allEntries} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm overflow-x-auto">
             <table className="w-full border-collapse min-w-[1000px]">
                <thead className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <tr>
                      <th className="px-6 py-4 text-left">Item / Contexto</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-center">Progresso</th>
                      <th className="px-6 py-4 text-right">Valor Total</th>
                      <th className="px-6 py-4 text-right">Saldo Aberto</th>
                      <th className="px-6 py-4 text-center">Referência</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {(masterDebts || []).map(debt => {
                     const totalValue = (debt.installments || []).reduce((sum, inst) => sum + (Number(inst.value) || 0), 0) + (Number(debt.downPayment) || 0);
                     const remainingValue = (debt.installments || []).filter(i => i.status === 'pending').reduce((sum, inst) => sum + (Number(inst.value) || 0), 0);
                     const paidCount = (debt.installments || []).filter(i => i.status === 'paid').length;
                     const progress = (paidCount / (debt.installmentsCount || 1)) * 100;
                     
                     return (
                       <tr key={debt.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${debt.status === 'paid' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : debt.isNegotiation ? 'bg-amber-500/10 text-amber-500' : 'bg-violet-500 text-white'}`}>
                                  {debt.status === 'paid' ? <Award className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                                </div>
                                <div className="flex flex-col">
                                   <span className={`text-xs font-black uppercase truncate max-w-[200px] ${debt.status === 'paid' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>{debt.item}</span>
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{debt.subCategory}</span>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center">
                               {debt.status === 'paid' ? (
                                 <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase border-2 border-emerald-500/20 shadow-sm animate-pulse"><Sparkles className="w-3 h-3" /> QUITADO</span>
                               ) : debt.isNegotiation ? (
                                 <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase border border-amber-500/20"><Percent className="w-3 h-3" /> Negociada</span>
                               ) : (
                                 <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-sky-500/10 text-sky-600 text-[9px] font-black uppercase border border-sky-500/20"><Clock className="w-3 h-3" /> Ativa</span>
                               )}
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col items-center gap-1 min-w-[120px]">
                                <div className="flex items-center justify-between w-full text-[9px] font-black uppercase tracking-tighter mb-0.5">
                                   <span className="text-slate-400 tabular-nums">{paidCount}/{debt.installmentsCount}</span>
                                   <span className={progress === 100 ? 'text-emerald-500' : 'text-slate-500'}>{progress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                   <div className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${progress}%` }} />
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(totalValue)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className={`text-[11px] font-black tabular-nums ${remainingValue > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(remainingValue)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className="text-[11px] font-black text-slate-500 tabular-nums">{`Dia ${String(debt.dueDay || 0).padStart(2,'0')}`}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => { setEditingDebt(debt); setIsModalOpen(true); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-sky-500 transition-all"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => setDebtToDelete(debt)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </td>
                       </tr>
                     );
                   })}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <DebtMasterModal 
          initialData={editingDebt} 
          onClose={() => { setIsModalOpen(false); setEditingDebt(null); }} 
          onSave={handleSave} 
          allEntries={allEntries}
          masterDebts={masterDebts}
        />
      )}

      {debtToDelete && (
        <DeleteMasterDebtModal 
          debt={debtToDelete}
          onClose={() => setDebtToDelete(null)}
          onConfirm={confirmDeletion}
        />
      )}
    </div>
  );
};

const DeleteMasterDebtModal: React.FC<{ debt: MasterDebt, onClose: () => void, onConfirm: () => void }> = ({ debt, onClose, onConfirm }) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && confirmationText === 'DELETAR') handleConfirm();
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [onClose, onConfirm, confirmationText]);

  const handleConfirm = () => {
    if (confirmationText === 'DELETAR') {
      setIsProcessing(true);
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Protocolo de Exclusão</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Você está prestes a apagar permanentemente a dívida <span className="font-black text-slate-900 dark:text-white uppercase">"{debt.item}"</span> do Dossiê Master. Esta ação é irreversível.
          </p>
          
          <div className="mb-8">
            <label className="block text-[9px] font-black text-rose-500 uppercase tracking-widest mb-3">Digite "DELETAR" para validar a ação</label>
            <input 
              type="text" 
              value={confirmationText} 
              onChange={(e) => setConfirmationText(e.target.value.toUpperCase())} 
              autoFocus 
              placeholder="CONFIRMAÇÃO..."
              className={`w-full h-14 bg-slate-50 dark:bg-slate-950 border-2 rounded-2xl text-center text-lg font-black outline-none transition-all ${confirmationText === 'DELETAR' ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 dark:border-slate-800 text-rose-500'}`} 
            />
          </div>

          <div className="flex flex-col gap-3">
            <button 
              disabled={confirmationText !== 'DELETAR' || isProcessing} 
              onClick={handleConfirm} 
              className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-600/30 disabled:opacity-20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Destruir Registro</>}
            </button>
            <button 
              onClick={onClose} 
              className="w-full py-4 text-slate-400 hover:text-slate-900 dark:hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all"
            >
              Cancelar e Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: any, label: string, value: string, color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
    <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 ${color} shadow-inner`}>{icon}</div>
    <div className="min-w-0">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 truncate">{label}</span>
      <span className={`text-lg font-black tabular-nums leading-none ${color}`}>{value}</span>
    </div>
  </div>
);

const DebtCard: React.FC<{ debt: MasterDebt, onDelete: () => void, onEdit: () => void, allEntries: MonthlyEntry[] }> = ({ debt, onDelete, onEdit, allEntries }) => {
  const paidCount = (debt.installments || []).filter(i => i.status === 'paid').length;
  const progress = (paidCount / (debt.installmentsCount || 1)) * 100;
  const isQuitado = progress === 100;
  
  // Sincronização de Lógica com o Modal: Cálculo derivado das parcelas reais
  const paidValue = useMemo(() => {
    const installmentsSum = (debt.installments || [])
      .filter(i => i.status === 'paid')
      .reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    return installmentsSum + (Number(debt.downPayment) || 0);
  }, [debt.installments, debt.downPayment]);

  const totalValue = useMemo(() => {
    const installmentsTotal = (debt.installments || []).reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    return installmentsTotal + (Number(debt.downPayment) || 0);
  }, [debt.installments, debt.downPayment]);

  const remainingValue = useMemo(() => {
    return (debt.installments || [])
      .filter(i => i.status === 'pending')
      .reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  }, [debt.installments]);

  return (
    <div className={`bg-white dark:bg-slate-900 border-2 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative ${isQuitado ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-slate-200 dark:border-slate-800'}`}>
      {isQuitado && (
        <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none z-0" />
      )}
      
      <div className={`p-5 border-b flex items-center justify-between relative z-10 ${isQuitado ? 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-xl shadow-md shrink-0 ${isQuitado ? 'bg-emerald-500 text-white animate-bounce' : debt.status === 'paid' ? 'bg-emerald-500 text-white' : debt.isNegotiation ? 'bg-amber-500/10 text-amber-500' : 'bg-violet-500 text-white'}`}>
            {isQuitado ? <Award className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
          </div>
          <div className="min-w-0 overflow-hidden">
            <span className={`text-[8px] font-black uppercase tracking-widest mb-0.5 block truncate ${isQuitado ? 'text-emerald-600' : 'text-violet-500'}`}>{debt.subCategory}</span>
            <h3 className={`text-[11px] font-black uppercase tracking-tight truncate leading-tight ${isQuitado ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{debt.item}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={onEdit} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-500 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="p-5 flex-grow flex flex-col gap-4 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-xl border ${isQuitado ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10'}`}>
             <span className="text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">Valor Liquidado</span>
             <span className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums leading-none block">{formatCurrency(paidValue)}</span>
          </div>
          <div className={`p-3 rounded-xl border text-right ${isQuitado ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800'}`}>
             <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-1">Saldo Devedor</span>
             <span className={`text-[12px] font-black tabular-nums leading-none block ${remainingValue > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(remainingValue)}</span>
          </div>
        </div>

        <div className={`px-3 py-2 rounded-xl border flex items-center justify-between ${isQuitado ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800'}`}>
           <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total Consolidado</span>
           <span className={`text-[10px] font-black tabular-nums ${isQuitado ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(totalValue)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
             <div className="flex items-center gap-1.5">
               <span className="text-slate-400">Indicador de Conclusão</span>
               <span className={`px-1.5 py-0.5 rounded ${isQuitado ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{progress.toFixed(0)}%</span>
             </div>
             <span className={isQuitado ? 'text-emerald-500' : 'text-emerald-500/60'}>{paidCount}/{debt.installmentsCount} Parc.</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
             <div className={`h-full transition-all duration-1000 relative ${isQuitado ? 'bg-emerald-500' : 'bg-emerald-500/60'}`} style={{ width: `${progress}%` }}>
               {isQuitado && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
             </div>
          </div>
        </div>

        {isQuitado ? (
          <div className="mt-auto bg-emerald-600 text-white rounded-xl p-3 flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 border-2 border-emerald-400/30 animate-in zoom-in-95">
             <Award className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">SELADO: REGISTRO QUITADO</span>
             <Sparkles className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="bg-[#0F172A] dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 mt-auto">
             <Calendar className="w-3.5 h-3.5 text-slate-400" />
             <span className="text-[9px] font-black text-white uppercase">Vencimento Dia {String(debt.dueDay || 0).padStart(2, '0')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const DebtMasterModal: React.FC<{ initialData: MasterDebt | null, masterDebts: MasterDebt[], onClose: () => void, onSave: (debt: MasterDebt) => void, allEntries: MonthlyEntry[] }> = ({ initialData, masterDebts, onClose, onSave, allEntries }) => {
  const [item, setItem] = useState(initialData?.item || '');
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || 'DÍVIDAS');
  const [instValue, setInstValue] = useState<string>(
    initialData 
      ? ((Number(initialData.totalValue) - (Number(initialData.downPayment) || 0)) / initialData.installmentsCount).toFixed(2) 
      : ''
  );
  const [originalTotalValue, setOriginalTotalValue] = useState<string>(initialData?.originalTotalValue?.toString() || '');
  const [downPayment, setDownPayment] = useState<string>(initialData?.downPayment?.toString() || '');
  const [installmentsCount, setInstallmentsCount] = useState<string>(initialData?.installmentsCount.toString() || '1');
  const [originalInstallmentsCount, setOriginalInstallmentsCount] = useState<string>(initialData?.originalInstallmentsCount?.toString() || '');
  const [dueDay, setDueDay] = useState<string>(initialData?.dueDay.toString() || '10');
  const [isNegotiation, setIsNegotiation] = useState(initialData?.isNegotiation || false);
  const [calcMode, setCalcMode] = useState<'auto' | 'manual'>(initialData && initialData.installments.some((v, i, arr) => v.value !== arr[0].value) ? 'manual' : 'auto');
  const [localInstallments, setLocalInstallments] = useState<MasterDebtInstallment[]>(initialData?.installments || []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const consolidatedTotal = useMemo(() => {
    const installmentsSum = localInstallments.reduce((a, c) => a + (Number(c.value) || 0), 0);
    return installmentsSum + (parseFloat(downPayment) || 0);
  }, [localInstallments, downPayment]);

  const remainingBalance = useMemo(() => {
    const pendingSum = localInstallments
      .filter(i => i.status === 'pending')
      .reduce((a, c) => a + (Number(c.value) || 0), 0);
    return pendingSum;
  }, [localInstallments]);

  const discountValue = useMemo(() => Math.max(0, (parseFloat(originalTotalValue) || 0) - consolidatedTotal), [originalTotalValue, consolidatedTotal]);
  const discountPercentage = useMemo(() => (parseFloat(originalTotalValue) || 0) === 0 ? 0 : (discountValue / (parseFloat(originalTotalValue) || 1)) * 100, [originalTotalValue, discountValue]);

  const isDuplicate = useMemo(() => {
    if (!item.trim()) return false;
    return masterDebts.some(d => d.item.trim().toUpperCase() === item.trim().toUpperCase() && d.id !== initialData?.id);
  }, [item, masterDebts, initialData]);

  useEffect(() => {
    if (isDuplicate) setErrorMsg("Dívida já cadastrada com este nome.");
    else setErrorMsg(null);
  }, [isDuplicate]);

  useEffect(() => {
    if (!initialData && calcMode === 'auto') {
      const count = parseInt(installmentsCount) || 1;
      const iv = parseFloat(instValue) || 0;
      setLocalInstallments(Array.from({ length: count }).map((_, i) => ({ 
        number: i + 1, 
        value: iv, 
        status: 'pending' 
      })));
    }
  }, [installmentsCount, instValue, calcMode, initialData]);

  const handleUpdateInstallment = (index: number, field: keyof MasterDebtInstallment, val: any) => {
    const next = [...localInstallments];
    
    const sanitizedVal = field === 'value' ? parseFloat(val) || 0 : val;
    next[index] = { ...next[index], [field]: sanitizedVal };
    
    if (field === 'dueDate' && val) {
      const baseDate = new Date(val + 'T00:00:00');
      if (!isNaN(baseDate.getTime())) {
        for (let i = index + 1; i < next.length; i++) {
          const nextDate = new Date(baseDate);
          nextDate.setMonth(baseDate.getMonth() + (i - index));
          if (nextDate.getDate() !== baseDate.getDate()) nextDate.setDate(0);
          
          const yyyy = nextDate.getFullYear();
          const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
          const dd = String(nextDate.getDate()).padStart(2, '0');
          next[i] = { ...next[i], dueDate: `${yyyy}-${mm}-${dd}` };
        }
      }
    }

    if (field === 'paidDate') {
      if (val && val.trim() !== '') next[index].status = 'paid';
      else next[index].status = 'pending';
    }
    
    setLocalInstallments(next);
  };

  const handleSubmit = () => {
    if (!item || isDuplicate) return;
    
    const sanitizedInstallments = localInstallments.map(inst => ({
      ...inst,
      value: Number(inst.value) || 0
    }));

    onSave({
      id: initialData?.id || crypto.randomUUID(),
      item: item.toUpperCase(),
      subCategory: subCategory.toUpperCase(),
      totalValue: consolidatedTotal,
      downPayment: parseFloat(downPayment) || 0,
      originalTotalValue: isNegotiation ? (parseFloat(originalTotalValue) || 0) : undefined,
      installmentsCount: parseInt(installmentsCount) || 1,
      originalInstallmentsCount: isNegotiation ? (parseInt(originalInstallmentsCount) || 1) : undefined,
      installments: sanitizedInstallments,
      dueDay: parseInt(dueDay) || 10,
      status: sanitizedInstallments.every(i => i.status === 'paid') ? 'paid' : (isNegotiation ? 'negotiation' : 'active'),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      isNegotiation
    });
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 p-2 md:p-6">
      <div className="bg-white dark:bg-[#020617] w-full h-full md:rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#020617]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-600 text-white rounded-2xl shadow-lg"><Landmark className="w-6 h-6" /></div>
            <div><h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{initialData ? 'Editar Dossiê Master' : 'Novo Registro de Dívida Master'}</h2><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Controle de Passivos e Negociações Estratégicas</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        <div className="flex-grow flex overflow-hidden">
          <div className="w-[420px] shrink-0 p-8 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 overflow-y-auto custom-scrollbar space-y-6">
            <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
               <button onClick={() => setIsNegotiation(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isNegotiation ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500'}`}>Operação Padrão</button>
               <button onClick={() => setIsNegotiation(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isNegotiation ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500'}`}>Negociação</button>
            </div>
            <div className="space-y-4">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item / Instituição</label>
                  <div className="relative">
                    <input type="text" placeholder="..." value={item} onChange={(e) => setItem(e.target.value)} className={`w-full h-12 px-4 bg-white dark:bg-slate-900 border-2 rounded-xl text-xs font-black uppercase outline-none transition-all text-slate-900 dark:text-white ${isDuplicate ? 'border-rose-500 focus:border-rose-600' : 'border-slate-200 dark:border-slate-800 focus:border-violet-500'}`} />
                    {isDuplicate && <div className="absolute -bottom-5 left-1 text-[8px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> {errorMsg}</div>}
                  </div>
               </div>
               {isNegotiation && (
                 <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/[0.03] border-2 border-emerald-500/10 rounded-[2rem] space-y-5">
                    <div className="flex items-center gap-2 mb-2"><History className="w-4 h-4 text-emerald-600" /><h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cenário Original</h3></div>
                    <div className="grid grid-cols-2 gap-4">
                       <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Valor Bruto</label><input type="number" value={originalTotalValue} onChange={(e) => setOriginalTotalValue(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black outline-none focus:border-emerald-500 text-slate-900 dark:text-white" /></div>
                       <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Qtd Parcelas</label><input type="number" value={originalInstallmentsCount} onChange={(e) => setOriginalInstallmentsCount(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black outline-none text-center text-slate-900 dark:text-white" /></div>
                    </div>
                 </div>
               )}
               <div className="p-6 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] space-y-5">
                  <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-sky-500" /><h3 className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Cenário Acordado</h3></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Dia Venc.</label><input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black outline-none text-center text-slate-900 dark:text-white" /></div>
                     <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Parcelas</label><input type="number" value={installmentsCount} onChange={(e) => setInstallmentsCount(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black outline-none text-center text-slate-900 dark:text-white" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Valor Entrada</label><input type="number" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-emerald-600 font-black outline-none" /></div>
                    <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Valor Parcela</label><input type="number" value={instValue} onChange={(e) => setInstValue(e.target.value)} className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-sky-600 font-black outline-none shadow-inner" /></div>
                  </div>
               </div>
            </div>
            {isNegotiation && (
              <div className="p-6 bg-slate-900 dark:bg-[#0F172A] rounded-[2rem] border-2 border-emerald-500/20 shadow-xl space-y-4">
                 <div className="flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ganho Estratégico</span><span className="px-2 py-1 rounded bg-emerald-500 text-white text-[9px] font-black">-{discountPercentage.toFixed(1)}% OFF</span></div>
                 <div className="flex items-end justify-between"><div className="flex flex-col"><span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Redução Bruta</span><span className="text-xl font-black text-emerald-400 tabular-nums">{formatCurrency(discountValue)}</span></div><Percent className="w-8 h-8 text-white/10" /></div>
              </div>
            )}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setCalcMode('auto')} className={`h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2 ${calcMode === 'auto' ? 'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] border-transparent shadow-md' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200'}`}>Automático</button>
                <button onClick={() => setCalcMode('manual')} className={`h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2 ${calcMode === 'manual' ? 'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] border-transparent shadow-md' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200'}`}>Manual</button>
              </div>
            </div>
          </div>

          <div className="flex-grow p-10 bg-white dark:bg-slate-950 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <div className="flex flex-col gap-1">
                 <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">PARCELAS MENSAIS</h3>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronização Ativa com Operação Mensal e Histórico</p>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">SALDO DEVEDOR</span>
                 <span className="text-lg font-black text-rose-500 tabular-nums">{formatCurrency(remainingBalance)}</span>
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 space-y-3 pb-20">
              {parseFloat(downPayment) > 0 && (
                <div className="flex items-center gap-6 p-5 bg-emerald-500/5 dark:bg-emerald-500/[0.02] rounded-[2rem] border-2 border-emerald-500/20 shadow-sm">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0">INI</div>
                   <div className="flex-grow grid grid-cols-3 items-center gap-6">
                      <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase mb-1">Descrição</span><span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">Aporte de Entrada</span></div>
                      <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase mb-1">Valor do Aporte</span><span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(parseFloat(downPayment))}</span></div>
                      <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase mb-1">Status Ativação</span><div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase"><CheckCircle2 className="w-3.5 h-3.5" /> Pago/Registrado</div></div>
                   </div>
                </div>
              )}
              {localInstallments.map((inst, i) => {
                const linkedEntry = (allEntries || []).find(e => e.masterDebtId === initialData?.id && e.installmentIndex === i);
                const isSynced = !!linkedEntry;
                const displayDueDate = isSynced ? linkedEntry.dueDate : inst.dueDate;
                const displayPaymentDate = isSynced ? linkedEntry.paymentDate : inst.paidDate;
                const displayStatus = isSynced ? (linkedEntry.status === 'Pago' ? 'paid' : 'pending') : inst.status;

                return (
                  <div key={i} className={`flex items-center gap-6 p-5 bg-white dark:bg-white/[0.02] rounded-[2rem] border-2 transition-all hover:shadow-md group/inst ${isSynced ? 'border-sky-500/20' : 'border-slate-100 dark:border-slate-800'}`}>
                     <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-sm transition-all ${isSynced ? 'bg-sky-500 text-white border-transparent' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 shadow-sm'}`}>{isSynced ? <Link2 className="w-5 h-5" /> : i + 1}</div>
                     <div className="flex-grow grid grid-cols-4 items-center gap-6">
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Valor Parcela</span>
                           <div className="relative"><span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">R$</span><input type="number" disabled={isSynced || (calcMode === 'auto' && !initialData)} value={inst.value || ''} onChange={(e) => handleUpdateInstallment(i, 'value', e.target.value)} className="w-full bg-transparent border-none outline-none font-black text-[11px] text-slate-900 dark:text-white pl-5 tabular-nums" /></div>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Vencimento</span>
                           <CustomDatePicker value={displayDueDate || ''} onChange={(date) => handleUpdateInstallment(i, 'dueDate', date)} disabled={isSynced} activeColor="text-sky-500" placeholder="Pendente" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Pagamento</span>
                           <CustomDatePicker value={displayPaymentDate || ''} onChange={(date) => {
                             handleUpdateInstallment(i, 'paidDate', date);
                           }} disabled={isSynced} icon={<CheckCircle2 className="w-3.5 h-3.5" />} activeColor="text-emerald-500" placeholder="Aguardando" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Status Operacional</span>
                           <button disabled={isSynced} onClick={() => handleUpdateInstallment(i, 'status', displayStatus === 'paid' ? 'pending' : 'paid')} className={`h-10 px-4 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${displayStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>{displayStatus === 'paid' ? <><ShieldCheck className="w-3.5 h-3.5" /> PAGO</> : <><Clock className="w-3.5 h-3.5" /> PENDENTE</>}</button>
                        </div>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-12 py-8 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="px-10 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-rose-500 transition-colors uppercase">Descartar Auditoria</button>
          <button disabled={!item || isDuplicate} onClick={handleSubmit} className="px-16 py-5 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-30 flex items-center gap-4"><Save className="w-5 h-5" /> SALVAR</button>
        </div>
      </div>
    </div>
  );
};

export default DividasMaster;
