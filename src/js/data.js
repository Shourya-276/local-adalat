/**
 * @file data.js
 * @description Centralized demo & static data repository for Lokal Adalat legal portal.
 */

export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80';

export const demoImages = {
  gavelMarble: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
  courtroomHall: 'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?auto=format&fit=crop&w=800&q=80',
  scalesClose: 'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?auto=format&fit=crop&w=800&q=80',
  scalesDesk: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=800&q=80',
  supremeCourtDome: '/images/supreme-court.jpg',
  courtroomWood: '/images/courtroom.jpg',
  bookGavel: 'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?auto=format&fit=crop&w=800&q=80',
  woodenGavel: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  courtGarden: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
  legalBriefs: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
  lawLibrary: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80'
};

// Section 1: Top Stories
export const defaultTopStories = [
  {
    id: 101,
    title: 'Supreme Court Begins Hearing on Landmark Digital Privacy Framework',
    court: 'SUPREME COURT',
    image: demoImages.supremeCourtDome,
    publishDate: '17 July 2025',
    readTime: '8 min',
    targetSection: 'top-stories-sec',
    status: 'published',
    excerpt: 'A five-judge Constitution Bench convened this week to examine substantive privacy safeguards under the DPDP Act.'
  },
  {
    id: 102,
    title: 'Delhi HC Directs Government to File Response on Electoral Bonds Case',
    court: 'HIGH COURT',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    publishDate: '17 July 2025',
    readTime: '5 min',
    targetSection: 'top-stories-sec',
    status: 'published'
  },
  {
    id: 103,
    title: 'Constitution Bench to Examine Scope of Fundamental Rights Online',
    court: 'SUPREME COURT',
    image: demoImages.courtGarden,
    publishDate: '16 July 2025',
    readTime: '6 min',
    targetSection: 'top-stories-sec',
    status: 'published'
  },
  {
    id: 104,
    title: 'Sessions Court Acquits Three in High-Profile Corporate Fraud Case',
    court: 'SESSIONS COURT',
    image: demoImages.supremeCourtDome,
    publishDate: '16 July 2025',
    readTime: '4 min',
    targetSection: 'top-stories-sec',
    status: 'published'
  },
  {
    id: 105,
    title: 'Bombay HC Stays Order on Media Regulation Guidelines',
    court: 'HIGH COURT',
    image: demoImages.courtroomWood,
    publishDate: '15 July 2025',
    readTime: '3 min',
    targetSection: 'top-stories-sec',
    status: 'published'
  }
];

// Section 2: Latest News (Distinct court-filtered news items)
export const defaultLatestNews = [
  // --- SUPREME COURT ARTICLES ---
  {
    id: 201,
    title: 'Supreme Court Clarifies Digital Search and Seizure Rules',
    court: 'SUPREME COURT',
    image: demoImages.gavelMarble,
    publishDate: '17 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 202,
    title: 'Constitution Bench Hears Data Protection Challenge',
    court: 'SUPREME COURT',
    image: demoImages.courtroomHall,
    publishDate: '17 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 203,
    title: 'Supreme Court Bench Refuses Stay on New Arbitration Guidelines',
    court: 'SUPREME COURT',
    image: demoImages.scalesClose,
    publishDate: '17 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 204,
    title: 'Apex Court Sets Up Special Bench for Environmental Writs',
    court: 'SUPREME COURT',
    image: demoImages.scalesDesk,
    publishDate: '17 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 205,
    title: 'CJI Remarks on Digital Access and Transparency in Legal System',
    court: 'SUPREME COURT',
    image: demoImages.supremeCourtDome,
    publishDate: '17 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 206,
    title: 'Supreme Court Standardises Bail Application Timelines Across States',
    court: 'SUPREME COURT',
    image: demoImages.courtroomWood,
    publishDate: '17 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 207,
    title: 'CJI Orders Expedited Hearing on Fundamental Rights Petition',
    court: 'SUPREME COURT',
    image: demoImages.bookGavel,
    publishDate: '16 July 2025',
    readTime: '4 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 208,
    title: 'SC Upholds Right to Financial Privacy in Corporate Audit Plea',
    court: 'SUPREME COURT',
    image: demoImages.woodenGavel,
    publishDate: '17 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 209,
    title: 'Landmark SC Ruling on Section 482 CrPC Inherent Powers',
    court: 'SUPREME COURT',
    image: demoImages.courtGarden,
    publishDate: '17 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },

  // --- HIGH COURT ARTICLES ---
  {
    id: 210,
    title: 'Delhi High Court Directs Response on Electoral Reforms Petition',
    court: 'HIGH COURT',
    image: demoImages.courtroomHall,
    publishDate: '17 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 211,
    title: 'Bombay High Court Stays Order on Media Broadcasting Norms',
    court: 'HIGH COURT',
    image: demoImages.courtroomWood,
    publishDate: '17 July 2025',
    readTime: '4 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 212,
    title: 'Madras High Court Issues Landmark Ruling on Digital Copyright Suits',
    court: 'HIGH COURT',
    image: demoImages.scalesDesk,
    publishDate: '16 July 2025',
    readTime: '6 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 213,
    title: 'Karnataka High Court Orders Status Quo in Infrastructure Tender Dispute',
    court: 'HIGH COURT',
    image: demoImages.gavelMarble,
    publishDate: '16 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 214,
    title: 'Calcutta High Court Quashes Procedural Penalty in Tax Assessment',
    court: 'HIGH COURT',
    image: demoImages.legalBriefs,
    publishDate: '15 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 215,
    title: 'Allahabad High Court Directs Speedy Disposal of Land Appeals',
    court: 'HIGH COURT',
    image: demoImages.scalesClose,
    publishDate: '15 July 2025',
    readTime: '4 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 216,
    title: 'Gujarat High Court Clarifies Jurisdiction Boundaries in GST Seizure Cases',
    court: 'HIGH COURT',
    image: demoImages.lawLibrary,
    publishDate: '14 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 217,
    title: 'Kerala High Court Mandates Strict Environmental Audits for Coastal Units',
    court: 'HIGH COURT',
    image: demoImages.courtGarden,
    publishDate: '14 July 2025',
    readTime: '6 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 218,
    title: 'Punjab & Haryana HC Grants Relief to State Service Applicants',
    court: 'HIGH COURT',
    image: demoImages.bookGavel,
    publishDate: '13 July 2025',
    readTime: '4 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },

  // --- SESSIONS COURT ARTICLES ---
  {
    id: 219,
    title: 'Sessions Court Acquits Three in High-Profile Corporate Fraud Trial',
    court: 'SESSIONS COURT',
    image: demoImages.supremeCourtDome,
    publishDate: '17 July 2025',
    readTime: '4 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 220,
    title: 'City Sessions Court Grants Bail in Economic Offences Investigation',
    court: 'SESSIONS COURT',
    image: demoImages.woodenGavel,
    publishDate: '17 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 221,
    title: 'District Sessions Judge Orders Day-to-Day Trial in Commercial Case',
    court: 'SESSIONS COURT',
    image: demoImages.gavelMarble,
    publishDate: '16 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 222,
    title: 'Sessions Court Rejects Custody Extension Request in Cyber Crime Probe',
    court: 'SESSIONS COURT',
    image: demoImages.courtroomWood,
    publishDate: '16 July 2025',
    readTime: '4 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 223,
    title: 'Trial Court Frames Charges in Breach of Financial Trust Suit',
    court: 'SESSIONS COURT',
    image: demoImages.scalesDesk,
    publishDate: '15 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 224,
    title: 'Sessions Bench Orders Forensic Audit of Electronic Evidence Submissions',
    court: 'SESSIONS COURT',
    image: demoImages.scalesClose,
    publishDate: '15 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 225,
    title: 'Sessions Judge Upholds Injunction Order in Property Dispute Appeal',
    court: 'SESSIONS COURT',
    image: demoImages.legalBriefs,
    publishDate: '14 July 2025',
    readTime: '4 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 226,
    title: 'Sessions Court Summons Key Witnesses in Private Defamation Suit',
    court: 'SESSIONS COURT',
    image: demoImages.lawLibrary,
    publishDate: '14 July 2025',
    readTime: '5 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  },
  {
    id: 227,
    title: 'Trial Judge Grants Interim Protection in Financial Discrepancy Suit',
    court: 'SESSIONS COURT',
    image: demoImages.courtroomHall,
    publishDate: '13 July 2025',
    readTime: '4 min',
    targetSection: 'latest-news-sec',
    status: 'published'
  }
];

// Section 3: Video Corner
export const defaultVideos = [
  {
    id: 301,
    isDefault: true,
    title: 'Delhi HC Directs Government to File Response on Electoral Bonds Case',
    court: 'HIGH COURT',
    thumbnail: demoImages.courtroomFront,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '5m 28sec',
    date: '17 July 2025'
  },
  {
    id: 302,
    isDefault: true,
    title: 'Delhi HC Directs Government to File Response on Electoral Bonds Case',
    court: 'HIGH COURT',
    thumbnail: demoImages.courtLawn,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '5m 28sec',
    date: '17 July 2025'
  },
  {
    id: 303,
    isDefault: true,
    title: 'Delhi HC Directs Government to File Response on Electoral Bonds Case',
    court: 'SUPREME COURT',
    thumbnail: demoImages.courtGarden,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '5m 28sec',
    date: '17 July 2025'
  },
  {
    id: 304,
    isDefault: true,
    title: 'Delhi HC Directs Government to File Response on Electoral Bonds Case',
    court: 'HIGH COURT',
    thumbnail: demoImages.courtroomWood,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: '5m 28sec',
    date: '17 July 2025'
  },
  {
    id: 305,
    isDefault: true,
    title: 'Delhi HC Directs Government to File Response on Electoral Bonds Case',
    court: 'SUPREME COURT',
    thumbnail: demoImages.scalesGavel,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '5m 28sec',
    date: '17 July 2025'
  },
  {
    id: 306,
    isDefault: true,
    title: 'Delhi HC Directs Government to File Response on Electoral Bonds Case',
    court: 'HIGH COURT',
    thumbnail: demoImages.scalesBrass,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '5m 28sec',
    date: '17 July 2025'
  },
  {
    id: 307,
    isDefault: true,
    title: 'Delhi HC Directs Government to File Response on Electoral Bonds Case',
    court: 'SUPREME COURT',
    thumbnail: demoImages.supremeCourtDome,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '5m 28sec',
    date: '17 July 2025'
  },
  {
    id: 308,
    isDefault: true,
    title: 'Delhi HC Directs Government to File Response on Electoral Bonds Case',
    court: 'HIGH COURT',
    thumbnail: demoImages.scalesBrass,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: '5 min read',
    date: '17 July 2025'
  },
  {
    id: 309,
    isDefault: true,
    title: 'Delhi HC Directs Government to File Response on Electoral Bonds Case',
    court: 'SUPREME COURT',
    thumbnail: demoImages.courtLawn,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '5m 28sec',
    date: '17 July 2025'
  }
];

// Section 4: Articles to Read
export const defaultArticlesToRead = [
  {
    id: 401,
    title: "Understanding India's New Digital Personal Data Protection Framework",
    court: 'DATA PRIVACY',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
    publishDate: '17 July 2025',
    readTime: '12 min read',
    author: 'Editorial Desk',
    excerpt: "A practical breakdown of compliance obligations, risks, and opportunities for businesses operating in India's evolving data landscape.",
    targetSection: 'articles-to-read-sec',
    status: 'published'
  },
  {
    id: 402,
    title: 'The Evolution of Constitutional Privacy Rights',
    court: 'CONSTITUTIONAL LAW',
    image: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?auto=format&fit=crop&w=800&q=80',
    publishDate: '16 July 2025',
    readTime: '10 min read',
    author: 'Editorial Desk',
    excerpt: 'How recent judgments continue to redefine the relationship between citizens and the State, and what it means for civil liberties.',
    targetSection: 'articles-to-read-sec',
    status: 'published'
  },
  {
    id: 403,
    title: "Understanding India's New Digital Personal Data Protection Framework",
    court: 'LEGAL JURISPRUDENCE',
    image: 'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?auto=format&fit=crop&w=800&q=80',
    publishDate: '15 July 2025',
    readTime: '12 min read',
    author: 'Editorial Desk',
    excerpt: "A practical breakdown of compliance obligations, risks, and opportunities for businesses operating in India's evolving data landscape.",
    targetSection: 'articles-to-read-sec',
    status: 'published'
  },
  {
    id: 404,
    title: 'Decoding the New Criminal Laws: Practical Implications for Trial Courts',
    court: 'CRIMINAL LAW',
    image: demoImages.bookGavel,
    publishDate: '14 July 2025',
    readTime: '7 min read',
    author: 'Senior Advocate R. Sharma',
    excerpt: 'An exhaustive clause-by-clause comparative analysis of procedural changes governing arrest and bail.',
    targetSection: 'articles-to-read-sec',
    status: 'published'
  },
  {
    id: 405,
    title: 'Cross-Border Insolvency in India: Lessons from European Frameworks',
    court: 'COMMERCIAL LAW',
    image: demoImages.legalBriefs,
    publishDate: '13 July 2025',
    readTime: '6 min read',
    author: 'Corporate Law Research Desk',
    excerpt: 'How UNCITRAL model law adoption will influence resolution of multi-jurisdictional distressed assets.',
    targetSection: 'articles-to-read-sec',
    status: 'published'
  },
  {
    id: 406,
    title: 'Environmental Jurisprudence: The Evolution of Public Trust Doctrine',
    court: 'ENVIRONMENTAL LAW',
    image: demoImages.courtGarden,
    publishDate: '12 July 2025',
    readTime: '5 min read',
    author: 'Green Tribunal Legal Desk',
    excerpt: 'Examining recent landmark rulings on intergenerational equity and municipal corporation liabilities.',
    targetSection: 'articles-to-read-sec',
    status: 'published'
  },
  {
    id: 407,
    title: 'Artificial Intelligence and Patent Law: Authorship Standards Under Scrutiny',
    court: 'INTELLECTUAL PROPERTY',
    image: demoImages.lawLibrary,
    publishDate: '11 July 2025',
    readTime: '8 min read',
    author: 'IP & Tech Law Committee',
    excerpt: 'Can non-human autonomous systems be named as inventors under the Patents Act, 1970?',
    targetSection: 'articles-to-read-sec',
    status: 'published'
  }
];

export const categoryArticlesList = [
  ...defaultTopStories,
  ...defaultLatestNews,
  ...defaultArticlesToRead
];
export const topStories = defaultTopStories;
export const latestNewsColumns = [[], [], []];
export const supremeCourtLatestNewsColumns = [[], [], []];
export const highCourtLatestNewsColumns = [[], [], []];
export const sessionsCourtLatestNewsColumns = [[], [], []];
export const videoCornerList = defaultVideos;
export const articlesToReadList = defaultArticlesToRead;
