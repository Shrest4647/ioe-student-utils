"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const wesData = [
  { range: "80-100", gpa: 4.0, color: "#22c55e" },
  { range: "75-79", gpa: 3.7, color: "#84cc16" },
  { range: "70-74", gpa: 3.3, color: "#eab308" },
  { range: "65-69", gpa: 3.0, color: "#f97316" },
  { range: "60-64", gpa: 2.7, color: "#f97316" },
  { range: "55-59", gpa: 2.3, color: "#ef4444" },
  { range: "50-54", gpa: 2.0, color: "#ef4444" },
  { range: "0-49", gpa: 0.0, color: "#dc2626" },
];

const comparisonData = [
  { standard: "WES", top: 4.0, good: 3.0, average: 2.0 },
  { standard: "Scholaro", top: 4.0, good: 3.0, average: 2.0 },
  { standard: "UK (4.0)", top: 4.0, good: 3.5, average: 2.5 },
  { standard: "Canada", top: 4.0, good: 3.5, average: 2.7 },
  { standard: "Australia", top: 4.0, good: 3.0, average: 2.0 },
];

const countryData = [
  { name: "United States", percentage: 45, color: "#3b82f6" },
  { name: "United Kingdom", percentage: 25, color: "#8b5cf6" },
  { name: "Canada", percentage: 15, color: "#10b981" },
  { name: "Australia", percentage: 10, color: "#f59e0b" },
  { name: "Europe", percentage: 5, color: "#ef4444" },
];

const conversionSteps = [
  {
    step: 1,
    title: "Gather Your Scores",
    description:
      "Collect your percentage marks for all courses from your TU transcript",
    icon: "📋",
  },
  {
    step: 2,
    title: "Select Conversion Standard",
    description:
      "Choose WES, Scholaro, or your target university's specific conversion method",
    icon: "🎯",
  },
  {
    step: 3,
    title: "Apply Credit Weighting",
    description:
      "Multiply each course GPA by its credit hours, then sum and divide by total credits",
    icon: "⚖️",
  },
  {
    step: 4,
    title: "Calculate Cumulative GPA",
    description:
      "Add all quality points and divide by total credits to get your final GPA",
    icon: "📊",
  },
];

const gradeDistributionData = [
  { grade: "A (90-100)", students: 15, color: "#22c55e" },
  { grade: "B+ (85-89)", students: 25, color: "#84cc16" },
  { grade: "B (80-84)", students: 30, color: "#eab308" },
  { grade: "B- (75-79)", students: 20, color: "#f97316" },
  { grade: "C+ (70-74)", students: 8, color: "#f97316" },
  { grade: "C (65-69)", students: 2, color: "#ef4444" },
];

export function GPAConverterGuide() {
  return (
    <article className="space-y-6">
      <Accordion type="single" collapsible defaultValue="">
        <AccordionItem value="intro">
          <AccordionTrigger className="font-semibold text-lg">
            📖 Understanding TU to International GPA Conversion
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <p className="text-muted-foreground">
              Tribhuvan University (TU) uses a percentage-based grading system
              that differs from international GPA scales. This guide helps you
              convert your TU marks to recognized international standards for
              university applications worldwide.
            </p>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Why Convert Your GPA?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="font-medium text-sm">
                      Most Common Destinations
                    </p>
                    <div className="space-y-2">
                      {countryData.map((country) => (
                        <div
                          key={country.name}
                          className="flex items-center gap-2"
                        >
                          <Progress
                            value={country.percentage}
                            className="h-2"
                          />
                          <span className="w-32 text-muted-foreground text-xs">
                            {country.name}
                          </span>
                          <Badge variant="secondary">
                            {country.percentage}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={countryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="percentage"
                        >
                          {countryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tu-system">
          <AccordionTrigger className="font-semibold text-lg">
            🎓 TU Grading System Explained
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    New System (2080 Batch Onwards)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { grade: "A+", range: "90-100%", gpa: "4.0" },
                    { grade: "A", range: "80-89%", gpa: "3.6" },
                    { grade: "B+", range: "70-79%", gpa: "3.2" },
                    { grade: "B", range: "60-69%", gpa: "2.8" },
                    { grade: "B-", range: "50-59%", gpa: "2.7" },
                    { grade: "F", range: "Below 50%", gpa: "0.0" },
                  ].map((item) => (
                    <div
                      key={item.grade}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.grade}</Badge>
                        <span className="text-muted-foreground text-sm">
                          {item.range}
                        </span>
                      </div>
                      <span className="font-medium font-mono">{item.gpa}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Legacy System (Before 2080)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { division: "Distinction", range: "80% and above" },
                    { division: "First Division", range: "65-79%" },
                    { division: "Second Division", range: "50-64%" },
                    { division: "Pass Division", range: "40-49%" },
                  ].map((item) => (
                    <div
                      key={item.division}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-2"
                    >
                      <span className="font-medium text-sm">
                        {item.division}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {item.range}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm">
                  <strong>IOE-Specific:</strong> Internal assessment counts for
                  40 marks, final examination for 60 marks. Pass mark is
                  typically 40-50% depending on the course level.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="conversion-standards">
          <AccordionTrigger className="font-semibold text-lg">
            🌐 International Conversion Standards
          </AccordionTrigger>
          <AccordionContent className="space-y-6">
            <p className="text-muted-foreground">
              Different credential evaluation services use different conversion
              scales. Choose the one that matches your target university's
              requirements.
            </p>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="standard" />
                  <YAxis domain={[0, 4.5]} />
                  <Tooltip />
                  <Bar dataKey="top" name="Excellent (A)" fill="#22c55e" />
                  <Bar dataKey="good" name="Good (B)" fill="#eab308" />
                  <Bar dataKey="average" name="Average (C)" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge>WES</Badge>
                    World Education Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground text-xs">
                    Most widely used credential evaluation service for US
                    university applications.
                  </p>
                  <div className="space-y-1">
                    {wesData.slice(0, 4).map((item) => (
                      <div
                        key={item.range}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="flex-1">{item.range}%</span>
                        <span className="font-mono">{item.gpa}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge>UK</Badge>
                    United Kingdom
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground text-xs">
                    UK uses classification system: First-Class, 2:1, 2:2,
                    Third-Class.
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary">First</Badge>
                      <span className="flex-1">70-100%</span>
                      <span className="font-mono">4.0</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-secondary">2:1</Badge>
                      <span className="flex-1">60-69%</span>
                      <span className="font-mono">3.3-3.7</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">2:2</Badge>
                      <span className="flex-1">50-59%</span>
                      <span className="font-mono">2.7-3.2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Third</Badge>
                      <span className="flex-1">40-49%</span>
                      <span className="font-mono">2.0-2.6</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge>Australia</Badge>
                    7.0 Scale
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground text-xs">
                    Australia uses a 7.0 GPA scale. Convert to 4.0 by
                    multiplying by 4/7.
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600">HD</Badge>
                      <span className="flex-1">85-100%</span>
                      <span className="font-mono">7.0</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">D</Badge>
                      <span className="flex-1">75-84%</span>
                      <span className="font-mono">6.0</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500">C</Badge>
                      <span className="flex-1">65-74%</span>
                      <span className="font-mono">5.0</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500">P</Badge>
                      <span className="flex-1">50-64%</span>
                      <span className="font-mono">4.0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge>Germany</Badge>
                    1.0-5.0 Scale
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground text-xs">
                    German grades are inverse - lower is better. Uses Modified
                    Bavarian Formula.
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600">1.0-1.5</Badge>
                      <span className="flex-1">90-100%</span>
                      <span className="font-mono">Sehr Gut</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">1.6-2.5</Badge>
                      <span className="flex-1">80-89%</span>
                      <span className="font-mono">Gut</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500">2.6-3.5</Badge>
                      <span className="flex-1">70-79%</span>
                      <span className="font-mono">Befriedigend</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500">3.6-4.9</Badge>
                      <span className="flex-1">50-69%</span>
                      <span className="font-mono">Ausreichend</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge>ECTS</Badge>
                    European System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground text-xs">
                    ECTS uses relative grading based on percentile distribution.
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary">A</Badge>
                      <span className="flex-1">Best 10%</span>
                      <span className="text-muted-foreground">Outstanding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-secondary">B</Badge>
                      <span className="flex-1">Next 25%</span>
                      <span className="text-muted-foreground">Above Avg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">C</Badge>
                      <span className="flex-1">Next 30%</span>
                      <span className="text-muted-foreground">Sound</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">D</Badge>
                      <span className="flex-1">Next 25%</span>
                      <span className="text-muted-foreground">
                        Satisfactory
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge>Canada</Badge>
                    Percentage Scale
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground text-xs">
                    Canada uses percentage-based grading similar to the US
                    system.
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary">A+</Badge>
                      <span className="flex-1">90-100%</span>
                      <span className="font-mono">4.0</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-secondary">A</Badge>
                      <span className="flex-1">85-89%</span>
                      <span className="font-mono">4.0</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">A-</Badge>
                      <span className="flex-1">80-84%</span>
                      <span className="font-mono">3.7</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">B+</Badge>
                      <span className="flex-1">75-79%</span>
                      <span className="font-mono">3.3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="how-to-calculate">
          <AccordionTrigger className="font-semibold text-lg">
            🧮 Step-by-Step Calculation Guide
          </AccordionTrigger>
          <AccordionContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {conversionSteps.map((step) => (
                <Card key={step.step} className="relative">
                  <CardHeader>
                    <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                      {step.step}
                    </div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span>{step.icon}</span>
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Example Calculation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">Course</th>
                        <th className="p-2 text-center">Percentage</th>
                        <th className="p-2 text-center">Credits</th>
                        <th className="p-2 text-center">GPA</th>
                        <th className="p-2 text-right">Quality Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          name: "Mathematics",
                          percent: "92",
                          credits: 4,
                          gpa: 4.0,
                        },
                        {
                          name: "Physics",
                          percent: "78",
                          credits: 3,
                          gpa: 3.3,
                        },
                        {
                          name: "Computer Science",
                          percent: "85",
                          credits: 4,
                          gpa: 3.7,
                        },
                        {
                          name: "English",
                          percent: "72",
                          credits: 2,
                          gpa: 3.0,
                        },
                      ].map((course) => (
                        <tr key={course.name} className="border-b">
                          <td className="p-2">{course.name}</td>
                          <td className="p-2 text-center">{course.percent}%</td>
                          <td className="p-2 text-center">{course.credits}</td>
                          <td className="p-2 text-center">
                            <Badge variant="outline">{course.gpa}</Badge>
                          </td>
                          <td className="p-2 text-right font-mono">
                            {(course.gpa * course.credits).toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-semibold">
                        <td className="p-2">Total</td>
                        <td className="p-2"></td>
                        <td className="p-2 text-center">13</td>
                        <td className="p-2"></td>
                        <td className="p-2 text-right font-mono">46.6</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <p className="font-mono text-lg">
                    Cumulative GPA = Total Quality Points ÷ Total Credits = 46.6
                    ÷ 13 = <strong>3.58</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="visualization">
          <AccordionTrigger className="font-semibold text-lg">
            📊 GPA Visualization & Comparison
          </AccordionTrigger>
          <AccordionContent className="space-y-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { percentage: 100, wes: 4.0, scholaro: 4.0, uk: 4.0 },
                    { percentage: 95, wes: 4.0, scholaro: 4.0, uk: 4.0 },
                    { percentage: 90, wes: 4.0, scholaro: 4.0, uk: 4.0 },
                    { percentage: 85, wes: 3.7, scholaro: 3.7, uk: 3.7 },
                    { percentage: 80, wes: 3.3, scholaro: 3.3, uk: 3.5 },
                    { percentage: 75, wes: 3.3, scholaro: 3.0, uk: 3.0 },
                    { percentage: 70, wes: 3.3, scholaro: 2.7, uk: 2.7 },
                    { percentage: 65, wes: 3.0, scholaro: 2.3, uk: 2.5 },
                    { percentage: 60, wes: 2.7, scholaro: 2.0, uk: 2.3 },
                    { percentage: 55, wes: 2.3, scholaro: 0.0, uk: 2.0 },
                    { percentage: 50, wes: 2.0, scholaro: 0.0, uk: 1.7 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="percentage"
                    label={{ value: "TU Percentage", position: "bottom" }}
                  />
                  <YAxis
                    domain={[0, 4.5]}
                    label={{ value: "GPA", angle: -90, position: "left" }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="wes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="WES"
                  />
                  <Line
                    type="monotone"
                    dataKey="scholaro"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Scholaro"
                  />
                  <Line
                    type="monotone"
                    dataKey="uk"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="UK"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Typical Grade Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeDistributionData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="grade" type="category" width={80} />
                        <Tooltip />
                        <Bar
                          dataKey="students"
                          fill="#3b82f6"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Quick Reference Chart
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { range: "90-100%", gpa: "4.0", level: "Excellent" },
                    { range: "80-89%", gpa: "3.3-4.0", level: "Very Good" },
                    { range: "70-79%", gpa: "2.7-3.3", level: "Good" },
                    { range: "60-69%", gpa: "2.0-2.7", level: "Average" },
                    { range: "50-59%", gpa: "1.7-2.0", level: "Below Average" },
                    { range: "Below 50%", gpa: "0.0-1.7", level: "Poor/Fail" },
                  ].map((item) => (
                    <div key={item.range} className="flex items-center gap-3">
                      <div className="w-24 font-medium text-sm">
                        {item.range}
                      </div>
                      <div className="flex-1">
                        <Progress value={50} className="h-2" />
                      </div>
                      <div className="w-16 text-right">
                        <Badge variant="outline">{item.gpa}</Badge>
                      </div>
                      <div className="w-24 text-right text-muted-foreground text-xs">
                        {item.level}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tools-resources">
          <AccordionTrigger className="font-semibold text-lg">
            🛠️ Tools & Resources
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Free Online Calculators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { name: "WES iGPA Calculator", url: "wes.org" },
                    { name: "Scholaro GPA Calculator", url: "scholaro.com" },
                    {
                      name: "GPA Calculator by Country",
                      url: "gpacalculator.net",
                    },
                    {
                      name: "Raj 8 TU Calculator",
                      url: "raj8.com.np/tu-gpa-calculator",
                    },
                  ].map((tool) => (
                    <div
                      key={tool.name}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-2"
                    >
                      <span className="text-sm">{tool.name}</span>
                      <Badge variant="outline">{tool.url}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Paid Evaluation Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    {
                      name: "WES",
                      cost: "$225 USD",
                      description: "Course-by-course evaluation",
                    },
                    {
                      name: "Scholaro Premium",
                      cost: "Varies",
                      description: "Institutional reports",
                    },
                    {
                      name: "ACEI",
                      cost: "$160-225 USD",
                      description: "Alternative evaluation",
                    },
                    {
                      name: "SpanTran",
                      cost: "Varies",
                      description: "Custom evaluation packages",
                    },
                  ].map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-2"
                    >
                      <div>
                        <span className="font-medium text-sm">
                          {service.name}
                        </span>
                        <p className="text-muted-foreground text-xs">
                          {service.description}
                        </p>
                      </div>
                      <Badge>{service.cost}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Nepal-Specific Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  {
                    name: "EducationUSA Nepal",
                    purpose: "Transcript attestation for US applications",
                  },
                  {
                    name: "Tribhuvan University",
                    purpose: "Official transcript requests",
                  },
                  { name: "IOE", purpose: "Department verification" },
                ].map((resource) => (
                  <div
                    key={resource.name}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-2"
                  >
                    <span className="font-medium text-sm">{resource.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {resource.purpose}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="important-notes">
          <AccordionTrigger className="font-semibold text-lg">
            ⚠️ Important Notes & Disclaimers
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
              <h4 className="mb-2 font-semibold text-yellow-700 dark:text-yellow-400">
                Key Considerations
              </h4>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>
                  Many top US universities accept TU transcripts directly
                  without WES evaluation
                </li>
                <li>
                  Different universities may use different conversion methods
                </li>
                <li>
                  This calculator provides estimates only - official evaluation
                  required for applications
                </li>
                <li>
                  Check your target university's specific requirements before
                  paying for evaluation
                </li>
                <li>
                  EducationUSA Nepal attestation adds credibility to your
                  transcripts
                </li>
              </ul>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-red-500/50">
                <CardHeader>
                  <CardTitle className="text-base text-red-600">
                    Common Mistakes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive">1</Badge>
                    <p>Assuming linear conversion (percentage ÷ 25)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive">2</Badge>
                    <p>Not checking if WES is actually required</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive">3</Badge>
                    <p>Using outdated conversion scales</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive">4</Badge>
                    <p>Ignoring credit hour weighting</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-500/50">
                <CardHeader>
                  <CardTitle className="text-base text-green-600">
                    Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-600">1</Badge>
                    <p>Verify target university requirements first</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-600">2</Badge>
                    <p>Use multiple conversion methods for comparison</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-600">3</Badge>
                    <p>Keep original percentage marks on transcripts</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-600">4</Badge>
                    <p>
                      Get EducationUSA Nepal attestation for US applications
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                <strong>Disclaimer:</strong> This guide and GPA converter tool
                are for informational purposes only. We do not guarantee
                accuracy of conversions. Always consult with your target
                university's admissions office and consider official credential
                evaluation services like WES for accurate translations of your
                academic records.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </article>
  );
}
