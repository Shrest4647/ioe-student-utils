"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, FileTextIcon, LoaderIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Step6ReviewEditProps {
  data: Record<string, string | undefined>;
  updateData: (field: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function Step6ReviewEdit({ data, updateData, onSubmit, isSubmitting }: Step6ReviewEditProps) {
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(true);

  useEffect(() => {
    generatePreview();
  }, [data]);

  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      // For now, we'll show a simple preview
      // In a real implementation, you'd call an API to generate the actual letter
      const content = `
[Date]

${data.targetInstitution}
${data.targetDepartment ? data.targetDepartment + "\n" : ""}${data.targetProgram}

Dear Admissions Committee,

It is my great pleasure to write this letter of recommendation for the student applying to ${data.targetProgram} at ${data.targetInstitution}.

I have known the student ${data.relationship || "in various capacities"}${data.contextOfMeeting ? `, specifically: ${data.contextOfMeeting}` : ""}.

${data.studentAchievements ? `The student has demonstrated exceptional achievements: ${data.studentAchievements}\n\n` : ""}${data.researchExperience ? `In terms of research experience: ${data.researchExperience}\n\n` : ""}${data.academicPerformance ? `Academically: ${data.academicPerformance}\n\n` : ""}${data.personalQualities ? `The student possesses outstanding qualities including: ${data.personalQualities}\n\n` : ""}${data.customContent ? `${data.customContent}\n\n` : ""}I strongly recommend this student for admission to your program without reservation.

Sincerely,

${data.recommenderName}
${data.recommenderTitle}
${data.recommenderInstitution}
${data.recommenderDepartment || ""}
${data.recommenderEmail ? data.recommenderEmail : ""}
      `.trim();

      setPreviewContent(content);
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="review" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review">
            <FileTextIcon className="mr-2 h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="preview">
            <EyeIcon className="mr-2 h-4 w-4" />
            Letter Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Recommender</h4>
                  <div className="space-y-1 text-sm">
                    <p>{data.recommenderName}</p>
                    <p className="text-muted-foreground">{data.recommenderTitle}</p>
                    <p className="text-muted-foreground">{data.recommenderInstitution}</p>
                    {data.recommenderDepartment && (
                      <p className="text-muted-foreground">{data.recommenderDepartment}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Target</h4>
                  <div className="space-y-1 text-sm">
                    <p>{data.targetInstitution}</p>
                    <p className="text-muted-foreground">{data.targetProgram}</p>
                    {data.targetDepartment && (
                      <p className="text-muted-foreground">{data.targetDepartment}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{data.targetCountry}</Badge>
                      <Badge variant="secondary">{data.purpose}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Relationship</h4>
                <p className="text-sm">{data.relationship}</p>
                {data.contextOfMeeting && (
                  <p className="text-sm text-muted-foreground mt-1">{data.contextOfMeeting}</p>
                )}
              </div>

              {(data.studentAchievements || data.researchExperience || data.academicPerformance || data.personalQualities) && (
                <div>
                  <h4 className="font-medium mb-2">Student Highlights</h4>
                  <div className="space-y-2 text-sm">
                    {data.studentAchievements && (
                      <div>
                        <p className="font-medium">Achievements:</p>
                        <p className="text-muted-foreground">{data.studentAchievements}</p>
                      </div>
                    )}
                    {data.researchExperience && (
                      <div>
                        <p className="font-medium">Research:</p>
                        <p className="text-muted-foreground">{data.researchExperience}</p>
                      </div>
                    )}
                    {data.academicPerformance && (
                      <div>
                        <p className="font-medium">Academic:</p>
                        <p className="text-muted-foreground">{data.academicPerformance}</p>
                      </div>
                    )}
                    {data.personalQualities && (
                      <div>
                        <p className="font-medium">Qualities:</p>
                        <p className="text-muted-foreground">{data.personalQualities}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {data.customContent && (
                <div>
                  <h4 className="font-medium mb-2">Additional Content</h4>
                  <p className="text-sm text-muted-foreground">{data.customContent}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit Final Content (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="finalContent">
                  You can customize the generated letter content here
                </Label>
                <Textarea
                  id="finalContent"
                  value={previewContent}
                  onChange={(e) => updateData("finalContent", e.target.value)}
                  rows={15}
                  className="resize-none font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Letter Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {isGeneratingPreview ? (
                <div className="flex items-center justify-center py-12">
                  <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {previewContent}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              Creating Letter...
            </>
          ) : (
            "Create Recommendation Letter"
          )}
        </Button>
      </div>
    </div>
  );
}
