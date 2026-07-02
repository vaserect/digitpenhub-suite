import { cookies } from 'next/headers';
import AppShell from '../components/AppShell';
import MarketingHome from '../components/marketing/MarketingHome';

export default function Home() {
  const hasSession = cookies().has('dph_session');
  return hasSession ? <AppShell /> : <MarketingHome />;
}
