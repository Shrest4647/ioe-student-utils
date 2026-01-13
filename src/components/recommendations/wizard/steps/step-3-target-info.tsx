"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCapIcon, GlobeIcon } from "lucide-react";

interface Step3TargetInfoProps {
  data: {
    targetInstitution?: string;
    targetProgram?: string;
    targetDepartment?: string;
    targetCountry?: string;
    purpose?: string;
    relationship?: string;
    contextOfMeeting?: string;
  };
  updateData: (field: string, value: string) => void;
}

export function Step3TargetInfo({ data, updateData }: Step3TargetInfoProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCapIcon className="h-5 w-5" />
            Target Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetInstitution">
              Target Institution <span className="text-destructive">*</span>
            </Label>
            <Input
              id="targetInstitution"
              placeholder="Stanford University"
              value={data.targetInstitution || ""}
              onChange={(e) => updateData("targetInstitution", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetProgram">
              Target Program <span className="text-destructive">*</span>
            </Label>
            <Input
              id="targetProgram"
              placeholder="PhD in Computer Science"
              value={data.targetProgram || ""}
              onChange={(e) => updateData("targetProgram", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDepartment">Department</Label>
            <Input
              id="targetDepartment"
              placeholder="Department of Computer Science"
              value={data.targetDepartment || ""}
              onChange={(e) => updateData("targetDepartment", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetCountry">
              Country <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.targetCountry || ""}
              onValueChange={(value) => updateData("targetCountry", value)}
            >
              <SelectTrigger id="targetCountry">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="Japan">Japan</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">
              Purpose <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.purpose || ""}
              onValueChange={(value) => updateData("purpose", value)}
            >
              <SelectTrigger id="purpose">
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admission">Admission</SelectItem>
                <SelectItem value="scholarship">Scholarship</SelectItem>
                <SelectItem value="funding">Funding</SelectItem>
                <SelectItem value="job">Job Application</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GlobeIcon className="h-5 w-5" />
            Relationship with Recommender
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="relationship">
              How do you know them? <span className="text-destructive">*</span>
            </Label>
            <Input
              id="relationship"
              placeholder="e.g., Thesis advisor, Professor for 3 courses"
              value={data.relationship || ""}
              onChange={(e) => updateData("relationship", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contextOfMeeting">
              Context of meeting (optional)
            </Label>
            <Textarea
              id="contextOfMeeting"
              placeholder="e.g., Took 'Data Structures' and 'Algorithms' courses, worked on senior project together"
              value={data.contextOfMeeting || ""}
              onChange={(e) => updateData("contextOfMeeting", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
