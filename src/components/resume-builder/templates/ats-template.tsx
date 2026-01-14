import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

interface AtsTemplateProps {
  resumeData?: ResumeData;
}

export function AtsTemplate({ resumeData }: AtsTemplateProps) {
  const profile = resumeData?.profile;

  if (!profile) return null;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  const formatAddress = () => {
    const addr = profile?.address;
    if (!addr) return null;
    const parts = [addr.city, addr.state, addr.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <div
      className="bg-white p-12 text-black"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "11pt",
        lineHeight: "1.3",
        minHeight: "297mm",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div className="mb-6 border-black border-b-2 pb-4 text-center">
        <h1 className="mb-2 font-bold text-2xl uppercase tracking-wide">
          {profile.firstName} {profile.lastName}
        </h1>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
          {profile.email && <span>{profile.email}</span>}
          {profile.phone && <span>{profile.phone}</span>}
          {formatAddress() && <span>{formatAddress()}</span>}
        </div>

        <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
          {profile.linkedIn && (
            <a
              href={profile.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              LinkedIn
            </a>
          )}
          {profile.github && (
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              GitHub
            </a>
          )}
          {profile.web && (
            <a
              href={profile.web}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Portfolio
            </a>
          )}
        </div>
      </div>

      {/* Summary */}
      {profile.summary && (
        <div className="mb-6">
          <h2 className="mb-2 border-black border-b pb-1 font-bold text-sm uppercase">
            Professional Summary
          </h2>
          <p className="text-justify">{profile.summary}</p>
        </div>
      )}

      {/* Skills - Top priority for ATS */}
      {resumeData?.userSkills && resumeData.userSkills.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 border-black border-b pb-1 font-bold text-sm uppercase">
            Technical Skills
          </h2>
          <div className="grid grid-cols-1 gap-y-2">
            {resumeData.userSkills.map((category, idx) => (
              <div key={idx} className="flex">
                <span className="w-40 shrink-0 font-bold">
                  {category.category}:
                </span>
                <span className="flex-1">
                  {category.skills.map((s) => s.name).join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {resumeData?.workExperiences && resumeData.workExperiences.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-4 border-black border-b pb-1 font-bold text-sm uppercase">
            Professional Experience
          </h2>
          <div className="space-y-4">
            {resumeData.workExperiences.map((exp, index) => (
              <div key={index}>
                <div className="flex items-baseline justify-between font-bold">
                  <div>
                    <span className="text-lg">{exp.jobTitle}</span>
                    {exp.employer && (
                      <span className="font-normal italic">
                        {" "}
                        | {exp.employer}
                      </span>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm">
                    {formatDate(exp.startDate)} – {formatDate(exp.endDate)}
                  </div>
                </div>
                {(exp.city || exp.country) && (
                  <div className="mb-1 text-xs italic">
                    {[exp.city, exp.country].filter(Boolean).join(", ")}
                  </div>
                )}
                {exp.description && (
                  <p className="mt-1 mb-2 whitespace-pre-line text-sm">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {resumeData?.projectRecords && resumeData.projectRecords.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-4 border-black border-b pb-1 font-bold text-sm uppercase">
            Key Projects
          </h2>
          <div className="space-y-4">
            {resumeData.projectRecords.map((project, index) => (
              <div key={index}>
                <div className="flex items-baseline justify-between font-bold">
                  <span className="text-md">{project.name}</span>
                  <div className="whitespace-nowrap text-right text-sm">
                    {formatDate(project.startDate)} –{" "}
                    {formatDate(project.endDate)}
                  </div>
                </div>
                {project.role && (
                  <div className="mb-1 text-sm italic">{project.role}</div>
                )}
                {project.description && (
                  <p className="whitespace-pre-line text-sm">
                    {project.description}
                  </p>
                )}
                {project.referenceLink && (
                  <a
                    href={project.referenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-blue-800 text-xs underline"
                  >
                    Project Link
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resumeData?.educationRecords &&
        resumeData.educationRecords.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-4 border-black border-b pb-1 font-bold text-sm uppercase">
              Education
            </h2>
            <div className="space-y-3">
              {resumeData.educationRecords.map((edu, index) => (
                <div key={index}>
                  <div className="flex items-baseline justify-between font-bold">
                    <span>{edu.institution}</span>
                    <div className="whitespace-nowrap text-right text-sm">
                      {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                    </div>
                  </div>
                  <div>
                    {edu.qualification}{" "}
                    {edu.degreeLevel ? ` - ${edu.degreeLevel}` : ""}
                  </div>
                  {edu.grade && (
                    <div className="text-sm">Grade: {edu.grade}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Certifications */}
      {resumeData?.certificationsRecords &&
        resumeData.certificationsRecords.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 border-black border-b pb-1 font-bold text-sm uppercase">
              Certifications
            </h2>
            <ul className="list-inside list-disc text-sm">
              {resumeData.certificationsRecords.map((cert, index) => (
                <li key={index}>
                  <span className="font-bold">{cert.name}</span>
                  {cert.issuer && <span> - {cert.issuer}</span>}
                  {cert.issueDate && (
                    <span> ({formatDate(cert.issueDate)})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Languages */}
      {resumeData?.languageSkills && resumeData.languageSkills.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 border-black border-b pb-1 font-bold text-sm uppercase">
            Languages
          </h2>
          <div className="text-sm">
            {resumeData.languageSkills.map((l) => l.language).join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}
