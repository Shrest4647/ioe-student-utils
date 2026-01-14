import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

const themeColor = "#2D3748";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#4A5568",
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  headerName: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
    color: themeColor,
    letterSpacing: 1.2,
  },
  headerContact: {
    fontSize: 9,
    flexDirection: "row",
    gap: 12,
    color: "#4A5568",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 6,
    marginTop: 8,
    width: "100%",
    justifyContent: "center",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  container: {
    flexDirection: "row",
    gap: 24,
    height: "100%",
  },
  leftColumn: {
    width: "35%",
    borderRightWidth: 1,
    borderRightColor: "#ccc",
    paddingRight: 16,
  },
  rightColumn: {
    width: "65%",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 8,
    color: themeColor,
    letterSpacing: 1.5,
  },
  profileTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  profileLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
    marginLeft: 10,
  },
  item: {
    marginBottom: 10,
  },
  itemTitle: {
    fontWeight: "bold",
    fontSize: 10,
    color: themeColor,
    textTransform: "uppercase",
  },
  itemSubtitle: {
    fontSize: 9,
    color: "#4A5568",
    marginBottom: 1,
  },
  itemDate: {
    fontSize: 9,
    color: "#666",
    fontWeight: "bold",
    marginBottom: 1,
  },
  itemDescription: {
    fontSize: 9,
    color: "#4A5568",
    textAlign: "justify",
    lineHeight: 1.4,
  },
  skillGroup: {
    marginBottom: 8,
  },
  skillCategory: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#666",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 1,
  },
  skillItem: {
    fontSize: 9,
    color: "#4A5568",
    marginLeft: 4,
    marginBottom: 1,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
    fontSize: 9,
  },
  awardsItem: {
    marginBottom: 6,
  },
});

interface MinimalistPdfProps {
  data: ResumeData;
}

export function MinimalistPdf({ data }: MinimalistPdfProps) {
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

  const contactItems = [
    formatAddress(),
    profile?.web ? profile.web.replace(/^https?:\/\//, "") : null,
    profile?.email,
    profile?.phone,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerName}>
            {profile?.firstName} {profile?.lastName}
          </Text>
          <View style={styles.headerContact}>
            {contactItems.map((item, idx) => (
              <Text key={idx}>
                {item}
                {idx < contactItems.length - 1 ? "   " : ""}
              </Text>
            ))}
          </View>
        </View>

        {/* Profile Summary */}
        {profile?.summary && (
          <View style={styles.section}>
            <View style={styles.profileTitle}>
              <Text style={styles.sectionTitle}>Profile Info</Text>
              <View style={styles.profileLine} />
            </View>
            <Text style={styles.itemDescription}>{profile.summary}</Text>
          </View>
        )}

        <View style={styles.container}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Education */}
            {educationRecords && educationRecords.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                {educationRecords.map((edu, idx) => (
                  <View key={idx} style={styles.item}>
                    <Text
                      style={[
                        styles.itemDate,
                        { fontWeight: "bold", color: "#4A5568" },
                      ]}
                    >
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </Text>
                    <Text style={styles.itemTitle}>{edu.institution}</Text>
                    <Text style={styles.itemSubtitle}>{edu.qualification}</Text>
                    {edu.degreeLevel && (
                      <Text
                        style={{
                          fontSize: 9,
                          fontStyle: "italic",
                          color: "#777",
                        }}
                      >
                        {edu.degreeLevel}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Skills */}
            {userSkills && userSkills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills</Text>
                {userSkills.map((group, idx) => (
                  <View key={idx} style={styles.skillGroup}>
                    <Text style={styles.skillCategory}>{group.category}</Text>
                    {group.skills.map((skill, sIdx) => (
                      <Text key={sIdx} style={styles.skillItem}>
                        - {skill.name}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Languages */}
            {languageSkills && languageSkills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Languages</Text>
                {languageSkills.map((lang, idx) => (
                  <View key={idx} style={styles.languageItem}>
                    <Text style={{ fontWeight: "medium" }}>
                      {lang.language}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Awards */}
            {certificationsRecords && certificationsRecords.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Awards</Text>
                {certificationsRecords.map((cert, idx) => (
                  <View key={idx} style={styles.awardsItem}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 9,
                        color: "#4A5568",
                      }}
                    >
                      {cert.name}
                    </Text>
                    {cert.issuer && (
                      <Text style={{ fontSize: 9, color: "#666" }}>
                        {cert.issuer}
                      </Text>
                    )}
                    {cert.issueDate && (
                      <Text style={{ fontSize: 8, color: "#888" }}>
                        {formatDate(cert.issueDate)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Experience */}
            {workExperiences && workExperiences.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Work Experience</Text>
                {workExperiences.map((exp, idx) => (
                  <View key={idx} style={styles.item}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 2,
                        alignItems: "baseline",
                      }}
                    >
                      <Text
                        style={[
                          styles.itemTitle,
                          { color: "#4A5568", fontSize: 11 },
                        ]}
                      >
                        {exp.employer}
                      </Text>
                      <Text
                        style={[
                          styles.itemDate,
                          { textTransform: "uppercase", fontSize: 8 },
                        ]}
                      >
                        {formatFullDate(exp.startDate)} -{" "}
                        {formatFullDate(exp.endDate)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.itemSubtitle,
                        { fontStyle: "italic", marginBottom: 4 },
                      ]}
                    >
                      {exp.jobTitle}
                    </Text>
                    {exp.description && (
                      <Text style={styles.itemDescription}>
                        {exp.description}
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
                {projectRecords.map((proj, idx) => (
                  <View key={idx} style={styles.item}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 2,
                        alignItems: "baseline",
                      }}
                    >
                      <Text
                        style={[
                          styles.itemTitle,
                          { color: "#4A5568", fontSize: 11 },
                        ]}
                      >
                        {proj.name}
                      </Text>
                      <Text
                        style={[
                          styles.itemDate,
                          { textTransform: "uppercase", fontSize: 8 },
                        ]}
                      >
                        {formatFullDate(proj.startDate)} -{" "}
                        {formatFullDate(proj.endDate)}
                      </Text>
                    </View>
                    {proj.role && (
                      <Text
                        style={[
                          styles.itemSubtitle,
                          { fontStyle: "italic", marginBottom: 4 },
                        ]}
                      >
                        {proj.role}
                      </Text>
                    )}
                    {proj.description && (
                      <Text style={styles.itemDescription}>
                        {proj.description}
                      </Text>
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
                  {positionsOfResponsibilityRecords.map((pos, idx) => (
                    <View key={idx} style={styles.item}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 2,
                          alignItems: "baseline",
                        }}
                      >
                        <Text
                          style={[
                            styles.itemTitle,
                            { color: "#4A5568", fontSize: 11 },
                          ]}
                        >
                          {pos.name}
                        </Text>
                        <Text
                          style={[
                            styles.itemDate,
                            { textTransform: "uppercase", fontSize: 8 },
                          ]}
                        >
                          {formatFullDate(pos.startDate)} -{" "}
                          {formatFullDate(pos.endDate)}
                        </Text>
                      </View>
                      {pos.description && (
                        <Text style={styles.itemDescription}>
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
