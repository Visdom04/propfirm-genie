import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import './account.css';

export const metadata = {
  title: 'Account | Prop Firm Wise',
};

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    redirect('/login');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect('/login');
  }

  const email = data.user.email || 'signed in';

  return (
    <main className="account-page">
      <Navbar />
      <section className="account-wrap">
        <div className="account-card glass">
          <p className="account-kicker">Signed in</p>
          <h1>Account</h1>
          <p className="account-email">{email}</p>
          <p className="account-hint">
            Auth is connected. Compare tables and saved firms come later.
          </p>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn btn-secondary">
              Log out
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  );
}
