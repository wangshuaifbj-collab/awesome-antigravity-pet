# 宠物质量审查与升级台账

这份文档是仓库的人工质量索引，用来回答三个问题：哪些宠物已经人工审查或修复过，哪些仍需逐只复核，哪些需要进入 v2 升级排期。

它不替代 `pet.json`、`submission.json` 或 CI。元数据与版本以 pet 目录中的文件为准；CI 负责结构和尺寸校验；本台账只记录视觉判断、升级决策及其证据。

## 当前快照

- 快照日期：2026-07-19
- 对应仓库提交：PR #33 合并后补录
- 宠物总数：153
- v1：136
- v2：17
- 有历史修复或复核证据：153
- 待建立人工基线：0
- 本轮透明边缘逐只复核通过：153
- 本轮透明边缘逐只复核需修复：0
- 透明边缘未审查：0

“待建立人工基线”不等于图片有问题，只表示仓库里还没有足够明确、可追溯的逐只审查记录。

## 状态定义

- `已修复并复核`：曾针对边缘、动作、方向、尺寸或元数据做过修复，并留下提交证据。
- `收录时已复核`：收录时完成了基本视觉检查，但还没有独立的完整复审记录。
- `待基线复核`：尚未留下可追溯的人工审查结论。
- `阻断`：存在会影响安装、显示或动作语义的问题，修复前不应视为通过。
- `边缘已审查：通过`：已逐只在浅色、中灰和黑色背景上查看当前图集，没有发现可见的色键残边、底色块或游离残片。
- `边缘已审查：需修复`：已经逐只查看并确认存在边缘或透明底问题，修复并再次人工确认前不能改为通过。
- `边缘未审查`：没有完成当前图集的逐只多背景检查；历史修复记录、CI 或颜色检测脚本均不能代替这个状态。
- `v2 已完成`：图集和元数据均为 v2，并包含 16 个环视方向。
- `v2 候选`：当前仍是有效的 v1，但有明确理由进入升级排期。

任何 `spritesheet.webp` 发生变化后，原有视觉状态自动失效，应重新审查并更新证据。只修改文案或不影响图集的元数据时，可以保留视觉状态，但仍需重新运行结构校验。

## 审查依据

逐只复核时必须检查以下内容：

1. **包结构**：pet 目录只有 `submission.json`、`pet.json` 和 `spritesheet.webp`；ID、路径、版本和图集尺寸一致。
2. **主体一致性**：各行动作中的角色、服装、发型、配色和标志性配件保持一致，不出现换人或关键特征丢失。
3. **尺寸与基线**：角色在各行中的视觉高度、脚底基线和留白稳定，不突然缩小、放大、漂移或被裁切。
4. **动作语义**：idle、waving、running、waiting、review 等标准动作易于辨认，帧间衔接自然。
5. **跑步方向**：左右方向与运行时语义一致，左右脚和手臂有自然交替，不能只平移同一姿势。
6. **透明边缘**：分别在棋盘格、深色和浅色背景下检查，不残留绿、青、紫、粉或其他色键背景的轮廓。
7. **保色原则**：只处理与背景连通或有明确色键证据的残留像素，禁止按颜色全局删除，以免破坏角色本身的绿色、紫色或粉色细节。
8. **v2 环视**：16 个方向按顺时针顺序连续，四个基准方向正确，相邻方向没有主体突变、镜像错误或明显跳帧。
9. **来源与署名**：作者、来源类型、使用说明和非商业限制等信息清楚，修复后继续保留原作者署名。

结构校验通过只能证明文件格式正确，不能替代第 2–8 项人工视觉审查。

## 证据要求

一次有效的台账更新至少要写清：

- 宠物 ID 和审查日期
- 审查范围，例如“全部 9 行”“running 行”“v2 环视 16 帧”或“透明边缘”
- 结论和仍存在的风险
- 对应 commit、PR、issue 或本地 QA 记录
- 审查人

推荐记录格式：

```text
- pet-id | 2026-07-19 | 已修复并复核 | running + 透明边缘 |
  结论：左右脚交替正确，深浅背景无色键残边；证据：commit abc1234；审查人：@name
```

本地 contact sheet、视频和拆帧图仍属于过程产物，不放入 pet 目录。长期证据优先使用 commit、PR 或 issue；确有必要保留图片时，应放在专门的文档资源目录，而不是最终 pet 包内。

## 升级规则

v1 仍是受支持格式，不因版本较旧就自动判定为不合格。满足以下任一条件时，可标为 `v2 候选`：

- 用户明确需要环视方向能力。
- 宠物使用频率较高，且有可靠参考图或可编辑源素材。
- 原图集已经需要大幅重做，顺便升级的成本明显低于以后再次返工。
- 维护者或原作者明确提出升级计划。

升级完成后必须同时满足：`spriteVersionNumber: 2`、`1536x2288`、8 列 × 11 行，以及完整复核 16 个环视方向。当前未为任何 v1 自动指定升级优先级；先完成待基线复核，再根据真实问题和使用需求排期。

## 透明边缘复核记录

2026-07-19 已对全部 153 只宠物完成本轮逐只复核。每只宠物都单独打开当前 `spritesheet.webp`，分别合成到白色、中灰和黑色背景上查看全部动作行；颜色检测脚本没有被用作通过结论，也没有对任何宠物执行批量清色。

本轮结论：153 只通过，没有未审查或待修复项。银狼的紫色和蓝色发梢、昔涟的粉色和青色服装、绿色角色及其他角色本色均按主体细节保留，没有因为颜色相似而判作背景残留。

本轮已完成修复：

- `furina--lingxiaotian`：逐帧删除 running-left 行第 1–5 帧和第 6 帧左侧与主体完全断开的游离碎片；白色、中灰和黑色背景复核通过，角色本身的蓝色发梢、帽饰和白色轮廓均保留。证据：本提交 `fix(pet): clean Furina running-left fragments`。
- `moomew-coder-cat--ping`：逐帧移除原始图集自带的不透明白色贴纸边，并单独删除 waving 第 1、3 帧残留的白底竖块；全部 57 个使用帧完成白色、中灰和黑色背景复核，白毛、白爪、道具、高光和状态特效均保留。证据：本提交 `fix(pet): remove MooMew white matte`。
- `yume-boundary--andy-meow`：逐帧移除浅色底边与 running-left、review 行的游离竖向残片；对人工确认的绿色色键污染使用相邻黑紫发色局部校正并保留原 alpha，没有全局删除绿色。全部 57 个使用帧完成三背景复核，紫色头发高光保留。证据：本提交 `fix(pet): clean Yume matte and green spill`。
- `gintoki-pixel--yuu-m`：仅移除 running-left 第 7 帧右侧与主体完全断开的重复头发残片，共 364 个可见像素；其余图集解码像素未改变，全部 9 行完成白色、中灰和黑色背景复核，银蓝头发和深紫描边均保留。证据：本提交 `fix(pet): remove Gintoki detached hair fragment`。
- `gudong--rank`：逐帧移除第 6 行 8 处与主体完全断开的白色裁切竖片，共 355 个可见像素；其余图集解码像素未改变，全部 11 行完成白色、中灰和黑色背景复核，白耳、王冠高光、绿色叶片、披风和 16 个环视方向均保留。证据：本提交 `fix(pet): remove Gudong crop slivers`。
- `xiaomai--brian-3`：仅移除 running-left 第 7、8 帧三块与主体完全断开的重复猫脸、身体和白爪裁切残片，共 2130 个可见像素；其余图集解码像素未改变，全部 11 行完成三背景复核，狸花纹、白脸白胸白爪、胡须和 16 个环视方向均保留。证据：本提交 `fix(pet): remove XiaoMai crop fragments`。
- `acheron--lingxiaotian`：仅移除第 6 行第 2、3、4、7 帧与主体完全断开的紫色裁切残片，共 4578 个可见像素；其余图集解码像素未改变，全部 9 行完成三背景复核，紫色长发、洋红边缘明暗、红色发饰、佩剑和服装均保留。证据：本提交 `fix(pet): remove Acheron crop fragments`。
- `becky--natewanggg`：逐帧移除第 2、3、5 行 15 个帧格内来自相邻猫姿态的断开裁切残片，共 19412 个可见像素；其余图集解码像素未改变，全部 9 行完成三背景复核，主体虎斑纹、蝴蝶、胡须、烟雾和动作轮廓均保留。证据：本提交 `fix(pet): remove Becky crop fragments`。
- `fleta--natewanggg`：仅移除第 5 行第 3 帧左侧一块与主体和蝴蝶均断开的相邻帧裁切残片，共 120 个可见像素；其余图集解码像素未改变，全部 9 行完成三背景复核，银白毛色、灰色条纹、蝴蝶、胡须、气泡和动作轮廓均保留。证据：本提交 `fix(pet): remove Fleta crop fragment`。
- `tingyun--lingxiaotian`：仅移除第 2 行第 2–7 帧与主体断开的相邻帧尾巴和紫色裁切残片，共 2024 个可见像素；目标区域以外的解码像素未改变，全部 9 行完成三背景复核，棕发、狐耳、完整尾巴、金红服装、紫色明暗和跑步姿态均保留。证据：本提交 `fix(pet): remove Tingyun crop fragments`。

本轮新增逐只复核通过：

- `aiko--chenxin-dlut`、`anya--chenxin-dlut`、`chen--chenxin-dlut`、`chibi-rei-pet--bendy`、`conan--chenxin-dlut`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认透明边缘、浅色主体和深色轮廓均无可见残边、底色块或游离残片。证据：本提交 `docs: record pet edge review progress`。
- `ganyu--chenxin-dlut`、`giyu-tomioka--wangfan002`、`inosuke-hashibira--wangfan002`、`kid--chenxin-dlut`、`klee--chenxin-dlut`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认浅色头发、白色礼服、深色描边和动作刀光均为角色或动作本色，没有可见色键残边、底色块或游离残片。证据：本提交 `docs: record five pet edge reviews`。
- `lappland--chenxin-dlut`、`makimamini--1sh1ro`、`makisekurisu--m1gr4ine`、`march-7th--chenxin-dlut`、`muichiro-tokito--wangfan002`、`new-covenant-exusiai--chenxin-dlut`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认银白头发、红粉色头发、青绿发梢、角色光环和动作特效均为主体设计，没有可见色键残边、底色块或游离残片。证据：本提交 `docs: record six pet edge reviews`。
- `nezuko-kamado--wangfan002`、`phoebe--chenxin-dlut`、`regulus-star-antimony--chenxin-dlut`、`saber--petdex-zhenyou-ling`、`shinchan--chenxin-dlut`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认绿色竹筒、粉色火焰、白色帽服、金发和纯黑轮廓均为主体或动作设计，没有可见色键残边、底色块或游离残片。证据：本提交 `docs: record another five pet edge reviews`。
- `shinobu-kocho--wangfan002`、`sonetto--chenxin-dlut`、`tanjiro-kamado--wangfan002`、`vertin--chenxin-dlut`、`yoimiya--chenxin-dlut`、`zani--chenxin-dlut`、`zenitsu-agatsuma--wangfan002`、`zero-two--mingqingmozhao`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认紫色蝶饰、青色发梢、火焰雷电、银白发、粉发和黑色角尾均为主体或动作设计，没有可见色键残边、底色块或游离残片。证据：本提交 `docs: finish intake pet edge reviews`。
- `joker--oytyo`、`koukou-penguin--hoody`、`maodie--octane0411`、`minty--somnusochi`、`naiwa--sandytruant`：逐只查看全部 11 行和最后 16 个环视方向，并在白色、中灰和黑色背景上确认绿色头发、黑色身体、橘色毛发、青绿色发饰和黄色主体均为角色本色，没有可见色键残边、底色块或游离残片。证据：本提交 `docs: record five v2 pet edge reviews`。
- `zhengyin--noonwake`：查看全部 11 行和最后 16 个环视方向，并在白色、中灰和黑色背景上确认绿色汉服、浅色长袖和黑发均为主体配色，没有可见色键残边、底色块或游离残片。证据：本提交 `docs: finish v2 pet edge reviews`。
- `aemeath-mini--cunuo`、`asuka--maxg24`、`azuma--tairazuma`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认 Aemeath 的青色头饰与服装描边、Asuka 的橙发红衣、Azuma 的浅金发均为主体设计，没有可见色键残边、底色块或游离残片；Aemeath 完全透明像素内的 RGB 数据在三背景合成后不可见，且当前图集与作者上游原版哈希一致。证据：本提交 `docs: record three pet edge reviews`。
- `castorice--lingxiaotian`、`chispa--giiilberto-nm`、`desk-otter--zihualiu1997`、`diana--am`、`diandian--lllucasxu`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认淡紫长发、橙色机器人、蓝衣水獭、金发蓝衣和虎斑白猫均为主体设计，没有可见色键残边、底色块或游离残片。证据：本提交 `docs: record five more pet edge reviews`。
- `dimo-stand--god-wu`、`dnf-female-ammo--qunboo`、`doraemon--xueshi`、`dudu-bubu--clembuilds`、`duodong--froggie`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认蓝白角色、金发黑衣、蓝白机器猫、棕白双角色和棕白小狗均为主体设计，没有可见色键残边、底色块或游离残片；DNF 枪口前的金色小块随帧构成连续射击火光，并非裁切残片。证据：本提交 `docs: record another five pet edge reviews`。
- `elaina--nyakku-shigure`、`ella-wave--sehjk`、`eren--ash-sw`、`feibi--vanfff`、`feixiao--lingxiaotian`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认银发巫女、黑白橘猫、绿披风角色、金发白帽和白发青衣均为主体设计，没有可见色键残边、底色块或游离残片；Feixiao 两行疑似细碎区域另行放大确认，均为连续的发梢、衣摆或描边。证据：本提交 `docs: record five character edge reviews`。
- `gojo--lilokhalikfa`、`gpt-muse--opask`、`guga--circus`、`hajimi--zeyuwang1999`、`hana2--initiatione`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认白发黑衣、白发青饰、企鹅服、紫发猫耳和浅色和服均为主体设计，阴影、气泡和浅色衣袖在深浅背景上也没有可见色键残边、底色块或游离残片。证据：本提交 `docs: record five varied pet edge reviews`。
- `ikaros--icarus-alpha`、`jiji--yena`、`kid-goku--julianhuang`、`levi--emrecb`、`little-black-mage--libertis`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认粉发白翼、黑猫、橙衣黑发、绿披风双刀和橙帽蓝袍均为主体设计，没有可见色键残边、底色块或游离残片；Kid Goku 的多色外圈随帧表达能量状态，并非背景色键。证据：本提交 `docs: record five dark-background edge reviews`。
- `little-sheep--mingdong`、`luffy-gear-5--jordsshmords1`、`lulu--yogazz`、`mihari--hyoni1129`、`mika--rotl24`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认白羊、白发橙衣、黄色主体、白衣紫发梢和黑发浅衣均为主体设计，没有可见色键残边、底色块或游离残片。证据：本提交 `docs: record five light-character edge reviews`。
- `mikoto--lingxiaotian`、`miyabi--eric-terminal`、`nimbus--soraberu`、`rem--l1`、`rinami--siiverash`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认棕发电弧、黑发青衣、黑发紫衣黄云、蓝发女仆和棕发蓝裙均为主体设计，没有可见色键残边、底色块或游离残片；Mikoto 的青色电弧与 Miyabi 的紫黑描边均连续表达角色设计，不按颜色误删。证据：本提交 `docs: record five color-sensitive edge reviews`。
- `rook--klubbyte`、`roxy-pixel--gravity`、`ruruka--ltmcliao-cmyk`、`saki--rookie-09`、`shian-helper--mistyshen`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认 Rook 的灰棕毛色、Roxy 的蓝发和法杖光焰、Ruruka 的黑发猫耳及情绪符号、Saki 的蓝白机体与音符、Shian Helper 的浅金发和动作特效均为主体或动作设计，没有可见色键残边、底色块或游离裁切残片。证据：本提交 `docs: record five final edge reviews`。
- `spellbook--seymour`、`starcorn--alterhq`、`tangdouren--carl312`、`teddy--danieloleary`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认 Spellbook 的紫金封边、Starcorn 的彩虹鬃毛和紫黑像素外圈、Tangdouren 的棕发肤色、Teddy 的橙色毛发和深蓝服装均为主体设计，没有可见色键残边、底色块或游离裁切残片。证据：本提交 `docs: record four final edge reviews`。
- `tiny-crt--chochou`、`tuantuan--jbbom`、`twinkle-twinkle--twinkletwinkle`、`usachi--jack`、`violet--lazenca`、`yuzubou--keseras34938976`、`zichao-xiong--z-kzhang`：逐只查看全部 9 行，并在白色、中灰和黑色背景上确认 Tiny CRT 的紫黑线缆、Tuantuan 的橘色毛发、Twinkle Twinkle 的星光、Usachi 的粉色耳朵、Violet 的蓝色缎带、Yuzubou 的绿色叶片和自嘲熊的白色绒毛均为主体或动作设计，没有可见色键残边、底色块或游离裁切残片。证据：本提交 `docs: finish all pet edge reviews`。
- `wakaba-mutsumi--carambola`：查看全部 11 行和最后 16 个环视方向，并在白色、中灰和黑色背景上确认浅薄荷色长发、红黑服装、黄绿色眼睛和黄瓜道具均为主体或动作设计；左右跑步方向和四肢交替正确，环视顺序连续，没有可见色键残边、底色块或游离裁切残片。证据：PR #32 及本提交 `chore: complete Wakaba Mutsumi intake`。
- `hance-woniu--korn`：查看全部 11 行和最后 16 个环视方向，并在白色、中灰和黑色背景上确认白色主体、黑色轮廓和蓝色口水均为角色设计；左右跑步方向和肢体变化正确，环视顺序连续，没有可见色键残边、底色块或游离裁切残片。证据：PR #33 及本提交 `chore: complete Hance Woniu intake`。

当前 153 只宠物均已完成本轮透明边缘复核，没有仍待修复或未审查的宠物。

## 快速索引

### 边缘已审查通过：v2（17）

- `dai-dai-nai-you--1wphantom`、`kimoju--andiac`、`luna-angel-cat--neve`、`miu-meo--lemon-z`、`niumou--jarvis-2`：批次边缘和动作复核，证据 `663794d`。
- `misaka-network--ldl1234`：v2 修复与复核，证据 `f22a370`。
- `youmu--ai-generated`：方向修复与使用说明更新，证据 `e939f69`。
- `gudong--rank`：第 6 行 8 处白色裁切竖片已逐帧定点移除，并完成全部 11 行与 16 个环视方向的三背景复核，证据：本提交 `fix(pet): remove Gudong crop slivers`。
- `joker--oytyo`、`koukou-penguin--hoody`、`maodie--octane0411`、`minty--somnusochi`、`naiwa--sandytruant`：2026-07-19 逐只完成全部 11 行、16 个环视方向和三背景透明边缘复核，证据：本提交 `docs: record five v2 pet edge reviews`。
- `xiaomai--brian-3`：running-left 第 7、8 帧三块裁切残片已定点移除，并完成全部 11 行与 16 个环视方向的三背景复核，证据：本提交 `fix(pet): remove XiaoMai crop fragments`。
- `zhengyin--noonwake`：2026-07-19 完成全部 11 行、16 个环视方向和三背景透明边缘复核，证据：本提交 `docs: finish v2 pet edge reviews`。
- `wakaba-mutsumi--carambola`：2026-07-19 完成全部 11 行、左右跑步、16 个环视方向和三背景透明边缘复核，证据：PR #32 及本提交 `chore: complete Wakaba Mutsumi intake`。
- `hance-woniu--korn`：2026-07-19 完成全部 11 行、左右跑步、16 个环视方向和三背景透明边缘复核，证据：PR #33 及本提交 `chore: complete Hance Woniu intake`。

### 边缘已审查通过：v1（136）

- `apu--xchangee`、`arlecchino--lingxiaotian`、`black-swan--lingxiaotian`、`bocchi--lingxiaotian`、`bubu--gbn666`、`claude--xiangking`、`codenono--dq02`、`corgi-companion--cxian0928-afk`、`cyrene--lingxiaotian`、`diaoyi-baobao--d1a0y1bb`、`firefly--lingxiaotian`、`frankie--aygunvarol`、`frieren--lingxiaotian`、`hu-tao--lingxiaotian`、`kamisato-ayaka--lingxiaotian`、`katana-cheems--thankyou-cheems`、`mai--dwdestiny`、`miku--lingxiaotian`、`mimi--spacebody`、`nahida--lingxiaotian`、`navia--lingxiaotian`、`night-neko--netizenxuan`、`paimon--lingxiaotian`、`panda--jason-bai`、`raiden-shogun--lingxiaotian`、`robin--lingxiaotian`、`ruan-mei--lingxiaotian`、`silver-wolf--lingxiaotian`、`sparkle--lingxiaotian`、`tian-hua-hua--d1a0y1bb`、`wally--wally025`、`xian-xiao-lu--qingyunagi`、`yier--gbn666`、`yuanzai--gaming33`：透明边缘修复批次，证据 `1b537c1`。
- `buba--yurcek`、`capybara-lulu--jiushu`、`goblin--rkwap`、`happynailong--aquaxyy`、`linnea--nyakku-shigure`、`mellow-duck--sally-entr`、`xiaoba-cat--jack`：批次边缘和动作复核，证据 `663794d`。
- `doro--lingxiaotian`：running 方向修复，证据 `d15d116`。
- `furina--lingxiaotian`：running-left 游离碎片逐帧修复并完成三背景复核，证据：本提交 `fix(pet): clean Furina running-left fragments`。
- `mahiro--lingxiaotian`、`reimu--lingxiaotian`：动作和预览修复，证据 `a157ca8`。
- `moomew-coder-cat--ping`：不透明白色贴纸边和局部白底竖块逐帧修复并完成三背景复核，证据：本提交 `fix(pet): remove MooMew white matte`。
- `yume-boundary--andy-meow`：浅色底边、绿色色键污染和游离竖向残片逐帧修复并完成三背景复核，证据：本提交 `fix(pet): clean Yume matte and green spill`。
- `isekaijoucho--siiverash`：透明边缘和动画修复，证据 `3a2f8a6`。
- `aiko--chenxin-dlut`、`anya--chenxin-dlut`、`chen--chenxin-dlut`、`chibi-rei-pet--bendy`、`conan--chenxin-dlut`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record pet edge review progress`。
- `gintoki-pixel--yuu-m`：running-left 第 7 帧重复头发残片已定点移除并完成全部 9 行三背景复核，证据：本提交 `fix(pet): remove Gintoki detached hair fragment`。
- `ganyu--chenxin-dlut`、`giyu-tomioka--wangfan002`、`inosuke-hashibira--wangfan002`、`kid--chenxin-dlut`、`klee--chenxin-dlut`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record five pet edge reviews`。
- `lappland--chenxin-dlut`、`makimamini--1sh1ro`、`makisekurisu--m1gr4ine`、`march-7th--chenxin-dlut`、`muichiro-tokito--wangfan002`、`new-covenant-exusiai--chenxin-dlut`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record six pet edge reviews`。
- `nezuko-kamado--wangfan002`、`phoebe--chenxin-dlut`、`regulus-star-antimony--chenxin-dlut`、`saber--petdex-zhenyou-ling`、`shinchan--chenxin-dlut`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record another five pet edge reviews`。
- `shinobu-kocho--wangfan002`、`sonetto--chenxin-dlut`、`tanjiro-kamado--wangfan002`、`vertin--chenxin-dlut`、`yoimiya--chenxin-dlut`、`zani--chenxin-dlut`、`zenitsu-agatsuma--wangfan002`、`zero-two--mingqingmozhao`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: finish intake pet edge reviews`。
- `acheron--lingxiaotian`：第 6 行第 2、3、4、7 帧紫色裁切残片已定点移除，并完成全部 9 行三背景复核，证据：本提交 `fix(pet): remove Acheron crop fragments`。
- `becky--natewanggg`：第 2、3、5 行 15 个帧格内来自相邻猫姿态的裁切残片已逐帧定点移除，并完成全部 9 行三背景复核，证据：本提交 `fix(pet): remove Becky crop fragments`。
- `aemeath-mini--cunuo`、`asuka--maxg24`、`azuma--tairazuma`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record three pet edge reviews`。
- `castorice--lingxiaotian`、`chispa--giiilberto-nm`、`desk-otter--zihualiu1997`、`diana--am`、`diandian--lllucasxu`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record five more pet edge reviews`。
- `dimo-stand--god-wu`、`dnf-female-ammo--qunboo`、`doraemon--xueshi`、`dudu-bubu--clembuilds`、`duodong--froggie`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record another five pet edge reviews`。
- `elaina--nyakku-shigure`、`ella-wave--sehjk`、`eren--ash-sw`、`feibi--vanfff`、`feixiao--lingxiaotian`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record five character edge reviews`。
- `fleta--natewanggg`：第 5 行第 3 帧左侧相邻帧裁切残片已定点移除，并完成全部 9 行三背景复核，证据：本提交 `fix(pet): remove Fleta crop fragment`。
- `gojo--lilokhalikfa`、`gpt-muse--opask`、`guga--circus`、`hajimi--zeyuwang1999`、`hana2--initiatione`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record five varied pet edge reviews`。
- `ikaros--icarus-alpha`、`jiji--yena`、`kid-goku--julianhuang`、`levi--emrecb`、`little-black-mage--libertis`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record five dark-background edge reviews`。
- `little-sheep--mingdong`、`luffy-gear-5--jordsshmords1`、`lulu--yogazz`、`mihari--hyoni1129`、`mika--rotl24`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record five light-character edge reviews`。
- `mikoto--lingxiaotian`、`miyabi--eric-terminal`、`nimbus--soraberu`、`rem--l1`、`rinami--siiverash`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record five color-sensitive edge reviews`。
- `rook--klubbyte`、`roxy-pixel--gravity`、`ruruka--ltmcliao-cmyk`、`saki--rookie-09`、`shian-helper--mistyshen`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record five final edge reviews`。
- `tingyun--lingxiaotian`：第 2 行第 2–7 帧相邻帧尾巴和紫色裁切残片已定点移除，并完成全部 9 行三背景复核，证据：本提交 `fix(pet): remove Tingyun crop fragments`。
- `spellbook--seymour`、`starcorn--alterhq`、`tangdouren--carl312`、`teddy--danieloleary`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: record four final edge reviews`。
- `tiny-crt--chochou`、`tuantuan--jbbom`、`twinkle-twinkle--twinkletwinkle`、`usachi--jack`、`violet--lazenca`、`yuzubou--keseras34938976`、`zichao-xiong--z-kzhang`：2026-07-19 逐只完成全部 9 行三背景透明边缘复核，证据：本提交 `docs: finish all pet edge reviews`。

### 边缘已审查需修复：v1（0）

- 无。

### 收录时已复核、边缘未审查：v1（0）

以下宠物在像素动漫批次收录时完成了基本结构和视觉复核，证据 `5811496`。它们仍应在后续独立复审中重新检查全部动作和深浅背景边缘。

- 无。

### 待基线复核、边缘未审查：v2（0）

- 无。

### 待基线复核、边缘未审查：v1（0）

- 无。

## 每轮维护流程

1. 从 `待基线复核` 中选择一只宠物，并生成 contact sheet 与动作预览。
2. 按本页“审查依据”逐项检查，不用单一颜色阈值批量清理所有宠物。
3. 有问题时只修复证据明确的帧或像素区域，再次检查棋盘格、深色和浅色背景。
4. 运行 `npm run validate:pr`；涉及生成页面时再运行 `npm run previews`、`npm run readmes`、`npm run validate` 和 `npm run lint`。
5. 提交后，把宠物移动到相应状态，并补充日期、范围、结论、证据和审查人。
6. 新增宠物时必须同步加入本台账；删除宠物时同步移除；图集变化时必须重新进入复核状态。

每轮只处理少量宠物，优先保证逐只判断可追溯，而不是用无法区分角色本色与背景色键的全仓批处理换取速度。
