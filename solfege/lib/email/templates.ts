export const getInviteEmailTemplate = (schoolName: string, inviteUrl: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-w-md; margin: 0 auto; padding: 20px;">
      <h2 style="color: #E8621A;">Benvenuto in Solfège!</h2>
      <p>Sei stato invitato ad unirti alla scuola <strong>${schoolName}</strong> come membro della Segreteria.</p>
      <p>Clicca sul link sottostante per creare il tuo account e accedere al gestionale:</p>
      <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #E8621A; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">Accetta Invito</a>
      <p style="margin-top: 30px; font-size: 12px; color: #666;">Se non aspettavi questo invito, puoi ignorare questa email.</p>
    </div>
  `;
};
