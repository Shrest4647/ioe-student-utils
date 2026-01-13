import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.3,
    color: "#000",
  },
  header: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 5,
    paddingBottom: 10,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 15,
    fontSize: 9,
    color: "#444",
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 15,
    objectFit: "cover",
    borderWidth: 1,
    borderColor: "#eee",
  },
  summarySection: {
    marginBottom: 15,
  },
  summaryText: {
    textAlign: "justify",
    fontSize: 10,
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    marginBottom: 10,
    paddingBottom: 2,
    letterSpacing: 1,
  },
  entry: {
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  entryTitle: {
    fontSize: 11,
    fontWeight: "bold",
  },
  entryDate: {
    fontSize: 9,
    color: "#666",
    fontWeight: "bold",
  },
  entrySubtitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  entrySubtitle: {
    fontSize: 10,
    fontStyle: "italic",
    color: "#333",
  },
  entryLocation: {
    fontSize: 9,
    color: "#666",
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    textAlign: "justify",
  },
  skillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  skillItem: {
    width: "48%", // Two columns roughly
    flexDirection: "row",
    marginBottom: 5,
  },
  skillCategory: {
    fontWeight: "bold",
    marginRight: 5,
    fontSize: 10,
  },
  skillList: {
    flex: 1,
    fontSize: 10,
    color: "#333",
  },
  link: {
    color: "#333",
    textDecoration: "none",
  },
});

interface ResumePDFProps {
  data: ResumeData;
}

export function ClassicPdf({ data }: ResumePDFProps) {
  const {
    profile,
    workExperiences,
    educationRecords,
    userSkills,
    projectRecords,
    certificationsRecords,
    positionsOfResponsibilityRecords,
    languageSkills,
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

  const toSentenceCase = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.name}>
              {profile?.firstName} {profile?.lastName}
            </Text>
            <View style={styles.contactRow}>
              {profile?.email && <Text>{profile.email}</Text>}
              {profile?.phone && <Text>{profile.phone}</Text>}
              {formatAddress() && <Text>{formatAddress()}</Text>}
              {profile?.linkedIn && <Text>LinkedIn</Text>}
              {profile?.web && (
                <Text>
                  <Link style={styles.link} href={profile.web}>
                    {profile.web}
                  </Link>
                </Text>
              )}
            </View>
          </View>
          {/* Photo (Optional in PDF but present in web) */}
          {profile?.photoUrl && (
            <Image src={profile.photoUrl} style={styles.photo} />
          )}
        </View>

        {/* Summary */}
        {profile?.summary && (
          <View style={styles.summarySection}>
            {/* No title in web version for summary inside header block usually, but let's keep it clean */}
            <Text style={styles.summaryText}>{profile.summary}</Text>
          </View>
        )}

        {/* Work Experience */}
        {workExperiences && workExperiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {workExperiences.map((exp, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{exp.jobTitle}</Text>
                  <Text style={styles.entryDate}>
                    {formatDate(exp.startDate)} – {formatDate(exp.endDate)}
                  </Text>
                </View>
                <View style={styles.entrySubtitleRow}>
                  <Text style={styles.entrySubtitle}>{exp.employer}</Text>
                  <Text style={styles.entryLocation}>
                    {[exp.city, exp.country].filter(Boolean).join(", ")}
                  </Text>
                </View>

                {exp.description && (
                  <Text style={styles.text}>{exp.description}</Text>
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
                  <Text style={styles.entryTitle}>{edu.institution}</Text>
                  <Text style={styles.entryDate}>
                    {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                  </Text>
                </View>
                <View style={styles.entrySubtitleRow}>
                  <Text style={styles.entrySubtitle}>
                    {edu.qualification}{" "}
                    {edu.degreeLevel ? `- ${edu.degreeLevel}` : ""}
                  </Text>
                </View>
                {(edu.grade || edu.gradeType) && (
                  <Text style={{ fontSize: 9, color: "#555", marginBottom: 2 }}>
                    Grade: {edu.grade} {edu.gradeType && `(${edu.gradeType})`}
                  </Text>
                )}
                {edu.description && (
                  <Text style={styles.text}>{edu.description}</Text>
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
              {userSkills.map((group, i) => (
                <View key={i} style={styles.skillItem}>
                  <Text style={styles.skillCategory}>
                    {toSentenceCase(group.category)}:
                  </Text>
                  <Text style={styles.skillList}>
                    {group.skills.map((s) => s.name).join(", ")}
                  </Text>
                </View>
              ))}
              {languageSkills && languageSkills.length > 0 && (
                <View style={styles.skillItem}>
                  <Text style={styles.skillCategory}>Languages:</Text>
                  <Text style={styles.skillList}>
                    {languageSkills.map((l) => l.language).join(", ")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Projects */}
        {projectRecords && projectRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projectRecords.map((proj, i) => (
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{proj.name}</Text>
                  <Text style={styles.entryDate}>
                    {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                  </Text>
                </View>
                {proj.role && (
                  <Text
                    style={{
                      fontSize: 9,
                      fontStyle: "italic",
                      marginBottom: 2,
                    }}
                  >
                    {proj.role}
                  </Text>
                )}
                {proj.description && (
                  <Text style={styles.text}>{proj.description}</Text>
                )}
                {proj.referenceLink && (
                  <Text style={{ fontSize: 9, color: "blue", marginTop: 2 }}>
                    <Link style={styles.link} href={proj.referenceLink}>
                      Reference
                    </Link>
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
              <Text style={styles.sectionTitle}>
                Positions of Responsibility
              </Text>
              {positionsOfResponsibilityRecords.map((pos, i) => (
                <View key={i} style={styles.entry}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{pos.name}</Text>
                    <Text style={styles.entryDate}>
                      {formatDate(pos.startDate)} – {formatDate(pos.endDate)}
                    </Text>
                  </View>
                  {pos.description && (
                    <Text style={styles.text}>{pos.description}</Text>
                  )}
                  {pos.referenceLink && (
                    <Text style={{ fontSize: 9, color: "blue", marginTop: 2 }}>
                      {pos.referenceLink}
                    </Text>
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
              <View key={i} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{cert.name}</Text>
                  {cert.issueDate && (
                    <Text style={styles.entryDate}>
                      {formatDate(cert.issueDate)}
                    </Text>
                  )}
                </View>
                {cert.issuer && (
                  <Text style={styles.entrySubtitle}>{cert.issuer}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
