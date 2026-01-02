import "./polyfills";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { appEnv } from "@/env";
import MagicLinkEmail from "./magicLink";
import ResetPasswordEmail from "./resetPassword";
import VerifyEmail from "./verifyEmail";
import VerifyOTP from "./verifyOTP";

export const resend = new Resend(appEnv.RESEND_API_KEY);

export const sendEmailVerification = async ({
  to,
  url,
}: {
  to: string;
  url: string;
}) => {
  await resend.emails.send({
    from: appEnv.RESEND_FROM_EMAIL,
    to,
    subject: "Verify your email address",
    html: await render(<VerifyEmail url={url} />),
  });
};

export const sendOTPVerification = async ({
  to,
  code,
}: {
  to: string;
  code: string;
}) => {
  await resend.emails.send({
    from: appEnv.RESEND_FROM_EMAIL,
    to,
    subject: "Verify your email address",
    html: await render(<VerifyOTP code={code} />),
  });
};

export const sendMagicLink = async ({
  to,
  url,
}: {
  to: string;
  url: string;
}) => {
  await resend.emails.send({
    from: appEnv.RESEND_FROM_EMAIL,
    to,
    subject: "Sign in to your account",
    html: await render(<MagicLinkEmail url={url} />),
  });
};

export const sendResetPassword = async ({
  to,
  url,
}: {
  to: string;
  url: string;
}) => {
  await resend.emails.send({
    from: appEnv.RESEND_FROM_EMAIL,
    to,
    subject: "Reset your password",
    html: await render(<ResetPasswordEmail url={url} />),
  });
};
