# SocialEcho — Claude Reference

Real-Time Social Listening & Brand Monitoring Platform.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind + Redux Toolkit |
| Backend | Node.js + Express + TypeScript |
| Primary DB | MongoDB (mentions/content via Mongoose) |
| Relational DB | PostgreSQL (users, projects via Sequelize) |
| Cache | Redis (ioredis) |
| Search | Elasticsearch (optional) |
| Real-time | Socket.io |

## Project Structure

```
social media/
├── frontend/src/
│   ├── pages/          # auth, mentions, analytics, influencers
│   ├── components/     # layout, analytics, mentions, filters, projects, common
│   ├── hooks/          # useAuth, useMentions, useSocket
│   ├── store/          # Redux slices
│   └── services/       # API client calls
│
└── backend/src/
    ├── config/         # env.ts, database.ts, redis.ts
    ├── models/
    │   ├── mongo/      # Mention.ts
    │   └── postgres/   # User.ts, Project.ts, TeamMember.ts
    ├── services/
    │   ├── collection/ # collectors + manager (see below)
    │   ├── auth.service.ts
    │   ├── mention.service.ts
    │   ├── analytics.service.ts
    │   └── sentiment.service.ts
    ├── routes/         # auth, project, mention, analytics, collection
    ├── middleware/      # auth (JWT), errorHandler, rateLimiter, validate
    └── utils/          # jwt, logger (Winston), response
```

## Data Collection Architecture

Collectors run every 15 min (configurable). The manager orchestrates all of them.

**Manager**: `backend/src/services/collection/collector.manager.ts`

| Collector | File | API | Key Required |
|---|---|---|---|
| Twitter/X | `twitter.collector.ts` | RapidAPI (`twitter241.p.rapidapi.com`) | `RAPIDAPI_KEY` |
| YouTube | `youtube.collector.ts` | YouTube Data API v3 (official) | `YOUTUBE_API_KEY` |
| Google News | `news.collector.ts` | RSS feed (no key needed) | — |
| Facebook | `facebook.collector.ts` | RapidAPI (`facebook-scraper3.p.rapidapi.com`) | `RAPIDAPI_KEY` |
| Instagram | `instagram.collector.ts` | RapidAPI (`instagram-scraper-api2.p.rapidapi.com`) | `RAPIDAPI_KEY` |

All collectors share the same `RAPIDAPI_KEY`. Toggle each platform independently:

```
ENABLE_NEWS_COLLECTION=true
ENABLE_FACEBOOK_COLLECTION=true
ENABLE_INSTAGRAM_COLLECTION=true
```

## Adding a New Collector

1. Create `backend/src/services/collection/<platform>.collector.ts`
2. Export `async function collect<Platform>Mentions(projectId, keywords): Promise<number>`
3. Use `mentionService.saveMention(...)` — deduplicated by URL automatically
4. Use `sentimentService.analyze(text)` and `sentimentService.calculateInfluenceScore(...)`
5. Add env toggle to `env.ts` and import + wire in `collector.manager.ts`

## Key Environment Variables

```bash
# APIs
RAPIDAPI_KEY=              # Used by Twitter, Facebook, Instagram collectors
YOUTUBE_API_KEY=           # YouTube Data API v3

# RapidAPI hosts (overridable if you subscribe to a different provider)
FACEBOOK_RAPIDAPI_HOST=facebook-scraper3.p.rapidapi.com
INSTAGRAM_RAPIDAPI_HOST=instagram-scraper-api2.p.rapidapi.com

# Collection control
ENABLE_AUTO_COLLECTION=true
ENABLE_NEWS_COLLECTION=true
ENABLE_FACEBOOK_COLLECTION=true
ENABLE_INSTAGRAM_COLLECTION=true
DATA_COLLECTION_INTERVAL_MINUTES=15

# Databases
MONGODB_URI=mongodb://localhost:27017/socialecho
POSTGRES_HOST=localhost / POSTGRES_DB=socialecho / POSTGRES_USER=postgres
REDIS_HOST=localhost
```

## API Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh

GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PUT    /api/v1/projects/:id
DELETE /api/v1/projects/:id

GET    /api/v1/mentions          # filterable by platform, sentiment, date
GET    /api/v1/mentions/:id
PATCH  /api/v1/mentions/:id

GET    /api/v1/analytics/overview
GET    /api/v1/analytics/sentiment
GET    /api/v1/analytics/influencers

POST   /api/v1/collection/trigger            # trigger full collection
POST   /api/v1/collection/trigger/:projectId # trigger for one project
```

## Mention Data Shape (MongoDB)

Every saved mention has:
- **content**: text, title, url, language
- **author**: username, displayName, profileUrl, followerCount, isVerified, accountAgeDays, bio
- **source**: platform, domain, domainAuthority, monthlyVisitors, isNewsSite, tier
- **temporal**: publishedAt, collectedAt, dateString (yyyy-MM-dd), weekYear
- **engagement**: likes, comments, shares, views, engagementRate
- **analysis**: sentiment, sentimentConfidence, isSarcasm, hashtags, keywordsMatched, influenceScore, namedEntities, topics
- **metadata**: tags, status (new/reviewed/assigned/archived), isStarred

## Dev Commands

```bash
npm run dev              # run frontend + backend concurrently
npm run dev:backend      # backend only (ts-node-dev)
npm run dev:frontend     # frontend only (vite)
npm run build            # build both
npm run install:all      # install all workspace deps
```

Docker: `docker-compose up` spins up MongoDB, PostgreSQL, Redis, Elasticsearch + both app services.

## Sentiment Service

`backend/src/services/sentiment.service.ts` — rule-based, no API key needed.

- `sentimentService.analyze(text)` → `{ sentiment: 'positive'|'negative'|'neutral', confidence: number, isSarcasm: boolean }`
- `sentimentService.calculateInfluenceScore({ followerCount, engagementRate, isVerified, accountAgeDays, platform })` → `number` (0–10)

## WebSocket Events

Client joins room `project:<projectId>`. Server emits `collection_update` with `{ projectId, newMentions }` after each collection cycle that finds new content.
