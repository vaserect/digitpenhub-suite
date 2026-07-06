import FormClient from './FormClient';

const API = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://suite.digitpenhub.com';

async function fetchForm(formId) {
  try {
    const res = await fetch(`${API}/api/v1/forms/${formId}/public`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.form || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const form = await fetchForm(params.formId);
  if (!form) return { title: 'Form not found' };

  const url = `${SITE_URL}/forms/${params.formId}`;
  const title = form.name || 'Form';
  const description = form.description || undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function PublicForm() {
  return <FormClient />;
}
