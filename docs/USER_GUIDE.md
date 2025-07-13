# Guia do Usuário
## Jira Productivity Dashboard

### 👋 **Bem-vindo ao Dashboard de Produtividade**

Este guia te ajudará a usar todas as funcionalidades do Dashboard de Produtividade que integra com o Jira para fornecer insights profundos sobre a performance da sua equipe de desenvolvimento.

---

## 🚀 **Primeiros Passos**

### **1. Configurando sua Conta no Jira**

Antes de usar o dashboard, você precisa de um **API Token** do Jira:

1. **Acesse:** [id.atlassian.com](https://id.atlassian.com)
2. **Vá em:** Account Settings → Security → API tokens
3. **Clique em:** "Create API token"
4. **Dê um nome:** ex: "Dashboard Produtividade"
5. **Copie o token** gerado (você só verá uma vez!)

### **2. Primeira Conexão**

1. **Abra o dashboard** no seu navegador
2. **Preencha os dados de conexão:**
   - **URL do Jira:** ex: `https://suaempresa.atlassian.net`
   - **Email:** seu email de login no Jira
   - **API Token:** o token que você criou
3. **Clique em "Conectar"**
4. **Aguarde a validação** das credenciais

### **3. Selecionando um Projeto**

1. **Escolha um projeto** da lista exibida
2. **Clique em "Selecionar Projeto"**
3. **Aguarde o carregamento** dos dados
4. **Pronto!** Você está no dashboard principal

---

## 📊 **Navegando pelo Dashboard**

### **Layout Principal**

```
┌─────────────────────────────────────────────────────┐
│                    HEADER                           │
│  Logo | Projeto Atual | AI Toggle | Logout         │
├─────────────┬───────────────────────────────────────┤
│             │                                       │
│   SIDEBAR   │           CONTEÚDO PRINCIPAL           │
│             │                                       │
│   Filtros   │    Métricas Cards + Gráficos         │
│   Estatís.  │                                       │
│             │                                       │
├─────────────┴───────────────────────────────────────┤
│                    FOOTER                           │
│  Última Atualização | Exportar | Relatórios        │
└─────────────────────────────────────────────────────┘
```

---

## 🎛️ **Sistema de Filtros**

### **Sidebar de Filtros**

#### **1. Período de Tempo**
- **Esta Semana:** Últimos 7 dias
- **Este Mês:** Últimas 4 semanas  
- **Trimestre:** Últimas 12 semanas
- **Todo Período:** Todos os dados
- **Personalizado:** Escolha datas específicas

#### **2. Sprint**
- Filtre por sprint específico
- Mostra apenas sprints ativos e recentes

#### **3. Membro da Equipe**
- Filtre por pessoa específica
- Lista todos os assignees do projeto

#### **4. Tipos de Issue**
- **Story:** Funcionalidades
- **Bug:** Correções
- **Task:** Tarefas
- **Epic:** Grandes iniciativas

### **Dicas de Filtros**
💡 **Dica:** Combine filtros para análises específicas  
💡 **Dica:** Use "Todo Período" para visão geral  
💡 **Dica:** Filtros são sincronizados entre Dashboard e Kanban

---

## 📈 **Cartões de Métricas**

### **1. Tarefas Entregues**
- **O que mostra:** Número de issues concluídas no período
- **Comparação:** % de mudança vs período anterior
- **Cor:** Verde (positivo) / Vermelho (negativo)

### **2. Velocidade**
- **O que mostra:** Story points concluídos no período
- **Cálculo:** Soma de todos os story points das issues Done
- **Uso:** Planejamento de sprints futuros

### **3. Cycle Time**
- **O que mostra:** Tempo médio para completar uma issue
- **Cálculo:** Da criação até resolução (em dias)
- **Meta:** Quanto menor, melhor

### **4. Taxa de Bugs**
- **O que mostra:** % de bugs vs total de issues
- **Cálculo:** (Bugs / Total Issues) × 100
- **Meta:** Manter baixo (< 20%)

---

## 📊 **Sistema de Gráficos (4 Abas)**

### **📈 Aba: Conclusões**

#### **Tarefas Concluídas por Período**
- **Visualização:** Gráfico de área suave
- **Dados:** Issues concluídas ao longo do tempo
- **Filtros:** Dia, semana ou mês
- **Uso:** Identificar tendências de produtividade

#### **Distribuição por Período**
- **Visualização:** Cards informativos
- **Dados:** Estatísticas detalhadas por período
- **Métricas:** Total, média, picos de entrega

### **🎯 Aba: Velocity**

#### **Velocity Chart**
- **Visualização:** Gráfico de barras combinado
- **Dados:** Story points + Issues por semana
- **Período:** Últimas 8 semanas
- **Uso:** Planejamento de sprints

#### **Dicas de Velocity**
💡 **Meta:** Manter velocity consistente  
💡 **Alerta:** Grandes variações podem indicar problemas  
💡 **Planejamento:** Use média das últimas 3-4 semanas

### **⏱️ Aba: Cycle Time**

#### **Cycle Time por Tipo**
- **Visualização:** Gráfico de barras + Lista detalhada
- **Dados:** Tempo médio por tipo de issue
- **Informações:** Min, max, média e quantidade
- **Uso:** Identificar gargalos no processo

#### **Análise de Cycle Time**
- **Stories:** Geralmente 3-10 dias
- **Bugs:** Idealmente < 3 dias
- **Tasks:** Varia muito (1-15 dias)
- **Epics:** Semanas ou meses

### **👥 Aba: Equipe**

#### **Ranking da Equipe**
- **Visualização:** Gráfico + Ranking com medalhas
- **Dados:** Issues resolvidas + Story points
- **Ranking:** 1º🥇 2º🥈 3º🥉
- **Uso:** Reconhecimento e balanceamento

#### **Métricas por Pessoa**
- **Issues Resolvidas:** Quantidade total
- **Story Points:** Pontos entregues
- **Cycle Time:** Tempo médio individual

---

## 🗂️ **Kanban Board**

### **Acessando o Kanban**
1. **Clique na aba "Kanban"** no menu superior
2. **Os filtros são mantidos** do dashboard
3. **Visualize as colunas** baseadas nos status do Jira

### **Funcionalidades do Kanban**

#### **Colunas Dinâmicas**
- **📋 Para Fazer:** Issues não iniciadas
- **🔄 Em Progresso:** Issues sendo trabalhadas  
- **✅ Concluído:** Issues finalizadas
- **🚫 Bloqueado:** Issues com impedimentos

#### **Cards das Issues**
- **Título** da issue
- **Tipo** (Story, Bug, Task)
- **Assignee** com avatar
- **Story Points** (se disponível)
- **Labels** coloridas

#### **Modal de Detalhes**
1. **Clique em qualquer card**
2. **Veja informações completas:**
   - Descrição detalhada
   - Status atual
   - Assignee
   - Datas de criação/atualização
   - Story points
   - Cycle time

### **Dicas do Kanban**
💡 **Filtros:** Use os mesmos filtros do dashboard  
💡 **Atualização:** Dados sincronizados em tempo real  
💡 **Detalhes:** Clique nos cards para mais informações

---

## 📋 **Exportação e Relatórios**

### **Exportar para PDF**
1. **Clique em "Exportar PDF"** no footer
2. **Aguarde a geração** do relatório
3. **Download automático** do arquivo
4. **Conteúdo:** Métricas + gráficos + insights

### **Exportar para CSV**
1. **Clique em "Exportar CSV"** no footer
2. **Download dos dados brutos**
3. **Use em:** Excel, Google Sheets, análises customizadas

### **Gerar Relatório**
1. **Clique em "Gerar Relatório"**
2. **Relatório executivo** com insights
3. **Inclui:** Resumo, tendências, recomendações

### **Conteúdo dos Relatórios**

#### **PDF Report**
- ✅ Métricas principais
- ✅ Gráficos de velocity
- ✅ Análise de cycle time
- ✅ Performance da equipe
- ✅ Insights e recomendações

#### **CSV Export**
- ✅ Lista completa de issues
- ✅ Todas as propriedades
- ✅ Dados calculados (cycle time, etc.)
- ✅ Compatível com Excel

---

## 🤖 **Insights com IA**

### **Ativando a IA**
1. **Toggle "AI"** no header (canto superior direito)
2. **Aguarde processamento** dos dados
3. **Veja insights** na sidebar

### **Tipos de Insights**

#### **Análise de Performance**
- Comparação com médias históricas
- Identificação de tendências
- Alerta sobre anomalias

#### **Predições**
- Estimativa de entrega futura
- Previsão de velocity
- Identificação de riscos

#### **Recomendações**
- Sugestões de melhorias
- Otimização de processos
- Balanceamento da equipe

---

## 🔧 **Configurações e Personalização**

### **Trocando de Projeto**
1. **Clique em "Trocar Projeto"** no header
2. **Selecione outro projeto** da lista
3. **Aguarde carregamento** dos novos dados

### **Logout**
1. **Clique em "Logout"** no header
2. **Credenciais removidas** da sessão
3. **Retorna à tela de login**

### **Configuração de Filtros Padrão**
- Filtros são **salvos na sessão**
- **Persistem entre páginas** (Dashboard ↔ Kanban)
- **Reset automático** ao trocar projeto

---

## 🚨 **Solução de Problemas**

### **Problemas de Conexão**

#### **"Credenciais Inválidas"**
✅ **Verifique:** URL do Jira correto  
✅ **Teste:** Email de login no Atlassian  
✅ **Confirme:** API token copiado corretamente  

#### **"Projeto Não Encontrado"**
✅ **Permissões:** Você tem acesso ao projeto?  
✅ **Status:** Projeto está ativo?  
✅ **Tipo:** Projeto é de software/desenvolvimento?

### **Problemas com Dados**

#### **"Nenhuma Issue Encontrada"**
✅ **Filtros:** Muito restritivos?  
✅ **Período:** Tente "Todo Período"  
✅ **Projeto:** Tem issues criadas?

#### **"Gráficos em Branco"**
✅ **Story Points:** Issues têm pontuação?  
✅ **Assignees:** Issues têm responsáveis?  
✅ **Status:** Issues têm status "Done"?

### **Performance**

#### **Carregamento Lento**
✅ **Filtros:** Reduza período de análise  
✅ **Dados:** Projeto muito grande?  
✅ **Conexão:** Internet estável?

#### **Gráficos Não Aparecem**
✅ **Browser:** Use Chrome/Firefox/Safari  
✅ **JavaScript:** Está habilitado?  
✅ **Popup:** Bloqueador desabilitado?

---

## 📱 **Usando em Dispositivos Móveis**

### **Interface Responsiva**
- **Layout adapta** automaticamente
- **Gráficos otimizados** para touch
- **Navegação simplificada** em telas pequenas

### **Dicas Mobile**
💡 **Rotação:** Use landscape para gráficos  
💡 **Zoom:** Pinch to zoom nos gráficos  
💡 **Navegação:** Swipe entre abas

---

## 💡 **Dicas e Melhores Práticas**

### **Para Gerentes de Projeto**

#### **Análise Diária**
1. **Verifique velocity** das últimas semanas
2. **Monitore cycle time** por tipo
3. **Acompanhe distribuição** da equipe

#### **Planejamento de Sprint**
1. **Use velocity média** das últimas 3-4 semanas
2. **Considere cycle time** para estimativas
3. **Balance workload** entre a equipe

### **Para Scrum Masters**

#### **Daily Standup**
1. **Filtre por "Esta Semana"**
2. **Verifique issues bloqueadas**
3. **Monitore cycle time individual**

#### **Retrospectiva**
1. **Analise velocity** do sprint
2. **Compare com sprints anteriores**
3. **Identifique padrões** nos dados

### **Para Desenvolvedores**

#### **Auto-análise**
1. **Filtre por seu nome**
2. **Veja seu cycle time médio**
3. **Compare com média da equipe**

#### **Melhoria Contínua**
1. **Monitore suas métricas**
2. **Identifique gargalos pessoais**
3. **Trabalhe na consistência**

---

## 🔄 **Fluxo de Trabalho Recomendado**

### **Rotina Diária (5 min)**
1. ✅ Abrir dashboard
2. ✅ Verificar filtro "Esta Semana"
3. ✅ Conferir métricas principais
4. ✅ Checar kanban board

### **Revisão Semanal (15 min)**
1. ✅ Analisar velocity da semana
2. ✅ Comparar com semanas anteriores
3. ✅ Verificar cycle time por tipo
4. ✅ Revisar performance da equipe

### **Planejamento de Sprint (30 min)**
1. ✅ Analisar últimas 4 semanas
2. ✅ Calcular velocity média
3. ✅ Identificar capacity da equipe
4. ✅ Planejar próximo sprint

### **Retrospectiva Mensal (45 min)**
1. ✅ Filtrar por "Este Mês"
2. ✅ Exportar relatório PDF
3. ✅ Analisar tendências
4. ✅ Definir ações de melhoria

---

## 📞 **Suporte e Ajuda**

### **Contatos**
- **Documentação:** `/docs` folder
- **Issues Técnicos:** GitHub Issues
- **Suporte:** Equipe de desenvolvimento

### **Recursos Adicionais**
- **API Documentation:** Para integrações
- **Technical Stack:** Detalhes técnicos
- **Deployment Guide:** Para admins

---

## 🎯 **Objetivos e KPIs**

### **Métricas de Sucesso**

#### **Para a Equipe**
- **Velocity:** Estável e crescente
- **Cycle Time:** Redução gradual
- **Bug Rate:** Abaixo de 20%
- **Entrega:** Consistente

#### **Para o Produto**
- **Uso Diário:** > 80% da equipe
- **Tempo de Análise:** < 5 min por sessão
- **Insights Acionáveis:** 3+ por sprint
- **Satisfação:** > 4.5/5

---

**Guia do Usuário Version:** 1.0  
**Última atualização:** Julho 2025  
**Próxima revisão:** Agosto 2025  
**Feito com ❤️ para equipes ágeis**