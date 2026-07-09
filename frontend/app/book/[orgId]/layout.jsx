const API = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4001';

async function fetchOrgName(orgId) {
  try {
    const res = await fetch(`${API}/api/v1/appointments/public/${orgId}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data.org?.name || null;
    }
  } catch {}
  return null;
}

export async function generateMetadata({ params }) {
  const orgName = await fetchOrgName(params.orgId);
  const title = orgName ? `Book an appointment — ${orgName}` : 'Book an appointment';
  const description = orgName
    ? `Schedule an appointment with ${orgName}. Choose a service, pick a date and time, and confirm your booking.`
    : 'Book an appointment online.';

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default function BookingLayout({ children }) {
  return children;
}
