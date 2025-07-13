# Jira Productivity Dashboard

## Overview

This is a full-stack web application built for monitoring and analyzing developer productivity using data from the Jira API. The application provides a comprehensive dashboard with metrics, charts, and AI-powered insights to help teams track their performance and identify areas for improvement.

## User Preferences

Preferred communication style: Simple, everyday language.
Features requested: Kanban board with task details, completion charts by day/week/month.
Translation: Complete Portuguese (Brazilian) translation implemented across all components.
Filter consistency: Fixed discrepancies between dashboard and kanban statistics.
Custom dates: Calendar picker implemented for custom period selection.
Time filters: All period filters working correctly (Esta Semana, Este Mês, Trimestre, Todo Período, Personalizado).
Default view: Changed to "Todo Período" to show all data by default.
Card consistency: Fixed discrepancy between card statistics and kanban board data - both now show tasks created in selected period.
Advanced cards: Kanban now uses same professional MetricsCard components as dashboard with comparison statistics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React hooks (useState, useEffect) with TanStack Query for server state
- **Charts**: Recharts library for data visualization
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with proxy endpoints for Jira integration
- **Session Management**: Express sessions with PostgreSQL storage
- **Development**: Hot module replacement with Vite integration

### Database Layer
- **Primary Database**: PostgreSQL (configured for production)
- **ORM**: Drizzle ORM with Zod validation
- **Development Storage**: In-memory storage for rapid prototyping
- **Cloud Provider**: Neon Database for serverless PostgreSQL
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- **Jira Integration**: Direct API token authentication with Jira Cloud instances
- **Session Storage**: Browser sessionStorage for credential persistence
- **Security**: Proxy-based API calls to handle CORS and secure credential transmission

### Dashboard Components
- **Metrics Cards**: Key performance indicators with trend analysis
- **Interactive Charts**: Line charts for trends, pie charts for distributions, bar charts for comparisons
- **Filtering System**: Time period, sprint, assignee, and issue type filters
- **Export Functionality**: PDF and CSV report generation
- **Kanban Board**: Visual task management with task details modal and sidebar filters
- **Completion Charts**: Dynamic charts showing task completion by day, week, and month
- **Custom Date Picker**: Calendar interface for custom period selection with date range support
- **Consistent Filtering**: Unified filter logic between dashboard and kanban views
- **Smart Time Filters**: Optimized JQL queries for accurate period filtering:
  - Esta Semana: últimos 7 dias (updated >= -1w)
  - Este Mês: últimas 4 semanas (updated >= -4w)
  - Trimestre: últimas 12 semanas (updated >= -12w)
  - Todo Período: sem filtro de data
  - Personalizado: período selecionado pelo usuário

### Data Processing
- **API Integration**: Jira REST API v3 for fetching projects, issues, sprints
- **Real-time Updates**: TanStack Query for caching and background refetching
- **Metrics Calculation**: Client-side computation of productivity metrics
- **AI Analysis**: Optional AI-powered insights (placeholder for LLM integration)

## Data Flow

1. **Authentication Flow**:
   - User enters Jira credentials (URL, username, API token)
   - Backend validates credentials via Jira API
   - Successful authentication stores session data

2. **Project Selection**:
   - Fetch available projects from Jira
   - User selects project for analysis
   - Project data cached for dashboard use

3. **Dashboard Data Pipeline**:
   - Parallel API calls for issues, sprints, and project metadata
   - Client-side processing to calculate metrics
   - Real-time chart updates based on filter changes
   - Optional AI analysis of productivity patterns

4. **Export Pipeline**:
   - Generate reports from current dashboard state
   - PDF creation with charts and summaries
   - CSV export for raw data analysis

## External Dependencies

### Core Libraries
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **UI Framework**: Radix UI components, Tailwind CSS, Lucide icons
- **Data Fetching**: TanStack Query, Axios
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **PDF Generation**: jsPDF for report exports

### Development Tools
- **Build Tools**: Vite, TypeScript, ESBuild
- **Database**: Drizzle ORM, Drizzle Kit, @neondatabase/serverless
- **Code Quality**: TypeScript strict mode, ESLint configuration
- **Development**: Replit-specific plugins for hot reloading

### API Integrations
- **Jira Cloud**: REST API v3 for project and issue data
- **AI Services**: Placeholder for OpenAI or similar LLM integration
- **Export Services**: Client-side PDF/CSV generation

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Reloading**: Vite HMR for frontend, tsx for backend
- **Database**: In-memory storage for rapid iteration
- **Environment**: NODE_ENV=development

### Production Environment
- **Build Process**: Vite build for frontend, ESBuild for backend
- **Static Assets**: Served from dist/public directory
- **Database**: PostgreSQL with connection pooling
- **Process Management**: Node.js with production optimizations
- **Environment**: NODE_ENV=production

### Configuration Management
- **Environment Variables**: DATABASE_URL for PostgreSQL connection
- **Build Outputs**: Separate client and server bundles
- **Asset Optimization**: Vite handles code splitting and optimization
- **Error Handling**: Comprehensive error boundaries and API error handling

The application follows a modern full-stack architecture with clear separation of concerns, robust error handling, and scalable data processing patterns. The modular component structure and TypeScript implementation ensure maintainability and type safety throughout the codebase.