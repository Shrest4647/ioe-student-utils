import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#333",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 10,
  },
  headerName: {
    fontSize: 24,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  headerContact: {
    fontSize: 9,
    flexDirection: "row",
    gap: 10,
    color: "#666",
  },
  containter: {
    flexDirection: "row",
    gap: 20,
  },
  leftColumn: {
    width: "35%",
    borderRightWidth: 1,
    borderRightColor: "#eee",
    paddingRight: 15,
  },
  rightColumn: {
    width: "65%",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 8,
    color: "#000",
  },
  item: {
    marginBottom: 8,
  },
  itemTitle: {
    fontWeight: "bold",
    fontSize: 10,
  },
  itemSubtitle: {
    fontSize: 9,
    color: "#444",
  },
  itemDate: {
    fontSize: 9,
    color: "#888",
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 9,
    color: "#555",
    textAlign: "justify",
  },
  skillGroup: {
    marginBottom: 8,
  },
  skillCategory: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#444",
  },
  skillText: {
    fontSize: 9,
    color: "#555",
  },
});

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "Present";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
};

interface MinimalistPdfProps {
  data: ResumeData;
}

export function MinimalistPdf({ data }: MinimalistPdfProps) {
  const profile = data?.profile;

  const contactItems = [
    profile?.email,
    profile?.phone,
    profile?.address?.city && profile?.address?.state
      ? `${profile.address.city}, ${profile.address.state}`
      : null,
    profile?.web ? profile.web.replace(/^https?:\/\//, "") : null,
  ].filter(Boolean);

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerName}>
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text style={styles.headerTitle}>
          {data?.workExperiences?.[0]?.jobTitle || "Professional Title"}
        </Text>
        <View style={styles.headerContact}>
          {contactItems.map((item, idx) => (
            <Text key={idx}>
              {item}
              {idx < contactItems.length - 1 ? " | " : ""}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.containter}>
        {/* Left Column */}
        <View style={styles.leftColumn}>
          {/* Education */}
          {data?.educationRecords && data.educationRecords.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Education</Text>
              {data.educationRecords.map((edu, idx) => (
                <View key={idx} style={styles.item}>
                  <Text style={styles.itemDate}>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </Text>
                  <Text style={styles.itemTitle}>{edu.degreeLevel}</Text>
                  <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Skills */}
          {data?.userSkills && data.userSkills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills</Text>
              {data.userSkills.map((group, idx) => (
                <View key={idx} style={styles.skillGroup}>
                  <Text style={styles.skillCategory}>{group.category}</Text>
                  {group.skills.map((skill, sIdx) => (
                    <Text key={sIdx} style={styles.skillText}>
                      • {skill.name}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Languages */}
          {data?.languageSkills && data.languageSkills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Languages</Text>
              {data.languageSkills.map((lang, idx) => (
                <Text key={idx} style={styles.skillText}>
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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile</Text>
              <Text style={styles.itemDescription}>{profile.summary}</Text>
            </View>
          )}

          {/* Experience */}
          {data?.workExperiences && data.workExperiences.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experience</Text>
              {data.workExperiences.map((exp, idx) => (
                <View key={idx} style={styles.item}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 2,
                    }}
                  >
                    <Text style={styles.itemTitle}>{exp.jobTitle}</Text>
                    <Text style={styles.itemDate}>
                      {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtitle}>{exp.employer}</Text>
                  {exp.description && (
                    <Text style={[styles.itemDescription, { marginTop: 4 }]}>
                      {exp.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Projects */}
          {data?.projectRecords && data?.projectRecords.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projects</Text>
              {data.projectRecords.map((proj, idx) => (
                <View key={idx} style={styles.item}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 2,
                    }}
                  >
                    <Text style={styles.itemTitle}>{proj.name}</Text>
                    <Text style={styles.itemDate}>
                      {formatDate(proj.startDate)} - {formatDate(proj.endDate)}
                    </Text>
                  </View>
                  {proj.description && (
                    <Text style={styles.itemDescription}>
                      {proj.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Page>
  );
}
