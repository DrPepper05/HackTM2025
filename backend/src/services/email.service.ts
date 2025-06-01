// backend/src/services/email.service.ts
import { SESv2Client, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-sesv2';
import { SESClient, SendRawEmailCommand, SendRawEmailCommandInput } from '@aws-sdk/client-ses';
import { supabaseAdmin } from '../config/supabase.config';

// Debug logging for AWS configuration
console.log('AWS Configuration Debug:');
console.log('OPENARCHIVE_AWS_SES_REGION:', process.env.OPENARCHIVE_AWS_SES_REGION);
console.log('OPENARCHIVE_AWS_REGION:', process.env.OPENARCHIVE_AWS_REGION);
console.log('OPENARCHIVE_AWS_ACCESS_KEY_ID exists:', !!process.env.OPENARCHIVE_AWS_ACCESS_KEY_ID);
console.log('OPENARCHIVE_AWS_SECRET_ACCESS_KEY exists:', !!process.env.OPENARCHIVE_AWS_SECRET_ACCESS_KEY);
console.log('MAIL_FROM_ADDRESS:', process.env.MAIL_FROM_ADDRESS);

// Configure the SESv2Client with explicit credentials for simple emails
const sesV2Client = new SESv2Client({
  region: process.env.OPENARCHIVE_AWS_SES_REGION || process.env.OPENARCHIVE_AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.OPENARCHIVE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.OPENARCHIVE_AWS_SECRET_ACCESS_KEY || ''
  }
});

// Configure the SES Client for raw emails with attachments
const sesClient = new SESClient({
  region: process.env.OPENARCHIVE_AWS_SES_REGION || process.env.OPENARCHIVE_AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.OPENARCHIVE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.OPENARCHIVE_AWS_SECRET_ACCESS_KEY || ''
  }
});

export interface MailOptions {
  to: string | string[];
  subject: string;
  textBody: string;
  htmlBody?: string;
  from?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface MailOptionsWithAttachments extends MailOptions {
  attachments?: EmailAttachment[];
}

class EmailService {
  private defaultFromAddress: string;

  constructor() {
    this.defaultFromAddress = process.env.MAIL_FROM_ADDRESS || 'noreply@openarchive.local';

    // Warnings for configuration issues
    if (!process.env.OPENARCHIVE_AWS_SES_REGION && !process.env.OPENARCHIVE_AWS_REGION) {
      console.warn('EmailService: AWS_SES_REGION or AWS_REGION is not set. Defaulting to eu-central-1, but this might be incorrect for your SES setup.');
    }
    if (!process.env.OPENARCHIVE_AWS_ACCESS_KEY_ID || !process.env.OPENARCHIVE_AWS_SECRET_ACCESS_KEY) {
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
      console.log(`Attempting to send email via SESv2 from ${params.FromEmailAddress} to ${recipients.join(', ')} with subject "${params.Content?.Simple?.Subject?.Data}"`);
      
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
          messageId: response.MessageId || '',
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

  async sendMailWithAttachments(options: MailOptionsWithAttachments): Promise<{ messageId: string }> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const boundary = `boundary-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    // Build raw email message
    let rawMessage = '';
    
    // Headers
    rawMessage += `From: ${options.from || this.defaultFromAddress}\r\n`;
    rawMessage += `To: ${recipients.join(', ')}\r\n`;
    rawMessage += `Subject: ${options.subject}\r\n`;
    rawMessage += `MIME-Version: 1.0\r\n`;
    rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
    
    // Text body
    rawMessage += `--${boundary}\r\n`;
    rawMessage += `Content-Type: text/plain; charset=UTF-8\r\n`;
    rawMessage += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    rawMessage += `${options.textBody}\r\n\r\n`;
    
    // HTML body (if provided)
    if (options.htmlBody) {
      rawMessage += `--${boundary}\r\n`;
      rawMessage += `Content-Type: text/html; charset=UTF-8\r\n`;
      rawMessage += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
      rawMessage += `${options.htmlBody}\r\n\r\n`;
    }
    
    // Attachments
    if (options.attachments && options.attachments.length > 0) {
      for (const attachment of options.attachments) {
        rawMessage += `--${boundary}\r\n`;
        rawMessage += `Content-Type: ${attachment.contentType}\r\n`;
        rawMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
        rawMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
        rawMessage += attachment.content.toString('base64').replace(/(.{76})/g, '$1\r\n');
        rawMessage += `\r\n\r\n`;
      }
    }
    
    // End boundary
    rawMessage += `--${boundary}--\r\n`;
    
    const params: SendRawEmailCommandInput = {
      Source: options.from || this.defaultFromAddress,
      Destinations: recipients,
      RawMessage: {
        Data: Buffer.from(rawMessage)
      }
    };
    
    try {
      console.log(`Attempting to send email with attachments via SES from ${options.from || this.defaultFromAddress} to ${recipients.join(', ')} with subject "${options.subject}"`);
      
      const command = new SendRawEmailCommand(params);
      const response = await sesClient.send(command);
      
      console.log('Email with attachments sent successfully via SES. Message ID:', response.MessageId);

      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'EMAIL_SENT_SUCCESS_WITH_ATTACHMENTS',
        p_entity_type: 'email_service',
        p_entity_id: null,
        p_details: {
          to: recipients.join(', '),
          subject: options.subject,
          messageId: response.MessageId || '',
          transport: 'AWS SES Raw',
          attachmentCount: options.attachments?.length || 0,
          attachmentFilenames: options.attachments?.map(a => a.filename).join(', ') || '',
        },
      });
      
      return { messageId: response.MessageId || '' };
    } catch (error) {
      console.error('Error sending email with attachments via SES:', error);
      const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : { message: String(error) };
      
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'EMAIL_SENT_FAILURE_WITH_ATTACHMENTS',
        p_entity_type: 'email_service',
        p_entity_id: null,
        p_details: {
          to: recipients.join(', '),
          subject: options.subject,
          errorName: errorDetails.name,
          errorMessage: errorDetails.message,
          errorStack: errorDetails.stack,
          transport: 'AWS SES Raw',
          attachmentCount: options.attachments?.length || 0,
        },
      });
      throw error;
    }
  }
}

export const emailService = new EmailService();
