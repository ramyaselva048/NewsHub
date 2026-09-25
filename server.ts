import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pg from 'pg';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'newshub_super_secret_jwt_key_2026';
const PORT = 3000;

// Neon PostgreSQL Connection Pool
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_XErCUDJ17tAn@ep-square-mouse-b3yc1d5v-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

let pgPool: pg.Pool | null = null;
if (DATABASE_URL) {
  try {
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pgPool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected error on idle client:', err);
    });
    console.log('[PostgreSQL] Database pool initialized.');
  } catch (err) {
    console.error('[PostgreSQL] Failed to initialize pool:', err);
  }
}

// Gemini API Client
let geminiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Data directory & storage file
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'newshub_db.json');

interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  profile_image: string;
  bio?: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  image_url: string;
  category_id: number;
  author_id: number;
  author_name: string;
  author_image: string;
  status: 'published' | 'draft';
  views: number;
  is_featured?: boolean;
  is_trending?: boolean;
  read_time_minutes: number;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: number;
  article_id: number;
  user_id: number;
  user_name: string;
  user_image: string;
  comment: string;
  created_at: string;
}

interface Like {
  id: number;
  article_id: number;
  user_id: number;
}

interface Bookmark {
  id: number;
  article_id: number;
  user_id: number;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  categories: Category[];
  articles: Article[];
  comments: Comment[];
  likes: Like[];
  bookmarks: Bookmark[];
}

// Initial Seed Data
function getInitialSeedData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Admin@123', salt);
  const userHash = bcrypt.hashSync('User@123', salt);
  const writerHash = bcrypt.hashSync('Writer@123', salt);

  const users: User[] = [
    {
      id: 1,
      name: 'Ramya S',
      email: 'ramyaselva048@gmail.com',
      password_hash: adminHash,
      role: 'admin',
      profile_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      bio: 'Editor-in-Chief at NewsHub. Covering global affairs, breakthrough technologies, and modern media ethics.',
      created_at: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 2,
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@newshub.com',
      password_hash: userHash,
      role: 'user',
      profile_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      bio: 'Independent researcher, avid tech reader, and digital culture enthusiast based in Seattle.',
      created_at: '2026-02-14T11:20:00.000Z',
    },
    {
      id: 3,
      name: 'Marcus Vance',
      email: 'marcus.vance@newshub.com',
      password_hash: writerHash,
      role: 'admin',
      profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Senior Science & Deep Tech Journalist. Formerly reporting at Global Horizon & Tech Vanguard.',
      created_at: '2026-01-15T09:30:00.000Z',
    },
  ];

  const categories: Category[] = [
    {
      id: 1,
      name: 'Technology',
      slug: 'technology',
      description: 'Breakthroughs in artificial intelligence, quantum computing, autonomous systems, and digital infrastructure.',
    },
    {
      id: 2,
      name: 'Business',
      slug: 'business',
      description: 'Macroeconomic shifts, venture capital trends, global trade dynamics, and market intelligence.',
    },
    {
      id: 3,
      name: 'Science',
      slug: 'science',
      description: 'Astrophysics, clean energy transitions, synthetic biology, and climate resilience research.',
    },
    {
      id: 4,
      name: 'Sports',
      slug: 'sports',
      description: 'International championships, athletic milestones, sports science, and competitive analytics.',
    },
    {
      id: 5,
      name: 'Education',
      slug: 'education',
      description: 'Next-generation pedagogy, university transformation, AI in classroom environments, and lifelong learning.',
    },
    {
      id: 6,
      name: 'Entertainment',
      slug: 'entertainment',
      description: 'Cinematic arts, streaming evolution, gaming narratives, and contemporary cultural impact.',
    },
  ];

  const articles: Article[] = [
    {
      id: 1,
      title: 'The Quantum Leap: Commercial Quantum Processors Achieve Practical Supremacy in Materials Science',
      slug: 'quantum-leap-commercial-quantum-processors-materials-science',
      summary: 'Quantum computing labs have demonstrated room-temperature stable qubit arrays that simulate complex molecular bonds, accelerating battery chemistry breakthroughs by decades.',
      content: `The quest for scalable quantum computational advantage reached an undeniable milestone this week as an international coalition of physicists and computational chemists unveiled results from the Helios-IV quantum processor. 

Unlike previous experimental systems that demanded cryogenic refrigeration close to absolute zero, the new hybrid topological architecture operates under near-ambient thermal tolerances, drastically lowering the operating overhead for real-world laboratory deployment.

### Simulating Molecular Frontiers

For half a century, the primary roadblock in solid-state lithium-metal battery design has been the inability of classical supercomputers to simulate multi-electron quantum interactions across dendritic interfaces. The combinatorial complexity of hundreds of interacting spins surpasses classical memory capacities.

Using the Helios-IV's 2,048 coherent logical qubits, researchers simulated the complete decomposition lifecycle of sulfur-electrolyte matrices in under fourteen minutes—a computational calculation projected to take traditional clusters over 11,000 continuous compute years.

> "We are no longer merely testing theoretical physics proofs; we are synthesizing compounds that will power next-generation transcontinental aviation before the decade closes," remarked Lead Principal Scientist Dr. Aris Thorne.

### Industry Implications & Global Adoption

Commercial automotive conglomerates and aerospace innovators have already signed early-access consortia agreements to test catalyst alloys for direct-air carbon mineralization. With energy densities exceeding 850 Wh/kg now mathematically validated, the timeline for commercial electrification of long-haul maritime transport has shifted forward significantly.

Market analysts forecast that over 30% of Fortune 500 chemical and materials enterprises will integrate quantum simulation APIs into their primary R&D pipeline before late 2027.`,
      image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
      category_id: 1,
      author_id: 3,
      author_name: 'Marcus Vance',
      author_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      views: 1420,
      is_featured: true,
      is_trending: true,
      read_time_minutes: 5,
      created_at: '2026-09-22T14:30:00.000Z',
      updated_at: '2026-09-22T14:30:00.000Z',
    },
    {
      id: 2,
      title: 'Global Sovereign Wealth Funds Pivot Trillions Toward Renewable Grid Superhighways',
      slug: 'sovereign-wealth-funds-pivot-renewable-grid-superhighways',
      summary: 'Major institutional allocators are deploying capital into ultra-high-voltage direct current (HVDC) transmission lines connecting sun-drenched deserts with industrial manufacturing hubs.',
      content: `Institutional capital allocation reached a critical turning point as five of the worlds largest sovereign wealth funds announced a coordinated $450 billion infrastructure consortium. The mission: building intercontinental High-Voltage Direct Current (HVDC) power corridors capable of transmitting gigawatts of clean electricity across continents with under 2.5% transmission loss.

### Solving the Intermittency Equation

While solar photovoltaic and offshore wind generation costs have plummeted below fossil fuel baseload costs, the historic bottleneck has always been transmission geography: the sun shines brightest in uninhabited arid plateaus, while electricity demand concentrates in coastal metropolitan zones thousands of miles away.

The newly funded corridors will link the North African solar expanses directly with Central European industrial basins, while simultaneously interconnecting Chilean Atacama arrays with Andean power pools.

### Economic Ripples & Supply Chain Realities

The sheer scale of this deployment has triggered unprecedented demand for specialized copper alloys, synthetic cross-linked insulation polymers, and superconducting subsea cables. 

Treasury leaders emphasized that long-term sovereign bond yields are increasingly tied to grid resilience ratings. Developing countries with abundant solar irradiance are transitioning from raw commodity exporters into green energy and hydrogen powerhouses.`,
      image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
      category_id: 2,
      author_id: 1,
      author_name: 'Ramya S',
      author_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      views: 980,
      is_featured: true,
      is_trending: true,
      read_time_minutes: 6,
      created_at: '2026-09-23T09:15:00.000Z',
      updated_at: '2026-09-23T09:15:00.000Z',
    },
    {
      id: 3,
      title: 'Deep Space James Webb Observations Confirm Organic Precursor Molecules in Habitable Exo-Moons',
      slug: 'james-webb-confirms-organic-precursor-molecules-exo-moons',
      summary: 'Spectroscopic analysis of the TRAPPIST-1 system reveals complex amino acid pre-cursors and atmospheric water vapor cycles around second-tier moons.',
      content: `NASA and the European Space Agency released high-resolution transmission spectra captured during a 72-hour continuous planetary transit across the nearby red dwarf system TRAPPIST-1.

The data unmistakably flags presence of glycine precursors, methane isotopic equilibria, and tropospheric moisture clouds hovering over outer planetary satellites.

### A New Chapter in Astrobiology

Unlike barren rocky cores previously assumed in high-radiation red dwarf regimes, the exomoons appear shielded by potent self-generated dipolar magnetospheres. Atmospheric densities mirror early Archean Earth conditions right when cellular life first gained traction.

Astronomers are now recalibrating predictive models for circumstellar biosignatures, pointing out that tidal flexing from multiple interacting moons provides steady internal geothermal heat engines independent of host star flare fluctuations.`,
      image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      category_id: 3,
      author_id: 3,
      author_name: 'Marcus Vance',
      author_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      views: 2150,
      is_featured: false,
      is_trending: true,
      read_time_minutes: 4,
      created_at: '2026-09-21T18:45:00.000Z',
      updated_at: '2026-09-21T18:45:00.000Z',
    },
    {
      id: 4,
      title: 'Biomechanics & AI Video Telemetry: How Machine Vision Is Transforming Elite Athletics',
      slug: 'biomechanics-ai-telemetry-transforming-athletics',
      summary: 'From Olympic sprinters to Premier League football clubs, multi-camera spatial tracking is preventing soft-tissue injuries before fatigue manifests.',
      content: `Gone are the days when athletic training relied purely on stopwatches and subjective coaching instincts. Across world sporting arenas, 120-frame-per-second computer vision rigs calculate real-time joint torque, ligament loading, and kinetic chain efficiency.

### Predictive Injury Prevention

By contrasting an athletes baseline biomechanical symmetry against micro-deviations during the 85th minute of play, automated alert platforms flag hamstring tear vulnerabilities 72 hours before acute strain occurs. Clubs in England and Spain report a 42% drop in season-ending tendon incidents over consecutive competitive campaigns.

Athletes themselves carry personalized digital twins that simulate how microscopic stride adjustments reduce ground impact shock on cartilage.`,
      image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
      category_id: 4,
      author_id: 1,
      author_name: 'Ramya S',
      author_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      views: 740,
      is_featured: false,
      is_trending: false,
      read_time_minutes: 4,
      created_at: '2026-09-20T10:00:00.000Z',
      updated_at: '2026-09-20T10:00:00.000Z',
    },
    {
      id: 5,
      title: 'Adaptive Learning Engines: Universities Redesign STEM Curriculums Around Socratic AI Tutors',
      slug: 'adaptive-learning-universities-redesign-stem-curriculums',
      summary: 'Top global institutions are phasing out standard 500-student lecture halls in favor of interactive algorithmic peer studios with personalized pacing.',
      content: `The traditional university lecture hall—designed in the industrial era for one-to-many recitation—is undergoing its most dramatic restructuring in three centuries.

Pilots across engineering faculties in Cambridge, MIT, and Singapore demonstrate that students using adaptive Socratic agents grasp multi-variable calculus in half the conventional semester timeframe. Rather than broadcasting static slides, faculty convene small problem-solving colloquiums focused on open-ended design challenges.

### Closing the Equity Gap

Historically, students entering higher education without advanced preparatory high school classes faced steep dropout rates in gateway mathematics. The adaptive model identifies precise conceptual deficits—such as trigonometric factoring—and provides real-time contextual scaffolding without judgment.`,
      image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
      category_id: 5,
      author_id: 3,
      author_name: 'Marcus Vance',
      author_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      views: 890,
      is_featured: false,
      is_trending: false,
      read_time_minutes: 5,
      created_at: '2026-09-19T11:30:00.000Z',
      updated_at: '2026-09-19T11:30:00.000Z',
    },
    {
      id: 6,
      title: 'Interactive Cinema: How Real-Time Neural Rendering Is Blurring the Line Between Gaming and Film',
      slug: 'interactive-cinema-neural-rendering-gaming-film',
      summary: 'Hollywood directors and indie game developers unite to create living cinematic universes where viewer choices guide realistic character emotions and plot branches.',
      content: `Cinema is breaking free from fixed timeline reels. Major independent studios showcased premiere experiences at the Venice Immersive Showcase where real-time neural radiance fields (NeRFs) and fluid character physics render photorealistic feature films that shift based on audience biometric tension.

Actors perform full motion and emotional volume capture, building deep behavioral neural maps that respond dynamically to narrative branch points while preserving the director's precise lighting, cinematography, and dramatic pacing.`,
      image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      category_id: 6,
      author_id: 1,
      author_name: 'Ramya S',
      author_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      views: 1120,
      is_featured: false,
      is_trending: true,
      read_time_minutes: 5,
      created_at: '2026-09-18T16:00:00.000Z',
      updated_at: '2026-09-18T16:00:00.000Z',
    },
    {
      id: 7,
      title: 'Solid-State Battery Production Surpasses 100 GWh Threshold in North American Gigafactories',
      slug: 'solid-state-battery-production-surpasses-100-gwh',
      summary: 'Electrolyte stability breakthroughs allow safe 8-minute fast charging with non-flammable ceramic matrices, altering consumer EV adoption economics.',
      content: `The elusive solid-state battery has exited pilot prototyping into full-scale automated manufacturing. Two gigafactories in Ohio and Ontario initiated continuous roll-to-roll calendering of ceramic electrolyte membranes, delivering power packs that boast 1,200 kilometer ranges on a single charge.

Automotive safety regulators celebrated the elimination of combustible liquid electrolytes, noting that thermal runaway risks are virtually zero under extreme crush and puncture tests.`,
      image_url: 'https://images.unsplash.com/photo-1558441719-8b489c63f77a?auto=format&fit=crop&w=1200&q=80',
      category_id: 1,
      author_id: 3,
      author_name: 'Marcus Vance',
      author_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      views: 650,
      is_featured: false,
      is_trending: false,
      read_time_minutes: 4,
      created_at: '2026-09-17T08:00:00.000Z',
      updated_at: '2026-09-17T08:00:00.000Z',
    },
    {
      id: 8,
      title: 'Decentralized Sovereign Currencies: Central Banks Test Interoperable Wholesale Digital Liquidity',
      slug: 'decentralized-sovereign-currencies-wholesale-digital-liquidity',
      summary: 'Project Agorá demonstrates instantaneous cross-border settlement between 14 central banks, bypassing multi-day correspondent banking friction.',
      content: `Cross-border currency clearing took a giant leap forward as the Bank for International Settlements (BIS) published Phase II findings from Project Agorá. 

By unifying tokenized commercial bank deposits and wholesale central bank money onto a programmable ledger, institutional payments that previously required 48 to 72 hours through fragmented clearing houses settled in under 4 seconds with atomic payment-versus-payment finality.`,
      image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
      category_id: 2,
      author_id: 1,
      author_name: 'Ramya S',
      author_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      views: 810,
      is_featured: false,
      is_trending: false,
      read_time_minutes: 5,
      created_at: '2026-09-16T13:20:00.000Z',
      updated_at: '2026-09-16T13:20:00.000Z',
    },
    {
      id: 9,
      title: 'CRISPR Epigenetic Reprogramming Reverses Cellular Aging Markers in Primate Trials',
      slug: 'crispr-epigenetic-reprogramming-cellular-aging-primate-trials',
      summary: 'Targeted DNA methylation resets restore youthful vascular elasticity and mitochondrial efficiency without oncogenic dedifferentiation risks.',
      content: `Molecular biologists at the Karolinska Institute and Salk Institute have reported unprecedented rejuvenation of cardiac and kidney tissues in non-human primates using transient expression of non-integrating epigenetic mRNA factors.

The targeted therapy restores the cellular epigenome to a youthful baseline without wiping cellular identity, unlocking potential therapeutics for cardiovascular disease, chronic kidney decline, and neurodegenerative disorders.`,
      image_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
      category_id: 3,
      author_id: 3,
      author_name: 'Marcus Vance',
      author_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      views: 1940,
      is_featured: false,
      is_trending: true,
      read_time_minutes: 6,
      created_at: '2026-09-15T15:10:00.000Z',
      updated_at: '2026-09-15T15:10:00.000Z',
    },
    {
      id: 10,
      title: 'The Modernization of Physical Literacy: How Youth Sports Are Prioritizing Multilateral Athleticism',
      slug: 'modernization-physical-literacy-youth-sports',
      summary: 'Pediatric sports institutes overturn early specialization dogmas in favor of multi-sport foundational development, slashing burnout and overuse injuries.',
      content: `For decades, youth athletics pushed children into hyper-specialized, year-round competition in a single sport as early as age seven. A comprehensive 10-year longitudinal study published across European and North American sports medicine journals proves this practice spiked ACL reconstruction rates by 300%.

In response, national Olympic committees and school boards are mandating multilateral athletic literacy modules that emphasize balance, gymnastics foundations, and unstructured play until age fourteen.`,
      image_url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
      category_id: 4,
      author_id: 1,
      author_name: 'Ramya S',
      author_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      views: 530,
      is_featured: false,
      is_trending: false,
      read_time_minutes: 4,
      created_at: '2026-09-14T17:00:00.000Z',
      updated_at: '2026-09-14T17:00:00.000Z',
    },
    {
      id: 11,
      title: 'Micro-Credentials and Autonomous Apprenticeships: Rebuilding Vocational Pathways in Modern Engineering',
      slug: 'micro-credentials-autonomous-apprenticeships-engineering',
      summary: 'Industry alliances partner with polytechnics to guarantee paid apprenticeships verified via cryptographic skill credentials.',
      content: `As high-tech manufacturing, robotics maintenance, and semiconductor fab operations expand, traditional four-year degrees are being supplemented by rapid, competency-verified apprenticeships.

Students earn while they master precision CNC machining, cleanroom protocol robotics, and PLC automation. Graduates complete certification debt-free with starting compensation rivaling traditional software engineering cohorts.`,
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      category_id: 5,
      author_id: 3,
      author_name: 'Marcus Vance',
      author_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      views: 620,
      is_featured: false,
      is_trending: false,
      read_time_minutes: 4,
      created_at: '2026-09-13T10:45:00.000Z',
      updated_at: '2026-09-13T10:45:00.000Z',
    },
    {
      id: 12,
      title: 'The Renaissance of Analogue Sound in an Era of Algorithmic Streaming Oversaturation',
      slug: 'renaissance-analogue-sound-algorithmic-streaming',
      summary: 'Vinyl sales, hi-fi listening lounges, and tangible physical media experience unexpected resurgence among digital-native generations.',
      content: `In an era where every recorded song in human history is accessible within a single swipe, music lovers are seeking deliberate friction. Vinyl pressing plants cannot keep up with order queues, while specialized acoustic listening bars in Tokyo, London, and Brooklyn see four-hour waitlists on weekends.

Audiophiles and casual listeners alike cite cognitive relief in engaging with a complete album side without algorithmic recommendations interrupting the artistic narrative arc.`,
      image_url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1200&q=80',
      category_id: 6,
      author_id: 1,
      author_name: 'Ramya S',
      author_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      status: 'published',
      views: 790,
      is_featured: false,
      is_trending: false,
      read_time_minutes: 4,
      created_at: '2026-09-12T14:15:00.000Z',
      updated_at: '2026-09-12T14:15:00.000Z',
    },
  ];

  const comments: Comment[] = [
    {
      id: 1,
      article_id: 1,
      user_id: 2,
      user_name: 'Sarah Jenkins',
      user_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      comment: 'The jump from cryogenic helium chillers to room-temperature topological coherence is the holy grail we have been waiting for. Incredible reporting!',
      created_at: '2026-09-22T16:00:00.000Z',
    },
    {
      id: 2,
      article_id: 1,
      user_id: 1,
      user_name: 'Ramya S',
      user_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      comment: 'We will be following up with a deep-dive interview with Dr. Thorne in this Friday’s editorial edition.',
      created_at: '2026-09-22T17:15:00.000Z',
    },
    {
      id: 3,
      article_id: 2,
      user_id: 2,
      user_name: 'Sarah Jenkins',
      user_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      comment: 'Superconducting HVDC cables are the real unsung heroes of the global decarbonization roadmap.',
      created_at: '2026-09-23T11:00:00.000Z',
    },
    {
      id: 4,
      article_id: 3,
      user_id: 2,
      user_name: 'Sarah Jenkins',
      user_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      comment: 'The magnetosphere shielding on TRAPPIST-1 moons changes everything. We might actually see confirmation of prebiotic chemistry in our lifetime!',
      created_at: '2026-09-21T20:10:00.000Z',
    },
  ];

  const likes: Like[] = [
    { id: 1, article_id: 1, user_id: 2 },
    { id: 2, article_id: 1, user_id: 1 },
    { id: 3, article_id: 2, user_id: 2 },
    { id: 4, article_id: 3, user_id: 2 },
    { id: 5, article_id: 3, user_id: 1 },
    { id: 6, article_id: 6, user_id: 2 },
  ];

  const bookmarks: Bookmark[] = [
    { id: 1, article_id: 1, user_id: 2, created_at: '2026-09-22T17:00:00.000Z' },
    { id: 2, article_id: 3, user_id: 2, created_at: '2026-09-21T21:00:00.000Z' },
  ];

  return { users, categories, articles, comments, likes, bookmarks };
}

// Database helper
class DB {
  private data: DatabaseSchema;
  private syncQueue: Promise<void> = Promise.resolve();

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.warn('[DB] Failed reading DB file cache, using default seed fallback:', err);
        this.data = getInitialSeedData();
      }
    } else {
      this.data = getInitialSeedData();
    }

    // Ensure primary admin is updated to Ramya S / ramyaselva048@gmail.com in memory
    const adminUser = this.data.users.find(u => u.id === 1 || (u.role === 'admin' && (u.email === 'admin@newshub.com' || u.name === 'Elena Rostova')));
    if (adminUser) {
      if (adminUser.name !== 'Ramya S') adminUser.name = 'Ramya S';
      if (adminUser.email !== 'ramyaselva048@gmail.com') adminUser.email = 'ramyaselva048@gmail.com';
      this.data.articles.forEach(a => {
        if (a.author_id === adminUser.id || a.author_name === 'Elena Rostova') {
          if (a.author_name !== 'Ramya S') a.author_name = 'Ramya S';
        }
      });
      this.data.comments.forEach(c => {
        if (c.user_id === adminUser.id || c.user_name === 'Elena Rostova') {
          if (c.user_name !== 'Ramya S') c.user_name = 'Ramya S';
        }
      });
    }
  }

  public async initPostgres() {
    if (!pgPool) {
      console.warn('[PostgreSQL] No pool configured, running in local-file mode.');
      return;
    }
    try {
      console.log('[PostgreSQL] Connecting to Neon serverless database...');
      const client = await pgPool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'user',
            profile_image TEXT,
            bio TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description TEXT
          );

          CREATE TABLE IF NOT EXISTS articles (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            content TEXT NOT NULL,
            summary TEXT,
            image_url TEXT,
            category_id INTEGER,
            author_id INTEGER,
            author_name VARCHAR(255),
            author_image TEXT,
            status VARCHAR(50) DEFAULT 'published',
            views INTEGER DEFAULT 0,
            is_featured BOOLEAN DEFAULT FALSE,
            is_trending BOOLEAN DEFAULT FALSE,
            read_time_minutes INTEGER DEFAULT 3,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            article_id INTEGER,
            user_id INTEGER,
            user_name VARCHAR(255) NOT NULL,
            user_image TEXT,
            comment TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS likes (
            id SERIAL PRIMARY KEY,
            article_id INTEGER,
            user_id INTEGER,
            CONSTRAINT unique_article_user_like UNIQUE (article_id, user_id)
          );

          CREATE TABLE IF NOT EXISTS bookmarks (
            id SERIAL PRIMARY KEY,
            article_id INTEGER,
            user_id INTEGER,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT unique_article_user_bookmark UNIQUE (article_id, user_id)
          );
        `);

        // Check if Neon PostgreSQL already has persistent records
        const usersRes = await client.query('SELECT * FROM users ORDER BY id ASC');
        if (usersRes.rows.length === 0) {
          console.log('[PostgreSQL] Neon tables empty. Seeding initial data into permanent database...');
          await this.syncToPostgres();
        } else {
          console.log(`[PostgreSQL] Permanent store connected! Loaded ${usersRes.rows.length} users from Neon.`);
          const categoriesRes = await client.query('SELECT * FROM categories ORDER BY id ASC');
          const articlesRes = await client.query('SELECT * FROM articles ORDER BY id DESC');
          const commentsRes = await client.query('SELECT * FROM comments ORDER BY id ASC');
          const likesRes = await client.query('SELECT * FROM likes ORDER BY id ASC');
          const bookmarksRes = await client.query('SELECT * FROM bookmarks ORDER BY id ASC');

          this.data = {
            users: usersRes.rows.map(r => ({
              id: r.id,
              name: r.name,
              email: r.email,
              password_hash: r.password_hash,
              role: r.role,
              profile_image: r.profile_image || '',
              bio: r.bio || '',
              created_at: new Date(r.created_at).toISOString(),
            })),
            categories: categoriesRes.rows.map(r => ({
              id: r.id,
              name: r.name,
              slug: r.slug,
              description: r.description || '',
            })),
            articles: articlesRes.rows.map(r => ({
              id: r.id,
              title: r.title,
              slug: r.slug,
              content: r.content,
              summary: r.summary || '',
              image_url: r.image_url || '',
              category_id: r.category_id,
              author_id: r.author_id,
              author_name: r.author_name,
              author_image: r.author_image || '',
              status: r.status,
              views: r.views || 0,
              is_featured: !!r.is_featured,
              is_trending: !!r.is_trending,
              read_time_minutes: r.read_time_minutes || 3,
              created_at: new Date(r.created_at).toISOString(),
              updated_at: new Date(r.updated_at).toISOString(),
            })),
            comments: commentsRes.rows.map(r => ({
              id: r.id,
              article_id: r.article_id,
              user_id: r.user_id,
              user_name: r.user_name,
              user_image: r.user_image || '',
              comment: r.comment,
              created_at: new Date(r.created_at).toISOString(),
            })),
            likes: likesRes.rows.map(r => ({
              id: r.id,
              article_id: r.article_id,
              user_id: r.user_id,
            })),
            bookmarks: bookmarksRes.rows.map(r => ({
              id: r.id,
              article_id: r.article_id,
              user_id: r.user_id,
              created_at: new Date(r.created_at).toISOString(),
            })),
          };

          // Cache permanently loaded data to disk
          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
          } catch (_) {}
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[PostgreSQL] Initialization error:', err);
    }
  }

  public async syncToPostgres() {
    if (!pgPool) return;
    try {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');

        for (const u of this.data.users) {
          await client.query(`
            INSERT INTO users (id, name, email, password_hash, role, profile_image, bio, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              password_hash = EXCLUDED.password_hash,
              role = EXCLUDED.role,
              profile_image = EXCLUDED.profile_image,
              bio = EXCLUDED.bio;
          `, [u.id, u.name, u.email, u.password_hash, u.role, u.profile_image, u.bio, u.created_at]);
        }
        if (this.data.users.length > 0) {
          const validUserIds = this.data.users.map(u => u.id).join(',');
          await client.query(`DELETE FROM users WHERE id NOT IN (${validUserIds})`);
        }
        await client.query(`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));`);

        for (const c of this.data.categories) {
          await client.query(`
            INSERT INTO categories (id, name, slug, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              slug = EXCLUDED.slug,
              description = EXCLUDED.description;
          `, [c.id, c.name, c.slug, c.description]);
        }
        if (this.data.categories.length > 0) {
          const validCatIds = this.data.categories.map(c => c.id).join(',');
          await client.query(`DELETE FROM categories WHERE id NOT IN (${validCatIds})`);
        }
        await client.query(`SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));`);

        for (const a of this.data.articles) {
          await client.query(`
            INSERT INTO articles (id, title, slug, content, summary, image_url, category_id, author_id, author_name, author_image, status, views, is_featured, is_trending, read_time_minutes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              slug = EXCLUDED.slug,
              content = EXCLUDED.content,
              summary = EXCLUDED.summary,
              image_url = EXCLUDED.image_url,
              category_id = EXCLUDED.category_id,
              author_id = EXCLUDED.author_id,
              author_name = EXCLUDED.author_name,
              author_image = EXCLUDED.author_image,
              status = EXCLUDED.status,
              views = EXCLUDED.views,
              is_featured = EXCLUDED.is_featured,
              is_trending = EXCLUDED.is_trending,
              read_time_minutes = EXCLUDED.read_time_minutes,
              updated_at = EXCLUDED.updated_at;
          `, [a.id, a.title, a.slug, a.content, a.summary, a.image_url, a.category_id, a.author_id, a.author_name, a.author_image, a.status, a.views, a.is_featured, a.is_trending, a.read_time_minutes, a.created_at, a.updated_at]);
        }
        if (this.data.articles.length > 0) {
          const validArtIds = this.data.articles.map(a => a.id).join(',');
          await client.query(`DELETE FROM articles WHERE id NOT IN (${validArtIds})`);
        }
        await client.query(`SELECT setval('articles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM articles));`);

        await client.query('DELETE FROM comments');
        for (const c of this.data.comments) {
          await client.query(`
            INSERT INTO comments (id, article_id, user_id, user_name, user_image, comment, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
          `, [c.id, c.article_id, c.user_id, c.user_name, c.user_image, c.comment, c.created_at]);
        }
        await client.query(`SELECT setval('comments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM comments));`);

        await client.query('DELETE FROM likes');
        for (const l of this.data.likes) {
          await client.query(`
            INSERT INTO likes (id, article_id, user_id)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING;
          `, [l.id, l.article_id, l.user_id]);
        }
        await client.query(`SELECT setval('likes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM likes));`);

        await client.query('DELETE FROM bookmarks');
        for (const b of this.data.bookmarks) {
          await client.query(`
            INSERT INTO bookmarks (id, article_id, user_id, created_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING;
          `, [b.id, b.article_id, b.user_id, b.created_at]);
        }
        await client.query(`SELECT setval('bookmarks_id_seq', (SELECT COALESCE(MAX(id), 1) FROM bookmarks));`);

        await client.query('COMMIT');
        console.log(`[PostgreSQL] Permanently synced to Neon (${this.data.articles.length} articles, ${this.data.users.length} users, ${this.data.comments.length} comments)`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('[PostgreSQL] Sync transaction failed:', err);
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[PostgreSQL] Error in syncToPostgres:', err);
      throw err;
    }
  }

  public async save(): Promise<void> {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed saving DB file cache', err);
    }
    if (pgPool) {
      // Serialize database write operations using a promise queue to guarantee consistency
      this.syncQueue = this.syncQueue
        .then(async () => {
          await this.syncToPostgres();
        })
        .catch(err => {
          console.error('[PostgreSQL] Queued sync error:', err);
        });
      return this.syncQueue;
    }
  }

  public async reset() {
    this.data = getInitialSeedData();
    await this.save();
    return this.data;
  }

  public get users() { return this.data.users; }
  public get categories() { return this.data.categories; }
  public get articles() { return this.data.articles; }
  public get comments() { return this.data.comments; }
  public get likes() { return this.data.likes; }
  public get bookmarks() { return this.data.bookmarks; }
}

const db = new DB();

// In-memory verification code store for password reset
const resetCodes = new Map<string, { code: string; expiresAt: number }>();

// Helper to extract JWT user
interface AuthRequest extends express.Request {
  user?: {
    id: number;
    email: string;
    role: 'user' | 'admin';
    name: string;
  };
}

function authenticateToken(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = decoded;
    next();
  });
}

function optionalAuthenticateToken(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (!err && decoded) {
      req.user = decoded;
    }
    next();
  });
}

function requireAdmin(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

async function startServer() {
  await db.initPostgres();

  const app = express();

  app.use(cors());
  app.use(express.json());

  // GET /api/health - Database & Server Health Check
  app.get('/api/health', async (req, res) => {
    let pgStatus = 'disconnected';
    let dbTime = null;
    let neonCounts = null;
    if (pgPool) {
      try {
        const check = await pgPool.query('SELECT NOW() as now');
        pgStatus = 'connected';
        dbTime = check.rows[0].now;
        const artCount = await pgPool.query('SELECT count(*) FROM articles');
        const usrCount = await pgPool.query('SELECT count(*) FROM users');
        neonCounts = {
          articles: parseInt(artCount.rows[0].count, 10),
          users: parseInt(usrCount.rows[0].count, 10),
        };
      } catch (e: any) {
        pgStatus = `error: ${e.message}`;
      }
    }
    res.json({
      status: 'ok',
      database: pgStatus,
      engine: 'PostgreSQL (Neon)',
      permanent_storage: true,
      timestamp: dbTime || new Date().toISOString(),
      user_count: db.users.length,
      article_count: db.articles.length,
      neon_counts: neonCounts,
    });
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // POST /api/auth/register
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const newUser: User = {
      id: db.users.length ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
      name: name.trim(),
      email: normalizedEmail,
      password_hash,
      role: 'user',
      profile_image: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80`,
      bio: 'Avid reader and contributor on NewsHub.',
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser);
    await db.save();

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash: _, ...safeUser } = newUser;
    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: safeUser,
    });
  });

  // POST /api/auth/login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash: _, ...safeUser } = user;
    res.json({
      message: 'Logged in successfully.',
      token,
      user: safeUser,
    });
  });

  // GET /api/auth/me
  app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res) => {
    const user = db.users.find(u => u.id === req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const { password_hash: _, ...safeUser } = user;
    const userBookmarksCount = db.bookmarks.filter(b => b.user_id === user.id).length;
    const userLikesCount = db.likes.filter(l => l.user_id === user.id).length;
    const userCommentsCount = db.comments.filter(c => c.user_id === user.id).length;

    res.json({
      user: safeUser,
      stats: {
        bookmarksCount: userBookmarksCount,
        likesCount: userLikesCount,
        commentsCount: userCommentsCount,
      },
    });
  });

  // PUT /api/auth/profile
  app.put('/api/auth/profile', authenticateToken, async (req: AuthRequest, res) => {
    const user = db.users.find(u => u.id === req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { name, email, bio, profile_image } = req.body;
    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (profile_image) user.profile_image = profile_image.trim();

    let emailChanged = false;
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const normalizedEmail = email.trim().toLowerCase();
      // Basic email regex validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      // Check if email already in use
      const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail && u.id !== user.id);
      if (existing) {
        return res.status(409).json({ error: 'This email address is already in use by another account.' });
      }

      user.email = normalizedEmail;
      emailChanged = true;
    }

    await db.save();

    // Re-issue JWT token with the new email
    const newToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash: _, ...safeUser } = user;
    res.json({
      message: emailChanged ? 'Profile and email updated successfully.' : 'Profile updated successfully.',
      user: safeUser,
      token: newToken,
      email_changed: emailChanged,
    });
  });

  // POST /api/auth/change-password (Authenticated user changes password)
  app.post('/api/auth/change-password', authenticateToken, async (req: AuthRequest, res) => {
    const user = db.users.find(u => u.id === req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }

    const isValid = bcrypt.compareSync(current_password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    user.password_hash = bcrypt.hashSync(new_password, 10);
    await db.save();

    res.json({ message: 'Password updated successfully.' });
  });

  // POST /api/auth/forgot-password (Generate reset OTP/code)
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodes.set(normalizedEmail, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    res.json({
      message: 'Password reset verification code generated.',
      email: normalizedEmail,
      code, // Returned for easy testing and display in developer/preview UI
    });
  });

  // POST /api/auth/reset-password (Verify code & set new password)
  app.post('/api/auth/reset-password', async (req, res) => {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const stored = resetCodes.get(normalizedEmail);
    if (!stored || stored.code !== code.trim()) {
      return res.status(400).json({ error: 'Invalid or incorrect verification code.' });
    }

    if (Date.now() > stored.expiresAt) {
      resetCodes.delete(normalizedEmail);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    user.password_hash = bcrypt.hashSync(new_password, 10);
    await db.save();
    resetCodes.delete(normalizedEmail);

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  });

  // POST /api/reset-data (Reset platform data to clean seed state)
  app.post('/api/reset-data', async (req, res) => {
    await db.reset();
    resetCodes.clear();
    res.json({
      message: 'Platform database has been reset to initial seed state.',
      articles_count: db.articles.length,
      users_count: db.users.length,
      categories_count: db.categories.length,
    });
  });

  // ==========================================
  // CATEGORIES ROUTES
  // ==========================================

  // GET /api/categories
  app.get('/api/categories', (req, res) => {
    const categoriesWithCount = db.categories.map(c => {
      const articleCount = db.articles.filter(a => a.category_id === c.id && a.status === 'published').length;
      return { ...c, article_count: articleCount };
    });
    res.json(categoriesWithCount);
  });

  // POST /api/categories (Admin only)
  app.post('/api/categories', authenticateToken, requireAdmin, async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = db.categories.find(c => c.slug === slug || c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Category already exists.' });
    }

    const newCategory: Category = {
      id: db.categories.length ? Math.max(...db.categories.map(c => c.id)) + 1 : 1,
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
    };

    db.categories.push(newCategory);
    await db.save();

    res.status(201).json({ message: 'Category created successfully.', category: newCategory });
  });

  // PUT /api/categories/:id (Admin only)
  app.put('/api/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const category = db.categories.find(c => c.id === id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const { name, description } = req.body;
    if (name) {
      category.name = name.trim();
      category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (description !== undefined) {
      category.description = description.trim();
    }

    await db.save();
    res.json({ message: 'Category updated successfully.', category });
  });

  // DELETE /api/categories/:id (Admin only)
  app.delete('/api/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = db.categories.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check if articles are assigned to this category
    const linkedArticles = db.articles.filter(a => a.category_id === id);
    if (linkedArticles.length > 0) {
      return res.status(400).json({
        error: `Cannot delete category: ${linkedArticles.length} article(s) are currently assigned to it. Reassign or delete them first.`,
      });
    }

    db.categories.splice(index, 1);
    await db.save();
    res.json({ message: 'Category deleted successfully.' });
  });

  // ==========================================
  // ARTICLES ROUTES
  // ==========================================

  // GET /api/articles/search?q=
  app.get('/api/articles/search', optionalAuthenticateToken, (req: AuthRequest, res) => {
    const q = ((req.query.q as string) || '').trim().toLowerCase();
    if (!q) {
      return res.json([]);
    }

    const matching = db.articles
      .filter(a => a.status === 'published')
      .filter(a => {
        return (
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.author_name.toLowerCase().includes(q)
        );
      })
      .map(article => {
        const category = db.categories.find(c => c.id === article.category_id);
        const likeCount = db.likes.filter(l => l.article_id === article.id).length;
        const commentCount = db.comments.filter(c => c.article_id === article.id).length;
        const isLiked = req.user ? db.likes.some(l => l.article_id === article.id && l.user_id === req.user!.id) : false;
        const isBookmarked = req.user ? db.bookmarks.some(b => b.article_id === article.id && b.user_id === req.user!.id) : false;

        return {
          ...article,
          category_name: category ? category.name : 'General',
          category_slug: category ? category.slug : 'general',
          like_count: likeCount,
          comment_count: commentCount,
          is_liked: isLiked,
          is_bookmarked: isBookmarked,
        };
      });

    res.json(matching);
  });

  // GET /api/articles/trending
  app.get('/api/articles/trending', optionalAuthenticateToken, (req: AuthRequest, res) => {
    const trending = db.articles
      .filter(a => a.status === 'published')
      .sort((a, b) => (b.views + db.likes.filter(l => l.article_id === b.id).length * 5) - (a.views + db.likes.filter(l => l.article_id === a.id).length * 5))
      .slice(0, 5)
      .map(article => {
        const category = db.categories.find(c => c.id === article.category_id);
        const likeCount = db.likes.filter(l => l.article_id === article.id).length;
        const commentCount = db.comments.filter(c => c.article_id === article.id).length;
        const isLiked = req.user ? db.likes.some(l => l.article_id === article.id && l.user_id === req.user!.id) : false;
        const isBookmarked = req.user ? db.bookmarks.some(b => b.article_id === article.id && b.user_id === req.user!.id) : false;

        return {
          ...article,
          category_name: category ? category.name : 'General',
          category_slug: category ? category.slug : 'general',
          like_count: likeCount,
          comment_count: commentCount,
          is_liked: isLiked,
          is_bookmarked: isBookmarked,
        };
      });

    res.json(trending);
  });

  // GET /api/articles
  app.get('/api/articles', optionalAuthenticateToken, (req: AuthRequest, res) => {
    const categorySlugOrId = req.query.category as string;
    const status = req.query.status as string;
    const featured = req.query.featured === 'true';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 9;

    let filtered = [...db.articles];

    // Status filter (admin can view drafts, public only sees published)
    if (status) {
      filtered = filtered.filter(a => a.status === status);
    } else if (!req.user || req.user.role !== 'admin') {
      filtered = filtered.filter(a => a.status === 'published');
    }

    // Category filter
    if (categorySlugOrId) {
      const cat = db.categories.find(
        c => c.slug.toLowerCase() === categorySlugOrId.toLowerCase() || c.id.toString() === categorySlugOrId
      );
      if (cat) {
        filtered = filtered.filter(a => a.category_id === cat.id);
      }
    }

    // Featured filter
    if (featured) {
      filtered = filtered.filter(a => a.is_featured);
    }

    // Sort by latest created_at
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    const items = paginated.map(article => {
      const category = db.categories.find(c => c.id === article.category_id);
      const likeCount = db.likes.filter(l => l.article_id === article.id).length;
      const commentCount = db.comments.filter(c => c.article_id === article.id).length;
      const isLiked = req.user ? db.likes.some(l => l.article_id === article.id && l.user_id === req.user!.id) : false;
      const isBookmarked = req.user ? db.bookmarks.some(b => b.article_id === article.id && b.user_id === req.user!.id) : false;

      return {
        ...article,
        category_name: category ? category.name : 'General',
        category_slug: category ? category.slug : 'general',
        like_count: likeCount,
        comment_count: commentCount,
        is_liked: isLiked,
        is_bookmarked: isBookmarked,
      };
    });

    res.json({
      articles: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  });

  // GET /api/articles/:id
  app.get('/api/articles/:id', optionalAuthenticateToken, (req: AuthRequest, res) => {
    const idOrSlug = req.params.id;
    const article = db.articles.find(a => a.id.toString() === idOrSlug || a.slug === idOrSlug);

    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    // Increment views
    article.views += 1;
    db.save();

    const category = db.categories.find(c => c.id === article.category_id);
    const likeCount = db.likes.filter(l => l.article_id === article.id).length;
    const commentCount = db.comments.filter(c => c.article_id === article.id).length;
    const isLiked = req.user ? db.likes.some(l => l.article_id === article.id && l.user_id === req.user!.id) : false;
    const isBookmarked = req.user ? db.bookmarks.some(b => b.article_id === article.id && b.user_id === req.user!.id) : false;

    // Fetch 3 related articles from same category
    const related = db.articles
      .filter(a => a.id !== article.id && a.category_id === article.category_id && a.status === 'published')
      .slice(0, 3)
      .map(r => {
        const cat = db.categories.find(c => c.id === r.category_id);
        return {
          id: r.id,
          title: r.title,
          slug: r.slug,
          summary: r.summary,
          image_url: r.image_url,
          created_at: r.created_at,
          category_name: cat ? cat.name : 'General',
          read_time_minutes: r.read_time_minutes,
        };
      });

    res.json({
      article: {
        ...article,
        category_name: category ? category.name : 'General',
        category_slug: category ? category.slug : 'general',
        like_count: likeCount,
        comment_count: commentCount,
        is_liked: isLiked,
        is_bookmarked: isBookmarked,
      },
      related,
    });
  });

  // POST /api/articles (Admin only)
  app.post('/api/articles', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    const { title, content, summary, image_url, category_id, status, is_featured } = req.body;

    if (!title || !content || !category_id) {
      return res.status(400).json({ error: 'Title, content, and category are required.' });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const author = db.users.find(u => u.id === req.user!.id);
    const words = content.trim().split(/\s+/).length;
    const read_time_minutes = Math.max(1, Math.ceil(words / 200));

    const newArticle: Article = {
      id: db.articles.length ? Math.max(...db.articles.map(a => a.id)) + 1 : 1,
      title: title.trim(),
      slug,
      content: content.trim(),
      summary: summary ? summary.trim() : content.slice(0, 160) + '...',
      image_url: image_url ? image_url.trim() : 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
      category_id: parseInt(category_id, 10),
      author_id: req.user!.id,
      author_name: author ? author.name : req.user!.name,
      author_image: author ? author.profile_image : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      status: status === 'draft' ? 'draft' : 'published',
      views: 0,
      is_featured: !!is_featured,
      is_trending: false,
      read_time_minutes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.articles.unshift(newArticle);
    await db.save();

    res.status(201).json({ message: 'Article created successfully.', article: newArticle });
  });

  // PUT /api/articles/:id (Admin only)
  app.put('/api/articles/:id', authenticateToken, requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const article = db.articles.find(a => a.id === id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    const { title, content, summary, image_url, category_id, status, is_featured, is_trending } = req.body;

    if (title) article.title = title.trim();
    if (content) {
      article.content = content.trim();
      const words = article.content.split(/\s+/).length;
      article.read_time_minutes = Math.max(1, Math.ceil(words / 200));
    }
    if (summary !== undefined) article.summary = summary.trim();
    if (image_url) article.image_url = image_url.trim();
    if (category_id) article.category_id = parseInt(category_id, 10);
    if (status) article.status = status;
    if (is_featured !== undefined) article.is_featured = !!is_featured;
    if (is_trending !== undefined) article.is_trending = !!is_trending;

    article.updated_at = new Date().toISOString();
    await db.save();

    res.json({ message: 'Article updated successfully.', article });
  });

  // PUT /api/articles/:id/status (Admin quick toggle publish/unpublish)
  app.put('/api/articles/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const article = db.articles.find(a => a.id === id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    article.status = article.status === 'published' ? 'draft' : 'published';
    article.updated_at = new Date().toISOString();
    await db.save();

    res.json({ message: `Article status changed to ${article.status}.`, article });
  });

  // DELETE /api/articles/:id (Admin only)
  app.delete('/api/articles/:id', authenticateToken, requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = db.articles.findIndex(a => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    // Cascade delete comments, likes, and bookmarks
    db.articles.splice(index, 1);
    const newComments = db.comments.filter(c => c.article_id !== id);
    const newLikes = db.likes.filter(l => l.article_id !== id);
    const newBookmarks = db.bookmarks.filter(b => b.article_id !== id);

    // Replace in database schema
    (db as any).data.comments = newComments;
    (db as any).data.likes = newLikes;
    (db as any).data.bookmarks = newBookmarks;
    await db.save();

    res.json({ message: 'Article and associated interactions deleted successfully.' });
  });

  // POST /api/articles/:id/summary (Gemini AI Summary with graceful fallback)
  app.post('/api/articles/:id/summary', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const article = db.articles.find(a => a.id === id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    try {
      if (geminiClient && process.env.GEMINI_API_KEY) {
        const prompt = `You are an expert news editor. Please generate a compelling, high-impact executive summary for this news article.
Format your response as:
1. An overarching one-sentence bottom-line takeaway.
2. Three clear, bulleted key insights summarizing crucial details.

Article Title: "${article.title}"
Content:
${article.content.slice(0, 3500)}`;

        const response = await geminiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const generatedText = response.text;
        if (generatedText && generatedText.trim().length > 0) {
          return res.json({
            summary: generatedText.trim(),
            source: 'gemini-3.8-flash',
            article_id: article.id,
          });
        }
      }
    } catch (err: any) {
      console.warn('Gemini API call encountered an issue, falling back to smart extractive summary:', err?.message || err);
    }

    // Graceful Fallback Summary (Never breaks the app!)
    const paragraphs = article.content
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 40 && !p.startsWith('#') && !p.startsWith('>'));

    const leadSummary = article.summary || paragraphs[0] || article.title;
    const point1 = paragraphs[0] || 'Comprehensive reporting on recent industry breakthroughs and technological deployment.';
    const point2 = paragraphs[1] || 'Global economic, societal, and regulatory impacts analyzed across key stakeholders.';
    const point3 = paragraphs[2] || 'Experts forecast accelerated implementation timelines with positive market signals.';

    const fallbackText = `**Bottom Line:** ${leadSummary}

• **Core Breakthrough:** ${point1.slice(0, 180)}...
• **Market & Society:** ${point2.slice(0, 180)}...
• **Future Outlook:** ${point3.slice(0, 180)}...`;

    return res.json({
      summary: fallbackText,
      source: 'smart-fallback',
      note: 'Generated using local contextual analysis.',
      article_id: article.id,
    });
  });

  // ==========================================
  // COMMENTS ROUTES
  // ==========================================

  // GET /api/articles/:id/comments
  app.get('/api/articles/:id/comments', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const articleComments = db.comments
      .filter(c => c.article_id === id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json(articleComments);
  });

  // POST /api/articles/:id/comments
  app.post('/api/articles/:id/comments', authenticateToken, (req: AuthRequest, res) => {
    const articleId = parseInt(req.params.id, 10);
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    const article = db.articles.find(a => a.id === articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    const user = db.users.find(u => u.id === req.user!.id);
    const newComment: Comment = {
      id: db.comments.length ? Math.max(...db.comments.map(c => c.id)) + 1 : 1,
      article_id: articleId,
      user_id: req.user!.id,
      user_name: user ? user.name : req.user!.name,
      user_image: user ? user.profile_image : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      comment: comment.trim(),
      created_at: new Date().toISOString(),
    };

    db.comments.unshift(newComment);
    db.save();

    res.status(201).json({ message: 'Comment posted successfully.', comment: newComment });
  });

  // DELETE /api/comments/:id
  app.delete('/api/comments/:id', authenticateToken, (req: AuthRequest, res) => {
    const id = parseInt(req.params.id, 10);
    const comment = db.comments.find(c => c.id === id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Only comment author or admin can delete
    if (comment.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this comment.' });
    }

    const index = db.comments.findIndex(c => c.id === id);
    db.comments.splice(index, 1);
    db.save();

    res.json({ message: 'Comment deleted successfully.' });
  });

  // ==========================================
  // LIKES ROUTES
  // ==========================================

  // POST /api/articles/:id/like (Toggle like or ensure liked)
  app.post('/api/articles/:id/like', authenticateToken, (req: AuthRequest, res) => {
    const articleId = parseInt(req.params.id, 10);
    const article = db.articles.find(a => a.id === articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    const existingIndex = db.likes.findIndex(l => l.article_id === articleId && l.user_id === req.user!.id);
    let isLiked = false;

    if (existingIndex > -1) {
      // Toggle off
      db.likes.splice(existingIndex, 1);
      isLiked = false;
    } else {
      // Toggle on
      const newLike: Like = {
        id: db.likes.length ? Math.max(...db.likes.map(l => l.id)) + 1 : 1,
        article_id: articleId,
        user_id: req.user!.id,
      };
      db.likes.push(newLike);
      isLiked = true;
    }

    db.save();
    const likeCount = db.likes.filter(l => l.article_id === articleId).length;

    res.json({
      is_liked: isLiked,
      like_count: likeCount,
      message: isLiked ? 'Article liked.' : 'Like removed.',
    });
  });

  // DELETE /api/articles/:id/like
  app.delete('/api/articles/:id/like', authenticateToken, (req: AuthRequest, res) => {
    const articleId = parseInt(req.params.id, 10);
    const index = db.likes.findIndex(l => l.article_id === articleId && l.user_id === req.user!.id);

    if (index > -1) {
      db.likes.splice(index, 1);
      db.save();
    }

    const likeCount = db.likes.filter(l => l.article_id === articleId).length;
    res.json({ is_liked: false, like_count: likeCount, message: 'Like removed.' });
  });

  // ==========================================
  // BOOKMARKS ROUTES
  // ==========================================

  // GET /api/bookmarks
  app.get('/api/bookmarks', authenticateToken, (req: AuthRequest, res) => {
    const userBookmarks = db.bookmarks.filter(b => b.user_id === req.user!.id);
    const bookmarkedArticleIds = new Set(userBookmarks.map(b => b.article_id));

    const savedArticles = db.articles
      .filter(a => bookmarkedArticleIds.has(a.id))
      .map(article => {
        const category = db.categories.find(c => c.id === article.category_id);
        const likeCount = db.likes.filter(l => l.article_id === article.id).length;
        const commentCount = db.comments.filter(c => c.article_id === article.id).length;
        const isLiked = db.likes.some(l => l.article_id === article.id && l.user_id === req.user!.id);

        return {
          ...article,
          category_name: category ? category.name : 'General',
          category_slug: category ? category.slug : 'general',
          like_count: likeCount,
          comment_count: commentCount,
          is_liked: isLiked,
          is_bookmarked: true,
        };
      });

    res.json(savedArticles);
  });

  // POST /api/articles/:id/bookmark (Toggle bookmark)
  app.post('/api/articles/:id/bookmark', authenticateToken, (req: AuthRequest, res) => {
    const articleId = parseInt(req.params.id, 10);
    const article = db.articles.find(a => a.id === articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    const existingIndex = db.bookmarks.findIndex(b => b.article_id === articleId && b.user_id === req.user!.id);
    let isBookmarked = false;

    if (existingIndex > -1) {
      db.bookmarks.splice(existingIndex, 1);
      isBookmarked = false;
    } else {
      const newBookmark: Bookmark = {
        id: db.bookmarks.length ? Math.max(...db.bookmarks.map(b => b.id)) + 1 : 1,
        article_id: articleId,
        user_id: req.user!.id,
        created_at: new Date().toISOString(),
      };
      db.bookmarks.push(newBookmark);
      isBookmarked = true;
    }

    db.save();
    res.json({
      is_bookmarked: isBookmarked,
      message: isBookmarked ? 'Article saved to bookmarks.' : 'Article removed from bookmarks.',
    });
  });

  // DELETE /api/articles/:id/bookmark
  app.delete('/api/articles/:id/bookmark', authenticateToken, (req: AuthRequest, res) => {
    const articleId = parseInt(req.params.id, 10);
    const index = db.bookmarks.findIndex(b => b.article_id === articleId && b.user_id === req.user!.id);

    if (index > -1) {
      db.bookmarks.splice(index, 1);
      db.save();
    }

    res.json({ is_bookmarked: false, message: 'Article removed from bookmarks.' });
  });

  // ==========================================
  // ADMIN DASHBOARD ROUTES
  // ==========================================

  // GET /api/admin/stats
  app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
    const totalUsers = db.users.length;
    const totalArticles = db.articles.length;
    const publishedArticles = db.articles.filter(a => a.status === 'published').length;
    const draftArticles = db.articles.filter(a => a.status === 'draft').length;
    const totalComments = db.comments.length;
    const totalCategories = db.categories.length;
    const totalLikes = db.likes.length;
    const totalViews = db.articles.reduce((acc, a) => acc + (a.views || 0), 0);

    // Category breakdown
    const categoryDistribution = db.categories.map(c => ({
      name: c.name,
      count: db.articles.filter(a => a.category_id === c.id).length,
    }));

    // Top viewed articles
    const topArticles = [...db.articles]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        title: a.title,
        views: a.views,
        status: a.status,
        likes: db.likes.filter(l => l.article_id === a.id).length,
      }));

    res.json({
      totalUsers,
      totalArticles,
      publishedArticles,
      draftArticles,
      totalComments,
      totalCategories,
      totalLikes,
      totalViews,
      categoryDistribution,
      topArticles,
    });
  });

  // GET /api/admin/users
  app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    const usersWithStats = db.users.map(u => {
      const { password_hash: _, ...safe } = u;
      return {
        ...safe,
        comments_count: db.comments.filter(c => c.user_id === u.id).length,
        bookmarks_count: db.bookmarks.filter(b => b.user_id === u.id).length,
        articles_count: db.articles.filter(a => a.author_id === u.id).length,
      };
    });
    res.json(usersWithStats);
  });

  // PUT /api/admin/users/:id/role
  app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
    const id = parseInt(req.params.id, 10);
    const targetUser = db.users.find(u => u.id === id);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetUser.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot modify your own administrator role.' });
    }

    const { role } = req.body;
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ error: 'Role must be user or admin.' });
    }

    targetUser.role = role;
    db.save();

    const { password_hash: _, ...safe } = targetUser;
    res.json({ message: `User role updated to ${role}.`, user: safe });
  });

  // PUT /api/admin/users/:id/email (Admin changes user email)
  app.put('/api/admin/users/:id/email', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
    const id = parseInt(req.params.id, 10);
    const targetUser = db.users.find(u => u.id === id);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail && u.id !== id);
    if (existing) {
      return res.status(409).json({ error: 'This email address is already in use by another account.' });
    }

    targetUser.email = normalizedEmail;
    db.save();

    const { password_hash: _, ...safe } = targetUser;
    res.json({ message: 'User email updated successfully.', user: safe });
  });

  // DELETE /api/admin/users/:id
  app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req: AuthRequest, res) => {
    const id = parseInt(req.params.id, 10);
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account while logged in as admin.' });
    }

    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.users.splice(index, 1);
    db.save();
    res.json({ message: 'User deleted successfully.' });
  });

  // GET /api/admin/comments
  app.get('/api/admin/comments', authenticateToken, requireAdmin, (req, res) => {
    const commentsDetailed = db.comments.map(c => {
      const article = db.articles.find(a => a.id === c.article_id);
      return {
        ...c,
        article_title: article ? article.title : 'Deleted Article',
        article_slug: article ? article.slug : '#',
      };
    });
    res.json(commentsDetailed);
  });

  // ==========================================
  // VITE DEV SERVER / PRODUCTION STATIC SERVING
  // ==========================================

  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NewsHub Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server failed to start:', err);
});
