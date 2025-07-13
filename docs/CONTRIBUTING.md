# Guia de Contribuição
## Jira Productivity Dashboard

Obrigado por considerar contribuir com o Jira Productivity Dashboard! Este documento fornece diretrizes para contribuições que ajudem a manter a qualidade e consistência do projeto.

---

## 🤝 **Como Contribuir**

### **Tipos de Contribuição Bem-vindas**

- 🐛 **Bug Reports e Fixes**
- ✨ **Novas Funcionalidades**
- 📖 **Melhorias na Documentação**
- 🎨 **Melhorias de UI/UX**
- ⚡ **Otimizações de Performance**
- 🧪 **Testes Automatizados**
- 🌍 **Traduções e Localização**
- 🔒 **Melhorias de Segurança**

---

## 🚀 **Primeiros Passos**

### **1. Fork e Clone**
```bash
# Fork o repositório no GitHub
# Depois clone seu fork

git clone https://github.com/SEU-USERNAME/jira-dashboard.git
cd jira-dashboard

# Adicione o repositório original como upstream
git remote add upstream https://github.com/ORIGINAL-OWNER/jira-dashboard.git
```

### **2. Setup do Ambiente de Desenvolvimento**
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# Executar em modo desenvolvimento
npm run dev
```

### **3. Verificar se Tudo Está Funcionando**
```bash
# Executar testes
npm test

# Verificar linting
npm run lint

# Fazer build
npm run build
```

---

## 📋 **Processo de Contribuição**

### **1. Encontrar ou Criar uma Issue**

#### **Para Bug Reports**
- Verifique se já não existe uma issue similar
- Use o template de bug report
- Inclua informações detalhadas:
  - Passos para reproduzir
  - Comportamento esperado vs atual
  - Screenshots/GIFs se aplicável
  - Ambiente (browser, versão, OS)

#### **Para Feature Requests**
- Descreva o problema que a feature resolve
- Explique a solução proposta
- Considere alternativas
- Discuta o impacto na UX

### **2. Criar uma Branch**
```bash
# Sempre crie uma branch a partir da main atualizada
git checkout main
git pull upstream main

# Crie uma branch descritiva
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/descricao-do-bug
# ou
git checkout -b docs/atualizacao-documentacao
```

### **3. Fazer as Mudanças**

#### **Código**
- Siga as convenções de código existentes
- Mantenha commits pequenos e focados
- Escreva mensagens de commit descritivas
- Adicione testes para novas funcionalidades
- Atualize a documentação se necessário

#### **Commits**
Use [Conventional Commits](https://conventionalcommits.org/):
```bash
# Tipos válidos
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação, sem mudanças de lógica
refactor: refatoração de código
test: adição de testes
chore: tarefas de build, config, etc.

# Exemplos
git commit -m "feat: adicionar filtro por priority no dashboard"
git commit -m "fix: corrigir tooltip corrompido no velocity chart"
git commit -m "docs: atualizar guia de instalação"
```

### **4. Testes**
```bash
# Executar todos os testes
npm test

# Testes específicos
npm test -- --grep "Dashboard"

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### **5. Push e Pull Request**
```bash
# Push da sua branch
git push origin feature/nome-da-feature

# Criar Pull Request no GitHub
# Use o template de PR
# Inclua referência à issue (#123)
```

---

## 🛠️ **Padrões de Desenvolvimento**

### **Estrutura de Arquivos**
```
client/src/
├── components/
│   ├── ui/              # Componentes base (shadcn)
│   ├── charts/          # Gráficos específicos
│   └── *.tsx            # Componentes de negócio
├── hooks/               # Custom hooks
├── lib/                 # Utilitários
├── pages/               # Páginas da aplicação
└── types/               # Definições TypeScript
```

### **Convenções de Nomenclatura**

#### **Arquivos**
- **Componentes:** `PascalCase.tsx` (ex: `MetricsCard.tsx`)
- **Hooks:** `use-kebab-case.ts` (ex: `use-jira-data.ts`)
- **Utilitários:** `kebab-case.ts` (ex: `export-utils.ts`)
- **Páginas:** `kebab-case.tsx` (ex: `project-selection.tsx`)

#### **Variáveis e Funções**
```typescript
// camelCase para variáveis e funções
const userName = 'João';
const getUserData = () => {};

// PascalCase para componentes e tipos
const UserCard = () => {};
interface UserData {}

// UPPERCASE para constantes
const API_BASE_URL = 'https://api.example.com';
```

### **TypeScript**

#### **Interfaces e Types**
```typescript
// Prefira interfaces para objetos extensíveis
interface JiraIssue {
  id: string;
  key: string;
  fields: IssueFields;
}

// Use types para unions e computados
type Status = 'todo' | 'inprogress' | 'done';
type IssueWithStatus = JiraIssue & { computedStatus: Status };
```

#### **Props de Componentes**
```typescript
// Sempre tipifique props
interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
}

// Use export para reutilização
export function MetricsCard({ title, value, change, icon }: MetricsCardProps) {
  // ...
}
```

### **React Best Practices**

#### **Hooks**
```typescript
// Custom hooks sempre começam com 'use'
export function useJiraData(credentials: JiraCredentials) {
  const [data, setData] = useState<JiraIssue[]>([]);
  
  useEffect(() => {
    // Lógica do hook
  }, [credentials]);
  
  return { data, isLoading, error };
}
```

#### **Estado e Effects**
```typescript
// Prefira useState para estado local
const [filters, setFilters] = useState<Filters>(defaultFilters);

// useCallback para funções que são dependências
const handleFilterChange = useCallback((newFilters: Filters) => {
  setFilters(newFilters);
}, []);

// useMemo para computações pesadas
const computedMetrics = useMemo(() => {
  return calculateMetrics(issues);
}, [issues]);
```

### **Estilização com Tailwind**

#### **Classes Organizadas**
```typescript
// Organize classes por categoria
const className = cn(
  // Layout
  "flex items-center justify-between",
  // Spacing
  "p-4 gap-2",
  // Colors
  "bg-white text-gray-900",
  // States
  "hover:bg-gray-50 focus:ring-2",
  // Responsive
  "md:p-6 lg:gap-4"
);
```

#### **Componentes Customizados**
```typescript
// Use cn() para combinar classes condicionalmente
import { cn } from "@/lib/utils";

const Button = ({ variant, className, ...props }) => {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md font-medium",
        variant === "primary" && "bg-blue-600 text-white",
        variant === "secondary" && "bg-gray-200 text-gray-900",
        className
      )}
      {...props}
    />
  );
};
```

---

## 🧪 **Testes**

### **Estrutura de Testes**
```
__tests__/
├── components/          # Testes de componentes
├── hooks/               # Testes de hooks
├── lib/                 # Testes de utilitários
└── integration/         # Testes de integração
```

### **Testes de Componentes**
```typescript
// Exemplo: MetricsCard.test.tsx
import { render, screen } from '@testing-library/react';
import { MetricsCard } from '../MetricsCard';

describe('MetricsCard', () => {
  it('should render title and value', () => {
    render(
      <MetricsCard
        title="Tarefas Entregues"
        value={25}
        icon={<div>icon</div>}
        description="Issues concluídas"
      />
    );
    
    expect(screen.getByText('Tarefas Entregues')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });
  
  it('should show positive change in green', () => {
    render(
      <MetricsCard
        title="Test"
        value={25}
        change={15}
        icon={<div>icon</div>}
        description="Test"
      />
    );
    
    const changeElement = screen.getByText('+15%');
    expect(changeElement).toHaveClass('text-green-600');
  });
});
```

### **Testes de Hooks**
```typescript
// Exemplo: useJiraData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useJiraData } from '../use-jira-data';

describe('useJiraData', () => {
  it('should fetch issues when credentials provided', async () => {
    const credentials = {
      jiraUrl: 'https://test.atlassian.net',
      username: 'test@test.com',
      apiToken: 'token'
    };
    
    const { result } = renderHook(() => 
      useJiraData(credentials, 'TEST', {})
    );
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toBeDefined();
  });
});
```

---

## 📝 **Documentação**

### **Comentários no Código**
```typescript
/**
 * Calcula métricas de produtividade baseadas nas issues do Jira
 * @param issues - Array de issues do Jira
 * @param previousPeriodIssues - Issues do período anterior para comparação
 * @returns Objeto com métricas calculadas e variações percentuais
 */
export function calculateProductivityMetrics(
  issues: JiraIssue[],
  previousPeriodIssues: JiraIssue[]
): ProductivityMetrics {
  // Implementação...
}
```

### **README de Componentes**
Para componentes complexos, adicione documentação:
```typescript
/**
 * CompletionCharts - Sistema de gráficos de conclusão
 * 
 * Renderiza 4 abas de gráficos:
 * 1. Conclusões - Tarefas concluídas por período
 * 2. Velocity - Story points por semana  
 * 3. Cycle Time - Tempo médio por tipo
 * 4. Performance da Equipe - Métricas individuais
 * 
 * @example
 * ```tsx
 * <CompletionCharts issues={issues} />
 * ```
 */
```

---

## 🔍 **Code Review**

### **O que Verificamos**

#### **Funcionalidade**
- ✅ A funcionalidade resolve o problema proposto?
- ✅ Não quebra funcionalidades existentes?
- ✅ Está testada adequadamente?
- ✅ Performance está adequada?

#### **Código**
- ✅ Segue as convenções do projeto?
- ✅ Está bem documentado?
- ✅ É legível e mantível?
- ✅ Não tem código duplicado?

#### **Segurança**
- ✅ Input validation adequada?
- ✅ Não expõe dados sensíveis?
- ✅ Segue práticas de segurança?

### **Dicas para Reviews**

#### **Para Reviewers**
- 🎯 Seja construtivo e educativo
- 🎯 Explique o "porquê" das sugestões
- 🎯 Reconheça bom código
- 🎯 Foque na funcionalidade, não estilo pessoal

#### **Para Contributors**
- 🎯 Seja receptivo ao feedback
- 🎯 Pergunte se não entender
- 🎯 Teste suas mudanças localmente
- 🎯 Mantenha PRs pequenos e focados

---

## 🌍 **Internacionalização**

### **Adicionando Novas Traduções**

#### **1. Estrutura de Arquivos**
```
client/src/locales/
├── pt-BR.json          # Português Brasileiro
├── en-US.json          # English (planned)
└── es-ES.json          # Español (planned)
```

#### **2. Formato de Tradução**
```json
{
  "dashboard": {
    "title": "Dashboard de Produtividade",
    "metrics": {
      "tasksDelivered": "Tarefas Entregues",
      "velocity": "Velocidade",
      "cycleTime": "Cycle Time",
      "bugRate": "Taxa de Bugs"
    }
  }
}
```

#### **3. Uso no Código**
```typescript
import { useTranslation } from '@/hooks/use-translation';

export function MetricsCard() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h3>{t('dashboard.metrics.tasksDelivered')}</h3>
    </div>
  );
}
```

---

## 📦 **Gerenciamento de Dependências**

### **Adicionando Nova Dependência**
```bash
# Para dependências de produção
npm install nome-da-biblioteca

# Para dependências de desenvolvimento
npm install --save-dev nome-da-biblioteca

# Verifique se realmente precisa da dependência
# Considere alternativas menores
# Documente o motivo no PR
```

### **Atualizando Dependências**
```bash
# Verificar dependências outdated
npm outdated

# Atualizar dependências patch/minor
npm update

# Para major updates, fazer individualmente
npm install nome-da-biblioteca@latest

# Sempre testar após atualizações
npm test
```

---

## 🐛 **Debug e Troubleshooting**

### **Debug Local**
```bash
# Run com debug logs
DEBUG=* npm run dev

# Debug específico
DEBUG=jira-api npm run dev

# Profile de performance
NODE_ENV=development npm run dev --inspect
```

### **Logs Úteis**
```typescript
// Use console.log com namespace
console.log('[DASHBOARD] Loading metrics:', metrics);
console.log('[JIRA-API] Fetching issues for project:', projectKey);

// Para desenvolvimento, use debug condicional
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', debugData);
}
```

---

## ✅ **Checklist de PR**

### **Antes de Submeter**
- [ ] Código segue as convenções do projeto
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada se necessário
- [ ] Sem warnings de linting
- [ ] Build passa sem erros
- [ ] Funcionalidade testada manualmente
- [ ] Performance verificada
- [ ] Commits seguem Conventional Commits

### **Template de PR**
```markdown
## Descrição
Breve descrição das mudanças.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Faça X
2. Clique em Y
3. Verifique Z

## Screenshots
(Se aplicável)

## Checklist
- [ ] Código testado
- [ ] Documentação atualizada
- [ ] Sem warnings
```

---

## 🎉 **Reconhecimento**

### **Contributors**
Todos os contributors são reconhecidos:
- 📝 Nome no CONTRIBUTORS.md
- 🏆 Badge de contributor
- 💝 Menção em release notes
- 🌟 Destaque em redes sociais

### **Tipos de Contribuição**
- 💻 **Code** - Contribuições de código
- 📖 **Documentation** - Melhorias na documentação
- 🎨 **Design** - Melhorias de UI/UX
- 🐛 **Bug reports** - Relatórios de bugs
- 💡 **Ideas** - Sugestões de features
- 🌍 **Translation** - Traduções

---

## 📞 **Precisa de Ajuda?**

### **Canais de Comunicação**
- 💬 **Discord:** [Join our server](https://discord.gg/jira-dashboard)
- 📧 **Email:** contribute@jira-dashboard.com
- 📋 **GitHub Discussions:** Para perguntas gerais
- 📝 **GitHub Issues:** Para bugs e features específicos

### **Mentoria**
Novos contributors podem solicitar mentoria:
- 👋 Marque sua issue como "good first issue"
- 🆘 Use a label "help wanted"
- 🎓 Participe do programa de mentoria

---

**Obrigado por contribuir! 🙏**

*Sua contribuição faz a diferença para equipes de desenvolvimento no mundo todo.*

---

*Última atualização: Julho 2025*