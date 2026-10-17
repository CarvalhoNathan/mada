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
