const PROJECT_NAME = "awesome-codex-pet";
const REQUEST_TIMEOUT_MS = 15_000;
const domain = process.argv[2];
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

if (!domain || !/^[a-z0-9.-]+$/i.test(domain)) {
  throw new Error("Pass a valid hostname, for example www.codexpet.top.");
}
if (!accountId || !apiToken) {
  throw new Error(
    "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required.",
  );
}

const endpoint =
  `https://api.cloudflare.com/client/v4/accounts/${accountId}` +
  `/pages/projects/${PROJECT_NAME}/domains`;
const headers = {
  Authorization: `Bearer ${apiToken}`,
  "Content-Type": "application/json",
};

async function readJson(response) {
  const result = await response.json();
  if (!response.ok || !result.success) {
    const message = result.errors?.map((error) => error.message).join("; ");
    throw new Error(message || `Cloudflare API returned ${response.status}.`);
  }
  return result.result;
}

async function fetchCloudflare(options = {}) {
  return fetch(endpoint, {
    ...options,
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

const domains = await readJson(await fetchCloudflare());
if (domains.some((item) => item.name === domain)) {
  console.log(`${domain} is already attached to ${PROJECT_NAME}.`);
} else {
  await readJson(
    await fetchCloudflare({
      method: "POST",
      body: JSON.stringify({ name: domain }),
    }),
  );
  console.log(`Attached ${domain} to ${PROJECT_NAME}.`);
}
