-- Initial database setup for Dash Jira Application
-- This file is executed when the PostgreSQL container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all tables first (Drizzle migration)
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" integer,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "jira_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"jira_url" text NOT NULL,
	"username" text NOT NULL,
	"api_token" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"connection_test" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "jira_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" integer NOT NULL,
	"project_key" text NOT NULL,
	"project_name" text NOT NULL,
	"project_data" jsonb,
	"is_active" boolean DEFAULT true,
	"permissions" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" jsonb NOT NULL,
	"description" text,
	"category" text DEFAULT 'general' NOT NULL,
	"is_public" boolean DEFAULT false,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "system_settings_setting_key_unique" UNIQUE("setting_key")
);

CREATE TABLE "user_project_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"access_level" text DEFAULT 'read' NOT NULL,
	"permissions" jsonb,
	"is_active" boolean DEFAULT true,
	"granted_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"role" text DEFAULT 'user' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"permissions" jsonb,
	"preferences" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Create initial admin user (password: admin123 - should be changed in production)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (username, password, email, full_name, role, status, permissions, preferences) 
VALUES (
  'admin',
  '$2b$10$rGNqY3TgQhvKQGJ4YLpONOZjGV4B8s1s6m.vXP9KO2XeS9s5a8/Vy',
  'admin@company.com',
  'System Administrator',
  'admin',
  'active',
  '{"admin": true, "manage_users": true, "manage_projects": true, "view_logs": true}',
  '{"theme": "light", "language": "en"}'
) ON CONFLICT (username) DO NOTHING;

-- Create some initial system settings
INSERT INTO system_settings (setting_key, setting_value, description, category, is_public, updated_by) 
VALUES 
  ('app_name', '"Dash Jira Analytics"', 'Application name displayed in UI', 'general', true, 1),
  ('max_projects_per_user', '10', 'Maximum number of Jira projects a user can access', 'limits', false, 1),
  ('session_timeout', '3600', 'Session timeout in seconds', 'security', false, 1),
  ('enable_audit_logs', 'true', 'Enable audit logging for user actions', 'security', false, 1),
  ('default_user_role', '"user"', 'Default role assigned to new users', 'security', false, 1)
ON CONFLICT (setting_key) DO NOTHING;

-- Log the initial setup
INSERT INTO audit_logs (user_id, action, resource, resource_id, details) 
VALUES (
  1,
  'system_initialization',
  'system',
  null,
  '{"message": "Database initialized with admin user and default settings"}'
);