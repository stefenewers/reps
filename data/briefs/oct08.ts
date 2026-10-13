import type { Brief } from '@/data/briefs'

/** Plain-English briefs for the oct08 module: what each input is, what to hand back, the one thing to watch. */

const N = { name: 'n', is: 'how many nodes there are. They are numbered `0` up to `n-1`, so `n = 4` means nodes 0, 1, 2, 3.' }
const UNDIRECTED = { name: 'edges', is: 'a list of `[a, b]` pairs, like `[[0, 1], [2, 0]]`. Each pair is an **undirected** edge: it joins `a` and `b` in both directions.' }
const DIRECTED = { name: 'edges', is: 'a list of `[a, b]` pairs. Each pair is a **directed** edge: you can go from `a` to `b`, not from `b` to `a`.' }
const GRAPH = { name: 'graph', is: 'an adjacency list: a dict where each node is a key and its value is the list of its neighbors, like `{0: [1], 1: [0, 2], 2: [1]}`' }
const START = { name: 'start', is: 'the node to begin from. It is one of the keys of `graph`.' }

export const briefs: Record<string, Brief> = {
  // ── Adjacency lists ────────────────────────────────────────────────────────
  'o8-a-build-undirected': {
    inputs: [N, UNDIRECTED],
    returns: 'a **dict** with one key per node, `0` to `n-1`. Each value is the list of that node’s neighbors, in the order the edges mention them.',
    catch: 'Some nodes may not appear in any edge. They still need a key. When do those keys get made?',
  },
  'o8-a-dbg-one-way': {
    task: 'The code builds the graph and reads one node’s list. It gives the right answer for some nodes and not others. Fix the build.',
    inputs: [N, UNDIRECTED, { name: 'node', is: 'the node whose neighbors you want' }],
    returns: 'a sorted **list** of the nodes joined to `node` by an edge.',
    catch: 'In the edge `[0, 1]`, whose neighbor is whose?',
  },
  'o8-a-build-directed': {
    inputs: [N, DIRECTED],
    returns: 'a **dict** with one key per node, `0` to `n-1`. Each value is the list of nodes that node points **to**.',
    catch: 'One-way streets. If 2 points to 0, does 2 belong in 0’s list?',
  },
  'o8-a-dbg-shared-list': {
    task: 'Every node ends up with the same neighbors. Find out why and give each node its own list.',
    inputs: [N, UNDIRECTED],
    returns: 'a **dict**: every node `0` to `n-1` → the list of its own neighbors.',
    catch: 'Run the first test and look at node 2, which has no edges at all. How did anything get into its list?',
  },
  'o8-a-in-degree': {
    inputs: [N, DIRECTED],
    returns: 'a **list** of `n` numbers. The number at position `i` is how many edges point **into** node `i`.',
    catch: 'An edge a → b touches two nodes. Which one of them is being pointed at?',
  },
  'o8-a-matrix': {
    inputs: [{ name: 'm', is: 'a square list of lists of `0`s and `1`s, n rows by n columns. `m[i][j] == 1` means node `i` and node `j` are connected. The nodes are `0` to `n-1`, where `n` is the number of rows.' }],
    returns: 'a **dict**: each node → the list of nodes it is connected to, smallest first.',
    catch: 'Every `m[i][i]` can be `1`. A node is not its own neighbor.',
  },

  // ── Graph DFS ──────────────────────────────────────────────────────────────
  'o8-d-order': {
    inputs: [GRAPH, START],
    returns: 'a **list** of nodes in the order the search first reaches them. `start` is first. Nodes that cannot be reached are not in it.',
    catch: 'Two neighbors can both lead to the same node. It must appear in the list only once.',
  },
  'o8-v-fix-bounce': {
    task: 'Run it: it never finishes. Make it count each node that can be reached exactly once.',
    inputs: [{ name: 'graph', is: 'an adjacency list of an undirected graph: node → list of neighbors. If 1 is in 0’s list, then 0 is in 1’s list.' }, START],
    returns: 'a number: how many nodes can be reached from `start`, counting `start` itself.',
    catch: 'From 0 it goes to 1. Where does it go from 1?',
  },
  'o8-d-stack': {
    inputs: [GRAPH, START],
    returns: 'a **sorted list** of every node you can get to from `start` by following edges, including `start`.',
    catch: 'A node can be the neighbor of several others. How do you make sure it goes on the stack only once?',
  },
  'o8-d-translate': {
    task: 'The top function already works. Write a second one that gives the same answer, using a function that calls itself instead of a loop over a stack.',
    inputs: [GRAPH, START],
    returns: 'the same **sorted list** `component_of` returns: every node reachable from `start`, including `start`.',
    catch: 'In the loop version, a node is remembered when it is pushed. In your version there is no push. When is a node remembered?',
  },
  'o8-d-directed-reach': {
    inputs: [
      N,
      DIRECTED,
      { name: 'src', is: 'the node you begin at' },
      { name: 'dst', is: 'the node you are trying to get to' },
    ],
    returns: '`True` if following edges in their direction can take you from `src` to `dst`, otherwise `False`. A node can always reach itself.',
    catch: 'You are given pairs, not a graph. And a path from 0 to 2 does not mean there is one from 2 to 0.',
  },
  'o8-d-dbg-directed-both': {
    task: 'It counts too many junctions. Make it count only the ones water can actually flow to.',
    inputs: [
      { name: 'n', is: 'how many junctions there are, numbered `0` to `n-1`' },
      { name: 'pipes', is: 'a list of `[a, b]` pairs. Water flows from `a` to `b` only.' },
      { name: 'src', is: 'the junction where the water enters' },
    ],
    returns: 'a number: how many junctions the water reaches, counting `src`.',
    catch: 'Put water in at the last junction of the second test. Where can it go?',
  },
  'o8-d-path': {
    task: 'The outer function is written. Fill in the inner `dfs(node)` so that it hands back a path from `node` to `target`, or `None`.',
    inputs: [
      GRAPH,
      START,
      { name: 'target', is: 'the node to get to. It can be the same node as `start`.' },
    ],
    returns: 'a **list** of nodes that begins with `start` and ends with `target`, each joined to the next by an edge. `None` if there is no way there.',
    catch: 'If a neighbor hands you back a path from itself to `target`, what is missing from the front of it?',
  },

  // ── Graph BFS ──────────────────────────────────────────────────────────────
  'o8-b-order': {
    inputs: [GRAPH, START],
    returns: 'a **list** of the nodes reachable from `start`, nearest first: `start`, then its neighbors in list order, then theirs.',
    catch: 'The oldest node waiting goes next, not the newest. Which end of the queue is that?',
  },
  'o8-b-dbg-pop-end': {
    task: 'It visits every node, but in the wrong order. Make it visit nearer nodes before farther ones.',
    inputs: [GRAPH, START],
    returns: 'a **list** of the nodes reachable from `start`: everything 1 edge away comes before anything 2 edges away.',
    catch: 'When several nodes are waiting, which one does this code take next?',
  },
  'o8-b-distances': {
    inputs: [GRAPH, START],
    returns: 'a **dict**: each node you can reach → the fewest edges from `start` to it. `start` maps to `0`. Nodes you cannot reach are not in it.',
    catch: 'When you first reach a node from one of its neighbors, how far is it compared with that neighbor?',
  },
  'o8-b-dbg-late-mark': {
    task: 'Some distances come out too big. Make every node get its smallest distance.',
    inputs: [GRAPH, START],
    returns: 'a **dict**: each reachable node → the fewest edges from `start` to it.',
    catch: 'In the first test, count how many times node 2 is put on the queue.',
  },
  'o8-b-shortest': {
    inputs: [
      N,
      UNDIRECTED,
      { name: 'src', is: 'the node you begin at' },
      { name: 'dst', is: 'the node you want to get to. It can be the same as `src`.' },
    ],
    returns: 'a number: the fewest edges you must cross to get from `src` to `dst`. `0` if they are the same node, `-1` if you cannot get there.',
    catch: 'Finding *a* way there is not enough. How do you know no shorter way exists?',
  },
  'o8-fu-fewest-hops': {
    task: 'The code given answers yes or no. Change it so it answers how many edges.',
    inputs: [
      N,
      UNDIRECTED,
      { name: 'source', is: 'the node you begin at' },
      { name: 'destination', is: 'the node you want to get to' },
    ],
    returns: 'a number: the fewest edges between them. `0` if they are the same node, `-1` if there is no way.',
    catch: 'The given code goes deep down one branch first. Is the first way it finds always the shortest?',
  },

  // ── Components ─────────────────────────────────────────────────────────────
  'o8-c-count': {
    inputs: [N, UNDIRECTED],
    returns: 'a number: how many connected components the graph has. A node with no edges counts as one.',
    catch: 'One walk covers one whole group. What tells you, later in the loop, that a node already belongs to a group you counted?',
  },

  // ── Directed cycles ────────────────────────────────────────────────────────
  'o8-y-has-cycle': {
    inputs: [N, DIRECTED],
    returns: '`True` if you can follow the arrows from some node and arrive back at it, otherwise `False`.',
    catch: 'Reaching a node for the second time is not always a cycle. Think of the diamond: two routes into node 3.',
  },
  'o8-y-dbg-no-visiting': {
    task: 'It answers `False` for every graph. Make it tell a cycle from no cycle.',
    inputs: [{ name: 'graph', is: 'a directed graph as a dict: each node → the list of nodes it points to. Every node is a key.' }],
    returns: '`True` if the graph has a cycle, otherwise `False`.',
    catch: 'When the search meets a node it already knows, what two different situations could that be?',
  },
  'o8-y-dbg-never-done': {
    task: 'It finds real cycles, but it also reports cycles that are not there. Fix that.',
    inputs: [N, DIRECTED],
    returns: '`True` only when the graph really has a cycle, otherwise `False`.',
    catch: 'In the first test, look at node 3 after the branch through node 1 has finished with it. What state is it left in?',
  },
  'o8-y-wt-diamond': {
    task: 'You are not fixing `naive_cycle`. You are building the one graph that proves it wrong.',
    returns: 'a directed graph as a **dict** (each node → list of nodes it points to, every node a key). It must have **no** cycle, and `naive_cycle` must still say `True` for it.',
    catch: '`naive_cycle` complains the second time it meets any node. How can a node be met twice without a cycle?',
  },
  'o8-y-reachable-cycle': {
    inputs: [
      { name: 'graph', is: 'a dict: each mode name (a string) → the list of modes the machine may switch to from there. Every mode is a key. `[]` means the machine halts there.' },
      { name: 'start', is: 'the mode the machine begins in' },
    ],
    returns: '`True` if the machine could keep switching forever, `False` if every route from `start` ends at a halt.',
    catch: 'Two routes that merge into the same mode and then halt are not "forever". And a loop the machine can never get to does not count.',
  },
  'o8-y-kahn-write': {
    inputs: [N, DIRECTED],
    returns: '`True` if every node can be removed one at a time, each only once nothing points into it any more. `False` if some nodes can never be removed.',
    catch: 'Which nodes can go first? And after one goes, whose count changes?',
  },
  'o8-c-dbg-visited-reset': {
    task: 'The function should count the separate groups of connected nodes. Right now it reports too many. Find why and fix it.',
    inputs: [
      { name: 'n', is: 'how many nodes there are, numbered `0` to `n - 1`' },
      { name: 'edges', is: 'a list of `[a, b]` pairs. Each pair joins two nodes, in both directions.' },
    ],
    returns: 'the number of connected components, as an int.',
    catch: 'How long does the record of where you have been need to live: one walk, or the whole count?',
  },
  'o8-c-dbg-missing-isolated': {
    task: 'The function should count the connected components, and a node with no edges at all is a component by itself. Make it count those too.',
    inputs: [
      { name: 'n', is: 'how many nodes there are, numbered `0` to `n - 1`' },
      { name: 'edges', is: 'a list of `[a, b]` pairs, each joining two nodes in both directions. Some nodes may appear in no pair.' },
    ],
    returns: 'the number of connected components, as an int.',
    catch: 'Which nodes does the code ever look at? Is that all `n` of them?',
  },
}
