import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
 private readonly transporter: nodemailer.Transporter;

 constructor(
    private readonly configService: ConfigService,
 ) {
    this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('mail.host'),
        port: this.configService.get<number>('mail.port'),
        secure: this.configService.get<boolean>('mail.secure'),
        auth: {
            user: this.configService.get<string>('mail.user'),
            pass: this.configService.get<string>('mail.password'),
        },
    });
 }

 async onModuleInit() {
    await this.transporter.verify();
    console.log('✅ Mailer Connected');
 }

async sendVerificationEmail(
   email:string,token:string
){
   const verificationUrl =
    `http://localhost:3000/auth/verify-email?token=${token}`;

 await this.transporter.sendMail({
   from:this.configService.getOrThrow<string>('mail.from'),
   to:email,
   subject:'Verify your DayGood Diary email',
   html: `
      <h2>Welcome to DayGood Diary</h2>

      <p>Please verify your email address to activate your account.</p>

      <p>
        <a href="${verificationUrl}">
          Verify Email
        </a>
      </p>

      <p>This verification link expires in 24 hours.</p>
    `,

 })
} 
}
