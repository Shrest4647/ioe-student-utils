import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman", // Lora fallback
    color: "#333",
  },
  header: {
    backgroundColor: "#F3F4F6", // gray-100
    paddingHorizontal: 48,
    paddingVertical: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
    color: "#1F2937", // gray-800
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "medium",
    color: "#4B5563", // gray-600
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  contactText: {
    fontSize: 9,
    color: "#4B5563",
    marginRight: 6,
    fontWeight: "medium",
  },
  divider: {
    height: 8,
    backgroundColor: "#4B5563", // gray-600
    width: "100%",
  },
  content: {
    paddingHorizontal: 48,
    paddingVertical: 40,
  },
  summarySection: {
    marginBottom: 40,
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#6B7280", // gray-500
    borderBottomWidth: 2,
    borderBottomColor: "#D1D5DB", // gray-300
    paddingBottom: 4,
    marginBottom: 10,
    letterSpacing: 2,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#4B5563",
    textAlign: "justify",
  },
  columns: {
    flexDirection: "row",
  },
  leftColumn: {
    width: "33%",
    borderRightWidth: 2,
    borderRightColor: "#E5E7EB", // gray-200
    paddingRight: 32,
  },
  rightColumn: {
    width: "67%",
    paddingLeft: 32,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "medium",
    textTransform: "uppercase",
    color: "#6B7280",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingBottom: 4,
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  // Sub-items
  entry: {
    marginBottom: 12,
  },
  entryTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1F2937",
  },
  entrySubtitle: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#4B5563",
    marginBottom: 2,
  },
  entryDate: {
    fontSize: 8,
    color: "#6B7280",
  },
  text: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#4B5563",
    textAlign: "justify",
  },
  skillItem: {
    fontSize: 9,
    color: "#4B5563",
    marginBottom: 2,
  },
  // Right Col
  expEntry: {
    marginBottom: 16,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  expTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F2937",
  },
  expEmployerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  expEmployer: {
    fontSize: 10,
    fontWeight: "medium",
    color: "#4B5563",
  },
  expDate: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#6B7280",
  },
});

interface ResumePDFProps {
  data: ResumeData;
}

export function SimpleCleanPdf({ data }: ResumePDFProps) {
  const {
    profile,
    workExperiences,
    educationRecords,
    userSkills,
    projectRecords,
    certificationsRecords,
    positionsOfResponsibilityRecords,
  } = data;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    return new Date(dateString).getFullYear().toString();
  };

  const formatFullDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
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
          <View style={styles.headerLeft}>
            <Text style={styles.name}>
              {profile?.firstName} {profile?.lastName}
            </Text>
            <Text style={styles.jobTitle}>
              {workExperiences?.[0]?.jobTitle}
            </Text>
          </View>
          <View style={styles.headerRight}>
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
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <View style={styles.content}>
          {/* Summary */}
          {profile?.summary && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryText}>{profile.summary}</Text>
            </View>
          )}

          <View style={styles.columns}>
            {/* Left Column */}
            <View style={styles.leftColumn}>
              {educationRecords && educationRecords.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Education</Text>
                  {educationRecords.map((edu, i) => (
                    <View key={i} style={styles.entry}>
                      <Text style={styles.entryTitle}>{edu.institution}</Text>
                      <Text style={styles.entrySubtitle}>
                        {edu.degreeLevel}, {edu.qualification}
                      </Text>
                      <Text style={styles.entryDate}>
                        {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {userSkills && userSkills.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Skills</Text>
                  {userSkills
                    .flatMap((group) => group.skills)
                    .map((skill, i) => (
                      <Text key={i} style={styles.skillItem}>
                        • {skill.name}
                      </Text>
                    ))}
                </View>
              )}

              {certificationsRecords && certificationsRecords.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Certifications</Text>
                  {certificationsRecords.map((cert, i) => (
                    <View key={i} style={{ marginBottom: 4 }}>
                      <Text style={[styles.entryTitle, { fontSize: 10 }]}>
                        {cert.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Right Column */}
            <View style={styles.rightColumn}>
              {workExperiences && workExperiences.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Professional Experience
                  </Text>
                  {workExperiences.map((exp, i) => (
                    <View key={i} style={styles.expEntry}>
                      <View style={styles.expHeader}>
                        <Text style={styles.expTitle}>{exp.jobTitle}</Text>
                      </View>
                      <View style={styles.expEmployerRow}>
                        <Text style={styles.expEmployer}>{exp.employer}</Text>
                        <Text style={styles.expDate}>
                          {formatFullDate(exp.startDate)} –{" "}
                          {formatFullDate(exp.endDate)}
                        </Text>
                      </View>
                      {exp.description && (
                        <Text style={styles.text}>{exp.description}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {projectRecords && projectRecords.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Projects</Text>
                  {projectRecords.map((proj, i) => (
                    <View key={i} style={styles.entry}>
                      <View style={styles.expHeader}>
                        <Text style={styles.expTitle}>{proj.name}</Text>
                        <Text style={styles.expDate}>
                          {formatFullDate(proj.startDate)} –{" "}
                          {formatFullDate(proj.endDate)}
                        </Text>
                      </View>
                      {proj.description && (
                        <Text style={styles.text}>{proj.description}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {positionsOfResponsibilityRecords &&
                positionsOfResponsibilityRecords.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Leadership</Text>
                    {positionsOfResponsibilityRecords.map((pos, i) => (
                      <View key={i} style={styles.entry}>
                        <View style={styles.expHeader}>
                          <Text style={styles.expTitle}>{pos.name}</Text>
                          <Text style={styles.expDate}>
                            {formatFullDate(pos.startDate)} –{" "}
                            {formatFullDate(pos.endDate)}
                          </Text>
                        </View>
                        {pos.description && (
                          <Text style={styles.text}>{pos.description}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
