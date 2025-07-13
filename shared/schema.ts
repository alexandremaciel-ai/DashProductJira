import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const jiraConfigs = pgTable("jira_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  jiraUrl: text("jira_url").notNull(),
  username: text("username").notNull(),
  apiToken: text("api_token").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jiraProjects = pgTable("jira_projects", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").notNull(),
  projectKey: text("project_key").notNull(),
  projectName: text("project_name").notNull(),
  projectData: jsonb("project_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertJiraConfigSchema = createInsertSchema(jiraConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertJiraProjectSchema = createInsertSchema(jiraProjects).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertJiraConfig = z.infer<typeof insertJiraConfigSchema>;
export type JiraConfig = typeof jiraConfigs.$inferSelect;
export type InsertJiraProject = z.infer<typeof insertJiraProjectSchema>;
export type JiraProject = typeof jiraProjects.$inferSelect;
