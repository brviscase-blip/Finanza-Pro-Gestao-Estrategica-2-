
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Trophy, DollarSign, Calendar, Target, Camera, X, Edit3, CheckCircle2, Info, ArrowRight, Save, PieChart, Sparkles, Award, Image as ImageIcon, Upload, AlertCircle, Tag as TagIcon, ChevronDown, Edit2, LayoutGrid, List, CalendarDays, ChevronLeft, ChevronRight, Copy, ClipboardCheck, Filter, FilterX } from 'lucide-react';
import { Conquista, SubCategoryTag, ConquistaDeposit } from '../types';

const formatCurrency = (val: number) => {
  const safeVal = isNaN(val) ? 0 : val;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeVal);
};

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

const CustomDatePicker: React.FC<{ 
  value: string, 
  onChange: (date: string) => void, 
  placeholder?: string,
  icon?: React.ReactNode,
  activeColor?: string,
  disabled?: boolean
}> = ({ value, onChange, placeholder = "--/--/----", icon, activeColor = "text-sky-500", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    if (value && value.includes('-')) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) setViewDate(d);
    }
  }, [value, isOpen]);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
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

  const displayValue = value ? value.split('-').reverse().join('/') : '';

  return (
    <div className={`relative w-full ${disabled ? 'opacity-70 grayscale' : ''}`} ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-2 h-10 px-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl transition-all hover:border-sky-500/50 cursor-pointer group ${isOpen ? 'ring-2 ring-sky-500/20' : ''}`}
      >
        <div className={value ? activeColor : 'text-slate-400 dark:text-slate-600'}>
          {icon || <CalendarDays className="w-3.5 h-3.5" />}
        </div>
        <input
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder}
          className={`bg-transparent border-none outline-none text-[10px] font-black tabular-nums tracking-widest w-full cursor-pointer placeholder:text-slate-400 dark:placeholder:text-slate-600 ${value ? 'text-slate-900 dark:text-white' : ''}`}
        />
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
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>

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
        </div>
      )}
    </div>
  );
};

interface ConquistasProps {
  conquistas: Conquista[];
  setConquistas: React.Dispatch<React.SetStateAction<Conquista[]>>;
  tags: SubCategoryTag[];
  setTags: React.Dispatch<React.SetStateAction<SubCategoryTag[]>>;
}

const Conquistas: React.FC<ConquistasProps> = ({ conquistas, setConquistas, tags, setTags }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConquista, setEditingConquista] = useState<Conquista | null>(null);
  const [conquistaToDelete, setConquistaToDelete] = useState<Conquista | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'ledger'>('cards');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const stats = useMemo(() => {
    const safeCq = conquistas || [];
    const totals = safeCq.reduce((acc, curr) => ({
      total: acc.total + Number(curr.targetValue),
      saved: acc.saved + Number(curr.savedValue)
    }), { total: 0, saved: 0 });
    return { ...totals, count: safeCq.length };
  }, [conquistas]);

  // Lista de tags únicas presentes nas conquistas para o filtro
  const availableTags = useMemo(() => {
    const uniqueTags = new Set<string>();
    conquistas.forEach(c => uniqueTags.add(c.category));
    return Array.from(uniqueTags).sort();
  }, [conquistas]);

  // Filtragem das conquistas
  const filteredConquistas = useMemo(() => {
    if (!activeTagFilter) return conquistas;
    return conquistas.filter(c => c.category === activeTagFilter);
  }, [conquistas, activeTagFilter]);

  const handleSave = (cq: Conquista) => {
    console.debug('[CONQUISTAS] Salvando conquista:', cq.item);
    setConquistas(prev => {
      const exists = (prev || []).find(d => d.id === cq.id);
      return exists ? prev.map(d => d.id === cq.id ? cq : d) : [...(prev || []), cq];
    });
    setIsModalOpen(false);
    setEditingConquista(null);
  };

  const handleDelete = () => {
    if (conquistaToDelete) {
      console.debug('[CONQUISTAS] Excluindo conquista:', conquistaToDelete.item);
      setConquistas(prev => (prev || []).filter(c => c.id !== conquistaToDelete.id));
      setConquistaToDelete(null);
    }
  };

  const handleSaveTag = (tag: SubCategoryTag, oldName?: string) => {
    setTags(prev => {
      if (oldName) {
        return prev.map(t => t.name === oldName ? tag : t);
      }
      return [...prev, tag];
    });

    if (oldName) {
      setConquistas(prev => prev.map(c => c.category === oldName ? { ...c, category: tag.name, categoryColor: tag.colorClass } : c));
    }
  };

  const handleDeleteTag = (tagName: string) => {
    setTags(prev => prev.filter(t => t.name !== tagName));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
        <StatCard icon={<Target className="w-5 h-5 text-sky-500" />} label="Valor Alvo Global" value={formatCurrency(stats.total)} />
        <StatCard icon={<Award className="w-5 h-5 text-emerald-500" />} label="Reservado para Sonhos" value={formatCurrency(stats.saved)} />
        <StatCard icon={<PieChart className="w-5 h-5 text-violet-500" />} label="Efetivação Geral" value={`${stats.total > 0 ? ((stats.saved / stats.total) * 100).toFixed(1) : 0}%`} />
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-grow bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] rounded-xl h-12 font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Novo Sonho
          </button>
          <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('cards')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
              title="Visualizar em Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('ledger')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'ledger' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
              title="Visualizar em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros por Categoria (Tags) */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-3 mb-6 overflow-x-auto custom-scrollbar pb-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-200 dark:border-slate-800 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Filtrar:</span>
          </div>
          
          <button 
            onClick={() => setActiveTagFilter(null)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 ${!activeTagFilter ? 'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] border-transparent shadow-lg scale-105' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}
          >
            Todas
          </button>

          {availableTags.map(tag => {
            const tagData = tags.find(t => t.name === tag);
            const colorClass = tagData?.colorClass || 'bg-slate-100 text-slate-500';
            const isActive = activeTagFilter === tag;
            
            return (
              <button 
                key={tag}
                onClick={() => setActiveTagFilter(tag)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap ${isActive ? 'ring-4 ring-sky-500/20 shadow-md scale-105 ' + colorClass.replace('bg-', 'no-bg-').replace('text-', 'bg-').replace('text-', 'text-white ') : colorClass.replace('border-', 'no-border-') + ' opacity-60 hover:opacity-100 hover:scale-105 border-transparent'}`}
              >
                {tag}
              </button>
            );
          })}

          {activeTagFilter && (
            <button 
              onClick={() => setActiveTagFilter(null)}
              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all ml-1"
              title="Limpar Filtro"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 pb-20">
        {(filteredConquistas || []).length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white/50 dark:bg-slate-900/30 text-center p-10 opacity-50">
            <Trophy className="w-20 h-20 text-slate-300 dark:text-slate-700 mb-6" />
            <h3 className="text-xl font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">
              {activeTagFilter ? 'Nenhum item nesta categoria' : 'Seu Mural está vago'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              {activeTagFilter ? 'Tente outro filtro ou crie um novo sonho.' : 'O que você deseja conquistar este ano?'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredConquistas.map(cq => (
              <ConquistaCard 
                key={cq.id} 
                conquista={cq} 
                onEdit={() => { 
                  setEditingConquista(cq); 
                  setIsModalOpen(true); 
                }} 
                onDelete={() => {
                  setConquistaToDelete(cq);
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-8 py-5 text-left">Sonho / Meta</th>
                  <th className="px-8 py-5 text-left">Categoria</th>
                  <th className="px-8 py-5 text-center">Efetivação</th>
                  <th className="px-8 py-5 text-right">Valor Alvo</th>
                  <th className="px-8 py-5 text-right">Reservado</th>
                  <th className="px-8 py-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredConquistas.map(cq => {
                  const progress = Math.min(100, (cq.savedValue / cq.targetValue) * 100);
                  const isAchieved = progress >= 100;
                  return (
                    <tr key={cq.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700`}>
                            {cq.imageUrl ? (
                              <img src={cq.imageUrl} alt={cq.item} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-xs font-black uppercase tracking-tight ${isAchieved ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>{cq.item}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Criado em {new Date(cq.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${cq.categoryColor?.replace('border-', 'no-border-') || 'bg-slate-100 text-slate-500'}`}>
                          {cq.category}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col items-center gap-1.5 min-w-[140px]">
                          <div className="flex items-center justify-between w-full text-[9px] font-black uppercase">
                            <span className={isAchieved ? 'text-emerald-500' : 'text-slate-400'}>{isAchieved ? 'Concluído' : 'Em progresso'}</span>
                            <span className={isAchieved ? 'text-emerald-500 font-black' : 'text-slate-500'}>{progress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
                            <div className={`h-full transition-all duration-1000 ${isAchieved ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-sky-500'}`} style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-xs tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(cq.targetValue)}
                      </td>
                      <td className="px-8 py-5 text-right font-black text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(cq.savedValue)}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => { setEditingConquista(cq); setIsModalOpen(true); }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-sky-500 transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setConquistaToDelete(cq)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
        <ConquistaModal 
          initialData={editingConquista} 
          tags={tags}
          onClose={() => { setIsModalOpen(false); setEditingConquista(null); }} 
          onSave={handleSave}
          onSaveTag={handleSaveTag}
          onDeleteTag={handleDeleteTag}
          conquistas={conquistas}
        />
      )}

      {conquistaToDelete && (
        <DeleteConfirmModal conquista={conquistaToDelete} onCancel={() => setConquistaToDelete(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: any, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-inner">{icon}</div>
    <div>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</span>
      <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums leading-none">{value}</span>
    </div>
  </div>
);

const ConquistaCard: React.FC<{ conquista: Conquista, onEdit: () => void, onDelete: () => void }> = ({ conquista, onEdit, onDelete }) => {
  const progress = Math.min(100, (conquista.savedValue / conquista.targetValue) * 100);
  const isAchieved = progress >= 100;

  return (
    <div className={`relative h-[280px] rounded-[2rem] overflow-hidden border-2 transition-all duration-500 group shadow-lg hover:shadow-2xl hover:scale-[1.02] ${isAchieved ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800'}`}>
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ 
          backgroundImage: conquista.imageUrl ? `url(${conquista.imageUrl})` : 'none',
          backgroundColor: '#0F172A'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-0" />
      <div className="absolute inset-0 p-6 flex flex-col justify-end z-10 pointer-events-none">
        <div className="space-y-3 pointer-events-auto">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mb-1 shadow-sm ${conquista.categoryColor?.replace('border-', 'no-border-') || 'bg-white/10 backdrop-blur-md text-white'}`}>{conquista.category}</span>
            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight">{conquista.item}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
               <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Total Alvo</span>
               <span className="text-[11px] font-black text-white tabular-nums">{formatCurrency(conquista.targetValue)}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
               <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Já Reservado</span>
               <span className="text-[11px] font-black text-emerald-400 tabular-nums">{formatCurrency(conquista.savedValue)}</span>
            </div>
          </div>
          <div className="space-y-1.5">
             <div className="flex items-center justify-between text-[8px] font-black text-white uppercase tracking-widest">
               <span>Efetivação</span>
               <span className={isAchieved ? 'text-emerald-400' : 'text-sky-400'}>{progress.toFixed(0)}%</span>
             </div>
             <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
               <div className={`h-full transition-all duration-1000 ${isAchieved ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-sky-500'}`} style={{ width: `${progress}%` }} />
             </div>
          </div>
          {isAchieved && (
            <div className="bg-emerald-600/90 backdrop-blur-md text-white py-2 rounded-xl flex items-center justify-center gap-2 animate-pulse border-2 border-emerald-400/30">
               <Award className="w-4 h-4" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em]">Conquista Realizada</span>
            </div>
          )}
        </div>
      </div>
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }} 
          className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white hover:text-black transition-all cursor-pointer shadow-xl"
          title="Editar Sonho"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }} 
          className="p-1.5 bg-rose-500/80 backdrop-blur-md rounded-lg text-white hover:bg-rose-600 transition-all cursor-pointer shadow-xl"
          title="Excluir Registro"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const ConquistaModal: React.FC<{ initialData: Conquista | null, tags: SubCategoryTag[], onClose: () => void, onSave: (cq: Conquista) => void, onSaveTag: (tag: SubCategoryTag, oldName?: string) => void, onDeleteTag: (name: string) => void, conquistas: Conquista[] }> = ({ initialData, tags, onClose, onSave, onSaveTag, onDeleteTag, conquistas }) => {
  const [item, setItem] = useState(initialData?.item || '');
  const [category, setCategory] = useState(initialData?.category || 'PATRIMÔNIO');
  const [categoryColor, setCategoryColor] = useState(initialData?.categoryColor || '');
  const [targetValueFormatted, setTargetValueFormatted] = useState<string>(
    initialData ? formatCurrencyInput((initialData.targetValue * 100).toString()) : ''
  );
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [deadline, setDeadline] = useState(initialData?.deadline || '');
  const [deposits, setDeposits] = useState<ConquistaDeposit[]>(initialData?.deposits || []);
  const [tagToEdit, setTagToEdit] = useState<SubCategoryTag | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSaved = useMemo(() => {
    return deposits.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  }, [deposits]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTargetValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatCurrencyInput(rawValue);
    setTargetValueFormatted(formatted);
  };

  const handleAddDeposit = () => {
    const newDeposit: ConquistaDeposit = {
      id: crypto.randomUUID(),
      value: 0,
      date: new Date().toISOString().split('T')[0]
    };
    setDeposits([...deposits, newDeposit]);
  };

  const handleUpdateDeposit = (id: string, field: keyof ConquistaDeposit, val: any) => {
    setDeposits(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));
  };

  const handleRemoveDeposit = (id: string) => {
    setDeposits(prev => prev.filter(d => d.id !== id));
  };

  const handleSubmit = () => {
    if (!item) return;
    const numericTargetValue = parseCurrencyInput(targetValueFormatted);
    
    onSave({
      id: initialData?.id || crypto.randomUUID(),
      item: item.toUpperCase(),
      category: category.toUpperCase(),
      categoryColor,
      targetValue: numericTargetValue,
      savedValue: totalSaved,
      imageUrl,
      deadline,
      deposits,
      status: totalSaved >= numericTargetValue && numericTargetValue > 0 ? 'achieved' : 'saving',
      createdAt: initialData?.createdAt || new Date().toISOString()
    });
  };

  const isTagInUse = (name: string) => conquistas.some(c => c.category === name);

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#020617] w-full max-w-5xl h-[85vh] rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg"><Trophy className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{initialData ? 'Ajustar Meta' : 'Cadastrar Nova Conquista'}</h2>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Modelagem de Metas de Curto e Longo Prazo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        <div className="flex-grow flex overflow-hidden">
          <div className="w-[360px] shrink-0 p-8 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 overflow-y-auto custom-scrollbar space-y-6">
            <div className="space-y-4">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição do Sonho</label>
                  <input type="text" placeholder="Ex: CASA PRÓPRIA..." value={item} onChange={(e) => setItem(e.target.value)} className="w-full h-12 px-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase outline-none focus:border-emerald-500 transition-all text-slate-900 dark:text-white" />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Classificação Estratégica</label>
                  <ConquistaTagSelector 
                    value={category} 
                    color={categoryColor} 
                    tags={tags} 
                    onChange={(name, color) => { setCategory(name); setCategoryColor(color); }}
                    onAdd={() => { setTagToEdit(null); setIsTagModalOpen(true); }}
                    onEdit={(tag) => { setTagToEdit(tag); setIsTagModalOpen(true); }}
                    onDelete={onDeleteTag}
                    isTagInUse={isTagInUse}
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Meta de Acúmulo</label>
                  <input 
                    type="text" 
                    placeholder="R$ 0,00" 
                    value={targetValueFormatted} 
                    onChange={handleTargetValueChange} 
                    className="w-full h-12 px-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black outline-none focus:border-emerald-500 transition-all text-slate-900 dark:text-white tabular-nums" 
                  />
               </div>

               <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Papel de Parede</label>
                  <div className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center group">
                    {imageUrl ? (
                      <>
                        <img src={imageUrl} alt="Dream" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <button onClick={() => setImageUrl('')} className="p-2 bg-rose-500 text-white rounded-lg shadow-xl"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </>
                    ) : (
                      <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center text-slate-400 hover:text-emerald-500 transition-colors">
                        <Upload className="w-6 h-6 mb-2" />
                        <span className="text-[9px] font-black uppercase">Subir Foto</span>
                      </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
               </div>

               <div className="pt-6">
                 <button 
                   disabled={!item} 
                   onClick={handleSubmit} 
                   className="w-full py-5 bg-[#0F172A] dark:bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-30 flex items-center justify-center gap-4 cursor-pointer"
                 >
                   <Save className="w-5 h-5" /> CADASTRAR CONQUISTA
                 </button>
               </div>
            </div>
          </div>

          <div className="flex-grow p-10 bg-white dark:bg-slate-950 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-8 shrink-0">
               <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">DEPÓSITOS E APORTES</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Histórico de reservas vinculadas ao objetivo</p>
               </div>
               <div className="flex items-center gap-6">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">TOTAL RESERVADO</span>
                    <span className="text-xl font-black text-emerald-500 tabular-nums">{formatCurrency(totalSaved)}</span>
                 </div>
                 <button 
                   onClick={handleAddDeposit}
                   className="p-3 bg-sky-500 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                 >
                   <Plus className="w-6 h-6" />
                 </button>
               </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 space-y-3 pb-10">
              {deposits.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-20 opacity-30">
                  <Info className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhum depósito registrado ainda.</p>
                </div>
              ) : (
                deposits.map((dep, i) => {
                  const valFormatted = formatCurrencyInput((dep.value * 100).toString());
                  return (
                    <div key={dep.id} className="flex items-center gap-6 p-5 bg-slate-50 dark:bg-white/[0.02] rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 transition-all hover:shadow-md group">
                       <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center font-black text-sm text-slate-400 shrink-0">{i + 1}</div>
                       <div className="flex-grow grid grid-cols-2 gap-8 items-center">
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Valor do Aporte</span>
                             <div className="relative group/input">
                                <input 
                                  type="text" 
                                  value={valFormatted} 
                                  onChange={(e) => {
                                    const num = parseCurrencyInput(e.target.value);
                                    handleUpdateDeposit(dep.id, 'value', num);
                                  }}
                                  className="w-full h-10 px-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-emerald-600 outline-none focus:border-sky-500 transition-all tabular-nums" 
                                />
                             </div>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Data do Depósito</span>
                             <CustomDatePicker 
                               value={dep.date} 
                               onChange={(date) => handleUpdateDeposit(dep.id, 'date', date)} 
                               activeColor="text-sky-500" 
                             />
                          </div>
                       </div>
                       <button 
                         onClick={() => handleRemoveDeposit(dep.id)}
                         className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6 w-full shrink-0">
                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                   <Sparkles className="w-5 h-5 text-emerald-500" />
                   <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-relaxed">Visualize a sua vitória diariamente. Cada centavo aproxima você do objetivo.</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-sky-500/5 rounded-2xl border border-sky-500/10">
                   <Target className="w-5 h-5 text-sky-500" />
                   <span className="text-[9px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest leading-relaxed">Mantenha o foco no alvo financeiro. A constância é o segredo do sucesso.</span>
                </div>
             </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-start shrink-0">
          <button onClick={onClose} className="px-10 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-rose-500 transition-colors">Descartar</button>
        </div>
      </div>

      {isTagModalOpen && (
        <AchievementTagModal 
          initialTag={tagToEdit} 
          onClose={() => setIsTagModalOpen(false)} 
          onSave={(tag) => { onSaveTag(tag, tagToEdit?.name); setIsTagModalOpen(false); }} 
        />
      )}
    </div>
  );
};

const ConquistaTagSelector: React.FC<{ value: string, color: string, tags: SubCategoryTag[], onChange: (name: string, color: string) => void, onAdd: () => void, onEdit: (tag: SubCategoryTag) => void, onDelete: (name: string) => void, isTagInUse: (name: string) => boolean }> = ({ value, color, tags, onChange, onAdd, onEdit, onDelete, isTagInUse }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const currentTag = tags.find(t => t.name === value) || { name: value, colorClass: color || 'bg-slate-500/10 text-slate-600 border-slate-500/20' };

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 px-4 bg-white dark:bg-slate-900 border-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-slate-400 dark:border-slate-600' : 'border-slate-200 dark:border-slate-800'}`}
      >
        <div className="flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-slate-400" />
          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${currentTag.colorClass?.replace('border-', 'no-border-')}`}>{currentTag.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[6000] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
           <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categorias Disponíveis</span></div>
           <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {tags.map(tag => (
                <div key={tag.name} className="flex items-center gap-2 p-1 group/opt">
                   <button onClick={() => { onChange(tag.name, tag.colorClass); setIsOpen(false); }} className={`flex-grow flex items-center px-3 py-2 rounded-xl transition-all text-left ${tag.colorClass?.replace('border-', 'no-border-')} hover:brightness-95`}>
                      <span className="text-[10px] font-black uppercase tracking-widest">{tag.name}</span>
                   </button>
                   <div className="flex items-center gap-1 opacity-0 group-hover/opt:opacity-100 transition-all">
                      <button onClick={(e) => { e.stopPropagation(); onEdit(tag); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-500"><Edit2 className="w-3.5 h-3.5" /></button>
                      {!isTagInUse(tag.name) && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(tag.name); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500"><X className="w-3.5 h-3.5" /></button>
                      )}
                   </div>
                </div>
              ))}
              <button onClick={() => { onAdd(); setIsOpen(false); }} className="w-full mt-2 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-slate-400 transition-all flex items-center justify-center gap-2">
                 <Plus className="w-4 h-4" /> Cadastrar Nova Tag
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

const AchievementTagModal: React.FC<{ initialTag: SubCategoryTag | null, onClose: () => void, onSave: (tag: SubCategoryTag) => void }> = ({ initialTag, onClose, onSave }) => {
  const [name, setName] = useState(initialTag?.name || '');
  const [colorClass, setColorClass] = useState(initialTag?.colorClass || 'bg-slate-500/10 text-slate-600 border-slate-500/20');

  const colorOptions = [
    { label: 'Esmeralda', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    { label: 'Céu', class: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
    { label: 'Rosa', class: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
    { label: 'Violeta', class: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
    { label: 'Âmbar', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    { label: 'Slate', class: 'bg-slate-500/10 text-slate-600 border-slate-500/20' }
  ];

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#020617] w-full max-w-sm rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-[#0F172A] dark:bg-white rounded-xl"><TagIcon className="w-5 h-5 text-white dark:text-[#0F172A]" /></div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{initialTag ? 'Editar Tag' : 'Nova Tag de Conquista'}</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Identificação Visual</label>
            <input type="text" placeholder="Ex: PATRIMÔNIO, SONHOS..." value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black outline-none transition-all text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Esquema Cromático</label>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map(opt => (
                <button 
                  key={opt.label} 
                  onClick={() => setColorClass(opt.class)} 
                  className={`px-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${opt.class?.replace('border-', 'no-border-')} ${colorClass === opt.class ? 'ring-2 ring-slate-400 shadow-lg scale-95' : 'opacity-60 hover:opacity-100'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Cancelar</button>
          <button disabled={!name.trim()} onClick={() => onSave({ name, colorClass })} className="px-8 py-2.5 bg-[#0F172A] dark:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-30 active:scale-95 transition-all">Salvar Tag</button>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmModal: React.FC<{ conquista: Conquista, onCancel: () => void, onConfirm: () => void }> = ({ conquista, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] border-2 border-rose-500/20 shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><AlertCircle className="w-10 h-10" /></div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Remover Objetivo?</h3>
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-8 leading-relaxed">Você está prestes a desistir do registro de <span className="text-rose-500 font-black">"{conquista.item}"</span>. Esta ação não apaga seus valores reais guardados, apenas o registro visual.</p>
      <div className="flex flex-col gap-3">
        <button onClick={onConfirm} className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"><Trash2 className="w-4 h-4" /> Confirmar Remoção</button>
        <button onClick={onCancel} className="w-full py-4 text-slate-400 hover:text-slate-900 dark:hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer">Cancelar</button>
      </div>
    </div>
  </div>
);

export default Conquistas;
