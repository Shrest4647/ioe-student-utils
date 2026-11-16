import { describe, expect, it } from "bun:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCourseExplorerResources } from "@/server/mcp/resources/course-explorer";
import { registerAcademicTools } from "@/server/mcp/tools/academic";
import { registerAgentFeedbackTools } from "@/server/mcp/tools/agent-feedback";
import { registerCollegeTools } from "@/server/mcp/tools/colleges";
import { registerCountryTools } from "@/server/mcp/tools/countries";
import { registerCourseExplorerTools } from "@/server/mcp/tools/course-explorer";
import { registerDataQualityTools } from "@/server/mcp/tools/data-quality";
import { registerDegreeTools } from "@/server/mcp/tools/degrees";
import { registerDepartmentTools } from "@/server/mcp/tools/departments";
import { registerFieldTools } from "@/server/mcp/tools/fields-of-study";
import { registerFlashcardTools } from "@/server/mcp/tools/flashcards";
import { registerQuizTools } from "@/server/mcp/tools/quizzes";
import { registerRatingTools } from "@/server/mcp/tools/ratings";
import { registerResourceTools } from "@/server/mcp/tools/resources";
import { registerRoundEventTools } from "@/server/mcp/tools/rounds-events";
import { registerScholarshipTools } from "@/server/mcp/tools/scholarships";
import { registerTaxonomyTools } from "@/server/mcp/tools/taxonomy";
import { registerUniversityTools } from "@/server/mcp/tools/universities";

describe("MCP server registration", () => {
  it("registers every tool and resource without throwing", () => {
    const server = new McpServer({
      name: "IOESU MCP registration test",
      version: "1.0.0",
    });

    expect(() => {
      registerAgentFeedbackTools(server);
      registerScholarshipTools(server);
      registerRoundEventTools(server);
      registerCountryTools(server);
      registerDegreeTools(server);
      registerFieldTools(server);
      registerDepartmentTools(server);
      registerTaxonomyTools(server);
      registerUniversityTools(server);
      registerCollegeTools(server);
      registerAcademicTools(server);
      registerCourseExplorerTools(server);
      registerCourseExplorerResources(server);
      registerResourceTools(server);
      registerRatingTools(server);
      registerDataQualityTools(server);
      registerQuizTools(server);
      registerFlashcardTools(server);
    }).not.toThrow();
  });
});
