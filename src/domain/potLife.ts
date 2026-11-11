import {
  LocalMistura,
  Operador,
  Preparacao,
  Produto,
  Receita,
  ResiduoMisturaOcorrencia,
  StatusPotLife,
} from '../types';

export const ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO =
  'O tempo de Pot Life foi ultrapassado. Existe risco de endurecimento da mistura e comprometimento da pistola. Siga o procedimento interno da empresa e registre a ocorrência.';

export interface CalculoPotLife {
  inicioMs: number;
  expiraEmMs: number;
  expiraEmIso: string;
  duracaoSegundos: number;
  segundosDecorridos: number;
  segundosRestantes: number;
  percentualConsumido: number;
  status: StatusPotLife;
  expirado: boolean;
  proximoLimite: boolean;
  mensagemContextual: string;
  orientacaoProcedimento: string;
}

/**
 * Obtém a duração de Pot Life (em minutos) somente a partir de parâmetros técnicos
 * homologados e cadastrados na receita ou no produto.
 * Não inventa valores padrão caso não esteja cadastrado.
 */
export function obterDuracaoPotLifeHomologada(
  receita?: Pick<Receita, 'potLifeMinutos' | 'itens'> | null,
  produtos: Produto[] = []
): number | null {
  if (!receita) return null;
  if (typeof receita.potLifeMinutos === 'number' && Number.isFinite(receita.potLifeMinutos) && receita.potLifeMinutos > 0) {
    return receita.potLifeMinutos;
  }

  if (Array.isArray(receita.itens)) {
    for (const item of receita.itens) {
      const prod = Array.isArray(produtos) ? produtos.find((p) => p.id === item?.produtoId) : undefined;
      if (prod && typeof prod.potLifeMinutos === 'number' && Number.isFinite(prod.potLifeMinutos) && prod.potLifeMinutos > 0) {
        return prod.potLifeMinutos;
      }
    }
  }

  return null;
}

/**
 * Calcula o estado atual do Pot Life utilizando datas e horários absolutos,
 * garantindo consistência mesmo após recarregar a página, sair ou entrar novamente.
 */
export function calcularEstadoPotLife(
  dosagemConcluidaEm: string,
  potLifeMinutos: number,
  agoraMs: number = Date.now(),
  procedimentoOficialValidado?: string
): CalculoPotLife {
  const agoraValido = Number.isFinite(agoraMs) ? agoraMs : Date.now();
  const rawTime = dosagemConcluidaEm ? new Date(dosagemConcluidaEm).getTime() : NaN;
  const inicioMs = Number.isFinite(rawTime) ? rawTime : agoraValido;
  const safePotLife = Number.isFinite(potLifeMinutos) && potLifeMinutos > 0 ? potLifeMinutos : 20;
  const duracaoSegundos = Math.max(1, Math.round(safePotLife * 60));
  const expiraEmMs = inicioMs + duracaoSegundos * 1000;
  const expiraEmIso = new Date(expiraEmMs).toISOString();

  const segundosDecorridos = Math.max(0, Math.floor((agoraValido - inicioMs) / 1000));
  const segundosRestantes = Math.max(0, duracaoSegundos - segundosDecorridos);
  const percentualConsumido = Math.min(
    100,
    Math.max(0, (segundosDecorridos / duracaoSegundos) * 100)
  );

  // Alerta preventivo quando restam 5 minutos (300s) ou menos de 25% do tempo total
  const limiteAlertaSegundos = Math.min(300, Math.floor(duracaoSegundos * 0.25));
  const expirado = segundosRestantes <= 0;
  const proximoLimite = !expirado && segundosRestantes <= limiteAlertaSegundos;

  let status: StatusPotLife = 'NORMAL';
  if (expirado) {
    status = 'POT_LIFE_EXPIRADO';
  } else if (proximoLimite) {
    status = 'PROXIMO_LIMITE';
  }

  const orientacaoProcedimento =
    procedimentoOficialValidado && procedimentoOficialValidado.trim().length > 0
      ? procedimentoOficialValidado
      : ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO;

  const minutosRestantes = Math.floor(segundosRestantes / 60);
  const segsRestantesMod = segundosRestantes % 60;
  const tempoFormatado = `${String(minutosRestantes).padStart(2, '0')}:${String(
    segsRestantesMod
  ).padStart(2, '0')}`;

  let mensagemContextual: string;
  if (expirado) {
    mensagemContextual = orientacaoProcedimento;
  } else if (proximoLimite) {
    mensagemContextual = `Alerta preventivo: restam apenas ${tempoFormatado} do Pot Life (${potLifeMinutos} min). Atenção ao risco de catalisação na pistola.`;
  } else {
    mensagemContextual = `Mistura dentro do tempo de utilização (${tempoFormatado} restantes de ${potLifeMinutos} min homologados).`;
  }

  return {
    inicioMs,
    expiraEmMs,
    expiraEmIso,
    duracaoSegundos,
    segundosDecorridos,
    segundosRestantes,
    percentualConsumido,
    status,
    expirado,
    proximoLimite,
    mensagemContextual,
    orientacaoProcedimento,
  };
}

/**
 * Registra o início da aplicação na pistola sem reiniciar o cronômetro de Pot Life,
 * preservando intacto o timestamp `dosagemConcluidaEm`.
 */
export function iniciarAplicacaoPistola(
  preparacao: Preparacao,
  iniciadaEm: string = new Date().toISOString()
): Preparacao {
  return {
    ...preparacao,
    aplicacaoIniciadaEm: preparacao.aplicacaoIniciadaEm || iniciadaEm,
  };
}

/**
 * Verifica e sincroniza a expiração do Pot Life na preparação.
 * Quando o tempo expira:
 * 1. Altera o estado da mistura/aplicação para `POT_LIFE_EXPIRADO`;
 * 2. Registra o horário da expiração (`potLifeExpiradoEm`);
 * 3. NÃO interrompe nem finaliza automaticamente a aplicação (`aplicacaoConcluidaEm` permanece inalterado).
 */
export function sincronizarEstadoPotLifePreparacao(
  preparacao: Preparacao,
  agoraMs: number = Date.now()
): Preparacao {
  if (
    !preparacao.dosagemConcluidaEm ||
    !preparacao.potLifeMinutos ||
    preparacao.aplicacaoConcluidaEm ||
    preparacao.statusAplicacao === 'APLICACAO_CONCLUIDA'
  ) {
    return preparacao;
  }

  const calculo = calcularEstadoPotLife(
    preparacao.dosagemConcluidaEm,
    preparacao.potLifeMinutos,
    agoraMs
  );

  if (calculo.expirado) {
    const potLifeExpiradoEm = preparacao.potLifeExpiradoEm || calculo.expiraEmIso;
    const statusAplicacao =
      preparacao.statusAplicacao === 'OCORRENCIA_REGISTRADA'
        ? 'OCORRENCIA_REGISTRADA'
        : 'POT_LIFE_EXPIRADO';

    const statusMacro =
      preparacao.status === 'PREPARACAO_ENCERRADA' ||
      preparacao.status === 'DEVOLUCAO_CONCLUIDA' ||
      preparacao.status === 'OCORRENCIA_REGISTRADA'
        ? preparacao.status
        : 'POT_LIFE_EXPIRADO';

    return {
      ...preparacao,
      potLifeExpiradoEm,
      statusPotLife: 'POT_LIFE_EXPIRADO',
      statusAplicacao,
      status: statusMacro,
    };
  }

  return {
    ...preparacao,
    statusPotLife: calculo.status,
  };
}

export interface ParametrosRegistroOcorrenciaMistura {
  preparacao: Preparacao;
  operador: Operador;
  localMistura: LocalMistura;
  ocorrenciaRelacionada: string;
  quantidadeRestanteMl?: number;
  procedimentoAdotado?: string;
  registradaEm?: string;
  agoraMs?: number;
}

export interface ResultadoRegistroOcorrenciaMistura {
  preparacaoAtualizada: Preparacao;
  ocorrencia: ResiduoMisturaOcorrencia;
}

/**
 * Registra uma ocorrência ou resíduo da mistura pronta (no béquer, na pistola ou em outro recipiente),
 * mantendo histórico próprio e sem misturar com a devolução de embalagens originais ao estoque.
 */
export function registrarOcorrenciaResiduoMistura(
  params: ParametrosRegistroOcorrenciaMistura
): ResultadoRegistroOcorrenciaMistura {
  const {
    preparacao,
    operador,
    localMistura,
    ocorrenciaRelacionada,
    quantidadeRestanteMl,
    procedimentoAdotado,
    registradaEm = new Date().toISOString(),
    agoraMs = new Date(registradaEm).getTime(),
  } = params;

  const prepSincronizada = sincronizarEstadoPotLifePreparacao(preparacao, agoraMs);

  let situacaoPotLife: StatusPotLife = prepSincronizada.statusPotLife || 'NORMAL';
  if (prepSincronizada.dosagemConcluidaEm && prepSincronizada.potLifeMinutos) {
    situacaoPotLife = calcularEstadoPotLife(
      prepSincronizada.dosagemConcluidaEm,
      prepSincronizada.potLifeMinutos,
      agoraMs
    ).status;
  }

  const ocorrencia: ResiduoMisturaOcorrencia = {
    id: `OCOR-${preparacao.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    preparacaoId: preparacao.id,
    ordemServicoId: preparacao.ordemServicoId,
    ordemServicoNumero: preparacao.ordemServicoNumero,
    receitaId: preparacao.receitaId,
    receitaNome: preparacao.receitaNome,
    operadorId: operador.id,
    operadorNome: operador.nome,
    cabineId: preparacao.cabineId || operador.cabineId || 'CABINE-01',
    quantidadeRestanteMl:
      typeof quantidadeRestanteMl === 'number' && quantidadeRestanteMl >= 0
        ? quantidadeRestanteMl
        : undefined,
    localMistura,
    registradaEm,
    situacaoPotLife,
    ocorrenciaRelacionada:
      ocorrenciaRelacionada.trim() ||
      'Registro operacional de resíduo/ocorrência da mistura catalisada.',
    procedimentoAdotado: procedimentoAdotado?.trim() || undefined,
  };

  const historicoAnterior = prepSincronizada.ocorrenciasMistura || [];
  const aplicacaoJaConcluida =
    Boolean(prepSincronizada.aplicacaoConcluidaEm) ||
    prepSincronizada.statusAplicacao === 'APLICACAO_CONCLUIDA';

  const preparacaoAtualizada: Preparacao = {
    ...prepSincronizada,
    statusAplicacao: aplicacaoJaConcluida ? 'APLICACAO_CONCLUIDA' : 'OCORRENCIA_REGISTRADA',
    status:
      prepSincronizada.status === 'PREPARACAO_ENCERRADA'
        ? 'PREPARACAO_ENCERRADA'
        : 'OCORRENCIA_REGISTRADA',
    ocorrenciasMistura: [ocorrencia, ...historicoAnterior],
  };

  return {
    preparacaoAtualizada,
    ocorrencia,
  };
}
