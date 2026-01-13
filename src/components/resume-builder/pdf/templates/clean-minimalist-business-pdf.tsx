"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#222",
  },
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: "heavy",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#444",
  },
  container: {
    flexDirection: "row",
    gap: 20,
    height: "100%",
  },
  leftColumn: {
    width: "30%",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    paddingRight: 10,
  },
  rightColumn: {
    width: "70%",
    paddingLeft: 5,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
    color: "#000",
  },
  // Contact
  contactList: {
    gap: 6,
  },
  contactItem: {
    marginBottom: 3,
  },
  contactText: {
    fontSize: 9,
    color: "#333",
  },
  // Left Column Item
  item: {
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000",
  },
  itemDate: {
    fontSize: 8,
    color: "#666",
    marginBottom: 1,
  },
  itemSubtitle: {
    fontSize: 8,
    color: "#444",
  },
  // Skills list
  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  bullet: {
    width: 3,
    height: 3,
    backgroundColor: "#000",
    borderRadius: 50,
    marginRight: 6,
  },
  skillText: {
    fontSize: 9,
    color: "#333",
  },
  // Right Column Entries
  entry: {
    marginBottom: 12,
  },
  entryJobTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#555",
    marginBottom: 1,
  },
  entryEmployer: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 1,
  },
  entryTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 1,
  },
  entryDateRow: {
    fontSize: 8,
    fontStyle: "italic",
    color: "#666",
    marginBottom: 3,
  },
  text: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#333",
    textAlign: "justify",
  },
});

interface ResumePDFProps {
  data: ResumeData;
  template?: string;
}

export function CleanMinimalistBusinessPdf({ data }: ResumePDFProps) {
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

        <View style={styles.container}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Contact */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              <View style={styles.contactList}>
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
            </View>

            {/* Education */}
            {educationRecords && educationRecords.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                {educationRecords.map((edu, i) => (
                  <View key={i} style={styles.item}>
                    <Text style={styles.itemTitle}>{edu.institution}</Text>
                    <Text style={styles.itemDate}>
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </Text>
                    <Text style={styles.itemSubtitle}>
                      {edu.degreeLevel}, {edu.qualification}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Awards & Certifications */}
            {certificationsRecords && certificationsRecords.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Awards & Certifications</Text>
                {certificationsRecords.map((cert, i) => (
                  <View key={i} style={styles.skillRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.skillText}>{cert.name}</Text>
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
                    <View key={i} style={styles.skillRow}>
                      <View style={styles.bullet} />
                      <Text style={styles.skillText}>{skill.name}</Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Languages */}
            {languageSkills && languageSkills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Languages</Text>
                {languageSkills.map((lang, i) => (
                  <View key={i} style={styles.skillRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.skillText}>{lang.language}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Profile Summary */}
            {profile?.summary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile</Text>
                <Text style={styles.text}>{profile.summary}</Text>
              </View>
            )}

            {/* Work Experience */}
            {workExperiences && workExperiences.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Work Experience</Text>
                {workExperiences.map((exp, i) => (
                  <View key={i} style={styles.entry}>
                    <Text style={styles.entryJobTitle}>{exp.jobTitle}</Text>
                    <Text style={styles.entryEmployer}>{exp.employer}</Text>
                    <Text style={styles.entryDateRow}>
                      {formatFullDate(exp.startDate)} –{" "}
                      {formatFullDate(exp.endDate)}
                    </Text>
                    {exp.description && (
                      <Text style={styles.text}>{exp.description}</Text>
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
                  <View key={i} style={styles.entry}>
                    <Text style={styles.entryTitle}>{proj.name}</Text>
                    <Text style={styles.entryDateRow}>
                      {formatFullDate(proj.startDate)} –{" "}
                      {formatFullDate(proj.endDate)}
                    </Text>
                    {proj.description && (
                      <Text style={styles.text}>{proj.description}</Text>
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
                    <View key={i} style={styles.entry}>
                      <Text style={styles.entryTitle}>{pos.name}</Text>
                      <Text style={styles.entryDateRow}>
                        {formatFullDate(pos.startDate)} –{" "}
                        {formatFullDate(pos.endDate)}
                      </Text>
                      {pos.description && (
                        <Text style={styles.text}>{pos.description}</Text>
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
