
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Home as HomeIcon, FileText, Sun, Moon, Briefcase, Table2, Pin, PinOff, LogOut, Settings2, ArrowRightLeft, Landmark, RefreshCw, Trophy } from 'lucide-react';
import Home from './components/Home';
import Registro from './components/Registro';
import Mensal from './components/Mensal';
import Fluxo from './components/Fluxo';
import DividasMaster from './components/DividasMaster';
import Conquistas from './components/Conquistas';
import { Theme, FinancialItem, CategoryType, MonthlyEntry, SubCategoryTag, YearProfile, IncomeEntry, StrategyBlock, MasterDebt, FrequencyConfig, PaymentStatus, Conquista } from './types';
import { 
  supabase, 
  masterDebtToSupabase, 
  masterDebtFromSupabase,
  financialItemToSupabase,
  financialItemFromSupabase,
  monthlyEntryToSupabase,
  monthlyEntryFromSupabase,
  incomeEntryToSupabase,
  incomeEntryFromSupabase,
  strategyBlockToSupabase,
  conquistaToSupabase,
  conquistaFromSupabase,
  conquistaTagToSupabase,
  conquistaTagFromSupabase
} from './lib/supabase';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('finanza-theme');
    return (saved as Theme) || 'dark';
  });

  const [isHeaderPinned, setIsHeaderPinned] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeYear, setActiveYear] = useState<number | null>(() => {
    const saved = localStorage.getItem('finanza-active-year');
    return saved ? parseInt(saved) : null;
  });

  const [masterDebts, setMasterDebts] = useState<MasterDebt[]>(() => {
    const saved = localStorage.getItem('finanza-master-debts');
    return saved ? JSON.parse(saved) : [];
  });

  const [conquistas, setConquistas] = useState<Conquista[]>(() => {
    const saved = localStorage.getItem('finanza-conquistas');
    return saved ? JSON.parse(saved) : [];
  });

  const [conquistaTags, setConquistaTags] = useState<SubCategoryTag[]>(() => {
    const saved = localStorage.getItem('finanza-conquista-tags');
    return saved ? JSON.parse(saved) : [
      { name: 'PATRIMÔNIO', colorClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
      { name: 'LAZER', colorClass: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
      { name: 'CONSUMO', colorClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
    ];
  });

  const [profiles, setProfiles] = useState<Record<number, YearProfile>>(() => {
    const saved = localStorage.getItem('finanza-profiles');
    if (saved) return JSON.parse(saved);
    return {};
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const masterSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conquistaSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conquistaTagsSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDataFetching = useRef(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('finanza-theme', theme);
  }, [theme]);

  const fetchData = useCallback(async () => {
    if (isDataFetching.current) return;
    isDataFetching.current = true;
    setIsSyncing(true);
    try {
      const { data: dmData } = await supabase.from('dividas_master').select('*');
      if (dmData) setMasterDebts(dmData.map(masterDebtFromSupabase));

      const { data: cqData } = await supabase.from('conquistas').select('*');
      if (cqData) setConquistas(cqData.map(conquistaFromSupabase));

      const { data: cqtData } = await supabase.from('conquista_tags').select('*');
      if (cqtData && cqtData.length > 0) setConquistaTags(cqtData.map(conquistaTagFromSupabase));

      const { data: pData } = await supabase.from('perfis_ano').select(`
        *,
        dados_financeiros(*),
        tags_customizadas(*),
        entradas_mensais(*),
        entradas_receita(*),
        blocos_estrategia(*)
      `);

      if (pData) {
        const loadedProfiles: Record<number, YearProfile> = {};
        pData.forEach((p: any) => {
          const financialData: Record<CategoryType, FinancialItem[]> = { 'ESSENCIAIS': [], 'QUALIDADE DE VIDA': [], 'FUTURO': [], 'DÍVIDAS': [] };
          (p.dados_financeiros || []).forEach((item: any) => {
            financialData[item.categoria as CategoryType].push(financialItemFromSupabase(item));
          });

          const customTags: Record<CategoryType, SubCategoryTag[]> = { 'ESSENCIAIS': [], 'QUALIDADE DE VIDA': [], 'FUTURO': [], 'DÍVIDAS': [] };
          (p.tags_customizadas || []).forEach((tag: any) => {
            customTags[tag.categoria as CategoryType].push({ name: tag.nome, colorClass: tag.classe_cor });
          });

          loadedProfiles[p.ano] = {
            year: p.ano, id: p.id,
            financialData, customTags,
            monthlyEntries: (p.entradas_mensais || []).map(monthlyEntryFromSupabase),
            incomeEntries: (p.entradas_receita || []).map(incomeEntryFromSupabase),
            strategyBlocks: (p.blocos_estrategia || []).map((s: any) => ({
              id: s.id, entryId: s.entrada_id, itemTitle: s.titulo_item, title: s.titulo, 
              content: s.conteudo, mode: s.modo, status: s.status, month: s.mes, year: s.ano, 
              order: s.ordem, color: s.cor
            }))
          };
        });
        setProfiles(loadedProfiles);
      }
    } catch (err) {
      console.error('[FINANZA] Erro na busca inicial:', err);
    } finally {
      setIsSyncing(false);
      isDataFetching.current = false;
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (isDataFetching.current) return;
    localStorage.setItem('finanza-profiles', JSON.stringify(profiles));
    if (activeYear && profiles[activeYear]) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSyncing(true);
        await persistProfileToSupabase(activeYear, profiles[activeYear]);
        setIsSyncing(false);
      }, 1500);
    }
  }, [profiles, activeYear]);

  useEffect(() => {
    if (isDataFetching.current) return;
    localStorage.setItem('finanza-master-debts', JSON.stringify(masterDebts));
    if (masterSaveTimeoutRef.current) clearTimeout(masterSaveTimeoutRef.current);
    masterSaveTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const { data: dbDebts } = await supabase.from('dividas_master').select('id');
        if (dbDebts) {
          const localIds = masterDebts.map(d => d.id);
          const toDelete = dbDebts.map(d => d.id).filter(id => !localIds.includes(id));
          if (toDelete.length > 0) await supabase.from('dividas_master').delete().in('id', toDelete);
        }
        if (masterDebts.length > 0) await supabase.from('dividas_master').upsert(masterDebts.map(masterDebtToSupabase));
      } catch (err) {
        console.error('[SUPABASE] Erro ao sincronizar Master Debts:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 1500);
  }, [masterDebts]);

  useEffect(() => {
    if (isDataFetching.current) return;
    localStorage.setItem('finanza-conquistas', JSON.stringify(conquistas));
    if (conquistaSaveTimeoutRef.current) clearTimeout(conquistaSaveTimeoutRef.current);
    conquistaSaveTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const { data: dbCq } = await supabase.from('conquistas').select('id');
        if (dbCq) {
          const localIds = conquistas.map(c => c.id);
          const toDelete = dbCq.map(d => d.id).filter(id => !localIds.includes(id));
          if (toDelete.length > 0) await supabase.from('conquistas').delete().in('id', toDelete);
        }
        if (conquistas.length > 0) await supabase.from('conquistas').upsert(conquistas.map(conquistaToSupabase));
      } catch (err) {
        console.error('[SUPABASE] Erro ao sincronizar Conquistas:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 1500);
  }, [conquistas]);

  useEffect(() => {
    if (isDataFetching.current) return;
    localStorage.setItem('finanza-conquista-tags', JSON.stringify(conquistaTags));
    if (conquistaTagsSaveTimeoutRef.current) clearTimeout(conquistaTagsSaveTimeoutRef.current);
    conquistaTagsSaveTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      try {
        if (conquistaTags.length > 0) await supabase.from('conquista_tags').upsert(conquistaTags.map(conquistaTagToSupabase), { onConflict: 'nome' });
      } catch (err) {
        console.error('[SUPABASE] Erro ao sincronizar Conquista Tags:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 1500);
  }, [conquistaTags]);

  useEffect(() => { 
    if (activeYear) localStorage.setItem('finanza-active-year', activeYear.toString());
    else localStorage.removeItem('finanza-active-year');
  }, [activeYear]);

  const persistProfileToSupabase = async (year: number, profile: YearProfile) => {
    if (!profile.id) {
       const { data, error } = await supabase.from('perfis_ano').upsert({ ano: year }, { onConflict: 'ano' }).select().single();
       if (error || !data) return;
       profile.id = data.id;
    }
    const profileId = profile.id;
    const registry = (Object.entries(profile.financialData || {}) as [CategoryType, FinancialItem[]][]).flatMap(([cat, items]) => 
      (items || []).map(i => financialItemToSupabase(i, profileId, cat))
    );
    try {
      const { data: dbItems } = await supabase.from('dados_financeiros').select('id').eq('perfil_ano_id', profileId);
      if (dbItems) {
        const toDelete = dbItems.map(x => x.id).filter(id => !registry.map(r => r.id).includes(id));
        if (toDelete.length > 0) await supabase.from('dados_financeiros').delete().in('id', toDelete);
      }
      if (registry.length > 0) await supabase.from('dados_financeiros').upsert(registry);
    } catch (e) { console.error('[SUPABASE] Erro Registro:', e); }

    try {
      if ((profile.monthlyEntries || []).length > 0) {
        await supabase.from('entradas_mensais').upsert(profile.monthlyEntries.map(e => monthlyEntryToSupabase(e, profileId)));
      }
    } catch (e) { console.error('[SUPABASE] Erro Mensalidades:', e); }

    try {
      const currentIncomesIds = (profile.incomeEntries || []).map(i => i.id);
      await supabase.from('entradas_receita').delete().eq('perfil_ano_id', profileId).not('id', 'in', `(${currentIncomesIds.join(',')})`);
      if ((profile.incomeEntries || []).length > 0) await supabase.from('entradas_receita').upsert(profile.incomeEntries.map(i => incomeEntryToSupabase(i, profileId)));
    } catch (e) { console.error('[SUPABASE] Erro Receitas:', e); }

    try {
      const strategyIds = (profile.strategyBlocks || []).map(s => s.id);
      if (strategyIds.length > 0) {
        await supabase.from('blocos_estrategia').delete().eq('perfil_ano_id', profileId).not('id', 'in', `(${strategyIds.join(',')})`);
        await supabase.from('blocos_estrategia').upsert(profile.strategyBlocks!.map(s => strategyBlockToSupabase(s, profileId)));
      } else {
        await supabase.from('blocos_estrategia').delete().eq('perfil_ano_id', profileId);
      }
    } catch (e) { console.error('[SUPABASE] Erro Estratégias:', e); }

    const tags = (Object.entries(profile.customTags || {}) as [CategoryType, SubCategoryTag[]][]).flatMap(([cat, tgs]) => 
      (tgs || []).map(t => ({ perfil_ano_id: profileId, categoria: cat, nome: t.name, classe_cor: t.colorClass }))
    );
    if (tags.length > 0) await supabase.from('tags_customizadas').upsert(tags, { onConflict: 'perfil_ano_id,categoria,nome' });
  };

  const updateActiveProfile = useCallback((updater: (prev: YearProfile) => YearProfile) => {
    if (activeYear === null) return;
    setProfiles(prev => {
      const currentProfile = prev[activeYear];
      if (!currentProfile) return prev;
      return { ...prev, [activeYear]: updater(currentProfile) };
    });
  }, [activeYear]);

  const updateMasterDebts = useCallback((newDebtsOrUpdater: MasterDebt[] | ((prev: MasterDebt[]) => MasterDebt[])) => {
    setMasterDebts(prev => {
      const next = typeof newDebtsOrUpdater === 'function' ? newDebtsOrUpdater(prev) : newDebtsOrUpdater;
      return next;
    });
  }, []);

  const updateConquistas = useCallback((newCqOrUpdater: Conquista[] | ((prev: Conquista[]) => Conquista[])) => {
    setConquistas(prev => {
      const next = typeof newCqOrUpdater === 'function' ? newCqOrUpdater(prev) : newCqOrUpdater;
      return next;
    });
  }, []);

  const getFreqLabel = (freq?: FrequencyConfig) => {
    if (!freq) return '-';
    if (freq.type === 'semanal') return `SEM | ${['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][freq.weeklyDay || 0]}`;
    return `${freq.type.substring(0,3).toUpperCase()} | Dia ${String(freq.dueDay || 1).padStart(2, '0')}`;
  };

  const syncMonthlyEntries = useCallback(async (year: number) => {
    const profile = profiles[year];
    if (!profile || !profile.id || isDataFetching.current) return;

    const registryItems = (Object.entries(profile.financialData || {}) as [CategoryType, FinancialItem[]][]).flatMap(([category, items]) => 
      (items || []).map(item => ({ ...item, category }))
    );

    const validEntriesMap = new Map<string, MonthlyEntry>();
    
    for (let m = 1; m <= 12; m++) {
      registryItems.forEach(ri => {
        if (!ri.item || ri.item.trim() === '') return;
        if (ri.isCancelled && ri.cancelledYear !== undefined && (year > ri.cancelledYear || (year === ri.cancelledYear && m >= ri.cancelledMonth!))) return;

        const effectiveDebtType = ri.debtType || (ri.category === 'DÍVIDAS' ? 'PASSIVOS' : 'DESPESAS FIXAS');

        if (ri.masterDebtId) {
          const master = masterDebts.find(d => d.id === ri.masterDebtId);
          if (master) {
            const targetCompetence = `${year}-${String(m).padStart(2, '0')}`;
            const matchingInstallments = master.installments.filter(inst => inst.dueDate?.startsWith(targetCompetence));

            matchingInstallments.forEach(inst => {
              const instIdx = master.installments.indexOf(inst);
              const key = `${ri.id}-${year}-${m}-${instIdx}`;
              const instStr = `${String(inst.number).padStart(2, '0')}/${String(master.installmentsCount).padStart(2, '0')}`;
              
              const existing = (profile.monthlyEntries || []).find(e => e.itemId === ri.id && e.installmentIndex === instIdx);
              
              // Lógica Preservativa de Status para Dívidas Master
              let syncStatus: PaymentStatus = 'Pendente';
              let syncPaymentDate = '';
              let syncPaidValue = 0;

              if (inst.status === 'paid') {
                syncStatus = 'Pago';
                syncPaymentDate = inst.paidDate || '';
                syncPaidValue = inst.value;
              } else if (existing) {
                // Se no Master não está pago, preservamos a escolha tática feita no Fluxo (PLAN, NÃO, etc)
                // Apenas se o status no Fluxo for 'Pago' e no Master não, forçamos o reset para 'Pendente' 
                // (pois o Master é a verdade absoluta de liquidação)
                syncStatus = existing.status === 'Pago' ? 'Pendente' : existing.status;
                syncPaymentDate = syncStatus === 'Pago' ? existing.paymentDate : '';
                syncPaidValue = syncStatus === 'Pago' ? existing.paidValue : 0;
              }

              if (existing) {
                validEntriesMap.set(key, {
                  ...existing,
                  item: ri.item, category: ri.category, subCategory: ri.subCategory || '-',
                  installments: instStr, month: m, year: year, estimatedValue: inst.value,
                  dueDate: inst.dueDate || existing.dueDate, status: syncStatus,
                  paymentDate: syncPaymentDate, paidValue: syncPaidValue, installmentIndex: instIdx,
                  debtType: effectiveDebtType
                });
              } else {
                validEntriesMap.set(key, {
                  id: crypto.randomUUID(), itemId: ri.id, item: ri.item,
                  year, month: m, competenceMonth: m, competenceYear: year,
                  category: ri.category, subCategory: ri.subCategory || '-',
                  installments: instStr, frequencyLabel: 'MASTER',
                  estimatedValue: inst.value, paidValue: syncPaidValue, dueDate: inst.dueDate || '', 
                  paymentDate: syncPaymentDate, status: syncStatus,
                  group: ri.category, observation: '', hasOverride: false, order: 5,
                  masterDebtId: ri.masterDebtId, installmentIndex: instIdx,
                  debtType: effectiveDebtType
                });
              }
            });
          }
        } else {
          let shouldInclude = false;
          let diffMonths = 0;
          
          if (ri.frequency) {
            const { startMonth, startYear, type: freqType, customInterval = 1 } = ri.frequency;
            diffMonths = (year - startYear) * 12 + (m - startMonth);
            if (diffMonths >= 0) {
              if (['mensal', 'quinzenal', 'semanal'].includes(freqType)) shouldInclude = true;
              else if (freqType === 'trimestral') shouldInclude = diffMonths % 3 === 0;
              else if (freqType === 'semestral') shouldInclude = diffMonths % 6 === 0;
              else if (freqType === 'anual') shouldInclude = diffMonths % 12 === 0;
              else if (freqType === 'personalizado') shouldInclude = diffMonths % customInterval === 0;

              if (shouldInclude && ri.installments && ri.installments > 1) {
                const currentInstallment = diffMonths + 1;
                if (currentInstallment > ri.installments) shouldInclude = false;
              }
            }
          } else {
            shouldInclude = true;
          }

          if (shouldInclude) {
            const createSubEntry = (qIndex?: number) => {
              const qSuffix = qIndex ? `-Q${qIndex}` : '';
              const key = `${ri.id}-${year}-${m}${qSuffix}`;
              
              const dayOffset = qIndex === 2 ? 15 : 0;
              const preferredDay = (ri.frequency?.dueDay || 10) + dayOffset;
              const lastDay = new Date(year, m, 0).getDate();
              const finalDay = Math.min(preferredDay, lastDay);
              const dueDate = `${year}-${String(m).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`;
              
              const existing = (profile.monthlyEntries || []).find(e => 
                e.itemId === ri.id && e.month === m && e.year === year && (qIndex ? e.quinzenaIndex === qIndex : true)
              );

              const estimatedVal = (ri.installmentValues && diffMonths < ri.installmentValues.length) 
                ? ri.installmentValues[diffMonths] 
                : (Number(ri.value) || 0);

              let installmentStr = "-";
              if (ri.installments && ri.installments > 1) {
                installmentStr = `${String(diffMonths + 1).padStart(2, '0')}/${String(ri.installments).padStart(2, '0')}`;
              }
              if (qIndex) {
                installmentStr = qIndex === 1 ? '1ª Q' : '2ª Q';
              }

              if (existing) {
                validEntriesMap.set(key, {
                  ...existing,
                  item: ri.item, category: ri.category, subCategory: ri.subCategory || '-',
                  installments: installmentStr, frequencyLabel: getFreqLabel(ri.frequency),
                  estimatedValue: existing.hasOverride ? existing.estimatedValue : estimatedVal,
                  dueDate: existing.hasOverride ? existing.dueDate : dueDate,
                  status: existing.status, paymentDate: existing.paymentDate, paidValue: existing.paidValue,
                  quinzenaIndex: qIndex,
                  debtType: effectiveDebtType
                });
              } else {
                validEntriesMap.set(key, {
                  id: crypto.randomUUID(), itemId: ri.id, item: ri.item,
                  year, month: m, competenceMonth: m, competenceYear: year,
                  category: ri.category, subCategory: ri.subCategory || '-',
                  installments: installmentStr, frequencyLabel: getFreqLabel(ri.frequency),
                  estimatedValue: estimatedVal, paidValue: 0, dueDate, paymentDate: '', status: 'Pendente',
                  group: ri.category, observation: '', hasOverride: false, order: 5,
                  quinzenaIndex: qIndex,
                  debtType: effectiveDebtType
                });
              }
            };

            if (ri.frequency?.type === 'quinzenal') {
              createSubEntry(1);
              createSubEntry(2);
            } else {
              createSubEntry();
            }
          }
        }
      });
    }

    const newEntries = Array.from(validEntriesMap.values());
    const oldEntries = profile.monthlyEntries || [];
    if (JSON.stringify(newEntries) !== JSON.stringify(oldEntries)) {
      setProfiles(prev => ({ ...prev, [year]: { ...prev[year], monthlyEntries: newEntries } }));
    }
  }, [profiles, masterDebts]);

  useEffect(() => { 
    if (activeYear !== null && profiles[activeYear]) {
      const timer = setTimeout(() => syncMonthlyEntries(activeYear), 500);
      return () => clearTimeout(timer);
    }
  }, [activeYear, profiles[activeYear]?.financialData, masterDebts]);

  const currentProfile = activeYear !== null && profiles[activeYear] ? profiles[activeYear] : null;
  const allEntries = useMemo(() => Object.values(profiles).flatMap((p: YearProfile) => p.monthlyEntries || []), [profiles]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#f4f7fa] dark:bg-slate-950 transition-colors duration-200">
        <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/60 sticky top-0 z-[1000] shadow-sm">
          <div className="max-w-[1920px] mx-auto flex items-center justify-between px-4 md:px-8 h-[76px]">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-900 dark:bg-white rounded shadow-sm"><Briefcase className="w-4 h-4 text-white dark:text-slate-900" /></div>
                <h1 className="text-sm font-black tracking-tighter uppercase dark:text-white leading-none">Finanza <span className="text-slate-400 font-medium">Pro</span></h1>
              </div>
              {activeYear && (
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Settings2 className="w-3 h-3 text-slate-500" />
                  <span className="text-[9px] font-black uppercase text-slate-500">Perfil Ativo: <span className="text-slate-900 dark:text-white font-black">{activeYear}</span></span>
                </div>
              )}
              {isSyncing && (
                <div className="flex items-center gap-2 text-sky-500">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="text-[8px] font-black uppercase">Sincronizando</span>
                </div>
              )}
            </div>
            
            <nav className="flex items-center h-full">
              <div className="flex items-center gap-1 h-full">
                {(!activeYear || !profiles[activeYear]) && (
                  <NavLink to="/" className={({ isActive }) => `flex items-center gap-2 px-4 md:px-5 h-full text-[10px] font-black tracking-[0.15em] transition-all relative ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                    {({ isActive }) => (<><HomeIcon className="w-3.5 h-3.5" />HOME {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-white" />}</>)}
                  </NavLink>
                )}
                {activeYear && profiles[activeYear] && (
                  <>
                    <NavLink to="/registro" className={({ isActive }) => `flex items-center gap-2 px-4 md:px-5 h-full text-[10px] font-black tracking-[0.15em] transition-all relative ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {({ isActive }) => (<><FileText className="w-3.5 h-3.5" />REGISTRO {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-white" />}</>)}
                    </NavLink>
                    <NavLink to="/fluxo" className={({ isActive }) => `flex items-center gap-2 px-4 md:px-5 h-full text-[10px] font-black tracking-[0.15em] transition-all relative ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {({ isActive }) => (<><ArrowRightLeft className="w-3.5 h-3.5" />FLUXO {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-white" />}</>)}
                    </NavLink>
                    <NavLink to="/dividas" className={({ isActive }) => `flex items-center gap-2 px-4 md:px-5 h-full text-[10px] font-black tracking-[0.15em] transition-all relative ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {({ isActive }) => (<><Landmark className="w-3.5 h-3.5" />DÍVIDAS {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-white" />}</>)}
                    </NavLink>
                    <NavLink to="/conquistas" className={({ isActive }) => `flex items-center gap-2 px-4 md:px-5 h-full text-[10px] font-black tracking-[0.15em] transition-all relative ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {({ isActive }) => (<><Trophy className="w-3.5 h-3.5" />CONQUISTAS {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-white" />}</>)}
                    </NavLink>
                    <NavLink to="/mensal" className={({ isActive }) => `flex items-center gap-2 px-4 md:px-5 h-full text-[10px] font-black tracking-[0.15em] transition-all relative ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {({ isActive }) => (<><Table2 className="w-3.5 h-3.5" />MENSAL {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 dark:bg-white" />}</>)}
                    </NavLink>
                  </>
                )}
              </div>

              <div className="ml-4 md:ml-6 pl-4 md:pl-6 border-l border-slate-100 dark:border-slate-800/80 h-8 flex items-center gap-2">
                {activeYear && <button onClick={() => setActiveYear(null)} className="p-2 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"><LogOut className="w-4 h-4" /></button>}
                <button onClick={() => setIsHeaderPinned(!isHeaderPinned)} className={`p-2 rounded-md transition-all ${isHeaderPinned ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400'}`}>{isHeaderPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}</button>
                <button onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} className="p-2 rounded-md text-slate-400">{theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-500" />}</button>
              </div>
            </nav>
          </div>
        </header>

        <main className="flex-grow w-full max-w-[1920px] mx-auto px-4 md:px-8 py-6 md:py-8">
          <Routes>
            <Route path="/" element={(activeYear && profiles[activeYear]) ? <Navigate to="/registro" replace /> : <Home profiles={profiles} setProfiles={setProfiles} activeYear={activeYear} setActiveYear={setActiveYear} />} />
            <Route path="/dividas" element={<DividasMaster masterDebts={masterDebts} setMasterDebts={updateMasterDebts} allEntries={allEntries} />} />
            <Route path="/conquistas" element={<Conquistas conquistas={conquistas} setConquistas={updateConquistas} tags={conquistaTags} setTags={setConquistaTags} />} />
            {currentProfile ? (
              <>
                <Route path="/registro" element={<Registro data={currentProfile.financialData} setData={(newData) => updateActiveProfile(p => ({ ...p, financialData: typeof newData === 'function' ? newData(p.financialData) : newData }))} customTags={currentProfile.customTags} setCustomTags={(newTags) => updateActiveProfile(p => ({ ...p, customTags: typeof newTags === 'function' ? newTags(p.customTags) : newTags }))} entries={currentProfile.monthlyEntries} isHeaderPinned={isHeaderPinned} activeYear={activeYear!} masterDebts={masterDebts} setMasterDebts={updateMasterDebts} />} />
                <Route path="/fluxo" element={<Fluxo entries={currentProfile.monthlyEntries} setEntries={(newE) => updateActiveProfile(p => ({ ...p, monthlyEntries: typeof newE === 'function' ? newE(p.monthlyEntries) : newE }))} incomeEntries={currentProfile.incomeEntries} setIncomeEntries={(newI) => updateActiveProfile(p => ({ ...p, incomeEntries: typeof newI === 'function' ? newI(p.incomeEntries) : newI }))} financialData={currentProfile.financialData} setFinancialData={(newD) => updateActiveProfile(p => ({ ...p, financialData: typeof newD === 'function' ? newD(p.financialData) : newD }))} activeYear={activeYear!} isHeaderPinned={isHeaderPinned} strategyBlocks={currentProfile.strategyBlocks || []} setStrategyBlocks={(newB) => updateActiveProfile(p => ({ ...p, strategyBlocks: typeof newB === 'function' ? newB(p.strategyBlocks || []) : newB }))} masterDebts={masterDebts} setMasterDebts={updateMasterDebts} allProfiles={profiles} setProfiles={setProfiles} />} />
                <Route path="/mensal" element={<Mensal entries={currentProfile.monthlyEntries} setEntries={(newE) => updateActiveProfile(p => ({ ...p, monthlyEntries: typeof newE === 'function' ? newE(p.monthlyEntries) : newE }))} financialData={currentProfile.financialData} isHeaderPinned={isHeaderPinned} activeYear={activeYear!} />} />
              </>
            ) : <Route path="*" element={<Navigate to="/" replace />} />}
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
