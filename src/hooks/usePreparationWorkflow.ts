import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Lote,
  Movimentacao,
  Preparacao,
  ResiduoMisturaOcorrencia,
  Operator,
  Receita,
  ScreenId,
  StatusItemDevolucao,
  LocalMistura,
} from '../types';
import {
  loteRepository,
  movimentacaoRepository,
  preparacaoRepository,
  residuoMisturaRepository,
} from '../data';
import {
  MOCK_LOTES,
  MOCK_ORDENS_SERVICO,
  MOCK_PRODUTOS,
  MOCK_CHECKLIST_SOBRAS,
} from '../data';
import { ordenarLotesFEFO, alocarConsumoMultiLoteFEFO } from '../domain/fefo';
import {
  criarPreparacaoDevolucao,
  registrarMovimentacaoComponente,
  registrarImpressaoEtiquetaComponente,
  encerrarPreparacao,
  filtrarPreparacoesPendentesDevolucao,
  filtrarPreparacoesEmConferencia,
  filtrarPreparacoesHistoricoConcluido,
  temItensPendentesDevolucao,
} from '../domain/returnFlow';
import { registrarOcorrenciaResiduoMistura } from '../domain/potLife';
import {
  obterCabineOperador,
  buscarAplicacaoAtivaPorCabine,
  verificarBloqueioNovaPreparacaoCabine,
  verificarPermissaoDevolucaoDuranteAplicacao,
} from '../domain/operationalLocks';

interface UsePreparationWorkflowParams {
  selectedOperator: Operator;
  selectedOSNumber: string;
  clientName: string;
  selectedRecipe: Receita;
  recipeTotalVolume: number;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  onNavigate: (screen: ScreenId) => void;
  verificarReposicaoAutomaticaEstoque: (lotes: Lote[]) => void;
  potLifePreparacaoId?: string | null;
}

export function usePreparationWorkflow({
  selectedOperator,
  selectedOSNumber,
  clientName,
  selectedRecipe,
  recipeTotalVolume,
  showToast,
  onNavigate,
  verificarReposicaoAutomaticaEstoque,
  potLifePreparacaoId,
}: UsePreparationWorkflowParams) {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [preparacoes, setPreparacoes] = useState<Preparacao[]>([]);
  const [residuosMistura, setResiduosMistura] = useState<ResiduoMisturaOcorrencia[]>([]);
  const [activePreparacaoId, setActivePreparacaoId] = useState<string | null>(null);

  // Carregar dados iniciais dos repositórios
  useEffect(() => {
    loteRepository.listar().then((list) => {
      setLotes(list.length > 0 ? list : MOCK_LOTES);
    });

    movimentacaoRepository.listar().then((list) => {
      setMovimentacoes(list);
    });

    preparacaoRepository.listar().then((list) => {
      setPreparacoes(list);
    });

    residuoMisturaRepository.listar().then((list) => {
      setResiduosMistura(list);
    });
  }, []);

  // Separação estrita de preparações
  const preparacoesPendentes = useMemo(
    () => filtrarPreparacoesPendentesDevolucao(preparacoes),
    [preparacoes]
  );

  const preparacoesEmConferencia = useMemo(
    () => filtrarPreparacoesEmConferencia(preparacoes),
    [preparacoes]
  );

  const preparacoesHistorico = useMemo(
    () => filtrarPreparacoesHistoricoConcluido(preparacoes),
    [preparacoes]
  );

  // Identificação de cabine do operador atual
  const cabineOperador = useMemo(
    () => obterCabineOperador(selectedOperator),
    [selectedOperator]
  );

  const preparacaoAtivaCabine = useMemo(
    () => buscarAplicacaoAtivaPorCabine(preparacoes, cabineOperador.cabineId) || null,
    [preparacoes, cabineOperador.cabineId]
  );

  // Preparação em foco na tela de devolução
  const activePreparacao = useMemo(() => {
    if (activePreparacaoId) {
      const encontrada = preparacoes.find((p) => p.id === activePreparacaoId);
      if (encontrada && temItensPendentesDevolucao(encontrada)) {
        return encontrada;
      }
    }
    const daCabine = preparacoesPendentes.find(
      (p) => (p.cabineId || 'CABINE-01').toUpperCase() === cabineOperador.cabineId.toUpperCase()
    );
    return daCabine || preparacoesPendentes[0] || null;
  }, [preparacoes, activePreparacaoId, preparacoesPendentes, cabineOperador.cabineId]);

  // Registro de ocorrência/resíduo da mistura pronta
  const handleRegisterMixtureOccurrence = useCallback(
    async (dados: {
      localMistura: LocalMistura;
      quantidadeRestanteMl?: number;
      ocorrenciaRelacionada: string;
      procedimentoAdotado?: string;
    }) => {
      const alvo =
        preparacaoAtivaCabine ||
        (potLifePreparacaoId
          ? preparacoes.find((p) => p.id === potLifePreparacaoId)
          : activePreparacao) ||
        preparacoes[0];

      if (!alvo) return;

      const resultado = registrarOcorrenciaResiduoMistura({
        preparacao: alvo,
        operador: selectedOperator,
        localMistura: dados.localMistura,
        quantidadeRestanteMl: dados.quantidadeRestanteMl,
        ocorrenciaRelacionada: dados.ocorrenciaRelacionada,
        procedimentoAdotado: dados.procedimentoAdotado,
      });

      await residuoMisturaRepository.registrar(resultado.ocorrencia);
      await preparacaoRepository.salvar(resultado.preparacaoAtualizada);

      const [prepsAtualizadas, residuosAtualizados] = await Promise.all([
        preparacaoRepository.listar(),
        residuoMisturaRepository.listar(),
      ]);
      setPreparacoes(prepsAtualizadas);
      setResiduosMistura(residuosAtualizados);

      showToast(
        `✓ Ocorrência da mistura registrada (${dados.localMistura.toUpperCase()}) no histórico da ${alvo.ordemServicoNumero}.`,
        'info'
      );
    },
    [
      preparacaoAtivaCabine,
      potLifePreparacaoId,
      preparacoes,
      activePreparacao,
      selectedOperator,
      showToast,
    ]
  );

  // Conclusão da dosagem e início do fluxo FEFO + Pot Life
  const handleCompleteDosing = useCallback(
    async (
      dosingValues: Record<number, number>,
      wasteJustification?: string
    ) => {
      const verificacao = verificarBloqueioNovaPreparacaoCabine(
        preparacoes,
        cabineOperador.cabineId,
        cabineOperador.cabineNome
      );
      if (!verificacao.permitido) {
        showToast(
          verificacao.motivoBloqueio ||
            'Existe uma aplicação em andamento nesta cabine. Conclua a aplicação antes de finalizar nova dosagem.',
          'warn'
        );
        return;
      }

      const receita = selectedRecipe;
      const osAtiva =
        MOCK_ORDENS_SERVICO.find((o) => o.numero === selectedOSNumber) ||
        MOCK_ORDENS_SERVICO.find((o) => o.clienteNome === clientName) ||
        MOCK_ORDENS_SERVICO[0];
      const lotesBase = lotes.length > 0 ? lotes : MOCK_LOTES;
      const dosagemConcluidaIso = new Date().toISOString();

      const novaPreparacao = criarPreparacaoDevolucao({
        id: `PREP-${osAtiva.numero.replace(/\D/g, '')}-${Date.now().toString().slice(-4)}`,
        ordemServico: osAtiva,
        receita,
        operador: selectedOperator,
        volumeTotal: recipeTotalVolume,
        valoresDosados: dosingValues,
        lotesDisponiveis: lotesBase,
        produtosDisponiveis: MOCK_PRODUTOS,
        criadaEm: dosagemConcluidaIso,
        dosagemConcluidaEm: dosagemConcluidaIso,
        cabineId: cabineOperador.cabineId,
        cabineNome: cabineOperador.cabineNome,
      });

      for (const item of receita.itens) {
        const quantidade = dosingValues[item.id] || 0;
        if (quantidade > 0) {
          const lotesProduto = lotesBase.filter(
            (l) => l.produtoId === item.produtoId && l.quantidadeAtual > 0
          );
          const planoMultiLote = alocarConsumoMultiLoteFEFO(lotesProduto, quantidade);

          if (planoMultiLote.alocacoes.length > 0) {
            for (const aloc of planoMultiLote.alocacoes) {
              await loteRepository.atualizarQuantidade(aloc.lote.id, aloc.saldoRestanteLoteMl);
              await movimentacaoRepository.registrar({
                preparacaoId: novaPreparacao.id,
                tipo: 'RETIRADA',
                loteId: aloc.lote.id,
                ordemServicoId: osAtiva.id,
                operadorId: selectedOperator.id,
                quantidade: aloc.volumeAlocadoMl,
                justificativa:
                  planoMultiLote.precisaComplementar
                    ? `${wasteJustification ? `${wasteJustification} • ` : ''}Complemento multi-lote FEFO (${aloc.lote.codigo})`
                    : wasteJustification,
                registradaEm: dosagemConcluidaIso,
              });
            }
          } else {
            const lotesOrdenados = ordenarLotesFEFO(
              lotesBase.filter((l) => l.produtoId === item.produtoId)
            );
            const loteId = lotesOrdenados[0]?.id || item.id;
            await movimentacaoRepository.registrar({
              preparacaoId: novaPreparacao.id,
              tipo: 'RETIRADA',
              loteId,
              ordemServicoId: osAtiva.id,
              operadorId: selectedOperator.id,
              quantidade,
              justificativa: wasteJustification,
              registradaEm: dosagemConcluidaIso,
            });
          }
        }
      }

      await preparacaoRepository.salvar(novaPreparacao);
      const prepsAtualizadas = await preparacaoRepository.listar();
      setPreparacoes(prepsAtualizadas);
      setActivePreparacaoId(novaPreparacao.id);

      const lotesAtualizados = await loteRepository.listar();
      setLotes(lotesAtualizados);
      verificarReposicaoAutomaticaEstoque(lotesAtualizados);
      const movsAtualizadas = await movimentacaoRepository.listar();
      setMovimentacoes(movsAtualizadas);

      showToast(
        `✓ Dosagem concluída! Pot Life (${novaPreparacao.potLifeMinutos || 20} min) iniciado na ${
          cabineOperador.cabineNome
        }. Registre as ${novaPreparacao.itensDevolucao.length} embalagens.`,
        'success'
      );
      onNavigate('return');
    },
    [
      preparacoes,
      cabineOperador,
      selectedRecipe,
      selectedOSNumber,
      clientName,
      lotes,
      selectedOperator,
      recipeTotalVolume,
      verificarReposicaoAutomaticaEstoque,
      showToast,
      onNavigate,
    ]
  );

  // Registro de devolução/baixa individual de item
  const handleRegisterItemReturn = useCallback(
    async (params: {
      preparacaoId: string;
      itemId: string;
      saldoRestanteMl: number;
      destino: Exclude<StatusItemDevolucao, 'PENDENTE'>;
      checklistAprovado: Record<string, boolean>;
      motivoManual?: string;
      aprovacaoConferenciaTecnica?: boolean;
    }) => {
      const permissao = verificarPermissaoDevolucaoDuranteAplicacao(
        preparacoes,
        cabineOperador.cabineId,
        params.preparacaoId,
        cabineOperador.cabineNome
      );
      if (!permissao.permitido && !params.aprovacaoConferenciaTecnica) {
        showToast(
          permissao.motivoBloqueio ||
            'Conclua a aplicação ativa antes de registrar devoluções de outra preparação.',
          'warn'
        );
        return;
      }

      const prepAlvo = preparacoes.find((p) => p.id === params.preparacaoId);
      if (!prepAlvo) return;

      const itemAlvo = prepAlvo.itensDevolucao.find((i) => i.id === params.itemId);
      if (!itemAlvo) return;

      const produtoRef = MOCK_PRODUTOS.find((pr) => pr.id === itemAlvo.produtoId);
      const criteriosAplicaveis =
        produtoRef?.criteriosDevolucao && produtoRef.criteriosDevolucao.length > 0
          ? produtoRef.criteriosDevolucao
          : MOCK_CHECKLIST_SOBRAS;

      const resultado = registrarMovimentacaoComponente({
        preparacao: prepAlvo,
        itemId: params.itemId,
        saldoRestanteMl: params.saldoRestanteMl,
        destino: params.destino,
        checklistAprovado: params.checklistAprovado,
        operador: selectedOperator,
        criteriosAplicaveis,
        motivoManual: params.motivoManual,
        aprovacaoConferenciaTecnica: params.aprovacaoConferenciaTecnica,
      });

      if (!resultado.sucesso || !resultado.itemAtualizado) {
        showToast(resultado.erro || 'Não foi possível registrar este componente.', 'warn');
        return;
      }

      const itemResolvido = resultado.itemAtualizado;

      if (params.destino === 'DEVOLVIDO_AO_ESTOQUE') {
        await movimentacaoRepository.registrar({
          preparacaoId: prepAlvo.id,
          componenteItemId: itemResolvido.id,
          ordemServicoId: prepAlvo.ordemServicoId,
          operadorId: selectedOperator.id,
          loteId: itemResolvido.loteId,
          tipo: 'DEVOLUCAO',
          quantidade: itemResolvido.saldoRestanteInformadoMl,
          justificativa: `Devolução de sobra (${itemResolvido.produtoNome}): ${itemResolvido.saldoRestanteInformadoMl}ml`,
          registradaEm: itemResolvido.registradoEm || new Date().toISOString(),
        });

        const dataValidade = new Date();
        dataValidade.setDate(dataValidade.getDate() + 30);
        const validadeStr = dataValidade.toISOString().split('T')[0];

        await loteRepository.adicionarSobra({
          produtoId: itemResolvido.produtoId,
          produtoNome: `${itemResolvido.produtoNome.replace(/^[0-9]+[º°]?\s*/, '')} (Sobra)`,
          codigo: itemResolvido.loteSobraGeradoCodigo || `${itemResolvido.loteCodigo}-SOBRA`,
          validade: validadeStr,
          diasAberto: 1,
          quantidadeAtual: itemResolvido.saldoRestanteInformadoMl,
          statusUrgencia: 'alta',
          prateleira: itemResolvido.prateleiraOrigem || 'A-01 (Prateleira de Sobras)',
        });

        showToast(
          `✓ ${itemResolvido.produtoNome}: ${itemResolvido.saldoRestanteInformadoMl}ml devolvidos ao estoque!`,
          'success'
        );
      } else if (params.destino === 'EMBALAGEM_ESGOTADA') {
        await loteRepository.atualizarQuantidade(itemResolvido.loteId, 0);

        showToast(
          `✓ ${itemResolvido.produtoNome}: baixa de embalagem esgotada (0 ml de sobra) confirmada!`,
          'success'
        );
      } else if (params.destino === 'DESCARTADO_COMO_REFUGO') {
        await movimentacaoRepository.registrar({
          preparacaoId: prepAlvo.id,
          componenteItemId: itemResolvido.id,
          ordemServicoId: prepAlvo.ordemServicoId,
          operadorId: selectedOperator.id,
          loteId: itemResolvido.loteId,
          tipo: 'DESCARTE',
          quantidade: itemResolvido.saldoRestanteInformadoMl,
          justificativa: `Descarte de refugo (${itemResolvido.produtoNome}): ${
            itemResolvido.motivoReprovacao || 'Refugo químico'
          }`,
          registradaEm: itemResolvido.registradoEm || new Date().toISOString(),
        });

        showToast(
          `Refugo registrado para ${itemResolvido.produtoNome} (${itemResolvido.saldoRestanteInformadoMl}ml).`,
          'warn'
        );
      } else {
        showToast(
          `Embalagem de ${itemResolvido.produtoNome} marcada como Pendente de Conferência Técnica.`,
          'info'
        );
      }

      await preparacaoRepository.salvar(resultado.preparacaoAtualizada);
      const prepsAtualizadas = await preparacaoRepository.listar();
      setPreparacoes(prepsAtualizadas);

      if (!temItensPendentesDevolucao(resultado.preparacaoAtualizada)) {
        setActivePreparacaoId(null);
      }

      const lotesAtualizados = await loteRepository.listar();
      setLotes(lotesAtualizados);
      verificarReposicaoAutomaticaEstoque(lotesAtualizados);
      const movsAtualizadas = await movimentacaoRepository.listar();
      setMovimentacoes(movsAtualizadas);
    },
    [
      preparacoes,
      cabineOperador,
      selectedOperator,
      verificarReposicaoAutomaticaEstoque,
      showToast,
    ]
  );

  // Impressão da etiqueta térmica
  const handleMarkStickerPrinted = useCallback(
    async (preparacaoId: string, itemId: string) => {
      const prepAlvo = preparacoes.find((p) => p.id === preparacaoId);
      if (!prepAlvo) return;
      const prepAtualizada = registrarImpressaoEtiquetaComponente(prepAlvo, itemId);
      await preparacaoRepository.salvar(prepAtualizada);
      const prepsAtualizadas = await preparacaoRepository.listar();
      setPreparacoes(prepsAtualizadas);
    },
    [preparacoes]
  );

  // Encerramento da preparação
  const handleFinishPreparacao = useCallback(
    async (preparacaoId: string) => {
      const prepAlvo = preparacoes.find((p) => p.id === preparacaoId);
      if (!prepAlvo) return;
      const res = encerrarPreparacao(prepAlvo);
      if (!res.sucesso) {
        showToast(res.erro || 'Ainda existem pendências nesta preparação.', 'warn');
        return;
      }

      await preparacaoRepository.salvar(res.preparacaoAtualizada);
      const prepsAtualizadas = await preparacaoRepository.listar();
      setPreparacoes(prepsAtualizadas);
      setActivePreparacaoId(null);

      showToast(
        `✓ Preparação ${prepAlvo.ordemServicoNumero} encerrada com todas as embalagens rastreadas!`,
        'success'
      );
      onNavigate('dashboard');
    },
    [preparacoes, onNavigate, showToast]
  );

  return {
    lotes,
    movimentacoes,
    preparacoes,
    residuosMistura,
    activePreparacaoId,
    preparacoesPendentes,
    preparacoesEmConferencia,
    preparacoesHistorico,
    cabineOperador,
    preparacaoAtivaCabine,
    activePreparacao,
    setLotes,
    setMovimentacoes,
    setPreparacoes,
    setResiduosMistura,
    setActivePreparacaoId,
    handleRegisterMixtureOccurrence,
    handleCompleteDosing,
    handleRegisterItemReturn,
    handleMarkStickerPrinted,
    handleFinishPreparacao,
  };
}
