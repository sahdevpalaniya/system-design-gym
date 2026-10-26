import type { Guide } from '@/lib/types'

/**
 * Standalone interview guides under /learn. They sit next to the beginner
 * lessons but are not part of the numbered sequence: each one answers a single
 * question people search for, and links back to the lessons and tools that go
 * deeper instead of repeating them.
 *
 * House style is the same as the lessons: short sentences, everyday words.
 */
export const GUIDES: Guide[] = [
  {
    slug: 'system-design-interview-framework',
    title: 'System design interview framework: a 45-minute answer template',
    searchTitle: 'System design interview framework: 45-minute template',
    navTitle: 'Interview framework',
    description:
      'A system design interview framework: what to say and write in each of five stages, a minute-by-minute 45-minute budget, and how to catch up when behind.',
    answer:
      'A system design interview framework is a fixed order of steps you follow on every question. Ours has five: requirements (about 5 minutes), actors and lifecycle (6), numbers (6), high-level design (12) and deep dive with trade-offs (14). That leaves a minute or two to sum up. Below is what to say and write in each one.',
    sections: [
      {
        heading: 'Why use a fixed template at all?',
        body: [
          'The question you get is short and vague on purpose. "Design a URL shortener." With no plan, most people do one of two things. They draw boxes before they know what the system must do, or they spend twenty minutes on requirements and never reach the design. A template removes the decision about what to do next, so all your attention goes on the problem.',
          'This page is the working template: the minutes, the board layout and the sentences to use at each checkpoint. If you want the reasoning behind each stage first, read [the five stages](/learn/the-five-stages) and [how the interview works](/learn/how-the-interview-works). Both are short.',
        ],
      },
      {
        heading: 'What does the 45-minute budget look like?',
        body: [
          'These are targets. A budget helps you notice when you are over it. Write the clock times at the top of the page before you start. If the round started at 10:00, your checkpoints are 10:05, 10:11, 10:17, 10:29 and 10:43.',
        ],
        table: {
          caption: 'A 45-minute round. If yours is shorter, cut from stages 4 and 5, never from stage 1.',
          headers: ['Stage', 'Minutes', 'Ends at', 'What you have on the board by the end'],
          rows: [
            ['1. Requirements', '~5', '0:05', 'Three to five lines of scope, and the one or two questions you asked'],
            ['2. Actors and lifecycle', '~6', '0:11', 'Who touches the system, and the main object as a chain of states with failure branches'],
            ['3. Numbers', '~6', '0:17', 'Requests per second, storage, and one sentence: "so the hard part is ___"'],
            ['4. High-level design', '~12', '0:29', 'Boxes and arrows, each one traceable to a requirement or a number'],
            ['5. Deep dive and trade-offs', '~14', '0:43', 'Two hard parts worked through, each decision with its cost written next to it'],
            ['Wrap-up', '~2', '0:45', 'A 30-second summary and what you would do next with more time'],
          ],
        },
      },
      {
        heading: 'What do you say in the first five minutes?',
        body: [
          'Start with assumptions, said out loud, so the interviewer can correct them. Then ask only the questions whose answers would change a box on the board. Then propose the scope yourself instead of waiting to be given one.',
          'A useful test for each question you want to ask: if the answer were the opposite, would you draw something different? "Do links expire?" changes the storage and the clean-up job, so ask it. "What colour is the button?" changes nothing, so skip it.',
          'Write the scope as a short list on one side of the board. You will point back at it in stage 4 when you explain why a box exists.',
        ],
        points: [
          'Say it like this: "I will assume about 100 million new links a month, reads far more common than writes, and links that never change once made. Two questions: do links expire, and do we need custom aliases?"',
          'Then close the stage: "So in scope: create, redirect, optional expiry. Out of scope: analytics and accounts. Is that fair?"',
        ],
      },
      {
        heading: 'What goes in the actors and lifecycle step?',
        body: [
          'List everyone and everything that acts on the system. Include the system itself, because the jobs it runs on its own (expiring things, retrying, cleaning up) are often where the interesting design is.',
          'Then write the life of the main object as a chain of states. For a short link that might be: requested, created, active, expired, deleted. Now ask two questions at each arrow. What if this step never finishes? What if one side gives up here? The answers become the failure branches, and most of your stage 5 material comes from them.',
          'This step takes six minutes and it is the one people skip most. Skipping it is why so many designs only work when nothing goes wrong.',
        ],
      },
      {
        heading: 'How much maths is enough in the numbers step?',
        body: [
          'Enough to find out which part is hard. Use round figures and say them as you go. With the assumption above: 100 million writes a month is roughly 40 a second, because a month has about 2.6 million seconds. If reads are a hundred times writes, that is about 4,000 reads a second. At around 500 bytes a link, five years of links is about 3 TB.',
          'Those are this page\'s example assumptions, not real traffic figures. What matters is the sentence that follows them: "So writes are easy, reads need a cache, and storage fits on a few machines. The hard part is making redirects fast and generating short codes that never collide."',
          'If you need a refresher on the arithmetic, [back-of-the-envelope estimation](/concepts/back-of-envelope) and the [latency numbers](/concepts/latency-numbers) page cover it. The [cheat sheet](/cheat-sheet) has the figures on one page.',
        ],
      },
      {
        heading: 'How do you draw the high-level design without over-building?',
        body: [
          'Draw the path of one request first, left to right: client, the service that receives it, where the data is read or written. Then add a box only when a requirement or a number asks for it. When you add one, say which. "The 4,000 reads a second are why there is a cache here."',
          'Name the API and the main table in a line or two each. You do not need every column. You do need the key you will look things up by, because that choice drives the storage and partitioning questions that come next.',
          'Stop at twelve minutes even if the picture feels thin. A small design you can defend scores better than a big one you have to explain away.',
        ],
      },
      {
        heading: 'How do you choose what to deep dive into?',
        body: [
          'Go back to the sentence from stage 3, "the hard part is ___", and to the failure branches from stage 2. Pick the two that would hurt users most if you got them wrong. Tell the interviewer which two you picked and why, then ask if they would prefer a different one. Many will steer you, and that is useful information.',
          'For each one, give at least two options, choose one, and write its cost next to it on the board. A cost is something specific you give up: more storage, a slower write, a short window where two users see different data. "It is more complex" is too vague to count.',
          'Expect interruptions here. When they come, answer in one or two sentences, say what it changes in your design, and carry on. The [follow-up drills](/drills) practise exactly this.',
        ],
      },
      {
        heading: 'What do you do when you fall behind?',
        body: [
          'You will, at some point. Check the clock at each stage boundary. If you are more than three minutes over, say so and make a cut out loud: "I am running long, so I will sketch the write path quickly and spend the deep dive on the cache." Saying it shows you are managing the time, which interviewers notice.',
          'Cut from stages 4 and 5 first. Never skip stage 1, because every later minute depends on it. If you have to compress stage 3, keep the one sentence about the hard part and drop the storage maths.',
          'If you finish early, do not fill the time with more boxes. Pick a third failure case and walk through it, or ask the interviewer what they would like to see in more depth.',
        ],
      },
      {
        heading: 'How should you lay out the whiteboard?',
        body: [
          'Use the same layout every time so you do not think about it. One option that works on a whiteboard or a shared doc:',
        ],
        points: [
          'Top left: scope and assumptions from stage 1.',
          'Below it: actors, and the lifecycle chain with its failure branches.',
          'Top right: the numbers, and the "hard part" sentence underlined.',
          'Centre, taking the most space: the high-level diagram.',
          'Bottom: a running list of decisions, each with its cost. This is what you read out in the wrap-up.',
        ],
      },
      {
        heading: 'What does a good wrap-up sound like?',
        body: [
          'Thirty seconds. Restate the scope, the hard part, the two decisions you made about it and what each cost. Then one sentence on what you would do next: "With more time I would look at abuse, because anyone can create links."',
          'That last sentence matters because it shows you know the design is unfinished and you know where. It also hands the interviewer an easy next question if there is time left.',
        ],
      },
      {
        heading: 'How do you make the template automatic?',
        body: [
          'Using a template under a clock, while someone interrupts, takes repetition. Three ways to practise it here:',
        ],
        points: [
          '[Daily rep](/practice/daily): 15 minutes on stages 1 and 2 only, which are the stages people rush.',
          '[Timed mock](/practice/mock): all five stages with a timer per phase and a follow-up question at the end.',
          'Any of the [practice problems](/problems): write your own answer stage by stage, then compare it with the worked solution.',
        ],
      },
    ],
    keyPoints: [
      'Five stages in a fixed order: requirements, lifecycle, numbers, design, trade-offs.',
      'Budget roughly 5, 6, 6, 12 and 14 minutes, plus a short wrap-up. Write the clock times down.',
      'Every box in the design should point back to a requirement or a number.',
      'When behind, cut from the design and deep dive. Never from requirements.',
    ],
    remember: 'Same five stages every time, with a clock time written next to each one.',
  },

  {
    slug: 'how-to-prepare-for-system-design-interview',
    title: 'How to prepare for a system design interview: a 1-week and 4-week plan',
    searchTitle: 'How to prepare for a system design interview (1 or 4 weeks)',
    navTitle: 'How to prepare',
    description:
      'How to prepare for a system design interview: a day-by-day 1-week plan and a 4-week plan covering concepts, practice problems, timed mocks and follow-ups.',
    answer:
      'Learn the answer method first, then the 15 or so core concepts, then practise full problems under a timer, writing your answer before you read anyone else\'s. With one week, do two problems a day and one mock. With four weeks, spend the first two on concepts and the last two on timed problems and follow-up drills.',
    sections: [
      {
        heading: 'How long does it take to prepare?',
        body: [
          'It depends on where you start, so there is no honest single number. A useful way to judge it: can you take a question you have never seen, talk through requirements, estimate the load and draw a design you can defend, in 45 minutes? If you can do that for one problem but freeze on others, you need more problems. If you cannot get past the first five minutes, you need the method and the concepts first.',
          'The two plans below assume about one to two hours a day. If you have less, stretch them. Doing a small amount every day works better than doing a lot once a week, because the skill is recall under pressure, and recall needs repetition.',
        ],
      },
      {
        heading: 'What should you learn first?',
        body: [
          'The order matters more than the amount. Start with how the interview is scored and the order you will answer in. Without that, concept knowledge has nowhere to go and you end up reciting definitions.',
        ],
        points: [
          'Read [how the interview works](/learn/how-the-interview-works) and [the five stages](/learn/the-five-stages). Together they take about 15 minutes.',
          'Keep the [45-minute framework](/learn/system-design-interview-framework) open while you practise, until you no longer need it.',
          'Then go through the [concepts](/concepts) in order. The list is arranged so each topic builds on the ones before it.',
          'If you are new to all of this, start one step earlier with [system design for beginners](/learn).',
        ],
      },
      {
        heading: 'Which concepts matter most?',
        body: [
          'You do not need every topic before you start practising. A core set covers most of what comes up in a first design. Learn what each one costs you, as well as what it does, because the cost is what interviewers ask about.',
          'A practical first set: [caching](/concepts/caching), load balancing, SQL vs NoSQL, indexes, [replication](/concepts/replication), partitioning, message queues, idempotency, rate limiting and [back-of-the-envelope estimation](/concepts/back-of-envelope). After those, add consistency models, CDNs and real-time transports as the problems you practise need them.',
          'Use [Concept Check](/practice/check) as you go. It brings each concept back on a schedule and asks for the cost, which is the part people forget.',
        ],
      },
      {
        heading: 'What is a good one-week plan?',
        body: [
          'One week is enough to get the method into your hands and practise a handful of problems. It is not enough to learn every concept, so lean on the ones the problems force you to use. Plan on about two hours a day.',
        ],
        table: {
          caption: 'One week, about two hours a day. Write every answer yourself before you open the solution.',
          headers: ['Day', 'Focus', 'What to do'],
          rows: [
            ['1', 'Method', 'Read the interview and five-stages lessons and the framework. Do one Daily rep.'],
            ['2', 'Core concepts', 'Caching, load balancing, SQL vs NoSQL, indexes, estimation. Then the link shortener problem, untimed.'],
            ['3', 'Data at scale', 'Replication, partitioning, message queues. Then the rate limiter problem.'],
            ['4', 'Contention', 'Idempotency and transactions. Then ticket booking, where two people want the same seat.'],
            ['5', 'Fan-out', 'Fan-out and real-time transports. Then the follower timeline or chat.'],
            ['6', 'Full mock', 'One timed mock on a problem you have not seen. Review the report card.'],
            ['7', 'Defence', 'A follow-up blitz, then skim revision and the cheat sheet. No new topics.'],
          ],
        },
      },
      {
        heading: 'What is a good four-week plan?',
        body: [
          'Four weeks lets you learn the concepts properly and still leave half the time for practice. The split is deliberate: people who spend all four weeks reading tend to know a lot and still freeze when the clock starts.',
        ],
        table: {
          caption: 'Four weeks, one to two hours a day. Keep a Daily rep going throughout.',
          headers: ['Week', 'Focus', 'What to do'],
          rows: [
            ['1', 'Method and foundations', 'The beginner lessons, the framework, and the first block of concepts up to caching and load balancing. One Daily rep a day from day one.'],
            ['2', 'Data and messaging', 'Storage, indexes, transactions, replication, partitioning, queues, idempotency. Two problems untimed, writing every stage before you read the solution.'],
            ['3', 'Problems under a timer', 'One problem a day at full length. Mix the kinds: something read-heavy, something with contention, something real-time. One timed mock at the end of the week.'],
            ['4', 'Defence and rehearsal', 'Follow-up drills and blitz daily, two more mocks, and the blank page on the last two days. Read about interviewer types once.'],
          ],
        },
      },
      {
        heading: 'How should you practise a problem?',
        body: [
          'The order is what makes practice work. Pick one of the [practice problems](/problems) and write your own answer first, stage by stage, before you look at anyone else\'s. Then read the worked solution and compare. The gaps you find that way are what you remember. Reading a solution first feels faster, but it teaches recognition, and the interview tests recall.',
          'When you compare, look for three things. Did you ask a question that changed the design? Did your numbers lead to a clear "the hard part is" sentence? Did you name the cost of each decision? Most early answers miss the third.',
          'Say your answer out loud at least some of the time, even alone. Talking while thinking is a separate skill from thinking, and it is the one being scored.',
        ],
      },
      {
        heading: 'How do you practise follow-up questions?',
        body: [
          'Follow-ups are where many otherwise good answers lose points, and they are hard to practise alone because nobody is interrupting you. The [drills](/drills) break follow-ups into kinds, such as "what if this component fails" or "what if traffic is ten times higher", and let you practise each kind on its own.',
          'A good answer to a follow-up is short: answer the question, say what it changes in your design, and carry on. If you do not know, say what you would check and how the answer would change your choice.',
        ],
      },
      {
        heading: 'What should you do in the last two days?',
        body: [
          'Stop learning new topics. Do one [blank page](/practice/blank) run, where you get the five-stage scaffold and nothing else, to check you can produce a design from nothing. Do one last [timed mock](/practice/mock) the day before if it helps your nerves, and skip it if it does not. Read the one-line version of each concept on the [revision page](/revise). Sleep.',
          'If you are worried about a particular company, the [company pages](/company) list problems to rehearse, but the method is the same everywhere. Time spent on the stages pays off whichever question you get.',
        ],
      },
      {
        heading: 'What are the most common preparation mistakes?',
        points: [
          'Reading solutions without writing your own first. It feels productive and builds very little recall.',
          'Learning many components and few costs. Interviewers ask what a choice costs far more often than what it is.',
          'Never practising against a clock. Your first timed attempt should not be the real interview.',
          'Skipping requirements in practice because it feels slow. It is the stage most often rushed in the real round.',
          'Memorising one company\'s "architecture". The question you get will differ in a detail that changes the design.',
        ],
        body: [],
      },
    ],
    keyPoints: [
      'Method first, then core concepts, then full problems under a timer.',
      'Write your own answer before reading a solution. Every time.',
      'One week: two hours a day, five problems, one mock, one day of defence.',
      'Four weeks: two weeks of concepts, two of timed problems and follow-ups.',
    ],
    remember: 'Write your answer first, then compare. That builds the recall the interview tests.',
  },

  {
    slug: 'system-design-vs-lld-vs-hld',
    title: 'System design vs LLD vs HLD: what each one means',
    searchTitle: 'HLD vs LLD: The Difference, with Examples and a Table',
    navTitle: 'HLD vs LLD',
    description:
      'HLD vs LLD compared in a table, with a ticket-booking example, what each interview round expects, and how both fit under system design.',
    answer:
      'System design is the umbrella term. High-level design (HLD) decides which services exist, where data lives and how the system copes with load and failure. Low-level design (LLD) decides the classes, interfaces and data structures inside one of those services. In interviews, "system design" usually means the HLD round.',
    sections: [
      {
        heading: 'What is high-level design (HLD)?',
        body: [
          'High-level design is the view from above. You decide what the separate parts of a system are, how they talk to each other, where each piece of data is stored, and what happens when traffic grows or a machine fails. The output is a diagram of boxes and arrows, plus a list of decisions and what each one costs.',
          'Typical HLD questions: should this be one database or several? Do we need a cache, and what happens when it is stale? How do we split data across machines? What if a whole region goes down? Most of the [concepts on this site](/concepts) are HLD concepts, and every [practice problem](/problems) is an HLD problem.',
        ],
      },
      {
        heading: 'What is low-level design (LLD)?',
        body: [
          'Low-level design zooms into one component and decides how its code is organised. You pick the classes or types, what each one is responsible for, the interfaces between them, and the data structures they use. The output is a class diagram or actual code, often with a few design patterns where they help.',
          'Typical LLD questions: design a parking lot, an elevator controller or a library system as classes. How do you add a new vehicle type without editing old code? Which object owns this state? Where would a test plug in a fake? LLD is closer to everyday programming, and you are judged partly on whether the code would be easy to change.',
          'This site focuses on HLD. For the code-structure side in Go, the lessons on [interfaces](/languages/go/interfaces) and [backend design interview questions](/languages/go/interview-backend-and-design) cover the parts that overlap with LLD.',
        ],
      },
      {
        heading: 'How do system design, HLD and LLD compare?',
        body: [
          'The table compares HLD and LLD side by side. "System design" on its own can mean either, or both, depending on who is using it.',
        ],
        table: {
          caption: 'HLD and LLD answer different questions about the same product.',
          headers: ['', 'High-level design (HLD)', 'Low-level design (LLD)'],
          rows: [
            ['Main question', 'What are the parts, and how do they work together at scale?', 'How is the code inside one part organised?'],
            ['Unit you design', 'Services, databases, caches, queues', 'Classes, interfaces, functions, data structures'],
            ['What you draw', 'Boxes and arrows, data flow, regions', 'Class diagrams, method signatures, sometimes code'],
            ['What drives decisions', 'Load, latency, storage size, failure, cost', 'Readability, change, testability, correctness'],
            ['Typical trade-off', 'Consistency vs availability, cost vs speed', 'Flexibility vs simplicity, inheritance vs composition'],
            ['Numbers involved', 'Requests per second, terabytes, milliseconds', 'Rarely any; sometimes time and space complexity'],
            ['Example question', 'Design a link shortener for millions of users', 'Design the classes for a parking lot'],
            ['Good answer shows', 'Each component has a reason and a named cost', 'Each class has one clear job and is easy to extend'],
          ],
        },
      },
      {
        heading: 'Is "system design" the same as HLD?',
        body: [
          'In interview talk, usually yes. When a recruiter says "a system design round", they almost always mean an HLD-style question: a vague product prompt, about 45 minutes, and a whiteboard or shared doc. Some companies call the LLD round "object-oriented design", "machine coding" or "low-level design" to tell them apart.',
          'Outside interviews, system design covers both and more: picking technologies, planning a migration, writing a design document. If you are unsure which round you have, ask the recruiter. It is a normal question, and the answer changes how you should prepare.',
        ],
      },
      {
        heading: 'How is an HLD round different from an LLD round?',
        body: [
          'In an HLD round you talk for most of the time and draw. Nobody expects code. The interviewer pushes on scale and failure: "what if this gets ten times the traffic?" or "what if this database is down?". You are scored on the order you work in, whether your numbers shaped the design, and whether you name the cost of each choice. [How the interview works](/learn/how-the-interview-works) describes this round in detail.',
          'In an LLD round you usually produce something closer to code. Sometimes it is a class diagram and method signatures. Sometimes it is a working program in a fixed time. The interviewer pushes on change: "now add a new type of item" or "how would you test this?". You are scored on clear responsibilities, sensible names and how easily the design takes the change.',
          'The two rounds share one habit: say why you made each choice. In HLD the reason is usually load or failure. In LLD it is usually change or clarity.',
        ],
      },
      {
        heading: 'Which comes first when you design a real system?',
        body: [
          'HLD comes first. You cannot organise the code inside a service until you know the service exists and what it is responsible for. In practice the two go back and forth a little: a detail found while writing code can send you back to adjust the design. But the big decisions, such as where data lives and what talks to what, are made at the high level.',
          'For example, in a [ticket booking](/problems/ticket-booking) system the HLD decides that seat holds live in the database and expire after a timeout, and that payment is a separate step. The LLD then decides how the hold and expiry logic is structured in code, and how it is tested.',
        ],
      },
      {
        heading: 'Which should you prepare for first?',
        body: [
          'Prepare for the round you have. If you do not know, ask. As a rough guide, earlier-career interviews lean more on coding and LLD-style questions, and HLD carries more weight as roles get more senior. Treat that as a tendency, not a rule; it varies a lot between companies and teams.',
          'If you need both, start with HLD concepts because they take longer to absorb, and practise LLD alongside your normal coding practice. For an HLD plan, see [how to prepare for a system design interview](/learn/how-to-prepare-for-system-design-interview). If you are a student or new grad, [system design for freshers](/learn/system-design-for-freshers) covers what to expect at that level.',
        ],
      },
      {
        heading: 'How does system design compare with DSA?',
        body: [
          'Data structures and algorithms (DSA) rounds ask you to solve a well-defined problem in code, with a correct answer you can test. System design rounds ask an open question with no single right answer and no code. DSA rewards precision on a small problem. System design rewards judgment on a large, vague one.',
          'They use different practice. DSA improves with many short problems. System design improves with fewer, longer problems where you write your own answer and then compare. If you are practising DSA in Go, the [DSA in Go](/languages/go/topics/dsa) section has problems with solutions.',
        ],
      },
    ],
    keyPoints: [
      'System design is the umbrella. HLD and LLD are two levels of it.',
      'HLD: services, data, scale and failure. Boxes and arrows, no code.',
      'LLD: classes, interfaces and structure inside one service. Often code.',
      'In interviews, "system design round" usually means HLD. Ask if unsure.',
    ],
    remember: 'HLD decides what the parts are. LLD decides how one part is written.',
  },
]

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug)
}
