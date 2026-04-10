const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME     = "MemoriasPrueba"; // Tabla separada — no toca producción

function generateSlug(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let slug = "";
  for (let i = 0; i < len; i++) slug += chars[Math.floor(Math.random() * chars.length)];
  return slug;
}

async function slugExists(slug) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(TABLE_NAME)}?filterByFormula={slug}="${slug}"&maxRecords=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
  const data = await res.json();
  return data.records && data.records.length > 0;
}

async function getUniqueSlug() {
  let slug = generateSlug();
  let attempts = 0;
  while (await slugExists(slug) && attempts < 10) { slug = generateSlug(); attempts++; }
  return slug;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch(e) { return res.status(400).json({ error: 'JSON inválido' }); } }
    if (!body) return res.status(400).json({ error: 'Body vacío' });

    const tipo = body.tipo || 'pareja'; // 'pareja' | 'mama'
    const slug = await getUniqueSlug();
    const baseUrl = `https://${req.headers.host}`;

    const fields = {
      slug,
      tipo,
      createdAt: new Date().toISOString(),
      // Campos comunes
      message:    body.message    || '',
      songName:   body.songName   || '',
      songArtist: body.songArtist || '',
      songArt:    body.songArt    || '',
      photos:     JSON.stringify(body.photos || []),
      videoUrl:   body.videoUrl   || '',
    };

    if (tipo === 'pareja') {
      fields.name1     = body.name1     || '';
      fields.name2     = body.name2     || '';
      fields.startDate = body.startDate || '';
      fields.introText = body.introText || 'Tú & Yo';
    } else if (tipo === 'mama') {
      fields.mamaName     = body.mamaName     || '';
      fields.mamaLastname = body.mamaLastname || '';
      fields.specialDate  = body.specialDate  || '';
    }

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(TABLE_NAME)}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      }
    );

    const text = await airtableRes.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { return res.status(500).json({ error: 'Respuesta inválida de Airtable: '+text.slice(0,100) }); }
    if (!airtableRes.ok) return res.status(500).json({ error: data.error?.message || 'Error Airtable' });

    const url = tipo === 'mama' ? `${baseUrl}/mama/${slug}` : `${baseUrl}/${slug}`;
    return res.status(200).json({ slug, url, tipo });

  } catch (err) {
    console.error('create-memory error:', err);
    return res.status(500).json({ error: err.message });
  }
}
