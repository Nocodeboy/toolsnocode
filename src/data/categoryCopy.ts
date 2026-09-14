export interface CategoryCopy {
  /** H1 de la página. Específico, no "Marketing Tools" a secas. */
  heading: string;
  /** <title> del navegador, máx 60 caracteres. */
  metaTitle: string;
  /** meta description, 140-160 caracteres. */
  metaDescription: string;
  /** 2-3 párrafos, 120-200 palabras en total. Texto plano, sin markdown. */
  intro: string;
}

export const CATEGORY_COPY: Record<string, CategoryCopy> = {
  marketing: {
    heading: 'AI Marketing Tools: Content, Ads and Attribution',
    metaTitle: 'AI Marketing Tools: Content, Ads & Analytics',
    metaDescription:
      'Compare AI marketing tools for content, ad creative, lifecycle email, landing pages and attribution, plus what to check before adding one more subscription.',
    intro:
      'Marketing is the biggest category in this directory, which makes it the hardest one to browse casually. Start from the task instead of the label: writing and repurposing content, generating ad creative and variants, running lifecycle email, building and testing landing pages, or measuring what any of it actually did.\n\nMost listings here fall into three shapes. Generators produce assets and are judged on output quality and how much editing they save you. Orchestration platforms schedule, personalise and route campaigns, so their value depends almost entirely on whether they integrate with your CRM and ad accounts. Analytics and attribution tools explain results, and they are only ever as good as the tracking you can realistically implement.\n\nBefore committing to anything, check the overlap with what you already pay for. Nearly every marketing suite now ships its own AI features, so a standalone tool has to clearly beat the one already bundled into your stack. Check the pricing model too: marketing tools are usually used by a whole team, and per-seat costs escalate faster than per-workspace ones.',
  },

  other: {
    heading: 'Uncategorised AI and No-Code Tools',
    metaTitle: 'Uncategorised AI & No-Code Tools',
    metaDescription:
      'The catch-all shelf of the directory: tools that span several categories, serve a niche too small for its own page, or arrived before the taxonomy did.',
    intro:
      'This is the catch-all. Every directory ends up with one, and ours holds tools that either span too many categories to file cleanly, serve a niche too small to justify its own page, or simply arrived faster than the taxonomy could keep up with them.\n\nThat makes it a bad page to skim and a good page to search. If you already know roughly what you need, use the search box and the pricing filters rather than scrolling, because a shelf this broad has no meaningful ordering by topic. If you are browsing for ideas instead, it is arguably the most interesting page on the site: genuinely unusual tools tend to land here before anything else does.\n\nExpect the widest quality range in the directory as well. Some entries are mature products whose category is simply ambiguous, such as a platform that does six unrelated things competently. Others are early experiments from a single builder. Read the listing, follow the link, and treat the product site itself as the evidence.',
  },

  education: {
    heading: 'AI Tools for Teaching, Training and Learning',
    metaTitle: 'AI Tools for Teaching, Training & Learning',
    metaDescription:
      'AI tools for lesson planning, grading, tutoring, course building and study, with the privacy and accuracy questions worth asking before classroom use.',
    intro:
      'This category serves two very different readers, and it is worth knowing which one you are. Educators and training teams are looking for tools that reduce preparation and marking time. Learners are looking for something that helps them understand material faster. A tool built for one group rarely fits the other well.\n\nOn the teaching side you will find lesson and curriculum planning, assessment and feedback assistants, course authoring and delivery platforms, and classroom admin helpers. On the learning side there are tutoring and practice systems, tools that turn lectures or readings into notes and flashcards, and language or exam preparation apps.\n\nThe questions that matter here are less about features than about context. Check how student data is stored and whether the tool meets the rules your institution works under, including age restrictions. Check subject accuracy yourself on material you already know well, since confident wrong answers are worse than no answer in a learning setting. And check the vendor position on academic integrity before it becomes an awkward conversation.',
  },

  automation: {
    heading: 'Workflow Automation and AI Agent Tools',
    metaTitle: 'Workflow Automation & AI Agent Tools',
    metaDescription:
      'Connector platforms, browser automation and AI agents that run multi-step work. How the approaches differ and what to check on connectors and pricing.',
    intro:
      'Automation tools all promise the same thing, which is work that happens without you, but they get there in noticeably different ways. Connector platforms link SaaS apps through triggers and actions and are the safest default when the apps you use have decent APIs. Browser and desktop automation drives interfaces directly, which is what you fall back on when there is no API at all. AI agents decide the steps themselves rather than following a fixed path, which is more flexible and correspondingly harder to predict.\n\nStart by listing the apps involved and checking each candidate connector catalogue against that list. A missing integration is usually the thing that kills an automation project, not the builder interface.\n\nThen look at the unglamorous parts. Pricing is often per task or per run, so a workflow that fires thousands of times a day costs very differently from one that fires weekly. Check error handling, retries and logs, because the automation you cannot debug is the one that silently stops. And consider whether a colleague could take it over.',
  },

  'customer-support': {
    heading: 'AI Customer Support and Helpdesk Tools',
    metaTitle: 'AI Customer Support & Helpdesk Tools',
    metaDescription:
      'Helpdesks, AI resolution agents and agent-assist tools for support teams, with the escalation, grounding and pricing questions that decide the outcome.',
    intro:
      'Support tooling splits along one useful line: does it answer customers, or does it help your team answer them. Resolution agents reply directly and are measured on how many conversations close without a human. Assist tools draft replies, summarise threads and suggest articles while a person stays in control. Full helpdesks provide the ticketing, inbox and reporting underneath, usually with AI features layered on top.\n\nAround those sit triage and routing tools, quality assurance and coaching for agents, and voice systems for phone support.\n\nWhat separates a good deployment from a bad one is rarely the quality of the writing. It is how the tool behaves when it does not know the answer: whether it says so, and how cleanly it hands over to a person with the context intact. Check what it is grounded in, since an agent is only as accurate as the help centre behind it, and budget time to fix your documentation. Also check the pricing shape, because per-resolution billing and per-seat billing reward very different volumes.',
  },

  research: {
    heading: 'AI Research, Literature and Synthesis Tools',
    metaTitle: 'AI Research & Literature Review Tools',
    metaDescription:
      'Tools for literature search, document synthesis, market and user research. What to check on source coverage, citations and verification before you rely on one.',
    intro:
      'Research tools cover several jobs that only look similar from a distance. Academic search and discovery tools help you find papers and map a field. Synthesis tools read a set of documents you already have and pull out themes, comparisons or extracted data. Web research agents go out and gather sources on a question. Market and user research tools sit slightly apart, analysing interviews, surveys and competitor material.\n\nThe single most important feature in this category is traceability. A summary you cannot trace back to a source is a rumour, so favour tools that attach claims to specific passages you can open and read for yourself. Spot-check that link on something you know well before trusting it on something you do not.\n\nAlso look at corpus coverage and recency, since a tool indexing only open-access material will quietly miss whole areas of a literature. And check how you get results out. Research that lives inside a proprietary workspace with no export is research you will end up redoing later.',
  },

  finance: {
    heading: 'AI Tools for Finance, Accounting and Forecasting',
    metaTitle: 'AI Finance, Accounting & Forecasting Tools',
    metaDescription:
      'Bookkeeping, invoicing, forecasting, spend management and market analysis tools, with notes on jurisdictions, integrations and where liability still sits.',
    intro:
      'Two audiences share this category. One is finance teams and business owners handling bookkeeping, invoicing, receivables, spend control and forecasting. The other is individuals tracking personal budgets or analysing investments. The workflows barely overlap, so filter accordingly before comparing anything.\n\nOn the business side you will find reconciliation and bookkeeping automation, accounts payable and receivable handling, expense and card management, and planning tools that build models and scenarios from your actuals. On the personal side there are budgeting apps, portfolio trackers and market analysis assistants.\n\nJurisdiction matters more here than in any other category on the site. Tax rules, invoice formats, e-invoicing mandates and accounting standards differ by country, and a tool that is excellent in one market can be unusable in another. Check that first, then check the integrations with your bank and accounting ledger, since manual export and import erases most of the time saved. Finally, remember that the responsibility for filed numbers stays with you and your accountant, whatever the tool automated.',
  },

  ecommerce: {
    heading: 'AI Tools for Online Stores and Ecommerce',
    metaTitle: 'AI Ecommerce Tools for Online Stores',
    metaDescription:
      'Product content, storefront merchandising, pricing, inventory and post-purchase tools for online stores, plus what to check on platform fit and bulk catalogues.',
    intro:
      'Ecommerce tools attach to a specific point in the selling cycle, and it is worth deciding which point is costing you money before browsing. Catalogue tools generate product descriptions, clean up or restage product photography and fill in attributes at scale. Storefront tools handle on-site search, recommendations and merchandising. Operations tools cover pricing, inventory forecasting and supplier admin. Post-purchase tools handle shipping updates, returns, reviews and repeat purchase campaigns.\n\nPlatform fit decides most of this. A tool built as a Shopify app behaves very differently from a standalone service you have to wire up yourself, and the app-store version usually wins on setup time while limiting you later. Check that whatever you pick can write results back to your store rather than handing you a spreadsheet.\n\nTwo other things catch people out. First, bulk behaviour: a generator that writes one beautiful description may be slow, expensive or repetitive across four thousand SKUs. Second, pricing tied to orders or revenue, which grows exactly as your margin gets interesting.',
  },

  'project-management': {
    heading: 'AI Project Management and Team Planning Tools',
    metaTitle: 'AI Project Management & Planning Tools',
    metaDescription:
      'Task trackers, planning and resourcing tools and AI layers that summarise work. What to weigh on adoption, migration cost and data quality before switching.',
    intro:
      'Most tools here are one of two things. Either a full workspace where the work lives, covering tasks, boards, timelines, docs and reporting, or a thin AI layer that sits on top of a workspace you already use and turns activity into summaries, status updates and next steps.\n\nThe second group is usually the easier purchase. It does not ask anyone to change how they work, and you can drop it without a migration. The first group is a much bigger commitment: switching trackers means moving history, rebuilding views and retraining everyone, so the new tool has to be substantially better rather than marginally nicer.\n\nBe sceptical of AI features that depend on tidy data. Automatic status reports, risk detection and workload balancing all assume people update tasks honestly and on time, which is exactly the habit most teams struggle with. If your tracker is already half-abandoned, a summarisation feature will describe the abandonment accurately and change nothing. Check permissions and export as well, since project history is awkward to lose.',
  },

  'image-generation': {
    heading: 'AI Image Generation and Photo Editing Tools',
    metaTitle: 'AI Image Generation & Editing Tools',
    metaDescription:
      'Text-to-image models, editing and inpainting, upscaling and product photography tools, with notes on control, commercial rights and cost per image.',
    intro:
      'Generation is only part of this category. Alongside text-to-image models and the interfaces built around them, you will find editing tools that change part of an existing image, background removal and replacement, upscaling and restoration, and product or character tools designed to keep the same subject consistent across many shots.\n\nControl is what usually separates a toy from a working tool. Prompt-only generation is fine for exploration, but production work needs reference images, masks, inpainting, seeds or style presets so you can iterate towards a result instead of rerolling and hoping. If you need the same product or face in twenty images, look specifically for consistency features rather than raw output quality.\n\nCheck the commercial terms before anything reaches a client or a storefront, since rights to generated images vary by vendor and by pricing tier. Then check the practical economics: credit costs per image, queue times at busy hours, maximum resolution, and whether lower tiers apply a watermark you cannot remove.',
  },

  productivity: {
    heading: 'Personal Productivity and AI Assistant Tools',
    metaTitle: 'AI Productivity & Personal Assistant Tools',
    metaDescription:
      'Notes, meeting recorders, calendar and task assistants and cross-app search. How to tell which ones remove steps and which ones just add another app.',
    intro:
      'This category is aimed at one person getting through their own week rather than at a team process. It covers note-taking and capture, meeting recorders that produce transcripts and action items, calendar and task assistants, focus and time tracking, and assistants that search across your files, mail and chat.\n\nThe useful test is simple: does the tool remove a step, or does it add one more place to check. Anything that requires you to remember to open it tends to fade within a fortnight. The tools that survive are the ones that attach to something you already do without being asked, such as joining calls automatically or appearing inside the app where you already work.\n\nPay attention to where your notes end up and how you get them out. Personal knowledge accumulates slowly and is painful to lose, so export quality matters more than any individual feature. If the tool listens to meetings, check the recording and consent settings, plus retention, before you put it in front of colleagues or clients.',
  },

  'social-media': {
    heading: 'AI Tools for Social Media Content and Scheduling',
    metaTitle: 'AI Social Media & Scheduling Tools',
    metaDescription:
      'Scheduling, content generation, listening and analytics tools for social teams and creators, plus the API and account-safety limits worth checking first.',
    intro:
      'The tools here cluster around four jobs: making the content, publishing it on a schedule, watching what people say, and reporting on what worked. Some suites do all four adequately; specialists usually beat them at one. Creators and multi-brand agencies also need different things, so check whether a tool thinks in terms of one account or many.\n\nNetwork coverage is the first filter and the most frequently disappointing. Official publishing support varies by platform and by post format, and features like first comments, carousels, stories or direct messaging are often missing even when the network itself is listed. Confirm your exact platforms and formats rather than trusting the logo row.\n\nBe deliberate about how much you automate. Fully generated posting at volume reads as filler and can put an account at risk under platform rules, whereas generation with a human approval step tends to hold up. On analytics, check whether numbers come from platform data or from estimates, since the two produce very different reports.',
  },

  coding: {
    heading: 'AI Coding Assistants and Developer Tools',
    metaTitle: 'AI Coding Assistants & Developer Tools',
    metaDescription:
      'Completion, agentic editors, code review, test generation and migration tools for developers, with notes on repo context, privacy and review workflow.',
    intro:
      'Developer tooling has moved through three generations, and all three are represented here. Inline completion predicts the next lines as you type. Chat assistants answer questions about a file or a repository. Agentic tools plan and apply changes across many files, run commands and iterate on the result. Around them sit code review assistants, test and documentation generators, and tools aimed at migrations and legacy modernisation.\n\nThe main technical differentiator is context: how much of your codebase the tool can actually see and how it decides what to look at. A tool that reads only the open file gives generic answers in a large project, which is why repository indexing and retrieval quality matter more than the underlying model on most days.\n\nFor anything used at work, check the data terms early: whether code is retained, whether it can be used for training, and whether self-hosted or zero-retention options exist. Then agree on review expectations. Generated code that nobody reads carefully has a way of becoming the least understood part of a codebase.',
  },

  chatbots: {
    heading: 'Chatbot Builders and Conversational AI Platforms',
    metaTitle: 'Chatbot Builders & Conversational AI',
    metaDescription:
      'Platforms for building chatbots and AI agents on your own content, from flow builders to grounded assistants, and what to check on accuracy and handoff.',
    intro:
      'This is the build-it category rather than the support-desk one. If your goal is deflecting support tickets, the customer support listings are a better starting point. Here you will find the platforms you use to create an assistant: flow builders with visual branching, tools that train on your website or documents and answer questions from them, embeddable site widgets, internal assistants over company knowledge, and bots that live in messaging channels.\n\nFlows and language models solve different problems. A deterministic flow is predictable and right for anything that must follow a fixed sequence, such as booking or qualification. A grounded language model handles open questions but needs guardrails and good source material.\n\nWhatever you pick, test the failure modes rather than the demo. Ask something outside its knowledge and see whether it invents an answer. Check that you can see and correct its sources, that it can hand over to a person when the conversation stalls, and that you can read conversation logs. Confirm the pricing unit too, since per-message billing scales with traffic you do not control.',
  },

  'video-generation': {
    heading: 'AI Video Generation, Avatars and Editing',
    metaTitle: 'AI Video Generation & Editing Tools',
    metaDescription:
      'Text-to-video models, AI avatars, transcript-based editing, clipping and dubbing tools, plus the limits on length, consistency, credits and likeness rights.',
    intro:
      'Video tooling covers three quite separate jobs. Generative models create footage from text or images and are still best suited to short clips rather than continuous scenes. Avatar and presenter tools turn a script into a person speaking to camera, which is the practical option for training material, product explainers and localised versions of the same message. Editing and repurposing tools work on video you already have, cutting long recordings into clips, editing by transcript, reframing for vertical formats and adding captions.\n\nJudge generative tools on consistency between shots rather than on a single impressive frame, since keeping a character, product or style stable across a sequence is the hard part and the difference between a demo and a deliverable.\n\nThe practical constraints matter as much as quality. Check maximum clip length, render times at peak hours, credit pricing and whether lower tiers watermark output or cap resolution. For avatars, cloned voices and dubbing, check the consent requirements and the disclosure rules that apply where the video will be published.',
  },

  'music-audio': {
    heading: 'AI Music, Voice and Audio Production Tools',
    metaTitle: 'AI Music, Voice & Audio Tools',
    metaDescription:
      'Music generation, text-to-speech and voice cloning, mastering, stem separation and transcription tools, with notes on licensing and consent requirements.',
    intro:
      'Audio tools divide into creation and cleanup. On the creation side there is music generation for backing tracks and scoring, text-to-speech and voice cloning for narration and dubbing, and sound design for effects. On the cleanup side there is noise and echo removal, mastering, stem separation that pulls a mix apart, and transcription or diarisation for spoken audio.\n\nIf you are scoring video or a podcast, licensing is the detail to settle first. Terms differ sharply between vendors and tiers on whether you own generated music, whether it can be used in monetised or broadcast work, and whether the same track could be issued to someone else. Read that page before the track is in your edit.\n\nFor voice, check what proof of consent the platform requires to clone someone, because a service with no such requirement is a liability rather than a convenience. On the production side, check output formats, sample rates and whether you get stems or only a stereo bounce, since that decides how much control you keep in your own editor.',
  },

  'hr-recruiting': {
    heading: 'AI Tools for Recruiting and People Operations',
    metaTitle: 'AI Recruiting & HR Tools',
    metaDescription:
      'Sourcing, screening, interviewing and onboarding tools for HR teams, with the compliance, bias and candidate-experience checks that should come first.',
    intro:
      'The listings here follow the employee lifecycle. Sourcing tools find and contact candidates. Screening tools rank applications and parse CVs against a role. Interview tools handle scheduling, structured questions, recording and note-taking. Onboarding and internal HR assistants answer employee questions and handle paperwork. People analytics sits at the end, reporting on retention, engagement and headcount.\n\nThis is one category where regulation should shape the shortlist rather than the other way round. Several jurisdictions now restrict or require disclosure and auditing of automated tools that screen or rank candidates, and the rules differ by country and even by city. Confirm what applies where you hire before you evaluate features.\n\nBeyond compliance, ask what a rejected candidate experiences, since the reputational cost of an opaque automated process lands on your employer brand. Ask how the vendor tests for adverse impact and whether you can see why a candidate was ranked as they were. And check the integration with your applicant tracking system, because a parallel pipeline outside it will not survive a busy quarter.',
  },

  'three-d': {
    heading: 'AI 3D Modelling, Scanning and Asset Tools',
    metaTitle: 'AI 3D Modelling & Asset Generation Tools',
    metaDescription:
      'Text-to-3D generation, photo scanning, texturing, rigging and web viewers. What to check on mesh quality, formats and fit with Blender, Unity or Unreal.',
    intro:
      'Three main approaches appear here. Generative tools build a model from a text prompt or a few images. Scanning tools reconstruct a real object or space from photos or video, including photogrammetry and newer splat-based methods. Pipeline tools handle the stages around a model that already exists, such as texturing and material generation, retopology, rigging and animation, or displaying the result in a web viewer or product configurator.\n\nOutput quality has to be judged against your use. Generated geometry is frequently good enough for background props, concept work, visualisation or a web viewer, and frequently not good enough for anything that must deform and animate cleanly, where topology and edge flow decide whether an artist can work with it at all.\n\nSo check the export formats and what actually arrives in them, including whether you get UVs, PBR material maps and a sensible scale. Confirm the tool fits your pipeline rather than replacing it, and read the licensing if the assets will ship in a commercial game, product page or client render.',
  },

  seo: {
    heading: 'SEO Tools for Research, Content and Audits',
    metaTitle: 'SEO Tools: Research, Content & Audits',
    metaDescription:
      'Keyword research, content optimisation, technical audits, rank tracking and AI-search visibility tools, plus how to judge the data behind each of them.',
    intro:
      'SEO tooling breaks into research, content, technical and measurement. Research tools estimate what people search for and how hard each term is. Content tools turn that into briefs and score drafts against what already ranks. Technical tools crawl a site and flag what stops pages being indexed or rendered properly. Measurement covers rank tracking, backlink data and, increasingly, whether AI answer engines cite you at all.\n\nAlmost everything here depends on the data underneath rather than the interface. Ask where the numbers come from, how often the index refreshes, and how well the tool covers your country and language, since coverage outside the largest English-speaking markets varies enormously. Treat search volume and difficulty scores as directional rather than exact, whatever the decimal places suggest.\n\nBe wary of tools whose main offer is producing optimised pages at volume. Publishing at scale without editorial judgement is a well-documented way to damage a site. The tools worth paying for are the ones that help you decide what deserves a page and then help you write it properly.',
  },

  sales: {
    heading: 'AI Sales Tools for Prospecting and Pipeline',
    metaTitle: 'AI Sales Tools for Prospecting & Outreach',
    metaDescription:
      'Lead data, outreach sequencing, call recording and coaching, CRM enrichment and forecasting tools, with the data accuracy and deliverability caveats.',
    intro:
      'Sales tooling maps onto the pipeline. Data providers supply contacts and buying signals. Outreach tools sequence and personalise email and LinkedIn touches. Conversation tools record calls, transcribe them and coach reps on what happened. CRM tools enrich records and keep them current without manual entry. Forecasting and deal intelligence tools try to tell you which opportunities are real.\n\nData quality is the deciding factor for the first group and the hardest thing to judge from a landing page, so test a sample export against accounts you already know before buying credits. Ask where the contact data was sourced as well, because consent and privacy rules differ by region and enforcement is uneven but real.\n\nWith outreach, deliverability is the constraint people discover too late. Volume automation can burn a sending domain quickly, and once your mail lands in spam the tool that got you there cannot fix it. Favour tools that make personalisation cheap rather than volume cheap. For call recording, check consent notifications and where recordings of your customers are stored.',
  },

  'no-code': {
    heading: 'No-Code App Builders and Internal Tools',
    metaTitle: 'No-Code App Builders & Internal Tools',
    metaDescription:
      'App builders, internal tool platforms, databases and website builders for non-developers, with the lock-in, pricing and scaling questions to ask upfront.',
    intro:
      'The builders here differ mainly in what they assume you already have. App builders give you a database and an interface together, which suits a product starting from nothing. Internal tool platforms assume your data already lives in a database or an API and give you admin panels and dashboards on top of it, which suits an operations team. Website and landing page builders handle the public-facing layer, and prompt-to-app generators sit at the newest edge, producing a working starting point from a description.\n\nAsk what happens if this works. The most expensive mistake in this category is building something the business comes to depend on inside a platform you cannot leave, so check export, whether you get code, whether self-hosting exists and how data comes out.\n\nCheck pricing shape too, since per-end-user billing is fine for an internal tool with twelve users and ruinous for a customer-facing app. And decide now who maintains it, because no-code projects usually outlive the person who built them.',
  },

  legal: {
    heading: 'AI Tools for Contracts and Legal Work',
    metaTitle: 'AI Legal & Contract Review Tools',
    metaDescription:
      'Contract drafting, review and clause extraction, legal research and compliance tools, with the jurisdiction, confidentiality and review caveats that matter.',
    intro:
      'A modest set of tools here, aimed at legal teams and at the businesses that do contract work without one. The most common use is contract lifecycle work: drafting from templates and playbooks, reviewing and redlining an incoming agreement against your standard positions, and extracting clauses, dates and obligations across a whole set of existing contracts. Alongside that sit legal research assistants and compliance tools that help maintain policies, privacy documentation and records.\n\nThe extraction use case is often the easiest win, because it answers questions your filing system cannot, such as which contracts auto-renew next quarter.\n\nThree checks apply to everything in this category. Jurisdiction, because drafting and research trained on one legal system is actively misleading in another. Confidentiality, because you are uploading the most sensitive documents your organisation holds, so read the retention, training and hosting terms carefully. And review, because output here is a first draft for a qualified person to check. Nothing listed on this page is a substitute for legal advice.',
  },

  design: {
    heading: 'AI Design Tools for Interfaces and Brand Assets',
    metaTitle: 'AI Design Tools for UI & Brand Assets',
    metaDescription:
      'A focused set of tools for UI mockups, design-to-code, brand systems and illustration, with notes on editable output and design system consistency.',
    intro:
      'A small and quite specific category. It covers interface and mockup generation, design-to-code tools that turn a layout into front-end markup, brand and template systems that keep assets consistent across a team, and illustration or icon generators aimed at design work rather than general imagery.\n\nThe question worth asking first is what you get back. A flat image of a screen is useful for a conversation and useless as a deliverable, while an editable file in the format your team already uses can go straight into the work. Design-to-code output deserves the same scrutiny: generated markup that ignores your component library creates cleanup work rather than saving it.\n\nBecause the category is deliberately narrow, browse adjacent pages too. General image generation covers illustration and photography needs, and the no-code builders overlap heavily with anyone designing and shipping a site in one place. If you are working with an existing design system, prioritise tools that can import it over tools that generate something attractive from scratch.',
  },

  spreadsheets: {
    heading: 'AI Spreadsheet Assistants and Data Cleanup Tools',
    metaTitle: 'AI Spreadsheet Assistants & Data Tools',
    metaDescription:
      'Formula helpers, AI add-ins, natural-language analysis and data cleanup tools for Excel and Sheets, plus why you should verify output on a sample first.',
    intro:
      'Spreadsheets remain where most business data actually lives, and the tools here reflect that. Some write and explain formulas so you do not have to remember array syntax. Some add a function that calls a language model per row, turning a column of raw text into classifications, summaries or enriched fields. Some let you ask questions of a sheet in plain language and return charts or pivots. Others focus on the unglamorous work of cleaning, deduplicating, parsing and merging messy files.\n\nThe first practical question is where the work happens. An add-in inside Excel or Google Sheets keeps your data in place and fits existing habits, while a separate web app means uploading files somewhere new, which is worth thinking about if the sheet contains customer or financial data.\n\nThe second is verification. Generated formulas and per-row enrichment are convincing and occasionally wrong, so run any of it on a sample you can check by hand before applying it to ten thousand rows. Row limits and per-cell pricing are also easy to miss.',
  },

  email: {
    heading: 'AI Email Assistants and Inbox Tools',
    metaTitle: 'AI Email Assistants & Inbox Tools',
    metaDescription:
      'Reply drafting, inbox triage, newsletter and cold outreach tools, with the mailbox permission and deliverability questions to settle before connecting one.',
    intro:
      'Three distinct jobs sit under this heading. Personal inbox tools triage, summarise and draft replies so you spend less time in your mail client. Newsletter and campaign tools help write and send to a list you own. Cold outreach infrastructure covers sending accounts, warmup and rotation for sales prospecting at volume, and behaves very differently from the other two.\n\nFor anything touching your own mailbox, look closely at the permissions requested. Most of these tools need broad read access to your mail to be useful, which means a third party holds a copy of your correspondence, so check retention, training terms and how to revoke access cleanly.\n\nFor sending, deliverability is the whole game. Automated volume from a new domain is the fastest way into spam folders, and no amount of generated copy fixes a damaged sender reputation. Prefer tools that are transparent about warmup, authentication and limits rather than those advertising unlimited sending. Finally, judge drafting quality after a week, not a day: the test is whether replies still sound like you.',
  },

  writing: {
    heading: 'AI Writing and Editing Tools',
    metaTitle: 'AI Writing & Editing Tools',
    metaDescription:
      'A small set of drafting, editing and style tools for long-form writing, with notes on iterative editing, voice control and where marketing copy tools sit.',
    intro:
      'A deliberately narrow category. Much of what people call writing software is really marketing software, so if you are producing campaign copy, ad variants or landing pages, that page will serve you better. What remains here is aimed at the writing itself: drafting and outlining long pieces, editing for grammar, clarity and style, matching an established voice, and turning one piece into several formats.\n\nThe useful distinction is one-shot generation versus an editing loop. Tools that produce a finished article from a prompt tend to disappoint on anything that needs your actual knowledge in it. Tools built for iteration, where you bring notes, sources or a rough draft and work through revisions, usually produce something you would put your name to.\n\nCheck how the tool handles your source material and whether it can hold a voice across a long document rather than paragraph by paragraph. Treat AI detection and humanising tools with scepticism, since detection is unreliable in both directions and building a workflow around it is risky.',
  },

  presentations: {
    heading: 'AI Presentation and Slide Deck Tools',
    metaTitle: 'AI Presentation & Slide Deck Tools',
    metaDescription:
      'Prompt-to-deck generators, document-to-slides converters and design assistants, with the export, branding and data questions to check before a real deadline.',
    intro:
      'Two approaches dominate this small category. Prompt-to-deck tools build slides from a short description, which is fast and works best when the content is generic. Document-to-deck tools take a report, brief or set of notes you already have and restructure it into slides, which usually produces something closer to what you actually meant. A third group sits inside PowerPoint or Google Slides and helps with layout, imagery and consistency rather than generating the deck outright.\n\nThe question that decides everything is export. A beautiful deck locked inside a web editor is a problem the morning a client asks for the file or you have to present from someone else\'s corporate laptop, so confirm that PowerPoint or Slides export keeps the layout intact and the text editable.\n\nThen check brand handling and data. Importing your own template and fonts is the difference between a usable tool and one you fight, and most generators are weak with charts and dense tables, which is exactly where business decks live.',
  },

  'real-estate': {
    heading: 'AI Tools for Real Estate Agents and Property',
    metaTitle: 'AI Real Estate & Property Tools',
    metaDescription:
      'Listing copy, virtual staging, lead qualification, valuation and transaction tools for agents, plus the disclosure rules that apply to enhanced photos.',
    intro:
      'A compact category built around the agent workflow. Listing tools write descriptions from property details and improve or virtually stage photographs. Lead tools capture and qualify enquiries, often through a chatbot that handles first contact and books viewings. Valuation and market analysis tools estimate prices and produce comparative reports. Transaction tools deal with the paperwork, disclosures and the follow-up that surrounds a deal.\n\nVirtual staging and photo enhancement carry rules worth knowing before you publish. Most markets and listing services require altered images to be disclosed, and enhancement that changes what a property actually contains crosses into misrepresentation. Keep edits cosmetic and labelled.\n\nValuation tools deserve local scrutiny too, since a model trained mainly on one country\'s transaction data will be confidently wrong elsewhere. Ask what data it uses and test it against sales you already know. For lead tools, check where enquiry data is stored and whether it syncs with your CRM, because a qualified lead sitting in a separate dashboard is a lead nobody calls.',
  },

  gaming: {
    heading: 'AI Tools for Game Development and Play',
    metaTitle: 'AI Game Development Tools',
    metaDescription:
      'Asset generation, NPC dialogue, no-code game builders and playtesting tools, with notes on engine fit, store disclosure rules and asset licensing.',
    intro:
      'A small category covering both making games and the AI that runs inside them. On the production side there is asset generation for art, audio, animation and 3D models, plus tools for writing quests, dialogue and lore. On the runtime side there are systems for NPC conversation and behaviour that respond to players rather than following a script. Around those sit no-code game builders for people who do not program, and analytics or playtesting tools that find where players get stuck.\n\nEngine fit is the first filter. A tool that exports into Unity, Unreal or Godot in a usable format saves real time, while one that produces assets you have to convert and repair by hand often does not.\n\nIf you plan to ship commercially, read two sets of terms. The licence covering assets you generate, which decides whether they can appear in a paid product, and the storefront policies on AI-generated content, which increasingly require disclosure. Several specialist asset categories on this site, including 3D, image and audio, are worth browsing alongside this one.',
  },

  'data-analytics': {
    heading: 'AI Data Analytics and Business Intelligence Tools',
    metaTitle: 'AI Data Analytics & BI Tools',
    metaDescription:
      'A short list of analytics tools for natural-language querying, dashboards and data prep, with notes on connections, generated SQL and where to look next.',
    intro:
      'This is one of the smallest categories on the site, so treat it as a starting point rather than a survey of the field. What is listed here covers natural-language querying, where you ask a question and the tool writes the query, dashboard and report generation, data preparation and cleaning, and monitoring that flags anomalies in a metric without being asked.\n\nThe practical constraint is almost always connectivity. A tool is only useful if it reaches the warehouse, database or product analytics platform where your data actually lives, and support for anything beyond the most common sources thins out quickly.\n\nWith generated queries, insist on seeing the SQL. A number with no visible logic behind it cannot be checked or reused, and quiet mistakes in joins or filters produce answers that look entirely plausible. If you do not find what you need here, the spreadsheets category covers lighter analysis on files you already have, and research tools handle qualitative material. Several broader platforms are also filed under the uncategorised shelf.',
  },

  healthcare: {
    heading: 'AI Tools for Healthcare and Clinical Workflows',
    metaTitle: 'AI Healthcare & Clinical Workflow Tools',
    metaDescription:
      'A handful of tools for clinical documentation, patient communication and admin, with the regulatory and patient data questions that come before features.',
    intro:
      'Only a handful of tools are listed here, which suits a field where the bar for adoption is high and most serious systems are sold directly to institutions rather than discovered in a directory. What does appear tends to cluster around documentation and administration: ambient scribing that drafts notes from a consultation, patient communication and scheduling, coding and billing support, and assistants that search clinical literature.\n\nThe distinction that matters most is between tools that support administrative work and tools that make clinical claims. The second group is regulated as a medical device in most jurisdictions, and a marketing site that blurs the line is itself a warning sign. Ask what regulatory clearance a vendor holds and for which specific indication.\n\nThen ask the data questions before the feature questions: where patient information is processed and stored, what contractual protections are available such as a business associate agreement or the equivalent under your own regime, and how it integrates with your records system. None of this replaces clinical judgement.',
  },

  translation: {
    heading: 'AI Translation and Localisation Tools',
    metaTitle: 'AI Translation & Localisation Tools',
    metaDescription:
      'Document, website, subtitle and dubbing translation plus localisation workflow tools, with notes on terminology control, formatting and human review.',
    intro:
      'A short list covering several different jobs. Document and website translation focuses on keeping formatting intact while the text changes language. Media translation handles subtitles, captions and dubbing, sometimes with voice matching or lip sync. Localisation platforms are a different proposition again, managing glossaries, translation memory, reviewer stages and continuous string updates for software teams. A few tools handle live conversation.\n\nQuality varies far more by language pair than by vendor claim, so test with your actual pair and your actual subject matter. Technical, legal and medical content exposes weaknesses that general prose hides completely.\n\nFor anything beyond internal comprehension, look for terminology control. The ability to enforce a glossary so your product names, legal terms and brand vocabulary stay consistent is what separates a translation workflow from a one-off conversion. Keep a human reviewer in the loop for anything public, contractual or safety-related. And check that formatting survives the round trip, since recovering a mangled layout can cost more time than the translation saved.',
  },

  cybersecurity: {
    heading: 'AI Security and Privacy Tools',
    metaTitle: 'AI Security & Privacy Tools',
    metaDescription:
      'A very small set of security-adjacent tools, plus honest guidance on what a general AI directory can and cannot help you with on security decisions.',
    intro:
      'This is the smallest category in the directory, and it is worth being straightforward about that. A general AI and no-code directory is not where a security programme gets built, and the tools listed here are best understood as useful individual pieces rather than a stack. Enterprise security platforms are sold and evaluated through channels this site does not cover.\n\nWhat you will find here sits at the edges: code and dependency scanning, phishing and suspicious content detection, assistants that help triage logs and alerts, and privacy tooling for redaction or handling sensitive data.\n\nIf your concern is the security of the AI tools themselves rather than security products, that is a reasonable question and mostly answered elsewhere. Before connecting any tool from this site to real systems, check retention and training terms, whether self-hosting is offered, what certifications exist, and what access scopes it requests. Never paste production credentials, customer records or proprietary source into an unvetted service. The coding category also covers scanning tools in more depth.',
  },
};
