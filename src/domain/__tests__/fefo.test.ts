import { describe, it, expect } from 'vitest';
import { ordenarLotesFEFO } from '../fefo';

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
});
