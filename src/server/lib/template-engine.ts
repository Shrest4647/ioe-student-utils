import type { TemplateVariable } from "../db/types/recommendation";

export interface TemplateContext {
  // Built-in variables
  user?: {
    name?: string;
    email?: string;
  };
  current_date?: string;
  current_year?: string;

  // All other variables from the template
  [key: string]: string | undefined | { name?: string; email?: string };
}

/**
 * Replaces variables in a template string with values from the context
 *
 * @param template - The template string with {{variable}} placeholders
 * @param context - Object containing variable values
 * @returns The template with variables replaced
 */
export function replaceTemplateVariables(
  template: string,
  context: TemplateContext,
): string {
  let result = template;

  // Handle built-in variables
  const currentDate = new Date();
  const defaultContext: TemplateContext = {
    current_date: currentDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    current_year: currentDate.getFullYear().toString(),
    user: {
      name: context.user?.name || "[Student Name]",
      email: context.user?.email || "",
    },
    ...context,
  };

  // Replace all {{variable}} placeholders
  result = result.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    // Handle nested properties like {{user.name}}
    if (variableName.includes("_")) {
      const parts = variableName.split("_");
      if (parts[0] === "user" && parts.length > 1) {
        const userKey = parts.slice(1).join("_");
        return defaultContext.user?.[userKey as keyof typeof defaultContext.user] ||
          match;
      }
    }

    // Handle simple variables
    const value = defaultContext[variableName];
    if (value !== undefined && value !== null) {
      return value;
    }

    // Return original if not found
    return match;
  });

  return result;
}

/**
 * Validates that all required variables are present in the context
 *
 * @param variables - Array of variable definitions from the template
 * @param context - Object containing variable values
 * @returns Array of missing required variable names
 */
export function validateRequiredVariables(
  variables: TemplateVariable[],
  context: TemplateContext,
): string[] {
  const missing: string[] = [];

  for (const variable of variables) {
    if (!variable.required) continue;

    // Check if variable has a value
    const value = context[variable.name];
    if (!value || value.trim() === "") {
      // Check if there's a default value
      if (variable.defaultValue && variable.defaultValue.trim() !== "") {
        continue;
      }
      missing.push(variable.label);
    }
  }

  return missing;
}

/**
 * Extracts variable names from a template string
 *
 * @param template - The template string with {{variable}} placeholders
 * @returns Array of unique variable names found in the template
 */
export function extractVariablesFromTemplate(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  const variables = new Set<string>();

  for (const match of matches) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

/**
 * Generates default context values from template variables
 *
 * @param variables - Array of variable definitions from the template
 * @param user - Optional user object for pre-filling
 * @returns Object with default values for all variables
 */
export function generateDefaultContext(
  variables: TemplateVariable[],
  user?: { name?: string; email?: string },
): TemplateContext {
  const context: TemplateContext = {
    user,
  };

  for (const variable of variables) {
    if (variable.defaultValue) {
      // Handle default values that reference {{user.name}} etc.
      context[variable.name] = replaceTemplateVariables(
        variable.defaultValue,
        { user },
      );
    }
  }

  return context;
}

/**
 * Pre-fills template context with user profile data
 *
 * @param context - The current template context
 * @param profileData - User profile data from student_profile_data table
 * @returns Enhanced context with profile data
 */
export function preFillWithProfileData(
  context: TemplateContext,
  profileData: {
    gpa?: string | null;
    major?: string | null;
    minor?: string | null;
    expectedGraduation?: string | null;
    researchInterests?: string | null;
    skills?: string | null;
    achievements?: string | null;
    projects?: string | null;
    workExperience?: string | null;
    extracurricular?: string | null;
    careerGoals?: string | null;
  },
): TemplateContext {
  return {
    ...context,
    student_gpa: profileData.gpa || context.student_gpa,
    major: profileData.major || context.major,
    minor: profileData.minor || context.minor,
    expected_graduation: profileData.expectedGraduation || context.expected_graduation,
    research_interests: profileData.researchInterests || context.research_interests,
    skills: profileData.skills || context.skills,
    achievements: profileData.achievements || context.achievements,
    projects: profileData.projects || context.projects,
    work_experience: profileData.workExperience || context.work_experience,
    extracurricular: profileData.extracurricular || context.extracurricular,
    career_goals: profileData.careerGoals || context.career_goals,
  };
}
