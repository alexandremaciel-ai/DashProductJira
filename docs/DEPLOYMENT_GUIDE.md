# Guia de Deployment
## Jira Productivity Dashboard

### 🚀 **Visão Geral do Deployment**

Este guia detalha como fazer deploy da aplicação Jira Productivity Dashboard em diferentes ambientes, com foco principal na plataforma Replit.

---

## 🌟 **Replit Deployment (Recomendado)**

### **Pré-requisitos**
- Conta no Replit
- Acesso ao repositório
- Credenciais do Jira Cloud

### **Passos de Deploy**

#### **1. Configuração Inicial**
```bash
# O projeto já está configurado para Replit
# Arquivo .replit existente com configurações
```

#### **2. Instalação de Dependências**
```bash
# Executado automaticamente pelo Replit
npm install
```

#### **3. Configuração do Ambiente**
```bash
# Variáveis necessárias (configuradas automaticamente)
NODE_ENV=production
DATABASE_URL=postgresql://...  # Provido pelo Replit
```

#### **4. Build da Aplicação**
```bash
# Build automático
npm run build
```

#### **5. Start da Aplicação**
```bash
# Comando configurado no .replit
npm run dev
```

### **Deploy Button**
```markdown
[![Deploy on Replit](https://replit.com/badge/github/username/jira-dashboard)](https://replit.com/@username/jira-dashboard)
```

---

## 🐳 **Docker Deployment**

### **Dockerfile**
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S dashboard -u 1001
USER dashboard

EXPOSE 5000

CMD ["npm", "start"]
```

### **docker-compose.yml**
```yaml
version: '3.8'

services:
  dashboard:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/dashboard
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=dashboard
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### **Comandos Docker**
```bash
# Build da imagem
docker build -t jira-dashboard .

# Run com docker-compose
docker-compose up -d

# View logs
docker-compose logs -f dashboard

# Stop
docker-compose down
```

---

## ☁️ **Cloud Deployment**

### **Vercel**

#### **vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### **Deploy Commands**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
```

### **Railway**

#### **railway.json**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

#### **Deploy Commands**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### **Heroku**

#### **Procfile**
```
web: npm start
release: npm run db:migrate
```

#### **Deploy Commands**
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create jira-dashboard

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main
```

---

## 📦 **Build Process**

### **Scripts de Build**

```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsx build server/index.ts",
    "start": "node dist/server/index.js",
    "dev": "NODE_ENV=development tsx server/index.ts"
  }
}
```

### **Estrutura de Build**

```
dist/
├── public/              # Frontend estático
│   ├── index.html
│   ├── assets/
│   │   ├── index-abc123.js
│   │   └── index-def456.css
│   └── favicon.ico
└── server/              # Backend compilado
    ├── index.js
    ├── routes.js
    └── storage.js
```

### **Otimizações de Build**

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select']
        }
      }
    }
  }
});
```

---

## 🗄️ **Database Setup**

### **PostgreSQL (Produção)**

#### **Configuração via Drizzle**
```typescript
// drizzle.config.ts
export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!
  }
};
```

#### **Migrations**
```bash
# Generate migration
npx drizzle-kit generate:pg

# Run migration
npx drizzle-kit push:pg
```

### **Database Providers**

#### **Neon (Recomendado)**
```bash
# Connection string format
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dashboard?sslmode=require"
```

#### **Supabase**
```bash
# Connection string format  
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

#### **Railway PostgreSQL**
```bash
# Automatically provided
DATABASE_URL=${{ Railway.POSTGRESQL_URL }}
```

---

## 🔒 **Environment Variables**

### **Variáveis Necessárias**

```env
# Ambiente
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Session Secret (opcional)
SESSION_SECRET=your-secret-key

# Port (opcional, padrão 5000)
PORT=5000
```

### **Configuração por Ambiente**

#### **Development**
```env
NODE_ENV=development
DATABASE_URL=memory://
```

#### **Production**
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=super-secret-key
```

### **Validação de Environment**

```typescript
// Validar variáveis na inicialização
const requiredEnvVars = ['DATABASE_URL'];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

---

## 📊 **Health Checks**

### **Endpoint de Health**

```typescript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    database: 'connected' // Check actual DB connection
  });
});
```

### **Monitoring Setup**

```typescript
// Basic monitoring
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Error monitoring
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
```

---

## 🔧 **Performance Optimization**

### **Server Optimizations**

```typescript
// Compression
import compression from 'compression';
app.use(compression());

// Static file caching
app.use(express.static('dist/public', {
  maxAge: '1y',
  etag: true
}));

// Request rate limiting
import rateLimit from 'express-rate-limit';
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
}));
```

### **Frontend Optimizations**

```typescript
// Code splitting
const DashboardPage = lazy(() => import('./pages/dashboard'));
const KanbanPage = lazy(() => import('./pages/kanban'));

// Image optimization
const images = import.meta.glob('./assets/*.{png,jpg,jpeg,svg}', {
  eager: true
});
```

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Replit
      run: |
        # Deploy script here
```

### **Deployment Script**

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting deployment..."

# Build application
npm run build

# Run database migrations
npm run db:migrate

# Start application
npm start

echo "Deployment completed successfully!"
```

---

## 🚨 **Troubleshooting**

### **Problemas Comuns**

#### **1. Build Failures**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **2. Database Connection Issues**
```bash
# Test database connection
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()', (err, res) => { console.log(err ? err : res.rows[0]); pool.end(); });"
```

#### **3. Memory Issues**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### **Debug Mode**

```bash
# Run with debug logging
DEBUG=* npm start

# Run with Node.js inspector
node --inspect dist/server/index.js
```

---

## 📋 **Pre-deployment Checklist**

### **Antes do Deploy**

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Database migrations executadas
- [ ] Build da aplicação concluído sem erros
- [ ] Testes passando
- [ ] Health check endpoint funcionando
- [ ] SSL/HTTPS configurado (se necessário)

### **Após o Deploy**

- [ ] Aplicação respondendo no URL correto
- [ ] Banco de dados conectado
- [ ] Autenticação Jira funcionando
- [ ] Dashboard carregando métricas
- [ ] Gráficos renderizando corretamente
- [ ] Exportação PDF/CSV funcionando

---

## 📞 **Suporte ao Deploy**

### **Logs Importantes**

```bash
# Server logs
tail -f logs/server.log

# Application logs  
tail -f logs/app.log

# Error logs
tail -f logs/error.log
```

### **Comandos Úteis**

```bash
# Check application status
curl http://localhost:5000/api/health

# Monitor resource usage
top -p $(pgrep node)

# Check database connections
netstat -an | grep 5432
```

---

**Deployment Guide Version:** 1.0  
**Última atualização:** Julho 2025  
**Next review:** Agosto 2025