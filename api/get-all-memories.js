const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME     = "MemoriasPrueba";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(TABLE_NAME)}?sort[0][field]=createdAt&sort[0][direction]=desc&maxRecords=100`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    const data = await r.json();
    if (!data.records) return res.status(500).json({ error: 'Error Airtable' });
    const memories = data.records.map(rec => ({
      id:          rec.id,
      slug:        rec.fields.slug        || '',
      tipo:        rec.fields.tipo        || 'pareja',
      name1:       rec.fields.name1       || '',
      name2:       rec.fields.name2       || '',
      mamaName:    rec.fields.mamaName    || '',
      mamaLastname:rec.fields.mamaLastname|| '',
      createdAt:   rec.fields.createdAt   || rec.createdTime || '',
    }));
    return res.status(200).json({ memories, total: memories.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
