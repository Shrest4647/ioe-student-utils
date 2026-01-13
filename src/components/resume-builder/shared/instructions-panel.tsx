"use client";

import { ChevronDown, ChevronUp, Info, Lightbulb } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InstructionSection {
  title: string;
  content: string[];
  type?: "tip" | "info" | "example";
}

interface InstructionsPanelProps {
  instructions: InstructionSection[];
  title?: string;
}

export function InstructionsPanel({
  instructions,
  title = "Help & Instructions",
}: InstructionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {title}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {instructions.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="flex items-center gap-2 font-semibold text-sm">
                {section.type === "tip" && (
                  <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                )}
                {section.type === "info" && (
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
                {section.title}
              </h4>
              <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                {section.content.map((item, itemIdx) => (
                  <li key={itemIdx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// Predefined instructions for each step
export const PROFILE_INSTRUCTIONS: InstructionSection[] = [
  {
    title: "Personal Information",
    type: "info",
    content: [
      "Enter your legal name as it appears on official documents",
      "Provide a professional email address (avoid nicknames)",
      "Phone number should include country code (e.g., +977)",
      "Address information helps employers understand your location",
    ],
  },
  {
    title: "Profile Photo Tips",
    type: "tip",
    content: [
      "Use a professional headshot with plain background",
      "Ensure good lighting and clear visibility",
      "Dress professionally as you would for an interview",
      "Photo should be recent (within last 1-2 years)",
      "Face the camera directly with a neutral expression",
    ],
  },
  {
    title: "Professional Summary",
    type: "tip",
    content: [
      "Keep it concise: 2-3 sentences maximum",
      "Highlight your key qualifications and experience",
      "Mention your career goals or what you bring to the role",
      "Tailor it to the type of jobs you're seeking",
      "Example: 'Software engineer with 3+ years experience in full-stack development. Passionate about building scalable web applications and mentoring junior developers.'",
    ],
  },
  {
    title: "Online Presence",
    type: "info",
    content: [
      "LinkedIn: Ensure your profile is complete and professional",
      "GitHub: Include your best projects and contributions",
      "Personal website: Showcase your portfolio and work",
      "Make sure all links are publicly accessible",
      "Review your social media for professional content",
    ],
  },
];

export const WORK_EXPERIENCE_INSTRUCTIONS: InstructionSection[] = [
  {
    title: "What to Include",
    type: "info",
    content: [
      "Full-time and part-time jobs",
      "Internships and volunteer work",
      "Freelance projects and contract work",
      "Relevant student organization roles",
      "Research or teaching assistant positions",
    ],
  },
  {
    title: "Writing Effective Descriptions",
    type: "tip",
    content: [
      "Start with action verbs (Developed, Led, Created, etc.)",
      "Focus on achievements, not just responsibilities",
      "Use numbers and metrics when possible (e.g., 'Increased efficiency by 40%')",
      "Highlight relevant skills and technologies used",
      "Keep descriptions concise but informative (3-5 bullet points)",
    ],
  },
  {
    title: "Example Entry",
    type: "example",
    content: [
      "Job Title: Software Developer",
      "Employer: Tech Solutions Inc.",
      "Description: Developed and maintained web applications using React and Node.js. Improved application performance by 40% through code optimization. Led a team of 3 junior developers on key projects.",
    ],
  },
];

export const EDUCATION_INSTRUCTIONS: InstructionSection[] = [
  {
    title: "What to Include",
    type: "info",
    content: [
      "Formal degrees (Bachelor's, Master's, PhD)",
      "Diplomas and certificates",
      "Online courses and certifications",
      "Relevant workshops and training programs",
      "Include most recent education first",
    ],
  },
  {
    title: "Additional Information",
    type: "tip",
    content: [
      "Thesis or project title: Shows your expertise area",
      "Key coursework: Relevant courses to the job",
      "Grade/GPA: Include if strong (usually 3.5+ or First Class)",
      "Honors and awards: Dean's list, scholarships, etc.",
      "Study abroad programs: International experience",
    ],
  },
  {
    title: "Formatting Tips",
    type: "tip",
    content: [
      "Use full institution name (e.g., 'Tribhuvan University')",
      "Include location if institution is not well-known",
      "Degree level should be clear (Bachelor, Master, etc.)",
      "Field of study helps employers understand your specialization",
    ],
  },
];

export const LANGUAGE_SKILLS_INSTRUCTIONS: InstructionSection[] = [
  {
    title: "Understanding CEFR Levels",
    type: "info",
    content: [
      "A1-A2: Basic user - Can communicate in simple situations",
      "B1-B2: Independent user - Can handle most situations",
      "C1-C2: Proficient user - Can express ideas fluently and spontaneously",
      "Be honest about your proficiency level",
      "Employers may test your language skills during interview",
    ],
  },
  {
    title: "Assessment Guidelines",
    type: "tip",
    content: [
      "Listening: Can you understand conversations and speeches?",
      "Reading: Can you understand written texts and documents?",
      "Spoken Interaction: Can you participate in conversations?",
      "Spoken Production: Can you present information and arguments?",
      "Writing: Can you write clear, detailed text?",
    ],
  },
  {
    title: "Common Mistakes",
    type: "tip",
    content: [
      "Don't overestimate your abilities - it's better to be honest",
      "Native language skills should be marked as C2",
      "Include only languages you can actually use professionally",
      "Consider adding language certifications if available",
    ],
  },
];

export const SKILLS_INSTRUCTIONS: InstructionSection[] = [
  {
    title: "Skill Categories",
    type: "info",
    content: [
      "Programming Languages: Python, Java, JavaScript, etc.",
      "Frameworks & Libraries: React, Django, Spring, etc.",
      "Databases: PostgreSQL, MongoDB, MySQL, etc.",
      "Tools & Software: Git, Docker, AWS, VS Code, etc.",
      "Soft Skills: Communication, Leadership, Problem-solving, etc.",
    ],
  },
  {
    title: "Best Practices",
    type: "tip",
    content: [
      "List skills relevant to your target job",
      "Group related skills together",
      "Indicate proficiency level honestly",
      "Focus on skills you can demonstrate",
      "Include both technical and soft skills",
      "Keep descriptions brief and factual",
    ],
  },
  {
    title: "What to Avoid",
    type: "tip",
    content: [
      "Don't list basic skills like 'Microsoft Word' unless specifically relevant",
      "Avoid buzzwords and vague terms",
      "Don't exaggerate your proficiency level",
      "Remove outdated or irrelevant skills",
      "Don't crowd your resume with too many skills",
    ],
  },
];
