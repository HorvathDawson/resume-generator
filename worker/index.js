// Serves the built app (dist/resume-generator/) at /resume-generator/.
// dawsonhorvath.com reaches it through the portfolio site's Worker, which
// forwards /resume-generator/* here over a service binding. On this Worker's
// own workers.dev address the bare root redirects to the app.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') return Response.redirect(new URL('/resume-generator/', url), 302);
    return env.ASSETS.fetch(request);
  },
};
