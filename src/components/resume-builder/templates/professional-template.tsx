import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

interface ProfessionalTemplateProps {
  resumeData?: ResumeData;
}

export function ProfessionalTemplate({
  resumeData,
}: ProfessionalTemplateProps) {
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

  return (
    <div
      className="box-border min-h-[297mm] w-full bg-white p-12"
      style={{
        fontFamily: "Arial, sans-serif",
        color: "#333",
        lineHeight: "1.6",
      }}
    >
      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="mb-2 font-extrabold text-4xl text-gray-900 uppercase tracking-wider">
          {profile?.firstName} {profile?.lastName}
        </h1>
        {profile?.summary && null}

        {/* Contact Info Row */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 font-medium text-gray-600 text-sm">
          {profile?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 fill-current" />
              <span>{profile.phone}</span>
            </div>
          )}
          {profile?.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 fill-current" />
              <span>{profile.email}</span>
            </div>
          )}
          {formatAddress() && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 fill-current" />
              <span>{formatAddress()}</span>
            </div>
          )}
          {(profile?.web || profile?.linkedIn || profile?.github) && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 fill-current" />
              <span className="flex gap-3">
                {profile?.web && (
                  <a
                    href={profile.web}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    Website
                  </a>
                )}
                {profile?.linkedIn && (
                  <a
                    href={profile.linkedIn}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
                {profile?.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    GitHub
                  </a>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Main Header Divider */}
        <div className="mt-8 w-full border-gray-300 border-b"></div>
      </header>

      {/* About Me */}
      {profile?.summary && (
        <section className="mb-8">
          <h2 className="mb-3 border-gray-300 border-b pb-2 font-bold text-gray-800 text-xl uppercase tracking-widest">
            About Me
          </h2>
          <p className="text-justify text-gray-600 text-sm leading-relaxed">
            {profile.summary}
          </p>
        </section>
      )}

      {/* Education */}
      {resumeData?.educationRecords &&
        resumeData.educationRecords.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-6 border-gray-300 border-b pb-2 font-bold text-gray-800 text-xl uppercase tracking-widest">
              Education
            </h2>
            <div className="space-y-6">
              {resumeData.educationRecords.map((edu, index) => (
                <div key={index}>
                  {/* Meta Row: University | Date */}
                  <div className="mb-1 font-medium text-gray-500 text-sm">
                    {edu.institution || "University Name"}{" "}
                    <span className="mx-1 text-gray-300">|</span>{" "}
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </div>
                  {/* Title Row: Degree */}
                  <h3 className="mb-2 font-bold text-gray-800 text-lg">
                    {edu.qualification || "Degree"}{" "}
                    {edu.degreeLevel ? `— ${edu.degreeLevel}` : ""}
                  </h3>
                  {/* Description */}
                  {edu.description && (
                    <p className="text-justify text-gray-600 text-sm">
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Work Experience */}
      {resumeData?.workExperiences && resumeData.workExperiences.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-6 border-gray-300 border-b pb-2 font-bold text-gray-800 text-xl uppercase tracking-widest">
            Work Experience
          </h2>
          <div className="space-y-6">
            {resumeData.workExperiences.map((exp, index) => (
              <div key={index}>
                {/* Meta Row: Company | Date */}
                <div className="mb-1 font-medium text-gray-500 text-sm">
                  {exp.employer || "Company Name"}{" "}
                  <span className="mx-1 text-gray-300">|</span>{" "}
                  {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                </div>
                {/* Title Row: Job Title */}
                <h3 className="mb-2 font-bold text-gray-800 text-lg">
                  {exp.jobTitle || "Job Title"}
                </h3>
                {/* Description */}
                {exp.description && (
                  <p className="whitespace-pre-line text-justify text-gray-600 text-sm">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {resumeData?.userSkills && resumeData.userSkills.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-6 border-gray-300 border-b pb-2 font-bold text-gray-800 text-xl uppercase tracking-widest">
            Skills
          </h2>
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            {resumeData.userSkills.flatMap((group) =>
              group.skills.map((skill) => (
                <div key={skill.name} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-800"></span>
                  <span className="font-medium text-gray-700 text-sm">
                    {skill.name}
                  </span>
                </div>
              )),
            )}
          </div>
        </section>
      )}

      {/* Other Sections (Projects, Certifications) - Styled consistently */}
      {resumeData?.projectRecords && resumeData.projectRecords.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-6 border-gray-300 border-b pb-2 font-bold text-gray-800 text-xl uppercase tracking-widest">
            Projects
          </h2>
          <div className="space-y-6">
            {resumeData.projectRecords.map((proj, index) => (
              <div key={index}>
                <h3 className="mb-1 font-bold text-gray-800 text-lg">
                  {proj.name}
                </h3>
                <div className="mb-2 font-medium text-gray-500 text-sm">
                  {proj.role ? `${proj.role} • ` : ""}
                  {formatDate(proj.startDate)} - {formatDate(proj.endDate)}
                </div>
                {proj.description && (
                  <p className="whitespace-pre-line text-justify text-gray-600 text-sm">
                    {proj.description}
                  </p>
                )}
                {proj.referenceLink && (
                  <a
                    href={proj.referenceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-blue-600 text-xs hover:underline"
                  >
                    View Project
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
