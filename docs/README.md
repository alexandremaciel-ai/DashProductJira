# 📊 Jira Productivity Dashboard

Uma aplicação web completa para monitoramento e análise de produtividade de desenvolvimento que integra com a API do Jira, oferecendo insights profundos sobre performance da equipe, métricas de entrega e tendências de produtividade.

## 🎯 **Visão Geral**

O Jira Productivity Dashboard é uma ferramenta profissional que transforma dados do Jira em insights acionáveis para equipes de desenvolvimento. Com interface moderna e completamente traduzida para português brasileiro, oferece visualizações avançadas e análises detalhadas de métricas de produtividade.

### **Principais Funcionalidades**

- 📈 **Dashboard Interativo** com métricas em tempo real
- 📊 **4 Tipos de Gráficos** avançados (Conclusões, Velocity, Cycle Time, Performance da Equipe)
- 📋 **Kanban Board** visual com filtros sincronizados
- 🔍 **Sistema de Filtros** robusto (período, sprint, assignee, tipo)
- 📄 **Exportação Avançada** (CSV profissional, PDF executivo, Relatórios completos)
- 🤖 **Insights com IA** (análise automatizada)
- 🌍 **Interface Brasileira** (totalmente localizada)

## 🚀 **Deploy Rápido**

### **Replit (Recomendado)**
[![Deploy on Replit](https://replit.com/badge/github/your-username/jira-dashboard)](https://replit.com/new/github/your-username/jira-dashboard)

### **Docker**
```bash
docker run -p 5000:5000 -e DATABASE_URL=your_db_url jira-dashboard
```

### **Local Development**
```bash
git clone https://github.com/your-username/jira-dashboard.git
cd jira-dashboard
npm install
npm run dev
```

## 📋 **Pré-requisitos**

### **Para Usar**
- Jira Cloud com API token
- Projeto de software no Jira
- Navegador moderno (Chrome, Firefox, Safari)

### **Para Desenvolver**
- Node.js 20+
- PostgreSQL (opcional para desenvolvimento)
- TypeScript conhecimento básico

## 🔧 **Configuração Rápida**

### **1. Obter API Token do Jira**
1. Acesse [id.atlassian.com](https://id.atlassian.com)
2. Vá em Account Settings → Security → API tokens
3. Crie um novo token
4. Copie e guarde o token

### **2. Configurar a Aplicação**
1. Abra o dashboard
2. Insira suas credenciais:
   - URL do Jira: `https://suaempresa.atlassian.net`
   - Email: seu email de login
   - API Token: o token criado
3. Selecione um projeto
4. Comece a usar!

## 📊 **Screenshots**

### **Dashboard Principal**
![Dashboard](./screenshots/dashboard.png)

### **Gráficos de Performance**
![Charts](./screenshots/charts.png)

### **Kanban Board**
![Kanban](./screenshots/kanban.png)

## 🏗️ **Arquitetura**

```
Frontend (React + TypeScript)
    ↓
Backend (Express + Node.js)
    ↓
Jira Cloud API
    ↓
PostgreSQL (Produção)
```

### **Stack Tecnológico**
- **Frontend:** React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL com Drizzle ORM
- **Charts:** Recharts
- **Build:** Vite
- **Deployment:** Replit, Docker, Vercel

## 📖 **Documentação**

### **Para Usuários**
- [📖 **Guia do Usuário**](./docs/USER_GUIDE.md) - Como usar todas as funcionalidades
- [🎯 **PRD - Product Requirements**](./docs/PRD.md) - Visão geral do produto

### **Para Desenvolvedores**
- [🏗️ **Arquitetura**](./docs/ARCHITECTURE.md) - Design do sistema
- [⚙️ **Stack Tecnológico**](./docs/TECH_STACK.md) - Tecnologias utilizadas
- [🔌 **API Documentation**](./docs/API_DOCUMENTATION.md) - Endpoints da API
- [🚀 **Guia de Deployment**](./docs/DEPLOYMENT_GUIDE.md) - Como fazer deploy

## 🎮 **Demo e Exemplos**

### **Demo Online**
🔗 [dashboard-demo.replit.app](https://dashboard-demo.replit.app)

### **Dados de Teste**
Use qualquer projeto do Jira Cloud para testar. O dashboard funciona com:
- ✅ Projetos de Software
- ✅ Projetos Scrum/Kanban
- ✅ Issues com Story Points
- ✅ Assignees configurados

## 🔧 **Desenvolvimento**

### **Setup Local**
```bash
# Clone do repositório
git clone https://github.com/your-username/jira-dashboard.git
cd jira-dashboard

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Edite .env com suas configurações

# Executar em desenvolvimento
npm run dev

# Para usuários macOS: se houver erro de porta 5000
PORT=3000 npm run dev

# Build para produção
npm run build
```

### **Scripts Disponíveis**
```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run start        # Start produção
npm run db:migrate   # Executar migrations
npm run db:generate  # Gerar migration
npm test            # Executar testes
```

### **Estrutura do Projeto**
```
├── client/          # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utilitários
│   │   ├── pages/       # Páginas
│   │   └── types/       # TypeScript types
├── server/          # Backend Express
│   ├── index.ts         # Servidor principal
│   ├── routes.ts        # Rotas da API
│   └── storage.ts       # Camada de dados
├── shared/          # Código compartilhado
│   └── schema.ts        # Schemas Drizzle + Zod
└── docs/            # Documentação
```

## 🧪 **Testes**

```bash
# Executar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes end-to-end
npm run test:e2e
```

### **Cobertura de Testes**
- ✅ Componentes React
- ✅ Hooks customizados
- ✅ API endpoints
- ✅ Integração Jira
- ✅ Cálculos de métricas

## 🔐 **Segurança**

### **Práticas Implementadas**
- ✅ **API Token Authentication** (Jira)
- ✅ **Input Validation** (Zod schemas)
- ✅ **CORS Protection**
- ✅ **Rate Limiting**
- ✅ **Secure Headers**
- ✅ **SQL Injection Prevention** (Drizzle ORM)

### **Dados Pessoais**
- 🔒 Credenciais armazenadas apenas na sessão
- 🔒 Sem dados persistidos no servidor
- 🔒 Comunicação HTTPS
- 🔒 Tokens criptografados

## 📈 **Performance**

### **Otimizações**
- ⚡ **Code Splitting** (React.lazy)
- ⚡ **Memoization** (useMemo, useCallback)
- ⚡ **Bundle Optimization** (Vite)
- ⚡ **Image Optimization** (SVG icons)
- ⚡ **Cache Strategy** (TanStack Query)

### **Métricas**
- 📊 **Load Time:** < 2 segundos
- 📊 **First Paint:** < 1 segundo
- 📊 **Bundle Size:** < 500KB gzipped
- 📊 **Lighthouse Score:** > 90

## 🌍 **Internacionalização**

### **Idiomas Suportados**
- 🇧🇷 **Português Brasileiro** (Completo)
- 🇺🇸 **English** (Planejado)
- 🇪🇸 **Español** (Planejado)

### **Localização**
- ✅ Interface de usuário
- ✅ Mensagens de erro
- ✅ Formatos de data
- ✅ Números e moedas
- ✅ Terminologia técnica

## 🤝 **Contribuindo**

### **Como Contribuir**
1. **Fork** o repositório
2. **Crie uma branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra um Pull Request**

### **Tipos de Contribuição**
- 🐛 **Bug fixes**
- ✨ **Novas funcionalidades**
- 📖 **Documentação**
- 🎨 **Melhorias de UI/UX**
- ⚡ **Otimizações de performance**
- 🌍 **Traduções**

### **Guidelines**
- ✅ Seguir padrões TypeScript
- ✅ Adicionar testes para novas features
- ✅ Documentar mudanças significativas
- ✅ Manter compatibilidade com Jira API
- ✅ Usar conventional commits

## � **Troubleshooting**

### **Problemas Comuns**

#### **Erro: ENOTSUP: operation not supported on socket (macOS)**
```bash
# Problema: Porta 5000 ocupada pelo Control Center do macOS
# Solução: Use uma porta diferente
PORT=3000 npm run dev
```

#### **Erro: Port already in use**
```bash
# Encontrar processo usando a porta
lsof -i :5000

# Matar processo se necessário
kill -9 <PID>

# Ou usar porta diferente
PORT=3001 npm run dev
```

#### **Erro: Cannot connect to Jira**
- ✅ Verifique se a URL do Jira está correta
- ✅ Confirme se o API token é válido
- ✅ Teste a conexão em: `https://suaempresa.atlassian.net/rest/api/3/myself`

## �🐛 **Issues e Suporte**

### **Reportar Bugs**
1. Verifique se já não existe issue similar
2. Use o template de bug report
3. Inclua steps para reproduzir
4. Adicione screenshots se relevante

### **Solicitar Features**
1. Descreva o problema que a feature resolve
2. Explique a solução proposta
3. Considere alternativas
4. Avalie impacto na experiência do usuário

### **Suporte**
- 📧 **Email:** support@jira-dashboard.com
- 💬 **Discord:** [Join our server](https://discord.gg/jira-dashboard)
- 📋 **GitHub Issues:** Para bugs e features
- 📖 **Documentation:** Consulte os guias em `/docs`

## 📅 **Roadmap**

### **v1.1 (Q3 2025)**
- [ ] Notificações em tempo real
- [ ] Dashboard customizável
- [ ] Integração Slack/Teams
- [ ] Métricas avançadas de code review

### **v1.2 (Q4 2025)**
- [ ] Multi-tenant (múltiplas organizações)
- [ ] API REST pública
- [ ] Mobile app (React Native)
- [ ] Machine Learning predictions

### **v2.0 (Q1 2026)**
- [ ] Integração com outras ferramentas (GitHub, GitLab)
- [ ] Advanced analytics
- [ ] Custom dashboards
- [ ] Enterprise features

## 📝 **Changelog**

### **v1.0.0** (Julho 2025)
- ✅ Dashboard principal com métricas
- ✅ Sistema de gráficos (4 abas)
- ✅ Kanban board integrado
- ✅ Filtros avançados
- ✅ **Exportação Avançada** (CSV profissional, PDF executivo, Relatórios completos)\n- ✅ **Sistema de Notificações** visuais em tempo real\n- ✅ **Análise de Produtividade** individual e por equipe\n- ✅ **Burndown Charts** e métricas históricas
- ✅ Interface em português
- ✅ Insights com IA (básico)

## 📄 **Licença**

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

### **MIT License - Resumo**
- ✅ Uso comercial permitido
- ✅ Modificação permitida
- ✅ Distribuição permitida
- ✅ Uso privado permitido
- ❌ Sem garantia
- ❌ Sem responsabilidade do autor

## 🙏 **Agradecimentos**

### **Tecnologias**
- [React](https://reactjs.org/) - UI Framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://radix-ui.com/) - UI Primitives
- [Recharts](https://recharts.org/) - Charts
- [Drizzle](https://orm.drizzle.team/) - ORM
- [TanStack Query](https://tanstack.com/query) - Data fetching

### **Inspirações**
- [Linear](https://linear.app/) - Design e UX
- [Notion](https://notion.so/) - Interface intuitiva
- [Vercel](https://vercel.com/) - Developer experience
- [GitHub](https://github.com/) - Project management

## 📞 **Contato**

### **Equipe**
- **Product Owner:** [@username](https://github.com/username)
- **Tech Lead:** [@username](https://github.com/username)
- **Designer:** [@username](https://github.com/username)

### **Links**
- 🌐 **Website:** [jira-dashboard.com](https://jira-dashboard.com)
- 📧 **Email:** hello@jira-dashboard.com
- 🐦 **Twitter:** [@jiradashboard](https://twitter.com/jiradashboard)
- 💼 **LinkedIn:** [Jira Dashboard](https://linkedin.com/company/jira-dashboard)

---

## ⭐ **Star o Projeto**

Se este projeto te ajudou, considere dar uma ⭐ no GitHub!

**Feito com ❤️ para equipes ágeis de desenvolvimento**

---

*Última atualização: Julho 2025*