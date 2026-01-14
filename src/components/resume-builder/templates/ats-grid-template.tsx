import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

interface AtsGridTemplateProps {
  resumeData?: ResumeData;
}

export function AtsGridTemplate({ resumeData }: AtsGridTemplateProps) {
  const profile = resumeData?.profile;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.getFullYear().toString();
  };

  const formatFullDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const formatAddress = () => {
    const addr = profile?.address;
    if (!addr) return null;
    const parts = [addr.city, addr.state].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <div
      className="relative min-h-[297mm] w-full border-2 border-gray-400 bg-white text-gray-800"
      style={{
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {/* Import Fonts */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600&display=swap');
        `}
      </style>

      {/* Header */}
      <header className="flex items-center border-gray-400 border-b-2 p-10">
        <div className="mr-8">
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-gray-300 bg-gray-200 font-['Poppins'] font-bold text-4xl text-gray-400">
            {profile?.firstName?.[0]}
            {profile?.lastName?.[0]}
          </div>
        </div>
        <div>
          <h1
            className="mb-2 text-5xl text-gray-700 uppercase tracking-widest"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}
          >
            {profile?.firstName}{" "}
            <span className="font-bold text-gray-800">{profile?.lastName}</span>
          </h1>
          <p className="font-['Poppins'] font-light text-gray-500 text-xl uppercase tracking-wider">
            {resumeData?.workExperiences?.[0]?.jobTitle || "Professional Title"}
          </p>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="flex h-full min-h-[calc(297mm-180px)] bg-white">
        {/* Left Sidebar */}
        <div className="w-[35%] border-gray-400 border-r-2">
          {/* Contact */}
          <section className="border-gray-400 border-b-2 p-6">
            <h2 className="mb-4 font-['Poppins'] font-bold text-gray-800 text-xl">
              Contact
            </h2>
            <div className="space-y-3 text-sm">
              {profile?.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={16} />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.email && (
                <div className="flex items-center gap-3">
                  <Mail size={16} />
                  <span className="break-all">{profile.email}</span>
                </div>
              )}
              {formatAddress() && (
                <div className="flex items-center gap-3">
                  <MapPin size={16} />
                  <span>{formatAddress()}</span>
                </div>
              )}
              {profile?.web && (
                <div className="flex items-center gap-3">
                  <Globe size={16} />
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
              <section className="border-gray-400 border-b-2 p-6">
                <h2 className="mb-4 font-['Poppins'] font-bold text-gray-800 text-xl">
                  Education
                </h2>
                <div className="space-y-4">
                  {resumeData.educationRecords.map((edu, idx) => (
                    <div key={idx}>
                      <div className="font-bold text-base text-gray-800">
                        {edu.degreeLevel}
                      </div>
                      <div className="font-medium text-gray-700 text-sm">
                        {edu.institution}
                      </div>
                      <div className="text-gray-500 text-xs italic">
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Skills */}
          {resumeData?.userSkills && resumeData.userSkills.length > 0 && (
            <section className="border-gray-400 border-b-2 p-6">
              <h2 className="mb-4 font-['Poppins'] font-bold text-gray-800 text-xl">
                Skills
              </h2>
              <ul className="ml-4 list-outside list-disc space-y-2">
                {resumeData.userSkills
                  .flatMap((group) => group.skills)
                  .map((skill, idx) => (
                    <li key={idx} className="text-gray-700 text-sm">
                      {skill.name}
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* Languages */}
          {resumeData?.languageSkills &&
            resumeData.languageSkills.length > 0 && (
              <section className="p-6">
                <h2 className="mb-4 font-['Poppins'] font-bold text-gray-800 text-xl">
                  Language
                </h2>
                <ul className="ml-4 list-outside list-disc space-y-2">
                  {resumeData.languageSkills.map((lang, idx) => (
                    <li key={idx} className="text-gray-700 text-sm">
                      {lang.language}
                    </li>
                  ))}
                </ul>
              </section>
            )}
        </div>

        {/* Right Content */}
        <div className="w-[65%]">
          {/* Profile Summary */}
          {profile?.summary && (
            <section className="border-gray-400 border-b-2 p-8">
              <h2 className="mb-4 font-['Poppins'] font-bold text-gray-800 text-xl">
                Profile
              </h2>
              <p className="text-justify text-gray-700 text-sm leading-relaxed">
                {profile.summary}
              </p>
            </section>
          )}

          {/* Experience */}
          {resumeData?.workExperiences &&
            resumeData.workExperiences.length > 0 && (
              <section className="border-gray-400 border-b-2 p-8">
                <h2 className="mb-6 font-['Poppins'] font-bold text-gray-800 text-xl">
                  Experience
                </h2>
                <div className="space-y-8">
                  {resumeData.workExperiences.map((exp, idx) => (
                    <div key={idx}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <h3 className="font-bold text-base text-gray-800">
                          {exp.jobTitle}
                        </h3>
                      </div>
                      <div className="mb-2 font-medium text-gray-600 text-sm">
                        {exp.employer} |{" "}
                        <span className="font-normal italic">
                          {formatFullDate(exp.startDate)} to{" "}
                          {formatFullDate(exp.endDate)}
                        </span>
                      </div>

                      {exp.description && (
                        <div className="text-justify text-gray-700 text-sm leading-relaxed">
                          <ul className="ml-4 list-outside list-disc space-y-1">
                            {exp.description.split("\n").map((line, i) => {
                              const cleanLine = line
                                .replace(/^[•-]\s*/, "")
                                .trim();
                              if (!cleanLine) return null;
                              return <li key={i}>{cleanLine}</li>;
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Projects / Leadership (Mapping to rest of space) */}
          {/* Projects */}
          {resumeData?.projectRecords &&
            resumeData.projectRecords.length > 0 && (
              <section className="border-gray-400 border-b-2 p-8">
                <h2 className="mb-6 font-['Poppins'] font-bold text-gray-800 text-xl">
                  Projects
                </h2>
                <div className="space-y-6">
                  {resumeData.projectRecords.map((proj, idx) => (
                    <div key={idx}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <h3 className="font-bold text-base text-gray-800">
                          {proj.name}
                        </h3>
                        <span className="text-gray-500 text-xs italic">
                          {formatDate(proj.startDate)} -{" "}
                          {formatDate(proj.endDate)}
                        </span>
                      </div>
                      {proj.description && (
                        <div className="text-justify text-gray-700 text-sm leading-relaxed">
                          <p>{proj.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Leadership */}
          {resumeData?.positionsOfResponsibilityRecords &&
            resumeData.positionsOfResponsibilityRecords.length > 0 && (
              <section className="p-8">
                <h2 className="mb-6 font-['Poppins'] font-bold text-gray-800 text-xl">
                  Leadership
                </h2>
                <div className="space-y-6">
                  {resumeData.positionsOfResponsibilityRecords.map(
                    (pos, idx) => (
                      <div key={idx}>
                        <div className="mb-1 flex items-baseline justify-between">
                          <h3 className="font-bold text-base text-gray-800">
                            {pos.name}
                          </h3>
                          <span className="text-gray-500 text-xs italic">
                            {formatDate(pos.startDate)} -{" "}
                            {formatDate(pos.endDate)}
                          </span>
                        </div>
                        {pos.description && (
                          <div className="text-justify text-gray-700 text-sm leading-relaxed">
                            <p>{pos.description}</p>
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
