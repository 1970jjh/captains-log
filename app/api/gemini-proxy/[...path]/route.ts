// Server-side Gemini proxy: the API key lives only in the GEMINI_API_KEY server env var,
// never in the browser bundle. app/lib/geminiService.ts calls /api/gemini-proxy/... instead of Google.
// ponytail: same-origin + path allowlist only, add rate limiting if the proxy itself gets abused.
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_PATH = /^v1beta\/models\/[\w.\-]+:(generateContent|streamGenerateContent)$/;

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== req.headers.get('host')) {
    return NextResponse.json({ error: 'cross-origin requests are not allowed' }, { status: 403 });
  }

  const path = (await params).path.join('/');
  if (!ALLOWED_PATH.test(path)) return NextResponse.json({ error: 'path not allowed' }, { status: 400 });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on the server' }, { status: 500 });

  try {
    const alt = req.nextUrl.searchParams.get('alt');
    const upstream = await fetch(`https://generativelanguage.googleapis.com/${path}${alt ? `?alt=${encodeURIComponent(alt)}` : ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: await req.text(),
    });
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (error) {
    console.error('Gemini proxy failed:', error);
    return NextResponse.json({ error: 'Gemini upstream request failed' }, { status: 502 });
  }
}
