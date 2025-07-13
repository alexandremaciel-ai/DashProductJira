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

  app.post("/api/jira/issues", async (req, res) => {
    try {
      const { jiraUrl, username, apiToken, projectKey, filters } = req.body;
      
      let jql = `project = ${projectKey}`;
      
      // Add filters to JQL
      if (filters?.timePeriod) {
        const { timePeriod } = filters;
        let dateFilter = "";
        
        switch (timePeriod) {
          case "week":
            dateFilter = "AND updated >= -1w";
            break;
          case "month":
            dateFilter = "AND updated >= -1M";
            break;
          case "quarter":
            dateFilter = "AND updated >= -3M";
            break;
        }
        jql += ` ${dateFilter}`;
      }

      if (filters?.assignee && filters.assignee !== "All Developers") {
        jql += ` AND assignee = "${filters.assignee}"`;
      }

      if (filters?.issueTypes && filters.issueTypes.length > 0) {
        const types = filters.issueTypes.join('", "');
        jql += ` AND issueType in ("${types}")`;
      }

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
        },
      });

      res.json(response.data);
    } catch (error: any) {
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
      res.status(500).json({ 
        error: error.response?.data?.errorMessages?.[0] || "Failed to fetch sprints" 
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
