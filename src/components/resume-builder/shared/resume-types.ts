export interface ResumeData {
  profile?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    photoUrl?: string;
    summary?: string;
    linkedIn?: string;
    github?: string;
    web?: string;
  };
  workExperiences?: Array<{
    id?: string;
    jobTitle?: string;
    employer?: string;
    startDate?: string;
    endDate?: string;
    city?: string;
    country?: string;
    description?: string;
  }>;
  educationRecords?: Array<{
    id?: string;
    institution?: string;
    qualification?: string;
    degreeLevel?: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
    gradeType?: string;
    description?: string;
  }>;
  languageSkills?: Array<{
    id?: string;
    language: string;
    listening?: string;
    reading?: string;
    speaking?: string;
    writing?: string;
  }>;
  userSkills?: Array<{
    id?: string;
    category: string;
    skills: Array<{ name: string; proficiency?: string }>;
  }>;
  projectRecords?: Array<{
    id?: string;
    name: string | null;
    role: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
    referenceLink: string | null;
  }>;
  positionsOfResponsibilityRecords?: Array<{
    id?: string;
    name: string | null;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    referenceLink: string | null;
  }>;
  certificationsRecords?: Array<{
    id?: string;
    name: string | null;
    issuer: string | null;
    issueDate: string | null;
    credentialUrl: string | null;
  }>;
}
