import { additionalTranslations } from "@/lib/i18n-additional";

export const supportedLocales = ["en", "zh", "ko", "ja", "es"] as const;
export type Locale = (typeof supportedLocales)[number];

export const localeConfig: Record<
  Locale,
  {
    label: string;
    shortLabel: string;
    htmlLang: string;
    ogLocale: string;
    pathPrefix: string;
  }
> = {
  en: {
    label: "English",
    shortLabel: "EN",
    htmlLang: "en",
    ogLocale: "en_US",
    pathPrefix: "",
  },
  zh: {
    label: "简体中文",
    shortLabel: "中",
    htmlLang: "zh-CN",
    ogLocale: "zh_CN",
    pathPrefix: "/zh",
  },
  ko: {
    label: "한국어",
    shortLabel: "한",
    htmlLang: "ko",
    ogLocale: "ko_KR",
    pathPrefix: "/ko",
  },
  ja: {
    label: "日本語",
    shortLabel: "日",
    htmlLang: "ja",
    ogLocale: "ja_JP",
    pathPrefix: "/ja",
  },
  es: {
    label: "Español",
    shortLabel: "ES",
    htmlLang: "es",
    ogLocale: "es_ES",
    pathPrefix: "/es",
  },
};

export function localePath(locale: Locale, path = "") {
  const normalizedPath = path === "/" ? "" : path;
  return `${localeConfig[locale].pathPrefix}${normalizedPath}` || "/";
}

export function localeFromPathname(pathname: string): Locale | null {
  const segment = pathname
    .split("/")
    .filter(Boolean)[0]
    ?.replace(/\.html$/, "");
  return supportedLocales.find(
    (locale) => locale !== "en" && locale === segment,
  ) ?? null;
}

export const translations = {
  en: {
    // Header
    gallery: "Gallery",
    collections: "Collections",
    rankings: "Rankings",
    install: "Install",
    guide: "Craft Guide",
    requestPet: "Request a Pet",
    requestPlaza: "Request Plaza",
    docs: "Docs",
    github: "GitHub",
    submitPet: "Request / Submit",
    requestPetWithAI: "Use Codex to submit a request",
    requestPetWithAIDesc:
      "Let Codex organize the request and create the GitHub Issue.",
    submitPetWithAI: "Use Codex to submit your pet",
    submitPetWithAIDesc:
      "Let Codex prepare the pet files and a focused pull request.",
    copyPromptShort: "Copy prompt",
    advancedPullRequest: "Go to GitHub and submit a PR",
    advancedPullRequestDesc:
      "Open GitHub to submit an existing pet through a Pull Request.",
    submissionGuide: "Contribution guide",
    submissionGuideDesc:
      "Read the version, quality, attribution, and contribution requirements.",
    switchToLightMode: "Switch to light mode",
    switchToDarkMode: "Switch to dark mode",

    // Hero
    heroBadge: "{count} carefully selected pets",
    heroTitle1: "Your free community",
    heroTitle2: "Codex pet gallery",
    heroDesc:
      "Browse community-made companions like a free pet store: preview every animation, install a favorite in one step, or request a character you want the community to make.",
    heroExplore: "Browse and install",
    heroSubmit: "Request a character",
    heroStatPets: "Selected pets",
    heroStatCategories: "Categories",
    heroStatLicense: "Open source",
    heroStatLicenseValue: "MIT + CC BY-NC",
    exploreGallery: "Explore gallery",
    submitYourPet: "Submit your pet",

    // Gallery
    galleryTitle: "Gallery",
    petsAvailable: "{count} pets available",
    searchPlaceholder: "Search pets, authors, tags...",
    allCategories: "All categories",
    clearSearch: "Clear search",
    filterCategories: "Filter categories",
    noResults: "No pets match your search.",
    noResultsHint: "Try a different keyword or category.",
    loadMorePets: "Load more pets",
    showingPets: "Showing {count} pets",
    backToTop: "Back to top",
    gachaOpen: "Random discovery",
    gachaTitle: "Random discovery",
    gachaStageLabel: "Community pet pool",
    gachaDescription:
      "Discover a few community pets without leaving the gallery.",
    gachaDrawCountLabel: "Draw count",
    gachaRuleNote: "No duplicate characters in one round",
    gachaSingle: "Single draw",
    gachaTriple: "Three draws",
    gachaStart: "Start drawing",
    gachaDrawing: "Drawing...",
    gachaFreeNote: "Free random discovery",
    gachaComplete: "Draw complete · {count} pets",
    gachaDrawAgain: "Draw again",
    gachaClose: "Close",

    // Collections
    featuredCollectionsEyebrow: "Featured collections",
    featuredCollectionsTitle: "Selected companions worth installing together",
    viewAllCollections: "View all",
    previousCollections: "Previous collection",
    nextCollections: "Next collection",
    collectionPetCount: "{count} pets",
    franchiseSeries: "Franchise series",
    themeCollection: "Theme collection",
    collectionsPageTitle: "Explore series and themed collections",
    collectionsPageSubtitle:
      "Follow pets from the same fictional world, or discover companions connected by a shared theme.",
    collectionSearchPlaceholder: "Search collections or pets...",
    clearCollectionSearch: "Clear collection search",
    filterCollections: "Filter collections",
    allCollections: "All collections",
    noCollectionsFound: "No collections match your search.",
    noCollectionsFoundHint: "Try another title, character, or collection type.",
    franchiseSeriesTitle: "Franchise series",
    franchiseSeriesDesc:
      "Characters from the same game, animation, film, or other original work, organized from repository metadata.",
    themeCollectionsTitle: "Theme collections",
    themeCollectionsDesc:
      "Cross-franchise groups built around a shared subject, style, or companion type.",
    backToCollections: "Back to collections",
    openCollectionInCodex: "Open collection in ChatGPT",

    // Rankings
    rankingsPageTitle: "Community rankings",
    rankingsPageSubtitle:
      "See which pets, creators, and collections are earning attention across the community. Weekly rankings reward current momentum; all-time rankings recognize lasting impact.",
    rankingPets: "Pets",
    rankingContributors: "Contributors",
    rankingCollections: "Collections",
    rankingWeekly: "This week",
    rankingAllTime: "All time",
    rankingInstalls: "Installs",
    rankingInstalls7d: "7-day installs",
    rankingTotalInstalls: "Total installs",
    rankingLikes: "Likes",
    rankingLikes7d: "7-day likes",
    rankingFollowers: "Followers",
    rankingPetMetric: "Pets",
    rankingWeeklyInstalls: "{count} / 7d",
    rankingPetCount: "{count} pets",
    rankingSnapshot: "Statistics snapshot",
    rankingRefresh: "Refresh",
    rankingRefreshOnDeploy: "On deployment",
    rankingFairness:
      "Momentum uses 7-day installs and likes. Creator scores use only their strongest pets, while collection scores use a capped average so larger catalogs do not win by size alone.",
    rankingNoActivity:
      "The weekly board is just getting started. Likes and installs will shape the first results.",
    contributorBack: "Back to rankings",
    contributorRoleLabel: "Community creator",
    contributorPageTitle: "Pets by {name}",
    contributorPageSubtitle:
      "{name} has {count} accepted pets in the Awesome Codex Pet community.",
    contributorExternalProfile: "Open creator profile",
    followCreator: "Follow",
    followingCreator: "Following",
    followCreatorRetry: "Try again",
    followCreatorFailed: "The creator follow could not be saved.",
    creatorFollowerCount: "{count} followers",

    // Card
    by: "by",
    view: "View",
    installBtn: "Install",
    installOptions: "Choose an installation method",
    installationGuide: "Read the installation guide",
    copied: "Copied",
    defaultDesc: "A curated Codex pet package.",
    likePet: "Like this pet, {count} likes",
    likedPet: "You liked this pet, {count} likes",

    // Detail
    backToGallery: "Back to gallery",
    petNavigation: "Pet navigation",
    shufflePet: "Shuffle pet",
    interactivePreview: "Interactive preview",
    resetPetPosition: "Reset pet position",
    detailInstalls: "Installs",
    detailViews: "Views",
    detailInstallDesc:
      "Let ChatGPT install it, copy the command for your system, or open the full platform guide.",
    actionPreviews: "Action Previews",
    actionPreviewsDesc:
      "Every animation state rendered from the spritesheet — what you'll actually see in Codex.",
    metadata: "Metadata",
    author: "Author",
    license: "License",
    displayName: "Display Name",
    petVersion: "Pet Version",
    slug: "Slug",
    tags: "Tags",
    installCommands: "Installation methods",
    copyBashInstall: "Copy Bash Install",
    copyPowerShell: "Copy PowerShell",
    bashInstallDesc: "For macOS and Linux terminals.",
    powerShellInstallDesc: "For Windows PowerShell.",
    installGuideDesc: "Compare every platform method and troubleshoot setup.",
    source: "Source",
    openInCodex: "Open in ChatGPT",
    codexRunsInstall: "Codex runs the install inside ChatGPT",
    codexStartsCreation: "Open the complete Codex craft task in ChatGPT",
    share: "Share",
    copyInstall: "Copy install command",
    copyPageLink: "Copy page link",
    copyShareText: "Copy share message",
    copyMarkdownLink: "Copy Markdown link",
    shareMessage:
      "Meet {title}, a carefully made Codex pet. Preview every animation and install it in one step. Discover more selected community pets on Awesome Codex Pet:",
    shareToWeibo: "Weibo",
    shareToQQ: "QQ",
    shareToQzone: "Qzone",
    shareToWeChat: "WeChat / Moments",
    shareToX: "X",
    shareToFacebook: "Facebook",
    shareToLinkedIn: "LinkedIn",
    shareToTelegram: "Telegram",
    moreShareOptions: "More share options",

    // Footer
    contributing: "Contributing",
    footerTagline:
      "A selective home for beautifully made community Codex pets, with full previews and one-step installation.",
    footerLinksTitle: "Explore",
    footerCommunityTitle: "Community",
    footerLicenseLine: "Code under MIT · Pet assets under CC BY-NC 4.0.",
    footerBuiltWith:
      "Built with Next.js · Deployed on Cloudflare Pages · Assets under CC BY-NC 4.0",
    footerContributors: "Contributors submit",

    // 404
    notFoundTitle: "Pet not found",
    notFoundDesc:
      "The requested pet page does not exist in the current catalog.",

    // Install page
    installPageEyebrow: "Install and activate",
    installPageTitle: "Bring a pet into Codex",
    installPageSubtitle:
      "Choose a selected pet, let ChatGPT install it or use the script for your system, then enable it from Codex Settings. The installer never touches your other pets.",
    installQuickTitle: "The shortest path",
    installQuickDesc:
      "Every pet detail page already knows the exact pet id and prepares the right installation task for you.",
    installBrowsePets: "Choose a pet",
    installCodexAssist: "Let ChatGPT install it",
    installCodexAssistDesc:
      "ChatGPT opens a Codex task that asks for a pet link or id, detects your system, installs the files, and verifies the result.",
    installStep1Title: "1. Choose a pet",
    installStep1Desc:
      "Open a detail page and preview the full action set before installing.",
    installStep2Title: "2. Pick a method",
    installStep2Desc:
      "Use Open in ChatGPT, Bash, PowerShell, or the installer from a local clone.",
    installStep3Title: "3. Enable the pet",
    installStep3Desc:
      "Restart Codex if it is open, then select the new pet under Settings → Pets.",
    installMethodTitle: "Choose the method for your system",
    installMethodDesc:
      "The installer downloads only pet.json and spritesheet.webp, verifies the repository manifest and SHA-256 hashes, then activates the package atomically. Replace the sample id with the exact id shown on the pet page.",
    installRecommended: "Recommended",
    installBashLabel: "macOS / Linux",
    installPwshLabel: "Windows PowerShell",
    installNodeLabel: "Local repository",
    installBashTip: "Requires curl and bash.",
    installPwshTip: "Run as a normal user, no admin rights needed.",
    installNodeTip: "For contributors who already cloned this repository.",
    installMethodCheckTitle: "Confirm the pet id",
    installMethodCheckDesc:
      "Use the complete pet-slug--author-slug value. The author suffix lets different versions of the same character coexist.",
    installMethodRunTitle: "Run as your own user",
    installMethodRunDesc:
      "No sudo or administrator shell is needed. A custom CODEX_HOME is supported when your setup uses another location.",
    installMethodVerifyTitle: "Verify the two runtime files",
    installMethodVerifyDesc:
      "A successful install contains only pet.json and spritesheet.webp under pets/<pet-id>/. The installer also checks the SHA-256 hashes and WebP header before activation.",
    installActivateTitle: "Enable the pet in Codex",
    installActivateDesc:
      "Installation places the files; Codex still needs to load and select the pet.",
    installActivateStep1Title: "Restart Codex",
    installActivateStep1Desc:
      "If Codex was open during installation, quit and reopen it so the custom pet catalog refreshes.",
    installActivateStep2Title: "Open Settings → Pets",
    installActivateStep2Desc:
      "Find the custom-pet section and confirm that the new id appears without an error badge.",
    installActivateStep3Title: "Select the pet",
    installActivateStep3Desc:
      "Activate it, return to your workspace, and check idle, work, review, and movement states.",
    installVersionNoteTitle: "V1 and V2 install the same way",
    installVersionNoteDesc:
      "V1 pets contain nine standard action rows. V2 keeps those actions and adds 16 look directions. The atlas size and spriteVersionNumber differ, but the installer and destination do not.",
    installManageTitle: "Manage an installation",
    installManageLocationTitle: "Default location",
    installManageLocationDesc:
      "Pets are stored in ~/.codex/pets/<pet-id>/ on macOS and Linux, or %USERPROFILE%\\.codex\\pets\\<pet-id> on Windows.",
    installManageCustomTitle: "Custom Codex home",
    installManageCustomDesc:
      "Set CODEX_HOME before the command, or pass --codex-home to the Bash and local Node.js installers.",
    installManageUpdateTitle: "Update or reinstall",
    installManageUpdateDesc:
      "Run the same command again with --force (or -Force in PowerShell) to replace that id atomically. Other pet folders are left alone.",
    installManageRemoveTitle: "Uninstall",
    installManageRemoveDesc:
      "Quit Codex, remove only that pet's folder, then reopen Codex. No registry or system files are created.",
    installManagePrivacyTitle: "Anonymous install count",
    installManagePrivacyDesc:
      "Successful scripts send one anonymous install event. Set AWESOME_CODEX_PET_NO_STATS=1 to disable it.",
    installFaqTitle: "FAQ",
    installFaqQ1: "Where are pets installed?",
    installFaqA1:
      "Each pet lands in your Codex home (default ~/.codex) under pets/<pet-id>/.",
    installFaqQ2: "Can I uninstall a pet?",
    installFaqA2: "Delete the pet folder. Nothing else is touched.",
    installFaqQ3: "Is sudo required?",
    installFaqA3: "No. Installs are scoped to your user directory.",
    installFaqQ4:
      "The pet does not appear after installation. What should I check?",
    installFaqA4:
      "Confirm both runtime files exist, verify that pet.json.id matches the folder name, restart Codex, then look under Settings → Pets again.",
    installFaqQ5: "Can V1 and V2 pets coexist?",
    installFaqA5:
      "Yes. Version belongs to each pet package. Different pet ids can coexist, and reinstalling one id with --force updates only that folder.",
    openGallery: "Open gallery",

    // Guide page
    guideEyebrow: "Craft, review, and share",
    guidePageTitle: "Make a Codex pet worth keeping",
    guidePageSubtitle:
      "From version choice and action-by-action direction to clean transparent edges, packaging, and sharing: this is the quality bar for our selected pet gallery.",
    guideQuickNav: "Guide sections",
    guideNavVersions: "V1 and V2",
    guideNavActions: "Action craft",
    guideNavEdges: "Edge cleanup",
    guideNavPackage: "Package and metadata",
    guideNavCommunity: "Share and contribute",
    guideAIWorkflowEyebrow: "Fastest workflow",
    guideAIWorkflowTitle: "Choose what you want to do",
    guideAIWorkflowDesc:
      "Open the workflow in local Codex, or copy the prompt for another AI assistant.",
    guideRequestWorkflow: "Ask the community to make a pet",
    guideRequestWorkflowDesc:
      "No finished pet yet? Share the character, references, and requirements so community contributors or AI can make it for you.",
    guideSubmitWorkflow: "Submit your pet",
    guideSubmitWorkflowDesc:
      "Start from references or attach existing files. Codex creates or repairs the pet, validates it, and opens a pull request.",
    guideAdvancedWorkflow: "Advanced pull request",
    guideAdvancedWorkflowDesc:
      "Use the repository contribution guide when you want to work directly in GitHub, Codespaces, or Git.",
    startInCodex: "Open in Codex",
    copyAIPrompt: "Copy AI prompt",
    aiPromptPreview: "AI workflow",
    showAIPrompt: "View AI prompt",
    repositorySkillLabel: "Repository skill",
    guideCategoriesTitle: "Category and discovery",
    guideCategoriesDesc:
      "Categories come from the repository taxonomy. Pick the closest primary type when you submit.",
    guideStructureTitle: "Folder layout",
    guideStructureDesc:
      "Each pet lives under pets/<pet-slug>--<author-slug>/ and only contains three files.",
    guideStructureNote:
      "Generated previews land in assets/previews/<pet-id>/ and are produced by the build pipeline.",
    guideCollectionsTitle: "Series and collection membership",
    guideCollectionsDesc:
      "Use submission.json.collections to reference franchise series or theme slugs from the repository's collections.json. The website groups pets automatically and publishes a collection after it reaches three members.",
    guideVersionsEyebrow: "Runtime contract",
    guideVersionsTitle: "Choose the version before drawing",
    guideVersionsDesc:
      "Both versions share the nine standard actions. V2 adds two rows of 16 clockwise look directions and is the default for new work; V1 remains fully supported for legacy pets.",
    guideVersionV1:
      "Best for preserving or repairing an existing legacy pet. Omit spriteVersionNumber or set it to 1.",
    guideVersionV2:
      "Recommended for new pets and upgrades. Set spriteVersionNumber to 2 and review the full 16-direction loop.",
    guideAtlasSize: "Atlas",
    guideActionRows: "Action rows",
    guideLookDirections: "Look directions",
    guideRecommended: "Recommended for new pets",
    guideUpgradeTitle: "Upgrade an installed v1 pet",
    guideUpgradeDesc:
      "Upgrading a V1 pet preserves approved standard rows and adds look directions. In Codex, open Settings → Pets, choose Update, then review the complete result before submitting the final three files.",
    guideActionsEyebrow: "Nine distinct states",
    guideActionsTitle: "Direct every action, not just the character",
    guideActionsDesc:
      "A strong pet keeps one identity while giving each row a clear purpose. Write and refine each action separately; shared proportions, palette, anchor, and prop rules keep the whole set coherent.",
    guideActionIdle:
      "A living rest loop with subtle breathing, blinking, or weight shift. It should never read as a frozen still.",
    guideActionRunningRight:
      "A readable right-facing travel gait with alternating cadence and stable props. Avoid speed lines, dust, and floor shadows.",
    guideActionRunningLeft:
      "A true left-facing gait. Mirror only when markings, text, lighting, props, and handedness remain correct.",
    guideActionWaving:
      "A clear greeting led by the hand, paw, ear, or body. Use the pet itself, not detached wave marks.",
    guideActionJumping:
      "Show takeoff, airborne motion, and return while keeping scale and the ground anchor visually stable.",
    guideActionFailed:
      "Make frustration or failure readable through pose and expression. Any tears, smoke, or stars must stay attached and sprite-like.",
    guideActionWaiting:
      "An expectant pose that asks for approval or input, clearly different from ordinary idle and focused review.",
    guideActionRunning:
      "A non-directional busy state for ongoing work, not another left-or-right travel loop.",
    guideActionReview:
      "A focused inspection or thinking loop using gaze, head angle, posture, or hands without inventing unrelated props.",
    guideEdgesEyebrow: "Transparent-edge craft",
    guideEdgesTitle: "Remove purple and green fringe without damaging the pet",
    guideEdgesDesc:
      "Green, cyan, magenta, purple, or pink halos often come from chroma-key cleanup. They are quality defects, but broad color deletion can erase real hair, clothing, eyes, or props.",
    guideEdgeStep1:
      "Choose a key color that does not overlap the pet's palette, and request a flat background with no glow, shadow, blur, or semi-transparent edge contamination.",
    guideEdgeStep2:
      "Inspect the contact sheet and animation on checkerboard, dark, and light backgrounds at normal size and close zoom. Check every frame, not only the first pose.",
    guideEdgeStep3:
      "Repair the smallest failing scope first: one frame, then one action row, and only then the whole pet. Rebuild edge RGB from nearby character colors while preserving alpha and silhouette.",
    guideEdgeStep4:
      "Recheck motion after cleanup. Reject isolated pixels, clipped outlines, transparent holes, color loss, scale popping, baseline jumps, or a halo that returns during playback.",
    guideQualityEyebrow: "Selection standard",
    guideChecklistTitle: "What makes the gallery cut",
    guideChecklistItem1:
      "The character stays recognizably the same across every action and look direction.",
    guideChecklistItem2:
      "Motion is readable at actual Codex pet size, with stable scale, baseline, and silhouette.",
    guideChecklistItem3:
      "Transparent edges are clean on dark, light, and checkerboard backgrounds, with no purple or green fringe.",
    guideChecklistItem4:
      "The final folder contains only submission.json, pet.json, and spritesheet.webp, and the version matches the atlas.",
    guideChecklistItem5:
      "Final-asset authorship, reference/source notes, collection, category, tags, and non-commercial usage terms are stated truthfully.",
    guideChecklistItem6:
      "Previews, validation, lint, and a clean install test all pass before one focused pull request is opened.",
    guideCommunityEyebrow: "Community distribution",
    guideCommunityTitle: "Credit the maker, then help the pet travel",
    guideCommunityDesc:
      "Every pet page keeps its creator and source visible. Share the complete page, a ready-to-post message, a Markdown link, or the native system share sheet so people can preview and install from the original listing.",
    guideShareTitle: "Codex pet craft guide",
    guideOpenIssue: "Open a submission issue",
    guideReadFull: "Read full submission guide",

    // Sorting
    sortLabel: "Sort by",
    sortRandom: "Random",
    sortPopular: "Trending",
    sortDownloads: "Most installed",
    sortLikes: "Most liked",
    sortNewest: "Newest",
    sortName: "Name (A→Z)",
    statsLoading: "Loading statistics snapshot…",
    statsUnavailable: "Statistics temporarily unavailable",
    statsUpdated: "Deployment statistics snapshot",
    statsViews: "{count} views",
    statsInstalls: "{count} installs",

    // Actions
    idle: "Idle",
    waving: "Waving",
    running: "Running",
    "running-left": "Running left",
    "running-right": "Running right",
    waiting: "Waiting",
    review: "Review",
    jumping: "Jumping",
    failed: "Failed",
  },
  zh: {
    // Header
    gallery: "精品画廊",
    collections: "合集",
    rankings: "榜单",
    install: "安装",
    guide: "制作指南",
    requestPet: "制作申请",
    requestPlaza: "需求广场",
    docs: "文档",
    github: "GitHub",
    submitPet: "申请 / 投稿",
    requestPetWithAI: "使用 Codex 提交制作请求",
    requestPetWithAIDesc:
      "让 Codex 整理内容并创建 GitHub Issue。",
    submitPetWithAI: "使用 Codex 制作并投稿",
    submitPetWithAIDesc:
      "让 Codex 准备宠物文件，并创建一个聚焦的 Pull Request。",
    copyPromptShort: "复制提示词",
    advancedPullRequest: "去 GitHub 提交 PR",
    advancedPullRequestDesc:
      "打开 GitHub，为已有宠物提交 Pull Request。",
    submissionGuide: "投稿教程",
    submissionGuideDesc: "查看版本、质量、署名与投稿要求。",
    switchToLightMode: "切换到浅色模式",
    switchToDarkMode: "切换到深色模式",

    // Hero
    heroBadge: "已收录 {count} 只精品宠物",
    heroTitle1: "免费的社区",
    heroTitle2: "Codex 小宠物画廊",
    heroDesc:
      "像逛免费小宠物商店一样预览完整动画，一键安装喜欢的动漫、游戏或原创伙伴；没有想要的角色，还可以提交社区制作申请。",
    heroExplore: "浏览并安装",
    heroSubmit: "申请喜欢的角色",
    heroStatPets: "精品收录",
    heroStatCategories: "分类数",
    heroStatLicense: "开源许可",
    heroStatLicenseValue: "MIT + CC BY-NC",
    exploreGallery: "浏览画廊",
    submitYourPet: "提交你的宠物",

    // Gallery
    galleryTitle: "画廊",
    petsAvailable: "共 {count} 只宠物",
    searchPlaceholder: "搜索宠物、作者、标签...",
    allCategories: "全部分类",
    clearSearch: "清除搜索",
    filterCategories: "筛选分类",
    noResults: "没有找到匹配的宠物",
    noResultsHint: "试试其他关键词或分类",
    loadMorePets: "加载更多宠物",
    showingPets: "已展示 {count} 只宠物",
    backToTop: "回到顶部",
    gachaOpen: "随机发现",
    gachaTitle: "随机发现",
    gachaStageLabel: "社区宠物池",
    gachaDescription: "不用离开画廊，随机发现几只社区宠物。",
    gachaDrawCountLabel: "抽取数量",
    gachaRuleNote: "同一轮不会重复角色",
    gachaSingle: "单抽",
    gachaTriple: "三连抽",
    gachaStart: "开始抽取",
    gachaDrawing: "抽取中……",
    gachaFreeNote: "免费随机发现",
    gachaComplete: "抽取完成 · {count} 只宠物",
    gachaDrawAgain: "再抽一次",
    gachaClose: "关闭",

    // Collections
    featuredCollectionsEyebrow: "精选合集",
    featuredCollectionsTitle: "值得一起安装的精选组合",
    viewAllCollections: "查看全部",
    previousCollections: "上一个组合",
    nextCollections: "下一个组合",
    collectionPetCount: "{count} 只宠物",
    franchiseSeries: "作品系列",
    themeCollection: "主题系列",
    collectionsPageTitle: "探索作品系列与主题系列",
    collectionsPageSubtitle:
      "沿着同一部作品寻找熟悉角色，也可以按共同主题发现跨作品的桌面伙伴。",
    collectionSearchPlaceholder: "搜索合集或宠物...",
    clearCollectionSearch: "清除合集搜索",
    filterCollections: "筛选合集",
    allCollections: "全部合集",
    noCollectionsFound: "没有找到匹配的合集",
    noCollectionsFoundHint: "试试其他作品名、角色名或合集类型",
    franchiseSeriesTitle: "作品系列",
    franchiseSeriesDesc:
      "按游戏、动画、影视等原作归档，同一世界观的角色会自动组成作品系列。",
    themeCollectionsTitle: "主题系列",
    themeCollectionsDesc:
      "跨越不同作品，按题材、风格或伙伴类型整理的精选组合。",
    backToCollections: "返回合集",
    openCollectionInCodex: "在 ChatGPT 中打开合集",

    // Rankings
    rankingsPageTitle: "社区排行榜",
    rankingsPageSubtitle:
      "看看哪些宠物、创作者和系列正在获得社区关注。本周榜奖励近期热度，总榜记录长期影响力。",
    rankingPets: "宠物榜",
    rankingContributors: "贡献者榜",
    rankingCollections: "系列榜",
    rankingWeekly: "本周",
    rankingAllTime: "总榜",
    rankingInstalls: "安装",
    rankingInstalls7d: "近 7 日安装",
    rankingTotalInstalls: "累计安装",
    rankingLikes: "点赞",
    rankingLikes7d: "近 7 日点赞",
    rankingFollowers: "关注者",
    rankingPetMetric: "宠物数",
    rankingWeeklyInstalls: "近 7 日 {count}",
    rankingPetCount: "{count} 只宠物",
    rankingSnapshot: "部署统计快照",
    rankingRefresh: "更新频率",
    rankingRefreshOnDeploy: "随部署",
    rankingFairness:
      "近期热度由近 7 日安装和点赞共同决定。贡献者只计算表现最好的作品，系列使用限制数量后的平均分，避免单纯靠作品数量霸榜。",
    rankingNoActivity: "本周榜刚刚开始，点赞和安装会逐步形成第一批排名。",
    contributorBack: "返回榜单",
    contributorRoleLabel: "社区创作者",
    contributorPageTitle: "{name} 的宠物",
    contributorPageSubtitle:
      "{name} 已在 Awesome Codex Pet 社区收录 {count} 只宠物。",
    contributorExternalProfile: "打开作者主页",
    followCreator: "关注",
    followingCreator: "已关注",
    followCreatorRetry: "重试",
    followCreatorFailed: "关注状态保存失败，请稍后重试。",
    creatorFollowerCount: "{count} 位关注者",

    // Card
    by: "作者",
    view: "查看",
    installBtn: "安装",
    installOptions: "选择安装方式",
    installationGuide: "阅读安装指南",
    copied: "已复制",
    defaultDesc: "一个精选的 Codex 宠物包。",
    likePet: "给这只宠物点赞，当前 {count} 个赞",
    likedPet: "你已经赞过这只宠物，当前 {count} 个赞",

    // Detail
    backToGallery: "返回画廊",
    petNavigation: "宠物导航",
    shufflePet: "随机宠物",
    interactivePreview: "互动预览",
    resetPetPosition: "重置宠物位置",
    detailInstalls: "安装次数",
    detailViews: "浏览次数",
    detailInstallDesc:
      "可以直接交给 ChatGPT 中的 Codex 安装，也可以选择当前系统的命令或查看完整安装指南。",
    actionPreviews: "动作预览",
    actionPreviewsDesc: "Codex 中实际呈现的全部动作动画。",
    metadata: "元数据",
    author: "作者",
    license: "许可证",
    displayName: "显示名称",
    petVersion: "Pet 版本",
    slug: "标识符",
    tags: "标签",
    installCommands: "安装方式",
    copyBashInstall: "复制 Bash 命令",
    copyPowerShell: "复制 PowerShell",
    bashInstallDesc: "适用于 macOS 与 Linux 终端。",
    powerShellInstallDesc: "适用于 Windows PowerShell。",
    installGuideDesc: "比较各平台安装方法，并查看常见问题。",
    source: "源码",
    openInCodex: "在 ChatGPT 中打开",
    codexRunsInstall: "由 ChatGPT 中的 Codex 执行安装",
    codexStartsCreation: "在 ChatGPT 中打开完整制作与投稿任务",
    share: "分享",
    copyInstall: "复制安装命令",
    copyPageLink: "复制页面链接",
    copyShareText: "复制分享文案",
    copyMarkdownLink: "复制 Markdown 链接",
    shareMessage:
      "分享一只制作很用心的 Codex 小宠物：{title}。可以先看完整动作，再一键安装到 Codex。更多精品宠物都在 Awesome Codex Pet：",
    shareToWeibo: "微博",
    shareToQQ: "QQ",
    shareToQzone: "QQ 空间",
    shareToWeChat: "微信 / 朋友圈",
    shareToX: "X",
    shareToFacebook: "Facebook",
    shareToLinkedIn: "LinkedIn",
    shareToTelegram: "Telegram",
    moreShareOptions: "更多分享方式",

    // Footer
    contributing: "贡献指南",
    footerTagline:
      "专门收录制作精良的社区 Codex 宠物。完整预览、一键安装，也让每位作者被看见。",
    footerLinksTitle: "浏览",
    footerCommunityTitle: "社区",
    footerLicenseLine: "代码遵循 MIT · 宠物资源遵循 CC BY-NC 4.0。",
    footerBuiltWith:
      "使用 Next.js 构建 · 部署在 Cloudflare Pages · 资源遵循 CC BY-NC 4.0",
    footerContributors: "贡献者提交",

    // 404
    notFoundTitle: "宠物未找到",
    notFoundDesc: "当前目录中不存在该宠物页面。",

    // Install page
    installPageEyebrow: "安装与启用",
    installPageTitle: "把喜欢的宠物带进 Codex",
    installPageSubtitle:
      "先挑选经过筛选的精品宠物，再交给 ChatGPT 中的 Codex 或当前系统的安装脚本，最后到 Codex 设置中启用。安装过程不会碰其他宠物。",
    installQuickTitle: "最快的安装路径",
    installQuickDesc:
      "每只宠物的详情页都已经带上准确的宠物标识符，会自动生成对应的安装任务与命令。",
    installBrowsePets: "先挑一只宠物",
    installCodexAssist: "交给 ChatGPT 安装",
    installCodexAssistDesc:
      "ChatGPT 会打开 Codex 任务，询问宠物链接或标识符，识别当前系统，完成安装并核对结果。",
    installStep1Title: "1. 选一只宠物",
    installStep1Desc:
      "进入详情页先看完整动作，确认造型、动作和版本都符合预期。",
    installStep2Title: "2. 选择安装方式",
    installStep2Desc:
      "可以直接在 ChatGPT 中打开，也可以复制 Bash、PowerShell，或从本地仓库安装。",
    installStep3Title: "3. 在 Codex 中启用",
    installStep3Desc:
      "如果 Codex 正在运行，请重启，然后到“设置 → 宠物”选择新宠物。",
    installMethodTitle: "选择适合当前系统的方式",
    installMethodDesc:
      "安装器只下载 pet.json 与 spritesheet.webp，会先校验仓库清单和 SHA-256，再原子切换到 Codex 主目录。请把示例标识符替换成详情页显示的完整值。",
    installRecommended: "推荐",
    installBashLabel: "macOS / Linux",
    installPwshLabel: "Windows PowerShell",
    installNodeLabel: "本地代码仓",
    installBashTip: "需要本地有 curl 和 bash。",
    installPwshTip: "无需管理员权限，普通用户即可执行。",
    installNodeTip: "适合已经克隆本仓库的贡献者。",
    installMethodCheckTitle: "确认完整标识符",
    installMethodCheckDesc:
      "使用完整的 pet-slug--author-slug。作者后缀可以让同一角色的不同作者版本同时存在。",
    installMethodRunTitle: "使用当前用户执行",
    installMethodRunDesc:
      "不需要 sudo 或管理员终端。如果 Codex 主目录不在默认位置，也可以指定 CODEX_HOME。",
    installMethodVerifyTitle: "核对两个运行文件",
    installMethodVerifyDesc:
      "安装成功后，pets/<pet-id>/ 中只会有 pet.json 与 spritesheet.webp；安装器还会在切换前核对 SHA-256 和 WebP 文件头。",
    installActivateTitle: "在 Codex 中启用宠物",
    installActivateDesc:
      "安装只负责放好文件，Codex 还需要重新加载并选中这只宠物。",
    installActivateStep1Title: "重启 Codex",
    installActivateStep1Desc:
      "如果安装时 Codex 正在运行，请完全退出后重新打开，让自定义宠物目录重新载入。",
    installActivateStep2Title: "打开“设置 → 宠物”",
    installActivateStep2Desc:
      "找到自定义宠物区域，确认新标识符已经出现，并且没有错误提示。",
    installActivateStep3Title: "选中并实际查看",
    installActivateStep3Desc:
      "启用后回到工作区，检查待机、工作、审查和移动等状态是否正常播放。",
    installVersionNoteTitle: "V1 与 V2 的安装方式相同",
    installVersionNoteDesc:
      "V1 包含九行标准动作；V2 保留这些动作，并增加 16 个环视方向。两者的图集尺寸和 spriteVersionNumber 不同，但安装器与目标目录完全相同。",
    installManageTitle: "管理已经安装的宠物",
    installManageLocationTitle: "默认安装位置",
    installManageLocationDesc:
      "macOS 与 Linux 位于 ~/.codex/pets/<pet-id>/；Windows 位于 %USERPROFILE%\\.codex\\pets\\<pet-id>。",
    installManageCustomTitle: "自定义 Codex 主目录",
    installManageCustomDesc:
      "运行命令前设置 CODEX_HOME；Bash 与本地 Node.js 安装器也支持 --codex-home 参数。",
    installManageUpdateTitle: "更新或重新安装",
    installManageUpdateDesc:
      "使用同一标识符再次运行命令，并添加 --force（PowerShell 使用 -Force）才能原子替换，不会影响其他宠物目录。",
    installManageRemoveTitle: "卸载宠物",
    installManageRemoveDesc:
      "退出 Codex，只删除对应宠物文件夹，再重新打开 Codex。安装器不会写注册表或系统目录。",
    installManagePrivacyTitle: "匿名安装统计",
    installManagePrivacyDesc:
      "脚本成功后只上报一次匿名安装事件。设置 AWESOME_CODEX_PET_NO_STATS=1 可以关闭。",
    installFaqTitle: "常见问题",
    installFaqQ1: "宠物会装到哪里？",
    installFaqA1:
      "默认安装到 Codex 主目录（默认是 ~/.codex）的 pets/<pet-id>/ 里。",
    installFaqQ2: "怎么卸载？",
    installFaqA2: "直接删掉对应宠物文件夹即可，不会影响其他东西。",
    installFaqQ3: "需要 sudo 吗？",
    installFaqA3: "不需要。所有安装都只动当前用户目录。",
    installFaqQ4: "安装完成后看不到宠物怎么办？",
    installFaqA4:
      "先确认两个运行文件都存在，再检查 pet.json.id 是否与文件夹名称一致；重启 Codex 后重新打开“设置 → 宠物”。",
    installFaqQ5: "V1 与 V2 宠物可以同时使用吗？",
    installFaqA5:
      "可以。版本属于每个独立宠物包；不同标识符可以共存，使用 --force 重新安装时也只会更新对应文件夹。",
    openGallery: "去画廊看看",

    // Guide page
    guideEyebrow: "制作、验收与分享",
    guidePageTitle: "做一只值得收藏的 Codex 宠物",
    guidePageSubtitle:
      "从 V1 / V2 选择、逐动作精修，到紫边绿边清理、成品打包和社区分享：这里讲清精品宠物的完整制作标准。",
    guideQuickNav: "指南章节",
    guideNavVersions: "V1 与 V2",
    guideNavActions: "动作精修",
    guideNavEdges: "边缘清理",
    guideNavPackage: "成品与元数据",
    guideNavCommunity: "分享与共创",
    guideAIWorkflowEyebrow: "最快的投稿方式",
    guideAIWorkflowTitle: "选择你要做什么",
    guideAIWorkflowDesc:
      "可以直接在本地 Codex 中开始，也可以复制提示词交给其他 AI 助手。",
    guideRequestWorkflow: "请社区帮我制作宠物",
    guideRequestWorkflowDesc:
      "还没有成品时，提交角色、参考图和制作要求，请社区贡献者或 AI 帮你完成宠物。",
    guideSubmitWorkflow: "提交自己的宠物",
    guideSubmitWorkflowDesc:
      "可从角色和参考图开始，也可上传已有文件。Codex 会完成制作或修复、校验并创建 PR。",
    guideAdvancedWorkflow: "高级用户提交 PR",
    guideAdvancedWorkflowDesc:
      "希望直接使用 GitHub、Codespaces 或 Git 时，按仓库贡献指南操作。",
    startInCodex: "在 Codex 中打开",
    copyAIPrompt: "复制 AI 提示词",
    aiPromptPreview: "AI 工作流",
    showAIPrompt: "查看 AI 提示词",
    repositorySkillLabel: "仓库内置 Skill",
    guideCategoriesTitle: "分类与发现",
    guideCategoriesDesc:
      "分类来自仓库统一维护的类型元数据。投稿时选择最贴近的主类型即可。",
    guideStructureTitle: "目录结构",
    guideStructureDesc:
      "每只宠物放在 pets/<pet-slug>--<author-slug>/ 下，目录里只允许三个文件。",
    guideStructureNote:
      "自动生成的预览会落在 assets/previews/<pet-id>/，由构建流水线生成。",
    guideCollectionsTitle: "作品系列与主题系列",
    guideCollectionsDesc:
      "在 submission.json.collections 中填写仓库 collections.json 已定义的作品系列或主题系列 slug；网站会自动归组，并在合集达到 3 只宠物后公开展示。",
    guideVersionsEyebrow: "先确定运行时规格",
    guideVersionsTitle: "动笔之前，先选对版本",
    guideVersionsDesc:
      "两个版本都有九组标准动作。V2 另外增加两行、共 16 个顺时针环视方向，是新作品的默认选择；V1 继续用于兼容和维护旧宠物。",
    guideVersionV1:
      "适合保留或修复旧版宠物。spriteVersionNumber 可以省略，也可以设为 1。",
    guideVersionV2:
      "适合新作和升级。spriteVersionNumber 必须设为 2，并完整验收 16 个环视方向。",
    guideAtlasSize: "图集尺寸",
    guideActionRows: "标准动作",
    guideLookDirections: "环视方向",
    guideRecommended: "新作推荐",
    guideUpgradeTitle: "升级已安装的 v1 宠物",
    guideUpgradeDesc:
      "升级 V1 时会保留已经通过验收的九组标准动作，再补上环视方向。在 Codex 中打开设置 → 宠物并点击更新，确认完整动画无误后，再提交最终三件套。",
    guideActionsEyebrow: "九组动作，九种语义",
    guideActionsTitle: "每个动作都单独设计，不只是在换姿势",
    guideActionsDesc:
      "好宠物要始终像同一个角色，同时让每组动作都有明确用途。每一行都可以单独写提示词、单独返修；统一的比例、配色、落脚点和道具规则，则负责把它们连成一个完整角色。",
    guideActionIdle:
      "用呼吸、眨眼或轻微重心变化表现鲜活的待机循环，不能像一张完全静止的贴图。",
    guideActionRunningRight:
      "清楚朝右移动，步态需要交替，道具保持稳定；不要用速度线、烟尘或地面阴影代替动作。",
    guideActionRunningLeft:
      "必须真正朝左。只有在花纹、文字、光线、道具位置和惯用手都不会出错时，才适合镜像。",
    guideActionWaving:
      "让手、爪、耳朵或身体承担打招呼的动作，不要依赖悬空的波浪线。",
    guideActionJumping:
      "表现起跳、腾空和回落，同时保持角色比例与落脚基准稳定，避免播放时忽大忽小。",
    guideActionFailed:
      "用姿势和表情读出失败或沮丧。眼泪、烟雾、星星只能作为贴着角色的硬边像素效果。",
    guideActionWaiting:
      "表现正在等待授权、帮助或用户输入，既不能像普通待机，也不能像专注审查。",
    guideActionRunning:
      "这是 Codex 正在处理工作的非定向忙碌状态，不要再做一遍向左或向右赶路的跑步。",
    guideActionReview:
      "用视线、歪头、身体前倾或手部动作表现检查与思考，不要凭空增加放大镜、文档或 UI。",
    guideEdgesEyebrow: "透明边缘工艺",
    guideEdgesTitle: "去掉紫边、绿边，但别伤到角色本身",
    guideEdgesDesc:
      "绿、青、洋红、紫或粉色光边，往往来自色键抠图后的残留。它们确实要处理，但整片删除某个色系，也会误伤角色真实的头发、衣服、眼睛和道具。",
    guideEdgeStep1:
      "先选一个不会撞到角色配色的色键背景，并明确要求纯色、无光晕、无阴影、无模糊，角色边缘也不能混入半透明底色。",
    guideEdgeStep2:
      "在棋盘格、深色和浅色背景上同时检查，既看正常显示尺寸，也放大看边缘；每一帧都要过目，不能只看第一张。",
    guideEdgeStep3:
      "从最小范围开始修：先修单帧，再修单个动作行，只有污染普遍存在时才处理整只宠物。用邻近的角色颜色重建边缘 RGB，同时保留透明度和轮廓。",
    guideEdgeStep4:
      "清理后重新播放动画。孤立杂点、轮廓缺口、内部透明洞、角色掉色、尺寸跳变、基线抖动，或播放时重新出现的色边，都不能放过。",
    guideQualityEyebrow: "精品收录标准",
    guideChecklistTitle: "什么样的作品才会进入画廊",
    guideChecklistItem1:
      "所有动作和环视方向都保持同一角色的脸、比例、配色、轮廓与道具。",
    guideChecklistItem2:
      "在 Codex 的实际显示尺寸下仍然读得清，角色大小、落脚点和动作节奏稳定。",
    guideChecklistItem3:
      "深色、浅色与棋盘格背景下边缘都干净，没有紫边、绿边或其他色键残留。",
    guideChecklistItem4:
      "正式目录只保留 submission.json、pet.json、spritesheet.webp，且版本字段与图集尺寸完全匹配。",
    guideChecklistItem5:
      "最终资产作者、参考与来源说明、合集、分类、标签和非商业使用条件都如实填写。",
    guideChecklistItem6:
      "预览、校验、Lint 与独立安装测试全部通过，再发起一份范围清晰的独立 PR。",
    guideCommunityEyebrow: "社区传播",
    guideCommunityTitle: "让作者被看见，也让好宠物走得更远",
    guideCommunityDesc:
      "每个宠物页面都会保留作者与来源。你可以分享完整页面、现成分享文案、Markdown 链接，或直接调用系统分享，让别人先看动作、再从原始收录页安装。",
    guideShareTitle: "Codex 精品宠物制作指南",
    guideOpenIssue: "提交审核 Issue",
    guideReadFull: "阅读完整制作指南",

    // Sorting
    sortLabel: "排序",
    sortRandom: "随机",
    sortPopular: "近期趋势",
    sortDownloads: "最多安装",
    sortLikes: "最多点赞",
    sortNewest: "最新",
    sortName: "名称（A→Z）",
    statsLoading: "正在加载统计快照…",
    statsUnavailable: "统计数据暂时不可用",
    statsUpdated: "站点部署时统计快照",
    statsViews: "{count} 次浏览",
    statsInstalls: "{count} 次安装",

    // Actions
    idle: "待机",
    waving: "挥手",
    running: "奔跑",
    "running-left": "向左跑",
    "running-right": "向右跑",
    waiting: "等待",
    review: "审查",
    jumping: "跳跃",
    failed: "失败",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function getTranslation(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  let text: string =
    (locale === "en" || locale === "zh"
      ? translations[locale][key]
      : additionalTranslations[locale][key]) ??
    translations.en[key] ??
    key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const lang = navigator.language || "en";
  if (lang.startsWith("zh")) return "zh";
  if (lang.startsWith("ko")) return "ko";
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("es")) return "es";
  return "en";
}
