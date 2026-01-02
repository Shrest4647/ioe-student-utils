import {
  BookOpen,
  Briefcase,
  Calculator,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Library,
  Link,
  PenTool,
  Search,
  Target,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "University Finder",
    description:
      "Find universities accepting TU credits and their requirements.",
  },
  {
    icon: Calculator,
    title: "GPA Calculator",
    description:
      "Convert TU percentage to US 4.0 GPA using WES/Scholaro logic.",
  },
  {
    icon: GraduationCap,
    title: "Scholarship Database",
    description: "Explore global scholarships for international students.",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description:
      "Create professional resumes tailored for international applications.",
  },
  {
    icon: PenTool,
    title: "Letter of Recommendation",
    description:
      "Generate professional letters of recommendation for international applications.",
  },
  {
    icon: Link,
    title: "Course Equivalency",
    description:
      "Find equivalent courses for TU subjects in international universities.",
  },
  {
    icon: Users,
    title: "Alumni Network",
    description:
      "Connect with alumni for insights and advice on international education.",
  },
  {
    icon: Briefcase,
    title: "Career Guidance",
    description:
      "Resources and advice on career paths, job markets, and industry trends.",
  },
  {
    icon: Target,
    title: "Subject Selector",
    description:
      "Select subjects for 7th and 8th semesters based on interests and goals.",
  },
  {
    icon: Clock,
    title: "Credit Calculator",
    description: "Convert TU hours (L-T-P) to standard international credits.",
  },
  {
    icon: BookOpen,
    title: "Syllabus Explorer",
    description: "Detailed breakdown of BCT subjects and marks distribution.",
  },
  {
    icon: Calendar,
    title: "Study Planner",
    description:
      "Plan and track study/application schedules, including exam dates and goals.",
  },
  {
    icon: Library,
    title: "Resources Library",
    description:
      "Collection of study materials, past papers, and other resources.",
  },
];

export function Features() {
  return (
    <section className="px-4 py-16" id="features">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center font-bold text-3xl">Features</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {features
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((feature) => (
              <Card className="text-center" key={feature.title}>
                <CardHeader>
                  <div className="mx-auto mb-4">
                    <feature.icon
                      aria-hidden="true"
                      className="h-12 w-12 text-primary"
                    />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </section>
  );
}
