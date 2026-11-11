import { useState, useMemo, useCallback } from 'react';
import { Preparacao } from '../types';
import { PotLifeState } from '../components/ui/PotLifeTimerBanner';
import { MOCK_RECEITAS } from '../data';
import { preparacaoRepository } from '../data';
import {
  sincronizarEstadoPotLifePreparacao,
  ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO,
} from '../domain/potLife';
import { registrarConclusaoAplicacao } from '../domain/returnFlow';

const STORAGE_PROCEDIMENTOS = 'mada_pot_life_procedimentos';

interface UsePotLifeTimerParams {
  preparacaoAtivaCabine: Preparacao | null;
  preparacoes: Preparacao[];
  setPreparacoes: React.Dispatch<React.SetStateAction<Preparacao[]>>;
  cabineNome: string;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
}

export function usePotLifeTimer({
  preparacaoAtivaCabine,
  preparacoes,
  setPreparacoes,
  cabineNome,
  showToast,
}: UsePotLifeTimerParams) {
  // Procedimentos oficiais homologados pelo gestor p/ Pot Life Expirado (por receitaId)
  const [procedimentosPotLife, setProcedimentosPotLife] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROCEDIMENTOS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignora erro de parse
    }
    return {};
  });

  const handleSaveProcedimentoPotLife = useCallback((receitaId: number, procedimento: string) => {
    setProcedimentosPotLife((prev) => {
      const atualizado = { ...prev };
      if (procedimento.trim()) {
        atualizado[receitaId] = procedimento.trim();
      } else {
        delete atualizado[receitaId];
      }
      localStorage.setItem(STORAGE_PROCEDIMENTOS, JSON.stringify(atualizado));
      return atualizado;
    });
  }, []);

  // Estado de Pot Life derivado da aplicação ativa na cabine do operador logado
  const potLife: PotLifeState | null = useMemo(() => {
    const prepComAplicacao = preparacaoAtivaCabine;

    if (!prepComAplicacao || !prepComAplicacao.dosagemConcluidaEm || !prepComAplicacao.potLifeMinutos) {
      return null;
    }

    const startMs = new Date(prepComAplicacao.dosagemConcluidaEm).getTime();
    const receitaRef = MOCK_RECEITAS.find((r) => r.id === prepComAplicacao.receitaId);

    return {
      preparacaoId: prepComAplicacao.id,
      dosagemConcluidaEm: prepComAplicacao.dosagemConcluidaEm,
      startTime: startMs,
      potLifeMinutos: prepComAplicacao.potLifeMinutos,
      durationSeconds: prepComAplicacao.potLifeMinutos * 60,
      recipeName: prepComAplicacao.receitaNome,
      osNumber: prepComAplicacao.ordemServicoNumero,
      volumeTotal: prepComAplicacao.volumeTotal,
      cabineNome: prepComAplicacao.cabineNome || 'Cabine 01',
      procedimentoOficialValidado:
        procedimentosPotLife[prepComAplicacao.receitaId] ||
        receitaRef?.procedimentoOficialPotLifeExpirado,
    };
  }, [preparacaoAtivaCabine, procedimentosPotLife]);

  // Quando o Pot Life expira
  const handlePotLifeExpired = useCallback(
    async (expiredIso: string) => {
      const alvoId = potLife?.preparacaoId;
      if (!alvoId) return;
      const prepAlvo = preparacoes.find((p) => p.id === alvoId);
      if (!prepAlvo || prepAlvo.statusPotLife === 'POT_LIFE_EXPIRADO') return;

      const atualizada = sincronizarEstadoPotLifePreparacao(
        {
          ...prepAlvo,
          potLifeExpiradoEm: prepAlvo.potLifeExpiradoEm || expiredIso,
        },
        Date.now()
      );
      await preparacaoRepository.salvar(atualizada);
      const lista = await preparacaoRepository.listar();
      setPreparacoes(lista);
      showToast(ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO, 'warn');
    },
    [potLife, preparacoes, setPreparacoes, showToast]
  );

  // Conclusão da aplicação na pistola
  const handleFinishApplication = useCallback(async () => {
    localStorage.removeItem('mada_active_pot_life');

    const alvo =
      preparacaoAtivaCabine ||
      (potLife?.preparacaoId
        ? preparacoes.find((p) => p.id === potLife.preparacaoId)
        : null);

    if (alvo) {
      const prepComAplicacaoConcluida = registrarConclusaoAplicacao(alvo);
      await preparacaoRepository.salvar(prepComAplicacaoConcluida);
      const listaAtualizada = await preparacaoRepository.listar();
      setPreparacoes(listaAtualizada);
    }

    showToast(
      `✓ Aplicação concluída! ${cabineNome} liberada para novas operações. As embalagens permanecem pendentes de devolução.`,
      'success'
    );
  }, [preparacaoAtivaCabine, potLife, preparacoes, setPreparacoes, cabineNome, showToast]);

  return {
    potLife,
    procedimentosPotLife,
    handleSaveProcedimentoPotLife,
    handlePotLifeExpired,
    handleFinishApplication,
  };
}
