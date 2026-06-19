const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  LevelFormat,
  PageNumber,
  PageBreak,
  TabStopType,
  TabStopPosition,
  Header,
  Footer,
  VerticalAlign,
} = require("docx");
const fs = require("fs");

const BRAND = "1A73E8";
const DARK = "1A1A2E";
const ACCENT = "E8F4FD";
const HEADING2_COLOR = "16213E";
const GRAY = "6B7280";
const GREEN = "059669";
const ORANGE = "D97706";
const RED = "DC2626";

const pageProps = {
  size: { width: 12240, height: 15840 },
  margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
};

// ── Helpers ────────────────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: BRAND, space: 4 },
    },
    children: [
      new TextRun({ text, bold: true, size: 36, color: DARK, font: "Arial" }),
    ],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28,
        color: HEADING2_COLOR,
        font: "Arial",
      }),
    ],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text, bold: true, size: 24, color: BRAND, font: "Arial" }),
    ],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })],
  });
}

function bullet(text, level = 0, color = DARK) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 21, font: "Arial", color })],
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 21, font: "Arial" })],
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
    indent: { left: 360 },
    children: [
      new TextRun({ text, font: "Courier New", size: 18, color: "1F2937" }),
    ],
  });
}

function note(text, type = "info") {
  const colors = { info: BRAND, warn: ORANGE, danger: RED, success: GREEN };
  const fills = {
    info: "EFF6FF",
    warn: "FFFBEB",
    danger: "FEF2F2",
    success: "F0FDF4",
  };
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    indent: { left: 360 },
    border: {
      left: {
        style: BorderStyle.THICK,
        size: 12,
        color: colors[type],
        space: 8,
      },
    },
    shading: { fill: fills[type], type: ShadingType.CLEAR },
    children: [new TextRun({ text, size: 20, font: "Arial", color: "1F2937" })],
  });
}

function spacer() {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun("")],
  });
}

function pagebreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" };
const allBorders = {
  top: cellBorder,
  bottom: cellBorder,
  left: cellBorder,
  right: cellBorder,
};

function headerCell(text, fill = "1E3A5F") {
  return new TableCell({
    borders: allBorders,
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    width: { size: 2340, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            size: 20,
            color: "FFFFFF",
            font: "Arial",
          }),
        ],
      }),
    ],
  });
}

function dataCell(text, fill = "FFFFFF") {
  return new TableCell({
    borders: allBorders,
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    width: { size: 2340, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 19, font: "Arial", color: DARK })],
      }),
    ],
  });
}

// ── Document ───────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: "\u25E6",
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "numbers",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: HEADING2_COLOR },
        paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: BRAND },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [
    {
      properties: { page: pageProps },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: {
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: BRAND,
                  space: 4,
                },
              },
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: "Kridaz Ads Platform",
                  bold: true,
                  size: 20,
                  color: BRAND,
                  font: "Arial",
                }),
                new TextRun({
                  text: "  |  Developer Implementation Guide",
                  size: 20,
                  color: GRAY,
                  font: "Arial",
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: {
                top: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: "D1D5DB",
                  space: 4,
                },
              },
              spacing: { before: 80 },
              tabStops: [{ type: TabStopType.RIGHT, position: 9000 }],
              children: [
                new TextRun({
                  text: "Confidential — Kridaz Engineering",
                  size: 18,
                  color: GRAY,
                  font: "Arial",
                }),
                new TextRun({
                  text: "\tPage ",
                  size: 18,
                  color: GRAY,
                  font: "Arial",
                }),
                new PageNumber({ size: 18, color: GRAY, font: "Arial" }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ── Cover ──────────────────────────────────────────────────────
        new Paragraph({
          spacing: { before: 1440, after: 240 },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "KRIDAZ",
              bold: true,
              size: 72,
              color: BRAND,
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "ADS PLATFORM",
              bold: true,
              size: 48,
              color: DARK,
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: "Complete Developer Implementation Guide",
              size: 28,
              color: GRAY,
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 480 },
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: BRAND,
              space: 8,
            },
          },
          children: [
            new TextRun({
              text: "Python (FastAPI) \u2022 PostgreSQL \u2022 Kafka \u2022 Redis \u2022 FAISS \u2022 ML Ranking",
              size: 22,
              color: GRAY,
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 320, after: 160 },
          children: [
            new TextRun({
              text: "Version 1.0  |  2025  |  Engineering Team",
              size: 20,
              color: GRAY,
              font: "Arial",
            }),
          ],
        }),

        pagebreak(),

        // ── 1. Overview ────────────────────────────────────────────────
        h1("1. Platform Overview"),
        p(
          "Kridaz Ads is an industry-grade programmatic advertising system embedded natively into the Kridaz sports social and booking platform. Its architecture is benchmarked against Meta Ads, Google Ads, LinkedIn Campaign Manager, and Twitter/X Ads."
        ),
        spacer(),
        p("The system enables three audiences simultaneously:"),
        bullet(
          "Users: see hyper-relevant ads for sports brands, turfs, academies, and tournaments seamlessly woven into their feed."
        ),
        bullet(
          "Advertisers: launch self-serve campaigns with CPC, CPM, or CPA bidding, real-time analytics, and granular sport/geo/interest targeting."
        ),
        bullet(
          "Kridaz: monetises every surface across the app through a second-price auction that maximises platform revenue while preserving user experience quality."
        ),
        spacer(),
        h2("1.1  Architecture Philosophy"),
        p(
          "The platform is deliberately modelled on production ad systems at scale. Key design decisions:"
        ),
        bullet(
          "Two-stage ranking: fast candidate retrieval (FAISS ANN + Redis filters) then expensive multi-signal scoring, replicating YouTube and Instagram's pipeline."
        ),
        bullet(
          "Event-driven: every ad interaction flows through Kafka, decoupling serving latency from analytics and billing processing."
        ),
        bullet(
          "ML-first: predicted CTR, collaborative filtering, and contextual bandits are first-class citizens, not afterthoughts."
        ),
        bullet(
          "Safety-first: automated moderation runs before any campaign goes live; fraud detection runs on every click."
        ),

        spacer(),
        h2("1.2  Target Latency SLAs"),
        new Table({
          width: { size: 9080, type: WidthType.DXA },
          columnWidths: [3500, 2800, 2780],
          rows: [
            new TableRow({
              children: [
                headerCell("Operation"),
                headerCell("P50 Target"),
                headerCell("P99 Target"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Ad serve endpoint"),
                dataCell("25 ms"),
                dataCell("80 ms"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Impression record"),
                dataCell("< 5 ms (async)"),
                dataCell("< 10 ms"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("FAISS ANN retrieval"),
                dataCell("5 ms"),
                dataCell("20 ms"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Full ML ranking (200 cands)"),
                dataCell("30 ms"),
                dataCell("60 ms"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Kafka event publish"),
                dataCell("< 5 ms (async)"),
                dataCell("< 15 ms"),
              ],
            }),
          ],
        }),
        spacer(),

        pagebreak(),

        // ── 2. Services ────────────────────────────────────────────────
        h1("2. Service Architecture"),
        p(
          "The platform is split into focused services. All communicate via HTTP (synchronous) or Kafka (asynchronous events). Start with a modular monolith and extract services as load demands."
        ),
        spacer(),
        h2("2.1  Service Map"),
        new Table({
          width: { size: 9080, type: WidthType.DXA },
          columnWidths: [2200, 2000, 2680, 2200],
          rows: [
            new TableRow({
              children: [
                headerCell("Service"),
                headerCell("Port"),
                headerCell("Responsibility"),
                headerCell("Key Tech"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("ads-service"),
                dataCell("8001"),
                dataCell(
                  "Ad serving, campaign CRUD, impression/click tracking, fraud check"
                ),
                dataCell("FastAPI, Redis"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("recommendation-service"),
                dataCell("8002"),
                dataCell(
                  "FAISS ANN retrieval, collaborative filter, embedding generation"
                ),
                dataCell("FAISS, numpy, scipy"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("analytics-service"),
                dataCell("8003"),
                dataCell(
                  "Kafka consumer, real-time counters, daily rollup, dashboard API"
                ),
                dataCell("aiokafka, Redis"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("moderation-service"),
                dataCell("8004"),
                dataCell(
                  "Automated screening, human review queue, violation management"
                ),
                dataCell("ML classifier"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("celery-worker"),
                dataCell("N/A"),
                dataCell(
                  "Async tasks: CTR model refresh, budget reset, fraud analysis"
                ),
                dataCell("Celery, Redis"),
              ],
            }),
          ],
        }),
        spacer(),

        h2("2.2  Data Flow Diagram"),
        p("Client App  ->  ads-service (/v1/ads/serve)"),
        p("  |-- [sync]  ->  Redis (frequency cap check, pCTR cache)"),
        p(
          "  |-- [sync]  ->  recommendation-service (FAISS + CF candidate retrieval)"
        ),
        p(
          "  |-- [sync]  ->  ML Ranking Engine (multi-signal score, eCPM, auction)"
        ),
        p("  |-- [sync]  ->  Fraud Detector (IP rate, dedup check)"),
        p(
          "  \\-- [async] ->  Kafka (ad_events topic: impression records, billing)"
        ),
        p(""),
        p(
          "Kafka (ad_events)  ->  analytics-service (real-time Redis counters)"
        ),
        p("                   ->  billing-service (spend deduction)"),
        p(
          "                   ->  ml-training pipeline (nightly CTR model retrain)"
        ),
        spacer(),

        pagebreak(),

        // ── 3. Ranking Engine ──────────────────────────────────────────
        h1("3. Ad Ranking Engine"),
        p(
          "The ranking engine is the core intelligence of the platform. It determines which ads are shown, to whom, on which surface, and in what order. It is comparable to Google's Quality Score system combined with Meta's relevance scoring."
        ),
        spacer(),

        h2("3.1  Two-Stage Pipeline"),
        h3("Stage 1: Candidate Retrieval (< 20 ms)"),
        p("Eliminates ineligible campaigns without expensive scoring. Checks:"),
        bullet("Campaign date is within start_date and end_date."),
        bullet(
          "Daily budget has not been exhausted (spent_today < daily_budget)."
        ),
        bullet(
          "Frequency caps: per-surface cap, per-campaign daily cap, global user ad exposure cap."
        ),
        bullet(
          "FAISS ANN: top-200 nearest neighbours to user embedding vector."
        ),
        bullet(
          "Collaborative filter: campaigns similar to user's engagement history."
        ),

        h3("Stage 2: Full Multi-Signal Scoring (< 60 ms)"),
        p(
          "Each candidate is scored on 8 signals, then combined using the weighted formula:"
        ),
        spacer(),
        code("final_score = 0.30 * relevance"),
        code("           + 0.20 * sport_match"),
        code("           + 0.15 * location_match"),
        code("           + 0.12 * predicted_CTR"),
        code("           + 0.10 * bid_value"),
        code("           + 0.07 * freshness"),
        code("           + 0.04 * budget_pacing"),
        code("           + 0.02 * quality_score"),
        code(""),
        code("effective_eCPM (CPC) = bid_amount * predicted_CTR * 1000"),
        code("effective_eCPM (CPM) = bid_amount"),
        code(
          "effective_eCPM (CPA) = bid_amount * pCTR * historical_CVR * 1000"
        ),
        spacer(),

        h2("3.2  Signal Definitions"),
        new Table({
          width: { size: 9080, type: WidthType.DXA },
          columnWidths: [1800, 3600, 3680],
          rows: [
            new TableRow({
              children: [
                headerCell("Signal"),
                headerCell("What It Measures"),
                headerCell("Industry Analogy"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("relevance_score"),
                dataCell(
                  "Jaccard similarity between user interest tags and ad targeting tags, boosted by engagement history."
                ),
                dataCell("Meta Ad Relevance Score"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("sport_match"),
                dataCell(
                  "Binary boost: 1.0 if user's sports match campaign target_sports, 0 otherwise."
                ),
                dataCell("LinkedIn Audience Match"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("location_match"),
                dataCell(
                  "Haversine distance decay. City match = 1.0; outside radius = 0.2."
                ),
                dataCell("Google Local Services Ads"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("predicted_CTR"),
                dataCell(
                  "Logistic regression model on user features + ad features. Replace with XGBoost in production."
                ),
                dataCell("Google pCTR model"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("bid_value"),
                dataCell(
                  "Normalised bid (0-1) against platform max bid. Prevents large bids dominating over relevance."
                ),
                dataCell("Google Ads bid adjustment"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("freshness"),
                dataCell(
                  "Exponential decay over campaign lifetime. New campaigns get a discovery boost."
                ),
                dataCell("YouTube upload freshness"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("budget_pacing"),
                dataCell(
                  "Remaining daily budget ratio. Throttles over-spending campaigns."
                ),
                dataCell("Google standard delivery pacing"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("quality_score"),
                dataCell(
                  "Admin-set or ML-derived creative quality score (0-1). Affects both ranking and cost."
                ),
                dataCell("Google Ads Quality Score"),
              ],
            }),
          ],
        }),
        spacer(),

        h2("3.3  Auction Mechanics"),
        p(
          "Kridaz uses a Vickrey (second-price) auction — the winner pays just above the second-highest eCPM bid, not their own maximum bid. This is the same system used by Google Ads and Meta Ads."
        ),
        spacer(),
        code(
          "winning_price = (second_highest_eCPM / quality_adjustment) + 0.01"
        ),
        spacer(),
        note(
          "IMPORTANT: Quality Score acts as a discount. An advertiser with quality_score=0.9 and bid=10 will beat an advertiser with quality_score=0.3 and bid=25, and pay less. This incentivises high-quality ads.",
          "info"
        ),
        spacer(),

        h2("3.4  Frequency Capping"),
        p("Frequency caps prevent ad fatigue and protect user experience:"),
        new Table({
          width: { size: 9080, type: WidthType.DXA },
          columnWidths: [3000, 2000, 2000, 2080],
          rows: [
            new TableRow({
              children: [
                headerCell("Surface"),
                headerCell("Per-Surface Cap"),
                headerCell("Per-Campaign Cap"),
                headerCell("Global User Cap"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Reels Feed"),
                dataCell("3 / 24h"),
                dataCell("10 / 24h"),
                dataCell("15 total / 24h"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Community Feed"),
                dataCell("2 / 24h"),
                dataCell("10 / 24h"),
                dataCell("15 total / 24h"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Story"),
                dataCell("2 / 24h"),
                dataCell("10 / 24h"),
                dataCell("15 total / 24h"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Push Notification"),
                dataCell("1 / 24h"),
                dataCell("3 / 24h"),
                dataCell("15 total / 24h"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("All others"),
                dataCell("5 / 24h"),
                dataCell("10 / 24h"),
                dataCell("15 total / 24h"),
              ],
            }),
          ],
        }),
        spacer(),

        pagebreak(),

        // ── 4. Recommendation Engine ──────────────────────────────────
        h1("4. Recommendation Engine"),
        p(
          "The recommendation engine is a hybrid system combining three approaches, similar to how Netflix, Instagram, and Spotify blend methods to find the right content for each user."
        ),
        spacer(),

        h2("4.1  Hybrid Architecture"),
        h3("Layer 1: Content-Based Filtering (FAISS)"),
        p(
          "Each user is represented as a 128-dimensional embedding vector encoding their sport preferences, interest tags, engagement history, age group, and city. Each ad campaign is represented as a 64-dimensional vector. FAISS performs Approximate Nearest Neighbour (ANN) search to find the most similar campaigns for a given user in milliseconds, even with hundreds of thousands of campaigns."
        ),
        spacer(),
        code("User Vector (128-dim):"),
        code(
          "  [cricket:1.0, football:0.8, badminton:0.0, ...,  <- sport dims"
        ),
        code(
          "   turf_booking:0.9, tournaments:0.6, ...,          <- interest dims"
        ),
        code(
          "   age_18_25:1.0, ...,                              <- demographic dims"
        ),
        code("   city_bucket_3:1.0, ...]                          <- geo dims"),
        spacer(),

        h3("Layer 2: Collaborative Filtering"),
        p(
          "Item-item collaborative filtering tracks co-engagement patterns: 'users who interacted with campaign A also interacted with campaign B'. This surfaces campaigns that share an audience but may not have strong semantic overlap with the user's explicit tags. Similar to Netflix's 'Because you watched...' engine."
        ),
        spacer(),

        h3("Layer 3: Epsilon-Greedy Contextual Bandit (Explore/Exploit)"),
        p(
          "15% of ad slots are reserved for exploration: showing newer campaigns with low impression counts to discover their true audience. This solves the cold-start problem for new advertisers and prevents the feed from becoming a closed echo chamber. Similar to Twitter's 'new tweet boost' and Spotify's Discovery Weekly seeding."
        ),
        spacer(),
        note(
          "TUNING: The epsilon value (0.15 = 15% exploration) can be adjusted. Higher epsilon = more new campaign discovery but slightly lower short-term CTR. Lower epsilon = better short-term CTR but new campaigns struggle to get visibility.",
          "warn"
        ),
        spacer(),

        h2("4.2  Embedding Strategy"),
        p(
          "In Phase 1, embeddings are hand-engineered from user profile data. In Phase 2, replace with learned embeddings:"
        ),
        bullet(
          "User embedding: train Word2Vec or a two-tower neural network on user activity sequences (views, bookings, community interactions)."
        ),
        bullet(
          "Ad embedding: encode ad creative text using BERT or a fine-tuned sports domain model."
        ),
        bullet(
          "The two-tower approach (separate user tower and item tower) is the production architecture used by YouTube, Pinterest, and LinkedIn."
        ),
        spacer(),

        h2("4.3  Candidate Merging Formula"),
        code("merged_score(campaign) = 0.65 * ANN_similarity"),
        code("                       + 0.35 * CF_co_engagement_score"),
        spacer(),
        p(
          "The ANN score is weighted higher because it directly encodes user preferences. The CF score complements it with social proof from similar users. After merging, the top-200 candidates proceed to the full ranking stage."
        ),
        spacer(),

        pagebreak(),

        // ── 5. Ad Surfaces ─────────────────────────────────────────────
        h1("5. Ad Surfaces & Placement Guide"),
        p(
          "Ads can appear on 11 surfaces across the Kridaz app. Each surface has a different user intent level, which is reflected in its surface_weight multiplier in the ranking formula."
        ),
        spacer(),
        new Table({
          width: { size: 9080, type: WidthType.DXA },
          columnWidths: [2200, 1600, 1600, 3680],
          rows: [
            new TableRow({
              children: [
                headerCell("Surface"),
                headerCell("Ad Format"),
                headerCell("Surface Weight"),
                headerCell("Integration Notes"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Reels Feed"),
                dataCell("Video (9:16)"),
                dataCell("1.0x"),
                dataCell(
                  "Insert after 4-6 organic reels, then every 8-12. Max 15s."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Community Feed"),
                dataCell("Image card"),
                dataCell("0.85x"),
                dataCell("Native card matching community post UI."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Story"),
                dataCell("Video / Image"),
                dataCell("0.90x"),
                dataCell(
                  "Full-screen between story cards. Tap-to-skip supported."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Search Results"),
                dataCell("Sponsored listing"),
                dataCell("1.10x"),
                dataCell("First 2 results marked 'Sponsored'. High intent."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Turf Search"),
                dataCell("Promoted turf card"),
                dataCell("1.20x"),
                dataCell("Highlighted card in turf discovery results."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Turf Detail"),
                dataCell("Banner + CTA"),
                dataCell("1.15x"),
                dataCell("Below turf hero image. Related turf or academy ad."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Booking Checkout"),
                dataCell("Cross-sell card"),
                dataCell("1.30x (highest)"),
                dataCell(
                  "'You might also like' section above payment. High conversion intent."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Booking Success"),
                dataCell("Recommendation"),
                dataCell("0.70x"),
                dataCell(
                  "Post-booking suggestions. Lower intent, used for brand awareness."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Home Banner"),
                dataCell("Rotating banner"),
                dataCell("0.75x"),
                dataCell("Static or carousel. Max 3 banners in rotation."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Push Notification"),
                dataCell("Text + deep link"),
                dataCell("0.65x"),
                dataCell("Opt-in only. 1 per day max. Personalised offer."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Tournament"),
                dataCell("Sponsor module"),
                dataCell("0.95x"),
                dataCell("Dedicated sponsor placement in tournament pages."),
              ],
            }),
          ],
        }),
        spacer(),

        h2("5.1  Client Integration"),
        p(
          "The Flutter client calls the serve endpoint with the surface context and renders the returned ad object:"
        ),
        spacer(),
        code("POST /v1/ads/serve"),
        code("{"),
        code('  "user_id": "uuid",'),
        code('  "surface": "reels_feed",'),
        code('  "sports_interests": ["cricket", "football"],'),
        code('  "lat": 17.385, "lng": 78.486,'),
        code('  "city": "Hyderabad",'),
        code('  "max_ads": 3'),
        code("}"),
        spacer(),
        p(
          "The response returns a list of ad objects with impression_id, media_url, cta_url, and surface. The client MUST fire the impression event as soon as the ad is visible in the viewport (not when the API responds), and the click event only when the user taps the CTA."
        ),
        spacer(),
        note(
          "CRITICAL: Never fire an impression event at API response time. Fire it only when the ad is actually rendered in the viewport. This ensures billing accuracy and prevents inflated impression counts.",
          "danger"
        ),
        spacer(),

        pagebreak(),

        // ── 6. Database ────────────────────────────────────────────────
        h1("6. Database Design"),
        spacer(),

        h2("6.1  Core Tables"),
        new Table({
          width: { size: 9080, type: WidthType.DXA },
          columnWidths: [2200, 1800, 2400, 2680],
          rows: [
            new TableRow({
              children: [
                headerCell("Table"),
                headerCell("Rows at Scale"),
                headerCell("Key Columns"),
                headerCell("Notes"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("advertisers"),
                dataCell("~10K"),
                dataCell(
                  "id, user_id, business_type, verified, credit_balance"
                ),
                dataCell("One-to-one with Kridaz user."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("ad_campaigns"),
                dataCell("~100K"),
                dataCell(
                  "status, bid_amount, bid_strategy, daily_budget, spent_today, surfaces[]"
                ),
                dataCell(
                  "Status index critical. surfaces[] enables surface filtering."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("ad_targeting"),
                dataCell("~100K"),
                dataCell("target_cities[], target_sports[], geo_center JSONB"),
                dataCell(
                  "One-to-one with campaign. PostGIS for radius queries."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("ad_impressions"),
                dataCell("~1B / year"),
                dataCell("campaign_id, user_id, surface, shown_at"),
                dataCell("PARTITION BY RANGE(shown_at). Monthly partitions."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("ad_clicks"),
                dataCell("~20M / year"),
                dataCell("campaign_id, impression_id, is_fraud, ip_address"),
                dataCell("impression_id index for attribution chain."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("ad_conversions"),
                dataCell("~2M / year"),
                dataCell(
                  "campaign_id, click_id, conversion_type, conversion_value"
                ),
                dataCell("30-day click attribution window."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("campaign_daily_spend"),
                dataCell("~36M / year"),
                dataCell(
                  "campaign_id, date, impressions, clicks, spend, avg_ctr"
                ),
                dataCell("Pre-aggregated by Celery beat. Powers dashboard."),
              ],
            }),
          ],
        }),
        spacer(),

        h2("6.2  Partitioning Strategy"),
        p(
          "The ad_impressions table will receive ~3M rows per day at 100K daily active users. Use PostgreSQL native partitioning:"
        ),
        bullet("Partition by RANGE(shown_at) with monthly child tables."),
        bullet("Drop partitions older than 24 months to control storage."),
        bullet("Use pg_partman extension to automate partition creation."),
        bullet(
          "For analytics queries spanning multiple months, consider migrating to TimescaleDB or ClickHouse."
        ),
        spacer(),

        h2("6.3  Critical Indexes"),
        code("-- Campaign lookup by status + dates (ad serving hot path)"),
        code("CREATE INDEX ix_campaigns_status_dates"),
        code("  ON ad_campaigns(status, start_date, end_date);"),
        code(""),
        code("-- Impression frequency cap check"),
        code("CREATE INDEX ix_impressions_user_shown"),
        code("  ON ad_impressions(user_id, shown_at);"),
        code(""),
        code("-- Attribution chain (click -> impression)"),
        code("CREATE INDEX ix_clicks_impression"),
        code("  ON ad_clicks(impression_id);"),
        spacer(),

        pagebreak(),

        // ── 7. Fraud Detection ────────────────────────────────────────
        h1("7. Fraud Detection System"),
        p(
          "Click fraud is a major threat to ad platform integrity. Kridaz implements multi-layer fraud detection inspired by Google's Traffic Quality team and Meta's Invalid Activity system."
        ),
        spacer(),

        h2("7.1  Detection Methods"),
        h3("Rate-Based Anomaly Detection"),
        p(
          "Redis sliding window counters track click velocity per user and per IP:"
        ),
        bullet("Maximum 10 clicks per user per minute (across all campaigns)."),
        bullet("Maximum 50 clicks per user per hour."),
        bullet("Maximum 30 clicks per IP per minute."),
        bullet(
          "Deduplication: same user + campaign click within 30 minutes = duplicate."
        ),
        spacer(),

        h3("Campaign CTR Anomaly"),
        p(
          "A scheduled Celery task runs every 4 hours analysing campaign-level CTR. Any campaign with a CTR above 50% (versus the platform average of ~2-3%) is flagged for human review. Click farms often target specific campaigns, causing an abnormally high CTR."
        ),
        spacer(),

        h3("IP Reputation"),
        p(
          "Flagged IPs are stored in Redis with a 24-hour TTL. On every ad serve request, the IP is checked against the flagged set. In production, integrate with commercial IP intelligence APIs (MaxMind, IPQualityScore)."
        ),
        spacer(),

        h2("7.2  Fraud Response Actions"),
        new Table({
          width: { size: 9080, type: WidthType.DXA },
          columnWidths: [2500, 2500, 2080, 2000],
          rows: [
            new TableRow({
              children: [
                headerCell("Signal"),
                headerCell("Threshold"),
                headerCell("Auto Action"),
                headerCell("Manual Action"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("User click rate"),
                dataCell("> 10/min"),
                dataCell("Block serve (429)"),
                dataCell("Review account"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("IP click rate"),
                dataCell("> 30/min"),
                dataCell("Flag IP (24h)"),
                dataCell("Review subnet"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Duplicate click"),
                dataCell("Same user+campaign 30min"),
                dataCell("Silently drop"),
                dataCell("None"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Campaign CTR"),
                dataCell("> 50%"),
                dataCell("Pause campaign"),
                dataCell("Review + refund"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("User report"),
                dataCell("> 10 unique reports"),
                dataCell("Auto-suspend"),
                dataCell("Human review"),
              ],
            }),
          ],
        }),
        spacer(),
        note(
          "BILLING PROTECTION: Invalid clicks are marked is_fraud=TRUE in the ad_clicks table and excluded from CPC billing. Advertisers are notified and credited for filtered invalid clicks. This builds advertiser trust and is table-stakes for an enterprise-grade platform.",
          "success"
        ),
        spacer(),

        pagebreak(),

        // ── 8. Kafka Events ───────────────────────────────────────────
        h1("8. Kafka Event Architecture"),
        p(
          "Kafka decouples the high-frequency ad serving path from downstream processing (analytics, billing, ML training). Any of these consumers can fall behind or restart without impacting ad serving latency."
        ),
        spacer(),

        h2("8.1  Topics"),
        new Table({
          width: { size: 9080, type: WidthType.DXA },
          columnWidths: [2500, 1500, 1500, 3580],
          rows: [
            new TableRow({
              children: [
                headerCell("Topic"),
                headerCell("Partitions"),
                headerCell("Retention"),
                headerCell("Consumers"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("kridaz.ad_events"),
                dataCell("12"),
                dataCell("7 days"),
                dataCell("analytics-service, billing-service, ml-training"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("kridaz.analytics_events"),
                dataCell("6"),
                dataCell("30 days"),
                dataCell("reporting-service"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("kridaz.moderation_events"),
                dataCell("3"),
                dataCell("90 days"),
                dataCell("moderation-service, admin-dashboard"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("kridaz.billing_events"),
                dataCell("6"),
                dataCell("90 days"),
                dataCell("billing-service, finance-reporting"),
              ],
            }),
          ],
        }),
        spacer(),

        h2("8.2  Event Schema"),
        p("All events follow a standard envelope:"),
        code("{"),
        code(
          '  "event_type": "impression" | "click" | "conversion" | "report",'
        ),
        code('  "timestamp": "2025-01-01T10:00:00Z",'),
        code('  "data": {'),
        code('    "user_id": "uuid",'),
        code('    "campaign_id": "uuid",'),
        code('    "surface": "reels_feed",'),
        code("    ... (event-specific fields)"),
        code("  }"),
        code("}"),
        spacer(),

        h2("8.3  Consumer Group Strategy"),
        p(
          "Use separate consumer groups for each downstream system. This allows each system to consume at its own pace and replay from any offset independently. Partition by campaign_id as the Kafka key to ensure events for the same campaign are always processed in order."
        ),
        spacer(),

        pagebreak(),

        // ── 9. Moderation ────────────────────────────────────────────
        h1("9. Ad Moderation & Safety"),
        p(
          "All campaigns go through a moderation pipeline before going live. This is mandatory for legal compliance and to maintain user trust."
        ),
        spacer(),

        h2("9.1  Moderation Flow"),
        numbered("Advertiser submits campaign via self-service dashboard."),
        numbered(
          "Automated screening runs instantly (keyword check, URL check, category check, budget sanity)."
        ),
        numbered(
          "If auto-rejected: campaign status = rejected, rejection reasons returned to advertiser."
        ),
        numbered(
          "If borderline (risk_score 0.3-0.7): campaign enters human review queue, status = pending_review."
        ),
        numbered(
          "If clean pass (risk_score < 0.3): campaign auto-approved, status = active."
        ),
        numbered(
          "User reports on live ads trigger re-review. After 10 unique reports, auto-suspend."
        ),
        spacer(),

        h2("9.2  Blocked Categories"),
        p(
          "The following categories are permanently blocked from the platform:"
        ),
        bullet("Gambling, betting, lottery, casino."),
        bullet("Adult content."),
        bullet("Alcohol, tobacco, vaping products."),
        bullet("Hate speech, extremist content, political propaganda."),
        bullet("Financial scams, MLM schemes, guaranteed return promises."),
        bullet("Violence, weapons."),
        bullet("Unlicensed pharmaceuticals, controlled substances."),
        spacer(),
        note(
          "LEGAL NOTE: Maintaining and enforcing this blocked category list is important for compliance with Indian advertising standards (ASCI guidelines) and platform liability protection. Consult legal counsel before expanding any restricted category.",
          "warn"
        ),
        spacer(),

        h2("9.3  Quality Score Calculation"),
        p(
          "Quality score (0-1) is set by admin on first review and updated by an ML model that monitors post-launch engagement:"
        ),
        bullet(
          "Creative quality signals: image/video resolution, aspect ratio compliance, text overlay ratio."
        ),
        bullet(
          "Landing page quality: page load speed, mobile-friendliness, HTTPS, content relevance."
        ),
        bullet(
          "Historical performance: CTR relative to category average, bounce rate, post-click engagement."
        ),
        spacer(),

        pagebreak(),

        // ── 10. Billing ───────────────────────────────────────────────
        h1("10. Billing System"),
        spacer(),

        h2("10.1  Bid Strategy Guide"),
        new Table({
          width: { size: 9080, type: WidthType.DXA },
          columnWidths: [1600, 2000, 2480, 3000],
          rows: [
            new TableRow({
              children: [
                headerCell("Strategy"),
                headerCell("Charged When"),
                headerCell("Best For"),
                headerCell("eCPM Formula"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("CPC"),
                dataCell("User clicks"),
                dataCell("Performance campaigns, turf bookings, sign-ups"),
                dataCell("bid * pCTR * 1000"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("CPM"),
                dataCell("Every 1000 impressions"),
                dataCell("Brand awareness, tournament sponsorships"),
                dataCell("bid_amount"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("CPA"),
                dataCell("Verified conversion (booking, sign-up)"),
                dataCell("E-commerce, subscription ads"),
                dataCell("bid * pCTR * pCVR * 1000"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("tCPA (ML)"),
                dataCell("Verified conversion"),
                dataCell("Advanced: auto-optimises bid to hit target CPA"),
                dataCell("ML-predicted optimal bid"),
              ],
            }),
          ],
        }),
        spacer(),

        h2("10.2  Budget Pacing"),
        p(
          "Budget pacing ensures an advertiser's daily budget is spread evenly across the day rather than being consumed in the first few hours. The pacing algorithm:"
        ),
        code("expected_pct = hours_elapsed / 24"),
        code("actual_pct   = spent_today / daily_budget"),
        code(""),
        code("if actual_pct <= expected_pct:"),
        code("    throttle = 1.0  # full delivery"),
        code("else:"),
        code("    throttle = expected_pct / actual_pct  # reduce delivery"),
        code("    throttle = max(throttle, 0.10)         # never go below 10%"),
        spacer(),

        h2("10.3  Daily Budget Reset"),
        p(
          "A Celery Beat job runs at midnight IST (18:30 UTC) to reset spent_today to 0 for all active campaigns. The pg_cron extension can be used as an alternative PostgreSQL-native reset."
        ),
        spacer(),

        pagebreak(),

        // ── 11. Development Guide ────────────────────────────────────
        h1("11. Developer Setup Guide"),
        spacer(),

        h2("11.1  Prerequisites"),
        bullet("Python 3.11+"),
        bullet("Docker Desktop (for local stack)"),
        bullet("Node.js 18+ (for frontend integration testing)"),
        bullet("pnpm 10.x (monorepo package manager)"),
        spacer(),

        h2("11.2  Local Setup"),
        numbered(
          "Clone the repository and navigate to the ads platform directory."
        ),
        numbered("Copy .env.example to .env and fill in secrets."),
        numbered("Start the full infrastructure stack:"),
        spacer(),
        code("cd docker"),
        code("docker compose up -d postgres redis kafka"),
        spacer(),
        numbered("Create Python virtual environment and install dependencies:"),
        spacer(),
        code("python -m venv venv"),
        code("source venv/bin/activate     # Linux/Mac"),
        code("venv\\Scripts\\activate       # Windows"),
        code("pip install -r requirements.txt"),
        code("pip install faiss-cpu         # or faiss-gpu for GPU machines"),
        spacer(),
        numbered("Run database migrations:"),
        spacer(),
        code("alembic upgrade head"),
        spacer(),
        numbered("Start the ads service:"),
        spacer(),
        code("uvicorn ads_service.api.main:app --reload --port 8001"),
        spacer(),
        numbered("Open API docs at http://localhost:8001/docs"),
        spacer(),

        h2("11.3  Environment Variables"),
        new Table({
          width: { size: 9080, type: WidthType.DXA },
          columnWidths: [2800, 2800, 3480],
          rows: [
            new TableRow({
              children: [
                headerCell("Variable"),
                headerCell("Example"),
                headerCell("Description"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("DATABASE_URL"),
                dataCell("postgresql+asyncpg://..."),
                dataCell("Async PostgreSQL connection string"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("REDIS_URL"),
                dataCell("redis://localhost:6379"),
                dataCell("Redis connection (frequency caps, pCTR cache)"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("KAFKA_BOOTSTRAP_SERVERS"),
                dataCell("localhost:9092"),
                dataCell("Kafka brokers (comma-separated for prod)"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("LOG_LEVEL"),
                dataCell("INFO"),
                dataCell("DEBUG | INFO | WARNING | ERROR"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("WORKERS"),
                dataCell("4"),
                dataCell("Uvicorn worker processes (set to CPU count in prod)"),
              ],
            }),
          ],
        }),
        spacer(),

        pagebreak(),

        // ── 12. Rollout Phases ────────────────────────────────────────
        h1("12. Recommended Rollout Phases"),
        spacer(),

        h2("Phase 1: Core Monetisation (Months 3-4)"),
        bullet("Deploy ads-service with basic multi-signal ranking."),
        bullet(
          "Integrate Reels Feed, Community Feed, and Turf Search ad surfaces."
        ),
        bullet("Manual campaign creation by admin (no self-service yet)."),
        bullet("CPC billing only. Basic impression/click tracking."),
        bullet("Redis frequency capping. Simple keyword moderation."),
        spacer(),

        h2("Phase 2: Full Surface Coverage (Months 6-8)"),
        bullet("Add Story, Home Banner, Search Results, and Booking surfaces."),
        bullet(
          "Launch advertiser self-service dashboard with campaign creation UI."
        ),
        bullet("Enable CPM and CPA bid strategies."),
        bullet("Deploy FAISS-powered recommendation engine."),
        bullet("Automated moderation pipeline. Fraud detection system."),
        bullet("Real-time analytics dashboard for advertisers."),
        spacer(),

        h2("Phase 3: ML & Advanced Features (Months 9-12)"),
        bullet(
          "Train and deploy XGBoost pCTR model on accumulated click data (need ~500K impressions minimum)."
        ),
        bullet(
          "Implement two-tower neural embedding model for user and ad vectors."
        ),
        bullet(
          "Launch tCPA (target CPA) bid strategy with ML-based bid optimisation."
        ),
        bullet("Push notification ads with personalised triggering."),
        bullet("Tournament sponsorship modules."),
        bullet(
          "Lookalike audience targeting (find users similar to advertiser's best converters)."
        ),
        spacer(),

        note(
          "ML MODEL TRAINING TRIGGER: Do not deploy the XGBoost pCTR model until you have at least 500,000 impressions and 10,000 clicks in the training set. Before that threshold, the logistic regression placeholder outperforms an under-trained model. The logistic regression placeholder is production-safe and gives reasonable results.",
          "info"
        ),
        spacer(),

        pagebreak(),

        // ── 13. Observability ─────────────────────────────────────────
        h1("13. Monitoring & Observability"),
        spacer(),

        h2("13.1  Key Metrics to Track"),
        h3("Business Metrics (Grafana Dashboard)"),
        bullet("Ad Request Rate (requests/second by surface)"),
        bullet("Fill Rate = ads served / ads requested (target > 85%)"),
        bullet("Platform CPM (average revenue per 1000 impressions)"),
        bullet("Total Daily Spend Across All Campaigns"),
        bullet("Active Campaigns Count by Status"),
        spacer(),

        h3("Technical Metrics (Prometheus)"),
        bullet("p50/p95/p99 latency for /v1/ads/serve endpoint"),
        bullet("Redis hit rate for pCTR cache and frequency cap checks"),
        bullet("Kafka consumer lag per topic per consumer group"),
        bullet("FAISS query latency (track separately from Python overhead)"),
        bullet("Fraud rejection rate (clicks blocked / total clicks)"),
        spacer(),

        h3("ML Model Health"),
        bullet("Live CTR vs predicted CTR (AUC-ROC should be > 0.65)"),
        bullet("Score distribution over time (detect model drift)"),
        bullet(
          "Recommendation diversity (Gini coefficient of campaign exposure)"
        ),
        spacer(),

        h2("13.2  Alerting Rules"),
        new Table({
          width: { size: 9080, type: WidthType.DXA },
          columnWidths: [3000, 2000, 2000, 2080],
          rows: [
            new TableRow({
              children: [
                headerCell("Alert"),
                headerCell("Threshold"),
                headerCell("Severity"),
                headerCell("Action"),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Ad serve latency p99"),
                dataCell("> 200 ms"),
                dataCell("HIGH"),
                dataCell("Page on-call. Check Redis/FAISS."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Fill rate"),
                dataCell("< 70%"),
                dataCell("MEDIUM"),
                dataCell("Check active campaign count."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Kafka consumer lag"),
                dataCell("> 10,000 messages"),
                dataCell("HIGH"),
                dataCell("Scale consumer replicas."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Fraud rejection rate"),
                dataCell("> 30%"),
                dataCell("HIGH"),
                dataCell("Possible attack. Review flagged IPs."),
              ],
            }),
            new TableRow({
              children: [
                dataCell("pCTR vs live CTR gap"),
                dataCell("> 50% divergence"),
                dataCell("MEDIUM"),
                dataCell("Retrain CTR model."),
              ],
            }),
          ],
        }),
        spacer(),

        pagebreak(),

        // ── 14. Security ──────────────────────────────────────────────
        h1("14. Security Considerations"),
        spacer(),
        h2("14.1  API Security"),
        bullet(
          "All ad serving endpoints require a valid Kridaz JWT token. Advertisers authenticate with OAuth2 + API key."
        ),
        bullet(
          "Rate limit all endpoints: 1000 req/min per IP on serve, 100 req/min per IP on campaign management."
        ),
        bullet(
          "Validate all ad media URLs: must be HTTPS, must resolve to Kridaz-hosted CDN (Cloudinary)."
        ),
        bullet(
          "Sanitise all advertiser-submitted text content (XSS prevention)."
        ),
        spacer(),
        h2("14.2  Data Privacy"),
        bullet(
          "User ad interaction data (impressions, clicks) must be retained for a maximum of 2 years per DPDP Act (India) requirements."
        ),
        bullet(
          "Never log raw user_id in application logs — use a hashed alias."
        ),
        bullet(
          "Provide users with the ability to opt out of personalised ads. Opted-out users receive demographic targeting only (city + sport, no behavioural targeting)."
        ),
        bullet(
          "Advertiser campaign data is tenant-isolated — advertisers can only see their own campaigns and metrics."
        ),
        spacer(),

        // ── 15. Glossary ─────────────────────────────────────────────
        h1("15. Glossary"),
        new Table({
          width: { size: 9080, type: WidthType.DXA },
          columnWidths: [2200, 6880],
          rows: [
            new TableRow({
              children: [headerCell("Term"), headerCell("Definition")],
            }),
            new TableRow({
              children: [
                dataCell("eCPM"),
                dataCell(
                  "Effective Cost Per Mille. Normalised bid value that allows CPC, CPM, and CPA bids to compete in the same auction."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("pCTR"),
                dataCell(
                  "Predicted Click-Through Rate. The ML model's estimate of the probability that a specific user clicks a specific ad."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("ANN"),
                dataCell(
                  "Approximate Nearest Neighbour. Fast vector similarity search used by FAISS to find matching campaigns for a user embedding."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Frequency Cap"),
                dataCell(
                  "Maximum number of times a specific ad is shown to a specific user within a time window (typically 24 hours)."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Vickrey Auction"),
                dataCell(
                  "Second-price auction: winner pays the second-highest bid + minimum increment, not their own maximum bid."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Budget Pacing"),
                dataCell(
                  "Algorithm that spreads a campaign's daily budget evenly across 24 hours to prevent early exhaustion."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Epsilon-Greedy"),
                dataCell(
                  "Exploration strategy where epsilon% of ad slots show less-seen campaigns to discover their audience."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Collaborative Filter"),
                dataCell(
                  "Recommendation method based on co-engagement: 'users who engaged with A also engaged with B'."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Quality Score"),
                dataCell(
                  "A 0-1 score reflecting ad creative and landing page quality. High quality score = lower cost per click."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("Surface Weight"),
                dataCell(
                  "Multiplier applied to ranking score based on the ad placement surface. Higher = more conversion intent."
                ),
              ],
            }),
            new TableRow({
              children: [
                dataCell("ROAS"),
                dataCell(
                  "Return on Ad Spend = Revenue attributed to ads / Ad Spend. Key advertiser KPI."
                ),
              ],
            }),
          ],
        }),
        spacer(),
        spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 4, color: BRAND, space: 8 },
          },
          children: [
            new TextRun({
              text: "Kridaz Engineering  |  Confidential  |  Do not distribute",
              size: 18,
              color: GRAY,
              font: "Arial",
            }),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(
    "/mnt/user-data/outputs/Kridaz_Ads_Developer_Guide.docx",
    buf
  );
  console.log("Done");
});
