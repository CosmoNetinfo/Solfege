import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getInviteEmailTemplate } from '@/lib/email/templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, schoolName } = await req.json();

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_123456789')) {
      // Simulate success if key is missing or is the placeholder
      return NextResponse.json({ success: true, simulated: true });
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?school=${encodeURIComponent(schoolName)}`;

    await resend.emails.send({
      from: 'Solfège <onboarding@resend.dev>',
      to: email,
      subject: `Invito a unirti a ${schoolName} su Solfège`,
      html: getInviteEmailTemplate(schoolName, inviteUrl),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json({ error: 'Errore durante l\'invio dell\'invito' }, { status: 500 });
  }
}
