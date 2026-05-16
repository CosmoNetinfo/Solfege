"use server";

import nodemailer from 'nodemailer';
import { format } from "date-fns";

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export async function sendWelcomeEmail(student: any, schoolName: string) {
  const email = student.email || student.parent_email;
  if (!email || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('[EMAIL WELCOME] Saltato: Email o credenziali SMTP mancanti');
    return { success: false };
  }

  try {
    await transporter.sendMail({
      from: `"Solfège" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Benvenuto su Solfège - ${schoolName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #E8621A; font-family: serif; margin: 0;">Solfège</h1>
          </div>
          <h2 style="color: #1c1917;">Ciao ${student.first_name}!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Siamo felici di darti il benvenuto. La tua scuola di musica, <strong>${schoolName}</strong>, ha attivato il tuo profilo sulla piattaforma Solfège.</p>
          <p style="font-size: 16px; line-height: 1.5;">Da oggi la gestione delle tue lezioni sarà più semplice e digitale.</p>
          <p style="font-size: 16px; line-height: 1.5;">Presto riceverai un invito separato per accedere al tuo <strong>Portale Personale</strong>, dove potrai:</p>
          <ul style="font-size: 16px; line-height: 1.5;">
            <li>Consultare il calendario delle lezioni</li>
            <li>Vedere i compiti assegnati dai docenti</li>
            <li>Monitorare i tuoi pagamenti e scaricare le ricevute</li>
          </ul>
          <br/>
          <p style="font-size: 16px; font-weight: bold;">A presto!</p>
          <hr style="border:0; border-top: 1px solid #eee; margin: 30px 0;"/>
          <p style="font-size: 12px; color: #999; text-align: center;">Questa è un'email automatica inviata da Solfège per conto di ${schoolName}.</p>
        </div>
      `
    });
    console.log('[EMAIL WELCOME] Inviata con successo a:', email);
    return { success: true };
  } catch (err) {
    console.error('[EMAIL WELCOME] Errore:', err);
    return { success: false, error: String(err) };
  }
}

export async function sendPaymentReminder(payment: any, schoolName: string) {
  const email = payment.students?.email || payment.students?.parent_email;
  if (!email || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return { success: false, error: "Email o configurazione SMTP mancante" };
  }

  const amount = Number(payment.amount).toFixed(2);
  const dueDate = format(new Date(payment.due_date), "dd/MM/yyyy");

  try {
    await transporter.sendMail({
      from: `"Solfège" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Sollecito Pagamento - ${schoolName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #E8621A; font-family: serif; margin: 0;">Solfège</h1>
          </div>
          <h2 style="color: #b91c1c;">Promemoria Scadenza Pagamento</h2>
          <p style="font-size: 16px; line-height: 1.5;">Ciao ${payment.students?.first_name},</p>
          <p style="font-size: 16px; line-height: 1.5;">Ti inviamo questo promemoria per il pagamento relativo a <strong>${schoolName}</strong>.</p>
          
          <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Importo:</strong> € ${amount}</p>
              <p style="margin: 5px 0;"><strong>Data di scadenza:</strong> ${dueDate}</p>
              <p style="margin: 5px 0;"><strong>Causale:</strong> ${payment.description || 'Retta mensile'}</p>
          </div>

          <p style="font-size: 16px; line-height: 1.5;">Se hai già provveduto al saldo, ti preghiamo di ignorare questa comunicazione.</p>
          <p style="font-size: 16px; line-height: 1.5;">Puoi consultare la tua situazione completa sul tuo portale personale.</p>
          
          <br/>
          <p style="font-size: 16px; font-weight: bold;">A presto!</p>
          <hr style="border:0; border-top: 1px solid #eee; margin: 30px 0;"/>
          <p style="font-size: 12px; color: #999; text-align: center;">Questa è un'email automatica inviata da Solfège per conto di ${schoolName}.</p>
        </div>
      `
    });
    console.log('[EMAIL REMINDER] Inviata con successo a:', email);
    return { success: true };
  } catch (err) {
    console.error('[EMAIL REMINDER] Errore:', err);
    return { success: false, error: String(err) };
  }
}
export async function sendCredenziali({ to, nome, password, schoolName, loginUrl }: { to: string, nome: string, password: string, schoolName: string, loginUrl: string }) {
  if (!to || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('[EMAIL CREDENTIALS] Saltato: Email o credenziali SMTP mancanti');
    return { success: false };
  }

  try {
    await transporter.sendMail({
      from: `"Solfège" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: `Le tue credenziali per Solfège — ${schoolName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #E8621A; font-family: serif; margin: 0;">Solfège</h1>
          </div>
          <h2 style="color: #1c1917;">Ciao ${nome},</h2>
          <p style="font-size: 16px; line-height: 1.5;">Sei stato aggiunto come docente su <strong>Solfège</strong>.</p>
          <p style="font-size: 16px; line-height: 1.5;">Ecco le tue credenziali di accesso:</p>
          
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
              <p style="margin: 5px 0;"><strong>Password temporanea:</strong> <code style="background: #eee; padding: 2px 4px; border-radius: 4px;">${password}</code></p>
          </div>

          <p style="font-size: 16px; line-height: 1.5;">Accedi qui: <a href="${loginUrl}" style="color: #E8621A; font-weight: bold; text-decoration: none;">${loginUrl}</a></p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">Ti consigliamo di cambiare la password dopo il primo accesso.</p>
          
          <br/>
          <p style="font-size: 16px; font-weight: bold;">— Il team di ${schoolName}</p>
          <hr style="border:0; border-top: 1px solid #eee; margin: 30px 0;"/>
          <p style="font-size: 12px; color: #999; text-align: center;">Questa è un'email automatica inviata da Solfège per conto di ${schoolName}.</p>
        </div>
      `
    });
    console.log('[EMAIL CREDENTIALS] Inviata con successo a:', to);
    return { success: true };
  } catch (err) {
    console.error('[EMAIL CREDENTIALS] Errore:', err);
    return { success: false, error: String(err) };
  }
}
