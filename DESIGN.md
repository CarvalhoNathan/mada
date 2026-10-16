# 🎨 Design System & UX Guidelines - Mada Marcenaria

Este documento define os princípios de design, a experiência do utilizador (UX) e a arquitetura de ecrãs do **Sistema de Gestão de Químicos** da Mada Marcenaria.

O objetivo destas diretrizes é garantir que a aplicação web seja intuitiva, segura e adaptada para o uso no chão de fábrica, mitigando erros operacionais, mas respeitando estritamente a identidade visual de alto padrão e luxo da marca.

---

## 1. Princípios de Design (UX/UI)

Como a aplicação será utilizada no setor de pintura e montagem, a interface deve fundir a estética minimalista da marca com regras estritas de usabilidade industrial:

- **Abordagem "Tablet-First":** A interface primária é desenhada para tablets. Elementos clicáveis (botões, inputs) devem ser superdimensionados para facilitar o toque, considerando que os operadores podem estar a utilizar luvas de proteção.
- **Sistema "Anti-Erro" (Prevenção):** A interface deve ser defensiva. Ações destrutivas, consumo acima da receita ou inputs fora do padrão devem acionar modais de confirmação visualmente fortes, exigindo validação explícita do utilizador.
- **Luxo Funcional:** Manter o layout extremamente "clean" (limpo), valorizando o espaço em branco (negative space). Evitar poluição visual, sombras exageradas ou excesso de cores.
- **Fluxos Curtos e Diretos:** O número de cliques entre a seleção de uma receita e a confirmação de retirada deve ser minimizado.

---

## 2. Perfis de Utilizador (Atores)

1. **Operador (Pintor/Marceneiro):** Interage exclusivamente via tablet. Precisa de fluxos rápidos, leitura fácil de gabaritos e registo de consumo sem atrito.
2. **Gestor/Almoxarifado:** Interage via desktop/PC. Precisa de dashboards de análise de consumo (Previsto vs. Real), registo de novas receitas, gestão de validade e controlo de stock.

---

## 3. Identidade Visual (UI Funcional & Produtividade)

A estética da aplicação utiliza o conceito de **Design Operacional**, priorizando o contraste absoluto e o reconhecimento rápido de ações no chão de fábrica, com acenos sutis à marca da Mada Marcenaria no cabeçalho.

- **Fundo da Aplicação:** Branco Puro (`#FFFFFF`) ou Cinza Gelo (`#F3F4F6`) para maximizar a leitura sob iluminação industrial.
- **Cor Primária (Action Buttons):** Um tom de alta visibilidade e intenção positiva, como um Azul Industrial (`#0056B3`) ou Verde Sinalização (`#198754`).
- **Header/Marca:** Marrom Profundo (`#2B2522`) restrito à barra superior de navegação para manter a assinatura da marca.
- **Cor de Alerta (Prevenção de erros):** Vermelho Sinalização (`#DC3545`), brilhante e instintivo para paradas obrigatórias.
- **Tipografia:**
  - **Números e Quantidades:** _Inter_ ou _Roboto_ em peso **Bold/Black** e tamanho superdimensionado (ex: ml, litros).
  - **Botões:** Fonte sem serifa, **MAIÚSCULAS**, com espaçamento legível.
- **Affordance (Clicabilidade):** Botões devem ter uma leve elevação (Drop Shadow) e bordas minimamente suavizadas (Radius 4px-8px) para destacar claramente o que é interativo do que é apenas leitura.

---

## 4. Arquitetura de Ecrãs (Tablet)

### Ecrã 1: Autenticação Rápida (Login)

- **Objetivo:** Acesso rápido sem digitação complexa.
- **Elementos:** Grelha de avatares/nomes dos operadores com design minimalista. O utilizador seleciona o seu perfil e digita um PIN de 4 dígitos.
- **Status:** Indicador de ligação Wi-Fi no topo.

### Ecrã 2: Dashboard Inicial (Home)

- **Objetivo:** Ponto de partida para as ações de fábrica.
- **Elementos:**
  - Três botões retangulares maciços: `NOVA PREPARAÇÃO`, `DEVOLVER SOBRAS` e `ESCANEAR QR CODE`.
  - Painel Lateral Minimalista: Alertas de validade discretos.

### Ecrã 3: Vinculação de Ordem de Serviço (OS)

- **Objetivo:** Rastreabilidade do custo (Cliente > Projeto > Ambiente).
- **Elementos:**
  - Campos de pesquisa limpos com tipografia sem serifa.
  - Opção de ler QR Code da ficha impressa para preenchimento automático.

### Ecrã 4: Visualização da Receita (O Gabarito)

- **Objetivo:** Exibir a proporção exata dos químicos.
- **Elementos:**
  - Nome do acabamento em fonte serifada de grande destaque.
  - Calculadora embutida: O operador insere o volume total e o sistema recalcula automaticamente a Base, Catalisador, Diluidor e Retardador.
  - Indicador visual claro de qual marca recolher no stock.

### Ecrã 5: Check-out de Materiais (Baixa)

- **Objetivo:** Registar a retirada efetiva da prateleira.
- **Elementos:**
  - Inputs numéricos de quinas vivas com botões grandes de `+` e `-`.
  - **Regra de Segurança:** Se o valor for superior à receita, o ecrã escurece e exibe um modal de alerta retangular exigindo confirmação de desperdício.

### Ecrã 6: Devolução de Sobras

- **Objetivo:** Retornar material parcialmente utilizado ao almoxarifado.
- **Elementos:**
  - Abertura de câmara para ler a etiqueta QR Code da lata.
  - Input do volume restante.
  - Botão para gerar impressão de nova etiqueta atualizada.

---

## 5. Anexo: Prompts Base para Geração em IA

Caso a equipa necessite de gerar rascunhos visuais em ferramentas como v0.dev ou Galileo AI, utilizar os seguintes prompts baseados nesta diretriz:

- **Dashboard Inicial:** `A minimalist, luxury tablet UI design for an industrial factory floor app. Background is an elegant off-white/beige. Typography uses a mix of sophisticated serif for headers and clean, spaced-out uppercase sans-serif for buttons. Layout features sharp, non-rounded square buttons in deep dark brown/charcoal color. The screen has three massive square buttons: "NEW PAINT MIXTURE", "RETURN LEFTOVERS", and "SCAN QR CODE". High contrast, high-end furniture brand aesthetic, but with highly accessible hit zones for workers.`

- **Ecrã de Mistura:** `A highly functional, elegant tablet UI for a luxury furniture maker's paint mixing app. Off-white background. A sophisticated serif header reads "Finishing Recipe". Below, a clean, structured list of ingredients (Base, Catalyst, Diluent) using uppercase sans-serif typography. Exact measurements in milliliters are bold and highly visible. A sharp, rectangular, dark brown primary button at the bottom says "CONFIRM WITHDRAWAL". The design marries high-end minimalist aesthetics with industrial safety and usability.`

- **Modal de Alerta:** `A luxury tablet UI showing an error-prevention modal popup. The background is an off-white screen, slightly dimmed. The modal is a sharp-edged, flat rectangle. Inside, a clear warning message in deep dark gray: "WARNING: Entered quantity exceeds recipe limit." Below, two massive, sharp-edged rectangular buttons: a muted grey "CANCEL" and a solid, constrained red "CONFIRM ANYWAY". Elegant typography, minimalist luxury aesthetic applied to an industrial warning screen.`
