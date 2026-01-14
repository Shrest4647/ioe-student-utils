import { FileText, Globe, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

interface ClassicTemplateProps {
  resumeData?: ResumeData;
}

export function ClassicTemplate({ resumeData }: ClassicTemplateProps) {
  const profile = resumeData?.profile;

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

  const toSentenceCase = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  if (!profile) {
    return (
      <div className="flex min-h-96 items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No profile data yet.</p>
          <p className="text-sm">Complete your profile to see the preview.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white p-8"
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "10pt",
        lineHeight: "1.3",
        color: "#000000",
        minHeight: "297mm", // A4 height
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div className="mb-6 border-gray-800 border-b-2 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="mb-1 font-bold text-3xl uppercase tracking-tight">
              {profile?.firstName} {profile?.lastName}
            </h1>

            {/* Contact Information */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-700 text-sm">
              {profile?.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{profile.email}</span>
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {formatAddress() && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{formatAddress()}</span>
                </div>
              )}
              {(profile?.linkedIn || profile?.github || profile?.web) && (
                <div className="flex items-center gap-4">
                  {profile.linkedIn && (
                    <a
                      href={profile.linkedIn}
                      className="flex items-center gap-1 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-3 w-3" />
                      LinkedIn
                    </a>
                  )}
                  {profile.github && (
                    <a
                      href={profile.github}
                      className="flex items-center gap-1 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-3 w-3" />
                      GitHub
                    </a>
                  )}
                  {profile.web && (
                    <a
                      href={profile.web}
                      className="flex items-center gap-1 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-3 w-3" />
                      Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Photo */}
          {profile?.photoUrl && (
            <div className="ml-4">
              <Image
                width={120}
                height={120}
                src={profile.photoUrl}
                alt="Profile"
                className="h-24 w-24 rounded-full border border-gray-200 object-cover"
              />
            </div>
          )}
        </div>

        {/* Professional Summary */}
        {profile?.summary && (
          <div className="mt-4 text-justify text-sm leading-relaxed">
            <p>{profile.summary}</p>
          </div>
        )}
      </div>

      {/* Work Experience */}
      {resumeData?.workExperiences && resumeData.workExperiences.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 border-gray-400 border-b pb-1 font-bold text-gray-800 text-lg uppercase tracking-wider">
            Work Experience
          </h2>
          <div className="space-y-4">
            {resumeData.workExperiences.map((exp, index) => (
              <div key={index}>
                <div className="mb-1 flex items-baseline justify-between">
                  <h3 className="font-bold text-md">
                    {exp.jobTitle || "Position"}
                  </h3>
                  <span className="ml-4 whitespace-nowrap font-medium text-gray-600 text-sm">
                    {formatDate(exp.startDate)} – {formatDate(exp.endDate)}
                  </span>
                </div>

                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700 italic">
                    {exp.employer || "Employer"}
                  </span>
                  <span className="text-gray-600">
                    {[exp.city, exp.country].filter(Boolean).join(", ")}
                  </span>
                </div>

                {exp.description && (
                  <p className="whitespace-pre-line text-justify text-sm leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resumeData?.educationRecords &&
        resumeData.educationRecords.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 border-gray-400 border-b pb-1 font-bold text-gray-800 text-lg uppercase tracking-wider">
              Education
            </h2>
            <div className="space-y-3">
              {resumeData.educationRecords.map((edu, index) => (
                <div key={index}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <h3 className="font-bold text-md">
                      {edu.institution || "Institution"}
                    </h3>
                    <span className="ml-4 whitespace-nowrap font-medium text-gray-600 text-sm">
                      {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                    </span>
                  </div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-gray-700 italic">
                      {edu.qualification || "Qualification"}{" "}
                      {edu.degreeLevel ? `- ${edu.degreeLevel}` : ""}
                    </span>
                  </div>

                  {(edu.grade || edu.gradeType) && (
                    <p className="text-gray-600 text-sm">
                      Grade: {edu.grade}
                      {edu.gradeType && ` (${edu.gradeType})`}
                    </p>
                  )}
                  {edu.description && (
                    <p className="whitespace-pre-line text-justify text-sm">
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Skills */}
      {resumeData?.userSkills && resumeData.userSkills.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 border-gray-400 border-b pb-1 font-bold text-gray-800 text-lg uppercase tracking-wider">
            Skills
          </h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {resumeData.userSkills.map((skillGroup, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 sm:flex-row sm:items-baseline"
              >
                <h4 className="min-w-[120px] font-bold text-gray-800 text-sm">
                  {toSentenceCase(skillGroup.category)}:
                </h4>
                <div className="flex-1 text-gray-700 text-sm">
                  {skillGroup.skills.map((s) => s.name).join(", ")}
                </div>
              </div>
            ))}
            {/* Include Language Skills here if exists for compactness */}
            {resumeData?.languageSkills &&
              resumeData.languageSkills.length > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline">
                  <h4 className="min-w-[120px] font-bold text-gray-800 text-sm">
                    Languages:
                  </h4>
                  <div className="flex-1 text-gray-700 text-sm">
                    {resumeData.languageSkills
                      .map((l) => l.language)
                      .join(", ")}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Projects */}
      {resumeData?.projectRecords && resumeData.projectRecords.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 border-gray-400 border-b pb-1 font-bold text-gray-800 text-lg uppercase tracking-wider">
            Projects
          </h2>
          <div className="space-y-3">
            {resumeData.projectRecords.map((project, index) => (
              <div key={index}>
                <div className="mb-1 flex items-baseline justify-between">
                  <h3 className="font-bold text-md">
                    {project.name || "Project"}
                  </h3>
                  <span className="ml-4 whitespace-nowrap font-medium text-gray-600 text-sm">
                    {formatDate(project.startDate)} –{" "}
                    {formatDate(project.endDate)}
                  </span>
                </div>
                {project.role && (
                  <p className="mb-1 text-gray-700 text-sm italic">
                    {project.role}
                  </p>
                )}

                {project.description && (
                  <p className="whitespace-pre-line text-justify text-sm">
                    {project.description}
                  </p>
                )}
                {project.referenceLink && (
                  <a
                    href={project.referenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-blue-700 text-sm hover:underline"
                  >
                    Link: {project.referenceLink}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions of Responsibility */}
      {resumeData?.positionsOfResponsibilityRecords &&
        resumeData.positionsOfResponsibilityRecords.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 border-gray-400 border-b pb-1 font-bold text-gray-800 text-lg uppercase tracking-wider">
              Positions of Responsibility
            </h2>
            <div className="space-y-3">
              {resumeData.positionsOfResponsibilityRecords.map((pos, index) => (
                <div key={index}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <h3 className="font-bold text-md">
                      {pos.name || "Position"}
                    </h3>
                    <span className="ml-4 whitespace-nowrap font-medium text-gray-600 text-sm">
                      {formatDate(pos.startDate)} – {formatDate(pos.endDate)}
                    </span>
                  </div>

                  {pos.description && (
                    <p className="whitespace-pre-line text-justify text-sm">
                      {pos.description}
                    </p>
                  )}
                  {pos.referenceLink && (
                    <a
                      href={pos.referenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-blue-700 text-sm hover:underline"
                    >
                      Link: {pos.referenceLink}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Certifications */}
      {resumeData?.certificationsRecords &&
        resumeData.certificationsRecords.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 border-gray-400 border-b pb-1 font-bold text-gray-800 text-lg uppercase tracking-wider">
              Certifications
            </h2>
            <div className="space-y-2">
              {resumeData.certificationsRecords.map((cert, index) => (
                <div
                  key={index}
                  className="flex items-baseline justify-between"
                >
                  <div>
                    <span className="font-semibold text-sm">{cert.name}</span>
                    {cert.issuer && (
                      <span className="text-gray-600 text-sm">
                        {" "}
                        - {cert.issuer}
                      </span>
                    )}
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-blue-700 text-xs hover:underline"
                      >
                        [View]
                      </a>
                    )}
                  </div>
                  {cert.issueDate && (
                    <span className="ml-4 whitespace-nowrap text-gray-600 text-sm">
                      {formatDate(cert.issueDate)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
