import {
  Document,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const pdfStyles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 12,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    textAlign: "center",
  },
  recommenderInfo: {
    marginBottom: 20,
    textAlign: "center",
  },
  recommenderName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  recommenderTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  recommenderInstitution: {
    fontSize: 11,
    color: "#666",
  },
  date: {
    fontSize: 11,
    color: "#666",
    marginBottom: 20,
  },
  recipient: {
    marginBottom: 20,
  },
  recipientLine: {
    marginBottom: 4,
  },
  body: {
    textAlign: "justify",
  },
  paragraph: {
    marginBottom: 12,
  },
  signature: {
    marginTop: 40,
  },
  signatureName: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  signatureTitle: {
    fontSize: 11,
    color: "#666",
  },
});

const LetterPDF = ({
  content,
  recommenderName,
  recommenderTitle,
  recommenderInstitution,
  recommenderEmail,
  recommenderDepartment,
}: {
  content: string;
  recommenderName?: string;
  recommenderTitle?: string;
  recommenderInstitution?: string;
  recommenderEmail?: string;
  recommenderDepartment?: string;
}) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        {recommenderName && (
          <Text style={pdfStyles.recommenderName}>{recommenderName}</Text>
        )}
        {recommenderTitle && (
          <Text style={pdfStyles.recommenderTitle}>{recommenderTitle}</Text>
        )}
        {recommenderInstitution && (
          <Text style={pdfStyles.recommenderInstitution}>
            {[recommenderDepartment, recommenderInstitution]
              .filter(Boolean)
              .join(", ")}
          </Text>
        )}
        {recommenderEmail && (
          <Text style={pdfStyles.recommenderInstitution}>
            {recommenderEmail}
          </Text>
        )}
      </View>

      <Text style={pdfStyles.date}>
        {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </Text>

      <View style={pdfStyles.recipient}>
        <Text style={pdfStyles.recipientLine}>To Whom It May Concern,</Text>
      </View>

      <View style={pdfStyles.body}>
        {content.split("\n\n").map((paragraph) => (
          <Text key={paragraph.trim()} style={pdfStyles.paragraph}>
            {paragraph.trim()}
          </Text>
        ))}
      </View>

      <View style={pdfStyles.signature}>
        <Text style={pdfStyles.signatureName}>
          {recommenderName || "Signature"}
        </Text>
        {recommenderTitle && (
          <Text style={pdfStyles.signatureTitle}>{recommenderTitle}</Text>
        )}
        {recommenderInstitution && (
          <Text style={pdfStyles.signatureTitle}>{recommenderInstitution}</Text>
        )}
      </View>
    </Page>
  </Document>
);

export async function generateLetterPDF(letter: {
  finalContent: string;
  recommenderName?: string | null;
  recommenderTitle?: string | null;
  recommenderInstitution?: string | null;
  recommenderEmail?: string | null;
  recommenderDepartment?: string | null;
}): Promise<Uint8Array> {
  const pdfBuffer = await renderToBuffer(
    <LetterPDF
      content={letter.finalContent}
      recommenderName={letter.recommenderName ?? undefined}
      recommenderTitle={letter.recommenderTitle ?? undefined}
      recommenderInstitution={letter.recommenderInstitution ?? undefined}
      recommenderEmail={letter.recommenderEmail ?? undefined}
      recommenderDepartment={letter.recommenderDepartment ?? undefined}
    />,
  );
  return pdfBuffer;
}
