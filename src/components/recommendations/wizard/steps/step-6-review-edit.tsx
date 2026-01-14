"use client";

import { EyeIcon, FileTextIcon, LoaderIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Step6ReviewEditProps {
  data: Record<string, string | undefined>;
  updateData: (field: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function Step6ReviewEdit({
  data,
  updateData,
  onSubmit,
  isSubmitting,
}: Step6ReviewEditProps) {
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(true);

  const generatePreview = useCallback(() => {
    setIsGeneratingPreview(true);
    try {
      // For now, we'll show a simple preview
      // In a real implementation, you'd call an API to generate the actual letter
      const content = `
[Date]

${data.targetInstitution}
${data.targetDepartment ? `${data.targetDepartment}\n` : ""}${data.targetProgram}

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
  }, [data]);

  useEffect(() => {
    if (data.finalContent) {
      setPreviewContent(data.finalContent);
    } else {
      generatePreview();
    }
  }, [generatePreview, data.finalContent]);

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
                  <h4 className="mb-2 font-medium">Recommender</h4>
                  <div className="space-y-1 text-sm">
                    <p>{data.recommenderName}</p>
                    <p className="text-muted-foreground">
                      {data.recommenderTitle}
                    </p>
                    <p className="text-muted-foreground">
                      {data.recommenderInstitution}
                    </p>
                    {data.recommenderDepartment && (
                      <p className="text-muted-foreground">
                        {data.recommenderDepartment}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">Target</h4>
                  <div className="space-y-1 text-sm">
                    <p>{data.targetInstitution}</p>
                    <p className="text-muted-foreground">
                      {data.targetProgram}
                    </p>
                    {data.targetDepartment && (
                      <p className="text-muted-foreground">
                        {data.targetDepartment}
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline">{data.targetCountry}</Badge>
                      <Badge variant="secondary">{data.purpose}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Relationship</h4>
                <p className="text-sm">{data.relationship}</p>
                {data.contextOfMeeting && (
                  <p className="mt-1 text-muted-foreground text-sm">
                    {data.contextOfMeeting}
                  </p>
                )}
              </div>

              {(data.studentAchievements ||
                data.researchExperience ||
                data.academicPerformance ||
                data.personalQualities) && (
                <div>
                  <h4 className="mb-2 font-medium">Student Highlights</h4>
                  <div className="space-y-2 text-sm">
                    {data.studentAchievements && (
                      <div>
                        <p className="font-medium">Achievements:</p>
                        <p className="text-muted-foreground">
                          {data.studentAchievements}
                        </p>
                      </div>
                    )}
                    {data.researchExperience && (
                      <div>
                        <p className="font-medium">Research:</p>
                        <p className="text-muted-foreground">
                          {data.researchExperience}
                        </p>
                      </div>
                    )}
                    {data.academicPerformance && (
                      <div>
                        <p className="font-medium">Academic:</p>
                        <p className="text-muted-foreground">
                          {data.academicPerformance}
                        </p>
                      </div>
                    )}
                    {data.personalQualities && (
                      <div>
                        <p className="font-medium">Qualities:</p>
                        <p className="text-muted-foreground">
                          {data.personalQualities}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {data.customContent && (
                <div>
                  <h4 className="mb-2 font-medium">Additional Content</h4>
                  <p className="text-muted-foreground text-sm">
                    {data.customContent}
                  </p>
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
                  value={data.finalContent || previewContent}
                  onChange={(e) => updateData("finalContent", e.target.value)}
                  rows={15}
                  className="resize-none font-mono text-sm"
                  placeholder="Edit your letter content here..."
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
                    {data.finalContent || previewContent}
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
