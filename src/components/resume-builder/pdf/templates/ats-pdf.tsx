import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    padding: 40,
    fontSize: 11,
    lineHeight: 1.3,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 5,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 10,
    paddingBottom: 10,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    fontSize: 10,
    marginBottom: 5,
  },
  linksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    fontSize: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 8,
    paddingBottom: 2,
  },
  // Entries
  entry: {
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  entryTitleLeft: {
    fontSize: 12,
    fontWeight: "bold",
  },
  entryTitleRight: {
    fontSize: 10,
  },
  entrySubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  employer: {
    fontStyle: "italic",
    fontSize: 11,
  },
  location: {
    fontSize: 9,
    fontStyle: "italic",
  },
  description: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "justify",
  },
  // Skills
  skillRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  skillCategory: {
    width: 120,
    fontWeight: "bold",
  },
  skillList: {
    flex: 1,
  },
});

interface ResumePDFProps {
  data: ResumeData;
}

export function AtsPdf({ data }: ResumePDFProps) {
  const {
    profile,
    workExperiences,
    educationRecords,
    userSkills,
    projectRecords,
    certificationsRecords,
    languageSkills,
  } = data;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Present";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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
            {profile?.email && <Text>{profile.email}</Text>}
            {profile?.phone && <Text>{profile.phone}</Text>}
            {formatAddress() && <Text>{formatAddress()}</Text>}
          </View>
          <View style={styles.linksRow}>
            {profile?.linkedIn && (
              <Text>
                LinkedIn: {profile.linkedIn.replace(/^https?:\/\//, "")}
              </Text>
            )}
            {profile?.github && (
              <Text>GitHub: {profile.github.replace(/^https?:\/\//, "")}</Text>
            )}
            {profile?.web && (
              <Text>Portfolio: {profile.web.replace(/^https?:\/\//, "")}</Text>
            )}
          </View>
        </View>

        {/* Summary */}
        {profile?.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.description}>{profile.summary}</Text>
          </View>
        )}

        {/* Skills */}
        {userSkills && userSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            {userSkills.map((cat, i) => (
              <View key={i} style={styles.skillRow}>
                <Text style={styles.skillCategory}>{cat.category}:</Text>
                <Text style={styles.skillList}>
                  {cat.skills.map((s) => s.name).join(", ")}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        {workExperiences && workExperiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {workExperiences.map((exp, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitleLeft}>
                    {exp.jobTitle} {exp.employer ? `| ${exp.employer}` : ""}
                  </Text>
                  <Text style={styles.entryTitleRight}>
                    {formatDate(exp.startDate)} – {formatDate(exp.endDate)}
                  </Text>
                </View>
                {/* Location row if desired, slightly redundant if employer is up there but classic ATS puts location right or below */}
                {(exp.city || exp.country) && (
                  <Text style={[styles.location, { marginBottom: 2 }]}>
                    {[exp.city, exp.country].filter(Boolean).join(", ")}
                  </Text>
                )}
                {exp.description && (
                  <Text style={styles.description}>{exp.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projectRecords && projectRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Projects</Text>
            {projectRecords.map((proj, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitleLeft}>{proj.name}</Text>
                  <Text style={styles.entryTitleRight}>
                    {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                  </Text>
                </View>
                {proj.role && (
                  <Text style={[styles.location, { marginBottom: 2 }]}>
                    {proj.role}
                  </Text>
                )}
                {proj.description && (
                  <Text style={styles.description}>{proj.description}</Text>
                )}
                {proj.referenceLink && (
                  <Text style={{ fontSize: 10, color: "blue" }}>
                    {proj.referenceLink}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {educationRecords && educationRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {educationRecords.map((edu, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitleLeft}>{edu.institution}</Text>
                  <Text style={styles.entryTitleRight}>
                    {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                  </Text>
                </View>
                <Text style={{ fontSize: 11 }}>
                  {edu.qualification}{" "}
                  {edu.degreeLevel ? `- ${edu.degreeLevel}` : ""}
                </Text>
                {edu.grade && (
                  <Text style={{ fontSize: 10 }}>Grade: {edu.grade}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certificationsRecords && certificationsRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certificationsRecords.map((cert, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ marginRight: 4 }}>•</Text>
                <Text style={{ fontWeight: "bold" }}>{cert.name}</Text>
                {cert.issuer && <Text> - {cert.issuer}</Text>}
                {cert.issueDate && <Text> ({formatDate(cert.issueDate)})</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Languages */}
        {languageSkills && languageSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={{ fontSize: 11 }}>
              {languageSkills.map((l) => l.language).join(", ")}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
