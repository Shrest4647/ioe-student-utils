export type SourceFormat = "percentage" | "gpa" | "cgpa";

export type DestinationId =
  | "us-canada"
  | "germany"
  | "uk"
  | "australia"
  | "india"
  | "europe"
  | "japan"
  | "south-korea"
  | "norway"
  | "denmark"
  | "finland"
  | "ireland"
  | "france"
  | "spain"
  | "singapore"
  | "malaysia"
  | "china"
  | "portugal";

export interface GradeCourse {
  name: string;
  score: number;
  credits: number;
}

export interface ConversionSource {
  label: string;
  url: string;
}

export interface ConversionResult {
  destination: DestinationId;
  value: string;
  scale: string;
  classification: string;
  confidence: "Direct result" | "Method-based estimate" | "Planning guide";
  summary: string;
  method: string;
  nextStep: string;
  numericValue: number;
  comparisonDirection: "higher" | "lower";
  sources: ConversionSource[];
}

export const destinationOptions: Array<{
  id: DestinationId;
  label: string;
  shortLabel: string;
  description: string;
  region: "Popular" | "Europe" | "Asia Pacific";
}> = [
  {
    id: "us-canada",
    label: "United States / Canada",
    shortLabel: "US / Canada",
    description: "4.0 planning estimate",
    region: "Popular",
  },
  {
    id: "uk",
    label: "United Kingdom",
    shortLabel: "United Kingdom",
    description: "TU-specific entry context",
    region: "Popular",
  },
  {
    id: "germany",
    label: "Germany",
    shortLabel: "Germany",
    description: "Modified Bavarian formula",
    region: "Popular",
  },
  {
    id: "australia",
    label: "Australia",
    shortLabel: "Australia",
    description: "Compare your TU result directly",
    region: "Popular",
  },
  {
    id: "india",
    label: "India",
    shortLabel: "India",
    description: "Compare your TU result directly",
    region: "Popular",
  },
  {
    id: "europe",
    label: "Europe / ECTS",
    shortLabel: "Europe / ECTS",
    description: "Institution grading context",
    region: "Europe",
  },
  {
    id: "japan",
    label: "Japan",
    shortLabel: "Japan",
    description: "Commonly letter grades or 100-point marks",
    region: "Asia Pacific",
  },
  {
    id: "south-korea",
    label: "South Korea",
    shortLabel: "South Korea",
    description: "Often a 4.3 or 4.5 GPA scale",
    region: "Asia Pacific",
  },
  {
    id: "norway",
    label: "Norway",
    shortLabel: "Norway",
    description: "A–F national grading context",
    region: "Europe",
  },
  {
    id: "denmark",
    label: "Denmark",
    shortLabel: "Denmark",
    description: "Danish 7-point scale",
    region: "Europe",
  },
  {
    id: "finland",
    label: "Finland",
    shortLabel: "Finland",
    description: "Common 0–5 scale",
    region: "Europe",
  },
  {
    id: "ireland",
    label: "Ireland",
    shortLabel: "Ireland",
    description: "Percentage and honours context",
    region: "Europe",
  },
  {
    id: "france",
    label: "France",
    shortLabel: "France",
    description: "Common 0–20 scale",
    region: "Europe",
  },
  {
    id: "spain",
    label: "Spain",
    shortLabel: "Spain",
    description: "Common 0–10 scale",
    region: "Europe",
  },
  {
    id: "singapore",
    label: "Singapore",
    shortLabel: "Singapore",
    description: "Institution-specific GPA scales",
    region: "Asia Pacific",
  },
  {
    id: "malaysia",
    label: "Malaysia",
    shortLabel: "Malaysia",
    description: "Common 4.0 CGPA scale",
    region: "Asia Pacific",
  },
  {
    id: "china",
    label: "China",
    shortLabel: "China",
    description: "Percentage and institution GPA context",
    region: "Asia Pacific",
  },
  {
    id: "portugal",
    label: "Portugal",
    shortLabel: "Portugal",
    description: "National 0–20 scale",
    region: "Europe",
  },
];

const TU_GRADING_SOURCE: ConversionSource = {
  label: "Tribhuvan University semester grading guidance",
  url: "https://portal.tu.edu.np/downloads/Semester-System-Operational-Gu_2023_07_07_14_55_50.pdf",
};

const WES_SOURCE: ConversionSource = {
  label: "WES grade conversion and GPA methodology",
  url: "https://applications.wes.org/accesswes/pages/TermsConds.pdf",
};

const WES_PREVIEW_SOURCE: ConversionSource = {
  label: "WES guidance on preview versus official evaluation",
  url: "https://www.wes.org/resource-library/blog/credential-advice/helpful-tools-for-your-credential-evaluation/",
};

const GERMANY_SOURCE: ConversionSource = {
  label: "TUM modified Bavarian formula",
  url: "https://www.tum.de/en/studies/application/application-info-portal/grade-conversion-formula-for-grades-earned-outside-germany",
};

const ECTS_SOURCE: ConversionSource = {
  label: "European Commission ECTS grade-conversion guidance",
  url: "https://erasmus-plus.ec.europa.eu/cs/eche/a-common-approach-to-ects-grade-conversion-ensuring-a-fair-assessment-of-student-performance-after-study-abroad",
};

const UK_SURREY_SOURCE: ConversionSource = {
  label: "University of Surrey requirements for Nepal",
  url: "https://www.surrey.ac.uk/nepal/entry-requirements",
};

const UK_WARWICK_SOURCE: ConversionSource = {
  label: "University of Warwick requirements for Nepal",
  url: "https://warwick.ac.uk/study/international/countryinformation/southasia/nepal/",
};

const AUSTRALIA_SOURCE: ConversionSource = {
  label: "RMIT country equivalency for Nepal",
  url: "https://www.rmit.edu.au/study-with-us/international-students/apply-to-rmit-international-students/entry-requirements/country-equivalency/nepal",
};

const INDIA_SOURCE: ConversionSource = {
  label: "UGC choice-based credit system guidance",
  url: "https://www.ugc.gov.in/pdfnews/8023719_Guidelines-for-CBCS.pdf",
};

const IFMA_EQUIVALENCIES_SOURCE: ConversionSource = {
  label: "International grading-system reference",
  url: "https://foundation.ifma.org/wp-content/uploads/2019/11/International-Grade-Equivalencies.pdf",
};

const LEARNSIC_SOURCE: ConversionSource = {
  label: "Overview of grading systems around the world",
  url: "https://learnsic.com/blog/grading-systems-around-the-world",
};

const DENMARK_SOURCE: ConversionSource = {
  label: "Danish Higher Education Agency grading system",
  url: "https://ufsn.dk/english/education/the-danish-education-system/grading-system/",
};

const FINLAND_SOURCE: ConversionSource = {
  label: "University of Helsinki assessment and grading",
  url: "https://studies.helsinki.fi/instructions/article/assessment-and-grading",
};

const NORWAY_SOURCE: ConversionSource = {
  label: "Norwegian Universities and University Colleges Act",
  url: "https://lovdata.no/dokument/NLE/lov/2024-03-08-9/%C2%A711-10",
};

const SOUTH_KOREA_SOURCE: ConversionSource = {
  label: "Yonsei University grading system",
  url: "https://www.yonsei.ac.kr/en_sc/2274/subview.do",
};

const SINGAPORE_SOURCE: ConversionSource = {
  label: "National University of Singapore grading",
  url: "https://www.nus.edu.sg/registrar/academic-information-policies/academic-structure-grading",
};

const MALAYSIA_SOURCE: ConversionSource = {
  label: "University of Malaya grading scheme",
  url: "https://ebook.um.edu.my/fsss/PROSPECTUS_UG_20242025/files/basic-html/page13.html",
};

const PORTUGAL_SOURCE: ConversionSource = {
  label: "Portugal DGES national classification scale",
  url: "https://www.dges.gov.pt/pt/pagina/escala-de-classificacao-portuguesa",
};

const IRELAND_SOURCE: ConversionSource = {
  label: "QQI assessment and standards",
  url: "https://www.qqi.ie/sites/default/files/2022-09/assessment_and_standards-revised-2022.pdf",
};

const directDestinationGuides: Partial<
  Record<
    DestinationId,
    {
      classification: string;
      summary: string;
      nextStep: string;
      sources: ConversionSource[];
    }
  >
> = {
  japan: {
    classification: "Typical context: letter grades or 0–100",
    summary:
      "Japanese universities set their own international-admission equivalencies; a national TU-to-Japan formula is not available.",
    nextStep:
      "Compare your awarded TU result with the programme’s international applicant requirements.",
    sources: [IFMA_EQUIVALENCIES_SOURCE, LEARNSIC_SOURCE],
  },
  "south-korea": {
    classification: "Typical context: 4.3 or 4.5 GPA",
    summary:
      "Korean GPA scales vary by institution, so converting a TU score to one fixed Korean CGPA would be misleading.",
    nextStep:
      "Use the scale specified by the university; some institutions ask for the original transcript or an evaluator report.",
    sources: [SOUTH_KOREA_SOURCE, IFMA_EQUIVALENCIES_SOURCE],
  },
  norway: {
    classification: "Typical context: A–F (E is pass)",
    summary:
      "Norway uses A–E as passing grades and F as fail, but the admitting institution evaluates foreign results.",
    nextStep:
      "Check the programme’s country-specific admissions page and submit the original TU scale.",
    sources: [NORWAY_SOURCE, IFMA_EQUIVALENCIES_SOURCE],
  },
  denmark: {
    classification: "Typical context: −3, 00, 02, 4, 7, 10, 12",
    summary:
      "Denmark has no official conversion rules for foreign higher-education grades; the admitting institution decides.",
    nextStep:
      "Compare your TU result directly with the programme requirement unless the institution provides a conversion.",
    sources: [DENMARK_SOURCE],
  },
  finland: {
    classification: "Typical context: 0–5 (1 is pass)",
    summary:
      "Finnish grading is institution-based and is not a proportional translation of ECTS or TU percentages.",
    nextStep:
      "Use the university’s international admissions criteria and retain the grading explanation from TU.",
    sources: [FINLAND_SOURCE, IFMA_EQUIVALENCIES_SOURCE],
  },
  ireland: {
    classification: "Typical context: percentage and honours classes",
    summary:
      "Irish providers use programme and award classifications; there is no single national TU conversion table.",
    nextStep:
      "Check the exact programme’s Nepal requirements and compare your original percentage or CGPA.",
    sources: [IRELAND_SOURCE, IFMA_EQUIVALENCIES_SOURCE],
  },
  france: {
    classification: "Typical context: 0–20 (10 is commonly pass)",
    summary:
      "French institutions commonly use a 20-point scale, but foreign admissions decisions remain institution-specific.",
    nextStep:
      "Do not multiply or divide your TU score into /20 unless the admitting institution supplies that method.",
    sources: [IFMA_EQUIVALENCIES_SOURCE, LEARNSIC_SOURCE],
  },
  spain: {
    classification: "Typical context: 0–10 (5 is commonly pass)",
    summary:
      "Spain commonly uses a 10-point scale, but a simple TU percentage ÷10 is not an official equivalency.",
    nextStep:
      "Follow the programme or credential-recognition instructions for foreign degrees.",
    sources: [IFMA_EQUIVALENCIES_SOURCE, LEARNSIC_SOURCE],
  },
  singapore: {
    classification: "Typical context: institution-specific GPA",
    summary:
      "Singaporean universities define their own GPA scales and international admissions thresholds.",
    nextStep:
      "Use the target university’s application guidance rather than converting to a generic 5-point score.",
    sources: [SINGAPORE_SOURCE, IFMA_EQUIVALENCIES_SOURCE],
  },
  malaysia: {
    classification: "Typical context: 4.0 CGPA",
    summary:
      "A 4-point CGPA is common in Malaysia, but grade bands differ between universities and programmes.",
    nextStep:
      "If the form asks for CGPA, enter TU’s awarded CGPA and identify its 4.0 scale; otherwise use the original percentage.",
    sources: [MALAYSIA_SOURCE, IFMA_EQUIVALENCIES_SOURCE],
  },
  china: {
    classification: "Typical context: 0–100 or institution GPA",
    summary:
      "Chinese universities may use percentage, letter, or GPA systems, so there is no safe single national conversion.",
    nextStep:
      "Submit the TU result and grading scale requested by the specific university or scholarship body.",
    sources: [IFMA_EQUIVALENCIES_SOURCE, LEARNSIC_SOURCE],
  },
  portugal: {
    classification: "Typical context: 0–20 (10 is pass)",
    summary:
      "Portugal uses a national 0–20 classification scale, but foreign-grade recognition is not a simple linear conversion.",
    nextStep:
      "Use the target institution’s recognition process and keep the original TU result visible.",
    sources: [PORTUGAL_SOURCE, IFMA_EQUIVALENCIES_SOURCE],
  },
};

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function formatOriginalValue(score: number, sourceFormat: SourceFormat) {
  return sourceFormat === "percentage"
    ? `${round(score, 1).toFixed(1)}%`
    : score.toFixed(2);
}

function formatOriginalScale(sourceFormat: SourceFormat) {
  return sourceFormat === "percentage"
    ? "original TU result"
    : `TU ${sourceFormat === "cgpa" ? "CGPA" : "GPA"} / 4.0`;
}

function validateScore(score: number, sourceFormat: SourceFormat) {
  const maximum = sourceFormat === "percentage" ? 100 : 4;
  if (!Number.isFinite(score) || score < 0 || score > maximum) {
    throw new Error(
      sourceFormat === "percentage"
        ? "Percentage must be between 0 and 100."
        : `TU ${sourceFormat === "cgpa" ? "CGPA" : "GPA"} must be between 0 and 4.`,
    );
  }
}

function usGradePoint(score: number, passMark: number) {
  if (score < passMark) return { value: 0, grade: "F" };
  if (score >= 90) return { value: 4, grade: "A" };
  if (score >= 80) return { value: 3.67, grade: "A−" };
  if (score >= 70) return { value: 3.33, grade: "B+" };
  if (score >= 60) return { value: 3, grade: "B" };
  if (score >= 50) return { value: 2.67, grade: "B−" };
  return { value: 1, grade: "D" };
}

function ukContext(score: number) {
  if (score >= 75) return "Often 2:1 or above";
  if (score >= 65) return "Published comparisons range from 2:2 to 2:1";
  if (score >= 60) return "Accepted as 2:2 by some universities";
  return "Check the university’s Nepal requirements";
}

export function aggregateCourses(courses: GradeCourse[]) {
  if (courses.length === 0) throw new Error("Add at least one course.");

  let totalCredits = 0;
  let weightedScore = 0;

  for (const course of courses) {
    if (!Number.isFinite(course.credits) || course.credits <= 0) {
      throw new Error("Every course needs credits greater than zero.");
    }
    totalCredits += course.credits;
    weightedScore += course.score * course.credits;
  }

  return {
    score: weightedScore / totalCredits,
    totalCredits,
  };
}

export function convertTuGrade({
  score,
  sourceFormat,
  destination,
  passMark = 40,
  courses,
}: {
  score: number;
  sourceFormat: SourceFormat;
  destination: DestinationId;
  passMark?: number;
  courses?: GradeCourse[];
}): ConversionResult {
  validateScore(score, sourceFormat);

  if (sourceFormat === "percentage" && (passMark <= 0 || passMark >= 100)) {
    throw new Error("Pass mark must be between 0 and 100.");
  }

  if (destination === "us-canada") {
    if (sourceFormat !== "percentage") {
      const awardedMetric = sourceFormat === "cgpa" ? "CGPA" : "GPA";
      return {
        destination,
        value: score.toFixed(2),
        scale: "out of 4.0",
        classification: `Use the ${awardedMetric} awarded by TU`,
        confidence: "Direct result",
        summary: `Your transcript already reports a 4-point ${awardedMetric}. Re-converting it usually adds error.`,
        method: `The original TU ${awardedMetric} is preserved without conversion.`,
        nextStep: `Enter the original ${awardedMetric} in the application unless the institution asks for a credential evaluation.`,
        numericValue: score,
        comparisonDirection: "higher",
        sources: [TU_GRADING_SOURCE, WES_PREVIEW_SOURCE],
      };
    }

    let converted = usGradePoint(score, passMark);
    if (courses?.length) {
      for (const course of courses) {
        validateScore(course.score, "percentage");
        if (!Number.isFinite(course.credits) || course.credits <= 0) {
          throw new Error("Every course needs credits greater than zero.");
        }
      }
      const totalCredits = courses.reduce(
        (total, course) => total + course.credits,
        0,
      );
      const qualityPoints = courses.reduce((total, course) => {
        return (
          total + usGradePoint(course.score, passMark).value * course.credits
        );
      }, 0);
      converted = {
        value: qualityPoints / totalCredits,
        grade: "Credit-weighted estimate",
      };
    }

    const value = round(converted.value);
    return {
      destination,
      value: value.toFixed(2),
      scale: "out of 4.0",
      classification: converted.grade,
      confidence: "Method-based estimate",
      summary:
        "A planning estimate for shortlisting programmes—not an official WES or university GPA.",
      method:
        "TU’s published percentage bands are aligned to letter grades, then the standard WES letter-grade quality points are applied. Course mode is credit-weighted.",
      nextStep:
        "Check whether the application accepts your TU transcript directly or names an evaluator such as WES.",
      numericValue: value,
      comparisonDirection: "higher",
      sources: [TU_GRADING_SOURCE, WES_SOURCE, WES_PREVIEW_SOURCE],
    };
  }

  if (destination === "germany") {
    const bestGrade = sourceFormat === "percentage" ? 100 : 4;
    const lowestPass = sourceFormat === "percentage" ? passMark : 2.7;
    const isPassing = score >= lowestPass;
    const germanGrade = isPassing
      ? 1 + (3 * (bestGrade - score)) / (bestGrade - lowestPass)
      : 5;
    const value = round(germanGrade);

    return {
      destination,
      value: value.toFixed(2),
      scale: "German grade (1.0 is best)",
      classification: isPassing
        ? value <= 1.5
          ? "Very good"
          : value <= 2.5
            ? "Good"
            : value <= 3.5
              ? "Satisfactory"
              : "Sufficient"
        : "Fail",
      confidence: "Method-based estimate",
      summary:
        "Calculated with the modified Bavarian formula using the pass mark you selected.",
      method: `1 + 3 × (best grade − your grade) ÷ (best grade − lowest passing grade). Lowest passing grade: ${lowestPass}.`,
      nextStep:
        "Confirm the best grade, pass mark, and rounding rule required by the German university or uni-assist.",
      numericValue: value,
      comparisonDirection: "lower",
      sources: [GERMANY_SOURCE],
    };
  }

  if (destination === "uk") {
    return {
      destination,
      value: formatOriginalValue(score, sourceFormat),
      scale: formatOriginalScale(sourceFormat),
      classification:
        sourceFormat === "percentage"
          ? ukContext(score)
          : `Check the university’s TU ${sourceFormat === "cgpa" ? "CGPA" : "GPA"} requirement`,
      confidence: "Planning guide",
      summary:
        "UK universities publish their own TU-specific thresholds; there is no single safe national conversion.",
      method:
        "Your original result is preserved and placed beside current published TU entry comparisons.",
      nextStep:
        "Use the Nepal entry-requirements page for the exact university and programme. A 2:1 can mean 65% at one university and 75% at another.",
      numericValue: score,
      comparisonDirection: "higher",
      sources: [UK_SURREY_SOURCE, UK_WARWICK_SOURCE],
    };
  }

  if (destination === "australia") {
    return {
      destination,
      value: formatOriginalValue(score, sourceFormat),
      scale: formatOriginalScale(sourceFormat),
      classification: "Compare directly",
      confidence: "Direct result",
      summary:
        "Australian institutions commonly publish country-specific entry thresholds instead of one national GPA conversion.",
      method:
        "No synthetic 7-point GPA is created; your awarded TU result is retained.",
      nextStep:
        "Open the target university’s Nepal equivalency page and compare this result with the programme threshold.",
      numericValue: score,
      comparisonDirection: "higher",
      sources: [AUSTRALIA_SOURCE],
    };
  }

  if (destination === "india") {
    return {
      destination,
      value: formatOriginalValue(score, sourceFormat),
      scale: formatOriginalScale(sourceFormat),
      classification: "Use the awarded score",
      confidence: "Direct result",
      summary:
        "India does not use one universal percentage-to-10-point conversion across every university.",
      method:
        "Your original TU result is preserved instead of applying an unsupported ×10 or ÷9.5 shortcut.",
      nextStep:
        "Check the admitting university’s international-student rules; convert only when it supplies a formula.",
      numericValue: score,
      comparisonDirection: "higher",
      sources: [INDIA_SOURCE],
    };
  }

  const directGuide = directDestinationGuides[destination];
  if (directGuide) {
    return {
      destination,
      value: formatOriginalValue(score, sourceFormat),
      scale: formatOriginalScale(sourceFormat),
      classification: directGuide.classification,
      confidence: "Direct result",
      summary: directGuide.summary,
      method:
        "Your awarded TU result is preserved. The destination scale is shown only as context, not as a claimed equivalency.",
      nextStep: directGuide.nextStep,
      numericValue: score,
      comparisonDirection: "higher",
      sources: directGuide.sources,
    };
  }

  return {
    destination,
    value: formatOriginalValue(score, sourceFormat),
    scale: formatOriginalScale(sourceFormat),
    classification: "Use a programme grading table",
    confidence: "Direct result",
    summary:
      "ECTS measures learning workload. Modern European grade conversion uses programme-level grade distributions, not a fixed TU percentage table.",
    method:
      "The original TU result is retained; an ECTS letter grade is not invented without a cohort distribution.",
    nextStep:
      "Check the programme’s admissions page. For Germany, choose the Germany option to get a Bavarian-formula estimate.",
    numericValue: score,
    comparisonDirection: "higher",
    sources: [ECTS_SOURCE],
  };
}
