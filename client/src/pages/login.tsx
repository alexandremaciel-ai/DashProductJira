import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ChartLine, Eye, EyeOff, Loader2 } from "lucide-react";
import { useJiraAuth } from "@/hooks/use-jira-auth";
import type { JiraCredentials } from "@/types/jira";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, isLoading } = useJiraAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState<JiraCredentials>({
    jiraUrl: "",
    username: "",
    apiToken: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(credentials);
    if (success) {
      setLocation("/projects");
    }
  };

  const handleInputChange = (field: keyof JiraCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border border-gray-200">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <ChartLine className="text-white text-2xl" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Jira Productivity Dashboard</h1>
              <p className="text-gray-600 text-sm">Connect to your Jira instance to analyze team productivity</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="jiraUrl" className="text-sm font-medium text-gray-700">
                  Jira Instance URL
                </Label>
                <Input
                  id="jiraUrl"
                  type="url"
                  placeholder="https://your-company.atlassian.net"
                  value={credentials.jiraUrl}
                  onChange={(e) => handleInputChange("jiraUrl", e.target.value)}
                  className="mt-2 border-gray-200 focus:ring-blue-600 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Email/Username
                </Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="your.email@company.com"
                  value={credentials.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="mt-2 border-gray-200 focus:ring-blue-600 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <Label htmlFor="apiToken" className="text-sm font-medium text-gray-700">
                  API Token
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="apiToken"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your Jira API token"
                    value={credentials.apiToken}
                    onChange={(e) => handleInputChange("apiToken", e.target.value)}
                    className="border-gray-200 focus:ring-blue-600 focus:border-blue-600 pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  <a 
                    href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    How to generate an API token
                  </a>
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Connecting...
                  </>
                ) : (
                  "Connect to Jira"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-gray-600">
          <p>Secure connection • Your credentials are encrypted</p>
        </div>
      </div>
    </div>
  );
}
