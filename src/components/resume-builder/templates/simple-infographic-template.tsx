import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

interface SimpleInfographicTemplateProps {
  resumeData?: ResumeData;
}

export function SimpleInfographicTemplate({
  resumeData,
}: SimpleInfographicTemplateProps) {
  const profile = resumeData?.profile;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", { month: "short", year: "numeric" });
  };

  const formatAddress = () => {
    const addr = profile?.address;
    if (!addr) return null;
    const parts = [addr.city, addr.state].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const contactParts = [
    formatAddress(),
    profile?.email,
    profile?.phone,
    profile?.web?.replace(/^https?:\/\//, ""),
  ].filter(Boolean);

  return (
    <div
      className="relative min-h-[297mm] w-full bg-white p-10 text-gray-800"
      style={{
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Import Poppins Font */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');`}
      </style>

      {/* Header */}
      <header className="mb-8">
        <h1 className="mb-1 font-bold text-4xl text-gray-800 uppercase">
          {profile?.firstName} {profile?.lastName}
        </h1>
        <h2 className="mb-2 font-bold text-gray-700 text-xl uppercase">
          {resumeData?.workExperiences?.[0]?.jobTitle || "Professional Title"}
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-gray-600 text-sm">
          {contactParts.map((part, index) => (
            <span key={index} className="flex items-center">
              {part}
              {index < contactParts.length - 1 && (
                <span className="mx-2 text-gray-400">|</span>
              )}
            </span>
          ))}
        </div>
      </header>

      <div className="space-y-6">
        {/* Summary */}
        {profile?.summary && (
          <section>
            <div className="mb-3 rounded-full bg-gray-200 px-6 py-1.5">
              <h3 className="font-bold text-gray-700 text-sm uppercase italic tracking-wide">
                Summary
              </h3>
            </div>
            <p className="text-justify text-gray-700 text-sm leading-6">
              {profile.summary}
            </p>
          </section>
        )}

        {/* Technical Skills - 3 Column Grid */}
        {resumeData?.userSkills && resumeData.userSkills.length > 0 && (
          <section>
            <div className="mb-3 rounded-full bg-gray-200 px-6 py-1.5">
              <h3 className="font-bold text-gray-700 text-sm uppercase italic tracking-wide">
                Technical Skills
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-gray-700 text-sm">
              {resumeData.userSkills
                .flatMap((group) => group.skills)
                .map((skill, idx) => (
                  <div key={idx} className="font-medium">
                    {skill.name}
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Professional Experience */}
        {resumeData?.workExperiences &&
          resumeData.workExperiences.length > 0 && (
            <section>
              <div className="mb-4 rounded-full bg-gray-200 px-6 py-1.5">
                <h3 className="font-bold text-gray-700 text-sm uppercase italic tracking-wide">
                  Professional Experience
                </h3>
              </div>
              <div className="space-y-5">
                {resumeData.workExperiences.map((exp, idx) => (
                  <div key={idx}>
                    <div className="mb-1 flex items-baseline justify-between">
                      <h4 className="font-bold text-gray-800 text-sm">
                        {exp.employer}
                        {/*, {exp.location}*/}
                        <span className="ml-1 font-normal text-gray-600 italic">
                          {" "}
                          - {exp.jobTitle}
                        </span>
                      </h4>
                      <span className="whitespace-nowrap font-bold text-gray-600 text-xs">
                        {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                      </span>
                    </div>

                    {exp.description && (
                      <div className="mt-1 text-justify text-gray-700 text-sm leading-relaxed">
                        {/* Handle potential bullet points manually if simple string, or just display */}
                        <ul className="ml-5 list-outside list-disc space-y-1">
                          {/* Naive split by newline for bullets if needed, or just block text if it's a paragraph */}
                          {exp.description.includes("\n") ||
                          exp.description.includes("•") ? (
                            exp.description.split("\n").map((line, i) => {
                              const cleanLine = line
                                .replace(/^[•-]\s*/, "")
                                .trim();
                              if (!cleanLine) return null;
                              return <li key={i}>{cleanLine}</li>;
                            })
                          ) : (
                            <li>{exp.description}</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* Education */}
        {resumeData?.educationRecords &&
          resumeData.educationRecords.length > 0 && (
            <section>
              <div className="mb-4 rounded-full bg-gray-200 px-6 py-1.5">
                <h3 className="font-bold text-gray-700 text-sm uppercase italic tracking-wide">
                  Education
                </h3>
              </div>
              <div className="space-y-4">
                {resumeData.educationRecords.map((edu, idx) => (
                  <div key={idx}>
                    <div className="mb-1 flex items-baseline justify-between">
                      <h4 className="font-bold text-gray-800 text-sm">
                        {edu.degreeLevel && <span>{edu.degreeLevel} in </span>}
                        {edu.qualification}
                      </h4>
                      <span className="whitespace-nowrap font-bold text-gray-600 text-xs">
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </span>
                    </div>
                    <div className="text-gray-700 text-sm italic">
                      {edu.institution}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* Additional Information (Languages, Certifications, Awards) */}
        <section>
          <div className="mb-3 rounded-full bg-gray-200 px-6 py-1.5">
            <h3 className="font-bold text-gray-700 text-sm uppercase italic tracking-wide">
              Additional Information
            </h3>
          </div>
          <div className="space-y-2 text-gray-700 text-sm">
            {resumeData?.languageSkills &&
              resumeData.languageSkills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="font-bold text-gray-800">Languages:</span>
                  {resumeData.languageSkills.map((lang, idx) => (
                    <span key={idx}>
                      {lang.language}
                      {idx < (resumeData.languageSkills?.length ?? 0) - 1
                        ? ", "
                        : "."}
                    </span>
                  ))}
                </div>
              )}

            {resumeData?.certificationsRecords &&
              resumeData.certificationsRecords.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-gray-800">
                    Certifications:
                  </span>
                  <div className="flex flex-wrap gap-x-2">
                    {resumeData.certificationsRecords.map((cert, idx) => (
                      <span key={idx}>
                        {cert.name}
                        {cert.issuer ? ` (${cert.issuer})` : ""}
                        {idx <
                        (resumeData.certificationsRecords?.length ?? 0) - 1
                          ? ", "
                          : "."}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Awards / Leadership blended if needed, or just leadership sections */}
            {resumeData?.positionsOfResponsibilityRecords &&
              resumeData.positionsOfResponsibilityRecords.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  <span className="font-bold text-gray-800">
                    Leadership & Activities:
                  </span>
                  <ul className="list-inside list-disc">
                    {resumeData.positionsOfResponsibilityRecords.map(
                      (pos, idx) => (
                        <li key={idx}>
                          <span className="font-medium">{pos.name}</span>:{" "}
                          {pos.description} ({formatDate(pos.startDate)} -{" "}
                          {formatDate(pos.endDate)})
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
          </div>
        </section>
      </div>
    </div>
  );
}
