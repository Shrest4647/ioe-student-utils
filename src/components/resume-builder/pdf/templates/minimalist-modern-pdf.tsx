import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica", // Poppins not available by default, fallback to Helvetica
    color: "#333",
  },
  header: {
    backgroundColor: "#EBEBEB",
    paddingVertical: 30,
    paddingHorizontal: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: "heavy",
    textTransform: "uppercase",
    marginBottom: 4,
    color: "#333",
  },
  jobTitle: {
    fontSize: 12,
    fontWeight: "medium",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contactBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#D1D1D1",
    paddingVertical: 10,
    paddingHorizontal: 40,
    gap: 15,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactText: {
    fontSize: 9,
    color: "#333",
    fontWeight: "medium",
  },
  container: {
    flexDirection: "row",
    paddingHorizontal: 40,
    paddingVertical: 20,
    gap: 20,
  },
  leftColumn: {
    width: "30%",
    borderRightWidth: 1,
    borderRightColor: "#333",
    paddingRight: 15,
  },
  rightColumn: {
    width: "70%",
    paddingLeft: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
    color: "#333",
  },
  // Left col items
  eduItem: {
    marginBottom: 10,
  },
  eduDegree: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#333",
  },
  eduInst: {
    fontSize: 8,
    color: "#555",
    marginTop: 1,
  },
  eduDate: {
    fontSize: 8,
    color: "#666",
    marginTop: 1,
  },
  skillItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  bullet: {
    width: 3,
    height: 3,
    backgroundColor: "#333",
    borderRadius: 50,
    marginRight: 6,
  },
  skillText: {
    fontSize: 9,
    color: "#444",
  },
  // Right col items
  profileText: {
    fontSize: 9,
    lineHeight: 1.5,
    textAlign: "justify",
    color: "#444",
  },
  workItem: {
    marginBottom: 15,
  },
  workHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  employer: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#333",
  },
  workDate: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#333",
  },
  workTitle: {
    fontSize: 10,
    fontWeight: "medium",
    fontStyle: "italic",
    color: "#555",
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    lineHeight: 1.4,
    color: "#444",
    textAlign: "justify",
  },
});

interface ResumePDFProps {
  data: ResumeData;
}

export function MinimalistModernPdf({ data }: ResumePDFProps) {
  const {
    profile,
    workExperiences,
    educationRecords,
    userSkills,
    projectRecords,
    certificationsRecords,
    languageSkills,
    positionsOfResponsibilityRecords,
  } = data;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    return new Date(dateString).getFullYear().toString();
  };

  const formatFullDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    return new Date(dateString)
      .toLocaleDateString("en-US", { year: "numeric", month: "short" })
      .toUpperCase();
  };

  const formatAddress = () => {
    const addr = profile?.address;
    if (!addr) return null;
    return [addr.city, addr.state].filter(Boolean).join(", ");
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {profile?.firstName} {profile?.lastName}
          </Text>
          <Text style={styles.jobTitle}>
            {workExperiences?.[0]?.jobTitle || "Professional Title"}
          </Text>
        </View>

        {/* Contact Bar */}
        <View style={styles.contactBar}>
          {profile?.phone && (
            <Text style={styles.contactText}>{profile.phone}</Text>
          )}
          {profile?.email && (
            <Text style={styles.contactText}>{profile.email}</Text>
          )}
          {formatAddress() && (
            <Text style={styles.contactText}>{formatAddress()}</Text>
          )}
          {profile?.web && (
            <Text style={styles.contactText}>
              {profile.web.replace(/^https?:\/\//, "")}
            </Text>
          )}
        </View>

        <View style={styles.container}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Education */}
            {educationRecords && educationRecords.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                {educationRecords.map((edu, i) => (
                  <View key={i} style={styles.eduItem}>
                    <Text style={styles.eduDegree}>
                      {edu.degreeLevel}{" "}
                      {edu.qualification ? `- ${edu.qualification}` : ""}
                    </Text>
                    <Text style={styles.eduInst}>{edu.institution}</Text>
                    <Text style={styles.eduDate}>
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Skills */}
            {userSkills && userSkills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills</Text>
                {userSkills
                  .flatMap((group) => group.skills)
                  .map((skill, i) => (
                    <View key={i} style={styles.skillItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.skillText}>{skill.name}</Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Languages */}
            {languageSkills && languageSkills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Language</Text>
                {languageSkills.map((lang, i) => (
                  <View key={i} style={styles.skillItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.skillText}>{lang.language}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Certifications - Optional space permitting */}
            {certificationsRecords && certificationsRecords.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Certifications</Text>
                {certificationsRecords.map((cert, i) => (
                  <View key={i} style={styles.eduItem}>
                    <Text style={styles.eduDegree}>{cert.name}</Text>
                    {cert.issuer && (
                      <Text style={styles.eduInst}>{cert.issuer}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Profile */}
            {profile?.summary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile</Text>
                <Text style={styles.profileText}>{profile.summary}</Text>
              </View>
            )}

            {/* Work Experience */}
            {workExperiences && workExperiences.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Work Experience</Text>
                {workExperiences.map((exp, i) => (
                  <View key={i} style={styles.workItem}>
                    <View style={styles.workHeader}>
                      <Text style={styles.employer}>{exp.employer}</Text>
                      <Text style={styles.workDate}>
                        {formatFullDate(exp.startDate)} –{" "}
                        {formatFullDate(exp.endDate)}
                      </Text>
                    </View>
                    <Text style={styles.workTitle}>{exp.jobTitle}</Text>
                    {exp.description && (
                      <Text style={styles.description}>{exp.description}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Leadership */}
            {positionsOfResponsibilityRecords &&
              positionsOfResponsibilityRecords.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Leadership</Text>
                  {positionsOfResponsibilityRecords.map((pos, i) => (
                    <View key={i} style={styles.workItem}>
                      <View style={styles.workHeader}>
                        <Text style={styles.employer}>{pos.name}</Text>
                        <Text style={styles.workDate}>
                          {formatFullDate(pos.startDate)} –{" "}
                          {formatFullDate(pos.endDate)}
                        </Text>
                      </View>
                      {pos.description && (
                        <Text style={styles.description}>
                          {pos.description}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

            {/* Projects */}
            {projectRecords && projectRecords.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Projects</Text>
                {projectRecords.map((proj, i) => (
                  <View key={i} style={styles.workItem}>
                    <View style={styles.workHeader}>
                      <Text style={styles.employer}>{proj.name}</Text>
                      <Text style={styles.workDate}>
                        {formatFullDate(proj.startDate)} –{" "}
                        {formatFullDate(proj.endDate)}
                      </Text>
                    </View>
                    {proj.description && (
                      <Text style={styles.description}>{proj.description}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
