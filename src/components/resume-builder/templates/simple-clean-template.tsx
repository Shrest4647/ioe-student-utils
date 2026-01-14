import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

interface SimpleCleanTemplateProps {
  resumeData?: ResumeData;
}

export function SimpleCleanTemplate({ resumeData }: SimpleCleanTemplateProps) {
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

  // Format address (city, state)
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
        fontFamily: "'Lora', serif",
      }}
    >
      {/* Import Lora Font */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');`}
      </style>

      {/* Header Section */}
      <header className="relative bg-gray-100 px-12 py-10">
        <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 font-bold text-4xl text-gray-800 uppercase tracking-wide md:text-5xl">
              {profile?.firstName} {profile?.lastName}
            </h1>
            {/* Job Title placeholder or calculated from latest experience */}
            <p className="font-medium text-gray-600 text-xl">
              {resumeData?.workExperiences?.[0]?.jobTitle}
            </p>
          </div>

          {/* Contact Details with circular icons */}
          <div className="mt-6 flex flex-col items-end gap-3 md:mt-0">
            {profile?.phone && (
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-600 text-sm">
                  {profile.phone}
                </span>
                <div className="rounded-full bg-gray-800 p-1.5 text-white">
                  <Phone size={12} fill="white" />
                </div>
              </div>
            )}
            {profile?.email && (
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-600 text-sm">
                  {profile.email}
                </span>
                <div className="rounded-full bg-gray-800 p-1.5 text-white">
                  <Mail size={12} fill="white" />
                </div>
              </div>
            )}
            {formatAddress() && (
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-600 text-sm">
                  {formatAddress()}
                </span>
                <div className="rounded-full bg-gray-800 p-1.5 text-white">
                  <MapPin size={12} fill="white" />
                </div>
              </div>
            )}
            {profile?.web && (
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-600 text-sm">
                  {profile.web.replace(/^https?:\/\//, "")}
                </span>
                <div className="rounded-full bg-gray-800 p-1.5 text-white">
                  <Globe size={12} />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Thick Divider */}
      <div className="h-2 w-full bg-gray-600"></div>

      {/* Content Container */}
      <div className="px-12 py-10">
        {/* Summary */}
        {profile?.summary && (
          <section className="mx-auto mb-10 max-w-4xl text-center">
            <h2 className="mb-4 inline-block border-gray-300 border-b-2 px-4 pb-1 font-bold text-gray-500 text-lg uppercase tracking-widest">
              Summary
            </h2>
            <div className="text-justify text-gray-600 text-sm leading-relaxed">
              {profile.summary}
            </div>
          </section>
        )}

        <div className="grid grid-cols-12 gap-0">
          {/* Left Column (Narrower) */}
          <div className="col-span-4 border-gray-200 border-r-2 pr-8">
            {/* Education */}
            {resumeData?.educationRecords &&
              resumeData.educationRecords.length > 0 && (
                <section className="mb-10">
                  <h2 className="mb-6 border-gray-300 border-b pb-2 font-medium text-gray-500 text-lg uppercase tracking-widest">
                    Education
                  </h2>
                  <div className="space-y-6">
                    {resumeData.educationRecords.map((edu, idx) => (
                      <div key={idx}>
                        <h3 className="font-bold text-gray-800 text-sm">
                          {edu.institution}
                        </h3>
                        <div className="mb-1 text-gray-600 text-xs italic">
                          {edu.degreeLevel}, {edu.qualification}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {formatDate(edu.startDate)} –{" "}
                          {formatDate(edu.endDate)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {/* Skills */}
            {resumeData?.userSkills && resumeData.userSkills.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-6 border-gray-300 border-b pb-2 font-medium text-gray-500 text-lg uppercase tracking-widest">
                  Skills
                </h2>
                <div className="space-y-4">
                  {resumeData.userSkills.map((group, idx) => (
                    <div key={idx}>
                      {/* <h3 className="font-bold text-gray-700 text-xs uppercase mb-2">{group.category}</h3> */}
                      <ul className="ml-4 list-outside list-disc space-y-1">
                        {group.skills.map((skill, sIdx) => (
                          <li key={sIdx} className="text-gray-600 text-sm">
                            {skill.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {resumeData?.certificationsRecords &&
              resumeData.certificationsRecords.length > 0 && (
                <section className="mb-10">
                  <h2 className="mb-6 border-gray-300 border-b pb-2 font-medium text-gray-500 text-lg uppercase tracking-widest">
                    Certifications
                  </h2>
                  <ul className="ml-4 list-outside list-disc space-y-3">
                    {resumeData.certificationsRecords.map((cert, idx) => (
                      <li key={idx} className="text-gray-600 text-sm">
                        <span className="block font-bold text-gray-800">
                          {cert.name}
                        </span>
                        {/* <span className="text-xs text-gray-500 block">{cert.issuer}</span> */}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
          </div>

          {/* Right Column (Wider) */}
          <div className="col-span-8 pt-0 pl-8">
            {/* Professional Experience */}
            {resumeData?.workExperiences &&
              resumeData.workExperiences.length > 0 && (
                <section className="mb-10">
                  <h2 className="mb-6 border-gray-300 border-b pb-2 font-medium text-gray-500 text-lg uppercase tracking-widest">
                    Professional Experience
                  </h2>
                  <div className="space-y-8">
                    {resumeData.workExperiences.map((exp, idx) => (
                      <div key={idx}>
                        <div className="mb-1 flex items-baseline justify-between">
                          <h3 className="font-bold text-gray-800 text-lg">
                            {exp.jobTitle}
                          </h3>
                          {/* <span className="text-xs text-gray-500 font-medium">{exp.location}</span> */}
                        </div>
                        <div className="mb-3 flex items-baseline justify-between">
                          <div className="font-medium text-gray-600 text-sm">
                            {exp.employer}
                          </div>
                          <div className="text-gray-500 text-sm italic">
                            {formatFullDate(exp.startDate)} –{" "}
                            {formatFullDate(exp.endDate)}
                          </div>
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
                <section className="mb-10">
                  <h2 className="mb-6 border-gray-300 border-b pb-2 font-medium text-gray-500 text-lg uppercase tracking-widest">
                    Projects
                  </h2>
                  <div className="space-y-6">
                    {resumeData.projectRecords.map((proj, idx) => (
                      <div key={idx}>
                        <div className="mb-1 flex items-baseline justify-between">
                          <h3 className="font-bold text-base text-gray-800">
                            {proj.name}
                          </h3>
                          <div className="text-gray-500 text-xs italic">
                            {formatFullDate(proj.startDate)} –{" "}
                            {formatFullDate(proj.endDate)}
                          </div>
                        </div>
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

            {/* Leadership / Activities */}
            {resumeData?.positionsOfResponsibilityRecords &&
              resumeData.positionsOfResponsibilityRecords.length > 0 && (
                <section className="mb-10">
                  <h2 className="mb-6 border-gray-300 border-b pb-2 font-medium text-gray-500 text-lg uppercase tracking-widest">
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
                            <div className="text-gray-500 text-xs italic">
                              {formatFullDate(pos.startDate)} –{" "}
                              {formatFullDate(pos.endDate)}
                            </div>
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
    </div>
  );
}
