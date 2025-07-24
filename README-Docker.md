# Docker Setup for Dash Jira Application

## Visão Geral

Esta aplicação foi completamente dockerizada e inclui:
- **Aplicação web** (React + Express.js)
- **Banco PostgreSQL** para armazenar configurações de usuários
- **Sistema de gerenciamento de usuários** com diferentes níveis de permissão
- **Configurações de API Jira por usuário**
- **Controle de acesso a projetos**

## Estrutura do Banco de Dados

O sistema inclui as seguintes tabelas principais:

### 1. `users` - Usuários do Sistema
- ID, username, password, email
- **role**: admin, manager, user
- **status**: active, inactive, suspended
- **permissions**: objeto JSON com permissões específicas
- **preferences**: preferências do usuário

### 2. `jira_configs` - Configurações de API Jira
- Configurações de API Jira por usuário (URL, username, token)
- Controle de configurações ativas/inativas
- Teste de conexão

### 3. `jira_projects` - Projetos Jira
- Projetos disponíveis por configuração
- Permissões específicas por projeto

### 4. `user_project_access` - Controle de Acesso
- **access_level**: read, write, admin
- Controle granular de acesso por usuário/projeto

### 5. `system_settings` - Configurações do Sistema
- Configurações globais da aplicação

### 6. `audit_logs` - Logs de Auditoria
- Rastreamento de todas as ações dos usuários

## Como Usar

### 1. Preparação
```bash
# Copie o arquivo de configuração de exemplo
cp .env.example .env

# Edite as variáveis de ambiente se necessário
nano .env
```

### 2. Execução com Docker Compose
```bash
# Construir e iniciar os containers
docker-compose up --build

# Para executar em background
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Ver logs apenas da aplicação
docker-compose logs -f app

# Ver logs apenas do banco
docker-compose logs -f postgres
```

### 3. Parar os Containers
```bash
# Parar os containers
docker-compose down

# Parar e remover volumes (CUIDADO: apaga os dados do banco)
docker-compose down -v
```

### 4. Acesso à Aplicação

- **Aplicação**: http://localhost:3000
- **Banco PostgreSQL**: localhost:5432
  - Database: `dashdb`
  - Username: `dashuser`
  - Password: `dashpass`

### 5. Usuário Inicial

Um usuário administrador é criado automaticamente:
- **Username**: admin
- **Password**: admin123
- **Role**: admin
- **Email**: admin@company.com

**IMPORTANTE**: Altere a senha do administrador em produção!

## Comandos Úteis

### Gerenciar Banco de Dados
```bash
# Aplicar migrações do Drizzle
docker-compose exec app npm run db:push

# Conectar ao PostgreSQL diretamente
docker-compose exec postgres psql -U dashuser -d dashdb
```

### Verificar Saúde da Aplicação
```bash
# Health check
curl http://localhost:3000/health
```

### Logs e Debug
```bash
# Ver logs em tempo real
docker-compose logs -f app

# Executar comandos dentro do container da aplicação
docker-compose exec app /bin/sh

# Ver estatísticas dos containers
docker stats
```

## Configurações de Produção

### Variáveis de Ambiente Importantes
- `NODE_ENV=production`
- `SESSION_SECRET`: Use uma chave forte e única
- `DATABASE_URL`: String de conexão do PostgreSQL

### Segurança
1. Altere todas as senhas padrão
2. Configure um `SESSION_SECRET` forte
3. Configure SSL/HTTPS em produção
4. Limite acesso ao banco de dados
5. Configure firewall adequadamente

### Backup do Banco
```bash
# Fazer backup
docker-compose exec postgres pg_dump -U dashuser dashdb > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U dashuser dashdb < backup.sql
```

## Estrutura de Arquivos Docker

- `Dockerfile` - Imagem da aplicação
- `docker-compose.yml` - Orquestração dos serviços
- `init.sql` - Inicialização do banco de dados
- `.dockerignore` - Arquivos ignorados no build
- `.env.example` - Exemplo de configuração

## Volumes

- `postgres_data` - Dados persistentes do PostgreSQL
- `./logs` - Logs da aplicação (se configurado)

## Troubleshooting

### Problema de Permissões
```bash
# Recriar containers com permissões corretas
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Banco Não Conecta
```bash
# Verificar se o PostgreSQL está pronto
docker-compose exec postgres pg_isready -U dashuser -d dashdb

# Verificar logs do banco
docker-compose logs postgres
```

### Aplicação Não Inicia
```bash
# Verificar logs da aplicação
docker-compose logs app

# Verificar health check
curl http://localhost:3000/health
```

## Desenvolvimento

Para desenvolvimento, você pode usar volumes para hot-reload:

```yaml
# Adicionar ao docker-compose.yml no serviço app:
volumes:
  - .:/app
  - /app/node_modules
```