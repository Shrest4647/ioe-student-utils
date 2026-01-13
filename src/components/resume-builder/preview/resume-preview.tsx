"use client";

import { FileText, Globe, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { PDFDownloadButton } from "@/components/resume-builder/shared/pdf-download-button";
import { Card } from "@/components/ui/card";

interface ResumePreviewProps {
  resumeData?: {
    profile?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
      photoUrl?: string;
      summary?: string;
      linkedIn?: string;
      github?: string;
      web?: string;
    };
    workExperiences?: Array<{
      jobTitle?: string;
      employer?: string;
      startDate?: string;
      endDate?: string;
      city?: string;
      country?: string;
      description?: string;
    }>;
    educationRecords?: Array<{
      institution?: string;
      qualification?: string;
      degreeLevel?: string;
      startDate?: string;
      endDate?: string;
      grade?: string;
      gradeType?: string;
      description?: string;
    }>;
    languageSkills?: Array<{
      language: string;
      listening?: string;
      reading?: string;
      speaking?: string;
      writing?: string;
    }>;
    userSkills?: Array<{
      category: string;
      skills: Array<{ name: string; proficiency?: string }>;
    }>;
  };
  resumeName?: string;
}

export function ResumePreview({ resumeData, resumeName }: ResumePreviewProps) {
  const profile = resumeData?.profile;

  const formatDate = (dateString?: string) => {
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

  const getCefrLabel = (level?: string) => {
    if (!level) return "-";
    return level.toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Live Preview</h3>
        <PDFDownloadButton
          resumeData={resumeData}
          resumeName={resumeName || "resume"}
          size="sm"
        />
      </div>

      {/* A4 Preview Container */}
      <Card className="overflow-hidden border shadow-lg">
        <div
          className="bg-white p-8"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "11pt",
            lineHeight: "1.4",
            color: "#404040",
            minHeight: "297mm", // A4 height
          }}
        >
          {/* Header */}
          <div
            className="mb-6 rounded-t p-4 text-white"
            style={{ backgroundColor: "#004494" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="mb-2 font-bold" style={{ fontSize: "24pt" }}>
                  {profile?.firstName} {profile?.lastName}
                </h1>

                {/* Contact Information */}
                <div className="grid grid-cols-1 gap-1 text-sm">
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
                  {formatAddress() && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{formatAddress()}</span>
                    </div>
                  )}
                  {(profile?.linkedIn || profile?.github || profile?.web) && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      <span className="flex flex-wrap gap-2">
                        {profile.linkedIn && (
                          <a
                            href={profile.linkedIn}
                            className="underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            LinkedIn
                          </a>
                        )}
                        {profile.github && (
                          <a
                            href={profile.github}
                            className="underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            GitHub
                          </a>
                        )}
                        {profile.web && (
                          <a
                            href={profile.web}
                            className="underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Website
                          </a>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo */}
              {profile?.photoUrl && (
                <div className="ml-4">
                  <Image
                    width={200}
                    height={200}
                    src={profile.photoUrl}
                    alt="Profile"
                    className="h-24 w-24 rounded-lg border-2 border-white object-cover"
                  />
                </div>
              )}
            </div>

            {/* Professional Summary */}
            {profile?.summary && (
              <div className="mt-4 text-sm">
                <p>{profile.summary}</p>
              </div>
            )}
          </div>

          {/* Work Experience */}
          {resumeData?.workExperiences &&
            resumeData.workExperiences.length > 0 && (
              <div className="mb-4">
                <div
                  className="mb-3 rounded px-3 py-2 font-semibold text-white"
                  style={{ backgroundColor: "#004494", fontSize: "12pt" }}
                >
                  Work Experience
                </div>
                <div className="space-y-3">
                  {resumeData.workExperiences.map((exp, index) => (
                    <div
                      key={index}
                      className="border-l-2 pl-3"
                      style={{ borderColor: "#004494" }}
                    >
                      <div className="mb-1 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {exp.jobTitle || "Position"}
                          </h3>
                          <p className="text-sm">
                            {exp.employer || "Employer"}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-muted-foreground text-sm">
                          {formatDate(exp.startDate)} -{" "}
                          {formatDate(exp.endDate)}
                        </span>
                      </div>
                      {(exp.city || exp.country) && (
                        <p className="mb-1 text-muted-foreground text-sm">
                          {[exp.city, exp.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                      {exp.description && (
                        <p className="whitespace-pre-line text-sm">
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
                <div
                  className="mb-3 rounded px-3 py-2 font-semibold text-white"
                  style={{ backgroundColor: "#004494", fontSize: "12pt" }}
                >
                  Education and Training
                </div>
                <div className="space-y-3">
                  {resumeData.educationRecords.map((edu, index) => (
                    <div
                      key={index}
                      className="border-l-2 pl-3"
                      style={{ borderColor: "#004494" }}
                    >
                      <div className="mb-1 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {edu.qualification || "Qualification"}
                          </h3>
                          <p className="text-sm">
                            {edu.institution || "Institution"}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-muted-foreground text-sm">
                          {formatDate(edu.startDate)} -{" "}
                          {formatDate(edu.endDate)}
                        </span>
                      </div>
                      {(edu.grade || edu.gradeType) && (
                        <p className="text-muted-foreground text-sm">
                          Grade: {edu.grade}
                          {edu.gradeType && ` (${edu.gradeType})`}
                        </p>
                      )}
                      {edu.description && (
                        <p className="whitespace-pre-line text-sm">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Language Skills */}
          {resumeData?.languageSkills &&
            resumeData.languageSkills.length > 0 && (
              <div className="mb-4">
                <div
                  className="mb-3 rounded px-3 py-2 font-semibold text-white"
                  style={{ backgroundColor: "#004494", fontSize: "12pt" }}
                >
                  Language Skills
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className="border-b"
                        style={{ borderColor: "#004494" }}
                      >
                        <th className="px-2 py-1 text-left font-semibold">
                          Language
                        </th>
                        <th className="px-2 py-1 text-left font-semibold">
                          Listening
                        </th>
                        <th className="px-2 py-1 text-left font-semibold">
                          Reading
                        </th>
                        <th className="px-2 py-1 text-left font-semibold">
                          Speaking
                        </th>
                        <th className="px-2 py-1 text-left font-semibold">
                          Writing
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumeData.languageSkills.map((lang, index) => (
                        <tr key={index} className="border-gray-200 border-b">
                          <td className="px-2 py-1 font-medium">
                            {lang.language}
                          </td>
                          <td className="px-2 py-1">
                            {getCefrLabel(lang.listening)}
                          </td>
                          <td className="px-2 py-1">
                            {getCefrLabel(lang.reading)}
                          </td>
                          <td className="px-2 py-1">
                            {getCefrLabel(lang.speaking)}
                          </td>
                          <td className="px-2 py-1">
                            {getCefrLabel(lang.writing)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Skills */}
          {resumeData?.userSkills && resumeData.userSkills.length > 0 && (
            <div className="mb-4">
              <div
                className="mb-3 rounded px-3 py-2 font-semibold text-white"
                style={{ backgroundColor: "#004494", fontSize: "12pt" }}
              >
                Skills
              </div>
              <div className="space-y-2">
                {resumeData.userSkills.map((skillGroup, index) => (
                  <div key={index}>
                    <h4
                      className="mb-1 font-semibold text-sm"
                      style={{ color: "#004494" }}
                    >
                      {skillGroup.category}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {skillGroup.skills.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="rounded px-2 py-1 text-sm"
                          style={{
                            backgroundColor: "#e8f0fe",
                            color: "#004494",
                            border: "1px solid #00449433",
                          }}
                        >
                          {skill.name}
                          {skill.proficiency && (
                            <span className="ml-1 opacity-70">
                              ({skill.proficiency})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!profile && (
            <div className="flex min-h-96 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No profile data yet.</p>
                <p className="text-sm">
                  Complete your profile to see the preview.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
