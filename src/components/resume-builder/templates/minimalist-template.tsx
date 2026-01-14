import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

interface MinimalistTemplateProps {
  resumeData?: ResumeData;
}

export function MinimalistTemplate({ resumeData }: MinimalistTemplateProps) {
  const profile = resumeData?.profile;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.getFullYear().toString();
  };

  const formatFullDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-US", { year: "numeric", month: "short" })
      .toUpperCase();
  };

  const formatAddress = () => {
    const addr = profile?.address;
    if (!addr) return null;
    const parts = [addr.city, addr.state].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const themeColor = "#2D3748"; // Dark slate/navy for headers

  return (
    <div
      className="relative box-border min-h-[297mm] w-full bg-[#FDFDFD] p-8"
      style={{
        fontFamily: "'Inter', sans-serif",
        color: "#4A5568",
        lineHeight: "1.5",
      }}
    >
      {/* Name & Title */}
      <header className="mb-6 text-center">
        <h1
          className="mb-2 font-bold text-4xl uppercase tracking-wider"
          style={{ color: themeColor }}
        >
          {profile?.firstName} {profile?.lastName}
        </h1>
        {/* Placeholder for Role if we had one, for now just summary's first sentence or omit. Image has 'Marketing Manager'. */}
        {/* <p className="text-sm uppercase tracking-widest text-gray-500">Professional Title</p> */}
      </header>

      {/* Contact Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-gray-300 border-y py-3 font-medium text-xs uppercase tracking-wide">
        {formatAddress() && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>{formatAddress()}</span>
          </div>
        )}
        {profile?.web && (
          <div className="flex items-center gap-2">
            <Globe className="h-3 w-3" />
            <span>{profile.web.replace(/^https?:\/\//, "")}</span>
          </div>
        )}
        {profile?.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3" />
            <span>{profile.email}</span>
          </div>
        )}
        {profile?.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3" />
            <span>{profile.phone}</span>
          </div>
        )}
      </div>

      {/* Profile Info */}
      {profile?.summary && (
        <section className="mb-10">
          <div className="mb-3 flex items-center gap-4">
            <h2
              className="whitespace-nowrap font-bold text-lg uppercase tracking-widest"
              style={{ color: themeColor }}
            >
              Profile Info
            </h2>
            <div className="h-px w-full bg-gray-300"></div>
          </div>
          <p className="text-justify text-sm leading-relaxed">
            {profile.summary}
          </p>
        </section>
      )}

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column (Narrower) */}
        <div className="col-span-4 space-y-8 border-gray-300 border-r pr-4">
          {/* Education */}
          {resumeData?.educationRecords &&
            resumeData.educationRecords.length > 0 && (
              <section>
                <h2
                  className="mb-4 font-bold text-lg uppercase tracking-widest"
                  style={{ color: themeColor }}
                >
                  Education
                </h2>
                <div className="space-y-5">
                  {resumeData.educationRecords.map((edu, idx) => (
                    <div key={idx}>
                      <div className="mb-1 font-bold text-gray-700 text-sm">
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </div>
                      <div
                        className="mb-1 font-bold text-xs uppercase"
                        style={{ color: themeColor }}
                      >
                        {edu.institution}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {edu.qualification}
                      </div>
                      {edu.degreeLevel && (
                        <div className="text-gray-500 text-xs italic">
                          {edu.degreeLevel}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Skills */}
          {resumeData?.userSkills && resumeData.userSkills.length > 0 && (
            <section>
              <h2
                className="mb-4 font-bold text-lg uppercase tracking-widest"
                style={{ color: themeColor }}
              >
                Skills
              </h2>
              <div className="space-y-4">
                {resumeData.userSkills.map((group, idx) => (
                  <div key={idx}>
                    <h3 className="mb-2 border-gray-200 border-b pb-1 font-bold text-gray-600 text-xs uppercase">
                      {group.category}
                    </h3>
                    <ul className="list-inside list-disc space-y-1">
                      {group.skills.map((skill, sIdx) => (
                        <li key={sIdx} className="text-gray-600 text-xs">
                          {skill.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {resumeData?.languageSkills &&
            resumeData.languageSkills.length > 0 && (
              <section>
                <h2
                  className="mb-4 font-bold text-lg uppercase tracking-widest"
                  style={{ color: themeColor }}
                >
                  Languages
                </h2>
                <ul className="space-y-2">
                  {resumeData.languageSkills.map((lang, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between text-gray-600 text-xs"
                    >
                      <span className="font-medium">{lang.language}</span>
                      {/* Optional: Add proficiency if mapped simply, or just list name */}
                    </li>
                  ))}
                </ul>
              </section>
            )}

          {/* Awards / Certifications (Fits well in left col) */}
          {resumeData?.certificationsRecords &&
            resumeData.certificationsRecords.length > 0 && (
              <section>
                <h2
                  className="mb-4 font-bold text-lg uppercase tracking-widest"
                  style={{ color: themeColor }}
                >
                  Awards
                </h2>
                <div className="space-y-3">
                  {resumeData.certificationsRecords.map((cert, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="font-bold text-gray-700">{cert.name}</div>
                      <div className="text-gray-500">{cert.issuer}</div>
                      <div className="text-[10px] text-gray-400">
                        {formatDate(cert.issueDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
        </div>

        {/* Right Column (Wider) */}
        <div className="col-span-8 space-y-8 pl-2">
          {/* Work Experience */}
          {resumeData?.workExperiences &&
            resumeData.workExperiences.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-4">
                  <h2
                    className="whitespace-nowrap font-bold text-lg uppercase tracking-widest"
                    style={{ color: themeColor }}
                  >
                    Work Experience
                  </h2>
                  {/* <div className="h-px bg-gray-300 w-full"></div> */}
                </div>

                <div className="space-y-6">
                  {resumeData.workExperiences.map((exp, idx) => (
                    <div key={idx}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <h3 className="font-bold text-base text-gray-800">
                          {exp.employer}
                        </h3>
                        <span className="whitespace-nowrap font-bold text-bg-gray-500 text-xs uppercase">
                          {formatFullDate(exp.startDate)} -{" "}
                          {formatFullDate(exp.endDate)}
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

          {/* Projects */}
          {resumeData?.projectRecords &&
            resumeData.projectRecords.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-4">
                  <h2
                    className="whitespace-nowrap font-bold text-lg uppercase tracking-widest"
                    style={{ color: themeColor }}
                  >
                    Projects
                  </h2>
                </div>

                <div className="space-y-6">
                  {resumeData.projectRecords.map((proj, idx) => (
                    <div key={idx}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <h3 className="font-bold text-base text-gray-800">
                          {proj.name}
                        </h3>
                        <span className="whitespace-nowrap font-bold text-gray-500 text-xs uppercase">
                          {formatFullDate(proj.startDate)} -{" "}
                          {formatFullDate(proj.endDate)}
                        </span>
                      </div>
                      {proj.role && (
                        <div className="mb-2 font-medium text-gray-600 text-sm italic">
                          {proj.role}
                        </div>
                      )}

                      {proj.description && (
                        <div className="whitespace-pre-line text-justify text-gray-600 text-sm leading-relaxed">
                          {proj.description}
                        </div>
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

          {/* Positions of Responsibility */}
          {resumeData?.positionsOfResponsibilityRecords &&
            resumeData.positionsOfResponsibilityRecords.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-4">
                  <h2
                    className="whitespace-nowrap font-bold text-lg uppercase tracking-widest"
                    style={{ color: themeColor }}
                  >
                    Leadership
                  </h2>
                </div>
                <div className="space-y-6">
                  {resumeData.positionsOfResponsibilityRecords.map(
                    (pos, idx) => (
                      <div key={idx}>
                        <div className="mb-1 flex items-baseline justify-between">
                          <h3 className="font-bold text-base text-gray-800">
                            {pos.name}
                          </h3>
                          <span className="whitespace-nowrap font-bold text-gray-500 text-xs uppercase">
                            {formatFullDate(pos.startDate)} -{" "}
                            {formatFullDate(pos.endDate)}
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
        </div>
      </div>
    </div>
  );
}
