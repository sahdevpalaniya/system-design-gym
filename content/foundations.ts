import type { Lesson } from '@/lib/types'

/**
 * The "start from scratch" path. These come before any concept page and assume
 * nothing — no distributed systems vocabulary, no interview experience.
 *
 * House style: short sentences, everyday words, one idea per sentence. A reader
 * who is not a native English speaker should never have to re-read a line.
 */
export const LESSONS: Lesson[] = [
  {
    slug: 'what-is-system-design',
    title: 'What is system design?',
    oneLine: 'Deciding how the parts of a product fit together, before anyone writes code.',
    body: [
      'When you write code, you decide how one program behaves. System design is one step above that. You decide **how many programs there are, what job each one does, where the data is kept, and what happens when one of them breaks.**',
      'Here is the smallest example. You build a website. At the start it is one program on one computer. The data sits in a file next to it. This works fine for a while. Then two things happen. More people arrive than one computer can serve. And that computer needs a restart sometimes. So you say: "let us run two copies, and put the data somewhere both copies can reach." That is system design. Everything else in this app is the same move, done at a bigger size.',
      'Most people expect system design to be about knowing more tools. It is not. It is about **making a few decisions in the right order, and being able to say what each one costs you.** A junior and a senior engineer often draw the same boxes. The senior one can explain why each box is there, and what they gave up to get it.',
      'There is almost never one right answer. There are answers that match the requirements and answers that do not. Among the ones that match, some trade-offs you chose on purpose, and some you walked into by accident. Interviews look for the first kind.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The smallest system design decision there is: one box becomes three, because one box cannot serve everyone and cannot be restarted safely.',
        nodes: [
          { id: 'u', label: 'People', kind: 'client', col: 0, row: 0 },
          { id: 'lb', label: 'Front door', sub: 'spreads traffic', kind: 'service', col: 1, row: 0 },
          { id: 's1', label: 'Your app', kind: 'service', col: 2, row: 0 },
          { id: 's2', label: 'Your app', sub: 'a second copy', kind: 'service', col: 2, row: 1 },
          { id: 'db', label: 'Database', sub: 'shared truth', kind: 'store', col: 3, row: 0 },
        ],
        edges: [
          { from: 'u', to: 'lb' },
          { from: 'lb', to: 's1' },
          { from: 'lb', to: 's2' },
          { from: 's1', to: 'db' },
          { from: 's2', to: 'db' },
        ],
      },
    },
    keyPoints: [
      'It is about who does what and where data lives. It is not about knowing more tools.',
      'Every part you add has a price. Naming that price is the real skill.',
      'There is no single right answer. Only answers that fit, and costs you chose on purpose.',
      'The same few moves repeat at every size. You are learning about fifteen ideas, not a hundred.',
    ],
    remember:
      'System design is choosing where things live, and what breaks when they fail. Then saying out loud what each choice cost you.',
  },

  {
    slug: 'how-the-interview-works',
    title: 'How a system design interview actually works',
    oneLine: 'Forty-five minutes, a vague question, and someone scoring how you think.',
    body: [
      'Someone says "design a system for booking cinema seats". Then they go quiet. That is the whole question. It is vague **on purpose**. The first thing they test is whether you make the question clear before you start answering it.',
      'Here is what really happens in the room. You talk for most of the time. You draw boxes on a whiteboard or a shared doc. The interviewer stops you with questions. They are not waiting for the end to grade your drawing. They score the conversation while it happens.',
      'The most common way people fail is not lack of knowledge. It is **drawing too early.** Someone hears "cinema seats", feels a little panic, and starts drawing a load balancer and a database. They have not asked how many users there are, whether seats have numbers, or what happens when two people pick the same seat. Every box after that is a guess, and the interviewer can tell.',
      'The second most common failure is going silent. If you think for ninety seconds without speaking, the interviewer learns nothing about you. Thinking out loud is not a bonus here. It is the whole point. A slightly weaker design that you explain clearly beats a better design you built in silence.',
      'The third is answering a different question. If they ask what happens when a whole region goes down, and you talk about your cache, you have not answered. They notice.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'Roughly where a 45-minute round goes. Notice how little of it is drawing.',
        items: [
          { label: 'Requirements — making the question clear', value: 5, display: '~5 min', tone: 'accent' },
          { label: 'Actors and lifecycle', value: 6, display: '~6 min', tone: 'accent' },
          { label: 'Numbers — the maths that changes your mind', value: 6, display: '~6 min', tone: 'accent' },
          { label: 'High-level design — the boxes', value: 12, display: '~12 min', tone: 'muted' },
          { label: 'Deep dive, trade-offs and follow-ups', value: 16, display: '~16 min', tone: 'muted' },
        ],
        note: 'The first 17 minutes happen before you draw the real design. People who skip them spend the last 16 defending boxes they cannot explain.',
      },
    },
    keyPoints: [
      'The question is vague on purpose. Making it clear is the first thing they score.',
      'You talk for most of the time. Silent thinking teaches the interviewer nothing.',
      'Drawing too early is the most common failure, and it is not about knowledge.',
      'They interrupt on purpose. Being interrupted is normal, not a bad sign.',
    ],
    remember:
      'They score how you think, out loud, in real time. Not the picture you end up with.',
  },

  {
    slug: 'the-five-stages',
    title: 'The five stages — the spine of every answer',
    oneLine: 'One order to work in, so you never freeze in front of a blank whiteboard.',
    body: [
      'People freeze because the question is huge and there is no clear first move. The fix is to always use the same first move. These five stages are that move. It is a fixed order you use on every problem, so you are never deciding what to do next while someone watches you.',
      '**Stage 1 — Requirements.** Say your assumptions out loud. Ask one or two questions that would really change the design. Then suggest the scope yourself. Here is the test for whether to ask something: would the answer change a box on the whiteboard? If it only changes a screen or a setting, assume it out loud and move on.',
      '**Stage 2 — Actors and lifecycle.** Who touches this system? Include the system itself. Then write the life of the main thing as a chain of states, from start to end. Then do the part everyone skips: add the failure branches. At each state, ask two questions. What if this never finishes? What if one side quits here? A lifecycle with only the happy path is half a lifecycle. The missing half is where most of the design work is.',
      '**Stage 3 — Numbers.** Estimate requests per second, storage, and bandwidth. Then say one sentence you must not skip: "so the hard part here is ___." If the numbers did not change your mind about anything, you either did the maths wrong or you ignored the answer.',
      '**Stage 4 — High-level design.** Now, at last, boxes and arrows. Every box needs a reason from Stage 1 or Stage 3. A part that nobody asked for loses you points.',
      '**Stage 5 — Deep dive and trade-offs.** Pick the two hardest parts and go deep on them. After every decision, say what it costs. Someone who picks a slightly worse option and names the cost scores higher than someone who picks the best option in silence.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption: 'Always this order. The first three stages are what make the last two easy to defend.',
        nodes: [
          { id: 'r', label: '1. Requirements', sub: 'make it clear', kind: 'service', col: 0, row: 0 },
          { id: 'l', label: '2. Lifecycle', sub: 'and its failures', kind: 'service', col: 1, row: 0 },
          { id: 'n', label: '3. Numbers', sub: 'so the hard part is…', kind: 'service', col: 2, row: 0 },
          { id: 'd', label: '4. Design', sub: 'every box has a reason', kind: 'service', col: 3, row: 0 },
          { id: 't', label: '5. Trade-offs', sub: 'name every cost', kind: 'service', col: 4, row: 0 },
        ],
        edges: [
          { from: 'r', to: 'l' },
          { from: 'l', to: 'n' },
          { from: 'n', to: 'd' },
          { from: 'd', to: 't' },
        ],
      },
    },
    keyPoints: [
      'Having a fixed first move is what stops you freezing.',
      'Stages 1 to 3 take about a third of the time. They make everything after them easy to defend.',
      'Every box in Stage 4 must point back to Stage 1 or Stage 3.',
      'Stage 5 is where senior level shows: say the cost of each decision, out loud.',
    ],
    remember:
      'Requirements, lifecycle, numbers, design, trade-offs. Same order, every single time.',
  },

  {
    slug: 'where-is-the-slack',
    title: "Where's the slack?",
    oneLine: 'How much time the system has before a person notices. This one question decides most designs.',
    body: [
      'This is the most useful question in the whole app, and almost nobody asks it. **Slack means how much time you have before a person notices that something has not happened yet.**',
      'Take two products that look the same on a whiteboard. Ride hailing: a person stands on the street with a phone, waiting for a car. Food delivery: a person ordered dinner, and the restaurant needs fifteen minutes to cook it.',
      'Both are "match a customer with a driver". But ride hailing has **no slack at all.** Every second of matching is a second someone stands in the rain watching a spinner. So the matching must be quick and simple: take a good driver now, not the best driver in forty seconds.',
      'Food delivery has **fifteen minutes of slack**, hidden inside the cooking time. Nobody is watching. So you can collect orders for a minute, group them together, wait for a better courier to finish, and hand out the whole set in the best way. That is a completely different system. And it is better exactly because the slack is there.',
      'Same-looking problem. Opposite designs. What separated them was not size or technology. It was how long you have before someone notices.',
      'Slack decides "do it now" versus "do it soon" more than anything else. No slack means the work happens right away, inside the request, while the user waits. Slack means the work goes on a queue and happens shortly after. That is cheaper, survives failures better, and lets you group work together. Ask this question before you draw anything.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The same shape of problem, split by one question.',
        a: {
          title: 'Ride hailing — no slack',
          points: [
            'A person is outside, watching a spinner. Ten seconds feels broken.',
            'Match fast and simply: a good driver now beats the best driver later.',
            'Finding the perfect match is the better algorithm and the wrong product.',
            'The user sees failures as they happen.',
          ],
        },
        b: {
          title: 'Food delivery — 15 minutes of slack',
          points: [
            'The restaurant is cooking. Nobody is watching the assignment.',
            'Collect orders, group them, wait for a better courier, then assign them all well.',
            'Clearly better assignments, hidden inside the cooking time.',
            'You can retry, re-plan and change your mind before anyone notices.',
          ],
        },
        verdict:
          'Ask "where is the slack?" before you draw a single box. It decides do-it-now versus do-it-soon, whether you can group work together, and how much you can retry. It matters more than size does.',
      },
    },
    keyPoints: [
      'Slack is the time before a person notices, not the time before the machine finishes.',
      'No slack means do it now, inside the request. Slack means queue it and group it.',
      'Two products that look the same get opposite designs when their slack is different.',
      'Every problem page in this app answers this question directly.',
    ],
    remember:
      'Before drawing anything, ask how long the system has before someone notices. That answer designs half the system for you.',
  },

  {
    slug: 'the-vocabulary',
    title: 'The words you need, in plain English',
    oneLine: 'Twelve words that unlock every other page. Nothing left undefined.',
    body: [
      'Each of these gets a full page later. This list is here so no word on those pages is new to you.',
      '**Latency** — how long one request takes. **Throughput** — how many requests you handle per second. They are different things, and making one better often makes the other worse.',
      '**Client and server** — the client asks (a phone, a browser), the server answers. The **request** is the question and the **response** is the answer.',
      '**Load balancer** — one address in front of several servers. It spreads requests between them and skips any server that stops answering.',
      '**Cache** — a copy of an answer, kept somewhere faster and closer. Most requests never reach the real source. The price is that the copy can be out of date.',
      '**Database** — where the truth is kept, on disk, so it survives a restart. **Replica** — a copy of the database that keeps up with it. You use replicas to survive failure and to serve reads.',
      '**Shard, or partition** — splitting the data so different machines own different pieces. It is the only way to take more writes than one machine can handle.',
      '**Queue** — a list of jobs, written down now and done shortly after. It stops the fast part of your system waiting on the slow part.',
      '**Stateless** — a server that keeps nothing important in its own memory. Any server can handle any request, so losing one costs you nothing.',
      '**Consistency** — whether everyone sees the same data at the same moment. **Eventual consistency** means they will agree soon, but not right now.',
      '**Availability** — whether the system answers at all. A system can be up and wrong, or correct and down. Choosing which you prefer, feature by feature, is real design work.',
      '**Idempotent** — doing it twice has the same result as doing it once. This matters a lot, because networks make things happen twice all the time.',
    ],
    keyPoints: [
      'Latency is per request. Throughput is per second. Improving one often hurts the other.',
      'A cache trades freshness for speed. A replica trades freshness for safety and more reads.',
      'Partitioning is the only way past one machine\'s write limit. Replication does not help writes.',
      'Idempotent means safe to repeat. On a network, everything gets repeated eventually.',
    ],
    remember:
      'You do not need all of these today. You just need to not get stuck when the word shows up on the next page.',
  },
]

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug)
}
