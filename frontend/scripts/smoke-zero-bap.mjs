const API_BASE = (
  process.env.ZERO_BAP_API_URL ?? "https://zerobap.bap.net.pe/api"
).replace(/\/+$/, "");
const LOGIN = process.env.ZERO_BAP_LOGIN;
const PASSWORD = process.env.ZERO_BAP_PASSWORD;

if (!LOGIN || !PASSWORD) {
  console.error(
    "Define ZERO_BAP_LOGIN y ZERO_BAP_PASSWORD antes de ejecutar esta prueba."
  );
  process.exit(2);
}

const cookieJar = new Map();

function setCookies(response) {
  const values =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);

  for (const header of values) {
    const pair = header.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator <= 0) continue;
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (!value) cookieJar.delete(name);
    else cookieJar.set(name, value);
  }
}

function cookieHeader() {
  return [...cookieJar.entries()]
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set("Accept", headers.get("Accept") ?? "application/json");
  const cookies = cookieHeader();
  if (cookies) headers.set("Cookie", cookies);

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    redirect: "manual",
  });
  setCookies(response);
  return response;
}

async function readJson(response, operation) {
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${operation}: la respuesta no es JSON válido.`);
  }

  if (!response.ok) {
    const details =
      payload?.message ??
      payload?.title ??
      payload?.errors ??
      (payload ? JSON.stringify(payload) : "sin cuerpo de respuesta");
    throw new Error(
      `${operation}: HTTP ${response.status} ${typeof details === "string" ? details : JSON.stringify(details)}`.trim()
    );
  }
  if (payload && payload.success === false) {
    throw new Error(`${operation}: ${payload.message ?? "success=false"}`);
  }
  return payload;
}

let loggedIn = false;
try {
  const loginResponse = await request("/Auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: LOGIN, password: PASSWORD }),
  });
  const loginPayload = await readJson(loginResponse, "Login");
  loggedIn = true;
  console.log(`OK login: ${loginPayload?.data?.user?.username ?? LOGIN}`);

  const mePayload = await readJson(
    await request("/Auth/me"),
    "Usuario autenticado"
  );
  console.log(
    `OK /me: ${mePayload?.data?.fullName ?? mePayload?.data?.username ?? "usuario"}`
  );

  const folderComboPayload = await readJson(
    await request("/Folder/Folder/Combo"),
    "Combo de carpetas"
  );
  console.log(
    `OK combo carpetas: ${Array.isArray(folderComboPayload?.data) ? folderComboPayload.data.length : 0} opción(es)`
  );

  const foldersPayload = await readJson(
    await request("/Folder/Folder"),
    "Listado de carpetas"
  );
  console.log(
    `OK carpetas: ${Array.isArray(foldersPayload?.data) ? foldersPayload.data.length : 0} registro(s)`
  );

  const filtersPayload = await readJson(
    await request("/Minutes/Filters"),
    "Filtros de actas"
  );
  console.log(
    `OK filtros: ${filtersPayload?.data?.channels?.length ?? 0} canal(es)`
  );

  const minutesPayload = await readJson(
    await request("/Minutes/Minutes?Page=1&PageSize=1"),
    "Listado de actas"
  );
  console.log(
    `OK actas: ${minutesPayload?.pagination?.totalItems ?? 0} registro(s)`
  );

  const publicId = minutesPayload?.data?.[0]?.id;
  if (publicId) {
    const pdfResponse = await request(
      `/Minutes/${encodeURIComponent(publicId)}/pdf`,
      { headers: { Accept: "application/pdf" } }
    );
    if (!pdfResponse.ok) {
      throw new Error(`PDF: HTTP ${pdfResponse.status}`);
    }
    const bytes = new Uint8Array(await pdfResponse.arrayBuffer());
    const signature = new TextDecoder().decode(bytes.slice(0, 5));
    if (bytes.length === 0 || signature !== "%PDF-") {
      throw new Error("PDF: el contenido recibido no tiene una firma PDF válida.");
    }
    console.log(`OK PDF: ${bytes.length} bytes`);
  } else {
    console.log("OMITIDO PDF: el listado no devolvió actas.");
  }
} finally {
  if (loggedIn) {
    try {
      const response = await request("/Auth/logout", { method: "POST" });
      if (!response.ok) {
        console.error(`ADVERTENCIA logout: HTTP ${response.status}`);
      } else {
        console.log("OK logout");
      }
    } catch (error) {
      console.error(`ADVERTENCIA logout: ${error.message}`);
    }
  }
}
