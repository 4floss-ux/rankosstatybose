const database = 'https://wpldojonwvccdmpmlbfe.supabase.co';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (['statybos24.lt', 'www.statybos24.lt'].includes(url.hostname)) {
      return new Response('Test Worker cannot serve production', { status: 421 });
    }
    if (url.pathname.startsWith('/api/')) {
      return Response.json({ error: 'Integracijos testavimo aplinkoje išjungtos' }, { status: 403 });
    }
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Content-Security-Policy', `connect-src 'self' ${database}/auth/v1/ ${database}/rest/v1/ ${database}/storage/v1/ wss://wpldojonwvccdmpmlbfe.supabase.co/realtime/; frame-ancestors 'none'; form-action 'self'`);
    return response;
  },
};
