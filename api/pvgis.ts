// Vercel Edge Function: PVGIS CORS proxy
// PVGIS (re.jrc.ec.europa.eu) does not send Access-Control-Allow-Origin headers,
// so browser fetches are blocked. This thin proxy forwards the request server-side
// and adds the required CORS + cache headers.
export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  const { search } = new URL(request.url);
  const pvgisUrl = `https://re.jrc.ec.europa.eu/api/v5_2/seriescalc${search}`;

  const upstream = await fetch(pvgisUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Sunwise/1.0; +https://sunwise-kappa.vercel.app)',
      'Accept': 'application/json',
    },
  });
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    status: upstream.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 's-maxage=86400, stale-while-revalidate',
    },
  });
}
