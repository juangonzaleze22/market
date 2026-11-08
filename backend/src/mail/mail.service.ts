import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';
import {
  accountExistsTemplate,
  backInStockTemplate,
  passwordResetTemplate,
  verificationTemplate,
  type EmailContent,
} from './templates/index.js';

export interface VerificationMail {
  to: string;
  firstName: string;
  token: string;
}

interface Delivery {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface SenderAddress {
  Email: string;
  Name?: string;
}

interface MailjetResponse {
  Messages?: Array<{
    Status?: string;
    Errors?: Array<{ ErrorMessage?: string }>;
  }>;
  ErrorMessage?: string;
}

type MailProvider = 'mailjet' | 'resend' | 'smtp' | 'log';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private readonly sender: SenderAddress;
  private readonly frontendUrl: string;
  private readonly provider: MailProvider;
  private readonly mailjetKey?: string;
  private readonly mailjetSecret?: string;
  private readonly resend?: Resend;
  private readonly transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.from =
      this.configService.get<string>('MAIL_FROM') ??
      this.configService.get<string>('SMTP_FROM') ??
      'Market <no-reply@market.local>';
    this.sender = this.parseSender(this.from);
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL')?.split(',')[0]?.trim() ||
      'http://localhost:4200';

    const requested = this.configService
      .get<string>('MAIL_PROVIDER')
      ?.trim()
      .toLowerCase();
    const resendKey = this.configService.get<string>('RESEND_API_KEY');
    const mailjetKey = this.configService.get<string>('MAILJET_API_KEY');
    const mailjetSecret = this.configService.get<string>('MAILJET_SECRET_KEY');
    const host = this.configService.get<string>('SMTP_HOST');
    const forceLogs = this.configService.get<string>('MAIL_LOG_ONLY') === 'true';

    const hasMailjet = Boolean(mailjetKey && mailjetSecret);
    const hasResend = Boolean(resendKey);
    const hasSmtp = Boolean(host);

    if (forceLogs) {
      this.provider = 'log';
    } else if (requested) {
      this.provider = this.requireProvider(requested, {
        mailjet: hasMailjet,
        resend: hasResend,
        smtp: hasSmtp,
        log: true,
      });
    } else if (hasMailjet) {
      this.provider = 'mailjet';
    } else if (hasResend) {
      this.provider = 'resend';
    } else if (hasSmtp) {
      this.provider = 'smtp';
    } else {
      this.provider = 'log';
    }

    if (this.provider === 'mailjet') {
      this.mailjetKey = mailjetKey;
      this.mailjetSecret = mailjetSecret;
    } else if (this.provider === 'resend') {
      this.resend = new Resend(resendKey);
    } else if (this.provider === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('SMTP_PORT') ?? 587,
        secure: this.configService.get<string>('SMTP_SECURE') === 'true',
        auth: this.configService.get<string>('SMTP_USER')
          ? {
              user: this.configService.get<string>('SMTP_USER'),
              pass: this.configService.get<string>('SMTP_PASS'),
            }
          : undefined,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
    }

    this.logger.log(`Proveedor de correo: ${this.provider}`);
  }

  async sendVerificationEmail({ to, firstName, token }: VerificationMail) {
    const link = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    await this.send({ to, ...verificationTemplate({ firstName, link }) });
  }

  async sendPasswordResetEmail({ to, firstName, token }: VerificationMail) {
    const link = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.send({ to, ...passwordResetTemplate({ firstName, link }) });
  }

  async sendAccountExistsEmail({
    to,
    firstName,
  }: Omit<VerificationMail, 'token'>) {
    const link = `${this.frontendUrl}/forgot-password`;
    await this.send({ to, ...accountExistsTemplate({ firstName, link }) });
  }

  async sendBackInStockEmail({
    to,
    productName,
    productId,
  }: {
    to: string;
    productName: string;
    productId: string;
  }) {
    const link = `${this.frontendUrl}/product/${encodeURIComponent(productId)}`;
    await this.send({ to, ...backInStockTemplate({ productName, link }) });
  }

  private async send(options: Delivery & EmailContent) {
    if (this.provider === 'log' && process.env.NODE_ENV === 'production') {
      throw new Error(
        'Configura MAILJET_API_KEY/MAILJET_SECRET_KEY, RESEND_API_KEY o SMTP_HOST para enviar correos en producción',
      );
    }

    if (this.provider === 'log') {
      const label = this.describe(options.subject);
      this.logger.log(`[mail:log] ${label} para ${options.to}: ${options.link}`);
      return;
    }

    if (this.provider === 'mailjet') {
      await this.sendWithMailjet(options);
      return;
    }

    if (this.provider === 'resend') {
      const { error } = await this.resend!.emails.send({
        from: this.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      if (error) {
        throw new Error(`Resend: ${error.message}`);
      }
      return;
    }

    await this.transporter!.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }

  private async sendWithMailjet(options: Delivery) {
    const auth = Buffer.from(
      `${this.mailjetKey}:${this.mailjetSecret}`,
    ).toString('base64');

    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Messages: [
          {
            From: this.sender,
            To: [{ Email: options.to }],
            Subject: options.subject,
            TextPart: options.text,
            HTMLPart: options.html,
          },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const payload = (await response
      .json()
      .catch(() => null)) as MailjetResponse | null;
    const message = payload?.Messages?.[0];

    if (!response.ok || message?.Status !== 'success') {
      const detail =
        message?.Errors?.map((error) => error.ErrorMessage).join('; ') ||
        payload?.ErrorMessage ||
        response.statusText;
      throw new Error(`Mailjet: ${detail}`);
    }
  }

  private requireProvider(
    requested: string,
    available: Record<MailProvider, boolean>,
  ): MailProvider {
    if (requested in available && available[requested as MailProvider]) {
      return requested as MailProvider;
    }
    throw new Error(
      `MAIL_PROVIDER=${requested} pero faltan credenciales o configuración`,
    );
  }

  private parseSender(raw: string): SenderAddress {
    const match = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    if (match) {
      const name = match[1].replace(/^"|"$/g, '').trim();
      const email = match[2].trim();
      return name ? { Email: email, Name: name } : { Email: email };
    }
    return { Email: raw.trim() };
  }

  private describe(subject: string): string {
    if (subject.includes('Restablece')) return 'Restablecimiento';
    if (subject.includes('ya existe')) return 'Cuenta existente';
    return 'Verificación';
  }
}
