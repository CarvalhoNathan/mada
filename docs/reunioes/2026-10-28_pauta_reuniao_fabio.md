# 🪵 Pauta — Reunião com Fábio (Mada Marcenaria) · 28/10/2026

**Objetivo:** validar o MVP, destravar o acesso aos dados reais e fechar as regras de negócio pendentes antes da Fase 3 (Testes em Tablet, até 17/11).

---

## 1. Demonstração do MVP (~10 min)

Fluxo completo no tablet (dados fictícios):

1. Login por operador + PIN
2. Dashboard com alerta FEFO ("Use primeiro")
3. Vincular OS (Cliente › Projeto › Ambiente) — incluindo leitura de QR pela câmera
4. Receita + calculadora de mistura
5. Dosagem com trava anti-erro (modal de excesso)
6. Devolução de sobras + nova etiqueta com QR Code

**Perguntar ao final:** o fluxo está no nível de detalhe que ele esperava? Algo sobrando ou faltando?

---

## 2. Regras de negócio pendentes (seção 6.1)

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | A **mistura já catalisada** pode voltar ao estoque, ou só o produto puro da lata aberta? | |
| 2 | Sobra de mistura é **reaproveitada** em outra peça (dentro do tempo de vida útil) ou **descartada**? | |
| 3 | A pesagem é feita por **peso (g)** ou por **volume (ml)**? Se for peso, temos a **densidade** de cada produto? | |
| 4 | Quantos componentes tem cada tipo de receita (acabamento, fundo, selador)? | |
| 5 | Onde e como são registrados hoje o **lote e a validade**? | |
| 6 | **Quem cadastra as OS** hoje, e onde? | |
| 7 | A tolerância de **5%** para o alerta de excesso está boa? | |

---

## 3. Acesso aos dados (Supabase) — 🔴 bloqueante

- Pedir **acesso somente leitura** (ou **exportação em CSV**) com **prazo definido**.
- Contrato de dados mínimo:

| Dado | Campos mínimos |
|------|----------------|
| Produtos | nome, marca, código, unidade, densidade, preço |
| Lotes | lote, produto, validade, quantidade |
| Clientes / Projetos / Ambientes | os usados nas OS |
| Receitas (se houver) | componentes e proporções |

- Confirmar que podemos criar um **schema separado** para receitas, preparações, movimentações e sobras.
- Confirmar que o **plano atual do Supabase** cobre o projeto sem custo e se há **backup diário** (RNF04).

---

## 4. Levantamento das receitas

- Agendar conversa com os **pintores** para documentar as receitas que hoje "estão na cabeça".
- Quais receitas cadastrar primeiro (as 3 a 5 mais usadas)?
- Existe alguma troca de marca prevista (impacta o RF08 — Multimarca)?

---

## 5. Meta de 20% de redução de desperdício

- Validar o indicador: **Desperdício (%) = (descartado + excesso acima da receita) ÷ total retirado**.
- Existe algum dado histórico de consumo/estoque? Se não, combinar **1–2 semanas de registro manual** para a linha de base.

---

## 6. Logística da Fase 3

- Datas para **teste presencial na fábrica** (Wi-Fi do galpão + tablets reais).
- Qual **tablet/modelo** será usado (Android ou iPad? — impacta a leitura de QR Code).
- Quais **operadores** participam do teste piloto.
- **LGPD:** autorização para usar foto dos operadores no login.

---

## 7. Próximos passos / Prazos

| Ação | Responsável | Prazo |
|------|-------------|-------|
| Liberar acesso / CSV dos dados | Fábio | |
| Conversa com pintores (receitas) | Equipe + Fábio | |
| Teste presencial no galpão | Equipe | |
| Painel do Gestor | Equipe | após a reunião |
