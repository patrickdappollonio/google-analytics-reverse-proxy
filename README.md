# Google Analytics Reverse Proxy for ad blockers

> Try not to hate me for making it public, but I needed a quick proof of concept and this is what I could came up with 😅

This is a simple reverse proxy implemented in Cloudflare Workers (the free tier is enough) which will allow you to use the Google Analytics `analytics.js` code in your website and still track visits, since having a new domain breaks most of the ad blockers out there.

Additionally, it rewrites the Javascript script so the URL is different, since having a URL called `https://example.com/analytics.js` will definitely be blocked, so here it's renamed to `/gtga` which will proxy the call to Google Analytics Javascript file and bring it back.

The fetch will also edit the file and find all occurrences of `www.google-analytics.com` and replace them with the hostname of the Cloudflare worker, which in turn, when a visitor is logged, the normal `analytics.js` file calls `https://www.google-analytics.com/collect`. This URL will have the hostname (`www.google-analytics.com`) replaced to the one from your worker, and the path `/collect` will be replaced with `/rr`.

All you have to do now is call the Google Analytics code, but rather than using this:

```
<!-- Google Analytics -->
<script>
window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
ga('create', 'UA-XXXXX-Y', 'auto');
ga('send', 'pageview');
</script>
<script async src='https://www.google-analytics.com/analytics.js'></script>
<!-- End Google Analytics -->
```

You will replace `https://www.google-analytics.com/analytics.js` with `https://your-worker.your-name.workers.dev/gtga`. All headers and content will remain the same (with the exception of the domain rename and path rename mentioned above):

```
<!-- Google Analytics -->
<script>
window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
ga('create', 'UA-XXXXX-Y', 'auto');
ga('send', 'pageview');
</script>
<script async src='https://your-worker.your-name.workers.dev/gtga'></script>
<!-- End Google Analytics -->
```

The code is in [`worker-code.js`](worker-code.js).
