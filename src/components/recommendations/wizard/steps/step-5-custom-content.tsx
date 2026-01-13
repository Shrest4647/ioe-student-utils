"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileTextIcon } from "lucide-react";

interface Step5CustomContentProps {
  data: {
    customContent?: string;
  };
  updateData: (field: string, value: string) => void;
}

export function Step5CustomContent({ data, updateData }: Step5CustomContentProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Additional Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customContent">
              Custom Content & Stories (optional)
            </Label>
            <Textarea
              id="customContent"
              placeholder="Add any specific stories, anecdotes, or additional information you'd like included in the letter. This could include specific projects you worked on together, challenges you overcame, or instances where you demonstrated exceptional skills."
              value={data.customContent || ""}
              onChange={(e) => updateData("customContent", e.target.value)}
              rows={10}
              className="resize-none"
            />
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-medium">Tips for custom content:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Include specific examples of your work or achievements</li>
              <li>Mention challenges you overcame together</li>
              <li>Highlight moments where you demonstrated leadership</li>
              <li>Add any publications, presentations, or awards</li>
              <li>Include personal qualities that make you stand out</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        This field is completely optional. Use it to add any additional context
        or stories that you want your recommender to highlight in the letter.
      </p>
    </div>
  );
}
