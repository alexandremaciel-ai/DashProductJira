# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Commands
- `npm run dev` - Start development server (client on port 5000, may need `PORT=3000` on macOS due to AirPlay)
- `npm run build` - Build for production (frontend to dist/public, backend compilation)
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes (Drizzle)

### Project Structure Notes
- **Frontend**: React 18 + TypeScript in `client/` directory with Vite build
- **Backend**: Express server in `server/` directory
- **Shared**: Database schemas and types in `shared/`
- **Database**: PostgreSQL with Drizzle ORM (sessions in production, memory storage for development)

## Architecture Overview

This is a Jira productivity dashboard with a full-stack TypeScript architecture:

### Frontend (`client/`)
- **Framework**: React 18 with TypeScript, using Wouter for routing
- **UI**: Radix UI components with Tailwind CSS (shadcn/ui patterns)
- **State**: TanStack Query for server state, React hooks for local state
- **Build**: Vite with path aliases (`@/` for client/src, `@shared/` for shared)

### Backend (`server/`)
- **Framework**: Express.js with TypeScript
- **API Pattern**: Proxy to Jira Cloud API with authentication validation
- **Sessions**: Express sessions with memory store (development) or PostgreSQL (production)
- **Database**: Drizzle ORM with PostgreSQL in production

### Key Components
- **Dashboard**: Main analytics view with metrics cards and charts
- **Kanban Board**: Visual project management view
- **Authentication**: Jira API token-based auth (stored in session, not persisted)
- **Filtering**: Synchronized filters across dashboard and kanban views

## API Integration

### Jira API Patterns
- All Jira API calls go through backend proxy at `/api/jira/*`
- Authentication uses Jira email + API token
- JQL queries for issue filtering
- Agile API for sprint data

### Main API Endpoints
- `POST /api/jira/auth` - Test Jira credentials
- `POST /api/jira/projects` - Get available projects
- `POST /api/jira/issues` - Get filtered issues with JQL
- `POST /api/jira/sprints` - Get sprint data for project

## Development Guidelines

### File Organization
- Components in `client/src/components/` (business logic) and `client/src/components/ui/` (reusable UI)
- Custom hooks in `client/src/hooks/`
- API utilities in `client/src/lib/`
- Type definitions in `client/src/types/`
- Pages in `client/src/pages/`

### Key Dependencies
- **UI**: @radix-ui/* components, Tailwind CSS, Lucide React icons
- **Data**: TanStack Query, Axios for HTTP
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Database**: Drizzle ORM with PostgreSQL

### TypeScript Configuration
- Strict mode enabled
- Path aliases configured for `@/*` and `@shared/*`
- ESM modules throughout
- No emitted files (Vite handles bundling)

## Database Schema

Located in `shared/schema.ts`:
- User management tables (currently minimal)
- Session storage for authentication
- Drizzle schema with Zod validation integration

## Deployment

- **Development**: `npm run dev` (may need `PORT=3000` on macOS)
- **Production**: Designed for Replit deployment with PostgreSQL
- **Build process**: Frontend build to `dist/public/`, backend to `dist/`
- **Environment**: Requires `DATABASE_URL` for production PostgreSQL

## Troubleshooting

### Common Issues
- **Port 5000 conflict on macOS**: Use `PORT=3000 npm run dev`
- **Database connection**: Ensure `DATABASE_URL` is set for production
- **Jira authentication**: Verify API token and email are correct
- **CORS issues**: Backend handles CORS for frontend-backend communication