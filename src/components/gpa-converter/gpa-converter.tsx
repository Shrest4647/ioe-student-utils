"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GPACalculatorResults } from "./gpa-calculator-results";

interface Course {
  id: string;
  name: string;
  percentage: string;
  credits: string;
}

interface ConversionStandard {
  id: string;
  name: string;
  description: string;
  ranges: Array<{
    minPercentage: string;
    maxPercentage: string;
    gpaValue: string;
    gradeLabel: string | null;
  }>;
}

export function GPAConverter() {
  const [courses, setCourses] = useState<Course[]>([
    { id: "1", name: "", percentage: "", credits: "" },
  ]);
  const [selectedStandard, setSelectedStandard] = useState<string>("");
  const [standards, setStandards] = useState<ConversionStandard[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Fetch standards on mount
  useEffect(() => {
    fetch("/api/gpa-converter/standards")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStandards(data.data);
          if (data.data.length > 0) {
            setSelectedStandard(data.data[0].id);
          }
        }
      })
      .catch(() => toast.error("Failed to load conversion standards"));
  }, []);

  const addCourse = () => {
    setCourses([
      ...courses,
      { id: Date.now().toString(), name: "", percentage: "", credits: "" },
    ]);
  };

  const removeCourse = (id: string) => {
    if (courses.length === 1) {
      toast.error("You must have at least one course");
      return;
    }
    setCourses(courses.filter((course) => course.id !== id));
  };

  const updateCourse = (id: string, field: keyof Course, value: string) => {
    setCourses(
      courses.map((course) =>
        course.id === id ? { ...course, [field]: value } : course,
      ),
    );
  };

  const calculateGPA = async () => {
    // Validate inputs
    const validCourses = courses.filter(
      (course) => course.name && course.percentage && course.credits,
    );

    if (validCourses.length === 0) {
      toast.error("Please fill in at least one course");
      return;
    }

    if (!selectedStandard) {
      toast.error("Please select a conversion standard");
      return;
    }

    // Validate percentage and credits
    for (const course of validCourses) {
      const percentage = parseFloat(course.percentage);
      const credits = parseFloat(course.credits);

      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        toast.error(`Invalid percentage for "${course.name}"`);
        return;
      }

      if (isNaN(credits) || credits <= 0) {
        toast.error(`Invalid credits for "${course.name}"`);
        return;
      }
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/gpa-converter/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standardId: selectedStandard,
          courses: validCourses,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        toast.success("GPA calculated successfully!");
      } else {
        toast.error(data.error || "Failed to calculate GPA");
      }
    } catch (error) {
      toast.error("Failed to calculate GPA. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Standard Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Conversion Standard</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedStandard} onValueChange={setSelectedStandard}>
            <SelectTrigger>
              <SelectValue placeholder="Select a conversion standard" />
            </SelectTrigger>
            <SelectContent>
              {standards.map((standard) => (
                <SelectItem key={standard.id} value={standard.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{standard.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {standard.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Course Input */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add Your Courses</CardTitle>
          <Button onClick={addCourse} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.map((course, index) => (
            <div key={course.id} className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Course name (e.g., Mathematics)"
                  value={course.name}
                  onChange={(e) => updateCourse(course.id, "name", e.target.value)}
                />
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  placeholder="Percentage"
                  min="0"
                  max="100"
                  value={course.percentage}
                  onChange={(e) =>
                    updateCourse(course.id, "percentage", e.target.value)
                  }
                />
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  placeholder="Credits"
                  min="0"
                  step="0.5"
                  value={course.credits}
                  onChange={(e) =>
                    updateCourse(course.id, "credits", e.target.value)
                  }
                />
              </div>
              <Button
                onClick={() => removeCourse(course.id)}
                size="icon"
                variant="ghost"
                disabled={courses.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            onClick={calculateGPA}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <Calculator className="mr-2 h-5 w-5" />
            {loading ? "Calculating..." : "Calculate GPA"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && <GPACalculatorResults result={result} />}
    </div>
  );
}
