import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const agentApiBaseUrl = process.env.NEXT_PUBLIC_AGENT_API_URL || process.env.AGENT_API_URL;
    if (!agentApiBaseUrl) {
      console.error('AGENT_API_URL or NEXT_PUBLIC_AGENT_API_URL not configured');
      return NextResponse.json({ error: 'Agent API URL not configured' }, { status: 500 });
    }
    const tokenUrl = `${agentApiBaseUrl.replace(/\/$/, '')}/realtime/token`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const authHeader = req.headers.get('authorization');
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(tokenUrl, { method: 'GET', headers });
    if (!response.ok) {
      console.error(`Failed to fetch token from agent API: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: 'Failed to get token from agent API' }, { status: response.status });
    }
    const tokenData = await response.json();
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('Error fetching voice token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


