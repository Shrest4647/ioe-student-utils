import { Heading, Link, Text } from "@react-email/components";
import { BaseEmail, styles } from "./components/BaseEmail";

interface ResetPasswordEmailProps {
  url: string;
  brandName?: string;
  brandTagline?: string;
  brandLogoUrl?: string;
}

export default function ResetPasswordEmail({
  url,
  brandName,
  brandTagline,
  brandLogoUrl,
}: ResetPasswordEmailProps) {
  return (
    <BaseEmail
      brandLogoUrl={brandLogoUrl}
      brandName={brandName}
      brandTagline={brandTagline}
      previewText="Reset your password"
    >
      <Heading style={styles.h1}>Reset Your Password</Heading>
      <Link
        href={url}
        style={{
          ...styles.link,
          display: "block",
          marginBottom: "16px",
        }}
        target="_blank"
      >
        Click here to reset your password
      </Link>
      <Text
        style={{
          ...styles.text,
          color: "#ababab",
          marginTop: "14px",
          marginBottom: "16px",
        }}
      >
        If you didn&apos;t request a password reset, you can safely ignore this
        email.
      </Text>
    </BaseEmail>
  );
}
