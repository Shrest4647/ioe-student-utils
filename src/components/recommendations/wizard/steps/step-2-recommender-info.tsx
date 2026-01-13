"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon, BuildingIcon, MailIcon } from "lucide-react";

interface Step2RecommenderInfoProps {
  data: {
    recommenderName?: string;
    recommenderTitle?: string;
    recommenderInstitution?: string;
    recommenderEmail?: string;
    recommenderDepartment?: string;
  };
  updateData: (field: string, value: string) => void;
}

export function Step2RecommenderInfo({ data, updateData }: Step2RecommenderInfoProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Recommender Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recommenderName">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recommenderName"
              placeholder="Dr. John Smith"
              value={data.recommenderName || ""}
              onChange={(e) => updateData("recommenderName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommenderTitle">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recommenderTitle"
              placeholder="Professor of Computer Science"
              value={data.recommenderTitle || ""}
              onChange={(e) => updateData("recommenderTitle", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommenderInstitution">
              Institution <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recommenderInstitution"
              placeholder="Institute of Engineering, Tribhuvan University"
              value={data.recommenderInstitution || ""}
              onChange={(e) => updateData("recommenderInstitution", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommenderDepartment">Department</Label>
            <Input
              id="recommenderDepartment"
              placeholder="Department of Computer Engineering"
              value={data.recommenderDepartment || ""}
              onChange={(e) => updateData("recommenderDepartment", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommenderEmail">Email (optional)</Label>
            <Input
              id="recommenderEmail"
              type="email"
              placeholder="john.smith@ioe.edu.np"
              value={data.recommenderEmail || ""}
              onChange={(e) => updateData("recommenderEmail", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Enter the details of the person who will be recommending you. This
        information will be used in the letter header and signature.
      </p>
    </div>
  );
}
