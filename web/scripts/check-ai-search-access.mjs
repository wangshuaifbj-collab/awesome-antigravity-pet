const baseUrl = (process.argv[2] ?? "https://codexpet.top").replace(/\/$/, "");
const searchBotUserAgent =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 6;
const checks = [
  {
    path: "/zh/install",
    expected: ["如何安装 Codex 小宠物", "install-pet.sh", "Install-CodexPet"],
  },
  {
    path: "/zh/request",
    expected: [
      "免费提交喜欢角色的 Codex 小宠物制作申请",
      "请填写角色名称并上传参考图片或粘贴公开链接",
      "社区贡献者可能会志愿认领",
    ],
  },
  {
    path: "/llms.txt",
    expected: [
      "/zh/install",
      "/zh/request",
      "how to install a Codex pet",
      "reference image upload or public image link",
      "install-pet.sh",
    ],
  },
  {
    path: "/robots.txt",
    expected: ["User-agent: OAI-SearchBot", "Allow: /"],
  },
];

async function sleep(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchWithRetry(url) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": searchBotUserAgent },
        redirect: "follow",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.ok) return response;
      lastError = new Error(`${url} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < MAX_ATTEMPTS) {
      await sleep(attempt * 5_000);
    }
  }
  throw lastError;
}

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  const response = await fetchWithRetry(url);
  const content = await response.text();
  for (const expected of check.expected) {
    if (!content.includes(expected)) {
      throw new Error(`${url} is missing ${JSON.stringify(expected)}`);
    }
  }
  console.log(`AI search access passed: ${url}`);
}
