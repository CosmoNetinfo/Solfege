'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getSchoolProfiles } from '@/lib/supabase/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, UserPlus, Shield, User, Trash2 } from 'lucide-react';
import { deleteStaffUser } from '@/app/actions/user-actions';

export function UsersTab({ schoolId, schoolName }: { schoolId: string, schoolName: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadUsers();
  }, [schoolId]);

  const loadUsers = async () => {
    try {
      const data = await getSchoolProfiles(supabase, schoolId);
      setUsers(data);
    } catch (e) {
      toast.error('Errore caricamento utenti');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error('Inserisci un\'email valida');
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, schoolName: schoolName || 'la tua scuola' }),
      });

      if (res.ok) {
        toast.success(`Email di invito inviata a ${inviteEmail}`);
        setInviteEmail('');
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error('Errore durante l\'invio dell\'invito');
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente? L\\'azione è irreversibile.')) return;
    
    try {
      const res = await deleteStaffUser(userId);
      if (res.success) {
        toast.success('Utente eliminato con successo');
        setUsers(users.filter(u => u.id !== userId));
      } else {
        toast.error(res.error || 'Errore durante l\\'eliminazione');
      }
    } catch (e) {
      toast.error('Errore durante l\\'eliminazione');
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Utenti e Ruoli</h3>
          <p className="text-sm text-muted-foreground">
            Gestisci gli accessi del personale amministrativo e di segreteria.
          </p>
        </div>
      </div>

      <div className="bg-card p-4 border rounded-xl max-w-xl">
        <h4 className="font-medium mb-2">Invita un membro della segreteria</h4>
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input 
            type="email" 
            placeholder="email@esempio.it" 
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" disabled={isInviting || !inviteEmail} className="bg-[#E8621A] text-white hover:bg-[#E8621A]/90">
            <Mail className="w-4 h-4 mr-2" />
            {isInviting ? 'Invio in corso...' : 'Invia Invito'}
          </Button>
        </form>
      </div>

      <div className="border rounded-md overflow-hidden max-w-3xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Utente</th>
              <th className="px-4 py-3 font-medium">Ruolo</th>
              <th className="px-4 py-3 font-medium">Iscritto il</th>
              <th className="px-4 py-3 font-medium text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Nessun utente trovato.</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sidebar/10 flex items-center justify-center text-primary font-medium">
                      {user.first_name ? user.first_name.charAt(0) : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                      {/* L'email vera è in auth.users, qui mettiamo un fallback se non presente nei profili */}
                      <div className="text-xs text-muted-foreground opacity-50">ID: {user.id.substring(0,8)}...</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        <UserPlus className="w-3 h-3" /> Segreteria
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8"
                      title="Elimina utente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
