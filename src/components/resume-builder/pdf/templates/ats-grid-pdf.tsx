import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    padding: 30,
    fontSize: 9,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#999",
    paddingBottom: 20,
  },
  initialsCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E5E7EB", // gray-200
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#D1D5DB", // gray-300
    marginRight: 20,
  },
  initials: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#9CA3AF", // gray-400
  },
  name: {
    fontSize: 32,
    textTransform: "uppercase",
    color: "#374151", // gray-700
    marginBottom: 4,
  },
  lastName: {
    fontWeight: "heavy", // bold isn't strictly heavy in standard pdf fonts but works
    color: "#1F2937", // gray-800
  },
  jobTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#6B7280", // gray-500
  },
  container: {
    flexDirection: "row",
    height: "100%",
  },
  leftColumn: {
    width: "35%",
    borderRightWidth: 2,
    borderRightColor: "#999",
    paddingRight: 15,
  },
  rightColumn: {
    width: "65%",
    paddingLeft: 20,
  },
  // Section Headers
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 10,
  },
  leftSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 10,
  },

  // Left Sidebar items
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  contactText: {
    fontSize: 9,
    color: "#374151",
  },
  eduItem: {
    marginBottom: 10,
  },
  degree: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1F2937",
  },
  institution: {
    fontSize: 9,
    fontWeight: "medium",
    color: "#374151",
  },
  eduDate: {
    fontSize: 8,
    fontStyle: "italic",
    color: "#6B7280",
  },

  // Skills
  skillList: {
    // marginLeft: 8,
  },
  skillItem: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 2,
  },

  // Right Column Items
  profileText: {
    fontSize: 9,
    color: "#374151",
    textAlign: "justify",
    lineHeight: 1.5,
  },
  workEntry: {
    marginBottom: 15,
  },
  workHeader: {
    marginBottom: 2,
  },
  workTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1F2937",
  },
  dividerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  employer: {
    fontSize: 10,
    fontWeight: "medium",
    color: "#4B5563",
  },
  workDate: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#4B5563",
  },
  description: {
    fontSize: 9,
    color: "#374151",
    textAlign: "justify",
    lineHeight: 1.4,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bullet: {
    width: 3,
    height: 3,
    backgroundColor: "#374151",
    borderRadius: "50%",
    marginTop: 5,
    marginRight: 6,
  },
});

interface ResumePDFProps {
  data: ResumeData;
}

export function AtsGridPdf({ data }: ResumePDFProps) {
  const {
    profile,
    workExperiences,
    educationRecords,
    userSkills,
    projectRecords,
    languageSkills,
    positionsOfResponsibilityRecords,
  } = data;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    return new Date(dateString).getFullYear().toString();
  };

  const formatFullDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const formatAddress = () => {
    const addr = profile?.address;
    if (!addr) return null;
    return [addr.city, addr.state].filter(Boolean).join(", ");
  };

  const initials =
    (profile?.firstName?.[0] || "") + (profile?.lastName?.[0] || "");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.initialsCircle}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.name}>
              {profile?.firstName}{" "}
              <Text style={styles.lastName}>{profile?.lastName}</Text>
            </Text>
            <Text style={styles.jobTitle}>
              {workExperiences?.[0]?.jobTitle || "Professional Title"}
            </Text>
          </View>
        </View>

        <View style={styles.container}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Contact */}
            <View
              style={[
                styles.section,
                {
                  borderBottomWidth: 2,
                  borderBottomColor: "#999",
                  paddingBottom: 10,
                },
              ]}
            >
              <Text style={styles.leftSectionTitle}>Contact</Text>
              {profile?.phone && (
                <View style={styles.contactItem}>
                  <Text style={styles.contactText}>{profile.phone}</Text>
                </View>
              )}
              {profile?.email && (
                <View style={styles.contactItem}>
                  <Text style={styles.contactText}>{profile.email}</Text>
                </View>
              )}
              {formatAddress() && (
                <View style={styles.contactItem}>
                  <Text style={styles.contactText}>{formatAddress()}</Text>
                </View>
              )}
              {profile?.web && (
                <View style={styles.contactItem}>
                  <Text style={styles.contactText}>
                    {profile.web.replace(/^https?:\/\//, "")}
                  </Text>
                </View>
              )}
            </View>

            {/* Education */}
            {educationRecords && educationRecords.length > 0 && (
              <View
                style={[
                  styles.section,
                  {
                    borderBottomWidth: 2,
                    borderBottomColor: "#999",
                    paddingBottom: 10,
                  },
                ]}
              >
                <Text style={styles.leftSectionTitle}>Education</Text>
                {educationRecords.map((edu, i) => (
                  <View key={i} style={styles.eduItem}>
                    <Text style={styles.degree}>{edu.degreeLevel}</Text>
                    <Text style={styles.institution}>{edu.institution}</Text>
                    <Text style={styles.eduDate}>
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Skills */}
            {userSkills && userSkills.length > 0 && (
              <View
                style={[
                  styles.section,
                  {
                    borderBottomWidth: 2,
                    borderBottomColor: "#999",
                    paddingBottom: 10,
                  },
                ]}
              >
                <Text style={styles.leftSectionTitle}>Skills</Text>
                <View style={styles.skillList}>
                  {userSkills
                    .flatMap((g) => g.skills)
                    .map((skill, i) => (
                      <Text key={i} style={styles.skillItem}>
                        • {skill.name}
                      </Text>
                    ))}
                </View>
              </View>
            )}

            {/* Languages */}
            {languageSkills && languageSkills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.leftSectionTitle}>Language</Text>
                {languageSkills.map((lang, i) => (
                  <Text key={i} style={styles.skillItem}>
                    • {lang.language}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Profile */}
            {profile?.summary && (
              <View
                style={[
                  styles.section,
                  {
                    borderBottomWidth: 2,
                    borderBottomColor: "#999",
                    paddingBottom: 15,
                  },
                ]}
              >
                <Text style={styles.sectionTitle}>Profile</Text>
                <Text style={styles.profileText}>{profile.summary}</Text>
              </View>
            )}

            {/* Experience */}
            {workExperiences && workExperiences.length > 0 && (
              <View
                style={[
                  styles.section,
                  {
                    borderBottomWidth: 2,
                    borderBottomColor: "#999",
                    paddingBottom: 15,
                  },
                ]}
              >
                <Text style={styles.sectionTitle}>Experience</Text>
                {workExperiences.map((exp, i) => (
                  <View key={i} style={styles.workEntry}>
                    <Text style={styles.workTitle}>{exp.jobTitle}</Text>
                    <View style={styles.dividerRow}>
                      <Text style={styles.employer}>{exp.employer}</Text>
                      <Text style={styles.workDate}>
                        {formatFullDate(exp.startDate)} to{" "}
                        {formatFullDate(exp.endDate)}
                      </Text>
                    </View>
                    {exp.description && (
                      <View>
                        {exp.description.split("\n").map((line, lid) => {
                          const cleanLine = line.replace(/^[•-]\s*/, "").trim();
                          if (!cleanLine) return null;
                          return (
                            <View key={lid} style={styles.bulletItem}>
                              <View style={styles.bullet} />
                              <Text style={[styles.description, { flex: 1 }]}>
                                {cleanLine}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Projects */}
            {projectRecords && projectRecords.length > 0 && (
              <View
                style={[
                  styles.section,
                  {
                    borderBottomWidth: 2,
                    borderBottomColor: "#999",
                    paddingBottom: 15,
                  },
                ]}
              >
                <Text style={styles.sectionTitle}>Projects</Text>
                {projectRecords.map((proj, i) => (
                  <View key={i} style={styles.workEntry}>
                    <View style={styles.dividerRow}>
                      <Text style={styles.workTitle}>{proj.name}</Text>
                      <Text style={styles.workDate}>
                        {formatDate(proj.startDate)} -{" "}
                        {formatDate(proj.endDate)}
                      </Text>
                    </View>
                    {proj.description && (
                      <Text style={styles.description}>{proj.description}</Text>
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
                    <View key={i} style={styles.workEntry}>
                      <View style={styles.dividerRow}>
                        <Text style={styles.workTitle}>{pos.name}</Text>
                        <Text style={styles.workDate}>
                          {formatDate(pos.startDate)} -{" "}
                          {formatDate(pos.endDate)}
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
          </View>
        </View>
      </Page>
    </Document>
  );
}
