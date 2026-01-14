import { db } from "../index";
import { recommendationTemplate } from "../schema";

export const recommendationTemplates = [
  {
    id: "tpl_research_phd_strong",
    name: "PhD Research - Strong Candidate",
    description:
      "Ideal for strong PhD candidates with significant research experience",
    category: "research" as const,
    content: `[Date]

Dear {{target_admissions_committee}},

It is my great pleasure to write this letter of recommendation for {{student_name}} for admission to the {{target_program}} at {{target_institution}}. I have known {{student_name}} for {{duration_known}} in my capacity as {{recommender_title}} at {{recommender_institution}}, and I can confidently state that {{student_pronoun}} is one of the most exceptional students I have had the privilege to mentor.

{{student_name}} worked under my supervision as {{relationship}}, during which {{student_pronoun}} demonstrated exceptional research aptitude and intellectual curiosity. {{student_pronoun}} contributed significantly to our research on {{research_topic}}, where {{student_pronoun}} {{research_contribution}}. This work resulted in {{research_outcome}}.

Academically, {{student_name}} has consistently performed at the top of {{student_pronoun}} class, maintaining a GPA of {{student_gpa}}. {{student_pronoun}} possesses a rare combination of theoretical understanding and practical skills that is essential for doctoral research. In my {{course_name}} course, {{student_name}} not only excelled in coursework but also demonstrated {{specific_strength}}.

Beyond {{student_pronoun}} technical abilities, {{student_name}} is a dedicated and collaborative researcher. {{student_pronoun}} has shown {{personal_quality_1}} and {{personal_quality_2}}, making {{student_object}} a valuable member of any research team. {{student_pronoun}} has also demonstrated {{leadership_example}}.

I am particularly impressed by {{student_name}}'s research potential, as evidenced by {{evidence_of_potential}}. {{student_pronoun}} research interests in {{research_interests}} align perfectly with the strengths of your program, and I am confident that {{student_pronoun}} will make significant contributions to the field.

I strongly recommend {{student_name}} for admission to your PhD program without reservation. I expect {{student_object}} to develop into an outstanding researcher and scholar. Please do not hesitate to contact me if you require any additional information.

Sincerely,

{{recommender_name}}
{{recommender_title}}
{{recommender_department}}
{{recommender_institution}}
{{recommender_email}}`,
    variables: [
      {
        name: "target_admissions_committee",
        label: "Admissions Committee",
        type: "text" as const,
        required: true,
        defaultValue: "Members of the Admissions Committee",
        description: "Salutation for the letter",
      },
      {
        name: "student_name",
        label: "Student Name",
        type: "text" as const,
        required: true,
        defaultValue: "",
        description: "Full name of the student",
      },
      {
        name: "target_program",
        label: "Target Program",
        type: "text" as const,
        required: true,
        description: "Name of the PhD program",
      },
      {
        name: "target_institution",
        label: "Target Institution",
        type: "text" as const,
        required: true,
        description: "Name of the university",
      },
      {
        name: "duration_known",
        label: "Duration Known",
        type: "text" as const,
        required: true,
        description: 'How long you have known the student (e.g., "two years")',
      },
      {
        name: "recommender_title",
        label: "Recommender Title",
        type: "text" as const,
        required: true,
        description: "Recommender position/title",
      },
      {
        name: "recommender_institution",
        label: "Recommender Institution",
        type: "text" as const,
        required: true,
        description: "Recommender institution name",
      },
      {
        name: "student_pronoun",
        label: "Student Pronoun",
        type: "select" as const,
        required: true,
        options: ["he", "she", "they"],
        description: "Subject pronoun",
      },
      {
        name: "student_object",
        label: "Student Object Pronoun",
        type: "select" as const,
        required: true,
        options: ["him", "her", "them"],
        description: "Object pronoun",
      },
      {
        name: "relationship",
        label: "Relationship",
        type: "text" as const,
        required: true,
        description: "Recommender relationship to the student",
      },
      {
        name: "research_topic",
        label: "Research Topic",
        type: "textarea" as const,
        required: false,
        description: "Topic of research the student worked on",
      },
      {
        name: "research_contribution",
        label: "Research Contribution",
        type: "textarea" as const,
        required: false,
        description: "What the student contributed to the research",
      },
      {
        name: "research_outcome",
        label: "Research Outcome",
        type: "textarea" as const,
        required: false,
        description:
          "Outcome of the research (publications, presentations, etc.)",
      },
      {
        name: "student_gpa",
        label: "Student GPA",
        type: "text" as const,
        required: false,
        description: "Student's GPA",
      },
      {
        name: "course_name",
        label: "Course Name",
        type: "text" as const,
        required: false,
        description: "A specific course the student excelled in",
      },
      {
        name: "specific_strength",
        label: "Specific Strength",
        type: "textarea" as const,
        required: false,
        description: "Specific strength demonstrated in the course",
      },
      {
        name: "personal_quality_1",
        label: "Personal Quality 1",
        type: "text" as const,
        required: false,
        description: "First personal quality",
      },
      {
        name: "personal_quality_2",
        label: "Personal Quality 2",
        type: "text" as const,
        required: false,
        description: "Second personal quality",
      },
      {
        name: "leadership_example",
        label: "Leadership Example",
        type: "textarea" as const,
        required: false,
        description: "Example of leadership or initiative",
      },
      {
        name: "evidence_of_potential",
        label: "Evidence of Potential",
        type: "textarea" as const,
        required: false,
        description: "Evidence of student's research potential",
      },
      {
        name: "research_interests",
        label: "Research Interests",
        type: "textarea" as const,
        required: false,
        description: "Student's research interests",
      },
      {
        name: "recommender_name",
        label: "Recommender Name",
        type: "text" as const,
        required: true,
        description: "Recommender's name",
      },
      {
        name: "recommender_department",
        label: "Recommender Department",
        type: "text" as const,
        required: true,
        description: "Recommender's department",
      },
      {
        name: "recommender_email",
        label: "Recommender Email",
        type: "text" as const,
        required: true,
        description: "Recommender's email",
      },
    ],
    targetProgramType: "phd" as const,
    targetRegion: "global" as const,
    isSystemTemplate: true,
    isActive: true,
  },
  {
    id: "tpl_masters_general",
    name: "Master's Program - General",
    description: "Balanced template for Master's program applications",
    category: "academic" as const,
    content: `[Date]

To the Graduate Admissions Committee,

I am writing to enthusiastically recommend {{student_name}} for admission to the {{target_program}} at {{target_institution}}. As {{recommender_title}} at {{recommender_institution}}, I have had the pleasure of knowing {{student_name}} for {{duration_known}} as {{relationship}}.

During this time, {{student_name}} has consistently demonstrated {{academic_strength}}. In my {{course_name}} course, {{student_pronoun}} earned a {{grade}} and distinguished {{student_object}}self through {{class_performance}}. {{student_pronoun}} possesses a strong foundation in {{subject_area}}, as evidenced by {{evidence_of_knowledge}}.

Beyond academic performance, {{student_name}} has shown {{personal_quality}}. {{anecdote}}. This demonstrates {{student_pronoun}} ability to {{skill_demonstrated}}.

{{student_name}} has expressed particular interest in {{student_interests}}, which aligns well with your program's strengths. I am confident that {{student_pronoun}} will be an excellent addition to your cohort and will make meaningful contributions to your academic community.

I recommend {{student_name}} without reservation. Please feel free to contact me with any questions.

Sincerely,

{{recommender_name}}
{{recommender_title}}
{{recommender_department}}
{{recommender_institution}}
{{recommender_email}}`,
    variables: [
      {
        name: "student_name",
        label: "Student Name",
        type: "text" as const,
        required: true,
        defaultValue: "",
      },
      {
        name: "target_program",
        label: "Target Program",
        type: "text" as const,
        required: true,
      },
      {
        name: "target_institution",
        label: "Target Institution",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_title",
        label: "Recommender Title",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_institution",
        label: "Recommender Institution",
        type: "text" as const,
        required: true,
      },
      {
        name: "duration_known",
        label: "Duration Known",
        type: "text" as const,
        required: true,
      },
      {
        name: "relationship",
        label: "Relationship",
        type: "text" as const,
        required: true,
      },
      {
        name: "academic_strength",
        label: "Academic Strength",
        type: "textarea" as const,
        required: false,
      },
      {
        name: "course_name",
        label: "Course Name",
        type: "text" as const,
        required: false,
      },
      {
        name: "student_pronoun",
        label: "Student Pronoun",
        type: "select" as const,
        required: true,
        options: ["he", "she", "they"],
      },
      {
        name: "student_object",
        label: "Student Object Pronoun",
        type: "select" as const,
        required: true,
        options: ["himself", "herself", "themself"],
      },
      {
        name: "grade",
        label: "Grade",
        type: "text" as const,
        required: false,
      },
      {
        name: "class_performance",
        label: "Class Performance",
        type: "textarea" as const,
        required: false,
      },
      {
        name: "subject_area",
        label: "Subject Area",
        type: "text" as const,
        required: false,
      },
      {
        name: "evidence_of_knowledge",
        label: "Evidence of Knowledge",
        type: "textarea" as const,
        required: false,
      },
      {
        name: "personal_quality",
        label: "Personal Quality",
        type: "text" as const,
        required: false,
      },
      {
        name: "anecdote",
        label: "Anecdote",
        type: "textarea" as const,
        required: false,
      },
      {
        name: "skill_demonstrated",
        label: "Skill Demonstrated",
        type: "text" as const,
        required: false,
      },
      {
        name: "student_interests",
        label: "Student Interests",
        type: "textarea" as const,
        required: false,
      },
      {
        name: "recommender_name",
        label: "Recommender Name",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_department",
        label: "Recommender Department",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_email",
        label: "Recommender Email",
        type: "text" as const,
        required: true,
      },
    ],
    targetProgramType: "masters" as const,
    targetRegion: "global" as const,
    isSystemTemplate: true,
    isActive: true,
  },
  {
    id: "tpl_industry_software",
    name: "Industry Position - Software Engineering",
    description: "For software engineering and technical positions",
    category: "industry" as const,
    content: `[Date]

To the Hiring Manager,

I am writing to recommend {{student_name}} for the {{position}} role at {{company}}. As {{recommender_title}} at {{recommender_institution}}, I have worked closely with {{student_name}} for {{duration_known}} and can confidently speak to {{student_pronoun}} technical abilities and potential as a software engineer.

{{student_name}} has demonstrated exceptional programming skills through {{project_experience}}. In our {{project_name}} project, {{student_pronoun}} was responsible for {{responsibilities}}, where {{student_pronoun}} successfully {{achievement}}. {{student_pronoun}} code quality is {{code_quality_description}}, and {{student_pronoun}} consistently follows {{best_practices}}.

Technically, {{student_name}} is proficient in {{technical_skills}}. {{student_pronoun}} has experience with {{specific_technologies}}, which makes {{student_object}} well-suited for this role. What sets {{student_name}} apart is {{unique_strength}}.

In terms of soft skills, {{student_name}} is an excellent {{soft_skill_1}} and {{soft_skill_2}}. {{teamwork_example}}. {{student_pronoun}} communicates technical concepts clearly and works effectively in team environments.

I strongly believe {{student_name}} would be a valuable addition to your team. {{student_pronoun}} combination of technical skills, practical experience, and collaborative mindset makes {{student_object}} an ideal candidate for this position.

Please do not hesitate to contact me if you need any additional information.

Best regards,

{{recommender_name}}
{{recommender_title}}
{{recommender_department}}
{{recommender_institution}}
{{recommender_email}}`,
    variables: [
      {
        name: "student_name",
        label: "Student Name",
        type: "text" as const,
        required: true,
        defaultValue: "",
      },
      {
        name: "position",
        label: "Position",
        type: "text" as const,
        required: true,
      },
      {
        name: "company",
        label: "Company",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_title",
        label: "Recommender Title",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_institution",
        label: "Recommender Institution",
        type: "text" as const,
        required: true,
      },
      {
        name: "duration_known",
        label: "Duration Known",
        type: "text" as const,
        required: true,
      },
      {
        name: "student_pronoun",
        label: "Student Pronoun",
        type: "select" as const,
        required: true,
        options: ["he", "she", "they"],
      },
      {
        name: "student_object",
        label: "Student Object Pronoun",
        type: "select" as const,
        required: true,
        options: ["him", "her", "them"],
      },
      {
        name: "project_experience",
        label: "Project Experience",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "project_name",
        label: "Project Name",
        type: "text" as const,
        required: true,
      },
      {
        name: "responsibilities",
        label: "Responsibilities",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "achievement",
        label: "Achievement",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "code_quality_description",
        label: "Code Quality",
        type: "text" as const,
        required: true,
      },
      {
        name: "best_practices",
        label: "Best Practices",
        type: "text" as const,
        required: true,
      },
      {
        name: "technical_skills",
        label: "Technical Skills",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "specific_technologies",
        label: "Specific Technologies",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "unique_strength",
        label: "Unique Strength",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "soft_skill_1",
        label: "Soft Skill 1",
        type: "text" as const,
        required: true,
      },
      {
        name: "soft_skill_2",
        label: "Soft Skill 2",
        type: "text" as const,
        required: true,
      },
      {
        name: "teamwork_example",
        label: "Teamwork Example",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "recommender_name",
        label: "Recommender Name",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_department",
        label: "Recommender Department",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_email",
        label: "Recommender Email",
        type: "text" as const,
        required: true,
      },
    ],
    targetProgramType: "job" as const,
    targetRegion: "global" as const,
    isSystemTemplate: true,
    isActive: true,
  },
  {
    id: "tpl_general_balanced",
    name: "General Balanced Recommendation",
    description: "A balanced template suitable for various purposes",
    category: "general" as const,
    content: `[Date]

To Whom It May Concern,

I am pleased to recommend {{student_name}} for {{purpose}} at {{target_institution}}. I have known {{student_name}} for {{duration_known}} in my capacity as {{recommender_title}} at {{recommender_institution}}.

During our time working together, {{student_name}} has consistently demonstrated {{key_strength_1}} and {{key_strength_2}}. {{student_pronoun}} approached {{context}} with {{approach_quality}}, resulting in {{outcome}}.

{{student_name}} possesses {{quality_1}}, {{quality_2}}, and {{quality_3}}. {{specific_example}}. These qualities, combined with {{student_pronoun}} {{additional_skill}}, make {{student_object}} well-suited for {{opportunity}}.

I am confident that {{student_name}} will be an asset to {{target_institution}} and recommend {{student_object}} without reservation.

Sincerely,

{{recommender_name}}
{{recommender_title}}
{{recommender_institution}}
{{recommender_email}}`,
    variables: [
      {
        name: "student_name",
        label: "Student Name",
        type: "text" as const,
        required: true,
        defaultValue: "",
      },
      {
        name: "purpose",
        label: "Purpose",
        type: "text" as const,
        required: true,
      },
      {
        name: "target_institution",
        label: "Target Institution",
        type: "text" as const,
        required: true,
      },
      {
        name: "duration_known",
        label: "Duration Known",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_title",
        label: "Recommender Title",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_institution",
        label: "Recommender Institution",
        type: "text" as const,
        required: true,
      },
      {
        name: "student_pronoun",
        label: "Student Pronoun",
        type: "select" as const,
        required: true,
        options: ["he", "she", "they"],
      },
      {
        name: "student_object",
        label: "Student Object Pronoun",
        type: "select" as const,
        required: true,
        options: ["him", "her", "them"],
      },
      {
        name: "key_strength_1",
        label: "Key Strength 1",
        type: "text" as const,
        required: true,
      },
      {
        name: "key_strength_2",
        label: "Key Strength 2",
        type: "text" as const,
        required: true,
      },
      {
        name: "context",
        label: "Context",
        type: "text" as const,
        required: true,
      },
      {
        name: "approach_quality",
        label: "Approach/Quality",
        type: "text" as const,
        required: true,
      },
      {
        name: "outcome",
        label: "Outcome",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "quality_1",
        label: "Quality 1",
        type: "text" as const,
        required: true,
      },
      {
        name: "quality_2",
        label: "Quality 2",
        type: "text" as const,
        required: true,
      },
      {
        name: "quality_3",
        label: "Quality 3",
        type: "text" as const,
        required: true,
      },
      {
        name: "specific_example",
        label: "Specific Example",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "additional_skill",
        label: "Additional Skill",
        type: "text" as const,
        required: true,
      },
      {
        name: "opportunity",
        label: "Opportunity",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_name",
        label: "Recommender Name",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_email",
        label: "Recommender Email",
        type: "text" as const,
        required: true,
      },
    ],
    targetProgramType: "any" as const,
    targetRegion: "global" as const,
    isSystemTemplate: true,
    isActive: true,
  },
  {
    id: "tpl_us_style",
    name: "US-Style Formal Recommendation",
    description: "Formal, detailed recommendation following US conventions",
    category: "country_specific" as const,
    content: `[Date]

{{target_admissions_committee}}
{{target_institution}}
{{target_department}} - {{target_program}}

RE: Letter of Recommendation for {{student_name}}

Dear {{target_admissions_committee}},

It is my distinct pleasure to provide this letter of recommendation for {{student_name}} in support of {{student_pronoun}} application to the {{target_program}} at {{target_institution}}. I have known {{student_name}} since {{when_met}} in my capacity as {{recommender_title}} at {{recommender_institution}}, and I am delighted to recommend {{student_object}} without reservation.

Academic Excellence
{{student_name}} has consistently demonstrated outstanding academic ability. {{student_pronoun}} has maintained a GPA of {{student_gpa}} while completing a rigorous curriculum that included {{challenging_courses}}. In my {{course_name}} course, {{student_pronoun}} earned a {{grade}}, placing {{student_object}} in the top {{top_percent}} of the class. {{student_pronoun}} particular strength in {{subject_area}} was evident through {{specific_evidence}}.

Research and Project Experience
{{student_name}} has demonstrated exceptional research capability through {{research_experience}}. Under my supervision, {{student_pronoun}} worked on {{project_description}}, where {{student_pronoun}} {{contribution}}. This work demonstrated {{student_pronoun}} ability to {{skill_demonstrated}} and resulted in {{outcome}}.

Personal Qualities and Character
Beyond {{student_pronoun}} academic and technical abilities, {{student_name}} possesses the personal qualities that predict success at the graduate level. {{student_pronoun}} is {{quality_1}}, {{quality_2}}, and {{quality_3}}. I have been particularly impressed by {{student_pronoun}} {{specific_quality}}. {{anecdote}}.

Fit for the Program
{{student_name}}'s research interests in {{research_interests}} align closely with the strengths of your program. I am confident that {{student_pronoun}} will thrive in your academic community and make meaningful contributions to {{field}}. {{student_pronoun}} background in {{background_area}} has prepared {{student_object}} well for the challenges of graduate study.

Conclusion
I strongly recommend {{student_name}} for admission to your {{target_program}}. {{student_pronoun}} represents the very best of our student body and has the intellectual curiosity, technical skills, and personal qualities to succeed at the highest level. I expect {{student_object}} to develop into an outstanding {{professional_role}}.

Please do not hesitate to contact me if you require any additional information.

Sincerely,

{{signature}}

{{recommender_name}}, {{recommender_title}}
{{recommender_department}}
{{recommender_institution}}
{{recommender_email}}
{{recommender_phone}}`,
    variables: [
      {
        name: "target_admissions_committee",
        label: "Admissions Committee",
        type: "text" as const,
        required: true,
      },
      {
        name: "target_institution",
        label: "Target Institution",
        type: "text" as const,
        required: true,
      },
      {
        name: "target_department",
        label: "Target Department",
        type: "text" as const,
        required: true,
      },
      {
        name: "target_program",
        label: "Target Program",
        type: "text" as const,
        required: true,
      },
      {
        name: "student_name",
        label: "Student Name",
        type: "text" as const,
        required: true,
        defaultValue: "",
      },
      {
        name: "student_pronoun",
        label: "Student Pronoun",
        type: "select" as const,
        required: true,
        options: ["he", "she", "they"],
      },
      {
        name: "student_object",
        label: "Student Object Pronoun",
        type: "select" as const,
        required: true,
        options: ["him", "her", "them"],
      },
      {
        name: "when_met",
        label: "When You Met",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_title",
        label: "Recommender Title",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_institution",
        label: "Recommender Institution",
        type: "text" as const,
        required: true,
      },
      {
        name: "student_gpa",
        label: "Student GPA",
        type: "text" as const,
        required: false,
      },
      {
        name: "challenging_courses",
        label: "Challenging Courses",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "course_name",
        label: "Course Name",
        type: "text" as const,
        required: false,
      },
      {
        name: "grade",
        label: "Grade",
        type: "text" as const,
        required: false,
      },
      {
        name: "top_percent",
        label: "Top Percent",
        type: "text" as const,
        required: true,
      },
      {
        name: "subject_area",
        label: "Subject Area",
        type: "text" as const,
        required: false,
      },
      {
        name: "specific_evidence",
        label: "Specific Evidence",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "research_experience",
        label: "Research Experience",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "project_description",
        label: "Project Description",
        type: "textarea" as const,
        required: false,
      },
      {
        name: "contribution",
        label: "Contribution",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "skill_demonstrated",
        label: "Skill Demonstrated",
        type: "text" as const,
        required: false,
      },
      {
        name: "outcome",
        label: "Outcome",
        type: "textarea" as const,
        required: true,
      },
      {
        name: "quality_1",
        label: "Quality 1",
        type: "text" as const,
        required: true,
      },
      {
        name: "quality_2",
        label: "Quality 2",
        type: "text" as const,
        required: true,
      },
      {
        name: "quality_3",
        label: "Quality 3",
        type: "text" as const,
        required: true,
      },
      {
        name: "specific_quality",
        label: "Specific Quality",
        type: "text" as const,
        required: true,
      },
      {
        name: "anecdote",
        label: "Anecdote",
        type: "textarea" as const,
        required: false,
      },
      {
        name: "research_interests",
        label: "Research Interests",
        type: "textarea" as const,
        required: false,
      },
      {
        name: "field",
        label: "Field",
        type: "text" as const,
        required: true,
      },
      {
        name: "background_area",
        label: "Background Area",
        type: "text" as const,
        required: true,
      },
      {
        name: "professional_role",
        label: "Professional Role",
        type: "text" as const,
        required: true,
      },
      {
        name: "signature",
        label: "Signature",
        type: "text" as const,
        required: false,
        description: "Optional signature text",
      },
      {
        name: "recommender_name",
        label: "Recommender Name",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_department",
        label: "Recommender Department",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_email",
        label: "Recommender Email",
        type: "text" as const,
        required: true,
      },
      {
        name: "recommender_phone",
        label: "Recommender Phone",
        type: "text" as const,
        required: true,
      },
    ],
    targetProgramType: "any" as const,
    targetRegion: "us" as const,
    isSystemTemplate: true,
    isActive: true,
  },
];

export async function seedRecommendationTemplates() {
  const existing = await db
    .select({ id: recommendationTemplate.id })
    .from(recommendationTemplate);

  if (existing.length > 0) {
    console.log("Recommendation templates already seeded, skipping...");
    return;
  }

  await db.insert(recommendationTemplate).values(recommendationTemplates);
  console.log(
    `✓ Seeded ${recommendationTemplates.length} recommendation templates`,
  );
}

await seedRecommendationTemplates();
