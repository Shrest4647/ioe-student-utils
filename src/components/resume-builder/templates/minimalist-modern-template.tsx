import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

interface MinimalistModernTemplateProps {
  resumeData?: ResumeData;
}

export function MinimalistModernTemplate({
  resumeData,
}: MinimalistModernTemplateProps) {
  const profile = resumeData?.profile;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.getFullYear().toString();
  };

  const _formatFullDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-US", { year: "numeric", month: "short" })
      .toUpperCase(); // Using short month for modern look
  };

  const formatAddress = () => {
    const addr = profile?.address;
    if (!addr) return null;
    const parts = [addr.city, addr.state].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <div
      className="relative min-h-[297mm] w-full bg-white text-gray-800"
      style={{
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Import Poppins Font */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');`}
      </style>

      {/* Header Section - Light Gray Top */}
      <header className="bg-[#EBEBEB] px-10 pt-12 pb-8">
        <h1 className="mb-2 font-bold text-5xl text-[#333] uppercase tracking-tight">
          {profile?.firstName} {profile?.lastName}
        </h1>
        {/* Job Title */}
        <p className="font-medium text-gray-600 text-xl uppercase tracking-wide">
          {resumeData?.workExperiences?.[0]?.jobTitle || "Professional Title"}
        </p>
      </header>

      {/* Contact Bar - Darker Gray Band */}
      <div className="flex flex-wrap justify-start gap-x-12 gap-y-2 bg-[#D1D1D1] px-10 py-4 font-medium text-gray-700 text-sm">
        {profile?.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-900" />
            <span>{profile.phone}</span>
          </div>
        )}
        {profile?.email && (
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-gray-900" />
            <span>{profile.email}</span>
          </div>
        )}
        {formatAddress() && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-900" />
            <span>{formatAddress()}</span>
          </div>
        )}
        {profile?.web && (
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-gray-900" />
            <span>{profile.web.replace(/^https?:\/\//, "")}</span>
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid min-h-[calc(297mm-180px)] grid-cols-12">
        {/* Left Column (Narrower - 4 cols) + Vertical Border on the right of it? 
            Actually, grid-cols-12. Let's do col-span-4 for left, and col-span-8 for right.
            Border will be on the right of first col.
        */}
        <div className="col-span-4 border-gray-800 border-r-2 p-8 pr-6">
          {/* Education */}
          {resumeData?.educationRecords &&
            resumeData.educationRecords.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-5 font-bold text-[#333] text-lg uppercase tracking-widest">
                  Education
                </h2>
                <div className="space-y-6">
                  {resumeData.educationRecords.map((edu, idx) => (
                    <div key={idx}>
                      <div className="font-bold text-gray-800 text-sm">
                        {edu.degreeLevel}
                      </div>
                      {edu.qualification && (
                        <div className="font-bold text-gray-800 text-sm">
                          {edu.qualification}
                        </div>
                      )}
                      <div className="mt-1 font-medium text-gray-600 text-xs">
                        {edu.institution}
                      </div>
                      <div className="mt-1 text-gray-500 text-xs">
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Skills */}
          {resumeData?.userSkills && resumeData.userSkills.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-5 font-bold text-[#333] text-lg uppercase tracking-widest">
                Skills
              </h2>
              <ul className="space-y-3">
                {resumeData.userSkills
                  .flatMap((group) => group.skills)
                  .map((skill, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-800"></span>
                      <span className="font-medium text-gray-700 text-sm">
                        {skill.name}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* Languages */}
          {resumeData?.languageSkills &&
            resumeData.languageSkills.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-5 font-bold text-[#333] text-lg uppercase tracking-widest">
                  Language
                </h2>
                <ul className="space-y-2">
                  {resumeData.languageSkills.map((lang, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-800"></span>
                      <span className="font-medium text-gray-700 text-sm">
                        {lang.language}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

          {/* Certifications - Optional if space allows */}
          {resumeData?.certificationsRecords &&
            resumeData.certificationsRecords.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-5 font-bold text-[#333] text-lg uppercase tracking-widest">
                  Certifications
                </h2>
                <div className="space-y-4">
                  {resumeData.certificationsRecords.map((cert, idx) => (
                    <div key={idx}>
                      <div className="font-bold text-gray-800 text-sm">
                        {cert.name}
                      </div>
                      {cert.issuer && (
                        <div className="text-gray-600 text-xs">
                          {cert.issuer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
        </div>

        {/* Right Column (Wider - 8 cols) */}
        <div className="col-span-8 p-10 pl-8">
          {/* Profile */}
          {profile?.summary && (
            <section className="mb-12">
              <h2 className="mb-4 font-bold text-[#333] text-lg uppercase tracking-widest">
                Profile
              </h2>
              <p className="text-justify text-gray-600 text-sm leading-7">
                {profile.summary}
              </p>
            </section>
          )}

          {/* Work Experience */}
          {resumeData?.workExperiences &&
            resumeData.workExperiences.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-6 font-bold text-[#333] text-lg uppercase tracking-widest">
                  Work Experience
                </h2>
                <div className="space-y-8">
                  {resumeData.workExperiences.map((exp, idx) => (
                    <div key={idx}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <h3 className="font-bold text-base text-gray-800 uppercase">
                          {exp.employer}
                        </h3>
                        <span className="font-bold text-gray-800 text-sm">
                          {formatDate(exp.startDate)} –{" "}
                          {formatDate(exp.endDate)}
                        </span>
                      </div>
                      <div className="mb-2 font-medium text-gray-600 text-sm italic">
                        {exp.jobTitle}
                      </div>

                      {exp.description && (
                        <div className="whitespace-pre-line text-justify text-gray-600 text-sm leading-relaxed">
                          {exp.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Projects / Leadership (Replacing References to handle dynamic content better) */}
          {/* Positions/Leadership */}
          {resumeData?.positionsOfResponsibilityRecords &&
            resumeData.positionsOfResponsibilityRecords.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-6 font-bold text-[#333] text-lg uppercase tracking-widest">
                  Leadership
                </h2>
                <div className="space-y-6">
                  {resumeData.positionsOfResponsibilityRecords.map(
                    (pos, idx) => (
                      <div key={idx}>
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className="font-bold text-base text-gray-800">
                            {pos.name}
                          </h3>
                          <span className="font-bold text-gray-800 text-sm">
                            {formatDate(pos.startDate)} –{" "}
                            {formatDate(pos.endDate)}
                          </span>
                        </div>
                        {pos.description && (
                          <div className="whitespace-pre-line text-justify text-gray-600 text-sm leading-relaxed">
                            {pos.description}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}

          {/* Projects */}
          {resumeData?.projectRecords &&
            resumeData.projectRecords.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-6 font-bold text-[#333] text-lg uppercase tracking-widest">
                  Projects
                </h2>
                <div className="space-y-6">
                  {resumeData.projectRecords.map((proj, idx) => (
                    <div key={idx}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <h3 className="font-bold text-base text-gray-800">
                          {proj.name}
                        </h3>
                        <span className="font-bold text-gray-800 text-sm">
                          {formatDate(proj.startDate)} –{" "}
                          {formatDate(proj.endDate)}
                        </span>
                      </div>
                      {proj.description && (
                        <div className="whitespace-pre-line text-justify text-gray-600 text-sm leading-relaxed">
                          {proj.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
        </div>
      </div>
    </div>
  );
}
