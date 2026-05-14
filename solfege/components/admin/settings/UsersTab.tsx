'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getSchoolProfiles } from '@/lib/supabase/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, UserPlus, Shield, User, Trash2 } from 'lucide-react';
import { deleteStaffUser, updateUserRole } from '@/app/actions/user-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function UsersTab({ schoolId, schoolName }: { schoolId: string, schoolName: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
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

  const handleRoleChange = async (userId: string, currentRole: string, newRole: string) => {
    if (currentRole === newRole) return;
    
    if (userId === currentUserId) {
      toast.error('Non puoi modificare il tuo stesso ruolo');
      return;
    }

    try {
      const res = await updateUserRole(userId, newRole as "admin" | "segreteria" | "insegnante" | "studente" | "genitore");
      if (res.success) {
        toast.success('Ruolo aggiornato con successo');
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        toast.error(res.error || "Errore durante l'aggiornamento del ruolo");
      }
    } catch (e) {
      toast.error("Errore durante l'aggiornamento del ruolo");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo utente? L'azione è irreversibile.")) return;
    
    try {
      const res = await deleteStaffUser(userId);
      if (res.success) {
        toast.success('Utente eliminato con successo');
        setUsers(users.filter(u => u.id !== userId));
      } else {
        toast.error(res.error || "Errore durante l'eliminazione");
      }
    } catch (e) {
      toast.error("Errore durante l'eliminazione");
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
                    <Select 
                      disabled={user.id === currentUserId}
                      value={user.role} 
                      onValueChange={(val) => handleRoleChange(user.id, user.role, val)}
                    >
                      <SelectTrigger className="h-8 w-[140px] border-0 bg-transparent hover:bg-muted focus:ring-0 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-primary" /> Admin</span>
                        </SelectItem>
                        <SelectItem value="segreteria">
                          <span className="flex items-center gap-1.5"><UserPlus className="w-3 h-3 text-blue-600" /> Segreteria</span>
                        </SelectItem>
                        <SelectItem value="insegnante">
                          <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-green-600" /> Insegnante</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.id === currentUserId}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8 disabled:opacity-30 disabled:hover:bg-transparent"
                      title={user.id === currentUserId ? "Non puoi eliminare te stesso" : "Elimina utente"}
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
