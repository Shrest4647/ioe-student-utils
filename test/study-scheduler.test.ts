import { describe, expect, it } from "bun:test";
import { buildStudySchedule } from "@/server/utils/study-scheduler";
import {
  DEFAULT_STUDY_AVAILABILITY,
  type PlanningTopic,
} from "@/types/study-planner";

const topics: PlanningTopic[] = [
  {
    id: "topic-foundations",
    slug: "foundations",
    name: "Foundations",
    hours: 1,
    weightage: 10,
    priority: "core",
    prerequisites: [],
  },
  {
    id: "topic-trees",
    slug: "trees",
    name: "Trees",
    hours: 2,
    weightage: 20,
    priority: "core",
    prerequisites: [{ topicSlug: "foundations", dependencyType: "strong" }],
  },
];

describe("study scheduler", () => {
  it("orders strong prerequisites before dependent topics", () => {
    const preview = buildStudySchedule({
      subjectName: "Data Structures",
      topics: [...topics].reverse(),
      topicSlugs: ["trees"],
      goal: "exam-prep",
      startDate: "2026-07-13",
      examDate: "2026-07-20",
      availability: DEFAULT_STUDY_AVAILABILITY,
      preferredSessionMinutes: 45,
    });

    expect(preview.selectedTopicSlugs).toEqual(["foundations", "trees"]);
    expect(preview.warnings.some((warning) => warning.blocking)).toBe(false);
    expect(preview.days.flatMap((day) => day.tasks).length).toBeGreaterThan(0);
  });

  it("reduces already-known topics to practice and review work", () => {
    const base = {
      subjectName: "Data Structures",
      topics: [topics[0]],
      goal: "full-coverage" as const,
      startDate: "2026-07-13",
      examDate: "2026-07-20",
      availability: DEFAULT_STUDY_AVAILABILITY,
      preferredSessionMinutes: 45,
    };
    const unknown = buildStudySchedule(base);
    const known = buildStudySchedule({
      ...base,
      knownTopicSlugs: ["foundations"],
    });

    expect(known.scheduledMinutes).toBeLessThan(unknown.scheduledMinutes);
    expect(
      known.days
        .flatMap((day) => day.tasks)
        .some((task) => task.taskType === "learn"),
    ).toBe(false);
  });

  it("keeps optional topics out of the minimum goal", () => {
    const preview = buildStudySchedule({
      subjectName: "Data Structures",
      topics: [
        topics[0],
        {
          ...topics[1],
          slug: "optional-trees",
          priority: "optional",
          prerequisites: [],
        },
      ],
      goal: "minimum",
      startDate: "2026-07-13",
      examDate: "2026-07-20",
      availability: DEFAULT_STUDY_AVAILABILITY,
    });

    expect(preview.selectedTopicSlugs).toEqual(["foundations"]);
  });

  it("reports prerequisite cycles without losing topics", () => {
    const preview = buildStudySchedule({
      subjectName: "Cyclic syllabus",
      topics: [
        {
          ...topics[0],
          prerequisites: [{ topicSlug: "trees", dependencyType: "strong" }],
        },
        topics[1],
      ],
      goal: "full-coverage",
      startDate: "2026-07-13",
      examDate: "2026-07-20",
      availability: DEFAULT_STUDY_AVAILABILITY,
    });

    expect(preview.selectedTopicSlugs).toEqual(["foundations", "trees"]);
    expect(
      preview.warnings.some((warning) => warning.code === "prerequisite-cycle"),
    ).toBe(true);
  });

  it("does not schedule more minutes than a day can hold", () => {
    const preview = buildStudySchedule({
      subjectName: "Data Structures",
      topics,
      goal: "exam-prep",
      startDate: "2026-07-13",
      examDate: "2026-07-20",
      availability: DEFAULT_STUDY_AVAILABILITY,
      preferredSessionMinutes: 45,
    });

    for (const day of preview.days) {
      expect(day.scheduledMinutes).toBeLessThanOrEqual(day.capacityMinutes);
    }
  });

  it("reports work that cannot fit instead of overloading days", () => {
    const preview = buildStudySchedule({
      subjectName: "Data Structures",
      topics: [{ ...topics[1], hours: 20, prerequisites: [] }],
      goal: "full-coverage",
      startDate: "2026-07-13",
      examDate: "2026-07-15",
      availability: {
        monday: 30,
        tuesday: 30,
        wednesday: 30,
        thursday: 30,
        friday: 30,
        saturday: 30,
        sunday: 0,
      },
      preferredSessionMinutes: 30,
    });

    expect(preview.unscheduledMinutes).toBeGreaterThan(0);
    expect(
      preview.warnings.some(
        (warning) =>
          warning.code === "insufficient-capacity" && warning.blocking,
      ),
    ).toBe(true);
    for (const day of preview.days) {
      expect(day.scheduledMinutes).toBeLessThanOrEqual(day.capacityMinutes);
    }
  });

  it("creates stable task keys for the same input", () => {
    const input = {
      subjectName: "Data Structures",
      topics,
      goal: "minimum" as const,
      startDate: "2026-07-13",
      examDate: "2026-07-20",
      availability: DEFAULT_STUDY_AVAILABILITY,
      preferredSessionMinutes: 45,
    };
    const first = buildStudySchedule(input);
    const second = buildStudySchedule(input);

    expect(
      first.days.flatMap((day) => day.tasks.map((task) => task.key)),
    ).toEqual(second.days.flatMap((day) => day.tasks.map((task) => task.key)));
  });

  it("keeps the exam eve light", () => {
    const preview = buildStudySchedule({
      subjectName: "Data Structures",
      topics,
      goal: "exam-prep",
      startDate: "2026-07-13",
      examDate: "2026-07-20",
      availability: DEFAULT_STUDY_AVAILABILITY,
      preferredSessionMinutes: 45,
    });
    const examEve = preview.days.at(-1);

    expect(examEve?.capacityMinutes).toBeLessThanOrEqual(45);
  });
});
