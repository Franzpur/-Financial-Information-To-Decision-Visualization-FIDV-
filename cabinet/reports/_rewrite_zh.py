# -*- coding: utf-8 -*-
"""Rewrite chart captions into short Chinese viewpoints from the note context."""
import html
import json
import re
from pathlib import Path

GROUPS = json.loads(Path("/tmp/plate_groups.json").read_text(encoding="utf-8"))
OUT = Path("/Volumes/DATA/FIDV/cabinet/reports/SFC-all-charts.html")

CSS = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>制图展开</title>
<style>
:root { --ink:#1a1f26; --muted:#4a5560; --rule:#c5ccd4; --paper:#f7f5f0; --fill:#ece8e0; }
@page { size: A4; margin: 14mm 14mm 16mm; }
* { box-sizing: border-box; }
body {
  margin: 0 auto; padding: 16mm 16mm 22mm; max-width: 180mm;
  color: var(--ink); background: var(--paper);
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Songti SC", "Noto Serif SC", serif;
  font-size: 11pt; line-height: 1.45;
}
.brand { letter-spacing: 0.07em; font-size: 11pt; margin: 0 0 0.4em; }
h1 { font-size: 18pt; font-weight: 600; letter-spacing: 0.04em; margin: 0 0 0.2em; }
h2 { font-size: 12.5pt; font-weight: 600; border-bottom: 1px solid var(--rule); margin: 1.1em 0 0.6em; page-break-after: avoid; }
.cover-meta { color: var(--muted); font-size: 10pt; margin: 0 0 1em; }
figure { margin: 0 0 1.15em; page-break-inside: avoid; }
img { width: 100%; height: auto; display: block; border: 1px solid var(--rule); }
figcaption { color: var(--muted); font-size: 9.5pt; margin-top: 0.28em; }
.point { color: var(--ink); }
.no-print { color: var(--muted); font-size: 9.5pt; margin: 0 0 1em; }
@media print { body { background: white; padding: 0; } .no-print { display: none; } }
</style>
</head>
<body>
<p class="no-print">浏览器打开此页 → 打印 → 存 PDF → 关掉页眉里的网址。</p>
<p class="brand">FIDV</p>
<h1>制图展开</h1>
<p class="cover-meta">2026-10-11。共 COUNT 张。同一张图只印一次。按分析公司分列。图下的中文是这张图、或这一组图在原文里要说的观点。德意志银行这份会议纪要没有单独成图。</p>
"""


def lead(n):
    if n <= 1:
        return "这张图"
    if n == 2:
        return "这两张图"
    return "这几张图"


def has(*words):
    def test(blob):
        return all(w.lower() in blob for w in words)
    return test


def one_of(*phrases):
    def test(blob):
        return any(p.lower() in blob for p in phrases)
    return test


def all_of(*phrases):
    def test(blob):
        return all(p.lower() in blob for p in phrases)
    return test


RULES = [
    # 南亚覆铜板
    (has("2027e ccl revenue", "volume breakdown"),
     "这两张图把南亚塑胶 2027 年覆铜板的收入和出货按材料等级拆开。高阶料出货占比还很小，单价却是普通料的数倍，卖方要看收入会不会因此更快偏向高阶。"),
    (has("q226 ccl revenue"),
     "这两张图是 2026 年二季南亚覆铜板已经实现的收入和出货结构，用来对照高阶料现在占多少，而不是只看 2027 年的预测。"),
    (has("nittobo"),
     "这张图说明南亚和日东纺的合作：日东纺锁住下一代低介电玻璃纱，南亚出织布产能。要解决的是高阶覆铜板的上游玻璃会不会卡住。"),
    (has("sensitivity of ccl opm"),
     "这张图算覆铜板售价每提高一美元，经营利润能留下多少。卖方的看法是，涨价越来越多来自高阶料，利润跟涨的幅度会比普通料小。"),
    (has("peers comparison", "pe band"),
     "这几张图把南亚和同行的估值、五年市盈率、市净率对净资产收益率放在一起。卖方认为市场把石化拖累看得过重，覆铜板业务没有给到同行的倍数。"),
    (has("direct holding"),
     "这张图列出南亚直接持股的公司，用来把持股价值和覆铜板、石化主业分开。"),
    (one_of('market cap vs. market value', 'implied contribution of core ccl', 'implied ccl'),
     "这几张图用南亚的市值减去所持上市公司的市值，倒推覆铜板加石化主业还值多少。背景是对南亚电路板的减持已经做完。"),
    (has("nyp's valuation"),
     "这张图是南亚的分部估值。卖方给出的目标价，对应 2027 年大约 15 倍市盈率。"),
    (has("integrated ccl value chain"),
     "这张图画南亚从上游材料到覆铜板成品的一体化产能。原料紧的时候能自己供，客户认证也能更快。"),
    (has("classification of ccl"),
     "这张图把覆铜板按等级和升级路径排开。芯片一代比一代快，信号更易损耗，服务器就要用更高阶的板材。"),
    (one_of('ccl portfolio', 'ccl market share by supplier'),
     "这两张图给南亚自己的覆铜板产品，以及各家供应商的份额，用来看南亚站在哪一档材料上。"),
    (has("monthly ccl capacity"),
     "这张图是南亚覆铜板的月产能，用来看扩产赶不赶得上高阶料的需求。"),
    (has("opm comparison"),
     "这张图比较几家覆铜板公司的经营利润率。卖方的看法是，上游材料自己做的公司，利润率更高。"),
    (has("ccl asp forecast"),
     "这张图是南亚覆铜板单价的预测。涨价分成两块：供给紧带来的提价，以及人工智能用高阶料占比上升。"),
    (has("e-glass"),
     "这张图是电子布的供需。卖方认为至少到 2027 年供给都偏紧，普通覆铜板的价格还会往上。"),
    (one_of('pricing upcycle', 'asp of conventional ccl'),
     "这两张图把普通覆铜板的涨价，以及南亚和台光的单价放在一起。公告的涨价不会立刻全部进到实际售价。"),
    # 东盟利率
    (has("asean markets' performance"),
     "这张图汇总东盟市场的涨跌和估值，作为后面利率筛选的底子。"),
    (has("asean sectors' performance"),
     "这张图按行业看东盟的涨跌和估值，用来找哪些行业更吃利率。"),
    (has("positive sensitivity to us 10y"),
     "这张图筛对美国十年期收益率上升反而受益的东盟股票，集中在金融、能源和材料。"),
    (all_of('negative sensitivity', 'leverage'),
     "这几张图接着筛：谁在美国十年期收益率上升时受损，谁是杠杆本身偏高。两件事要分开。"),
    (has("real and breakeven"),
     "这张图把美国十年期利率拆成实际利率和通胀预期。这一轮收益率上升，两边都在抬。"),
    (has("1m change in yields"),
     "这张图比较新兴市场和亚太一个月内收益率抬了多少。债券抛售是普遍的，美国抬得更明显。"),
    (one_of('fed tightening', 'rolling 12-month correlation'),
     "这两张图看东盟股市在美联储收紧前后怎么走，以及和美国十年期收益率的相关性稳不稳。"),
    (has("asean monthly returns"),
     "这两张图把东盟月度回报分别对上美国十年期名义利率和实际利率。这层关系会换方向，不是一条固定的线。"),
    (has("sensitivity to us 10y bond"),
     "这张图估计东盟股市对美国十年期债券收益率的敏感度。名义收益率上升对股市略偏正，实际收益率上升则偏负。"),
    (has("sensitivity to local bond"),
     "这张图看东盟对本地债券收益率的敏感度。越南、菲律宾对美国收益率更敏感；印尼则更吃本地利率。"),
    (has("changes in policy rates"),
     "这张图是政策利率的变化。印尼对美国收益率最不敏感，对本地债券收益率最敏感。"),
    (has("earnings yield"),
     "这张图是盈利收益率和本地国债收益率的利差。利差已经低于历史均值，估值对利率更脆。"),
    (has("current account"),
     "这张图是经常账户占产值的比重。外部余额差的经济体，在美元和实际利率走强时，汇率和资金流动的压力更大。"),
    (has("how leveraged are asean"),
     "这张图问东盟公司杠杆有多高，用来把利率上升落到资产负债表上。"),
    # 微软现场与 Azure
    (has("fairwater atlanta"),
     "这张卫星图看亚特兰大 Fairwater。主体建筑已经完成，用来核对微软说的已经投产、已经有客户在用。"),
    (has("third-party partner capacity"),
     "这张图整理第三方为微软补的产能。除了 Fairwater 自建，这些伙伴能不能接上 2026 年 Azure 的缺口。"),
    (has("fairwater uplift"),
     "这张图估算 Fairwater 投产能给 Azure 收入加多少。卖方把投产时间打了折扣，仍看到随后几个季度逐季加大的增量。"),
    (has("azure growth"),
     "这张图是 Azure 的增速估计。卖方在需求、产能投放，以及微软把产能留给自己之间，改这个数字。"),
    (one_of('all-in capex', 'all-in capex', "microsoft's all-in"),
     "这张图是微软的全部资本开支。要看的是开支还要不要再抬，以及抬上去是因为机房交付，还是因为存储涨价。"),
    (has("fairwater margin"),
     "这张图算 Fairwater 满产后对毛利率的拖累。新上的 GPU 产能先压低 Azure 毛利率，卖方已经把这点写进每股收益。"),
    (one_of('phase 3 site', 'vera rubin'),
     "这张图是后续场址方案。Fairwater 不只上现有的 GPU 机柜，架构已经按下一代芯片预留。"),
    (has("county office"),
     "这张图是分析师在当地县政府。用来核对场址审批和工程进度，不是财务预测。"),
    (has("suppliers going"),
     "这张图记录进出场址的供应商。卖方在门口观察，用来确认总包之外还有谁在干活。"),
    (one_of('evidence lab', 'on-site photo'),
     "这几张是卫星图和现场照片。外部主体已经完工的，剩下的活在室内；还在立钢结构的，是更早的一期。"),
    (one_of('m365', 'price increase impact'),
     "这张图算微软办公套件提价能给商业云增速留下多少。座位增长之外，价格本身是这一段收入的来源。"),
    (has("gpu capacity constraints"),
     "这张图来自对云厂商客户的核查：GPU 产能紧不紧。卖方要分清是微软少建了，还是把增量留给了自己。"),
    (has("total lease obligations"),
     "这张图是微软披露的租赁义务。公司说这只是需求还在，卖方把它读成即将交付的机房在增加。"),
    # 甲骨文
    (has("openai outcomes"),
     "这张图把 OpenAI 不同结果对甲骨文每股收益的影响摊开。即便按最差的情形打折，卖方仍觉得那个倍数不算贵。"),
    (one_of('sum of the parts', 'sum-of-the-parts', 'sotp'),
     "这张图是分部估值。已签约的资产、在建和还没租出去的电力管道分开给倍数，再折回到目标价。"),
    (has("broad weakness"),
     "这张图说明甲骨文股价的下跌不全是公司自己的事。市场上在怀疑 OpenAI 能不能兑现承诺，也在怀疑机房和融资能不能按计划落地。"),
    (one_of('chatgpt usage', 'user engagement by ai'),
     "这两张图看 ChatGPT 的使用还在不在长。周活增速放缓被卖方读成规模已经很大，使用时长仍明显高于对手。"),
    (has("leverage ratio"),
     "这张图是甲骨文的杠杆，并和微软、谷歌、新兴云厂商比较。杠杆高于大云厂商，仍低于最激进的那一档。"),
    (has("credit rating"),
     "这张图是信用评级。卖方要看的是，利息已经占掉一块经营利润之后，评级会不会滑到投资级边缘，融资成本再抬一截。"),
    (has("medium-term eps"),
     "这张图把甲骨文的中期每股收益目标和市场共识并排。共识仍明显低于公司自己的远期目标。"),
    (one_of('comparable valuation', 'peer group valuation'),
     "这张图是同行估值。卖方用它说明当前倍数对应的是哪一段增长，溢价或折价站不站得住。"),
    (has("biggest ai data center"),
     "这张图列出甲骨文在建的主要人工智能数据中心。要看的是产能交付的速度，能不能在下一年变成收入。"),
    (has("relative share price"),
     "这张图是相对股价。下跌被写成市场对人工智能基础设施的情绪，而不只是这一家公司的经营数字。"),
    (has("cost of a modern ai"),
     "这张图拆一座现代人工智能数据中心要花多少钱。壳可以租，设备可以后上，公司账上要记的资本开支因此和总投资不是同一个数。"),
    (has("lease obligation"),
     "这张图是租赁义务。租约开始之后，租金会进以后的成本；卖方也用它倒推还有多少吉瓦待交付。"),
    (one_of('capex estimates for oracle', 'ubs capex'),
     "这张图是卖方自己的资本开支估计，并和共识比较。有的年份高于共识，有的年份在公司说开支见顶之后低于共识。"),
    (has("roic"),
     "这张图重算甲骨文说的投资回报。按项目投产后的税后经营利润加折旧、除以总投资，看稳态回报够不够。"),
    (has("cds"),
     "这张图是信用违约互换利差。利差走阔，说明市场在怀疑这笔开支还融不融得成。"),
    (has("abilene"),
     "这张图是阿比林园区的收入爬坡。市场上有延期的说法，卖方引用的核查认为现场设备闲置是天气，不是没投产。"),
    (one_of('rpo duration', 'backlog'),
     "这张图按期限拆已签下的收入义务。大部分要几年后才转成收入，和收入指引在后面的财年才拐头是同一句话。"),
    (has("revised estimates"),
     "这张图是卖方改过的预测。要分开的是：新客户会不会来，以及公司在资产负债表已经承压时还敢不敢再承诺开支。"),
    # 托管与电力
    (has("revenue mix"),
     "这两张图比较现在和几年后的收入结构。要看托管或高阶业务会不会从边角变成主体，挖矿或旧业务还剩多少。"),
    (one_of('data center footprint', 'footprint'),
     "这张图是数据中心的地理分布。已租、在建和电力落在哪些点上，是这页要回答的问题。"),
    (has("signed leases"),
     "这张图是已经签下的租约。要看租给谁、有没有担保、收益率按管理层报的资本开支算出来是多少。"),
    (one_of('delivery timeline', 'delivery schedule', 'estimated delivery'),
     "这张图是交付时间。租约签了不算数，卖方要看容量哪一年真正交付、开始计租。"),
    (one_of('construction progress', 'river bend'),
     "这几张图用卫星或现场看在建进度。第一个园区能不能按期交付，会被当成后面项目信誉的样本。"),
    (one_of('power portfolio', 'power pipeline', 'unleased'),
     "这张图是电力存量或还没租出的管道。这层的量是电和并网时间，不是云收入增速。"),
    (has("price target basis"),
     "这张图说明目标价用的倍数。已签约资产给一档，在建和管道另给一档，再按交付风险折现。"),
    (one_of('summary financials', 'estimates vs. street', 'estimates vs street'),
     "这张表是卖方的财务预测，或和共识的差别。用来看收入爬坡、利润率和管理层费用指引是否被写进模型。"),
    (has("tenant mix"),
     "这张图是租户结构。卖方要看合同到期时，对手方是投资级云厂商，还是仍集中在新兴云。"),
    (has("rental rates"),
     "这两张图是超大规模机房的租金。用来核对公司报的单兆瓦投资和净经营收益率，后面几期会不会更便宜。"),
    (has("batch zero"),
     "这张图是德州对大负荷项目的分类。哪些电力分配大体能留住，哪些会被削减，哪些要推到下一批。"),
    (one_of('coverage snapshot', 'upside/downside'),
     "这张图是这一组托管公司的回报区间。卖方承认下跌情形仍然很深，因为已签约容量大多还没交付。"),
    # 英伟达、设备、出口
    (one_of('seasonality', 'taiwan adp', 'tw adp'),
     "这张图把英伟达数据中心和台湾出口（扣除笔记本）放在季节性旁边。月度或季度回落，在这里不足以单独写成需求转弱。"),
    (has("prediction error"),
     "这张图看用台湾出口的头一到三个月，去猜英伟达当季数据中心收入会偏多少。它是核对工具，不是需求结论。"),
    (one_of('hyperscaler capital', 'capital spending and nvda', 'capital intensity'),
     "这张图把云厂商资本开支和英伟达数据中心收入，或开支强度，放在一起。要看开支还在抬的时候，芯片收入能不能同向跟上。"),
    (one_of('fcf margin', 'consensus fcf', 'consensus capital'),
     "这张图是共识里的资本开支或自由现金流利润率。云厂商把收入的多大部分再投回去，现金流被压到什么程度。"),
    (one_of('gpu unit', 'gpu forecast', 'units (in'),
     "这张图按代际拆 GPU 的出货和结构。需求在这里被写成卖的是哪一代，而不是一根总销量。"),
    (has("cowos"),
     "这张图是先进封装产能里谁占多少。供给能不能跟上，是需求判断的下半张。"),
    (has("wfe"),
     "这张图是晶圆制造设备的份额或运行率。问题换成谁在供设备，不再用云收入的柱。"),
    (has("hbm"),
     "这张图是高带宽内存的份额、价格或产能。短缺被画成谁拿走了供给，以及价格会不会抬到整机里。"),
    (has("incremental hyperscaler"),
     "这张图看云开支的增量，对照英伟达数据中心收入的增量。同向还是开始分叉，是这张图要回答的。"),
    # 摩根：云与甲骨文框架
    (one_of('gross vs. net capex', 'gross vs net'),
     "这张图把毛资本开支和净资本开支分开。总额可以很大，扣掉客户预付款和别人承担的部分，公司自己要掏的现金没有那么大。"),
    (one_of('gross capex', 'jpm gross capex', 'j.p. morgan capex'),
     "这张图是资本开支路径。卖方把它画成后面几年还要上升，并且可能高于公司自己的长期框架。"),
    (one_of('long term eps', 'long-term eps', 'eps framework'),
     "这张图把长期每股收益框架和卖方估计并排。收入增速不会原样变成利润，毛利率会被基础设施收入稀释。"),
    (one_of('long-term growth', 'oci long-term', 'growth framework'),
     "这张图是云基础设施的长期收入路径，公司框架和卖方估计并排。要看的是路径，不是这一个季度的点。"),
    (has("run rate"),
     "这张图是基础设施业务的年化运行率，并标出增速。积压被收成可以和收入比较的速度，但没有被改名叫收入。"),
    (one_of('backlog disclosure', 'revenue backlog'),
     "这张图按披露时点列出云收入积压。已签义务先于当季收入，而且积压在几个季度里跳升。"),
    (one_of('cloud revenue stack', 'google cloud revenue'),
     "这张图把云收入按产品或客户拆开。一个总增速旁边仍留着结构，避免一个数字把结构吃掉。"),
    (has("actual vs"),
     "这张表把实际和卖方估计并排。要看这一季差在收入、利润还是某一块业务。"),
    (one_of('income statement', 'revenue drivers', 'segment reporting'),
     "这张表把收入、利润或分部拆开，用来核对估计改了哪几行，以及增长落在哪一段业务。"),
    (has("net leverage"),
     "这张图比较净杠杆。甲骨文在大型云厂商里杠杆最高，开支再抬，融资条件就更要紧。"),
    (has("capital requirements"),
     "这张图估计还要融多少钱。即便有客户预付款，卖方仍看到股权和债务都要继续发。"),
    (one_of('dbms', 'database'),
     "这张图是数据库市场份额。云数据库在长，但整个市场的名次并不自动跟着升。"),
    (has("cloud application"),
     "这张图是云应用的收入。它被当成利润率更高、还能长的一块，和低毛利的基础设施分开看。"),
    (has("non-cloud"),
     "这张图是非云业务。软件、硬件和服务几乎不增长，用来说明总收入的加速来自云，不是来自旧业务。"),
    (has("iaas market"),
     "这张图是基础设施云的市场份额。甲骨文绝对额在放量，占整个市场仍是个位数，卖方用来说明还有空间。"),
    (has("infrastructure economics"),
     "这张图简化一吉瓦人工智能基础设施的经济账。折旧、电力和壳的成本分开之后，毛利率和回报才算得出来。"),
    (has("higher levels of the stack"),
     "这张图说明越往软件和数据库叠，利润率越高。卖算力是入口，后面贴上的产品才是更黏的收入。"),
    # 彭博常见论点
    (one_of('skip new bonds', 'fcf vs. leverage', 'cash surge'),
     "这张图用现金流、资本开支和杠杆说明：高带宽内存带来的现金，够不够覆盖开支、从而不必再发新债。"),
    (one_of('spread curve', 'spreads'),
     "这张图是债券利差或利差曲线。要看新债会落在哪一档可比公司旁边，以及利差还会不会收窄。"),
    (one_of('arm cpu', 'server-cpu', 'server cpu'),
     "这张图看服务器 CPU 的份额。代理式人工智能把 CPU 需求拉长，Arm 和英伟达在挤传统 x86 的位置。"),
    (one_of("from china", "trade restrictions", "china pipeline"),
     "这张图看对中国的芯片销售或潜在收入。即便放开，也被写成配额和供给约束下的额外上行，而不是基本判断的改写。"),
    (has("cash burn"),
     "这张图是现金消耗的示意。按开支都记在表内，未来几年还要融资，自由现金流转正要等到更后面的财年。"),
    (has("buyback"),
     "这张图是回购历史。目标价和估值旁边，用回购说明公司把现金返回股东的节奏。"),
    (one_of("turbu-lens", "call volume", "vix", "leveraged etf", "breadth"),
     "这几张图看的是市场内部：涨的时候波动和相关性怎么走、杠杆基金和期权在不在加仓。它回答的是行情健不健康，不是某一家公司的基本面。"),
    (has("observability"),
     "这张图列出人工智能可观测性的供应商。评估和追踪被当成衡量模型质量的一层，单独拿出来，不和芯片开支混在一起。"),
    (has("lake mariner"),
     "这张图讲 TeraWulf 在 Lake Mariner 的位置。谷歌的信用支持要等产能交付才生效，所以准时交付比收入晚一个季度更要紧。"),
    (one_of("delta forge", "black pearl", "boyce", "denton campus", "natural gas pipeline"),
     "这张图是具体场址或管线。卖方用它核对这块产能建到哪一步、电从哪里来，而不是用公司总指引代替工地。"),
    (one_of("summary changes", "financial results vs", "upside / downside", "scenario anal", "ubse vs consensus", "ubse vs. street", "vs. street", "vs street"),
     "这张图把卖方估计和共识或实际并排，并给出上行、下行。差额留在两列之间，不先收成一个「超预期」的数。"),
    (one_of("august sales", "semis august", "results for fq", "fq1:", "fq2:", "fq4:", "summary model"),
     "这张图是月度销售或这一季的结果和模型。用来判断当季相对季节性是强是弱，以及估计要不要改。"),
    (one_of("taiwan export", "adp below", "normalizes after"),
     "这张图用台湾出口读英伟达当季。卖方反复把月度回落写成季节性正常化，而不是需求转折。"),
    (has("comps"),
     "这张图是可比公司。估值和增长放在同一张表里，用来说明溢价对应的是哪一段预期。"),
    (one_of("forecasted gm", "forecasted opex"),
     "这张图是分业务的毛利率或费用预测。总利润会被业务结构拉开，不能用一个公司级毛利率代替。"),
    (has("agentic"),
     "这张图看代理式人工智能对需求或软件收入的影响。要分清的是使用在扩散，还是已经碰到云厂商和软件利润率。"),
    (has("property and equipment"),
     "这张图是固定资产的披露。资本开支承诺会先变成在建和设备，再在以后几个季度进折旧。"),
    (one_of("kospi", "payout", "fcf trend"),
     "这张图把利润、自由现金流和分红或回购放在一起。要看赚到的现金有多少回到股东，而不是只看收入增速。"),
    (one_of("p&c", "reinsurance"),
     "这张图是产险或再保价格。价格持平或下降，会限制经纪和保险公司近端的有机增长。"),
    (one_of("marketplace", "muse", "agent services", "unit economics", "e-commerce protocol", "ads typically"),
     "这几张图看持久代理会不会改写电商和广告。卖方把单位经济和广告占利润的比重摆出来，避免一句「会被颠覆」代替结构。"),
    (one_of("bloom", "solid-oxide", "hydrogen", "fuel cell", "fuel-cell", "solar sales"),
     "这张图是固体氧化物或燃料电池的产能、成本和订单。要回答的是这条技术能不能按吉瓦放量，以及现金够不够撑到放量。"),
    (one_of("shopify", "merchant", "ebay"),
     "这张图看电商平台里代理和商家工具占多少收入。代理带来的加成被写成低个位数到中个位数，不是把原有业务替换掉。"),
    (one_of("xbox", "steam"),
     "这张图是游戏内容或主机的销售结构。用来看内容和服务占收入的比重在不在上升。"),
    (one_of("iaas", "paas", "scale back", "sales goal", "project jupiter", "30% annually"),
     "这张图是云基础设施的份额、销售目标或场址。要看的是增速能不能维持，以及客户和产能有没有被写得过满。"),
    (one_of("telco", "telkom", "singtel", "pldt", "fiber", "fujitsu", "nec", "hitachi", "defense"),
     "这张图放在电信或日本信息技术公司上。要分开的是谁还有财务余地、谁的光纤或国防订单能撑起中期目标。"),
    (has("software-spending"),
     "这张图是软件支出展望。预期从更高的增速降下来，用来说明企业软件没有和人工智能开支同速。"),
    (one_of("wireless", "spectrum", "fwa", "broadband", "t-mobile"),
     "这张图是美国运营商的用户、频谱或宽带。增长被拆成光纤、固定无线和手机，而不是一个电信总量。"),
    (one_of("gigawatt-scale", "amd tam", "rack-scale", "helios", "nvidia ecosystem", "sic", "gan", "xpu", "interconnect"),
     "这张图是机柜、定制芯片或互联在数据中心里占多少价值。卖方用它说明下一阶段的增量在系统，不在单颗芯片的出货。"),
    (one_of("broadcom", "nxp", "dell", "issuance", "maturity", "capital allocation", "upgrade potential"),
     "这张图是信用：利差、杠杆、到期或评级。要看这笔开支和并购会不会把债券打出同行曲线。"),
    (one_of("softbank", "coreweave", "ltv", "paramount", "charter", "spacex", "funding gap", "contract-first", "clear channel"),
     "这张图把杠杆、抵押率或新债的可比公司摆出来。问题是融资空间还剩多少，以及新债会不会比现有债券更宽。"),
    (has("negative sensitivity"),
     "这张图筛对美国十年期收益率上升会受损的东盟股票，和前面受益的那一组对着看。"),
    (one_of("bakken", "commercial launch to 1 gw", "manufacturing-related construction"),
     "这张图是电力、工厂或从首台商业化到一吉瓦要多久。放量的时间，是这条技术能不能兑现的问题。"),
    (one_of("cpu shipments above seasonal", "cash-flow outlook", "situational awareness", "free-cash-flow positive", "short-term assets"),
     "这张图把季节性以上的出货，或现金流和资产期限摆出来。近端现金转正、资产偏短期，是在回答融资压力会不会马上爆。"),
    (one_of("how suppliers", "little to no effect", "proportion of cloud", "monetization", "ai sales ahead", "open models", "catching up to peers"),
     "这张图看人工智能收入占云或软件的比重，以及开放模型会不会改写份额。卖方的判断往往是：有贡献，但还没大到改掉原有业务的结论。"),
    (one_of("ipo details", "credit checklist", "deleveraging", "mid-term targets", "customer base by region", "ex-metals", "ebitda", "cpu content", "capital mobilization"),
     "这张图把中期目标、客户地区或信用清单单独列出。用来看这笔增长或这笔并购，落在财务上还站不站得住。"),
    (one_of("excess free cash", "cran"),
     "这张图是把多余自由现金流全部返回股东的目标。信用分析看的是返还之后，债还稳不稳。"),
    (one_of("anchor risk", "upgrades/downgrades", "tech curves"),
     "这张图是科技债的评级上调和下调。风险现在集中在少数发行人，但一两家云厂商展望一改，波及的债券规模会大很多。"),
    (has("not so blue"),
     "这张图说 IBM 的现金生成没有放慢。利差仍比科技同行宽，融资需求又不大，所以还有利差可以吃。"),
    (one_of("after returns", "dollar maturities", "tech maturitie"),
     "这张图是返还股东之后还剩的自由现金流，以及未来两年债券到期。用来看再融资会不会撞上开支高峰。"),
    (has("sales were"),
     "这张图对应甲骨文收入仍在按大约三成的速度复合增长。市场担心的是数据中心建设和客户会不会付不上，不是收入已经停了。"),
    (has("webinar"),
     "这是会议注册的入口，不是论证用的图。"),
    (has("30% of portfolio"),
     "这张图看 OpenAI 在投资组合里的比重会不会升到大约三成。集中度本身就是这页要回答的风险。"),
    (has("equity needed"),
     "这张图估计还要募大约 80 到 130 亿美元股权。土地、壳和电可以由一方出，算力硬件由租户出，股权缺口仍在。"),
    (has("tend to have high leverage"),
     "这张图说明新兴云公司杠杆普遍高。同样的租约，股权能承受的利率和交付延误更小。"),
    (has("openai as lessee"),
     "这张图是把 OpenAI 列为租户的数据中心管道。问题是租户集中，不是管道的个数。"),
    (has("key catalysts"),
     "这张图把投资节奏和人工智能前景当成催化剂。软银能否守住自己设的贷款价值比上限，取决于 Arm 的股价。"),
    (has("investment headroom"),
     "这张图是软银在碰到自设杠杆上限之前还剩的投资空间。空间还在，但组合更集中到 Arm 和 OpenAI。"),
    (has("b1-b3"),
     "这张图是传播行业高收益债的位置。Clear Channel 的利差略紧于 Charter 的无担保债，用来给新债找可比。"),
    (has("asic"),
     "这张图是定制芯片的份额、单价或订单。定制芯片在推理上抢份额，但卖方并不把它写成 GPU 绝对额的下降。"),
    (one_of('gross-margin', 'gross margin'),
     "这张图看毛利率。CPU 组合近端支撑利润，新平台放量时可能先稀释，规模上来之后再修复。"),
    (has("asp"),
     "这张图是单价。存储涨价和更高规格会进到整机或芯片的售价里，而不只停在零部件。"),
]


def caption(q, ctx, n):
    # 只用图题来归类。正文里随口出现的词（例如 Vera Rubin）不该把别的图抢走。
    blob = q.lower()
    for test, sentence in RULES:
        try:
            ok = test(blob)
        except Exception:
            ok = False
        if ok:
            if n > 1 and sentence.startswith("这张图"):
                sentence = lead(n) + sentence[3:]
            return sentence
    return fallback(q, ctx, n)


def fallback(q, ctx, n):
    L = lead(n)
    ql = q.lower()
    if "valuation" in ql or "p/e" in ql or "multiple" in ql:
        return f"{L}把估值倍数和增长或同行放在一起，用来说明当前价格对应的是哪一段预期，而不是单独给一个目标价。"
    if "capex" in ql or "capital spending" in ql or "capital expenditure" in ql:
        return f"{L}把资本开支按年份或按公司摊开。要回答的是开支还在不在抬，以及抬上去之后谁在承担。"
    if "share" in ql:
        return f"{L}看的是份额。问题换成谁拿走了供给或市场，而不是再报一个行业总量。"
    if "margin" in ql:
        return f"{L}看利润率。要分清的是规模上来之后利润留得住，还是被高阶或低毛利的业务稀释。"
    if "growth" in ql:
        return f"{L}把增速按路径画出来。一个季度的点回答不了后面几年还是不是这条斜率。"
    if "price" in ql or "performance" in ql:
        return f"{L}是价格或股价表现。卖方用它对照基本面，看下跌或上涨反映的是情绪还是经营数字。"
    if "mix" in ql or "breakdown" in ql:
        return f"{L}把结构拆开。一个总数会把高阶和普通、新业务和旧业务涂平。"
    if "capacity" in ql or "mw" in ql or "power" in ql:
        return f"{L}量的是产能或电力。要回答的是什么时候能用，而不是收入已经确认了多少。"
    if "eps" in ql or "estimate" in ql or "guidance" in ql:
        return f"{L}把每股收益或这一期的估计摊开。要看的是卖方改了哪一个数，以及这个数离公司自己的说法还有多远。"
    if "lease" in ql or "obligation" in ql or "financing" in ql or "debt" in ql:
        return f"{L}把租赁、债务或还要融的钱单独列出来。开支可以很大，真正压到资产负债表上的是另一句话。"
    if "revenue" in ql:
        return f"{L}把收入按来源或按年份拆开。要回答的是增长落在哪一块，而不是只留一个总增速。"
    if "demand" in ql or "usage" in ql or "adoption" in ql:
        return f"{L}看使用或需求还在不在加快。放缓被拿来判断是规模已经很大，还是需求本身转弱。"
    if "cost" in ql:
        return f"{L}拆成本。总投资、租金和设备折旧分开之后，才知道公司账上要记的是哪一部分。"
    if "supply" in ql:
        return f"{L}看供给紧不紧。卖方用它判断价格和份额，而不是先假定需求已经断了。"
    if ctx and "we expect" in ctx.lower():
        return f"{L}把卖方在这一节里的预期单独画出来，用来支持正文里「我们预计」的那一句，而不是再给一个没有口径的总数。"
    return f"{L}把这个口径单独摆出来。原文用它回答一个具体问题，避免和别的指标混成一个数。"


def main():
    # 按公司分节，顺序与原先一致
    order = [
        ("UBS", "瑞银"),
        ("JP_Morgan", "摩根大通"),
        ("Barclays", "巴克莱"),
        ("Bloomberg_Intelligence", "彭博行业研究"),
    ]
    buckets = {k: [] for k, _ in order}
    nfig = 0
    for g in GROUPS:
        house = g["items"][0]["img"].split("/")[1]
        text = caption(g["qs"], g["ctx"], g["n"])
        buckets.setdefault(house, []).append((g, text))
        nfig += g["n"]
    parts = [CSS.replace("COUNT", str(nfig))]
    for key, title in order:
        rows = buckets.get(key) or []
        if not rows:
            continue
        count = sum(g["n"] for g, _ in rows)
        parts.append(f"<h2>{title}　{count}</h2>\n")
        for g, text in rows:
            for it in g["items"]:
                src = html.escape(it["source"])
                author = html.escape(it["author"])
                img = html.escape(it["img"])
                parts.append(
                    "<figure>\n"
                    f'<img src="{img}" alt="">\n'
                    f'<figcaption><span class="point">{html.escape(text)}</span>'
                    f"<br>来源：{src}<br>作者：{author}</figcaption>\n"
                    "</figure>\n"
                )
    parts.append("</body></html>\n")
    OUT.write_text("".join(parts), encoding="utf-8")
    print("figures", nfig, "groups", len(GROUPS), "html", OUT)


if __name__ == "__main__":
    main()
