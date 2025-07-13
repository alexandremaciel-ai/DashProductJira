import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartLine, Users, ListTodo, LogOut } from "lucide-react";
import { useJiraAuth } from "@/hooks/use-jira-auth";
import { useJiraProjects } from "@/hooks/use-jira-data";
import type { JiraProject } from "@/types/jira";

export default function ProjectSelectionPage() {
  const [, setLocation] = useLocation();
  const { credentials, logout, loadStoredCredentials } = useJiraAuth();
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);

  // Load stored credentials on mount
  useEffect(() => {
    if (!credentials) {
      const stored = loadStoredCredentials();
      if (!stored) {
        setLocation("/");
        return;
      }
    }
  }, [credentials, loadStoredCredentials, setLocation]);

  const { data: projects, isLoading, error } = useJiraProjects(credentials);

  const handleProjectSelect = (project: JiraProject) => {
    setSelectedProject(project);
    sessionStorage.setItem("selectedProject", JSON.stringify(project));
    setLocation("/dashboard");
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (!credentials) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ChartLine className="text-white text-sm" size={16} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Dashboard de Produtividade</h1>
              <p className="text-xs text-gray-600">conectado a {credentials.jiraUrl}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-700"
          >
            <LogOut className="mr-2" size={14} />
            Sair
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecione um Projeto</h2>
          <p className="text-gray-600">Escolha o projeto do Jira que você deseja analisar</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Erro ao carregar projetos: {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="flex space-x-4 mt-3">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            projects?.map((project) => (
              <Card 
                key={project.id}
                className="border border-gray-200 hover:border-blue-600 transition-colors cursor-pointer group"
                onClick={() => handleProjectSelect(project)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {project.key.substring(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{project.key}</p>
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-600">
                        <span>
                          <ListTodo className="inline mr-1" size={12} />
                          Project
                        </span>
                        <span>
                          <Users className="inline mr-1" size={12} />
                          Team
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {projects && projects.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ListTodo size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600">
              No projects are accessible with your current permissions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
