"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

export default function EditQuizPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <EditQuizContent />
    </RoleGuard>
  );
}

function EditQuizContent() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", "", ""]);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);

  const quizQuery = useQuery({
    queryKey: ["dashboard", "quiz", id],
    queryFn: async () => {
      const response = await apiClient.api.quizzes.id({ id }).get();
      if (response.error || !response.data?.success) {
        throw new Error("Failed to load quiz");
      }
      return response.data.data;
    },
  });

  const updateQuizMutation = useMutation({
    mutationFn: async (payload: { title: string; description: string }) =>
      apiClient.api.quizzes.admin({ id }).patch(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dashboard", "quiz", id] }),
  });

  const addQuestionMutation = useMutation({
    mutationFn: async () => {
      const questionCount = quizQuery.data?.questions.length ?? 0;
      return apiClient.api.quizzes.admin.quiz({ quizId: id }).questions.post({
        orderNo: questionCount + 1,
        prompt: newQuestion,
        options: newOptions.map((text, index) => ({
          orderNo: index + 1,
          text,
          isCorrect: index === newCorrectIndex,
        })),
      });
    },
    onSuccess: () => {
      setNewQuestion("");
      setNewOptions(["", "", "", ""]);
      setNewCorrectIndex(0);
      queryClient.invalidateQueries({ queryKey: ["dashboard", "quiz", id] });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) =>
      apiClient.api.quizzes.admin.questions({ questionId }).delete(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dashboard", "quiz", id] }),
  });

  if (!quizQuery.data) return null;
  const quiz = quizQuery.data;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 pt-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              defaultValue={quiz.title}
              onBlur={(e) =>
                updateQuizMutation.mutate({
                  title: e.target.value,
                  description: quiz.description ?? "",
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              defaultValue={quiz.description ?? ""}
              onBlur={(e) =>
                updateQuizMutation.mutate({
                  title: quiz.title,
                  description: e.target.value,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.questions.map((question: any) => (
            <div key={question.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="font-medium">
                  {question.orderNo}. {question.prompt}
                </p>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteQuestionMutation.mutate(question.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <ul className="space-y-1 text-sm">
                {question.options.map((option: any) => (
                  <li key={option.id}>
                    {option.isCorrect ? "✅" : "◻"} {option.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <Label>New Question</Label>
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Type question prompt"
            />
            {newOptions.map((option, index) => (
              <div
                className="flex items-center gap-2"
                key={`option-${index + 1}`}
              >
                <Input
                  value={option}
                  onChange={(e) => {
                    const copy = [...newOptions];
                    copy[index] = e.target.value;
                    setNewOptions(copy);
                  }}
                  placeholder={`Option ${index + 1}`}
                />
                <Button
                  variant={newCorrectIndex === index ? "default" : "outline"}
                  onClick={() => setNewCorrectIndex(index)}
                >
                  Correct
                </Button>
              </div>
            ))}
            <Button
              onClick={() => addQuestionMutation.mutate()}
              disabled={
                !newQuestion ||
                newOptions.some((o) => !o.trim()) ||
                addQuestionMutation.isPending
              }
            >
              <Plus className="mr-2 size-4" />
              Add Question
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
