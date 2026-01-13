"use client";

import { Download, FileText, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GPACalculatorResultsProps {
  result: {
    courses: Array<{
      name: string;
      percentage: string;
      credits: string;
      gpa: number;
      gradeLabel: string | null;
      qualityPoints: number;
    }>;
    cumulativeGPA: number;
    totalCredits: number;
    totalQualityPoints: number;
    standard: {
      id: string;
      name: string;
      description: string;
    };
  };
}

export function GPACalculatorResults({ result }: GPACalculatorResultsProps) {
  const exportToCSV = () => {
    const headers = [
      "Course Name",
      "Percentage",
      "Credits",
      "GPA",
      "Grade",
      "Quality Points",
    ];

    const rows = result.courses.map((course) => [
      course.name,
      course.percentage,
      course.credits,
      course.gpa.toFixed(2),
      course.gradeLabel || "N/A",
      course.qualityPoints.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
      "",
      `Cumulative GPA,${result.cumulativeGPA.toFixed(2)}`,
      `Total Credits,${result.totalCredits.toFixed(2)}`,
      `Total Quality Points,${result.totalQualityPoints.toFixed(2)}`,
      `Standard,${result.standard.name}`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gpa-calculation-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Exported to CSV successfully!");
  };

  const saveCalculation = async () => {
    try {
      const response = await fetch("/api/gpa-converter/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standardId: result.standard.id,
          courses: result.courses.map((c) => ({
            name: c.name,
            percentage: c.percentage,
            credits: c.credits,
          })),
          cumulativeGPA: result.cumulativeGPA.toString(),
          totalCredits: result.totalCredits.toString(),
          totalQualityPoints: result.totalQualityPoints.toString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Calculation saved successfully!");
      } else if (response.status === 401) {
        toast.error("Please login to save calculations");
      } else {
        toast.error(data.error || "Failed to save calculation");
      }
    } catch (_error) {
      toast.error("Failed to save calculation. Please try again.");
    }
  };

  const getGradeColor = (gpa: number) => {
    if (gpa >= 3.7) return "bg-primary/10 text-primary";
    if (gpa >= 3.0) return "bg-secondary/10 text-secondary";
    if (gpa >= 2.0) return "bg-muted/10 text-muted-foreground";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Your Results</CardTitle>
          <div className="flex gap-2">
            <Button onClick={saveCalculation} size="sm" variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button onClick={exportToCSV} size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="bg-linear-to-br from-primary to-primary/75 text-white">
            <CardContent className="p-6">
              <p className="font-medium text-sm opacity-90">Cumulative GPA</p>
              <p className="mt-2 font-bold text-4xl">
                {result.cumulativeGPA.toFixed(2)}
              </p>
              <p className="mt-1 text-xs opacity-75">on 4.0 scale</p>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-accent to-accent/75 text-white">
            <CardContent className="p-6">
              <p className="font-medium text-sm opacity-90">Total Credits</p>
              <p className="mt-2 font-bold text-4xl">
                {result.totalCredits.toFixed(1)}
              </p>
              <p className="mt-1 text-xs opacity-75">
                {result.courses.length} course
                {result.courses.length > 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-accent to-accent/75 text-white">
            <CardContent className="p-6">
              <p className="font-medium text-sm opacity-90">Quality Points</p>
              <p className="mt-2 font-bold text-4xl">
                {result.totalQualityPoints.toFixed(2)}
              </p>
              <p className="mt-1 text-xs opacity-75">total earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Standard Info */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileText className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">
                  Conversion Standard: {result.standard.name}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  {result.standard.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Breakdown Table */}
        <div>
          <h3 className="mb-4 font-semibold text-lg">Course Breakdown</h3>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Percentage</TableHead>
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead className="text-center">GPA</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-right">Quality Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.courses.map((course, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell className="text-center">
                      {course.percentage}%
                    </TableCell>
                    <TableCell className="text-center">
                      {course.credits}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getGradeColor(course.gpa)}>
                        {course.gpa.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {course.gradeLabel || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {course.qualityPoints.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-foreground text-sm">
            <strong>Disclaimer:</strong> This is an estimate only. Official
            evaluation requires WES/Scholaro assessment. Different universities
            may convert grades differently. Many US universities accept TU
            transcripts directly without requiring credential evaluation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
