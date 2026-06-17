import type { Address } from '@/types/household';

const BASE = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1';

interface PdokSuggestDoc {
  id: string;
  weergavenaam: string;
  type: string;
}

interface PdokLookupDoc {
  id: string;
  weergavenaam: string;
  centroide_ll: string; // "POINT(lon lat)"
}

function parseCentroid(wkt: string): { lat: number; lon: number } {
  // "POINT(5.2913 52.1326)"
  const m = wkt.match(/POINT\(([^ ]+) ([^ )]+)\)/);
  if (!m) throw new Error(`Unexpected centroid format: ${wkt}`);
  return { lon: parseFloat(m[1]), lat: parseFloat(m[2]) };
}

export async function suggestAddresses(query: string): Promise<PdokSuggestDoc[]> {
  if (query.trim().length < 3) return [];
  const url = new URL(`${BASE}/suggest`);
  url.searchParams.set('q', query);
  url.searchParams.set('fq', 'type:(adres)');
  url.searchParams.set('rows', '8');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`PDOK suggest ${res.status}`);
  const json = await res.json();
  return (json.response?.docs ?? []) as PdokSuggestDoc[];
}

export async function lookupAddress(id: string): Promise<Address> {
  const url = new URL(`${BASE}/lookup`);
  url.searchParams.set('id', id);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`PDOK lookup ${res.status}`);
  const json = await res.json();
  const doc: PdokLookupDoc = json.response?.docs?.[0];
  if (!doc) throw new Error('PDOK lookup returned no results');
  const { lat, lon } = parseCentroid(doc.centroide_ll);
  return { label: doc.weergavenaam, lat, lon };
}
