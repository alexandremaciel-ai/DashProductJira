import { useState } from "react";
import type { JiraCredentials } from "@/types/jira";
import { jiraApi } from "@/lib/jira-api";
import { useToast } from "@/hooks/use-toast";

export function useJiraAuth() {
  const [credentials, setCredentials] = useState<JiraCredentials | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const login = async (creds: JiraCredentials) => {
    setIsLoading(true);
    try {
      await jiraApi.authenticate(creds);
      setCredentials(creds);
      setIsAuthenticated(true);
      
      // Store credentials in sessionStorage for the session
      sessionStorage.setItem("jiraCredentials", JSON.stringify(creds));
      
      toast({
        title: "Authentication successful",
        description: "Connected to Jira successfully",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.response?.data?.error || "Failed to connect to Jira",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCredentials(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem("jiraCredentials");
    sessionStorage.removeItem("selectedProject");
  };

  const loadStoredCredentials = () => {
    const stored = sessionStorage.getItem("jiraCredentials");
    if (stored) {
      try {
        const creds = JSON.parse(stored) as JiraCredentials;
        setCredentials(creds);
        setIsAuthenticated(true);
        return creds;
      } catch {
        sessionStorage.removeItem("jiraCredentials");
      }
    }
    return null;
  };

  return {
    credentials,
    isAuthenticated,
    isLoading,
    login,
    logout,
    loadStoredCredentials,
  };
}
