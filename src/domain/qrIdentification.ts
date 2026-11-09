import { OrdemServico, Lote, Produto } from '../types';

export type TipoQrIdentificado = 'ORDEM_SERVICO' | 'EMBALAGEM_LOTE' | 'DESCONHECIDO';

export interface ResultadoIdentificacaoQr {
  tipo: TipoQrIdentificado;
  codigoBruto: string;
  ordemServico?: OrdemServico;
  lote?: Lote;
  produto?: Produto;
  destinoSugerido: 'os' | 'return' | 'inventory' | 'dashboard';
  mensagemResumo: string;
}

/**
 * Analisa o código lido pelo scanner QR Code e separa estritamente:
 * 1. QR Code da Ordem de Serviço -> identifica a OS, recupera cliente e projeto, direciona para a tela de seleção do ambiente ('os').
 * 2. QR Code da Embalagem / Lote -> identifica o produto, lote e saldo atual, permitindo consultar histórico ou registrar devolução.
 */
export function classificarQrCode(
  codigoBruto: string,
  ordensServico: OrdemServico[],
  lotes: Lote[],
  produtos: Produto[]
): ResultadoIdentificacaoQr {
  const limpo = (codigoBruto || '').trim();
  const upper = limpo.toUpperCase();

  // 1. Verifica se é um QR Code de Ordem de Serviço (prefixo OS ou correspondência direta com número da OS)
  const isPadraoOS =
    upper.startsWith('OS-') ||
    upper.startsWith('OS #') ||
    upper.startsWith('OS#') ||
    ordensServico.some((o) => {
      const numLimpo = o.numero.replace(/^OS\s*#?/i, '').trim();
      return numLimpo.length > 0 && (upper === `OS-${numLimpo}` || upper === `OS #${numLimpo}` || upper === numLimpo);
    });

  if (isPadraoOS) {
    const osEncontrada =
      ordensServico.find((o) => {
        const numLimpo = o.numero.replace(/^OS\s*#?/i, '').trim();
        return upper.includes(numLimpo) || upper.includes(o.numero.toUpperCase());
      }) || ordensServico[0];

    return {
      tipo: 'ORDEM_SERVICO',
      codigoBruto: limpo,
      ordemServico: osEncontrada,
      destinoSugerido: 'os',
      mensagemResumo: osEncontrada
        ? `O.S. identificada: ${osEncontrada.numero} • ${osEncontrada.clienteNome} (${osEncontrada.ambienteNome})`
        : `Ordem de Serviço identificada (${limpo})`,
    };
  }

  // 2. Verifica se é um QR Code de Embalagem / Lote Químico (SOBRA, L-, #SY-, #OC-, EMB-, ou código existente de lote/produto)
  const loteEncontrado = lotes.find((l) => {
    const codLote = l.codigo.replace(/^#+/, '').toUpperCase();
    const codQrSemPrefixo = upper
      .replace(/^#?SOBRA-/, '')
      .replace(/^EMB-/, '')
      .replace(/^#+/, '');
    return (
      upper === l.codigo.toUpperCase() ||
      upper.includes(codLote) ||
      codLote.includes(codQrSemPrefixo)
    );
  });

  const isPadraoEmbalagem =
    Boolean(loteEncontrado) ||
    upper.includes('SOBRA') ||
    upper.startsWith('L-') ||
    upper.startsWith('#SY-') ||
    upper.startsWith('SY-') ||
    upper.startsWith('#OC-') ||
    upper.startsWith('EMB-');

  if (isPadraoEmbalagem) {
    const loteRef = loteEncontrado || lotes[0];
    const produtoRef = loteRef
      ? produtos.find((p) => p.id === loteRef.produtoId)
      : produtos[0];

    return {
      tipo: 'EMBALAGEM_LOTE',
      codigoBruto: limpo,
      lote: loteRef,
      produto: produtoRef,
      destinoSugerido: 'return',
      mensagemResumo: loteRef
        ? `Embalagem: ${loteRef.produtoNome} • Lote ${loteRef.codigo} • Saldo: ${loteRef.quantidadeAtual} ml`
        : `Embalagem química identificada (${limpo})`,
    };
  }

  return {
    tipo: 'DESCONHECIDO',
    codigoBruto: limpo,
    destinoSugerido: 'dashboard',
    mensagemResumo: `Código QR não reconhecido no catálogo (${limpo})`,
  };
}
