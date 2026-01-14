import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    padding: 40,
    fontSize: 10,
    lineHeight: 1.5,
    color: "#333",
  },
  header: {
    marginBottom: 30,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingBottom: 8,
    color: "#1F2937",
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#374151", // gray-700
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    fontSize: 10,
    color: "#4B5563",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  pillTitleContainer: {
    backgroundColor: "#E5E7EB", // gray-200
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  pillTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#374151",
    letterSpacing: 1,
  },
  section: {
    marginBottom: 20,
  },
  description: {
    fontSize: 10,
    textAlign: "justify",
    color: "#374151",
    lineHeight: 1.5,
  },
  skillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  skillItem: {
    width: "30%",
    fontSize: 10,
    fontWeight: "medium",
    color: "#374151",
  },
  entry: {
    marginBottom: 15,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  entryLeft: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  employer: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1F2937",
  },
  entryJobTitle: {
    fontSize: 10,
    fontStyle: "italic",
    color: "#4B5563",
    marginLeft: 5,
  },
  entryDate: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#4B5563",
  },
  eduTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1F2937",
  },
  eduInst: {
    fontSize: 10,
    fontStyle: "italic",
    color: "#374151",
  },
  addInfoContainer: {
    flexDirection: "column",
    gap: 4,
  },
  addInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  label: {
    fontWeight: "bold",
    marginRight: 5,
    color: "#1F2937",
  },
});

interface ResumePDFProps {
  data: ResumeData;
}

export function SimpleInfographicPdf({ data }: ResumePDFProps) {
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
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const formatAddress = () => {
    const addr = profile?.address;
    if (!addr) return null;
    return [addr.city, addr.state].filter(Boolean).join(", ");
  };

  const contactParts = [
    formatAddress(),
    profile?.email,
    profile?.phone,
    profile?.web?.replace(/^https?:\/\//, ""),
  ].filter(Boolean);

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
          <View style={styles.contactRow}>
            {contactParts.map((part, i) => (
              <Text key={i}>
                {part} {i < contactParts.length - 1 ? " | " : ""}
              </Text>
            ))}
          </View>
        </View>

        {/* Summary */}
        {profile?.summary && (
          <View style={styles.section}>
            <View style={styles.pillTitleContainer}>
              <Text style={styles.pillTitle}>Summary</Text>
            </View>
            <Text style={styles.description}>{profile.summary}</Text>
          </View>
        )}

        {/* Skills */}
        {userSkills && userSkills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.pillTitleContainer}>
              <Text style={styles.pillTitle}>Technical Skills</Text>
            </View>
            <View style={styles.skillGrid}>
              {userSkills
                .flatMap((g) => g.skills)
                .map((skill, i) => (
                  <Text key={i} style={styles.skillItem}>
                    - {skill.name}
                  </Text>
                ))}
            </View>
          </View>
        )}

        {/* Experience */}
        {workExperiences && workExperiences.length > 0 && (
          <View style={styles.section}>
            <View style={styles.pillTitleContainer}>
              <Text style={styles.pillTitle}>Professional Experience</Text>
            </View>
            {workExperiences.map((exp, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryLeft}>
                    <Text style={styles.employer}>{exp.employer}</Text>
                    <Text style={styles.entryJobTitle}> - {exp.jobTitle}</Text>
                  </View>
                  <Text style={styles.entryDate}>
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </Text>
                </View>
                {exp.description && (
                  <Text style={styles.description}>{exp.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {educationRecords && educationRecords.length > 0 && (
          <View style={styles.section}>
            <View style={styles.pillTitleContainer}>
              <Text style={styles.pillTitle}>Education</Text>
            </View>
            {educationRecords.map((edu, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.eduTitle}>
                    {edu.degreeLevel ? `${edu.degreeLevel} in ` : ""}
                    {edu.qualification}
                  </Text>
                  <Text style={styles.entryDate}>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </Text>
                </View>
                <Text style={styles.eduInst}>{edu.institution}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projectRecords && projectRecords.length > 0 && (
          <View style={styles.section}>
            <View style={styles.pillTitleContainer}>
              <Text style={styles.pillTitle}>Projects</Text>
            </View>
            {projectRecords.map((proj, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.eduTitle}>{proj.name}</Text>
                  <Text style={styles.entryDate}>
                    {formatDate(proj.startDate)} - {formatDate(proj.endDate)}
                  </Text>
                </View>
                <Text style={styles.eduInst}>{proj.role}</Text>
                {proj.description && (
                  <Text style={styles.description}>{proj.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.section}>
          <View style={styles.pillTitleContainer}>
            <Text style={styles.pillTitle}>Additional Information</Text>
          </View>
          <View style={styles.addInfoContainer}>
            {languageSkills && languageSkills.length > 0 && (
              <View style={styles.addInfoRow}>
                <Text style={styles.label}>Languages:</Text>
                <Text style={{ fontSize: 10 }}>
                  {languageSkills.map((l) => l.language).join(", ")}
                </Text>
              </View>
            )}
            {certificationsRecords && certificationsRecords.length > 0 && (
              <View style={styles.addInfoRow}>
                <Text style={styles.label}>Certifications:</Text>
                <Text style={{ fontSize: 10 }}>
                  {certificationsRecords
                    .map((c) => `${c.name}${c.issuer ? ` (${c.issuer})` : ""}`)
                    .join(", ")}
                </Text>
              </View>
            )}
            {positionsOfResponsibilityRecords &&
              positionsOfResponsibilityRecords.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  <Text style={[styles.label, { marginBottom: 2 }]}>
                    Leadership & Activities:
                  </Text>
                  {positionsOfResponsibilityRecords.map((pos, i) => (
                    <Text key={i} style={{ fontSize: 10, marginBottom: 2 }}>
                      • {pos.name}: {pos.description} (
                      {formatDate(pos.startDate)} - {formatDate(pos.endDate)})
                    </Text>
                  ))}
                </View>
              )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
