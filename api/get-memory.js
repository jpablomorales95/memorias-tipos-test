const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME     = "MemoriasPrueba";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'Slug requerido' });

  try {
    const formula = encodeURIComponent(`{slug}="${slug.toUpperCase()}"`);
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${formula}&maxRecords=1`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    const data = await r.json();
    if (!data.records || !data.records.length) return res.status(404).json({ error: 'No encontrada' });

    const f = data.records[0].fields;
    return res.status(200).json({
      slug:        f.slug,
      tipo:        f.tipo || 'pareja',
      // Pareja
      name1:       f.name1       || '',
      name2:       f.name2       || '',
      startDate:   f.startDate   || '',
      introText:   f.introText   || 'Tú & Yo',
      // Mamá
      mamaName:     f.mamaName     || '',
      mamaLastname: f.mamaLastname || '',
      specialDate:  f.specialDate  || '',
      // Comunes
      message:     f.message     || '',
      songName:    f.songName    || '',
      songArtist:  f.songArtist  || '',
      songArt:     f.songArt     || '',
      photos:      f.photos ? JSON.parse(f.photos) : [],
      videoUrl:    f.videoUrl    || '',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
