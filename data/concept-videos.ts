/**
 * Concept videos: each teaches the underlying idea, not one problem's solution.
 * Every link was checked on 2026-10-15 against YouTube's oEmbed API (real title and
 * channel) and its watch page (playable, length).
 */
export interface ConceptVideo {
  title: string
  url: string
  channel: string
  /** e.g. "12 min" */
  duration: string
  purpose: 'concept'
}

export const CONCEPT_VIDEOS: Record<string, ConceptVideo[]> = {
  'python-basics': [
    { title: 'Python for Coding Interviews - Everything you need to Know', url: 'https://www.youtube.com/watch?v=0K_eZGS5NsU', channel: 'NeetCode', duration: '26 min', purpose: 'concept' },
    { title: 'Python Tutorial for Beginners 7: Loops and Iterations - For/While Loops', url: 'https://www.youtube.com/watch?v=6iF8Xb7Z3wQ', channel: 'Corey Schafer', duration: '10 min', purpose: 'concept' },
  ],
  'sets': [
    { title: 'Hash Tables: Hash Functions, Sets, & Maps - DSA Course in Python Lecture 4', url: 'https://www.youtube.com/watch?v=iZyxNEBpqFY', channel: 'Greg Hogg', duration: '26 min', purpose: 'concept' },
    { title: 'Sets in Python  ||  Python Tutorial  ||  Learn Python Programming', url: 'https://www.youtube.com/watch?v=sBvaPopWOmQ', channel: 'Socratica', duration: '7 min', purpose: 'concept' },
  ],
  'dictionaries': [
    { title: 'Python Tutorial for Beginners 5: Dictionaries - Working with Key-Value Pairs', url: 'https://www.youtube.com/watch?v=daefaLgNkw0', channel: 'Corey Schafer', duration: '10 min', purpose: 'concept' },
    { title: 'HashMaps in Python Tutorial - Data Structures for Coding Interviews', url: 'https://www.youtube.com/watch?v=RcZsTI5h0kg', channel: 'Codebagel', duration: '16 min', purpose: 'concept' },
  ],
  'frequency-maps': [
    { title: 'Intermediate Python Tutorial #6 - Collections /Counter()', url: 'https://www.youtube.com/watch?v=cgDRugJzBfM', channel: 'Tech With Tim', duration: '12 min', purpose: 'concept' },
    { title: 'Counters in Python Simply Explained', url: 'https://www.youtube.com/watch?v=yrV__XKaFn8', channel: 'NeuralNine', duration: '12 min', purpose: 'concept' },
  ],
  'index-maps': [
    { title: 'Coding Interview Patterns - HashSet and HashMap', url: 'https://www.youtube.com/watch?v=bGw2-Pdg_78', channel: 'Nikhil Lohia', duration: '20 min', purpose: 'concept' },
    { title: 'HashMaps in Python Tutorial - Data Structures for Coding Interviews', url: 'https://www.youtube.com/watch?v=RcZsTI5h0kg', channel: 'Codebagel', duration: '16 min', purpose: 'concept' },
  ],
  'strings': [
    { title: 'Python Tutorial: Slicing Lists and Strings', url: 'https://www.youtube.com/watch?v=ajrtAuDg3yw', channel: 'Corey Schafer', duration: '11 min', purpose: 'concept' },
    { title: 'Python Tutorial for Beginners 2: Strings - Working with Textual Data', url: 'https://www.youtube.com/watch?v=k9TUPpGqYTo', channel: 'Corey Schafer', duration: '21 min', purpose: 'concept' },
  ],
  'two-pointers': [
    { title: '2 Pointers Algorithm - DSA Course in Python Lecture 12', url: 'https://www.youtube.com/watch?v=syTs9_w-pwA', channel: 'Greg Hogg', duration: '8 min', purpose: 'concept' },
    { title: 'Two Pointers in 7 minutes | LeetCode Pattern', url: 'https://www.youtube.com/watch?v=QzZ7nmouLTI', channel: 'AlgoMasterIO', duration: '7 min', purpose: 'concept' },
  ],
  'running-state': [
    { title: 'Kadane\'s Algorithm to Maximum Sum Subarray Problem', url: 'https://www.youtube.com/watch?v=86CQq3pKSUw', channel: 'CS Dojo', duration: '11 min', purpose: 'concept' },
    { title: 'Prefix Sum Array and Range Sum Queries', url: 'https://www.youtube.com/watch?v=xbYr9JOC2Lk', channel: 'Profound Academy', duration: '7 min', purpose: 'concept' },
  ],
  'sliding-window': [
    { title: 'Sliding Window Algorithm - Variable Length + Fixed Length - DSA Course in Python Lecture 13', url: 'https://www.youtube.com/watch?v=GaXwHThEgGk', channel: 'Greg Hogg', duration: '21 min', purpose: 'concept' },
    { title: 'Sliding Window in 7 minutes | LeetCode Pattern', url: 'https://www.youtube.com/watch?v=y2d0VHdvfdc', channel: 'AlgoMasterIO', duration: '8 min', purpose: 'concept' },
  ],
  'stacks': [
    { title: 'Stacks & Queues - DSA Course in Python Lecture 5', url: 'https://www.youtube.com/watch?v=vOx3vY1w4tM', channel: 'Greg Hogg', duration: '15 min', purpose: 'concept' },
    { title: 'Data Structures: Stacks and Queues', url: 'https://www.youtube.com/watch?v=wjI1WNcIntg', channel: 'HackerRank', duration: '6 min', purpose: 'concept' },
  ],
  'binary-search': [
    { title: 'Binary Search - A Different Perspective | Python Algorithms', url: 'https://www.youtube.com/watch?v=tgVSkMA8joQ', channel: 'mCoding', duration: '9 min', purpose: 'concept' },
    { title: 'Binary Search - CS50 Shorts', url: 'https://www.youtube.com/watch?v=T98PIp4omUA', channel: 'CS50', duration: '10 min', purpose: 'concept' },
  ],
  'linked-lists': [
    { title: 'Linked Lists - Singly & Doubly Linked - DSA Course in Python Lecture 3', url: 'https://www.youtube.com/watch?v=dqLHTK7RuIo', channel: 'Greg Hogg', duration: '17 min', purpose: 'concept' },
    { title: 'Data Structures: Linked Lists', url: 'https://www.youtube.com/watch?v=njTh_OwMljA', channel: 'HackerRank', duration: '8 min', purpose: 'concept' },
  ],
  'recursion': [
    { title: '5 Simple Steps for Solving Any Recursive Problem', url: 'https://www.youtube.com/watch?v=ngCos392W4w', channel: 'Reducible', duration: '21 min', purpose: 'concept' },
    { title: 'Recursion - Recursive Call Stacks & Algorithms - DSA Course in Python Lecture 6', url: 'https://www.youtube.com/watch?v=TGT79h7e7tE', channel: 'Greg Hogg', duration: '19 min', purpose: 'concept' },
  ],
  'trees': [
    { title: 'Binary tree traversal: Preorder, Inorder, Postorder', url: 'https://www.youtube.com/watch?v=gm8DUJJhmY4', channel: 'mycodeschool', duration: '14 min', purpose: 'concept' },
    { title: 'Data Structures: Trees', url: 'https://www.youtube.com/watch?v=oSWTXtMglKE', channel: 'HackerRank', duration: '10 min', purpose: 'concept' },
  ],
  'tries': [
    { title: 'Data Structures: Tries', url: 'https://www.youtube.com/watch?v=zIjfhVPRZCg', channel: 'HackerRank', duration: '5 min', purpose: 'concept' },
  ],
  'bfs': [
    { title: 'Breadth First Search (BFS): Visualized and Explained', url: 'https://www.youtube.com/watch?v=xlVX7dXLS64', channel: 'Reducible', duration: '11 min', purpose: 'concept' },
    { title: 'Breadth First Search Algorithm | Shortest Path | Graph Theory', url: 'https://www.youtube.com/watch?v=oDqjPvD54Ss', channel: 'WilliamFiset', duration: '7 min', purpose: 'concept' },
  ],
  'grids': [
    { title: 'Breadth First Search grid shortest path | Graph Theory', url: 'https://www.youtube.com/watch?v=KiCBXu4P-2Y', channel: 'WilliamFiset', duration: '17 min', purpose: 'concept' },
  ],
  'graphs': [
    { title: 'Graphs: Edge List, Adjacency Matrix, Adjacency List, DFS, BFS - DSA Course in Python Lecture 11', url: 'https://www.youtube.com/watch?v=4jyESQDrpls', channel: 'Greg Hogg', duration: '32 min', purpose: 'concept' },
    { title: 'Top 5 Most Common Graph Algorithms for Coding Interviews', url: 'https://www.youtube.com/watch?v=utDu3Q7Flrw', channel: 'NeetCode', duration: '13 min', purpose: 'concept' },
  ],
  'heaps': [
    { title: 'Heaps & Priority Queues - Heapify, Heap Sort, Heapq Library - DSA Course in Python Lecture 9', url: 'https://www.youtube.com/watch?v=E2v9hBgG6gE', channel: 'Greg Hogg', duration: '24 min', purpose: 'concept' },
    { title: 'Data Structures: Heaps', url: 'https://www.youtube.com/watch?v=t0Cq6tVNRBA', channel: 'HackerRank', duration: '11 min', purpose: 'concept' },
  ],
  'intervals': [
    { title: 'Introduction to Intervals and Overlapping Intervals | Coding Interview Pattern', url: 'https://www.youtube.com/watch?v=Vk3EjoMn-1c', channel: 'Dinesh Varyani', duration: '8 min', purpose: 'concept' },
    { title: 'Interval Coding Pattern | FAANG Interview Prep', url: 'https://www.youtube.com/watch?v=HNSHVtSGMFk', channel: 'Destination FAANG', duration: '32 min', purpose: 'concept' },
  ],
  'backtracking': [
    { title: 'The Backtracking Blueprint: The Legendary 3 Keys To Backtracking Algorithms', url: 'https://www.youtube.com/watch?v=Zq4upTEaQyM', channel: 'Back To Back SWE', duration: '14 min', purpose: 'concept' },
    { title: 'Recursive Backtracking - DSA Course in Python Lecture 14', url: 'https://www.youtube.com/watch?v=L0NxT2i-LOY', channel: 'Greg Hogg', duration: '13 min', purpose: 'concept' },
  ],
  'dynamic-programming': [
    { title: '5 Simple Steps for Solving Dynamic Programming Problems', url: 'https://www.youtube.com/watch?v=aPQY__2H3tE', channel: 'Reducible', duration: '21 min', purpose: 'concept' },
    { title: 'Dynamic Programming - Top Down Memoization & Bottom Up Tabulation - DSA Course in Python Lecture 15', url: 'https://www.youtube.com/watch?v=piAlsJySUGE', channel: 'Greg Hogg', duration: '21 min', purpose: 'concept' },
  ],
  'matrix': [
    { title: '2D Lists & Nested Loops - Python - Tutorial 24', url: 'https://www.youtube.com/watch?v=B5GhlXhDfoE', channel: 'Giraffe Academy', duration: '6 min', purpose: 'concept' },
    { title: 'Python 2D collections are easy! ⬜', url: 'https://www.youtube.com/watch?v=Xy6qeQWQwFw', channel: 'Bro Code', duration: '9 min', purpose: 'concept' },
  ],
  'complexity': [
    { title: 'Big-O Notation - For Coding Interviews', url: 'https://www.youtube.com/watch?v=BgLTDT03QtU', channel: 'NeetCode', duration: '21 min', purpose: 'concept' },
    { title: 'Big O Notation', url: 'https://www.youtube.com/watch?v=v4cd1O4zkGw', channel: 'HackerRank', duration: '9 min', purpose: 'concept' },
  ],
}
