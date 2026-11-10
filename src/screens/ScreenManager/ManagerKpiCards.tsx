import React from 'react';
import { RotateCcw, FlaskConical, Target, Ruler, Lightbulb, CheckCircle2 } from 'lucide-react';
import { KpiCard } from '../../components/ui/KpiCard';
import { CountNumber } from '../../components/ui/CountNumber';
import { ScrubChart, ScrubDataPoint } from '../../components/ui/ScrubChart';

interface ManagerKpiCardsProps {
  economiaSobrasNum: number;
  totalLatasSobra: number;
  totalRealLitrosNum: number;
  totalCustoRealNum: number;
  taxaVariacaoNum: number;
  custoM2Num: number;
  pontosGrafico: ScrubDataPoint[];
  periodLabelText: string;
}

export const ManagerKpiCards: React.FC<ManagerKpiCardsProps> = ({
  economiaSobrasNum,
  totalLatasSobra,
  totalRealLitrosNum,
  totalCustoRealNum,
  taxaVariacaoNum,
  custoM2Num,
  pontosGrafico,
  periodLabelText,
}) => {
  return (
    <>
      {/* 1. Bento Grid de 4 KPIs Gerenciais */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <KpiCard
          isHero={true}
          label="Economia com Sobras (FEFO)"
          value={<CountNumber value={economiaSobrasNum} format={(n) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`} />}
          changeText={`${totalLatasSobra} latas reintegradas com etiqueta QR`}
          changeStatus="ok"
          icon={<RotateCcw size={22} color="#10B981" strokeWidth={2.4} />}
        />
        <KpiCard
          label="Volume Químico Apontado"
          value={<CountNumber value={Math.round(totalRealLitrosNum * 10)} format={(n) => (n / 10).toFixed(1).replace('.', ',')} />}
          unit="Litros"
          changeText={`R$ ${totalCustoRealNum.toLocaleString('pt-BR')} em químicos no período`}
          changeStatus="ok"
          icon={<FlaskConical size={22} color="#3B82F6" strokeWidth={2.4} />}
        />
        <KpiCard
          label="Variação Previsto vs Real"
          value={
            <CountNumber
              value={Math.round(taxaVariacaoNum * 10)}
              format={(n) => `${n >= 0 ? '+' : ''}${(n / 10).toFixed(1).replace('.', ',')}%`}
            />
          }
          changeText="Meta SMART: manter abaixo de +5%"
          changeStatus={taxaVariacaoNum <= 5 ? 'ok' : 'warn'}
          icon={<Target size={22} color="#10B981" strokeWidth={2.4} />}
        />
        <KpiCard
          label="Custo Médio / m² Pintado"
          value={<CountNumber value={custoM2Num} format={(n) => `R$ ${Math.round(n)},20`} />}
          unit="/ m²"
          changeText="Base: Primer Branco + Laca PU"
          changeStatus="ok"
          icon={<Ruler size={22} color="#F59E0B" strokeWidth={2.4} />}
        />
      </div>

      {/* 2. Gráfico Interativo de Scrub */}
      <ScrubChart points={pontosGrafico} periodLabel={periodLabelText} />

      {/* 3. Seção de Integração com ERP */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 24, 33, 0.95) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '14px',
          padding: '16px 22px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
            }}
          >
            <Lightbulb size={22} strokeWidth={2.4} />
          </div>
          <div>
            <strong style={{ fontSize: '15px', color: '#10B981' }}>
              Integração de Saídas com o ERP Mada (OC2703 / Ergi Tintas)
            </strong>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              No ERP atual, o card "Total Saídas" registrava 0 UN (R$ 0,00). Com os apontamentos via tablet, já foram integradas{' '}
              <strong style={{ color: 'var(--text)' }}>4 Ordens de Serviço</strong> com baixa de 4,6L de insumos químicos.
            </p>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10B981', fontWeight: 700 }}>
          <CheckCircle2 size={16} strokeWidth={2.4} /> Rastreabilidade 100% Ativa
        </span>
      </div>
    </>
  );
};
