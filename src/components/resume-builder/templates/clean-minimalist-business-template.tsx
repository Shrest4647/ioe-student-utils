import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

interface CleanMinimalistBusinessTemplateProps {
  resumeData?: ResumeData;
}

export function CleanMinimalistBusinessTemplate({
  resumeData,
}: CleanMinimalistBusinessTemplateProps) {
  const profile = resumeData?.profile;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.getFullYear().toString();
  };

  const formatFullDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  const formatAddress = () => {
    const addr = profile?.address;
    if (!addr) return null;
    const parts = [addr.city, addr.state].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <div
      className="relative min-h-[297mm] w-full bg-white p-12 text-gray-900"
      style={{
        fontFamily: "'Open Sans', sans-serif",
      }}
    >
      {/* Import Open Sans Font */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400&display=swap');`}
      </style>

      {/* Header */}
      <header className="mb-12">
        <h1 className="mb-1 font-extrabold text-4xl text-black uppercase tracking-widest">
          {profile?.firstName} {profile?.lastName}
        </h1>
        <p className="font-medium text-gray-700 text-lg italic">
          {resumeData?.workExperiences?.[0]?.jobTitle || "Professional Title"}
        </p>
      </header>

      <div className="flex min-h-[calc(297mm-200px)] gap-12">
        {/* Left Column (Narrower) */}
        <div className="w-1/3 space-y-10 border-gray-300 border-r pr-8">
          {/* Contact */}
          <section>
            <h2 className="mb-4 font-bold text-black text-sm uppercase tracking-widest">
              Contact
            </h2>
            <div className="space-y-3 font-medium text-gray-800 text-sm">
              {profile?.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={14} strokeWidth={2.5} />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.email && (
                <div className="flex items-center gap-3">
                  <Mail size={14} strokeWidth={2.5} />
                  <span className="break-all">{profile.email}</span>
                </div>
              )}
              {formatAddress() && (
                <div className="flex items-center gap-3">
                  <MapPin size={14} strokeWidth={2.5} />
                  <span>{formatAddress()}</span>
                </div>
              )}
              {profile?.web && (
                <div className="flex items-center gap-3">
                  <Globe size={14} strokeWidth={2.5} />
                  <span className="break-all">
                    {profile.web.replace(/^https?:\/\//, "")}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Education */}
          {resumeData?.educationRecords &&
            resumeData.educationRecords.length > 0 && (
              <section>
                <h2 className="mb-4 font-bold text-black text-sm uppercase tracking-widest">
                  Education
                </h2>
                <div className="space-y-4">
                  {resumeData.educationRecords.map((edu, idx) => (
                    <div key={idx}>
                      <div className="font-bold text-black text-sm">
                        {edu.institution}
                      </div>
                      <div className="mb-1 text-gray-600 text-xs">
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </div>
                      <div className="text-gray-800 text-sm">
                        {edu.degreeLevel}, {edu.qualification}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Awards & Certifications */}
          {resumeData?.certificationsRecords &&
            resumeData.certificationsRecords.length > 0 && (
              <section>
                <h2 className="mb-4 font-bold text-black text-sm uppercase tracking-widest">
                  Awards & Certifications
                </h2>
                <ul className="space-y-2">
                  {resumeData.certificationsRecords.map((cert, idx) => (
                    <li key={idx} className="flex gap-2 text-gray-800 text-sm">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-black"></span>
                      <div>
                        <span className="block font-medium">{cert.name}</span>
                        {/* <span className="text-xs text-gray-500 block">{cert.issuer}</span> */}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

          {/* Skills */}
          {resumeData?.userSkills && resumeData.userSkills.length > 0 && (
            <section>
              <h2 className="mb-4 font-bold text-black text-sm uppercase tracking-widest">
                Skills
              </h2>
              <ul className="space-y-2">
                {resumeData.userSkills
                  .flatMap((group) => group.skills)
                  .map((skill, sIdx) => (
                    <li
                      key={sIdx}
                      className="flex items-center gap-2 text-gray-800 text-sm"
                    >
                      <span className="h-1 w-1 shrink-0 rounded-full bg-black"></span>
                      <span>{skill.name}</span>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* Languages */}
          {resumeData?.languageSkills &&
            resumeData.languageSkills.length > 0 && (
              <section>
                <h2 className="mb-4 font-bold text-black text-sm uppercase tracking-widest">
                  Languages
                </h2>
                <ul className="space-y-2">
                  {resumeData.languageSkills.map((lang, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-gray-800 text-sm"
                    >
                      <span className="h-1 w-1 shrink-0 rounded-full bg-black"></span>
                      <span>{lang.language}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
        </div>

        {/* Right Column (Wider) */}
        <div className="flex-1 space-y-10 pl-2">
          {/* Profile */}
          {profile?.summary && (
            <section>
              <h2 className="mb-4 font-bold text-black text-sm uppercase tracking-widest">
                Profile
              </h2>
              <p className="text-justify text-gray-700 text-sm leading-7">
                {profile.summary}
              </p>
            </section>
          )}

          {/* Work Experience */}
          {resumeData?.workExperiences &&
            resumeData.workExperiences.length > 0 && (
              <section>
                <h2 className="mb-6 font-bold text-black text-sm uppercase tracking-widest">
                  Work Experience
                </h2>
                <div className="space-y-8">
                  {resumeData.workExperiences.map((exp, idx) => (
                    <div key={idx}>
                      <div className="mb-1">
                        <div className="mb-0.5 font-bold text-gray-500 text-xs uppercase">
                          {/* Job title above in upper case small text or regular? Image shows job title first? No image shows JOB TITLE then Company. Actually image shows JOB TITLE (Bold) then Company below. Let's follow image roughly. */}
                          {/* Image: REAL ESTATE AGENT [Regular font size uppercase] */}
                          {exp.jobTitle}
                        </div>
                        <h3 className="font-bold text-black text-lg">
                          {exp.employer}
                        </h3>
                        <div className="mb-2 text-gray-500 text-xs italic">
                          {formatFullDate(exp.startDate)} –{" "}
                          {formatFullDate(exp.endDate)}
                        </div>
                      </div>

                      {exp.description && (
                        <div className="whitespace-pre-line text-justify text-gray-700 text-sm leading-relaxed">
                          {/* Split by new line and add bullet points if it looks like a list, or just render. The image has bullets. The description usually comes as a block. We can try to render it nicely. */}
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
                <h2 className="mb-6 font-bold text-black text-sm uppercase tracking-widest">
                  Projects
                </h2>
                <div className="space-y-6">
                  {resumeData.projectRecords.map((proj, idx) => (
                    <div key={idx}>
                      <div className="mb-1">
                        <h3 className="font-bold text-base text-black">
                          {proj.name}
                        </h3>
                        <div className="mb-2 text-gray-500 text-xs italic">
                          {formatFullDate(proj.startDate)} –{" "}
                          {formatFullDate(proj.endDate)}
                        </div>
                      </div>
                      {proj.description && (
                        <div className="whitespace-pre-line text-justify text-gray-700 text-sm leading-relaxed">
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

          {/* Leadership */}
          {resumeData?.positionsOfResponsibilityRecords &&
            resumeData.positionsOfResponsibilityRecords.length > 0 && (
              <section>
                <h2 className="mb-6 font-bold text-black text-sm uppercase tracking-widest">
                  Leadership
                </h2>
                <div className="space-y-6">
                  {resumeData.positionsOfResponsibilityRecords.map(
                    (pos, idx) => (
                      <div key={idx}>
                        <div className="mb-1">
                          <h3 className="font-bold text-base text-black">
                            {pos.name}
                          </h3>
                          <div className="mb-2 text-gray-500 text-xs italic">
                            {formatFullDate(pos.startDate)} –{" "}
                            {formatFullDate(pos.endDate)}
                          </div>
                        </div>
                        {pos.description && (
                          <div className="whitespace-pre-line text-justify text-gray-700 text-sm leading-relaxed">
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
