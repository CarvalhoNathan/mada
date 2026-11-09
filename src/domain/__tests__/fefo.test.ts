import { describe, it, expect } from 'vitest';
import {
  ordenarLotesFEFO,
  calcularDiasAteVencimento,
  formatarStatusValidade,
  alocarConsumoMultiLoteFEFO,
} from '../fefo';

describe('Domain: fefo (Ordenação por Validade e Latas Abertas)', () => {
  const lotesExemplo = [
    { codigo: 'FECHADO-LONGE', diasAberto: 0, validade: '2027-01-01' },
    { codigo: 'ABERTO-HOJE', diasAberto: 1, validade: '2026-12-01' },
    { codigo: 'FECHADO-PERTO', diasAberto: 0, validade: '2026-10-25' },
    { codigo: 'ABERTO-3-DIAS', diasAberto: 3, validade: '2026-11-15' },
  ];

  it('deve priorizar latas já abertas em relação a latas lacradas', () => {
    const ordenados = ordenarLotesFEFO(lotesExemplo);

    // Os dois primeiros itens devem ser as latas abertas
    expect(ordenados[0].codigo).toBe('ABERTO-3-DIAS'); // aberta há mais tempo
    expect(ordenados[1].codigo).toBe('ABERTO-HOJE');
  });

  it('deve ordenar latas lacradas pela data de validade mais próxima', () => {
    const ordenados = ordenarLotesFEFO(lotesExemplo);

    // As duas últimas posições são as fechadas
    expect(ordenados[2].codigo).toBe('FECHADO-PERTO'); // validade em 2026
    expect(ordenados[3].codigo).toBe('FECHADO-LONGE'); // validade em 2027
  });

  it('não deve mutar o array original', () => {
    const copia = [...lotesExemplo];
    ordenarLotesFEFO(lotesExemplo);

    expect(lotesExemplo).toEqual(copia);
  });

  it('deve calcular dias até o vencimento corretamente', () => {
    const ref = new Date(2026, 9, 29); // 29/10/2026
    expect(calcularDiasAteVencimento('2026-11-05', ref)).toBe(7);
    expect(calcularDiasAteVencimento('2026-10-25', ref)).toBe(-4);
  });

  it('deve formatar status de validade destacando urgência e tempo aberto', () => {
    const ref = new Date(2026, 9, 29);
    const vencido = formatarStatusValidade('2026-10-25', 0, ref);
    expect(vencido.nivel).toBe('urgente');
    expect(vencido.rotulo).toContain('Vencido');

    const abertoCritico = formatarStatusValidade('2026-11-05', 3, ref);
    expect(abertoCritico.nivel).toBe('urgente');
    expect(abertoCritico.rotulo).toContain('Aberto (3d)');

    const loteNormal = formatarStatusValidade('2027-02-10', 0, ref);
    expect(loteNormal.nivel).toBe('normal');
  });

  it('deve alocar consumo em múltiplos lotes FEFO quando a primeira lata aberta tem saldo insuficiente', () => {
    const lotes = [
      { id: 10, codigo: '#SY-7410-NOVA', diasAberto: 0, validade: '2027-03-01', quantidadeAtual: 1000 },
      { id: 11, codigo: '#SY-7410-SOBRA-02', diasAberto: 4, validade: '2026-11-10', quantidadeAtual: 87 },
    ];

    const plano = alocarConsumoMultiLoteFEFO(lotes, 263);

    expect(plano.precisaComplementar).toBe(true);
    expect(plano.volumeFaltanteEstoqueMl).toBe(0);
    expect(plano.alocacoes).toHaveLength(2);
    expect(plano.alocacoes[0].lote.codigo).toBe('#SY-7410-SOBRA-02');
    expect(plano.alocacoes[0].volumeAlocadoMl).toBe(87);
    expect(plano.alocacoes[0].esgotouLote).toBe(true);
    expect(plano.alocacoes[1].lote.codigo).toBe('#SY-7410-NOVA');
    expect(plano.alocacoes[1].volumeAlocadoMl).toBe(176);
    expect(plano.alocacoes[1].saldoRestanteLoteMl).toBe(824);
  });
});
