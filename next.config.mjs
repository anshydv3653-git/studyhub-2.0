// The static StudyHub site now lives in public/. This rewrite serves
// public/index.html at the root URL "/" so the main site keeps its
// original address (no /index.html suffix, no redirects).
//
// /spark-ai is a dedicated public informational SEO page at app/spark-ai/page.tsx
// which links to /tutor for the full-screen interactive chat.
//
// /tracker and /dashboard route directly to the study tracker in index.html.
async function rewrites() {
  return [
    { source: "/", destination: "/index.html" },
    { source: "/tracker", destination: "/index.html" },
    { source: "/dashboard", destination: "/index.html" },
  ];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  rewrites,
};

export default nextConfig;
