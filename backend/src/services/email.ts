import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendMail = async ({
    to,
    subject,
    html
}: {
    to: string,
    subject: string,
    html: string
}) => {
    const msg = {
        to,
        from: process.env.EMAIL_FROM || 'noreply@openarchive.ro',
        subject,
        html,
    }

    await sgMail.send(msg);
}