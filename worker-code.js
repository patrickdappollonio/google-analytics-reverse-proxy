addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request).then(resp => addCORS(resp, event.request)))
})

async function addCORS (response, request) {
  // Allow for a mutable response, which we can change the headers
  if (response !== null && request !== null) {
    response = new Response(response.body, response)

    // An empty header value won't set the header
    response.headers.set("Access-Control-Allow-Origin", request.headers.get("origin") || "");
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

async function handleRequest (request) {
  switch (new URL(request.url).pathname) {
    // Some URL prefixes seen in the wild
    case "/r/rr":
    case "/j/rr":
    case "/rr":
      return await doProxy(request)

    // The actual javascript file for Google Analytics
    case "/gtga":
      return await doJSFile(request)

    // If the endpoint was reached but without a known URL,
    // return a 404
    default:
      return new Response('404 page not found', { status: 404 })
  }
}

async function doJSFile (request) {
  // Create the new URL and generate a new request for proxy
  const path = `https://www.google-analytics.com/analytics.js`
  let reqproxy = new Request(path, request)

  // Parse the URL from this request
  let u = new URL(request.url)

  try {
    // Fetch the item from the page
    let resp = await fetch(reqproxy)

    // Make the response mutable
    let fileContents = await resp.text()
    fileContents = fileContents
      .replace(/www\.google-analytics\.com/gm, u.host)
      .replace(/\/collect/gm, "/rr")

    return new Response(fileContents, resp)
  } catch (e) {
    // If something fails, error out correctly
    return new Response(JSON.stringify({ error: e.message }, { status: 500 }))
  }
}

async function doProxy (request) {
  const newHostname = "www.google-analytics.com"

  // Get the IP address from the request itself or from the Cloudflare header
  let ipaddress = request.ipaddress || request.headers.get('CF-Connecting-IP')

  // If an IP address wasn't found, error out
  if (!ipaddress) return new Response('', { status: 400 })

  // Construct the new URL by changing the hostname
  let newURL = new URL(request.url)
  newURL.hostname = newHostname
  newURL.pathname = "/collect"
  newURL.searchParams.set("uip", ipaddress)

  // Duplicate the request, but changing the URL endpoint
  let proxy = new Request(newURL, request)

  try {
    // Fetch the page contents from the upstream
    // and return them to the client
    return await fetch(proxy)
  } catch (e) {
    // If something fails, error out correctly
    return new Response(JSON.stringify({ error: e.message }, { status: 500 }))
  }
}
