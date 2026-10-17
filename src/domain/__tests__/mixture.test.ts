import { describe, it, expect } from 'vitest';
import {
  calcularFracoesMistura,
  recalcularVolumePorComponente,
  ItemReceitaParaCalculo,
} from '../mixture';

describe('Domain: mixture (Cálculo de Mistura Química)', () => {
  const receita4Componentes: ItemReceitaParaCalculo[] = [
    { papel: 'base', produtoNome: 'Base PU', proporcao: 0.5, densidade: 1.1 },
    { papel: 'catalisador', produtoNome: 'Catalisador PU', proporcao: 0.25, densidade: 0.98 },
    { papel: 'diluidor', produtoNome: 'Diluidor', proporcao: 0.2, densidade: 0.88 },
    { papel: 'retardador', produtoNome: 'Retardador', proporcao: 0.05, densidade: 0.92 },
  ];

  const receita2Componentes: ItemReceitaParaCalculo[] = [
    { papel: 'base', produtoNome: 'Verniz PU', proporcao: 0.8, densidade: 0.95 },
    { papel: 'catalisador', produtoNome: 'Catalisador PU', proporcao: 0.2, densidade: 0.98 },
  ];

  it('deve calcular corretamente as 4 frações para 1000 ml', () => {
    const fracoes = calcularFracoesMistura(receita4Componentes, 1000);

    expect(fracoes).toHaveLength(4);

    expect(fracoes[0].volumeMl).toBe(500);
    expect(fracoes[0].pesoGramas).toBe(550); // 500 * 1.10

    expect(fracoes[1].volumeMl).toBe(250);
    expect(fracoes[1].pesoGramas).toBe(245); // 250 * 0.98

    expect(fracoes[2].volumeMl).toBe(200);
    expect(fracoes[2].pesoGramas).toBe(176); // 200 * 0.88

    expect(fracoes[3].volumeMl).toBe(50);
    expect(fracoes[3].pesoGramas).toBe(46); // 50 * 0.92
  });

  it('deve garantir que a soma das frações de volume corresponda ao total', () => {
    const totalVolume = 1000;
    const fracoes = calcularFracoesMistura(receita4Componentes, totalVolume);
    const somaVolumes = fracoes.reduce((acc, f) => acc + f.volumeMl, 0);

    expect(somaVolumes).toBe(totalVolume);
  });

  it('deve lidar corretamente com arredondamentos de frações fracionárias', () => {
    const fracoes = calcularFracoesMistura(receita4Componentes, 755);

    // 755 * 0.50 = 377.5 -> 378
    // 755 * 0.25 = 188.75 -> 189
    // 755 * 0.20 = 151
    // 755 * 0.05 = 37.75 -> 38
    expect(fracoes[0].volumeMl).toBe(378);
    expect(fracoes[1].volumeMl).toBe(189);
    expect(fracoes[2].volumeMl).toBe(151);
    expect(fracoes[3].volumeMl).toBe(38);
  });

  it('deve retornar volume e peso zerados se volumeTotal for zero ou negativo', () => {
    const fracoesZero = calcularFracoesMistura(receita4Componentes, 0);
    expect(fracoesZero.every((f) => f.volumeMl === 0 && f.pesoGramas === 0)).toBe(true);

    const fracoesNeg = calcularFracoesMistura(receita4Componentes, -500);
    expect(fracoesNeg.every((f) => f.volumeMl === 0 && f.pesoGramas === 0)).toBe(true);
  });

  it('deve calcular corretamente receita com 2 componentes (Verniz 4:1)', () => {
    const fracoes = calcularFracoesMistura(receita2Componentes, 500);

    expect(fracoes).toHaveLength(2);
    expect(fracoes[0].volumeMl).toBe(400); // 500 * 0.80
    expect(fracoes[0].pesoGramas).toBe(380); // 400 * 0.95
    expect(fracoes[1].volumeMl).toBe(100); // 500 * 0.20
    expect(fracoes[1].pesoGramas).toBe(98); // 100 * 0.98
  });

  it('deve recalcular o volume total ao dosar catalisador em excesso', () => {
    // Proporção de 25% (0.25). Se operador pesou 450 ml em vez de 250 ml:
    // Novo volume total da mistura deve ser 450 / 0.25 = 1.800 ml
    const novoVolume = recalcularVolumePorComponente(450, 0.25);
    expect(novoVolume).toBe(1800);

    // Se a proporção for inválida
    expect(recalcularVolumePorComponente(450, 0)).toBe(0);
    expect(recalcularVolumePorComponente(-100, 0.25)).toBe(0);
  });
});
