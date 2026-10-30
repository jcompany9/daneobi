// 오늘의 순위 API (Vercel 서버 함수)
// GET  /api/scores         → 오늘(한국 시간) 상위 10명
// POST /api/scores {name, score, mode, id} → 기록 저장 후 순위와 상위 10명
//
// Vercel 프로젝트에 Upstash Redis(무료)를 연결하면 아래 환경 변수가 자동으로 생겨요.
// 연결 전에는 503을 돌려주고, 게임은 이 기기에 저장된 순위로 동작해요.
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const TOP_N = 10;
const MODES = ['elementary', 'middle', 'high', 'intermediate', 'advanced'];
const MAX_SCORE = 5000000;

// 한국 시간 기준 오늘 날짜 (YYYY-MM-DD)
function today() {
  return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
}

async function redis(commands) {
  const r = await fetch(REDIS_URL + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  const out = await r.json();
  return out.map(x => { if (x.error) throw new Error(x.error); return x.result; });
}

// 이름: 최대 6글자, 영어 대문자, 숫자, 한글만 (학교 이름도 들어가게)
function cleanName(v) {
  const chars = [...String(v || '').toUpperCase()].filter(c => /[A-Z0-9가-힣]/.test(c));
  return chars.slice(0, 6).join('');
}

function parseTop(flat) {
  const list = [];
  for (let i = 0; i < flat.length; i += 2) {
    try {
      const m = JSON.parse(flat[i]);
      list.push({ id: m.id, name: m.name, mode: m.mode, score: Number(flat[i + 1]) });
    } catch (e) { /* 깨진 기록은 건너뜀 */ }
  }
  return list;
}

// 단어비 앱(안드로이드·아이폰) 안의 게임은 이 주소에서 열려서, 순위 요청을 허용해 줌
const APP_ORIGINS = ['https://localhost', 'capacitor://localhost', 'http://localhost'];

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const origin = req.headers.origin;
  if (APP_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (!REDIS_URL || !REDIS_TOKEN) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }
  const key = 'daneobi:scores:' + today();
  try {
    if (req.method === 'GET') {
      const [flat] = await redis([['ZREVRANGE', key, '0', String(TOP_N - 1), 'WITHSCORES']]);
      res.status(200).json({ date: today(), scores: parseTop(flat) });
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const name = cleanName(body.name);
      const score = Number(body.score);
      const mode = MODES.includes(body.mode) ? body.mode : 'elementary';
      const id = String(body.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 24);
      if (!name || !id || !Number.isInteger(score) || score <= 0 || score > MAX_SCORE) {
        res.status(400).json({ error: 'invalid' });
        return;
      }

      // 같은 곳에서 1분에 6번 넘게 등록하지 못하게 막음
      const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
      const rlKey = 'daneobi:rl:' + ip;
      const [count] = await redis([['INCR', rlKey], ['EXPIRE', rlKey, '60']]);
      if (count > 6) {
        res.status(429).json({ error: 'too_many' });
        return;
      }

      const member = JSON.stringify({ id, name, mode, t: Date.now() });
      const [, , rank, flat] = await redis([
        ['ZADD', key, String(score), member],
        ['EXPIRE', key, String(3 * 24 * 3600)],
        ['ZREVRANK', key, member],
        ['ZREVRANGE', key, '0', String(TOP_N - 1), 'WITHSCORES'],
      ]);
      res.status(200).json({ date: today(), rank: rank + 1, scores: parseTop(flat) });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'method' });
  } catch (e) {
    res.status(500).json({ error: 'server' });
  }
};
