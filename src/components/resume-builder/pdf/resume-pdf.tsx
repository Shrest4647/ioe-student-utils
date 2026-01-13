"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

interface ResumePDFProps {
  data?: {
    profile?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
      photoUrl?: string;
      summary?: string;
      linkedIn?: string;
      github?: string;
      web?: string;
    };
    workExperiences?: Array<{
      jobTitle?: string;
      employer?: string;
      startDate?: string;
      endDate?: string;
      city?: string;
      country?: string;
      description?: string;
    }>;
    educationRecords?: Array<{
      institution?: string;
      qualification?: string;
      degreeLevel?: string;
      startDate?: string;
      endDate?: string;
      grade?: string;
      gradeType?: string;
      description?: string;
    }>;
    languageSkills?: Array<{
      language: string;
      listening?: string;
      reading?: string;
      speaking?: string;
      writing?: string;
    }>;
    userSkills?: Array<{
      category: string;
      skills: Array<{ name: string; proficiency?: string }>;
    }>;
  };
}

// Define styles matching Europass design
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.4,
    color: "#404040",
  },
  header: {
    backgroundColor: "#004494",
    color: "white",
    padding: 15,
    marginBottom: 20,
  },
  headerName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  headerContact: {
    fontSize: 10,
    marginBottom: 3,
  },
  headerLink: {
    color: "white",
    textDecoration: "underline",
  },
  summary: {
    marginTop: 10,
    fontSize: 10,
  },
  sectionTitle: {
    backgroundColor: "#004494",
    color: "white",
    padding: 6,
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  sectionItem: {
    marginBottom: 12,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#004494",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: "bold",
  },
  itemSubtitle: {
    fontSize: 10,
  },
  itemDate: {
    fontSize: 9,
    color: "#666",
  },
  itemLocation: {
    fontSize: 9,
    color: "#666",
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 10,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#004494",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    borderBottomStyle: "solid",
  },
  tableCell: {
    padding: 5,
    fontSize: 9,
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  skillCategory: {
    marginBottom: 8,
  },
  skillCategoryTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#004494",
    marginBottom: 4,
  },
  skillTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillTag: {
    backgroundColor: "#e8f0fe",
    color: "#004494",
    padding: 3,
    marginRight: 5,
    marginBottom: 3,
    borderRadius: 3,
    fontSize: 9,
  },
  emptyState: {
    textAlign: "center",
    padding: 50,
    color: "#999",
  },
});

const formatDate = (dateString?: string) => {
  if (!dateString) return "Present";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
};

const getCefrLabel = (level?: string) => {
  if (!level) return "-";
  return level.toUpperCase();
};

export function ResumePDF({ data }: ResumePDFProps) {
  const profile = data?.profile;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerName}>
            {profile?.firstName} {profile?.lastName}
          </Text>

          {profile?.email && (
            <Text style={styles.headerContact}>Email: {profile.email}</Text>
          )}
          {profile?.phone && (
            <Text style={styles.headerContact}>Phone: {profile.phone}</Text>
          )}
          {profile?.address && (
            <Text style={styles.headerContact}>
              Address:{" "}
              {[
                profile.address.city,
                profile.address.state,
                profile.address.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </Text>
          )}
          {profile?.summary && (
            <Text style={styles.summary}>{profile.summary}</Text>
          )}
        </View>

        {/* Work Experience */}
        {data?.workExperiences && data.workExperiences.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {data.workExperiences.map((exp, index) => (
              <View key={index} style={styles.sectionItem}>
                <View style={styles.itemHeader}>
                  <View>
                    <Text style={styles.itemTitle}>
                      {exp.jobTitle || "Position"}
                    </Text>
                    <Text style={styles.itemSubtitle}>
                      {exp.employer || "Employer"}
                    </Text>
                  </View>
                  <Text style={styles.itemDate}>
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </Text>
                </View>
                {(exp.city || exp.country) && (
                  <Text style={styles.itemLocation}>
                    {[exp.city, exp.country].filter(Boolean).join(", ")}
                  </Text>
                )}
                {exp.description && (
                  <Text style={styles.itemDescription}>{exp.description}</Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* Education */}
        {data?.educationRecords && data.educationRecords.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education and Training</Text>
            {data.educationRecords.map((edu, index) => (
              <View key={index} style={styles.sectionItem}>
                <View style={styles.itemHeader}>
                  <View>
                    <Text style={styles.itemTitle}>
                      {edu.qualification || "Qualification"}
                    </Text>
                    <Text style={styles.itemSubtitle}>
                      {edu.institution || "Institution"}
                    </Text>
                  </View>
                  <Text style={styles.itemDate}>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </Text>
                </View>
                {(edu.grade || edu.gradeType) && (
                  <Text style={styles.itemLocation}>
                    Grade: {edu.grade}
                    {edu.gradeType && ` (${edu.gradeType})`}
                  </Text>
                )}
                {edu.description && (
                  <Text style={styles.itemDescription}>{edu.description}</Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* Language Skills */}
        {data?.languageSkills && data.languageSkills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Language Skills</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 1 }]}>Language</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>Listening</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>Reading</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>Speaking</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>Writing</Text>
              </View>
              {data.languageSkills.map((lang, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {lang.language}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {getCefrLabel(lang.listening)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {getCefrLabel(lang.reading)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {getCefrLabel(lang.speaking)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {getCefrLabel(lang.writing)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Skills */}
        {data?.userSkills && data.userSkills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skills</Text>
            {data.userSkills.map((skillGroup, index) => (
              <View key={index} style={styles.skillCategory}>
                <Text style={styles.skillCategoryTitle}>
                  {skillGroup.category}
                </Text>
                <View style={styles.skillTags}>
                  {skillGroup.skills.map((skill, skillIndex) => (
                    <Text key={skillIndex} style={styles.skillTag}>
                      {skill.name}
                      {skill.proficiency && ` (${skill.proficiency})`}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Empty State */}
        {!profile && (
          <View style={styles.emptyState}>
            <Text>No profile data available.</Text>
            <Text>Please complete your profile first.</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
