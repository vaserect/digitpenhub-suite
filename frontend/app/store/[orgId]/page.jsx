import Script from 'next/script';
import StoreClient from './StoreClient';

const API = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://suite.digitpenhub.com';

async function fetchStore(orgId) {
  try {
    const res = await fetch(`${API}/api/v1/store-builder/public/${orgId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const data = await fetchStore(params.orgId);
  const settings = data?.settings;
  if (!settings) return { title: 'Store not found' };

  const url = `${SITE_URL}/store/${params.orgId}`;
  const title = settings.store_name || 'Store';
  const description = settings.tagline || undefined;
  const images = settings.logo_url ? [{ url: settings.logo_url }] : undefined;

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
      images,
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description,
      images,
    },
  };
}

export default async function StorePage({ params }) {
  const data = await fetchStore(params.orgId);
  const settings = data?.settings;
  const products = data?.products || [];

  // Rich-snippet structured data for the storefront's product listing —
  // schema.org Store + ItemList/Product, so search engines can surface
  // prices/availability directly in results.
  const jsonLd = settings ? {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: settings.store_name || 'Store',
    ...(settings.tagline ? { description: settings.tagline } : {}),
    ...(settings.logo_url ? { image: settings.logo_url } : {}),
    url: `${SITE_URL}/store/${params.orgId}`,
    ...(products.length ? {
      makesOffer: products.map((p) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: p.name,
          ...(Array.isArray(p.images) && p.images[0] ? { image: p.images[0] } : {}),
        },
        price: Number(p.price),
        priceCurrency: settings.currency || 'NGN',
        availability: Number(p.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      })),
    } : {}),
  } : null;

  const gaId = settings?.ga_measurement_id;
  const metaPixelId = settings?.meta_pixel_id;
  const googleAdsId = settings?.google_ads_conversion_id;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // Escape `<` so a product/store name containing "</script>" can't break
          // out of this inline script tag on an unauthenticated public page.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}

      {/* Paid-campaign tracking — only injected when the store owner has set an ID. */}
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');`}
          </Script>
        </>
      )}
      {googleAdsId && (
        <Script id="google-ads-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAdsId}');`}
        </Script>
      )}
      {metaPixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');`}
        </Script>
      )}

      <StoreClient />
    </>
  );
}
