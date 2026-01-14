import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#333",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  name: {
    fontSize: 18,
    fontWeight: "heavy",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingBottom: 8,
    color: "#111",
    letterSpacing: 1.2,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 15,
    fontSize: 9,
    color: "#555",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 10,
    paddingBottom: 4,
    color: "#111",
    letterSpacing: 1,
  },
  // Professional Entry
  entry: {
    marginBottom: 12,
  },
  entryMeta: {
    flexDirection: "row",
    marginBottom: 2,
    fontSize: 9,
    color: "#666",
    fontWeight: "medium",
  },
  entryTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 3,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    textAlign: "justify",
    color: "#444",
  },
  // Skills
  skillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "30%",
  },
  bullet: {
    width: 3,
    height: 3,
    backgroundColor: "#333",
    borderRadius: 50,
    marginRight: 6,
  },
});

interface ResumePDFProps {
  data: ResumeData;
}

export function ProfessionalPdf({ data }: ResumePDFProps) {
  const {
    profile,
    workExperiences,
    educationRecords,
    userSkills,
    projectRecords,
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
    return [addr.city, addr.state, addr.country].filter(Boolean).join(", ");
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {profile?.firstName} {profile?.lastName}
          </Text>
          <View style={styles.contactRow}>
            {profile?.phone && <Text>{profile.phone}</Text>}
            {profile?.email && <Text>{profile.email}</Text>}
            {formatAddress() && <Text>{formatAddress()}</Text>}
            {profile?.web && (
              <Text>{profile.web.replace(/^https?:\/\//, "")}</Text>
            )}
            {profile?.linkedIn && <Text>LinkedIn</Text>}
          </View>
        </View>

        {/* About Me */}
        {profile?.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.text}>{profile.summary}</Text>
          </View>
        )}

        {/* Education */}
        {educationRecords && educationRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {educationRecords.map((edu, i) => (
              <View key={i} style={styles.entry}>
                <Text style={styles.entryMeta}>
                  {edu.institution} | {formatDate(edu.startDate)} -{" "}
                  {formatDate(edu.endDate)}
                </Text>
                <Text style={styles.entryTitle}>
                  {edu.qualification}
                  {edu.degreeLevel ? ` — ${edu.degreeLevel}` : ""}
                </Text>
                {edu.description && (
                  <Text style={styles.text}>{edu.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Work Experience */}
        {workExperiences && workExperiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {workExperiences.map((exp, i) => (
              <View key={i} style={styles.entry}>
                <Text style={styles.entryMeta}>
                  {exp.employer} | {formatDate(exp.startDate)} -{" "}
                  {formatDate(exp.endDate)}
                </Text>
                <Text style={styles.entryTitle}>{exp.jobTitle}</Text>
                {exp.description && (
                  <Text style={styles.text}>{exp.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {userSkills && userSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillGrid}>
              {userSkills
                .flatMap((group) => group.skills)
                .map((skill, i) => (
                  <View key={i} style={styles.skillItem}>
                    <View style={styles.bullet} />
                    <Text>{skill.name}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Projects */}
        {projectRecords && projectRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projectRecords.map((proj, i) => (
              <View key={i} style={styles.entry}>
                <Text style={styles.entryTitle}>{proj.name}</Text>
                <Text style={[styles.entryMeta, { marginBottom: 4 }]}>
                  {proj.role ? `${proj.role} • ` : ""}
                  {formatDate(proj.startDate)} - {formatDate(proj.endDate)}
                </Text>
                {proj.description && (
                  <Text style={styles.text}>{proj.description}</Text>
                )}
                {proj.referenceLink && (
                  <Text style={{ fontSize: 9, color: "blue", marginTop: 2 }}>
                    {proj.referenceLink}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
