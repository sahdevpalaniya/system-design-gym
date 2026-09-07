import type { Lesson } from '@/lib/types'

/**
 * The "start from scratch" path. These come before any concept page and assume
 * nothing — no distributed systems vocabulary, no interview experience.
 */
export const LESSONS: Lesson[] = [
  {
    slug: 'what-is-system-design',
    title: 'What is system design?',
    oneLine: 'Deciding how the pieces of a product fit together, before anyone writes code.',
    body: [
      'When you write code, you decide how one program behaves. System design is one level up: you decide **how many programs there are, what each one is responsible for, where the data lives, and what happens when one of them breaks.**',
      'Here is the smallest possible example. You build a website. At first it is one program on one computer, with the data in a file next to it. That works until two things happen: more people show up than one computer can serve, and the computer eventually restarts. The moment you say "let us run two of them, and put the data somewhere both can reach", you have done system design. Everything else in this app is that same move, repeated at bigger sizes and with harder constraints.',
      'The thing that surprises people is that system design is almost never about knowing more technology. It is about **making a small number of decisions in the right order, and being able to say what each one costs.** A senior engineer and a junior engineer often name the same components. The difference is that the senior one can tell you why each is there and what they gave up to have it.',
      'There is rarely a single right answer. There are answers that fit the requirements and answers that do not, and among the ones that fit, there are tradeoffs you chose on purpose and tradeoffs you walked into by accident. Interviews are looking for the first kind.',
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
      'It is about responsibilities and data placement, not about knowing more tools.',
      'Every component you add has a price. Being able to name the price is the skill.',
      'There is no single right answer — only answers that fit the requirements, and tradeoffs you chose deliberately.',
      'The same handful of moves repeat at every scale. You are learning maybe fifteen ideas, not a hundred.',
    ],
    remember:
      'System design is choosing where things live and what breaks when they fail — and being able to say what each choice cost you.',
  },

  {
    slug: 'how-the-interview-works',
    title: 'How a system design interview actually works',
    oneLine: 'Forty-five minutes, a vague question, and an interviewer scoring how you think.',
    body: [
      'Someone says "design a system for booking cinema seats" and then goes quiet. That is the whole prompt. It is vague **on purpose** — the first thing being tested is whether you make the question concrete before you start answering it.',
      'What actually happens in the room: you talk for most of it, you draw boxes on a whiteboard or a shared doc, and the interviewer interrupts with questions. They are not waiting for you to finish and then grading the diagram. They are scoring the conversation as it happens.',
      'The single most common way people fail is not ignorance. It is **starting to draw immediately.** Someone hears "cinema seats", panics slightly, and begins drawing a load balancer and a database — before establishing how many people, whether seats are numbered, or whether two people can book the same seat. Every box after that is a guess, and the interviewer knows it.',
      'The second most common failure is silence. If you think for ninety seconds without speaking, the interviewer has learned nothing about you. Thinking out loud is not a nice extra here — it is the entire medium. A slightly worse design explained clearly beats a better design produced silently.',
      'The third: answering a question you were not asked. If they ask about handling a region outage and you explain your caching strategy, you have not answered. Interviewers notice.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'Roughly where a 45-minute round goes. Notice how little of it is drawing.',
        items: [
          { label: 'Requirements — making the question concrete', value: 5, display: '~5 min', tone: 'accent' },
          { label: 'Actors and lifecycle', value: 6, display: '~6 min', tone: 'accent' },
          { label: 'Numbers — the estimate that changes your mind', value: 6, display: '~6 min', tone: 'accent' },
          { label: 'High-level design — the boxes', value: 12, display: '~12 min', tone: 'muted' },
          { label: 'Deep dive, tradeoffs and follow-ups', value: 16, display: '~16 min', tone: 'muted' },
        ],
        note: 'The first 17 minutes are before you draw the real design. People who skip them spend the last 16 defending boxes they cannot justify.',
      },
    },
    keyPoints: [
      'The prompt is deliberately vague. Making it concrete is the first thing being scored.',
      'You talk for most of it. Silent thinking teaches the interviewer nothing.',
      'Drawing immediately is the most common failure, and it is not a knowledge problem.',
      'Interviewers interrupt on purpose. Being interrupted is normal, not a bad sign.',
    ],
    remember:
      'They are scoring how you think, out loud, in real time — not the diagram you end up with.',
  },

  {
    slug: 'the-five-stages',
    title: 'The five stages — the spine of every answer',
    oneLine: 'One order to work in, so you never freeze in front of a blank whiteboard.',
    body: [
      'Freezing happens because the question is enormous and there is no obvious first move. The fix is to always have the same first move. These five stages are that: a fixed order you apply to every problem, so you are never deciding what to do next while someone watches.',
      '**Stage 1 — Requirements.** State your assumptions out loud, ask one or two questions that would genuinely change the design, then propose the scope yourself. The test for whether to ask something: does the answer change a box on the whiteboard? If it only changes a screen or a setting, assume it aloud and move on.',
      '**Stage 2 — Actors and lifecycle.** Who touches this system, including the system itself? Then write the main thing\'s life as a chain of states, start to finish. Then the part everyone skips: add the failure branches. At each state, ask what happens if this never finishes, or if either side quits here. A lifecycle with only the happy path is half a lifecycle, and the missing half is where the design lives.',
      '**Stage 3 — Numbers.** Estimate requests per second, storage, bandwidth. Then say one mandatory sentence: "so the hard part here is ___." If the numbers did not change your mind about anything, you either did the maths wrong or you ignored the answer.',
      '**Stage 4 — High-level design.** Now, finally, boxes and arrows. Every box must be justified by a requirement from Stage 1 or a number from Stage 3. A component nobody asked for loses points.',
      '**Stage 5 — Deep dive and tradeoffs.** Pick the two hardest parts and go deep. After every decision, say what it costs. Someone who picks a slightly worse option and names the tradeoff scores higher than someone who picks the best option silently.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption: 'Always this order. The first three stages are what make the last two defensible.',
        nodes: [
          { id: 'r', label: '1. Requirements', sub: 'make it concrete', kind: 'service', col: 0, row: 0 },
          { id: 'l', label: '2. Lifecycle', sub: 'and its failures', kind: 'service', col: 1, row: 0 },
          { id: 'n', label: '3. Numbers', sub: 'so the hard part is…', kind: 'service', col: 2, row: 0 },
          { id: 'd', label: '4. Design', sub: 'every box justified', kind: 'service', col: 3, row: 0 },
          { id: 't', label: '5. Tradeoffs', sub: 'name every cost', kind: 'service', col: 4, row: 0 },
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
      'Stages 1 to 3 take about a third of the time and make everything after them defensible.',
      'Every box in Stage 4 must point back to Stage 1 or Stage 3.',
      'Stage 5 is where seniority shows: name the cost of each decision, out loud.',
    ],
    remember:
      'Requirements, lifecycle, numbers, design, tradeoffs. Same order, every single time.',
  },

  {
    slug: 'where-is-the-slack',
    title: "Where's the slack?",
    oneLine: 'How long the system has before a human notices — the question that decides most designs.',
    body: [
      'This is the most useful question in the whole app, and almost nobody asks it. **Slack is how much time you have before a person notices something has not happened yet.**',
      'Take two products that look identical on a whiteboard. Ride hailing: a person is standing on a street with a phone, waiting for a car. Food delivery: a person has ordered dinner, and the restaurant needs fifteen minutes to cook it.',
      'Both are "match a customer with a driver". But ride hailing has **zero slack** — every second of matching is a second someone stands in the rain watching a spinner. So matching must be greedy and immediate: take a good driver now, not the best driver in forty seconds.',
      'Food delivery has **fifteen minutes of slack**, hiding inside the cooking time. Nobody is watching. So you can collect orders for a minute, batch them, wait for a better courier to come free, and assign the whole set optimally. That is a completely different system, and it is better precisely because the slack exists.',
      'Same-looking problem. Opposite designs. The thing that separated them was not scale or technology — it was how long you have before someone notices.',
      'Slack decides synchronous versus asynchronous more than anything else. If there is no slack, the work happens now, in the request, while the user waits. If there is slack, the work goes on a queue and happens soon — which is cheaper, more resilient, and lets you batch. Ask this question before you draw anything.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The same shape of problem, split by one question.',
        a: {
          title: 'Ride hailing — no slack',
          points: [
            'A person is outside, watching a spinner. Ten seconds feels broken.',
            'Match greedily and immediately: a good driver now beats the best driver later.',
            'Global optimisation is the better algorithm and the wrong product.',
            'Failure branches are visible to the user as they happen.',
          ],
        },
        b: {
          title: 'Food delivery — 15 minutes of slack',
          points: [
            'The restaurant is cooking. Nobody is watching the assignment.',
            'Collect orders, batch them, wait for a better courier, assign optimally.',
            'Measurably better assignments, hidden entirely inside the cooking time.',
            'You can retry, re-plan and change your mind before anyone notices.',
          ],
        },
        verdict:
          'Ask "where is the slack?" before you draw a single box. It decides synchronous versus asynchronous, whether you can batch, and how much you are allowed to retry — more than scale does.',
      },
    },
    keyPoints: [
      'Slack is the time before a human notices, not the time before the machine finishes.',
      'No slack means do it now, in the request. Slack means queue it and batch it.',
      'Two identical-looking products get opposite designs when their slack differs.',
      'Every problem page in this app answers this question explicitly.',
    ],
    remember:
      'Before drawing anything, ask how long the system has before someone notices. That answer designs half the system for you.',
  },

  {
    slug: 'the-vocabulary',
    title: 'The words you need, in plain English',
    oneLine: 'Twelve terms that unlock every other page. No jargon left undefined.',
    body: [
      'Every one of these gets a full page later. This is just so nothing on those pages is a word you have never met.',
      '**Latency** — how long one request takes. **Throughput** — how many requests you handle per second. They are different, and improving one often hurts the other.',
      '**Client and server** — the client asks (a phone, a browser), the server answers. **Request** and **response** are the question and the answer.',
      '**Load balancer** — one address in front of several servers, spreading requests between them and skipping any that stop answering.',
      '**Cache** — a copy of an answer kept somewhere faster and closer, so most requests never reach the real source. The cost is that the copy can be out of date.',
      '**Database** — where the truth lives, on disk, so it survives a restart. **Replica** — a copy of the database that stays in step, used to survive failure and to serve reads.',
      '**Shard / partition** — splitting data so different machines own different pieces. It is the only way to take more writes than one machine can handle.',
      '**Queue** — a list of jobs written down now and done soon, so the fast part of your system does not wait on the slow part.',
      '**Stateless** — a server that keeps nothing important in its own memory, so any server can handle any request and losing one costs nothing.',
      '**Consistency** — whether everyone sees the same data at the same moment. **Eventual consistency** means they will agree soon, but not right now.',
      '**Availability** — whether the system answers at all. A system can be available and wrong, or correct and down. Choosing which you prefer, per feature, is real design work.',
      '**Idempotent** — doing it twice has the same effect as doing it once. This matters enormously, because networks make things happen twice all the time.',
    ],
    keyPoints: [
      'Latency is per request; throughput is per second. They trade against each other.',
      'A cache trades freshness for speed. A replica trades freshness for durability and read capacity.',
      'Partitioning is the only way past one machine\'s write ceiling. Replication does not help writes.',
      'Idempotent means safe to repeat — and everything on a network gets repeated eventually.',
    ],
    remember:
      'You do not need all of these today. You need to not be stopped by the word when it appears on the next page.',
  },
]

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug)
}
