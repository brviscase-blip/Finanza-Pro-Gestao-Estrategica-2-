
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, BarChart3, Target, Plus, LogIn, Trash2, Calendar, History, ArrowRightLeft, Check, Settings2, Info, ChevronRight, X, AlertTriangle, ShieldAlert, ListChecks, Eraser, FileX, RefreshCw } from 'lucide-react';
import { YearProfile, CategoryType, FinancialItem, FrequencyConfig, SubCategoryTag } from '../types';
import { supabase } from '../lib/supabase';

interface HomeProps {
  profiles: Record<number, YearProfile>;
  setProfiles: React.Dispatch<React.SetStateAction<Record<number, YearProfile>>>;
  activeYear: number | null;
  setActiveYear: (year: number | null) => void;
}

const Home: React.FC<HomeProps> = ({ profiles, setProfiles, activeYear, setActiveYear }) => {
  const navigate = useNavigate();
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [newYearInput, setNewYearInput] = useState<string>('');
  const [migrationData, setMigrationData] = useState<YearProfile | null>(null);
  const [yearToDelete, setYearToDelete] = useState<number | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const years = useMemo(() => Object.keys(profiles).map(Number).sort((a, b) => a - b), [profiles]);

  // Listener para ESC e ENTER na Home
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddYearModal(false);
        setMigrationData(null);
        setYearToDelete(null);
        setDeleteStep(1);
        setDeleteConfirmationText('');
        setNewYearInput('');
      }
      if (e.key === 'Enter') {
        if (showAddYearModal && !migrationData) {
          handleCreateYear();
        } else if (yearToDelete !== null) {
          if (deleteStep === 1) setDeleteStep(2);
          else if (deleteStep === 2 && deleteConfirmationText === 'DELETAR') confirmDeleteYear();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddYearModal, migrationData, yearToDelete, deleteStep, deleteConfirmationText, newYearInput]);

  const handleCreateYear = () => {
    const year = parseInt(newYearInput);
    if (isNaN(year) || profiles[year] || newYearInput.length !== 4) return;

    const sortedYears = [...years].sort((a, b) => b - a);
    const prevYear = sortedYears.find(y => y < year);

    if (prevYear) {
      setMigrationData(profiles[prevYear]);
    } else {
      const newProfile: YearProfile = {
        year,
        financialData: { 'ESSENCIAIS': [], 'QUALIDADE DE VIDA': [], 'FUTURO': [], 'DÍVIDAS': [] },
        customTags: { 'ESSENCIAIS': [], 'QUALIDADE DE VIDA': [], 'FUTURO': [], 'DÍVIDAS': [] },
        monthlyEntries: [],
        incomeEntries: []
      };
      setProfiles(prev => ({ ...prev, [year]: newProfile }));
      setShowAddYearModal(false);
      setNewYearInput('');
    }
  };

  const openDeleteConfirmation = (e: React.MouseEvent, year: number) => {
    e.preventDefault();
    e.stopPropagation();
    setYearToDelete(year);
    setDeleteStep(1);
    setDeleteConfirmationText('');
  };

  const confirmDeleteYear = async () => {
    if (yearToDelete === null || deleteConfirmationText !== 'DELETAR' || isDeleting) return;
    
    const year = yearToDelete;
    setIsDeleting(true);

    try {
      // 1. Deletar no Supabase (O CASCADE cuidará das tabelas filhas)
      const { error } = await supabase
        .from('perfis_ano')
        .delete()
        .eq('ano', year);

      if (error) {
        console.error('[SUPABASE] Erro ao deletar perfil:', error);
        alert('Erro ao deletar no banco de dados. Tente novamente.');
        setIsDeleting(false);
        return;
      }

      // 2. Atualizar estado local
      setProfiles(prev => {
        const next = { ...prev };
        if (next[year]) {
          delete next[year];
        }
        return next;
      });

      if (activeYear === year) {
        setActiveYear(null);
        localStorage.removeItem('finanza-active-year');
      }
      
      setYearToDelete(null);
      setDeleteStep(1);
      setDeleteConfirmationText('');
      console.log(`[FINANZA] Perfil ${year} removido com sucesso.`);
    } catch (err) {
      console.error('[FINANZA] Erro crítico na deleção:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const loginYear = (year: number) => {
    setActiveYear(year);
    navigate('/registro');
  };

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setNewYearInput(value);
  };

  return (
    <div className="flex flex-col items-center h-[calc(100vh-140px)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="w-full max-w-6xl text-center pt-2 pb-6 shrink-0">
        <span className="inline-block px-4 py-1 mb-4 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase border border-slate-200 dark:border-slate-800 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          Soberania Financeira Temporal
        </span>
        <h1 className="text-4xl md:text-5xl font-light tracking-tighter mb-4 text-slate-900 dark:text-white leading-tight">
          Perfis de <span className="text-slate-400 italic font-thin">Gestão Anual</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Cada ano é uma nova estratégia. Selecione um perfil ou crie um novo ciclo.
        </p>
      </div>

      <div className="flex-grow w-full max-w-6xl overflow-y-auto custom-scrollbar px-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-2">
          {years.map(year => {
            const isActive = activeYear === year;
            return (
              <div 
                key={year}
                onClick={() => loginYear(year)}
                className={`relative group cursor-pointer p-6 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 
                  ${isActive 
                    ? 'bg-white dark:bg-slate-800 border-emerald-500 shadow-[0_15px_30px_rgba(16,185,129,0.1)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)]' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm opacity-80 hover:opacity-100'
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  {isActive && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Ativo</span>
                  )}
                </div>
                
                <h3 className={`text-3xl font-black tracking-tighter mb-1 transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {year}
                </h3>
                <p className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-emerald-900/40 dark:text-emerald-400/40' : 'text-slate-500'}`}>
                  Perfil de Operação
                </p>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-500'}`}>
                    <LogIn className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Acessar</span>
                  </div>
                  <button 
                    onClick={(e) => openDeleteConfirmation(e, year)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-all opacity-40 group-hover:opacity-100 z-50 relative"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-emerald-500 rounded-t-full" />
                )}
              </div>
            );
          })}

          <button 
            onClick={() => setShowAddYearModal(true)}
            className="p-6 rounded-3xl border-4 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all group flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-slate-900 dark:hover:text-white min-h-[180px] bg-slate-50/50 dark:bg-slate-900/30"
          >
            <div className="p-3 bg-white dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform shadow-sm border border-slate-200 dark:border-slate-700">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Novo Ciclo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl pb-4 shrink-0 px-4">
        <FeatureCard icon={<History className="w-3.5 h-3.5" />} title="Herança Estratégica" description="Migre itens de anos anteriores e ajuste valores." />
        <FeatureCard icon={<ArrowRightLeft className="w-3.5 h-3.5" />} title="Isolamento Temporal" description="Dados independentes para um histórico limpo." />
        <FeatureCard icon={<Settings2 className="w-3.5 h-3.5" />} title="Personalização Total" description="Tags exclusivas para cada perfil." />
      </div>

      {showAddYearModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="p-2 bg-[#0F172A] dark:bg-white rounded-lg"><Plus className="w-5 h-5 text-white dark:text-[#0F172A]" /></div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Novo Perfil</h3>
            </div>
            <div className="p-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ano de Operação</label>
              <input type="text" placeholder="Ex: 2026" value={newYearInput} onChange={handleYearInputChange} autoFocus className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-xl font-black outline-none focus:border-emerald-500 transition-all text-slate-900 dark:text-white" />
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button onClick={() => { setShowAddYearModal(false); setNewYearInput(''); }} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleCreateYear} disabled={newYearInput.length !== 4 || !!profiles[parseInt(newYearInput)]} className="px-8 py-2.5 bg-[#0F172A] dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-30 active:scale-95 transition-all">Prosseguir</button>
            </div>
          </div>
        </div>
      )}

      {migrationData && (
        <MigrationWizard 
          prevProfile={migrationData} 
          targetYear={parseInt(newYearInput)}
          onCancel={() => { setMigrationData(null); setShowAddYearModal(false); setNewYearInput(''); }}
          onComplete={(newProfile) => {
            setProfiles(prev => ({ ...prev, [newProfile.year]: newProfile }));
            setMigrationData(null);
            setShowAddYearModal(false);
            setNewYearInput('');
            setActiveYear(newProfile.year);
            navigate('/registro');
          }}
        />
      )}

      {yearToDelete !== null && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              {deleteStep === 1 ? (
                <>
                  <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-8 h-8" /></div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">Protocolo de Exclusão</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Você está prestes a apagar todos os dados do ciclo <span className="font-black text-rose-500">{yearToDelete}</span>.</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => setDeleteStep(2)} className="w-full py-4 bg-[#0F172A] dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all">Continuar</button>
                    <button onClick={() => setYearToDelete(null)} className="w-full py-4 text-slate-400 hover:text-slate-900 dark:hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all">Abortar</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-rose-600/30">
                    {isDeleting ? <RefreshCw className="w-8 h-8 animate-spin" /> : <ShieldAlert className="w-8 h-8" />}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">Segurança Final</h3>
                  <div className="mb-8">
                    <label className="block text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">Digite "DELETAR" para validar</label>
                    <input type="text" disabled={isDeleting} value={deleteConfirmationText} onChange={(e) => setDeleteConfirmationText(e.target.value.toUpperCase())} autoFocus className={`w-full h-14 bg-slate-50 dark:bg-slate-950 border-2 rounded-2xl text-center text-lg font-black outline-none transition-all ${deleteConfirmationText === 'DELETAR' ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 dark:border-slate-800 text-rose-500'}`} placeholder="CHAVE..." />
                  </div>
                  <div className="flex flex-col gap-3">
                    <button disabled={deleteConfirmationText !== 'DELETAR' || isDeleting} onClick={confirmDeleteYear} className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-600/30 disabled:opacity-20 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                      {isDeleting ? 'Excluindo...' : 'Destruir Dados Agora'}
                    </button>
                    {!isDeleting && <button onClick={() => { setDeleteStep(1); setDeleteConfirmationText(''); }} className="w-full py-4 text-slate-400 hover:text-slate-900 dark:hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all">Voltar</button>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all hover:border-slate-400 dark:hover:border-slate-500 group shadow-sm flex flex-col items-center text-center">
    <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-800 w-fit rounded-lg text-slate-400 group-hover:text-emerald-500 transition-colors">{icon}</div>
    <h3 className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-800 dark:text-slate-200">{title}</h3>
    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{description}</p>
  </div>
);

interface MigrationWizardProps {
  prevProfile: YearProfile;
  targetYear: number;
  onCancel: () => void;
  onComplete: (profile: YearProfile) => void;
}

const MigrationWizard: React.FC<MigrationWizardProps> = ({ prevProfile, targetYear, onCancel, onComplete }) => {
  const allItems = useMemo(() => (Object.entries(prevProfile.financialData) as [CategoryType, FinancialItem[]][]).flatMap(([cat, items]) => items.map(i => ({ ...i, category: cat }))), [prevProfile]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(allItems.map(i => i.id)));
  const [itemOverrides, setItemOverrides] = useState<Record<string, { value: number; dueDay: number }>>(() => {
    const overrides: Record<string, { value: number; dueDay: number }> = {};
    allItems.forEach(i => { overrides[i.id] = { value: i.value, dueDay: i.frequency?.dueDay || 10 }; });
    return overrides;
  });

  // Teclado listener para o Wizard
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && selectedIds.size > 0) handleFinish();
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [onCancel, selectedIds, itemOverrides]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => setSelectedIds(new Set(allItems.map(i => i.id)));
  const handleDeselectAll = () => setSelectedIds(new Set());

  const updateOverride = (id: string, field: 'value' | 'dueDay', val: number) => setItemOverrides(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));

  const handleFinish = () => {
    const newFinancialData: Record<CategoryType, FinancialItem[]> = { 'ESSENCIAIS': [], 'QUALIDADE DE VIDA': [], 'FUTURO': [], 'DÍVIDAS': [] };
    const newFinancialTags: Record<CategoryType, SubCategoryTag[]> = { 'ESSENCIAIS': [], 'QUALIDADE DE VIDA': [], 'FUTURO': [], 'DÍVIDAS': [] };
    allItems.forEach(item => {
      if (selectedIds.has(item.id)) {
        const override = itemOverrides[item.id];
        const newItem: FinancialItem = { ...item, id: crypto.randomUUID(), value: override.value, frequency: item.frequency ? { ...item.frequency, startYear: targetYear, dueDay: override.dueDay } : undefined };
        newFinancialData[item.category].push(newItem);
        const tag = prevProfile.customTags[item.category].find(t => t.name === item.subCategory);
        if (tag && !newFinancialTags[item.category].some(t => t.name === tag.name)) newFinancialTags[item.category].push(tag);
      }
    });
    onComplete({ year: targetYear, financialData: newFinancialData, customTags: newFinancialTags, monthlyEntries: [], incomeEntries: [] });
  };

  const handleSkipMigration = () => {
    onComplete({
      year: targetYear,
      financialData: { 'ESSENCIAIS': [], 'QUALIDADE DE VIDA': [], 'FUTURO': [], 'DÍVIDAS': [] },
      customTags: { 'ESSENCIAIS': [], 'QUALIDADE DE VIDA': [], 'FUTURO': [], 'DÍVIDAS': [] },
      monthlyEntries: [],
      incomeEntries: []
    });
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[80vh] rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4"><div className="p-3 bg-emerald-500 rounded-2xl shadow-lg text-white"><ArrowRightLeft className="w-5 h-5" /></div><div><h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Migração {prevProfile.year} → {targetYear}</h2></div></div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        
        <div className="flex items-center gap-4 px-8 py-3 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button onClick={handleSelectAll} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors flex items-center gap-1.5 active:scale-95"><ListChecks className="w-3.5 h-3.5" /> Selecionar Todos</button>
          <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
          <button onClick={handleDeselectAll} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1.5 active:scale-95"><Eraser className="w-3.5 h-3.5" /> Desmarcar Todos</button>
          <div className="ml-auto text-[9px] font-black uppercase tracking-widest text-slate-400/60 tabular-nums">{selectedIds.size} de {allItems.length} selecionados</div>
        </div>

        <div className="flex-grow overflow-y-auto px-8 py-6 space-y-3 custom-scrollbar">
          {allItems.map(item => {
            const isSelected = selectedIds.has(item.id);
            const override = itemOverrides[item.id];
            return (
              <div key={item.id} onClick={() => toggleSelect(item.id)} className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-6 p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'bg-white dark:bg-slate-800 border-emerald-500/50 shadow-md' : 'bg-slate-50 dark:bg-slate-950/20 border-transparent opacity-50 grayscale hover:opacity-100 hover:grayscale-0'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-transparent text-white' : 'border-slate-300'}`}>{isSelected && <Check className="w-3.5 h-3.5" />}</div>
                <div className="min-w-0"><h4 className="text-sm font-black text-slate-900 dark:text-white truncate uppercase">{item.item}</h4></div>
                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                   <div className="flex flex-col"><input type="number" value={override.value} onChange={(e) => updateOverride(item.id, 'value', parseFloat(e.target.value) || 0)} className="w-24 h-10 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-2 font-black text-xs" /></div>
                   <div className="flex flex-col"><input type="number" min="1" max="31" value={override.dueDay} onChange={(e) => updateOverride(item.id, 'dueDay', parseInt(e.target.value) || 1)} className="w-16 h-10 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-center font-black text-xs" /></div>
                </div>
                <div className="text-right"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.frequency?.type}</span></div>
              </div>
            );
          })}
        </div>
        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <button onClick={onCancel} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Abortar</button>
          <div className="flex items-center gap-4">
            <button onClick={handleSkipMigration} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors border-2 border-amber-500/20 rounded-xl flex items-center gap-2 group"><FileX className="w-4 h-4 group-hover:scale-110 transition-transform" /> Criar Perfil Vazio</button>
            <button onClick={handleFinish} disabled={selectedIds.size === 0} className="bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-30">Finalizar Migração</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
