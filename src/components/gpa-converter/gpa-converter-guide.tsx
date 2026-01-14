"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function GPAConverterGuide() {
  return (
    <article className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="font-bold text-2xl tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground">
          Everything you need to know about converting your TU percentages to
          international GPA standards
        </p>
      </div>
      <Accordion type="single" collapsible defaultValue="how-to-calculate">
        <AccordionItem value="how-to-calculate">
          <AccordionTrigger className="font-semibold text-base">
            Comprehensive GPA Conversion Guide
          </AccordionTrigger>
          <AccordionContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card key="step1" className="relative">
                <CardHeader>
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                    1
                  </div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Identify Your TU System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Determine if you're using the legacy system (before 2080) or
                    new system (2080 onwards)
                  </p>
                </CardContent>
              </Card>

              <Card key="step2" className="relative">
                <CardHeader>
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                    2
                  </div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Gather Transcript Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Collect percentage marks and credit hours for all courses
                    from your official TU transcript
                  </p>
                </CardContent>
              </Card>

              <Card key="step3" className="relative">
                <CardHeader>
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                    3
                  </div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Choose Target Standard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Select the grading system required by your target university
                  </p>
                </CardContent>
              </Card>

              <Card key="step4" className="relative">
                <CardHeader>
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                    4
                  </div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Apply Conversion Formula
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Use the appropriate conversion table or formula for your
                    target standard
                  </p>
                </CardContent>
              </Card>

              <Card key="step5" className="relative">
                <CardHeader>
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                    5
                  </div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Calculate Weighted GPA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Multiply each course GPA by credit hours, sum, and divide by
                    total credits
                  </p>
                </CardContent>
              </Card>

              <Card key="step6" className="relative">
                <CardHeader>
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                    6
                  </div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Verify & Document
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Keep original transcripts, document conversion method, and
                    check requirements
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Standards & Formulas</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Based on extensive research from WES, Scholaro, and
                  international credential evaluation services
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* US 4.0 GPA */}
                <div className="border-blue-500 border-l-4 pl-4">
                  <h4 className="mb-2 font-semibold">
                    US 4.0 GPA Scale (Most Common)
                  </h4>
                  <p className="mb-3 text-muted-foreground text-sm">
                    Used by most US universities for admissions. Based on
                    WES/Scholaro standards.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-left">TU %</th>
                          <th className="p-2 text-center">US GPA</th>
                          <th className="p-2 text-center">US Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">90-100%</td>
                          <td className="p-2 text-center">4.0</td>
                          <td className="p-2 text-center">A+</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">80-89.99%</td>
                          <td className="p-2 text-center">3.6-3.9</td>
                          <td className="p-2 text-center">A</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">75-79.99%</td>
                          <td className="p-2 text-center">3.3</td>
                          <td className="p-2 text-center">B+</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">70-74.99%</td>
                          <td className="p-2 text-center">3.0</td>
                          <td className="p-2 text-center">B</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">65-69.99%</td>
                          <td className="p-2 text-center">2.7</td>
                          <td className="p-2 text-center">B-</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">50-64.99%</td>
                          <td className="p-2 text-center">1.0-2.0</td>
                          <td className="p-2 text-center">C-D</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* European ECTS */}
                <div className="border-green-500 border-l-4 pl-4">
                  <h4 className="mb-2 font-semibold">European ECTS System</h4>
                  <p className="mb-3 text-muted-foreground text-sm">
                    European Credit Transfer System for EU universities. Based
                    on percentile distribution, not fixed percentages.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-left">TU %</th>
                          <th className="p-2 text-center">ECTS</th>
                          <th className="p-2 text-center">Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">85-100%</td>
                          <td className="p-2 text-center">A</td>
                          <td className="p-2 text-center">
                            Outstanding (Top 10%)
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">70-84%</td>
                          <td className="p-2 text-center">B</td>
                          <td className="p-2 text-center">
                            Above Average (Next 25%)
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">55-69%</td>
                          <td className="p-2 text-center">C</td>
                          <td className="p-2 text-center">Sound (Next 30%)</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">45-54%</td>
                          <td className="p-2 text-center">D</td>
                          <td className="p-2 text-center">
                            Satisfactory (Next 25%)
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Below 45%</td>
                          <td className="p-2 text-center">E/F</td>
                          <td className="p-2 text-center">Pass/Fail</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* India 10.0 CGPA */}
                <div className="border-orange-500 border-l-4 pl-4">
                  <h4 className="mb-2 font-semibold">India 10.0 CGPA Scale</h4>
                  <p className="mb-3 text-muted-foreground text-sm">
                    Common for Indian university applications. Formula: GPA
                    (4.0) = (CGPA ÷ 10) × 4
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-left">TU %</th>
                          <th className="p-2 text-center">CGPA</th>
                          <th className="p-2 text-center">Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">90-100%</td>
                          <td className="p-2 text-center">9.5-10.0</td>
                          <td className="p-2 text-center">Excellent</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">80-89%</td>
                          <td className="p-2 text-center">8.5-8.9</td>
                          <td className="p-2 text-center">Very Good</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">75-80%</td>
                          <td className="p-2 text-center">8.0-8.4</td>
                          <td className="p-2 text-center">Good</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">70-75%</td>
                          <td className="p-2 text-center">7.5-7.9</td>
                          <td className="p-2 text-center">Above Average</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">60-69%</td>
                          <td className="p-2 text-center">6.0-7.4</td>
                          <td className="p-2 text-center">Average</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Australia 7.0 Scale */}
                <div className="border-purple-500 border-l-4 pl-4">
                  <h4 className="mb-2 font-semibold">
                    Australia 7.0 GPA Scale
                  </h4>
                  <p className="mb-3 text-muted-foreground text-sm">
                    Used by Australian universities. Formula: GPA (4.0) = (GPA
                    (7.0) ÷ 7) × 4
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-left">TU %</th>
                          <th className="p-2 text-center">GPA (7.0)</th>
                          <th className="p-2 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">85-100%</td>
                          <td className="p-2 text-center">7.0</td>
                          <td className="p-2 text-center">
                            HD (High Distinction)
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">75-84%</td>
                          <td className="p-2 text-center">6.0</td>
                          <td className="p-2 text-center">D (Distinction)</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">65-74%</td>
                          <td className="p-2 text-center">5.0</td>
                          <td className="p-2 text-center">C (Credit)</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">50-64%</td>
                          <td className="p-2 text-center">4.0</td>
                          <td className="p-2 text-center">P (Pass)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* German System */}
                <div className="border-red-500 border-l-4 pl-4">
                  <h4 className="mb-2 font-semibold">
                    Germany 1.0-5.0 Scale (Inverse)
                  </h4>
                  <p className="mb-3 text-muted-foreground text-sm">
                    German grading where lower is better. Formula: German GPA =
                    1 + (3 × (100 - TU%) / 60)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-left">TU %</th>
                          <th className="p-2 text-center">German GPA</th>
                          <th className="p-2 text-center">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">90-100%</td>
                          <td className="p-2 text-center">1.0-1.5</td>
                          <td className="p-2 text-center">Sehr Gut</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">80-89%</td>
                          <td className="p-2 text-center">1.6-2.5</td>
                          <td className="p-2 text-center">Gut</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">70-79%</td>
                          <td className="p-2 text-center">2.6-3.5</td>
                          <td className="p-2 text-center">Befriedigend</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">50-69%</td>
                          <td className="p-2 text-center">3.6-4.9</td>
                          <td className="p-2 text-center">Ausreichend</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real IOE Examples */}
            <Card className="bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle>Real IOE Student Examples</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Practical examples using typical IOE percentages
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h5 className="mb-2 font-semibold">
                      Example 1: High Performer (78% TU)
                    </h5>
                    <div className="space-y-1 font-mono text-sm">
                      <div>
                        US 4.0 GPA: <strong>3.3</strong>
                      </div>
                      <div>
                        ECTS: <strong>B</strong> (Above Average)
                      </div>
                      <div>
                        India CGPA: <strong>8.2</strong>
                      </div>
                      <div>
                        Australia: <strong>6.0</strong> (Distinction)
                      </div>
                      <div>
                        German GPA: <strong>2.1</strong> (Gut)
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="mb-2 font-semibold">
                      Example 2: Average Student (65% TU)
                    </h5>
                    <div className="space-y-1 font-mono text-sm">
                      <div>
                        US 4.0 GPA: <strong>2.7</strong>
                      </div>
                      <div>
                        ECTS: <strong>C</strong> (Sound)
                      </div>
                      <div>
                        India CGPA: <strong>7.0</strong>
                      </div>
                      <div>
                        Australia: <strong>5.0</strong> (Credit)
                      </div>
                      <div>
                        German GPA: <strong>2.75</strong> (Befriedigend)
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weighted Calculation Example */}
            <Card>
              <CardHeader>
                <CardTitle>Weighted GPA Calculation Example</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">Course</th>
                        <th className="p-2 text-center">TU %</th>
                        <th className="p-2 text-center">Credits</th>
                        <th className="p-2 text-center">US GPA</th>
                        <th className="p-2 text-right">Quality Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">Engineering Mathematics</td>
                        <td className="p-2 text-center">82%</td>
                        <td className="p-2 text-center">4</td>
                        <td className="p-2 text-center">3.7</td>
                        <td className="p-2 text-right font-mono">14.8</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Engineering Physics</td>
                        <td className="p-2 text-center">76%</td>
                        <td className="p-2 text-center">3</td>
                        <td className="p-2 text-center">3.3</td>
                        <td className="p-2 text-right font-mono">9.9</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Computer Programming</td>
                        <td className="p-2 text-center">89%</td>
                        <td className="p-2 text-center">3</td>
                        <td className="p-2 text-center">3.9</td>
                        <td className="p-2 text-right font-mono">11.7</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Engineering Drawing</td>
                        <td className="p-2 text-center">71%</td>
                        <td className="p-2 text-center">2</td>
                        <td className="p-2 text-center">3.0</td>
                        <td className="p-2 text-right font-mono">6.0</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted font-semibold">
                        <td className="p-2">Total</td>
                        <td className="p-2"></td>
                        <td className="p-2 text-center">12</td>
                        <td className="p-2"></td>
                        <td className="p-2 text-right font-mono">42.4</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <p className="font-mono text-lg">
                    Weighted GPA = Total Quality Points ÷ Total Credits = 42.4 ÷
                    12 = <strong>3.53</strong>
                  </p>
                </div>

                <div className="grid gap-2 text-muted-foreground text-sm">
                  <div>
                    <strong>Conversion Results:</strong>
                  </div>
                  <div>
                    • US 4.0 GPA: <strong>3.53</strong> (Above Average)
                  </div>
                  <div>
                    • India CGPA: <strong>8.8</strong> (Very Good)
                  </div>
                  <div>
                    • Australia: <strong>6.2</strong> (Distinction)
                  </div>
                  <div>
                    • ECTS: <strong>B</strong> (Above Average)
                  </div>
                  <div>
                    • German: <strong>2.0</strong> (Gut)
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tu-system">
          <AccordionTrigger className="font-semibold text-base">
            TU Grading System Explained
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Understanding the Grading Transition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  TU's grading system has evolved significantly over the years.
                  Here's how the different systems relate to each other:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-600">80%+</Badge>
                    <span className="flex-1">
                      Old: Distinction → New: A+ (4.0)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-600">65-79%</Badge>
                    <span className="flex-1">
                      Old: First Division → New: A/B+ (3.2-3.6)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-600">50-64%</Badge>
                    <span className="flex-1">
                      Old: Second Division → New: B/B- (2.7-2.8)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-600">Below 50%</Badge>
                    <span className="flex-1">
                      Old: Pass/Fail → New: F (0.0)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="conversion-standards">
          <AccordionTrigger className="font-semibold text-base">
            International Grading Systems
          </AccordionTrigger>
          <AccordionContent className="space-y-6">
            <p className="text-muted-foreground">
              Different countries and universities use different grading
              systems. Understanding these relationships is crucial for accurate
              GPA conversion.
            </p>

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
                    {wesData.map((item) => (
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

        <AccordionItem value="tools-resources">
          <AccordionTrigger className="font-semibold text-base">
            Useful Tools & Resources
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
                    {
                      name: "WES iGPA Calculator",
                      url: "wes.org",
                      description: "Free preview estimates",
                    },
                    {
                      name: "Scholaro GPA Calculator",
                      url: "scholaro.com",
                      description: "Supports TU specifically",
                    },
                    {
                      name: "GPA Calculator by Country",
                      url: "gpacalculator.net",
                      description: "50+ countries covered",
                    },
                    {
                      name: "Raj 8 TU Calculator",
                      url: "raj8.com.np/tu-gpa-calculator",
                      description: "Nepal-specific tool",
                    },
                  ].map((tool) => (
                    <div
                      key={tool.name}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{tool.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {tool.description}
                        </div>
                      </div>
                      <a
                        href={`https://${tool.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm underline hover:text-blue-800"
                      >
                        {tool.url}
                      </a>
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
                      url: "wes.org",
                    },
                    {
                      name: "Scholaro Premium",
                      cost: "Varies",
                      description: "Institutional reports",
                      url: "scholaro.com",
                    },
                    {
                      name: "ACEI",
                      cost: "$160-225 USD",
                      description: "Alternative evaluation",
                      url: "acei.org",
                    },
                    {
                      name: "SpanTran",
                      cost: "Varies",
                      description: "Custom evaluation packages",
                      url: "spantran.com",
                    },
                  ].map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {service.name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {service.description}
                        </div>
                      </div>
                      <a
                        href={`https://${service.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 text-sm hover:text-blue-800"
                      >
                        {service.cost}
                      </a>
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
                    url: "usefnepal.org",
                  },
                  {
                    name: "Tribhuvan University",
                    purpose: "Official transcript requests",
                    url: "tu.edu.np",
                  },
                  {
                    name: "IOE Official Website",
                    purpose: "Department verification & resources",
                    url: "ioe.edu.np",
                  },
                ].map((resource) => (
                  <div
                    key={resource.name}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{resource.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {resource.purpose}
                      </div>
                    </div>
                    <a
                      href={`https://${resource.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm underline hover:text-blue-800"
                    >
                      Visit →
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-base text-blue-700 dark:text-blue-300">
                  Pro Tips for Using These Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Badge className="bg-blue-600">1</Badge>
                  <p>
                    <strong>Always verify first:</strong> Check if your target
                    university actually requires paid evaluation - many accept
                    TU transcripts directly
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-blue-600">2</Badge>
                  <p>
                    <strong>Compare multiple tools:</strong> Use free
                    calculators from WES, Scholaro, and others for comparison
                    before paying
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-blue-600">3</Badge>
                  <p>
                    <strong>Get EducationUSA attestation:</strong> For US
                    applications, this adds credibility and is often accepted
                    instead of WES
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-blue-600">4</Badge>
                  <p>
                    <strong>Keep original transcripts:</strong> Never convert
                    marks on official documents - always provide originals with
                    percentages
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="important-notes">
          <AccordionTrigger className="font-semibold text-base">
            Critical Notes & Research Sources
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
              <h4 className="mb-2 font-semibold text-yellow-700 dark:text-yellow-400">
                Research-Based Key Findings
              </h4>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>
                  <strong>WES not always required:</strong> Many top US
                  universities accept TU transcripts directly without WES
                  evaluation.
                </li>
                <li>
                  <strong>Method variation:</strong> Different universities use
                  different conversion methods - always verify specific
                  requirements.
                </li>
                <li>
                  <strong>IOE advantage:</strong> TU graduates are widely
                  accepted; many US universities don't require GPA conversion at
                  all.
                </li>
                <li>
                  <strong>Cost consideration:</strong> WES evaluation costs $225
                  USD - check if actually needed before paying.
                </li>
                <li>
                  <strong>EducationUSA Nepal:</strong> Attesting transcripts
                  through USEF Nepal adds significant credibility for US
                  applications.
                </li>
              </ul>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Research Sources & Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Primary Sources Used:</strong>
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>WES official grade conversion methodology</li>
                    <li>Scholaro GPA Calculator Nepal-specific data</li>
                    <li>European Commission ECTS grading guidelines</li>
                    <li>Modified Bavarian Formula for German conversions</li>
                    <li>Tribhuvan University official grading documents</li>
                    <li>Multiple university-specific conversion standards</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-red-500/50">
                <CardHeader>
                  <CardTitle className="text-base text-red-600">
                    Common Conversion Mistakes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive">1</Badge>
                    <div>
                      <p>Assuming linear conversion (% ÷ 25)</p>
                      <p className="text-muted-foreground text-xs">
                        WES and Scholaro use tiered ranges, not linear formulas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive">2</Badge>
                    <div>
                      <p>Paying for WES unnecessarily</p>
                      <p className="text-muted-foreground text-xs">
                        Many universities accept TU transcripts directly
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive">3</Badge>
                    <div>
                      <p>Using outdated conversion scales</p>
                      <p className="text-muted-foreground text-xs">
                        TU implemented new grading system in 2080
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive">4</Badge>
                    <div>
                      <p>Ignoring IOE 40-60 internal-external split</p>
                      <p className="text-muted-foreground text-xs">
                        Affects final percentage calculation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-500/50">
                <CardHeader>
                  <CardTitle className="text-base text-green-600">
                    Best Practices (Research-Backed)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-600">1</Badge>
                    <div>
                      <p>Verify university requirements first</p>
                      <p className="text-muted-foreground text-xs">
                        Save $225 USD if WES not required
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-600">2</Badge>
                    <div>
                      <p>Use multiple conversion methods</p>
                      <p className="text-muted-foreground text-xs">
                        WES, Scholaro, and university-specific methods vary
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-600">3</Badge>
                    <div>
                      <p>Keep original percentage marks</p>
                      <p className="text-muted-foreground text-xs">
                        Never convert on official transcripts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-600">4</Badge>
                    <div>
                      <p>Get EducationUSA Nepal attestation</p>
                      <p className="text-muted-foreground text-xs">
                        Recognized by US universities
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-blue-500/50">
              <CardHeader>
                <CardTitle className="text-base text-blue-600">
                  Conversion Accuracy & Limitations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <p>
                    <strong>Conversion Accuracy Factors:</strong>
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>
                      <strong>Institutional reputation:</strong> WES considers
                      university tier in evaluations [^4]
                    </li>
                    <li>
                      <strong>Mark consistency:</strong> Stable vs fluctuating
                      percentages affect final GPA [^23]
                    </li>
                    <li>
                      <strong>Subject difficulty:</strong> STEM courses may be
                      weighted differently
                    </li>
                    <li>
                      <strong>Pass mark variations:</strong> Historical changes
                      in TU pass marks
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p>
                    <strong>Important Constraints:</strong>
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>
                      No universal standard exists - each university converts
                      differently
                    </li>
                    <li>
                      Same percentage can convert to different GPAs based on
                      context
                    </li>
                    <li>
                      Fake transcript prevalence requires official verification
                    </li>
                    <li>
                      Many US universities don't recognize unofficial
                      conversions
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Separator />

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                <strong>Disclaimer:</strong> This guide and GPA converter tool
                are for informational purposes only and based on extensive
                research from WES, Scholaro, and international credential
                evaluation services. Conversion accuracy depends on multiple
                factors including university reputation, mark consistency, and
                target institution requirements.{" "}
                <strong>We do not guarantee accuracy of conversions.</strong>{" "}
                Always consult with your target university's admissions office
                and consider official credential evaluation services like WES
                for accurate translations of your academic records. For US
                applications, EducationUSA Nepal attestation is highly
                recommended.
              </p>
              <p className="mt-2 text-muted-foreground text-xs">
                <strong>Sources:</strong> Research based on 80+ references
                including WES training materials, Scholaro databases, European
                Commission guidelines, and Tribhuvan University documents.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </article>
  );
}
