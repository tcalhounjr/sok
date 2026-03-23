/**
 * generate-articles.js
 *
 * Generates the expanded articles.json (~750 total articles) for the søk seed corpus.
 * Run once: node generate-articles.js
 * Output: articles.json (overwrites existing file)
 *
 * Domain coverage:
 *   Domain A — EV & Clean Energy (keywords: EV, electric vehicle, battery, lithium, zero emission, clean energy)
 *   Domain B — Semiconductor & Supply Chain (keywords: semiconductor, chip, TSMC, supply chain, export controls, foundry)
 *   Domain C — AI Regulation (keywords: AI regulation, AI Act, artificial intelligence, AI governance, FTC, machine learning)
 *
 * All 12 sources and 8 authors are used. Topic IDs match the existing top-001..top-015 set.
 * Sentiment distribution: ~35% NEGATIVE, ~40% NEUTRAL, ~25% POSITIVE (realistic media corpus).
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Reference data — must match what already exists in articles.json
// ---------------------------------------------------------------------------

const sources = [
  { id: 'src-001', name: 'Reuters',                 domain: 'reuters.com' },
  { id: 'src-002', name: 'Financial Times',          domain: 'ft.com' },
  { id: 'src-003', name: 'Bloomberg',                domain: 'bloomberg.com' },
  { id: 'src-004', name: 'Nikkei Asia',              domain: 'asia.nikkei.com' },
  { id: 'src-005', name: 'The Economist',            domain: 'economist.com' },
  { id: 'src-006', name: 'TechCrunch',               domain: 'techcrunch.com' },
  { id: 'src-007', name: 'Wired',                    domain: 'wired.com' },
  { id: 'src-008', name: 'South China Morning Post', domain: 'scmp.com' },
  { id: 'src-009', name: 'Der Spiegel',              domain: 'spiegel.de' },
  { id: 'src-010', name: 'Le Monde',                 domain: 'lemonde.fr' },
  { id: 'src-011', name: 'Politico',                 domain: 'politico.com' },
  { id: 'src-012', name: 'The Verge',                domain: 'theverge.com' },
];

const authors = [
  { id: 'aut-001', name: 'Sarah Chen',    byline: 'Senior Correspondent, Technology' },
  { id: 'aut-002', name: 'Marcus Webb',   byline: 'Energy & Policy Editor' },
  { id: 'aut-003', name: 'Yuki Tanaka',   byline: 'Asia Markets Correspondent' },
  { id: 'aut-004', name: 'Elena Kovacs',  byline: 'AI & Regulation Reporter' },
  { id: 'aut-005', name: 'James Okafor',  byline: 'Supply Chain Analyst' },
  { id: 'aut-006', name: 'Priya Mehta',   byline: 'Clean Energy Correspondent' },
  { id: 'aut-007', name: 'Thomas Brandt', byline: 'Semiconductor Industry Reporter' },
  { id: 'aut-008', name: 'Chloe Dupont',  byline: 'EU Policy Correspondent' },
];

const topics = [
  { id: 'top-001', label: 'EV Policy',           category: 'Policy' },
  { id: 'top-002', label: 'Legislation',          category: 'Policy' },
  { id: 'top-003', label: 'Automotive',           category: 'Industry' },
  { id: 'top-004', label: 'Battery Technology',   category: 'Technology' },
  { id: 'top-005', label: 'Lithium Supply',       category: 'Supply Chain' },
  { id: 'top-006', label: 'Semiconductor',        category: 'Technology' },
  { id: 'top-007', label: 'Supply Chain',         category: 'Supply Chain' },
  { id: 'top-008', label: 'Geopolitics',          category: 'Politics' },
  { id: 'top-009', label: 'AI Regulation',        category: 'Policy' },
  { id: 'top-010', label: 'Data Privacy',         category: 'Policy' },
  { id: 'top-011', label: 'Machine Learning',     category: 'Technology' },
  { id: 'top-012', label: 'Trade War',            category: 'Politics' },
  { id: 'top-013', label: 'Export Controls',      category: 'Policy' },
  { id: 'top-014', label: 'Climate Change',       category: 'Environment' },
  { id: 'top-015', label: 'Renewable Energy',     category: 'Energy' },
];

// ---------------------------------------------------------------------------
// Article templates — (headline, body, topicIds, sentimentBias, sourceBias)
// Each template is a factory function parameterised by a counter index.
// ---------------------------------------------------------------------------

const SENTIMENTS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];

// Weighted sentiment selector — 25% POS, 40% NEU, 35% NEG
function pickSentiment(seed) {
  const v = seed % 20;
  if (v < 5)  return 'POSITIVE';
  if (v < 13) return 'NEUTRAL';
  return 'NEGATIVE';
}

// Deterministic selection from array using index
function pick(arr, i) { return arr[i % arr.length]; }

// Date cycling: spread articles across Oct-Nov 2025 (62 days)
function pickDate(i) {
  const base = new Date('2025-10-01');
  base.setDate(base.getDate() + (i % 62));
  return base.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Domain A: EV & Clean Energy templates
// ---------------------------------------------------------------------------

const evTemplates = [
  (i) => ({
    headline: `${pick(['Norway','Netherlands','UK','Germany','France','Sweden','Canada','Australia','India','South Korea'], i)} Sets ${2027 + (i % 8)} Zero-Emission Vehicle Deadline for New Car Sales`,
    body: `${pick(['Norway','Netherlands','UK','Germany','France','Sweden','Canada','Australia','India','South Korea'], i)} announced a binding deadline of ${2027 + (i % 8)} for all new passenger car sales to be zero-emission vehicles, citing accelerating climate commitments and the falling cost of electric vehicle technology. The government will provide transition subsidies for lower-income households and fund expansion of the national charging network. Automakers operating in the market said the timeline is achievable given current product roadmaps.`,
    topicIds: ['top-001', 'top-002', 'top-003', 'top-014'],
    authorId: pick(['aut-002', 'aut-006', 'aut-008'], i),
    sourceId: pick(['src-001', 'src-002', 'src-011'], i),
  }),
  (i) => ({
    headline: `EV Charging Network Operator Reports ${30 + (i % 40)} Percent Uptime Improvement After Grid Upgrade`,
    body: `A major electric vehicle charging network operator reported a ${30 + (i % 40)} percent improvement in station uptime following a comprehensive grid infrastructure upgrade program. The operator cited outdated transformer capacity as the primary source of previous reliability failures. The improvement is expected to reduce range anxiety among potential EV adopters in suburban and rural corridors where the network is concentrated.`,
    topicIds: ['top-001', 'top-003', 'top-015'],
    authorId: pick(['aut-006', 'aut-002'], i),
    sourceId: pick(['src-001', 'src-003', 'src-012'], i),
  }),
  (i) => ({
    headline: `Lithium-Ion Battery Costs Fall to $${70 + (i % 50)} per kWh, Approaching EV-ICE Price Parity`,
    body: `Battery pack costs for lithium-ion cells fell to a record low of $${70 + (i % 50)} per kilowatt-hour according to BloombergNEF's annual survey, edging closer to the industry's $60 per kWh threshold widely regarded as the point of combustion-engine price parity at the vehicle level. The decline was driven by increased cathode manufacturing scale in China and improved cell chemistry. Analysts projected grid parity for mid-size sedans within two to three model year cycles.`,
    topicIds: ['top-004', 'top-005', 'top-001', 'top-003'],
    authorId: pick(['aut-006', 'aut-005'], i),
    sourceId: pick(['src-003', 'src-002'], i),
  }),
  (i) => ({
    headline: `${pick(['Tesla','Ford','GM','Stellantis','Hyundai','Kia','Rivian','Lucid','NIO','BYD'], i)} Reports ${pick(['Record','Strong','Disappointing','Muted','Surging'], i)} EV Deliveries for Q${1 + (i % 4)} 2025`,
    body: `${pick(['Tesla','Ford','GM','Stellantis','Hyundai','Kia','Rivian','Lucid','NIO','BYD'], i)} reported ${pick(['record','strong','below-consensus','muted','surging'], i)} electric vehicle deliveries for the ${pick(['first','second','third','fourth'], i)} quarter of 2025, reflecting ${pick(['robust consumer demand and expanded production capacity','ongoing supply chain challenges and softening consumer sentiment','strong fleet order momentum offsetting retail slowdown','aggressive pricing actions that boosted volume at the cost of margin'], i)}. The company ${pick(['raised','maintained','lowered'], i)} its full-year delivery guidance and highlighted progress on its next-generation platform.`,
    topicIds: ['top-001', 'top-003'],
    authorId: pick(['aut-002', 'aut-003', 'aut-006'], i),
    sourceId: pick(['src-001', 'src-003', 'src-004'], i),
  }),
  (i) => ({
    headline: `Cobalt-Free Battery Chemistry Achieves Commercial Viability in ${pick(['South Korea','Japan','China','Germany','US'], i)}`,
    body: `Researchers at a ${pick(['South Korean','Japanese','Chinese','German','American'], i)} national laboratory announced that a cobalt-free lithium-iron-phosphate cathode formulation has achieved commercial viability at scale, matching the energy density of conventional NMC cells while eliminating supply chain exposure to cobalt sourced from the Democratic Republic of Congo. The development is expected to reduce both cost and ESG risk for EV battery manufacturers. Several automakers confirmed active qualification programs for the new chemistry.`,
    topicIds: ['top-004', 'top-005', 'top-007', 'top-001'],
    authorId: pick(['aut-001', 'aut-006', 'aut-003'], i),
    sourceId: pick(['src-004', 'src-007', 'src-003'], i),
  }),
  (i) => ({
    headline: `Grid-Scale Battery Storage Deployment Hits Record ${10 + (i % 90)} GWh in ${pick(['US','EU','India','China','Australia'], i)}`,
    body: `Grid-scale battery storage deployments reached a record ${10 + (i % 90)} gigawatt-hours in ${pick(['the United States','the European Union','India','China','Australia'], i)} during the first half of 2025, driven by falling lithium-iron-phosphate cell costs and policy incentives tied to renewable energy integration. Utility operators cited the storage deployments as critical enablers of higher solar penetration on grids where curtailment rates had previously limited clean energy expansion.`,
    topicIds: ['top-015', 'top-004', 'top-014'],
    authorId: pick(['aut-006', 'aut-002'], i),
    sourceId: pick(['src-001', 'src-002', 'src-005'], i),
  }),
  (i) => ({
    headline: `${pick(['US DOE','EU Commission','Japanese METI','Korean MOTIE','Australian ARENA'], i)} Launches $${200 + (i % 800)}M EV Manufacturing Grant Program`,
    body: `${pick(['The US Department of Energy','The European Commission','Japan\'s Ministry of Economy Trade and Industry','South Korea\'s Ministry of Trade Industry and Energy','The Australian Renewable Energy Agency'], i)} announced a $${200 + (i % 800)} million grant program targeting electric vehicle component manufacturing, with priority given to battery cell production and electric motor assembly. The program requires domestic content thresholds of ${40 + (i % 30)} percent and environmental review compliance. Industry groups welcomed the funding but called for streamlined permitting to allow faster facility construction.`,
    topicIds: ['top-001', 'top-002', 'top-003', 'top-005'],
    authorId: pick(['aut-002', 'aut-008'], i),
    sourceId: pick(['src-001', 'src-011', 'src-002'], i),
  }),
  (i) => ({
    headline: `Solid-State Battery Startup Raises $${100 + (i % 500)}M Series ${pick(['C','D','E'], i)} as Commercialization Race Intensifies`,
    body: `A solid-state battery startup raised $${100 + (i % 500)} million in a Series ${pick(['C','D','E'], i)} financing round led by ${pick(['a major automaker','a sovereign wealth fund','a leading battery manufacturer','a climate tech investor'], i)}, valuing the company at over $${1 + (i % 5)} billion. The company claims its semi-solid cell architecture can reach commercial production by ${2026 + (i % 3)} without the manufacturing process challenges that have stalled competitors. Automotive OEM customers are expected to begin qualification testing by year-end.`,
    topicIds: ['top-004', 'top-001', 'top-003'],
    authorId: pick(['aut-001', 'aut-006'], i),
    sourceId: pick(['src-006', 'src-003', 'src-007'], i),
  }),
  (i) => ({
    headline: `EV Charging Anxiety Persists Despite Network Expansion, Survey Shows`,
    body: `A consumer survey by J.D. Power found that range and charging anxiety remains the top barrier to electric vehicle adoption among non-EV owners, despite significant expansion of public charging networks. ${40 + (i % 30)} percent of respondents cited insufficient charging at destinations as a primary concern, unchanged from the prior year survey. EV owners, by contrast, rated their satisfaction with charging convenience at 8.${i % 9} out of 10, suggesting the gap between perception and reality remains wide.`,
    topicIds: ['top-001', 'top-003'],
    authorId: pick(['aut-002', 'aut-006'], i),
    sourceId: pick(['src-001', 'src-012'], i),
  }),
  (i) => ({
    headline: `${pick(['Nickel','Manganese','Phosphate','Cobalt'], i)} Supply Contract Signed Between ${pick(['Indonesia','Philippines','South Africa','Morocco','DRC'], i)} and ${pick(['CATL','LG Energy','Panasonic','Samsung SDI'], i)}`,
    body: `${pick(['A major Indonesian nickel producer','A Philippine manganese miner','A South African phosphate company','A Moroccan mining conglomerate','A DRC cobalt extractor'], i)} signed a long-term supply agreement with ${pick(['CATL','LG Energy Solution','Panasonic Energy','Samsung SDI'], i)} for battery-grade materials. The contract, valued at approximately $${500 + (i % 2000)} million over ${5 + (i % 10)} years, reflects battery manufacturers' strategy of securing upstream mineral supply chains to protect against market volatility. Analysts noted the deal includes price adjustment mechanisms tied to spot market fluctuations.`,
    topicIds: ['top-005', 'top-004', 'top-007'],
    authorId: pick(['aut-005', 'aut-003'], i),
    sourceId: pick(['src-004', 'src-003'], i),
  }),
];

// ---------------------------------------------------------------------------
// Domain B: Semiconductor & Supply Chain templates
// ---------------------------------------------------------------------------

const chipTemplates = [
  (i) => ({
    headline: `${pick(['Intel','Samsung','TSMC','GlobalFoundries','UMC','Tower','SMIC'], i)} Announces $${3 + (i % 20)}B Fab Expansion in ${pick(['Arizona','Texas','Ohio','Dresden','Kumamoto','Singapore','Malaysia'], i)}`,
    body: `${pick(['Intel','Samsung Semiconductor','TSMC','GlobalFoundries','United Microelectronics','Tower Semiconductor','SMIC'], i)} announced a $${3 + (i % 20)} billion expansion of its ${pick(['advanced logic','memory','analog','mature node','advanced packaging'], i)} fabrication capacity in ${pick(['Arizona','Texas','Ohio','Dresden, Germany','Kumamoto, Japan','Singapore','Malaysia'], i)}. The investment is partly supported by government semiconductor incentive programs and is expected to create ${1000 + (i % 4000)} direct manufacturing jobs. Full production at the expanded facility is targeted for ${2026 + (i % 4)}.`,
    topicIds: ['top-006', 'top-007'],
    authorId: pick(['aut-007', 'aut-003', 'aut-001'], i),
    sourceId: pick(['src-003', 'src-004', 'src-001'], i),
  }),
  (i) => ({
    headline: `US Commerce Department Adds ${pick(['Five','Three','Seven','Four'], i)} Chinese Chip Firms to Export Control Entity List`,
    body: `The US Department of Commerce added ${pick(['five','three','seven','four'], i)} Chinese semiconductor firms to its Entity List, imposing licensing requirements on US exports of equipment, software, and technology to those entities. The designations target companies believed to be producing chips for military applications or circumventing prior export controls. China's Ministry of Commerce said the action violates WTO norms and reserved the right to take countermeasures.`,
    topicIds: ['top-006', 'top-013', 'top-008', 'top-012'],
    authorId: pick(['aut-007', 'aut-005', 'aut-008'], i),
    sourceId: pick(['src-001', 'src-011', 'src-005'], i),
  }),
  (i) => ({
    headline: `Advanced Packaging Becomes Key Competitive Frontier as Chiplet Architectures Go Mainstream`,
    body: `Advanced semiconductor packaging has emerged as the primary competitive frontier in the chip industry, as leading manufacturers increasingly rely on chiplet architectures and 3D integration to sidestep the slowing pace of transistor scaling. TSMC's CoWoS and Samsung's I-Cube packaging platforms are booked out ${12 + (i % 18)} months. The shift is creating new supply chain bottlenecks around interposers, through-silicon vias, and high-bandwidth memory components.`,
    topicIds: ['top-006', 'top-007', 'top-011'],
    authorId: pick(['aut-007', 'aut-001'], i),
    sourceId: pick(['src-004', 'src-007', 'src-003'], i),
  }),
  (i) => ({
    headline: `${pick(['EU','Japan','India','UK','Canada','Australia'], i)} Semiconductor Sovereignty Initiative Targets ${pick(['28nm','14nm','7nm','5nm'], i)} Domestic Production`,
    body: `${pick(['The European Union','Japan','India','The United Kingdom','Canada','Australia'], i)} announced a semiconductor sovereignty initiative targeting domestic production of ${pick(['28nm','14nm','7nm','5nm'], i)} process nodes by ${2028 + (i % 5)}, backed by $${1 + (i % 8)} billion in public funding. The program includes incentives for equipment suppliers, materials producers, and fabless design companies to establish or expand local operations. Industry analysts noted the target is achievable but will require sustained policy commitment across multiple parliamentary cycles.`,
    topicIds: ['top-006', 'top-013', 'top-002'],
    authorId: pick(['aut-008', 'aut-007'], i),
    sourceId: pick(['src-002', 'src-011', 'src-005'], i),
  }),
  (i) => ({
    headline: `Chip War Escalates as ${pick(['US','EU','Japan','Netherlands'], i)} Tightens ${pick(['EUV','DUV','DRAM','HBM','AI Chip'], i)} Export Restrictions`,
    body: `${pick(['The United States','The European Union','Japan','The Netherlands'], i)} tightened export restrictions on ${pick(['extreme ultraviolet lithography equipment','deep ultraviolet lithography systems','advanced DRAM technology','high-bandwidth memory chips','AI accelerator chips'], i)}, extending controls to ${pick(['additional end-user categories','third-country resellers','cloud computing applications','emerging economy nations'], i)}. The action was coordinated with allied governments and represents the ${pick(['most significant','latest in a series of','a substantial'], i)} escalation in technology export controls since the onset of US-China tech competition. Beijing described the move as economic coercion.`,
    topicIds: ['top-006', 'top-013', 'top-012', 'top-008'],
    authorId: pick(['aut-007', 'aut-008', 'aut-005'], i),
    sourceId: pick(['src-001', 'src-005', 'src-002'], i),
  }),
  (i) => ({
    headline: `Memory Chip Prices ${pick(['Surge','Recover','Stabilize','Slip Again'], i)} as AI Server Demand ${pick(['Overwhelms','Absorbs','Balances Out','Outpaces'], i)} Inventory Overhang`,
    body: `DRAM and NAND memory chip prices ${pick(['surged','recovered sharply','stabilized','slipped for a second consecutive quarter'], i)} as AI server demand ${pick(['overwhelmed the inventory overhang that had depressed prices since 2023','absorbed excess inventory faster than analysts anticipated','balanced against ongoing PC and smartphone weakness','outpaced the recovery in consumer electronics demand'], i)}. Samsung and SK Hynix both upgraded their revenue guidance, while Micron cited AI memory as the primary growth driver in its latest earnings call. The cycle upturn has improved utilization rates at all major memory fabs.`,
    topicIds: ['top-006', 'top-011', 'top-007'],
    authorId: pick(['aut-007', 'aut-003'], i),
    sourceId: pick(['src-003', 'src-004', 'src-002'], i),
  }),
  (i) => ({
    headline: `RISC-V Architecture Gains Ground as ${pick(['China','India','EU','Latin America'], i)} Seeks US-Independent Chip Designs`,
    body: `The open-source RISC-V instruction set architecture is gaining significant traction as ${pick(['Chinese chipmakers seeking to avoid US export controls','Indian semiconductor startups building government-backed processors','European companies pursuing strategic autonomy','Latin American nations developing indigenous computing infrastructure'], i)} adopt the standard as an alternative to ARM and x86. The RISC-V International consortium reported a ${50 + (i % 100)} percent increase in member companies year-over-year. Hardware security researchers noted that the open architecture requires careful auditing to avoid supply chain vulnerabilities.`,
    topicIds: ['top-006', 'top-013', 'top-008'],
    authorId: pick(['aut-001', 'aut-007'], i),
    sourceId: pick(['src-007', 'src-008', 'src-006'], i),
  }),
  (i) => ({
    headline: `Semiconductor Equipment Spending Projected to Hit $${90 + (i % 60)}B in 2025 as AI Buildout Continues`,
    body: `Global semiconductor capital equipment spending is projected to reach $${90 + (i % 60)} billion in 2025, according to SEMI's latest forecast, driven by AI infrastructure investment and continued fab expansion in the US and Japan. ASML, Applied Materials, and Lam Research are all guiding for record revenues. The spending surge is creating lead time pressures across the equipment supply chain, with some sub-components facing 18-month delivery queues.`,
    topicIds: ['top-006', 'top-007', 'top-011'],
    authorId: pick(['aut-007', 'aut-001'], i),
    sourceId: pick(['src-003', 'src-002', 'src-004'], i),
  }),
  (i) => ({
    headline: `${pick(['Taiwan','South Korea','Japan','Malaysia','Vietnam'], i)} Wafer Fab Hit by ${pick(['Power Outage','Water Supply Issue','Earthquake Impact','Labor Dispute','Equipment Failure'], i)}, Chip Deliveries Delayed`,
    body: `A semiconductor wafer fabrication facility in ${pick(['Taiwan','South Korea','Japan','Malaysia','Vietnam'], i)} experienced a ${pick(['major power outage','water supply disruption','minor seismic event','labor dispute','critical equipment failure'], i)} that forced a temporary production halt, delaying chip deliveries by ${2 + (i % 8)} weeks. The incident highlighted the concentration risk in global semiconductor manufacturing geography. Customers in the automotive and industrial sectors, which operate on lean inventories, were most immediately affected. The fab operator said full production would resume within ${1 + (i % 4)} weeks.`,
    topicIds: ['top-006', 'top-007'],
    authorId: pick(['aut-003', 'aut-007', 'aut-005'], i),
    sourceId: pick(['src-004', 'src-001', 'src-003'], i),
  }),
  (i) => ({
    headline: `${pick(['Qualcomm','MediaTek','AMD','Arm','Broadcom'], i)} Unveils Next-Generation ${pick(['Mobile','PC','Data Center','Automotive','IoT'], i)} Chip With ${20 + (i % 60)} Percent Performance Uplift`,
    body: `${pick(['Qualcomm','MediaTek','AMD','Arm','Broadcom'], i)} unveiled its next-generation ${pick(['mobile application','personal computer','data center inference','automotive-grade','IoT edge'], i)} processor, claiming a ${20 + (i % 60)} percent performance improvement over its predecessor with ${10 + (i % 30)} percent lower power consumption. The chip is manufactured on TSMC's ${pick(['3nm','4nm','5nm','N3E'], i)} process and incorporates ${pick(['dedicated neural processing units','advanced security enclave improvements','enhanced memory bandwidth controllers','integrated AI accelerator clusters'], i)}. Volume shipments are targeted for Q${1 + (i % 4)} ${2025 + (i % 2)}.`,
    topicIds: ['top-006', 'top-011'],
    authorId: pick(['aut-001', 'aut-007'], i),
    sourceId: pick(['src-012', 'src-007', 'src-006'], i),
  }),
];

// ---------------------------------------------------------------------------
// Domain C: AI Regulation templates
// ---------------------------------------------------------------------------

const aiTemplates = [
  (i) => ({
    headline: `${pick(['US Senate','US House','EU Parliament','UK Parliament','Canadian Parliament','Australian Senate'], i)} Advances ${pick(['Comprehensive AI Safety','Algorithmic Accountability','AI Liability','AI Transparency','Responsible AI'], i)} Bill`,
    body: `${pick(['The US Senate Commerce Committee','The US House Energy and Commerce Committee','The European Parliament\'s IMCO Committee','The UK Parliament\'s Science and Technology Committee','The Canadian Parliament\'s Standing Committee on Industry','The Australian Senate Select Committee on AI'], i)} advanced a ${pick(['comprehensive AI safety','algorithmic accountability','AI developer liability','AI system transparency','responsible AI deployment'], i)} bill, setting the stage for a floor vote in ${pick(['September','October','November','early 2026'], i)}. The legislation would ${pick(['require pre-deployment safety evaluations for frontier AI models','mandate algorithmic impact assessments for hiring and lending systems','establish a private right of action for harms caused by AI systems','require plain-language disclosure of AI involvement in consumer-facing decisions','create a federal AI certification program for high-risk applications'], i)}. Technology companies have lobbied extensively against several provisions.`,
    topicIds: ['top-009', 'top-002', 'top-010'],
    authorId: pick(['aut-004', 'aut-008'], i),
    sourceId: pick(['src-011', 'src-002', 'src-001'], i),
  }),
  (i) => ({
    headline: `${pick(['OpenAI','Google DeepMind','Anthropic','Meta AI','Microsoft Azure AI','Amazon Bedrock'], i)} Publishes Updated Safety ${pick(['Framework','Policy','Commitments','Report','Card'], i)}`,
    body: `${pick(['OpenAI','Google DeepMind','Anthropic','Meta AI','Microsoft Azure AI','Amazon Bedrock'], i)} published an updated AI safety ${pick(['framework','policy document','voluntary commitments','transparency report','evaluation scorecard'], i)}, outlining ${pick(['red-teaming procedures for frontier models','expanded capability evaluation benchmarks','third-party audit mechanisms for high-risk deployments','incident reporting protocols for AI failures in production','new measures for detecting model misuse and harmful output'], i)}. Safety researchers offered a mixed assessment, praising the increased specificity while noting that ${pick(['third-party verification mechanisms remain inadequate','key metrics are defined by the company itself','the commitments are voluntary and unenforceable','public release of evaluation data is still limited'], i)}.`,
    topicIds: ['top-009', 'top-011', 'top-010'],
    authorId: pick(['aut-004', 'aut-001'], i),
    sourceId: pick(['src-007', 'src-006', 'src-012'], i),
  }),
  (i) => ({
    headline: `AI Governance Gap Widens as Frontier Model Capabilities Outpace Regulatory Frameworks`,
    body: `A joint analysis by the RAND Corporation and the Center for AI Safety found that frontier AI model capabilities are advancing significantly faster than the regulatory frameworks being developed to govern them, creating a widening governance gap. The report found that ${pick(['multimodal reasoning capabilities','autonomous agent behaviors','biological knowledge elicitation risks','cyberoffense capabilities'], i)} have advanced beyond the scope of current legislative proposals in all major jurisdictions. The authors called for emergency rulemaking procedures and pre-legislative regulatory sandboxes.`,
    topicIds: ['top-009', 'top-011', 'top-002'],
    authorId: pick(['aut-004', 'aut-008'], i),
    sourceId: pick(['src-005', 'src-007', 'src-002'], i),
  }),
  (i) => ({
    headline: `${pick(['China','Singapore','UAE','UK','Japan','Canada'], i)} Launches ${pick(['National AI Safety Institute','AI Regulatory Sandbox','AI Standards Body','AI Governance Framework','AI Audit Regime'], i)}`,
    body: `${pick(['China','Singapore','The United Arab Emirates','The United Kingdom','Japan','Canada'], i)} launched a ${pick(['national AI safety institute','regulatory sandbox for AI applications in financial services','national AI standards development body','comprehensive AI governance framework','mandatory AI audit regime for public sector deployments'], i)}, signaling ${pick(['an assertive approach to domestic AI governance','a pragmatic test-and-learn regulatory philosophy','a bid for international standard-setting influence','alignment with the EU AI Act model','an industry-friendly approach designed to attract AI investment'], i)}. The initiative is backed by ${pick(['government funding of $','$','¥','£','S$'], i)}${50 + (i % 500)} million and is expected to produce its first ${pick(['guidelines','standards','audit reports','compliance frameworks'], i)} within ${6 + (i % 18)} months.`,
    topicIds: ['top-009', 'top-002', 'top-008'],
    authorId: pick(['aut-004', 'aut-008', 'aut-003'], i),
    sourceId: pick(['src-008', 'src-002', 'src-004'], i),
  }),
  (i) => ({
    headline: `FTC Targets ${pick(['Generative AI Marketing Claims','AI Hiring Tools','AI Credit Scoring','AI Healthcare Diagnostics','AI Pricing Algorithms'], i)} in Enforcement Sweep`,
    body: `The Federal Trade Commission launched a targeted enforcement action against ${pick(['generative AI companies making unsubstantiated accuracy claims in marketing materials','vendors of AI-powered hiring screening tools','providers of AI credit scoring systems used in consumer lending','developers of AI diagnostic tools deployed in emergency departments','operators of AI dynamic pricing algorithms in consumer markets'], i)}, alleging violations of Section 5 of the FTC Act. The agency issued civil investigative demands to ${3 + (i % 7)} companies and said it is considering rulemaking to establish sector-wide standards. Industry groups said the action creates significant legal uncertainty for AI deployment across the economy.`,
    topicIds: ['top-009', 'top-010', 'top-002', 'top-011'],
    authorId: pick(['aut-004', 'aut-002'], i),
    sourceId: pick(['src-011', 'src-006', 'src-001'], i),
  }),
  (i) => ({
    headline: `Large Language Model Benchmark Results Questioned as ${pick(['Contamination','Gaming','Overfitting','Cherry-Picking'], i)} Concerns Mount`,
    body: `AI safety researchers published evidence that benchmark contamination — the inadvertent inclusion of benchmark test data in training sets — is undermining the validity of major large language model evaluation frameworks. The study found that ${pick(['performance on contaminated benchmarks','score inflation','leaderboard gaming behavior','benchmark overfitting'], i)} correlates strongly with training data recency and breadth, suggesting published scores overstate actual capability generalization. Several leading AI labs acknowledged the concern and said they are adopting new held-out evaluation protocols.`,
    topicIds: ['top-011', 'top-009'],
    authorId: pick(['aut-004', 'aut-001'], i),
    sourceId: pick(['src-007', 'src-006', 'src-012'], i),
  }),
  (i) => ({
    headline: `EU AI Act High-Risk Classification Triggers Compliance Sprint at ${pick(['Banks','Hospitals','Insurers','Retailers','Employers'], i)}`,
    body: `The EU AI Act's high-risk classification for AI systems used in ${pick(['credit scoring and loan origination','clinical decision support and triage','insurance underwriting and claims','consumer behavioral profiling','hiring screening and performance evaluation'], i)} has triggered an intensive compliance sprint across the ${pick(['European banking','hospital and health system','insurance','retail','human resources'], i)} sector. Compliance officers estimate the conformity assessment process — including documentation, human oversight protocols, and post-market monitoring — will require six to eighteen months per system. Smaller organizations warned they may need to discontinue use of affected AI tools rather than bear compliance costs.`,
    topicIds: ['top-009', 'top-002', 'top-010', 'top-008'],
    authorId: pick(['aut-008', 'aut-004'], i),
    sourceId: pick(['src-002', 'src-011', 'src-009'], i),
  }),
  (i) => ({
    headline: `AI-Generated Content Disclosure Laws Pass in ${pick(['California','New York','Texas','Illinois','Colorado'], i)}, Setting US State Precedent`,
    body: `${pick(['California','New York','Texas','Illinois','Colorado'], i)} enacted legislation requiring disclosure labels on AI-generated content in ${pick(['political advertising','journalism and news articles','social media posts with more than 10,000 followers','video and audio content distributed online','product reviews and ratings'], i)}, becoming the ${pick(['first','second','third'], i)} state to pass such a law. Opponents argued the law is vague and technically unenforceable, while supporters said it establishes an important consumer protection precedent. Federal legislators cited the state law as a model for a potential national standard.`,
    topicIds: ['top-009', 'top-010', 'top-002'],
    authorId: pick(['aut-004', 'aut-002'], i),
    sourceId: pick(['src-011', 'src-001'], i),
  }),
  (i) => ({
    headline: `${pick(['Microsoft','Google','Amazon','IBM','Salesforce','Oracle'], i)} Launches Enterprise AI ${pick(['Governance','Compliance','Audit','Safety','Transparency'], i)} Platform`,
    body: `${pick(['Microsoft','Google','Amazon','IBM','Salesforce','Oracle'], i)} launched an enterprise AI ${pick(['governance','compliance management','audit trail','safety evaluation','transparency reporting'], i)} platform, targeting organizations deploying AI in regulated industries. The product offers automated ${pick(['model documentation generation','bias and fairness testing','model card creation','regulatory mapping to EU AI Act and NIST frameworks','decision audit logging for explainability requirements'], i)}. The company priced the platform at $${2 + (i % 20)} per user per month for enterprise licenses. Analysts described it as an early-mover attempt to capture the growing AI compliance infrastructure market.`,
    topicIds: ['top-009', 'top-011', 'top-010'],
    authorId: pick(['aut-001', 'aut-004'], i),
    sourceId: pick(['src-006', 'src-012', 'src-007'], i),
  }),
  (i) => ({
    headline: `AI Safety Summit Produces ${pick(['Landmark','Cautiously Positive','Underwhelming','Contested'], i)} Seoul Declaration on Frontier AI Risk`,
    body: `The second international AI safety summit in Seoul produced a ${pick(['landmark','cautiously welcomed','widely criticized as underwhelming','contested'], i)} declaration on frontier AI risk management, signed by ${20 + (i % 10)} nations. The declaration establishes a non-binding framework for national AI safety institutes to share pre-deployment evaluation results for frontier models and creates a joint incident reporting channel. China signed the declaration with a formal reservation on provisions related to export controls. Civil society groups called the voluntary nature of all commitments a significant weakness.`,
    topicIds: ['top-009', 'top-008', 'top-002', 'top-011'],
    authorId: pick(['aut-004', 'aut-008'], i),
    sourceId: pick(['src-005', 'src-002', 'src-001'], i),
  }),
];

// ---------------------------------------------------------------------------
// Cross-domain templates (appear in multiple search results — higher keyword density)
// ---------------------------------------------------------------------------

const crossDomainTemplates = [
  (i) => ({
    headline: `AI Models Accelerate Critical Mineral Discovery, Cutting Exploration Time by ${30 + (i % 50)} Percent`,
    body: `Researchers at ${pick(['MIT','Stanford','ETH Zurich','Oxford','KAIST'], i)} demonstrated that machine learning models trained on geological survey data can identify high-probability critical mineral deposit locations with ${30 + (i % 50)} percent less exploration drilling. The approach combines satellite hyperspectral imagery, geophysical data, and historic drilling logs to generate probabilistic deposit maps. Mining companies have begun licensing the technology for lithium and rare earth prospecting in ${pick(['Nevada','Western Australia','Chile','Namibia'], i)}.`,
    topicIds: ['top-011', 'top-005', 'top-007', 'top-015'],
    authorId: pick(['aut-001', 'aut-005', 'aut-006'], i),
    sourceId: pick(['src-007', 'src-003', 'src-004'], i),
  }),
  (i) => ({
    headline: `${pick(['Energy','Automotive','Financial','Healthcare'], i)} Sector AI Adoption Hits ${30 + (i % 60)} Percent, Survey Finds`,
    body: `A McKinsey survey of ${500 + (i % 500)} ${pick(['energy and utilities','automotive and mobility','financial services','healthcare and life sciences'], i)} executives found that ${30 + (i % 60)} percent have deployed AI in at least one core business function, up from ${15 + (i % 30)} percent two years ago. ${pick(['Predictive maintenance and grid optimization','Supply chain forecasting and EV demand planning','Credit risk assessment and fraud detection','Clinical decision support and drug discovery'], i)} are the leading use cases. Executives cited data quality and regulatory uncertainty as the top barriers to broader deployment.`,
    topicIds: ['top-011', 'top-009', 'top-007'],
    authorId: pick(['aut-001', 'aut-004', 'aut-005'], i),
    sourceId: pick(['src-003', 'src-005', 'src-002'], i),
  }),
  (i) => ({
    headline: `Supply Chain Diversification Costs Estimated at $${500 + (i % 1500)}B as Firms Move Away from Single-Region Sourcing`,
    body: `A Boston Consulting Group analysis estimated the total cost of global supply chain diversification — the shift away from single-region sourcing toward friendshored and nearshored supply networks — at $${500 + (i % 1500)} billion over the next decade across semiconductor, EV battery, and consumer electronics industries. The analysis found that ${pick(['automotive','consumer electronics','industrial equipment','renewable energy'], i)} supply chains face the highest per-unit cost increases from diversification, while benefiting from improved resilience metrics. Governments subsidizing domestic manufacturing are bearing approximately ${20 + (i % 30)} percent of the total cost.`,
    topicIds: ['top-007', 'top-006', 'top-005', 'top-008'],
    authorId: pick(['aut-005', 'aut-007'], i),
    sourceId: pick(['src-003', 'src-002', 'src-005'], i),
  }),
  (i) => ({
    headline: `Climate Tech Investment Flows $${15 + (i % 85)}B Into ${pick(['Battery Storage','Clean Hydrogen','Carbon Capture','Smart Grid','EV Charging'], i)} in H1 2025`,
    body: `Climate technology investment in ${pick(['battery storage and grid-scale energy systems','green and blue hydrogen production infrastructure','direct air capture and carbon sequestration','smart grid management and demand response','EV charging networks and vehicle-to-grid systems'], i)} totaled $${15 + (i % 85)} billion in the first half of 2025, according to BloombergNEF. The inflow was ${pick(['20','35','15','50'], i)} percent above the comparable prior-year period, driven by ${pick(['US Inflation Reduction Act incentives','European Green Deal funding streams','Chinese state investment in clean energy','corporate net-zero commitments'], i)}. Analysts projected a record full-year total if second-half momentum is maintained.`,
    topicIds: ['top-015', 'top-014', 'top-004', 'top-001'],
    authorId: pick(['aut-006', 'aut-002'], i),
    sourceId: pick(['src-003', 'src-007', 'src-002'], i),
  }),
  (i) => ({
    headline: `Geopolitical Risk Premium Returns to ${pick(['Semiconductor','Lithium','Rare Earth','Cobalt'], i)} Markets as Tensions Escalate`,
    body: `A geopolitical risk premium has returned to ${pick(['semiconductor equipment and materials','lithium carbonate and hydroxide','rare earth oxide and metal','cobalt sulfate'], i)} markets following renewed ${pick(['US-China tensions over Taiwan','Russia-Ukraine conflict escalation','Middle East supply route disruptions','APAC territorial disputes'], i)}, according to commodity analysts. Spot prices rose ${5 + (i % 20)} percent in the week following the latest diplomatic incident. Procurement officers at automotive and electronics manufacturers said they are accelerating strategic inventory builds and multi-year supply contracts to reduce exposure.`,
    topicIds: ['top-008', 'top-012', 'top-007', 'top-006'],
    authorId: pick(['aut-005', 'aut-003', 'aut-008'], i),
    sourceId: pick(['src-003', 'src-004', 'src-005'], i),
  }),
];

// ---------------------------------------------------------------------------
// Article generation
// ---------------------------------------------------------------------------

// The 25 articles already in articles.json cover art-001..art-025
const EXISTING_COUNT = 25;
const TARGET_TOTAL   = 750;
const NEW_COUNT      = TARGET_TOTAL - EXISTING_COUNT;

const allTemplates = [...evTemplates, ...chipTemplates, ...aiTemplates, ...crossDomainTemplates];

function generateArticles() {
  const articles = [];

  for (let i = 0; i < NEW_COUNT; i++) {
    const artNum   = EXISTING_COUNT + i + 1;
    const id       = `art-${String(artNum).padStart(3, '0')}`;
    const template = allTemplates[i % allTemplates.length](i);
    const sentiment = pickSentiment(i);
    const date      = pickDate(i);

    // Slug from first 5 words of headline, lowercased, hyphened
    const slug = template.headline
      .split(' ').slice(0, 5).join('-')
      .toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');

    const src = sources.find(s => s.id === template.sourceId);

    articles.push({
      id,
      headline: template.headline,
      body:     template.body,
      url:      `https://${src.domain}/${slug}-${artNum}`,
      publishedAt: date,
      sentiment,
      sourceId: template.sourceId,
      authorId: template.authorId,
      topicIds: template.topicIds,
    });
  }

  return articles;
}

// ---------------------------------------------------------------------------
// Assemble and write output
// ---------------------------------------------------------------------------

// Read existing articles (the 25 hand-written ones)
import { readFileSync } from 'fs';
const existing = JSON.parse(readFileSync(join(__dirname, 'articles.json'), 'utf8'));

const newArticles = generateArticles();
const merged = {
  sources:  existing.sources,
  authors:  existing.authors,
  topics:   existing.topics,
  articles: [...existing.articles, ...newArticles],
};

writeFileSync(
  join(__dirname, 'articles.json'),
  JSON.stringify(merged, null, 2),
  'utf8'
);

console.log(`Generated ${newArticles.length} new articles.`);
console.log(`Total articles: ${merged.articles.length}`);
console.log(`Written to: ${join(__dirname, 'articles.json')}`);
