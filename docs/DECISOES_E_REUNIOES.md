# 📝 Registro de Decisões, Reuniões e Feedbacks Acadêmicos

Este documento registra as atas de reuniões com a empresa parceira (**Mada Marcenaria**) e os feedbacks recebidos durante as bancas/orientações acadêmicas com os professores da faculdade.

---

## 🎓 1. Feedback da Primeira Apresentação Acadêmica (Orientação / Professora)

Durante a primeira apresentação de validação do Canvas e do escopo, foram apontadas 4 inconsistências críticas de modelagem projetual que foram imediatamente ajustadas:

### 🚨 Alerta 1: Contradição entre Nuvem e Servidor Local
- **Apontamento da Professora:** No Canvas inicial havia choque direto entre o bloco de Requisitos/Entregas (que citava "Sistema em nuvem") e o bloco de Premissas/Custos (que citava "acesso ao servidor local da fábrica com custo zero").
- **Resolução & Decisão:** Em reunião posterior com o representante Fábio (Mada), confirmou-se que **a marcenaria não exige e prefere não instalar a aplicação no servidor interno da empresa**. Portanto, padronizou-se o projeto como uma **Aplicação Web Independente (Cloud/SaaS)** hospedada externamente, eliminando custos de manutenção física e simplificando o acesso via tablets por qualquer rede autorizada.

### 💡 Alerta 2: Escopo de Stakeholders (Cuidado com quem não participa)
- **Apontamento da Professora:** Havia menção a "Clientes Finais da marcenaria" como stakeholders. Como o cliente que compra o móvel de alto padrão não opera o sistema e não opina na interface, incluí-lo como stakeholder direto é conceitualmente incorreto.
- **Resolução & Decisão:** O cliente final foi reposicionado apenas como um **atributo de rastreabilidade (metadado da Ordem de Serviço)**. Os stakeholders diretos do projeto são estritamente: Gestores da Marcenaria, Operadores (Pintores/Marceneiros), Almoxarifado, Equipe de Desenvolvimento e Professores/Banca.

### 🎯 Alerta 3: Amarração de Riscos e Requisitos (Evitando Gaps no Canvas)
- **Apontamento da Professora:** O risco "Perda de dados por falta de backup" foi levantado, mas não havia um requisito funcional/técnico correspondente amarrando a solução no produto.
- **Resolução & Decisão:** Foi incluído o requisito explícito de **Rotina de Backup Diário e Exportação Automatizada de Dados** para neutralizar o risco na raiz.

### 📦 Alerta 4: Ajuste do Grupo de Entregas & Capacitação Operacional
- **Apontamento da Professora:** O manual de uso estava alocado na Entrega 1 (antes mesmo do software existir), e não havia previsão de capacitação para mitigar o risco de "Baixa adesão dos operadores".
- **Resolução & Decisão:** O **Manual de Instrução de Uso** foi movido para a **Entrega 5**, acompanhado da realização de **Treinamento e Capacitação dos Operadores no chão de fábrica**, garantindo a assimilação do sistema antes da entrega final.

---

## 🪵 2. Ata da Reunião Técnica com o Patrocinador (Fábio - Mada Marcenaria)

### Contexto da Reunião & Percepção do Problema Real:
> *"Composição e mistura, eles sabem de cabeça, e isso é um problema. Preferiria ter um tablet com as receitas, sabe? E eles darem baixa no que forem usando, E ASSOCIAR PARA QUAL CLIENTE E AMBIENTE, devolve a lata pro estoque com os valores... sim, é nesse nível. Mas se tiver difícil, relaxa e faz mais simples."*  
> — **Fábio, gestor da Mada Marcenaria**

### 🧪 Especificação dos Químicos e Fórmulas de Pintura:
1. **Composição Quádrupla Padrão:** As receitas combinam quatro componentes químicos fundamentais:
   - **Base** (tinta ou verniz);
   - **Catálise (Catalisador PU):** Componente reagente para endurecimento e brilho poliuretano;
   - **Diluidor (Solvente / Redutor):** Ajuste de viscosidade para aplicação a pistola;
   - **Retardador:** Aditivo químico para controlar o tempo de secagem em dias quentes/úmidos e evitar névoas.
2. **Catálogo de Referência Técnica:** A empresa utiliza o padrão [Sayerlack — Sayersystem](https://www.sayerlack.com.br/cartela_sayersystem.pdf) para definição de cartelas de cores e acabamentos. O acabamento de alto brilho é predominantemente à base de **PU (Poliuretano)**.
3. **Estrutura de Troca de Dados:** A API/sistema deve estruturar os dados em formato flexível (JSON) retornando *qual produto* e *qual volume exato (ml)* deve ser pesado por etapa.

### 🏭 Regras Operacionais de Chão de Fábrica:
- **Dispensação por Embalagens Padronizadas:** A retirada principal ocorre em latas de 1 litro ou galões.
- **Política de Sobras (Embalagens Abertas):** A quantidade remanescente na lata retorna fisicamente ao almoxarifado com nova pesagem/etiquetagem, evitando que fique abandonada na cabine.
- **Descarte Consciente de Resíduos:** O material que é efetivamente aplicado e limpo gera resíduo químico que deve ser armazenado em tambores de descarte e coletado periodicamente por empresa licenciada de descarte ambiental.
- **Critério de Validade (FEFO):** Cada lata tem prazo de validade rígido. O sistema deve priorizar o uso das latas mais próximas do vencimento e daquelas já abertas antes de autorizar a violação de uma lata lacrada.
- **Rastreabilidade de Custo:** O gasto de químico (incluindo desperdícios calculados da mistura) deve ser rateado e vinculado à conta da Ordem de Serviço daquele cliente e ambiente.
- **Etiquetagem & QR Code:** A marcenaria está iniciando a implantação de etiquetas com QR Code identificando o Cliente, Projeto e os insumos de pintura.

### 🛡️ Requisitos de Usabilidade & UX ("Sistema Anti-Erro"):
- **Prevenção Máxima de Erros:** A interface no tablet deve ser defensiva (bloqueios visuais, textos chamativos, pop-ups de confirmação em vermelho se o operador digitar uma quantidade que exceda o gabarito).
- **Sem Amarras de Identidade Visual Corporativa:** O gestor concedeu liberdade estética total à equipe, reforçando que a prioridade número 1 é **eficiência operacional e legibilidade no tablet**.
- **Desafio Multimarca:** Se a marcenaria trocar de fornecedor ou marca de química (ex: Sayerlack por outra marca), a proporção de catalisador/diluidor se altera. O sistema deve suportar múltiplas formulações associadas à marca do insumo.
- **Infraestrutura:** Não é necessário instalar nada no servidor físico da fábrica; a marcenaria prefere o modelo web para facilitar acesso via rede Wi-Fi dos tablets.

---

## 🪵 3. Ata da Segunda Reunião Técnica & Validação do MVP (28/10/2026 - Fábio)

### Contexto:
Apresentação do fluxo demonstrável do MVP e alinhamento sobre as dúvidas em aberto da modelagem física e operacional da oficina.

### Principais Definições & Decisões Operacionais:

1. **Unidade de Medida Oficial: Volume em Béquer (ml)**
   - **Diagnóstico:** A equipe não utiliza balança de pesagem digital no chão de fábrica da cabine de pintura; a medição de bases, catalisadores e diluidores é feita estritamente por **volume em mililitros (ml)** utilizando **béqueres graduados**.
   - **Decisão:** Remover termos que remetam a balança física e densidade em gramas nos fluxos operacionais, padronizando a unidade canônica como **ml** com instruções diretas para dosagem em béquer.

2. **Ergonomia do Tablet & Câmera Frontal (Selfie) para QR Code:**
   - **Diagnóstico:** O tablet operacional fica instalado em um **suporte rígido preso à parede** ao lado da bancada de preparação. Por isso, é fisicamente impossível apontar a câmera traseira para a lata ou para a ficha da OS.
   - **Decisão:** Inverter a câmera padrão do scanner de QR Code para a **câmera frontal (`facingMode: 'user'`)** com espelhamento horizontal no visor de vídeo, permitindo ao operador apresentar o frasco ou a ficha diretamente em frente à tela.

3. **Tempo de Vida Útil da Mistura (*Pot Life* / Catalisação) — 20 Minutos:**
   - **Diagnóstico:** Uma vez homogeneizada a mistura PU com o catalisador, o produto entra em processo irreversível de cura química. O tempo hábil de aplicação na pistola é de **exatamente 20 minutos**. Após esse período, o produto endurece, perde a viscosidade adequada e **deve ser obrigatoriamente descartado como refugo químico**, sob risco de estragar a peça e a pistola de pintura.
   - **Decisão:** Implementar timer regressivo visual de 20 minutos (*pot life*) acionado após a conclusão da dosagem, com avisos de urgência e opção de registrar descarte automático caso o tempo expire.

4. **Regras de FEFO & Validade Próxima:**
   - **Diagnóstico:** O gestor aprovou com entusiasmo a indicação visual de tempo de abertura da lata e reforçou a necessidade de priorizar não apenas latas abertas, mas também lotes com **vencimento próximo**.
   - **Decisão:** Reforçar a visibilidade dos prazos de validade no Dashboard e na seleção de lotes.

5. **Expansão de Escopo Solicitada pelo Gestor:**
   - **Gestão de Estoque & Solicitação de Compra:** Necessidade de visualizar níveis de estoque e permitir ao operador/encarregado adicionar itens com estoque crítico diretamente a uma **Lista de Solicitação de Compras**.
