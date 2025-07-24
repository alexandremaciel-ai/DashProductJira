import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  role: text("role").notNull().default("user"), // admin, manager, user
  status: text("status").notNull().default("active"), // active, inactive, suspended
  permissions: jsonb("permissions"), // JSON object with specific permissions
  preferences: jsonb("preferences"), // User preferences and settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const jiraConfigs = pgTable("jira_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  jiraUrl: text("jira_url").notNull(),
  username: text("username").notNull(),
  apiToken: text("api_token").notNull(),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  connectionTest: jsonb("connection_test"), // Last connection test results
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jiraProjects = pgTable("jira_projects", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").notNull(),
  projectKey: text("project_key").notNull(),
  projectName: text("project_name").notNull(),
  projectData: jsonb("project_data"),
  isActive: boolean("is_active").default(true),
  permissions: jsonb("permissions"), // User permissions for this project
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userProjectAccess = pgTable("user_project_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  accessLevel: text("access_level").notNull().default("read"), // read, write, admin
  permissions: jsonb("permissions"), // Specific permissions for this user on this project
  isActive: boolean("is_active").default(true),
  grantedBy: integer("granted_by"), // User ID who granted access
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  isPublic: boolean("is_public").default(false),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: integer("resource_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertJiraConfigSchema = createInsertSchema(jiraConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJiraProjectSchema = createInsertSchema(jiraProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProjectAccessSchema = createInsertSchema(userProjectAccess).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertJiraConfig = z.infer<typeof insertJiraConfigSchema>;
export type JiraConfig = typeof jiraConfigs.$inferSelect;
export type InsertJiraProject = z.infer<typeof insertJiraProjectSchema>;
export type JiraProject = typeof jiraProjects.$inferSelect;
export type InsertUserProjectAccess = z.infer<typeof insertUserProjectAccessSchema>;
export type UserProjectAccess = typeof userProjectAccess.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
