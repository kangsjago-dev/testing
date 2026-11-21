export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, apikey, Authorization, Prefer");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const supaUrl = "https://faszgrkwdlqxsbppownh.supabase.co";
  const supaKey = "sb_publishable_fnPfL0cZdJfsW8CdIwn4IQ_fkbJ61sA";

  const path = req.query.path || "";
  const targetUrl = new URL(path.startsWith("/") ? path : ("/" + path), supaUrl);

  for (const [k, v] of Object.entries(req.query)) {
    if (k !== "path") {
      targetUrl.searchParams.set(k, v);
    }
  }

  try {
    const fetchHeaders = {
      "apikey": supaKey,
      "Authorization": req.headers.authorization || ("Bearer " + supaKey),
      "Content-Type": req.headers["content-type"] || "application/json"
    };
    if (req.headers.prefer) fetchHeaders["Prefer"] = req.headers.prefer;

    const fetchOpts = {
      method: req.method,
      headers: fetchHeaders
    };
    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
      fetchOpts.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const supaRes = await fetch(targetUrl.toString(), fetchOpts);
    const contentType = supaRes.headers.get("content-type") || "application/json";
    const data = await supaRes.text();

    res.status(supaRes.status);
    res.setHeader("Content-Type", contentType);
    return res.send(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

