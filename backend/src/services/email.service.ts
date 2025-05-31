// backend/src/services/email.service.ts
import nodemailer from 'nodemailer';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'; // Correct import
import { supabaseAdmin } from '../config/supabase.config';

const sesV2ApiVersion = "2019-09-27"; // SESv2 API version

const sesV2Client = new SESv2Client({
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  apiVersion: sesV2ApiVersion, // Explicitly setting API version for SESv2
});

// Create a Nodemailer transporter
// MODIFICATION HERE: Pass SendEmailCommand directly as a property
const transporter = nodemailer.createTransport({
  SES: {
    ses: sesV2Client,       // The SESv2Client instance
    SendEmailCommand,       // The SendEmailCommand constructor directly
    // apiVersion: sesV2ApiVersion // Also can be specified here
  },
});

export interface MailOptions {
  to: string | string[];
  subject: string;
  textBody: string;
  htmlBody?: string;
  from?: string;
}

class EmailService {
  private defaultFromAddress: string;

  constructor() {
    this.defaultFromAddress = process.env.MAIL_FROM_ADDRESS || 'noreply@openarchive.local';
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn(
        'EmailService: AWS credentials not fully configured. Emails might fail.'
      );
    }
    if (!this.defaultFromAddress || !this.defaultFromAddress.includes('@')) {
        console.warn(
            `EmailService: Default MAIL_FROM_ADDRESS ("${this.defaultFromAddress}") is not configured or invalid. Please check your .env file.`
        );
    }
  }

  async sendMail(options: MailOptions): Promise<{ messageId: string }> {
    // Nodemailer will construct the appropriate SendEmailCommandInput for SESv2
    // based on these standard mail options.
    const mailPayload = {
      from: options.from || this.defaultFromAddress,
      to: options.to,
      subject: options.subject,
      text: options.textBody,
      html: options.htmlBody || `<p>${options.textBody.replace(/\n/g, '<br>')}</p>`,
      // SES specific options can be added here if needed, e.g., ConfigurationSetName
      // ses: { // Example:
      //   ConfigurationSetName: 'MyConfigurationSet'
      // }
    };

    try {
      console.log(`Attempting to send email via SESv2 from ${mailPayload.from} to ${mailPayload.to} with subject "${mailPayload.subject}"`);
      // transporter.sendMail will use the SESv2Client and its SendEmailCommand
      const info = await transporter.sendMail(mailPayload);
      console.log('Email sent successfully via SESv2. Message ID: %s', info.messageId);

      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'EMAIL_SENT_SUCCESS',
        p_entity_type: 'email_service',
        p_entity_id: null,
        p_details: {
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          messageId: info.messageId,
          transport: 'AWS SESv2',
        },
      });
      return { messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email via SESv2:', error);
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'EMAIL_SENT_FAILURE',
        p_entity_type: 'email_service',
        p_entity_id: null,
        p_details: {
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          error: error instanceof Error ? error.message : String(error),
          errorMessage: error instanceof Error ? error.stack : "No stack",
          transport: 'AWS SESv2',
        },
      });
      throw error;
    }
  }
}

export const emailService = new EmailService();