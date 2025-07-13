import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  // Jira API proxy routes to handle CORS
  app.post("/api/jira/auth", async (req, res) => {
    try {
      const { jiraUrl, username, apiToken } = req.body;
      
      // Validate credentials by trying to access user info
      const response = await axios.get(`${jiraUrl}/rest/api/3/myself`, {
        auth: {
          username,
          password: apiToken,
        },
        headers: {
          'Accept': 'application/json',
        },
      });

      res.json({ success: true, user: response.data });
    } catch (error: any) {
      res.status(401).json({ 
        success: false, 
        error: error.response?.data?.errorMessages?.[0] || "Authentication failed" 
      });
    }
  });

  app.post("/api/jira/projects", async (req, res) => {
    try {
      const { jiraUrl, username, apiToken } = req.body;
      
      const response = await axios.get(`${jiraUrl}/rest/api/3/project`, {
        auth: {
          username,
          password: apiToken,
        },
        headers: {
          'Accept': 'application/json',
        },
      });

      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ 
        error: error.response?.data?.errorMessages?.[0] || "Failed to fetch projects" 
      });
    }
  });

  app.post("/api/jira/project-metadata", async (req, res) => {
    try {
      const { jiraUrl, username, apiToken, projectKey } = req.body;
      
      const response = await axios.get(`${jiraUrl}/rest/api/3/project/${projectKey}`, {
        auth: {
          username,
          password: apiToken,
        },
        headers: {
          'Accept': 'application/json',
        },
      });

      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ 
        error: error.response?.data?.errorMessages?.[0] || "Failed to fetch project metadata" 
      });
    }
  });

  app.post("/api/jira/issues", async (req, res) => {
    try {
      const { jiraUrl, username, apiToken, projectKey, filters } = req.body;
      
      // Build JQL query
      let jql = `project = "${projectKey}"`;
      
      // Add time period filter
      if (filters?.timePeriod && filters.timePeriod !== "all") {
        let dateFilter = "";
        
        switch (filters.timePeriod) {
          case "week":
            // Esta semana: últimos 7 dias de atividade
            dateFilter = ` AND updated >= -1w`;
            break;
          case "month":
            // Este mês: últimas 4 semanas de atividade
            dateFilter = ` AND updated >= -4w`;
            break;
          case "quarter":
            // Trimestre: últimas 12 semanas de atividade
            dateFilter = ` AND updated >= -12w`;
            break;
          case "custom":
            // Handle custom date range - usar apenas as datas selecionadas
            if (filters.customStartDate && filters.customEndDate) {
              dateFilter = ` AND updated >= "${filters.customStartDate}" AND updated <= "${filters.customEndDate}"`;
            } else if (filters.customStartDate) {
              dateFilter = ` AND updated >= "${filters.customStartDate}"`;
            } else if (filters.customEndDate) {
              dateFilter = ` AND updated <= "${filters.customEndDate}"`;
            }
            break;
        }
        jql += dateFilter;
      }
      // Se timePeriod for "all", não aplicamos filtro de data (mostra tudo)

      if (filters?.assignee && filters.assignee !== "all") {
        jql += ` AND assignee = "${filters.assignee}"`;
      }

      // Add issue type filter if selected
      if (filters?.issueTypes && filters.issueTypes.length > 0) {
        const issueTypeFilter = filters.issueTypes.map((type: string) => `"${type}"`).join(",");
        jql += ` AND issuetype in (${issueTypeFilter})`;
      }

      console.log("JQL Query:", jql);

      const response = await axios.get(`${jiraUrl}/rest/api/3/search`, {
        auth: {
          username,
          password: apiToken,
        },
        headers: {
          'Accept': 'application/json',
        },
        params: {
          jql,
          fields: "summary,status,assignee,created,updated,resolutiondate,issuetype,customfield_10016", // customfield_10016 is usually story points
          maxResults: 1000,
          startAt: 0,
        },
      });

      console.log("Issues found:", response.data.total);
      res.json(response.data);
    } catch (error: any) {
      console.error("Error fetching issues:", error.response?.data || error.message);
      res.status(500).json({ 
        error: error.response?.data?.errorMessages?.[0] || "Failed to fetch issues" 
      });
    }
  });

  app.post("/api/jira/sprints", async (req, res) => {
    try {
      const { jiraUrl, username, apiToken, projectKey } = req.body;
      
      // First get the boards for the project
      const boardsResponse = await axios.get(`${jiraUrl}/rest/agile/1.0/board`, {
        auth: {
          username,
          password: apiToken,
        },
        headers: {
          'Accept': 'application/json',
        },
        params: {
          projectKeyOrId: projectKey,
        },
      });

      if (boardsResponse.data.values.length === 0) {
        return res.json([]);
      }

      const boardId = boardsResponse.data.values[0].id;

      // Get sprints for the board
      const sprintsResponse = await axios.get(`${jiraUrl}/rest/agile/1.0/board/${boardId}/sprint`, {
        auth: {
          username,
          password: apiToken,
        },
        headers: {
          'Accept': 'application/json',
        },
      });

      res.json(sprintsResponse.data.values);
    } catch (error: any) {
      // Return empty array if sprints are not supported
      res.json([]);
    }
  });

  // New endpoint to get dynamic status categories and issue types
  app.post("/api/jira/project-members", async (req, res) => {
    try {
      const { jiraUrl, username, apiToken, projectKey } = req.body;
      
      // Get project details with roles
      const projectResponse = await axios.get(`${jiraUrl}/rest/api/3/project/${projectKey}/role`, {
        auth: {
          username,
          password: apiToken,
        },
        headers: {
          'Accept': 'application/json',
        },
      });

      const roleUrls = Object.values(projectResponse.data) as string[];
      const members = new Map();

      // Fetch members from each role
      for (const roleUrl of roleUrls) {
        try {
          const roleResponse = await axios.get(roleUrl, {
            auth: {
              username,
              password: apiToken,
            },
            headers: {
              'Accept': 'application/json',
            },
          });

          if (roleResponse.data.actors) {
            roleResponse.data.actors.forEach((actor: any) => {
              if (actor.type === 'atlassian-user-role-actor' && actor.actorUser) {
                const user = actor.actorUser;
                if (!members.has(user.accountId)) {
                  members.set(user.accountId, {
                    accountId: user.accountId,
                    displayName: user.displayName,
                    emailAddress: user.emailAddress || '',
                    avatarUrl: user.avatarUrls?.['48x48'] || '',
                  });
                }
              }
            });
          }
        } catch (roleError: any) {
          console.log(`Failed to fetch role data from ${roleUrl}:`, roleError.message);
        }
      }

      // Also get assignees from project issues to catch anyone who might not be in roles
      try {
        const issuesResponse = await axios.get(`${jiraUrl}/rest/api/3/search`, {
          auth: {
            username,
            password: apiToken,
          },
          headers: {
            'Accept': 'application/json',
          },
          params: {
            jql: `project = "${projectKey}"`,
            fields: 'assignee',
            maxResults: 1000,
          },
        });

        issuesResponse.data.issues.forEach((issue: any) => {
          if (issue.fields.assignee) {
            const user = issue.fields.assignee;
            if (!members.has(user.accountId)) {
              members.set(user.accountId, {
                accountId: user.accountId,
                displayName: user.displayName,
                emailAddress: user.emailAddress || '',
                avatarUrl: user.avatarUrls?.['48x48'] || '',
              });
            }
          }
        });
      } catch (issuesError: any) {
        console.log('Failed to fetch assignees from issues:', issuesError.message);
      }

      res.json(Array.from(members.values()));
    } catch (error: any) {
      console.error('Error fetching project members:', error.message);
      res.status(500).json({ 
        error: error.response?.data?.errorMessages?.[0] || "Failed to fetch project members" 
      });
    }
  });

  app.post("/api/jira/status-categories", async (req, res) => {
    try {
      const { jiraUrl, username, apiToken, projectKey } = req.body;
      
      if (!jiraUrl || !username || !apiToken || !projectKey) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get project statuses
      const statusesResponse = await axios.get(`${jiraUrl}/rest/api/3/project/${projectKey}/statuses`, {
        auth: {
          username,
          password: apiToken,
        },
        headers: {
          'Accept': 'application/json',
        },
      });

      const statusesData = statusesResponse.data;
      
      // Extract unique statuses across all issue types
      const allStatuses = new Map();
      
      statusesData.forEach((issueType: any) => {
        issueType.statuses.forEach((status: any) => {
          if (!allStatuses.has(status.id)) {
            allStatuses.set(status.id, {
              id: status.id,
              name: status.name,
              statusCategory: status.statusCategory,
              description: status.description || ''
            });
          }
        });
      });

      // Group statuses by category
      const statusCategories: {
        todo: any[];
        inprogress: any[];
        done: any[];
      } = {
        todo: [],
        inprogress: [],
        done: []
      };

      allStatuses.forEach((status: any) => {
        const categoryKey = status.statusCategory.key.toLowerCase();
        if (categoryKey === 'new') {
          statusCategories.todo.push(status);
        } else if (categoryKey === 'indeterminate') {
          statusCategories.inprogress.push(status);
        } else if (categoryKey === 'done') {
          statusCategories.done.push(status);
        }
      });

      // Get unique issue types
      const issueTypes = statusesData.map((issueType: any) => ({
        id: issueType.id,
        name: issueType.name,
        iconUrl: issueType.iconUrl,
        description: issueType.description || '',
        subtask: issueType.subtask || false
      }));

      res.json({
        statusCategories,
        issueTypes,
        allStatuses: Array.from(allStatuses.values())
      });
    } catch (error: any) {
      console.error('Error fetching status categories:', error);
      res.status(500).json({ 
        error: error.response?.data?.errorMessages?.[0] || "Failed to fetch status categories" 
      });
    }
  });

  app.post("/api/ai/insights", async (req, res) => {
    try {
      const { metrics, projectData } = req.body;
      
      // Simulate AI insights based on the metrics
      // In a real implementation, this would call OpenAI or another AI service
      const insights = {
        performance: generatePerformanceInsight(metrics),
        predictions: generatePredictions(metrics),
        recommendations: generateRecommendations(metrics),
      };

      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to generate AI insights" 
      });
    }
  });

  function generatePerformanceInsight(metrics: any) {
    const velocityChange = metrics.velocityChange || 0;
    const cycleTimeChange = metrics.cycleTimeChange || 0;
    
    if (velocityChange > 10) {
      return "Your team's velocity has increased significantly this sprint. The main contributing factor appears to be improved task estimation accuracy.";
    } else if (velocityChange < -10) {
      return "Your team's velocity has decreased this sprint. Consider reviewing task complexity and potential blockers.";
    } else if (cycleTimeChange < -15) {
      return "Cycle time has improved notably. Your team is resolving tasks more efficiently than before.";
    } else {
      return "Your team is maintaining steady performance with consistent delivery patterns.";
    }
  }

  function generatePredictions(metrics: any) {
    const velocity = metrics.velocity || 30;
    const trend = metrics.velocityTrend || 0;
    
    const nextSprintMin = Math.max(1, Math.round(velocity * 0.9 + trend));
    const nextSprintMax = Math.round(velocity * 1.1 + trend);
    
    return `Based on current trends, your team is likely to complete ${nextSprintMin}-${nextSprintMax} story points next sprint. Consider adding 2-3 more small tasks if capacity allows.`;
  }

  function generateRecommendations(metrics: any) {
    const bugRate = metrics.bugRate || 0;
    const cycleTime = metrics.cycleTime || 3;
    
    if (bugRate > 15) {
      return "Consider implementing more thorough code reviews and automated testing to reduce the bug rate.";
    } else if (cycleTime > 5) {
      return "Focus on breaking down larger tasks and improving the review process to reduce cycle time.";
    } else {
      return "Your team is performing well. Consider documenting successful practices for knowledge sharing.";
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
