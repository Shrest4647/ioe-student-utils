import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia, t } from "elysia";

const mockUser = {
  id: "test-user-123",
  name: "Test User",
  email: "test@example.com",
  image: null,
  role: "user",
};

const mockSession = {
  id: "session-123",
  userId: "test-user-123",
  token: "token-123",
};

// Mock data
let mockPlans: any[] = [];
let mockTasks: any[] = [];
const mockTemplates: any[] = [
  {
    id: "template-1",
    name: "3-Day Boost",
    durationDays: 3,
    difficultyLevel: "moderate",
    dailyStructure: {
      morning: [
        {
          type: "learn",
          template: "Study {TOPIC} from Chapter {CHAPTER}",
          estimated_minutes: 60,
        },
      ],
      afternoon: [
        {
          type: "practice",
          template: "Complete exercises for {TOPIC}",
          estimated_minutes: 60,
        },
      ],
      evening: [
        {
          type: "review",
          template: "Review today's {TOPIC} material",
          estimated_minutes: 20,
        },
      ],
    },
    intensityCurve: {
      days_1_2: "normal",
      day_3: "review_only",
    },
    subjectArea: "general",
  },
];

const createTestApp = () => {
  return new Elysia({ prefix: "/api" })
    .macro({
      auth: {
        async resolve() {
          return {
            user: mockUser,
            session: mockSession,
          };
        },
      },
    })
    .get(
      "/study-plans",
      async () => {
        return { plans: mockPlans };
      },
      { auth: true },
    )
    .get(
      "/study-plans/today",
      async () => {
        const _today = new Date();
        const todayTasks = mockTasks.filter((task) => !task.completed);
        return { tasks: todayTasks };
      },
      { auth: true },
    )
    .post(
      "/study-plans/create",
      async ({ body }) => {
        // Simulate plan generation
        const dailyTasks: any = {};
        const totalDays = 3; // Mock template duration
        const topicsPerDay = Math.ceil(body.topics.length / totalDays);

        for (let day = 1; day <= totalDays; day++) {
          const startIndex = (day - 1) * topicsPerDay;
          const dayTopics = body.topics.slice(
            startIndex,
            startIndex + topicsPerDay,
          );

          const tasks: any[] = [];

          // Mock template structure
          const template = mockTemplates[0];
          if (template?.dailyStructure) {
            // Generate morning tasks
            template.dailyStructure.morning?.forEach((taskPattern: any) => {
              const topic = dayTopics[0] || { name: "Review Topic" };
              tasks.push({
                id: `task-${Date.now()}-${Math.random()}`,
                title: taskPattern.template
                  .replace("{TOPIC}", topic.name)
                  .replace("{CHAPTER}", topic.chapter || ""),
                description: "",
                taskType: taskPattern.type,
                estimatedMinutes: taskPattern.estimated_minutes,
              });
            });

            // Generate afternoon tasks
            template.dailyStructure.afternoon?.forEach((taskPattern: any) => {
              const topic = dayTopics[0] || { name: "Review Topic" };
              tasks.push({
                id: `task-${Date.now()}-${Math.random()}`,
                title: taskPattern.template.replace("{TOPIC}", topic.name),
                description: "",
                taskType: taskPattern.type,
                estimatedMinutes: taskPattern.estimated_minutes,
              });
            });

            // Generate evening tasks
            template.dailyStructure.evening?.forEach((taskPattern: any) => {
              const topic = dayTopics[0] || { name: "Review Topic" };
              tasks.push({
                id: `task-${Date.now()}-${Math.random()}`,
                title: taskPattern.template.replace("{TOPIC}", topic.name),
                description: "",
                taskType: taskPattern.type,
                estimatedMinutes: taskPattern.estimated_minutes,
              });
            });
          }

          dailyTasks[day.toString()] = tasks;
        }

        const newPlan = {
          id: `plan-${Date.now()}`,
          userId: body.userId,
          templateId: body.templateId,
          subjectName: body.subjectName,
          examDate: body.examDate,
          startDate: body.startDate,
          endDate: body.endDate,
          dailyTasks,
          progressPercentage: "0",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPlans.push(newPlan);

        // Create tasks for the plan
        const tasks: any[] = [];
        Object.entries(dailyTasks).forEach(
          ([dayNumber, dayTasks]: [string, any]) => {
            dayTasks.forEach((taskData: any) => {
              const task = {
                id: taskData.id,
                studyPlanId: newPlan.id,
                dayNumber: parseInt(dayNumber, 10),
                title: taskData.title,
                description: taskData.description,
                taskType: taskData.taskType,
                estimatedMinutes: taskData.estimatedMinutes,
                completed: false,
                completedAt: null,
                actualMinutesSpent: null,
                notes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              tasks.push(task);
              mockTasks.push(task);
            });
          },
        );

        return { plan: newPlan, tasks };
      },
      {
        auth: true,
        body: t.Object({
          userId: t.String(),
          templateId: t.String(),
          subjectName: t.String(),
          topics: t.Array(
            t.Object({
              name: t.String(),
              chapter: t.Optional(t.String()),
            }),
          ),
          examDate: t.String(),
          startDate: t.String(),
          endDate: t.String(),
        }),
      },
    )
    .get(
      "/study-plans/:id",
      async ({ params }) => {
        const plan = mockPlans.find((p) => p.id === params.id);
        if (!plan) {
          return { error: "Plan not found" };
        }
        const planTasks = mockTasks.filter((t) => t.studyPlanId === plan.id);
        return { plan, tasks: planTasks };
      },
      { auth: true },
    )
    .patch(
      "/study-plans/:id",
      async ({ params, body }) => {
        const planIndex = mockPlans.findIndex((p) => p.id === params.id);
        if (planIndex === -1) {
          return { error: "Plan not found" };
        }
        mockPlans[planIndex] = { ...mockPlans[planIndex], ...body };
        return { plan: mockPlans[planIndex] };
      },
      {
        auth: true,
        body: t.Object({
          subjectName: t.Optional(t.String()),
          status: t.Optional(t.String()),
          progressPercentage: t.Optional(t.String()),
        }),
      },
    )
    .delete(
      "/study-plans/:id",
      async ({ params }) => {
        const planIndex = mockPlans.findIndex((p) => p.id === params.id);
        if (planIndex === -1) {
          return { success: false, error: "Plan not found" };
        }
        mockPlans[planIndex].status = "archived";
        return { success: true };
      },
      { auth: true },
    )
    .patch(
      "/study-tasks/:id/complete",
      async ({ params }) => {
        const taskIndex = mockTasks.findIndex((t) => t.id === params.id);
        if (taskIndex === -1) {
          return { error: "Task not found" };
        }

        mockTasks[taskIndex].completed = true;
        mockTasks[taskIndex].completedAt = new Date();

        // Update plan progress
        const plan = mockPlans.find(
          (p) => p.id === mockTasks[taskIndex].studyPlanId,
        );
        if (plan) {
          const planTasks = mockTasks.filter((t) => t.studyPlanId === plan.id);
          const completedCount = planTasks.filter((t) => t.completed).length;
          const progressPercentage = (completedCount / planTasks.length) * 100;
          plan.progressPercentage = progressPercentage.toString();
        }

        return { task: mockTasks[taskIndex] };
      },
      { auth: true },
    )
    .patch(
      "/study-tasks/:id/uncomplete",
      async ({ params }) => {
        const taskIndex = mockTasks.findIndex((t) => t.id === params.id);
        if (taskIndex === -1) {
          return { error: "Task not found" };
        }

        mockTasks[taskIndex].completed = false;
        mockTasks[taskIndex].completedAt = null;

        // Update plan progress
        const plan = mockPlans.find(
          (p) => p.id === mockTasks[taskIndex].studyPlanId,
        );
        if (plan) {
          const planTasks = mockTasks.filter((t) => t.studyPlanId === plan.id);
          const completedCount = planTasks.filter((t) => t.completed).length;
          const progressPercentage = (completedCount / planTasks.length) * 100;
          plan.progressPercentage = progressPercentage.toString();
        }

        return { task: mockTasks[taskIndex] };
      },
      { auth: true },
    )
    .post(
      "/study-tasks/:id/log-time",
      async ({ params, body }) => {
        const taskIndex = mockTasks.findIndex((t) => t.id === params.id);
        if (taskIndex === -1) {
          return { error: "Task not found" };
        }

        const currentMinutes = mockTasks[taskIndex].actualMinutesSpent || 0;
        mockTasks[taskIndex].actualMinutesSpent = currentMinutes + body.minutes;

        return { success: true, task: mockTasks[taskIndex] };
      },
      {
        auth: true,
        body: t.Object({
          minutes: t.Number(),
          notes: t.Optional(t.String()),
        }),
      },
    )
    .get(
      "/study-tasks/:id",
      async ({ params }) => {
        const task = mockTasks.find((t) => t.id === params.id);
        if (!task) {
          return { error: "Task not found" };
        }
        return { task };
      },
      { auth: true },
    );
};

describe("Study Plans API", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    // Reset mock data
    mockPlans = [];
    mockTasks = [];
    app = createTestApp();
  });

  describe("POST /api/study-plans/create", () => {
    it("should create a study plan successfully", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            templateId: "template-1",
            subjectName: "Data Structures",
            topics: [
              { name: "Binary Search Trees", chapter: "5" },
              { name: "AVL Trees", chapter: "6" },
            ],
            examDate: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        }),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.plan).toBeDefined();
      expect(body.plan.subjectName).toBe("Data Structures");
      expect(body.plan.status).toBe("active");
      expect(body.plan.progressPercentage).toBe("0");
      expect(body.tasks).toBeDefined();
      expect(Array.isArray(body.tasks)).toBe(true);
      expect(body.tasks.length).toBeGreaterThan(0);
    });

    it("should create tasks for each day with proper structure", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            templateId: "template-1",
            subjectName: "Algorithms",
            topics: [{ name: "Sorting Algorithms" }],
            examDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        }),
      );

      const body = await response.json();
      expect(body.tasks.length).toBeGreaterThan(0);

      const firstTask = body.tasks[0];
      expect(firstTask.id).toBeDefined();
      expect(firstTask.studyPlanId).toBe(body.plan.id);
      expect(firstTask.title).toBeDefined();
      expect(firstTask.taskType).toBeDefined();
      expect(firstTask.estimatedMinutes).toBeDefined();
      expect(firstTask.completed).toBe(false);
    });

    it("should reject creation with missing required fields", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            // Missing templateId, subjectName, topics, dates
          }),
        }),
      );

      // Should fail validation
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("GET /api/study-plans", () => {
    it("should return empty array when no plans exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/study-plans"),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.plans).toBeDefined();
      expect(Array.isArray(body.plans)).toBe(true);
      expect(body.plans.length).toBe(0);
    });

    it("should return all user plans", async () => {
      // Create a plan first
      await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            templateId: "template-1",
            subjectName: "Databases",
            topics: [{ name: "SQL Basics" }],
            examDate: new Date(
              Date.now() + 5 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 5 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        }),
      );

      const response = await app.handle(
        new Request("http://localhost/api/study-plans"),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.plans.length).toBe(1);
      expect(body.plans[0].subjectName).toBe("Databases");
    });
  });

  describe("GET /api/study-plans/today", () => {
    it("should return today's tasks", async () => {
      // Create a plan first
      const createResponse = await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            templateId: "template-1",
            subjectName: "Operating Systems",
            topics: [{ name: "Process Management" }],
            examDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        }),
      );

      const _createBody = await createResponse.json();

      const response = await app.handle(
        new Request("http://localhost/api/study-plans/today"),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.tasks).toBeDefined();
      expect(Array.isArray(body.tasks)).toBe(true);
    });

    it("should return empty array when no tasks exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/study-plans/today"),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.tasks).toEqual([]);
    });
  });

  describe("PATCH /api/study-tasks/:id/complete", () => {
    it("should mark a task as complete", async () => {
      // Create a plan first
      const createResponse = await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            templateId: "template-1",
            subjectName: "Computer Networks",
            topics: [{ name: "TCP/IP" }],
            examDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        }),
      );

      const createBody = await createResponse.json();
      const taskId = createBody.tasks[0].id;

      const response = await app.handle(
        new Request(`http://localhost/api/study-tasks/${taskId}/complete`, {
          method: "PATCH",
        }),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.task.completed).toBe(true);
      expect(body.task.completedAt).toBeDefined();
    });

    it("should update plan progress when task is completed", async () => {
      // Create a plan
      const createResponse = await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            templateId: "template-1",
            subjectName: "Software Engineering",
            topics: [{ name: "Design Patterns" }],
            examDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        }),
      );

      const createBody = await createResponse.json();
      const planId = createBody.plan.id;
      const taskId = createBody.tasks[0].id;

      // Complete first task
      await app.handle(
        new Request(`http://localhost/api/study-tasks/${taskId}/complete`, {
          method: "PATCH",
        }),
      );

      // Check plan progress
      const planResponse = await app.handle(
        new Request(`http://localhost/api/study-plans/${planId}`),
      );

      const planBody = await planResponse.json();
      const progress = parseFloat(planBody.plan.progressPercentage);
      expect(progress).toBeGreaterThan(0);
    });
  });

  describe("PATCH /api/study-tasks/:id/uncomplete", () => {
    it("should mark a completed task as incomplete", async () => {
      // Create a plan and complete a task
      const createResponse = await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            templateId: "template-1",
            subjectName: "Artificial Intelligence",
            topics: [{ name: "Machine Learning Basics" }],
            examDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        }),
      );

      const createBody = await createResponse.json();
      const taskId = createBody.tasks[0].id;

      // Complete the task
      await app.handle(
        new Request(`http://localhost/api/study-tasks/${taskId}/complete`, {
          method: "PATCH",
        }),
      );

      // Now uncomplete it
      const response = await app.handle(
        new Request(`http://localhost/api/study-tasks/${taskId}/uncomplete`, {
          method: "PATCH",
        }),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.task.completed).toBe(false);
      expect(body.task.completedAt).toBeNull();
    });
  });

  describe("POST /api/study-tasks/:id/log-time", () => {
    it("should log time for a task", async () => {
      // Create a plan first
      const createResponse = await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            templateId: "template-1",
            subjectName: "Compiler Design",
            topics: [{ name: "Lexical Analysis" }],
            examDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        }),
      );

      const createBody = await createResponse.json();
      const taskId = createBody.tasks[0].id;

      const response = await app.handle(
        new Request(`http://localhost/api/study-tasks/${taskId}/log-time`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            minutes: 45,
            notes: "Completed all exercises",
          }),
        }),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.task.actualMinutesSpent).toBe(45);
    });

    it("should accumulate time for multiple logs", async () => {
      // Create a plan first
      const createResponse = await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            templateId: "template-1",
            subjectName: "Distributed Systems",
            topics: [{ name: "CAP Theorem" }],
            examDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        }),
      );

      const createBody = await createResponse.json();
      const taskId = createBody.tasks[0].id;

      // Log time first time
      await app.handle(
        new Request(`http://localhost/api/study-tasks/${taskId}/log-time`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes: 30 }),
        }),
      );

      // Log time second time
      const response = await app.handle(
        new Request(`http://localhost/api/study-tasks/${taskId}/log-time`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes: 20 }),
        }),
      );

      const body = await response.json();
      expect(body.task.actualMinutesSpent).toBe(50); // 30 + 20
    });
  });

  describe("GET /api/study-plans/:id", () => {
    it("should fetch a specific plan with its tasks", async () => {
      // Create a plan first
      const createResponse = await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            templateId: "template-1",
            subjectName: "Computer Graphics",
            topics: [{ name: "Rendering Pipeline" }],
            examDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        }),
      );

      const createBody = await createResponse.json();
      const planId = createBody.plan.id;

      const response = await app.handle(
        new Request(`http://localhost/api/study-plans/${planId}`),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.plan).toBeDefined();
      expect(body.plan.id).toBe(planId);
      expect(body.plan.subjectName).toBe("Computer Graphics");
      expect(body.tasks).toBeDefined();
      expect(Array.isArray(body.tasks)).toBe(true);
    });

    it("should return 404 for non-existent plan", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/study-plans/non-existent-id"),
      );

      const body = await response.json();
      expect(body.error).toBe("Plan not found");
    });
  });

  describe("PATCH /api/study-plans/:id", () => {
    it("should update plan details", async () => {
      // Create a plan first
      const createResponse = await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            templateId: "template-1",
            subjectName: "Cryptography",
            topics: [{ name: "Encryption" }],
            examDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        }),
      );

      const createBody = await createResponse.json();
      const planId = createBody.plan.id;

      const response = await app.handle(
        new Request(`http://localhost/api/study-plans/${planId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectName: "Advanced Cryptography",
            status: "completed",
            progressPercentage: "100",
          }),
        }),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.plan.subjectName).toBe("Advanced Cryptography");
      expect(body.plan.status).toBe("completed");
      expect(body.plan.progressPercentage).toBe("100");
    });
  });

  describe("DELETE /api/study-plans/:id", () => {
    it("should archive a study plan", async () => {
      // Create a plan first
      const createResponse = await app.handle(
        new Request("http://localhost/api/study-plans/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            templateId: "template-1",
            subjectName: "Information Theory",
            topics: [{ name: "Entropy" }],
            examDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        }),
      );

      const createBody = await createResponse.json();
      const planId = createBody.plan.id;

      const response = await app.handle(
        new Request(`http://localhost/api/study-plans/${planId}`, {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);

      // Verify plan is archived
      const planResponse = await app.handle(
        new Request(`http://localhost/api/study-plans/${planId}`),
      );
      const planBody = await planResponse.json();
      expect(planBody.plan.status).toBe("archived");
    });
  });
});
