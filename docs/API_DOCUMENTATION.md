# Documentação da API
## Jira Productivity Dashboard

### 🌐 **Visão Geral da API**

A API do Dashboard serve como proxy entre o frontend React e a API do Jira Cloud, fornecendo endpoints seguros e otimizados para acessar dados de produtividade e métricas de desenvolvimento.

**Base URL:** `http://localhost:5000/api`  
**Protocolo:** HTTP/HTTPS  
**Formato:** JSON  
**Autenticação:** Jira API Token via request body

---

## 🔐 **Autenticação**

### **Credenciais do Jira**

Todas as rotas requerem credenciais do Jira no corpo da requisição:

```typescript
interface JiraCredentials {
  jiraUrl: string;      // Ex: "https://company.atlassian.net"
  username: string;     // Email do usuário
  apiToken: string;     // Token gerado no Atlassian
}
```

**Exemplo:**
```json
{
  "credentials": {
    "jiraUrl": "https://mycompany.atlassian.net",
    "username": "user@company.com",
    "apiToken": "ATATT3xFfGF0..."
  }
}
```

---

## 📋 **Endpoints da API**

### **1. Autenticação**

#### `POST /api/jira/auth`

Valida as credenciais do Jira testando a conectividade.

**Request Body:**
```json
{
  "credentials": {
    "jiraUrl": "string",
    "username": "string", 
    "apiToken": "string"
  }
}
```

**Response Success (200):**
```json
{
  "success": true,
  "user": {
    "accountId": "string",
    "displayName": "string",
    "emailAddress": "string"
  }
}
```

**Response Error (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

### **2. Projetos**

#### `POST /api/jira/projects`

Retorna lista de projetos acessíveis ao usuário.

**Request Body:**
```json
{
  "credentials": {
    "jiraUrl": "string",
    "username": "string",
    "apiToken": "string"
  }
}
```

**Response Success (200):**
```json
[
  {
    "id": "10001",
    "key": "PROJ",
    "name": "Meu Projeto",
    "avatarUrls": {
      "48x48": "https://..."
    },
    "projectTypeKey": "software",
    "issueTypes": [
      {
        "id": "10004",
        "name": "Story",
        "iconUrl": "https://...",
        "subtask": false
      }
    ]
  }
]
```

---

### **3. Issues**

#### `POST /api/jira/issues`

Busca issues do projeto com filtros opcionais.

**Request Body:**
```json
{
  "credentials": {
    "jiraUrl": "string",
    "username": "string",
    "apiToken": "string"
  },
  "projectKey": "PROJ",
  "filters": {
    "timePeriod": "week" | "month" | "quarter" | "custom" | "all",
    "sprint": "string (optional)",
    "assignee": "string (optional)",
    "issueTypes": ["string"],
    "customStartDate": "ISO date string (optional)",
    "customEndDate": "ISO date string (optional)"
  }
}
```

**Response Success (200):**
```json
{
  "expand": "schema,names",
  "startAt": 0,
  "maxResults": 50,
  "total": 150,
  "issues": [
    {
      "id": "10001",
      "key": "PROJ-123",
      "fields": {
        "summary": "Implementar dashboard",
        "status": {
          "name": "Done",
          "statusCategory": {
            "name": "Done",
            "colorName": "green"
          }
        },
        "assignee": {
          "displayName": "João Silva",
          "emailAddress": "joao@company.com"
        },
        "created": "2025-07-01T10:00:00.000-0300",
        "updated": "2025-07-13T15:30:00.000-0300",
        "resolutiondate": "2025-07-10T14:20:00.000-0300",
        "issuetype": {
          "name": "Story",
          "iconUrl": "https://..."
        },
        "customfield_10016": 5
      }
    }
  ]
}
```

**JQL Query Examples:**
```sql
-- Esta Semana
project = "PROJ" AND updated >= -1w

-- Este Mês  
project = "PROJ" AND updated >= -4w

-- Trimestre
project = "PROJ" AND updated >= -12w

-- Todo Período
project = "PROJ"

-- Personalizado
project = "PROJ" AND updated >= "2025-07-01" AND updated <= "2025-07-13"
```

---

### **4. Sprints**

#### `POST /api/jira/sprints`

Retorna sprints do projeto.

**Request Body:**
```json
{
  "credentials": {
    "jiraUrl": "string",
    "username": "string",
    "apiToken": "string"
  },
  "projectKey": "PROJ"
}
```

**Response Success (200):**
```json
[
  {
    "id": 1,
    "name": "Sprint 1",
    "state": "active",
    "startDate": "2025-07-01T10:00:00.000Z",
    "endDate": "2025-07-15T10:00:00.000Z",
    "completeDate": null
  }
]
```

---

### **5. Membros do Projeto**

#### `POST /api/jira/project-members`

Retorna membros que podem ser atribuídos a issues do projeto.

**Request Body:**
```json
{
  "credentials": {
    "jiraUrl": "string",
    "username": "string",
    "apiToken": "string"
  },
  "projectKey": "PROJ"
}
```

**Response Success (200):**
```json
[
  {
    "accountId": "557058:f58131cb-b67d-43c7-b30d-6b58d40bd077",
    "displayName": "João Silva",
    "emailAddress": "joao@company.com",
    "avatarUrls": {
      "48x48": "https://..."
    }
  }
]
```

---

### **6. Categorias de Status**

#### `POST /api/jira/status-categories`

Retorna categorias de status disponíveis no projeto.

**Request Body:**
```json
{
  "credentials": {
    "jiraUrl": "string",
    "username": "string",
    "apiToken": "string"
  },
  "projectKey": "PROJ"
}
```

**Response Success (200):**
```json
{
  "statusCategories": {
    "todo": [
      {
        "id": "1",
        "name": "To Do",
        "colorName": "blue-gray"
      }
    ],
    "inprogress": [
      {
        "id": "3",
        "name": "In Progress", 
        "colorName": "yellow"
      }
    ],
    "done": [
      {
        "id": "10002",
        "name": "Done",
        "colorName": "green"
      }
    ]
  }
}
```

---

### **7. Insights AI (Placeholder)**

#### `POST /api/jira/ai-insights`

Gera insights automatizados baseados nas métricas.

**Request Body:**
```json
{
  "metrics": {
    "tasksDelivered": 25,
    "velocity": 45,
    "cycleTime": 8.5,
    "bugRate": 0.12
  },
  "projectData": {
    "key": "PROJ",
    "teamSize": 5,
    "sprintDuration": 14
  }
}
```

**Response Success (200):**
```json
{
  "performance": "A equipe está performando acima da média com 25 tarefas entregues.",
  "predictions": "Baseado na velocidade atual, estima-se 30 tarefas para o próximo sprint.",
  "recommendations": "Considere reduzir o cycle time focando em code review mais rápido."
}
```

---

## 📊 **Tipos de Dados**

### **Issue (Completo)**

```typescript
interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        name: string;
        key: string;
        colorName: string;
      };
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
      avatarUrls?: {
        "48x48": string;
      };
    };
    created: string;           // ISO date
    updated: string;           // ISO date  
    resolutiondate?: string;   // ISO date
    issuetype: {
      name: string;
      iconUrl: string;
      subtask: boolean;
    };
    customfield_10016?: number; // Story Points
    priority?: {
      name: string;
      iconUrl: string;
    };
    components?: Array<{
      name: string;
    }>;
    labels?: string[];
  };
}
```

### **Filtros de Dashboard**

```typescript
interface DashboardFilters {
  timePeriod: "week" | "month" | "quarter" | "custom" | "all";
  sprint?: string;
  assignee?: string;
  issueTypes: string[];
  customStartDate?: string;
  customEndDate?: string;
}
```

### **Métricas de Produtividade**

```typescript
interface ProductivityMetrics {
  tasksDelivered: number;
  tasksDeliveredChange: number;    // % change
  velocity: number;                // story points
  velocityChange: number;          // % change
  cycleTime: number;              // days average
  cycleTimeChange: number;        // % change  
  bugRate: number;                // percentage
  bugRateChange: number;          // % change
}
```

---

## ⚠️ **Códigos de Erro**

### **Códigos HTTP**

| Código | Descrição | Cenário |
|--------|-----------|---------|
| 200 | OK | Sucesso na requisição |
| 400 | Bad Request | Parâmetros inválidos |
| 401 | Unauthorized | Credenciais inválidas |
| 403 | Forbidden | Sem permissão no projeto |
| 404 | Not Found | Projeto não encontrado |
| 429 | Too Many Requests | Rate limit da API Jira |
| 500 | Internal Server Error | Erro interno |

### **Formato de Erro**

```json
{
  "error": "string",
  "details": "string (optional)",
  "code": "string (optional)"
}
```

**Exemplos:**
```json
// Credenciais inválidas
{
  "error": "Invalid credentials",
  "details": "Authentication failed with Jira API"
}

// Rate limit
{
  "error": "Rate limit exceeded", 
  "details": "Too many requests to Jira API"
}

// Projeto não encontrado
{
  "error": "Project not found",
  "details": "Project key 'INVALID' does not exist"
}
```

---

## 🔄 **Rate Limiting**

### **Limites da API Jira**

- **10 requests/second** por IP
- **300 requests/hour** por API token
- **Reset automático** a cada hora

### **Estratégias de Mitigação**

1. **Cache de respostas** (5 minutos para issues)
2. **Batch requests** quando possível  
3. **Retry com backoff** exponencial
4. **Circuit breaker** após múltiplas falhas

---

## 📝 **Exemplos de Uso**

### **1. Fluxo Completo de Autenticação**

```javascript
// 1. Testar credenciais
const authResponse = await fetch('/api/jira/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    credentials: {
      jiraUrl: 'https://company.atlassian.net',
      username: 'user@company.com', 
      apiToken: 'ATATT3xFfGF0...'
    }
  })
});

// 2. Buscar projetos
const projectsResponse = await fetch('/api/jira/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ credentials })
});

// 3. Selecionar projeto e buscar issues
const issuesResponse = await fetch('/api/jira/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    credentials,
    projectKey: 'PROJ',
    filters: { timePeriod: 'month' }
  })
});
```

### **2. Filtros Avançados**

```javascript
// Buscar issues com filtros específicos
const filteredIssues = await fetch('/api/jira/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    credentials,
    projectKey: 'PROJ',
    filters: {
      timePeriod: 'custom',
      customStartDate: '2025-07-01',
      customEndDate: '2025-07-13',
      assignee: 'João Silva',
      issueTypes: ['Story', 'Bug']
    }
  })
});
```

### **3. Error Handling**

```javascript
const handleApiRequest = async (endpoint, data) => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
};
```

---

## 🔧 **Configuração Local**

### **Variáveis de Ambiente**

```env
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/dashboard
PORT=5000
```

### **Headers Recomendados**

```javascript
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Cache-Control': 'no-cache'
};
```

---

## 📈 **Monitoramento**

### **Logs da API**

```javascript
// Formato de log padrão
{
  "timestamp": "2025-07-13T21:15:30.123Z",
  "method": "POST",
  "endpoint": "/api/jira/issues",
  "status": 200,
  "duration": "545ms",
  "jql": "project = \"PROJ\" AND updated >= -1w",
  "issuesFound": 51
}
```

### **Métricas de Performance**

- **Tempo de resposta médio:** < 500ms
- **Taxa de sucesso:** > 99%
- **Cache hit ratio:** > 80%
- **Errors rate:** < 1%

---

**API Version:** 1.0  
**Última atualização:** Julho 2025  
**Maintained by:** Development Team