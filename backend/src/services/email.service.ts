// backend/src/services/email.service.ts
import { SESv2Client, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-sesv2';
import { supabaseAdmin } from '../config/supabase.config';

// Debug logging for AWS configuration
console.log('AWS Configuration Debug:');
console.log('AWS_SES_REGION:', process.env.AWS_SES_REGION);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID exists:', !!process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY exists:', !!process.env.AWS_SECRET_ACCESS_KEY);
console.log('MAIL_FROM_ADDRESS:', process.env.MAIL_FROM_ADDRESS);

// Configure the SESv2Client with explicit credentials
const sesV2Client = new SESv2Client({
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
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

    // Warnings for configuration issues
    if (!process.env.AWS_SES_REGION && !process.env.AWS_REGION) {
      console.warn('EmailService: AWS_SES_REGION or AWS_REGION is not set. Defaulting to eu-central-1, but this might be incorrect for your SES setup.');
    }
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn(
        'EmailService: AWS SES credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) not fully configured in environment variables. Emails might fail.'
      );
    }
    if (!this.defaultFromAddress || !this.defaultFromAddress.includes('@')) {
      console.warn(
        `EmailService: Default MAIL_FROM_ADDRESS ("${this.defaultFromAddress}") is not configured or invalid. Please check your .env file.`
      );
    }
  }

  async sendMail(options: MailOptions): Promise<{ messageId: string }> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    const params: SendEmailCommandInput = {
      FromEmailAddress: options.from || this.defaultFromAddress,
      Destination: {
        ToAddresses: recipients
      },
      Content: {
        Simple: {
          Subject: {
            Data: options.subject
          },
          Body: {
            Text: {
              Data: options.textBody
            },
            Html: {
              Data: options.htmlBody || `<p>${options.textBody.replace(/\n/g, '<br>')}</p>`
            }
          }
        }
      }
    };

    try {
      console.log(`Attempting to send email via SESv2 from ${params.FromEmailAddress} to ${recipients.join(', ')} with subject "${params.Content.Simple.Subject.Data}"`);
      
      const command = new SendEmailCommand(params);
      const response = await sesV2Client.send(command);
      
      console.log('Email sent successfully via SESv2. Message ID:', response.MessageId);

      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'EMAIL_SENT_SUCCESS',
        p_entity_type: 'email_service',
        p_entity_id: null,
        p_details: {
          to: recipients.join(', '),
          subject: options.subject,
          messageId: response.MessageId,
          transport: 'AWS SESv2',
        },
      });
      
      return { messageId: response.MessageId || '' };
    } catch (error) {
      console.error('Error sending email via SESv2:', error);
      // Log more detailed error if available
      const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : { message: String(error) };
      
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'EMAIL_SENT_FAILURE',
        p_entity_type: 'email_service',
        p_entity_id: null,
        p_details: {
          to: recipients.join(', '),
          subject: options.subject,
          errorName: errorDetails.name,
          errorMessage: errorDetails.message,
          errorStack: errorDetails.stack,
          transport: 'AWS SESv2',
        },
      });
      throw error;
    }
  }
}

export const emailService = new EmailService();