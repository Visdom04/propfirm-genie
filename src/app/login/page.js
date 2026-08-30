import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoginForm from './LoginForm';
import './login.css';

export const metadata = {
  title: 'Log in | Prop Firm Wise',
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const initialMode = params.mode === 'signup' ? 'signup' : 'login';
  const nextPath = typeof params.next === 'string' ? params.next : '/account';
  const urlError = typeof params.error === 'string' ? params.error : '';

  return (
    <main className="login-page">
      <Navbar />
      <section className="login-wrap">
        <div className="login-card glass">
          <LoginForm initialMode={initialMode} nextPath={nextPath} urlError={urlError} />
          <p className="login-home">
            <Link href="/">Back to home</Link>
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
