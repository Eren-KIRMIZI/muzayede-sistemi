import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import { ResilienceService } from '../resilience/resilience.service'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private transporter: nodemailer.Transporter | null = null

  constructor(
    private config: ConfigService,
    private resilience: ResilienceService,
  ) {
    this.initTransporter()
  }

  private initTransporter() {
    const host = this.config.get('SMTP_HOST')
    const port = this.config.get('SMTP_PORT', 587)
    const user = this.config.get('SMTP_USER')
    const pass = this.config.get('SMTP_PASS')

    if (!host) {
      this.logger.warn('SMTP_HOST not configured - emails will be logged only')
      return
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: user && pass ? { user, pass } : undefined,
    })

    this.logger.log('Email transporter initialized')
  }

  async sendPasswordResetEmail(to: string, resetToken: string, baseUrl: string) {
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .content p { color: #333; line-height: 1.6; }
          .btn { display: inline-block; background: #667eea; color: white !important; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { padding: 20px 30px; background: #f9f9f9; text-align: center; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 10px; margin: 15px 0; color: #856404; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AuctionHub</h1>
          </div>
          <div class="content">
            <h2>Şifre Sıfırlama</h2>
            <p>Merhaba,</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
            <a href="${resetUrl}" class="btn">Şifremi Sıfırla</a>
            <div class="warning">
              Bu bağlantı 15 dakika sonra geçersiz olacaktır.
            </div>
            <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          </div>
          <div class="footer">
            <p>Bu e-posta AuctionHub tarafından otomatik olarak gönderilmiştir.</p>
          </div>
        </div>
      </body>
      </html>
    `

    return this.send(to, 'Şifre Sıfırlama - AuctionHub', html)
  }

  async sendWelcomeEmail(to: string, firstName: string) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .content p { color: #333; line-height: 1.6; }
          .btn { display: inline-block; background: #667eea; color: white !important; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { padding: 20px 30px; background: #f9f9f9; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AuctionHub</h1>
          </div>
          <div class="content">
            <h2>Hoş Geldiniz!</h2>
            <p>Merhaba ${firstName},</p>
            <p>AuctionHub'a hoş geldiniz! Artık açık artırmalara katılabilir, teklif verebilir ve harika ürünler bulabilirsiniz.</p>
            <a href="http://localhost:3000/auctions" class="btn">Açık Artırmaları Keşfet</a>
            <p>Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p>
          </div>
          <div class="footer">
            <p>Bu e-posta AuctionHub tarafından otomatik olarak gönderilmiştir.</p>
          </div>
        </div>
      </body>
      </html>
    `

    return this.send(to, 'Hoş Geldiniz - AuctionHub', html)
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`[EMAIL LOG] To: ${to}, Subject: ${subject}`)
      this.logger.log(`[EMAIL LOG] SMTP not configured - email skipped`)
      return { sent: false, reason: 'SMTP not configured' }
    }

    try {
      const from = this.config.get('SMTP_FROM', 'noreply@auctionhub.com')
      await this.resilience.execute('email_smtp', () => 
        this.transporter!.sendMail({ from, to, subject, html })
      )
      this.logger.log(`Email sent to ${to}: ${subject}`)
      return { sent: true }
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`)
      return { sent: false, reason: error.message }
    }
  }
}
