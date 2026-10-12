import type { LangLesson } from '@/lib/types'

/**
 * Go for coding rounds. The problems that turn up again and again in
 * campus hiring tests and online assessments, each solved the way a Go reviewer
 * would want to see it — and each with the Go-specific trap that costs marks.
 */

const FAST_IO = `package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strings"
)

// solve is the whole answer. It takes a reader and a writer instead of
// os.Stdin and os.Stdout, so you can feed it a string while you practise.
func solve(r io.Reader, w io.Writer) {
	in := bufio.NewReader(r)  // reads 4096 bytes at a time, not 1
	out := bufio.NewWriter(w) // collects output, writes it in big chunks
	defer out.Flush()         // forget this and nothing is printed

	var t int
	fmt.Fscan(in, &t) // first line: the number of test cases
	for ; t > 0; t-- {
		var n int
		fmt.Fscan(in, &n) // each case: n, then n numbers
		sum := 0
		for i := 0; i < n; i++ {
			var x int
			fmt.Fscan(in, &x) // Fscan skips spaces AND newlines
			sum += x
		}
		fmt.Fprintln(out, sum)
	}
}

func main() {
	// On the judge you would call solve(os.Stdin, os.Stdout).
	// Here a string stands in for the input the judge would send.
	input := "3\\n3\\n1 2 3\\n2\\n-5 5\\n4\\n10 20 30 40\\n"
	solve(strings.NewReader(input), os.Stdout)
	// 6
	// 0
	// 100
}
`

const FAST_IO_LINES = `package main

import (
	"bufio"
	"fmt"
	"strings"
)

func main() {
	input := "hello world from go\\nsecond line\\n"

	// Line by line. The default limit is 64 KB per line; a long line
	// (say 1,000,000 numbers on one line) silently stops the scan.
	// Buffer raises the limit, here to 1 MB.
	sc := bufio.NewScanner(strings.NewReader(input))
	sc.Buffer(make([]byte, 1024*1024), 1024*1024)
	for sc.Scan() {
		fmt.Printf("line: %q\\n", sc.Text())
	}

	// Word by word, ignoring line breaks: handy for "read n numbers".
	ws := bufio.NewScanner(strings.NewReader(input))
	ws.Split(bufio.ScanWords)
	count := 0
	for ws.Scan() {
		count++
	}
	fmt.Println("words:", count) // words: 6
}
`

const TWO_SUM = `package main

import "fmt"

// twoSum returns the indices of the two numbers that add up to target.
// One pass: for each number, ask the map "have I already seen its partner?"
func twoSum(nums []int, target int) (int, int, bool) {
	seen := make(map[int]int, len(nums)) // value -> index
	for i, n := range nums {
		if j, ok := seen[target-n]; ok { // comma-ok: 0 is a valid index
			return j, i, true
		}
		seen[n] = i
	}
	return 0, 0, false
}

func main() {
	fmt.Println(twoSum([]int{2, 7, 11, 15}, 9)) // 0 1 true
	fmt.Println(twoSum([]int{3, 3}, 6))         // 0 1 true
	fmt.Println(twoSum([]int{1, 2, 3}, 100))    // 0 0 false
}
`

const REVERSE_ROTATE = `package main

import (
	"fmt"
	"slices"
)

// reverse swaps from both ends towards the middle. In place, O(1) extra space.
func reverse(s []int) {
	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		s[i], s[j] = s[j], s[i]
	}
}

// rotateRight by k using three reversals: whole, first k, rest.
func rotateRight(s []int, k int) {
	if len(s) == 0 {
		return
	}
	k %= len(s) // k may be larger than len
	reverse(s)
	reverse(s[:k])
	reverse(s[k:])
}

func main() {
	a := []int{1, 2, 3, 4, 5}
	reverse(a)
	fmt.Println(a) // [5 4 3 2 1]

	b := []int{1, 2, 3, 4, 5, 6, 7}
	rotateRight(b, 3)
	fmt.Println(b) // [5 6 7 1 2 3 4]

	// The stdlib already has reverse. Use it unless they ask you to write it.
	c := []int{1, 2, 3}
	slices.Reverse(c)
	fmt.Println(c) // [3 2 1]

	// The aliasing trap: a sub-slice shares the array, so the caller sees this.
	d := []int{1, 2, 3, 4}
	reverse(d[:2])
	fmt.Println(d) // [2 1 3 4]

	// Reversing a string: convert to runes, not bytes, or UTF-8 breaks.
	r := []rune("héllo")
	slices.Reverse(r)
	fmt.Println(string(r)) // olléh
}
`

const TOP_K = `package main

import (
	"cmp"
	"fmt"
	"slices"
	"strings"
)

type wordCount struct {
	word  string
	count int
}

// topK: count with a map, move to a slice, sort. O(n + m log m) for m distinct words.
func topK(text string, k int) []wordCount {
	counts := map[string]int{}
	for _, w := range strings.Fields(strings.ToLower(text)) {
		counts[w]++
	}
	list := make([]wordCount, 0, len(counts))
	for w, c := range counts {
		list = append(list, wordCount{w, c})
	}
	// Count descending, then word ascending, so the output is the same every run.
	// Without the tie-break, map iteration order leaks into the answer.
	slices.SortFunc(list, func(a, b wordCount) int {
		if c := cmp.Compare(b.count, a.count); c != 0 {
			return c
		}
		return cmp.Compare(a.word, b.word)
	})
	return list[:min(k, len(list))]
}

func main() {
	fmt.Println(topK("the cat and the dog and the bird", 2)) // [{the 3} {and 2}]
	fmt.Println(topK("Go go GO rust", 5))                    // [{go 3} {rust 1}]
}
`

const TOP_K_HEAP = `package main

import (
	"container/heap"
	"fmt"
)

type wordCount struct {
	word  string
	count int
}

// minHeap keeps the k best seen so far; the root is the weakest of them.
type minHeap []wordCount

func (h minHeap) Len() int { return len(h) }
func (h minHeap) Less(i, j int) bool {
	if h[i].count != h[j].count {
		return h[i].count < h[j].count
	}
	return h[i].word > h[j].word
}
func (h minHeap) Swap(i, j int) { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)   { *h = append(*h, x.(wordCount)) } // x.(wordCount): "x holds a wordCount, give it to me"
func (h *minHeap) Pop() any {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

// topKHeap: O(n + m log k). Worth it only when k is much smaller than m.
func topKHeap(counts map[string]int, k int) []wordCount {
	h := &minHeap{}
	for w, c := range counts {
		heap.Push(h, wordCount{w, c})
		if h.Len() > k {
			heap.Pop(h) // drop the weakest
		}
	}
	out := make([]wordCount, h.Len())
	for i := len(out) - 1; i >= 0; i-- {
		out[i] = heap.Pop(h).(wordCount)
	}
	return out
}

func main() {
	counts := map[string]int{"go": 5, "rust": 2, "java": 4, "c": 1}
	fmt.Println(topKHeap(counts, 2)) // [{go 5} {java 4}]
}
`

const PARENS = `package main

import "fmt"

// valid reports whether every bracket is closed in the right order.
// A slice is the stack: append to push, re-slice to pop.
func valid(s string) bool {
	pairs := map[rune]rune{')': '(', ']': '[', '}': '{'}
	stack := []rune{}
	for _, r := range s { // range over a string yields runes, not bytes
		switch r {
		case '(', '[', '{':
			stack = append(stack, r)
		case ')', ']', '}':
			if len(stack) == 0 || stack[len(stack)-1] != pairs[r] {
				return false
			}
			stack = stack[:len(stack)-1]
		}
	}
	return len(stack) == 0 // leftovers mean something never closed
}

func main() {
	for _, s := range []string{"()[]{}", "([{}])", "(]", "((", "", "a(b)c"} {
		fmt.Printf("%-8q %v\\n", s, valid(s))
	}
}
`

const BSEARCH = `package main

import (
	"fmt"
	"slices"
	"sort"
)

// search returns the index of target in sorted s, or -1.
func search(s []int, target int) int {
	lo, hi := 0, len(s)-1
	for lo <= hi {
		mid := lo + (hi-lo)/2 // not (lo+hi)/2: that can overflow with 32-bit int
		switch {
		case s[mid] == target:
			return mid
		case s[mid] < target:
			lo = mid + 1
		default:
			hi = mid - 1
		}
	}
	return -1
}

func main() {
	s := []int{1, 3, 5, 7, 9, 11}
	fmt.Println(search(s, 7), search(s, 4)) // 3 -1

	// slices.BinarySearch: index where it is, or where it would go, plus found.
	i, found := slices.BinarySearch(s, 4)
	fmt.Println(i, found) // 2 false

	// sort.Search: the smallest i for which f(i) is true. The "lower bound"
	// tool, and the one to reach for in "first value >= x" problems.
	first := sort.Search(len(s), func(i int) bool { return s[i] >= 6 })
	fmt.Println(first, s[first]) // 3 7

	// Binary search on the answer: smallest k with k*k >= 50.
	k := sort.Search(100, func(k int) bool { return k*k >= 50 })
	fmt.Println(k) // 8
}
`

const LRU = `package main

import (
	"container/list"
	"fmt"
)

type entry struct {
	key, val int
}

// LRU: the map finds a node in O(1), the list keeps recency order in O(1).
// Front = most recently used, back = next to evict.
type LRU struct {
	cap   int
	ll    *list.List
	items map[int]*list.Element
}

func NewLRU(capacity int) *LRU {
	return &LRU{cap: capacity, ll: list.New(), items: map[int]*list.Element{}}
}

func (c *LRU) Get(key int) (int, bool) {
	el, ok := c.items[key]
	if !ok {
		return 0, false
	}
	c.ll.MoveToFront(el) // a read counts as a use
	return el.Value.(*entry).val, true
}

func (c *LRU) Put(key, val int) {
	if el, ok := c.items[key]; ok {
		el.Value.(*entry).val = val
		c.ll.MoveToFront(el)
		return
	}
	c.items[key] = c.ll.PushFront(&entry{key, val})
	if c.ll.Len() > c.cap {
		old := c.ll.Back()
		c.ll.Remove(old)
		delete(c.items, old.Value.(*entry).key) // why the entry stores its key
	}
}

func main() {
	c := NewLRU(2)
	c.Put(1, 1)
	c.Put(2, 2)
	fmt.Println(c.Get(1)) // 1 true   (1 is now most recent)
	c.Put(3, 3)           // evicts 2
	fmt.Println(c.Get(2)) // 0 false
	c.Put(4, 4)           // evicts 1
	fmt.Println(c.Get(1)) // 0 false
	fmt.Println(c.Get(3)) // 3 true
	fmt.Println(c.Get(4)) // 4 true
}
`

const LIST_REVERSE = `package main

import "fmt"

type Node struct {
	Val  int
	Next *Node
}

// reverse flips the links one node at a time and returns the new head.
func reverse(head *Node) *Node {
	var prev *Node
	for cur := head; cur != nil; {
		next := cur.Next // save it before we overwrite the link
		cur.Next = prev
		prev, cur = cur, next
	}
	return prev
}

func build(vals ...int) *Node {
	var head *Node
	for i := len(vals) - 1; i >= 0; i-- {
		head = &Node{Val: vals[i], Next: head}
	}
	return head
}

func show(n *Node) {
	for ; n != nil; n = n.Next {
		fmt.Print(n.Val, " ")
	}
	fmt.Println()
}

func main() {
	show(reverse(build(1, 2, 3, 4, 5))) // 5 4 3 2 1
	show(reverse(build(7)))             // 7
	show(reverse(nil))                  // (empty line)
}
`

const LIST_CYCLE = `package main

import "fmt"

type Node struct {
	Val  int
	Next *Node
}

// hasCycle is Floyd's tortoise and hare: slow moves one step, fast moves two.
// If there is a loop, fast laps slow and they meet. If not, fast hits nil.
func hasCycle(head *Node) bool {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
		if slow == fast { // pointer comparison: the same node, not the same value
			return true
		}
	}
	return false
}

func main() {
	a := &Node{Val: 1}
	b := &Node{Val: 2}
	c := &Node{Val: 3}
	a.Next, b.Next = b, c
	fmt.Println(hasCycle(a))   // false
	c.Next = b                 // 3 points back to 2
	fmt.Println(hasCycle(a))   // true
	fmt.Println(hasCycle(nil)) // false
}
`

const LIST_MERGE = `package main

import "fmt"

type Node struct {
	Val  int
	Next *Node
}

// merge joins two sorted lists into one sorted list, reusing their nodes.
// The dummy head means there is no special case for the first node.
func merge(a, b *Node) *Node {
	var dummy Node
	tail := &dummy
	for a != nil && b != nil {
		if a.Val <= b.Val { // <= keeps equal values in their original order
			tail.Next, a = a, a.Next
		} else {
			tail.Next, b = b, b.Next
		}
		tail = tail.Next
	}
	if a != nil {
		tail.Next = a // one list ran out: attach the rest of the other
	} else {
		tail.Next = b
	}
	return dummy.Next
}

func build(vals ...int) *Node {
	var head *Node
	for i := len(vals) - 1; i >= 0; i-- {
		head = &Node{Val: vals[i], Next: head}
	}
	return head
}

func show(n *Node) {
	for ; n != nil; n = n.Next {
		fmt.Print(n.Val, " ")
	}
	fmt.Println()
}

func main() {
	show(merge(build(1, 3, 5), build(2, 4, 6, 8))) // 1 2 3 4 5 6 8
	show(merge(nil, build(1, 2)))                  // 1 2
}
`

const TREE = `package main

import "fmt"

type Tree struct {
	Val         int
	Left, Right *Tree
}

// maxDepth is the classic recursion: a nil tree has depth 0.
func maxDepth(t *Tree) int {
	if t == nil {
		return 0
	}
	return 1 + max(maxDepth(t.Left), maxDepth(t.Right))
}

// levels is breadth-first search with a slice as the queue.
func levels(root *Tree) [][]int {
	var out [][]int
	if root == nil {
		return out
	}
	queue := []*Tree{root}
	for len(queue) > 0 {
		n := len(queue) // everything in the queue now is one level
		var level []int
		for _, t := range queue[:n] {
			level = append(level, t.Val)
			if t.Left != nil {
				queue = append(queue, t.Left)
			}
			if t.Right != nil {
				queue = append(queue, t.Right)
			}
		}
		queue = queue[n:] // drop the level we just finished
		out = append(out, level)
	}
	return out
}

func main() {
	//       3
	//      / \\
	//     9  20
	//        / \\
	//      15   7
	root := &Tree{3, &Tree{Val: 9}, &Tree{20, &Tree{Val: 15}, &Tree{Val: 7}}}
	fmt.Println(maxDepth(root))             // 3
	fmt.Println(levels(root))               // [[3] [9 20] [15 7]]
	fmt.Println(maxDepth(nil), levels(nil)) // 0 []
}
`

const BACKTRACK = `package main

import "fmt"

// subsets builds every subset by deciding, for each element, "take it or not".
func subsets(nums []int) [][]int {
	var out [][]int
	var cur []int
	var walk func(i int)
	walk = func(i int) {
		if i == len(nums) {
			out = append(out, append([]int(nil), cur...)) // COPY: cur keeps changing
			return
		}
		walk(i + 1) // without nums[i]
		cur = append(cur, nums[i])
		walk(i + 1)            // with nums[i]
		cur = cur[:len(cur)-1] // undo the choice: this is the "back" in backtracking
	}
	walk(0)
	return out
}

// permutations swaps each remaining element into position i, recurses, then swaps back.
func permutations(nums []int) [][]int {
	var out [][]int
	var walk func(i int)
	walk = func(i int) {
		if i == len(nums) {
			out = append(out, append([]int(nil), nums...))
			return
		}
		for j := i; j < len(nums); j++ {
			nums[i], nums[j] = nums[j], nums[i]
			walk(i + 1)
			nums[i], nums[j] = nums[j], nums[i]
		}
	}
	walk(0)
	return out
}

func main() {
	fmt.Println(subsets([]int{1, 2, 3}))
	// [[] [3] [2] [2 3] [1] [1 3] [1 2] [1 2 3]]
	fmt.Println(permutations([]int{1, 2, 3}))
	// [[1 2 3] [1 3 2] [2 1 3] [2 3 1] [3 2 1] [3 1 2]]
}
`

const DP_RECURSIVE = `package main

import "fmt"

var calls int

// The brute force: correct, but exponential. Each call makes two more.
func ways(n int) int {
	calls++
	if n <= 1 {
		return 1
	}
	return ways(n-1) + ways(n-2)
}

func main() {
	fmt.Println(ways(25), "calls:", calls) // 121393 calls: 242785
}
`

const DP_STAIRS = `package main

import "fmt"

// ways(n) = ways(n-1) + ways(n-2), ways(0) = ways(1) = 1.
// Only the last two answers are needed, so keep two variables.
func climbStairs(n int) int {
	a, b := 1, 1 // ways to reach step 0 and step 1
	for i := 2; i <= n; i++ {
		a, b = b, a+b
	}
	return b
}

func main() {
	fmt.Println(climbStairs(2), climbStairs(5), climbStairs(10)) // 2 8 89
}
`

const DP_COINS = `package main

import "fmt"

// best[x] = 1 + min(best[x-c]) over each coin c <= x, best[0] = 0.
func coinChange(coins []int, amount int) int {
	const inf = 1 << 30 // safe "infinity": inf + 1 cannot overflow
	best := make([]int, amount+1)
	for x := 1; x <= amount; x++ {
		best[x] = inf
		for _, c := range coins {
			if c <= x && best[x-c]+1 < best[x] {
				best[x] = best[x-c] + 1
			}
		}
	}
	if best[amount] >= inf {
		return -1
	}
	return best[amount]
}

func main() {
	fmt.Println(coinChange([]int{1, 2, 5}, 6))  // 2 (5+1)
	fmt.Println(coinChange([]int{1, 2, 5}, 11)) // 3 (5+5+1)
	fmt.Println(coinChange([]int{2}, 3))        // -1
}
`

const DP_LCS = `package main

import "fmt"

// dp[i][j] = LCS of the first i runes of a and the first j runes of b.
// Match: dp[i-1][j-1] + 1. No match: max(dp[i-1][j], dp[i][j-1]).
func lcs(a, b string) int {
	x, y := []rune(a), []rune(b)
	dp := make([][]int, len(x)+1)
	for i := range dp {
		dp[i] = make([]int, len(y)+1) // each row needs its own make
	}
	for i := 1; i <= len(x); i++ {
		for j := 1; j <= len(y); j++ {
			if x[i-1] == y[j-1] {
				dp[i][j] = dp[i-1][j-1] + 1
			} else {
				dp[i][j] = max(dp[i-1][j], dp[i][j-1])
			}
		}
	}
	return dp[len(x)][len(y)]
}

func main() {
	fmt.Println(lcs("abcde", "ace")) // 3
	fmt.Println(lcs("abc", "def"))   // 0
}
`

const ISLANDS = `package main

import "fmt"

// numIslands counts groups of '1' cells joined up, down, left or right.
// Each time we find unvisited land, we sink the whole island with DFS.
func numIslands(grid [][]byte) int {
	rows := len(grid)
	if rows == 0 {
		return 0
	}
	cols := len(grid[0])
	var sink func(r, c int)
	sink = func(r, c int) {
		if r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != '1' {
			return // bounds check first, or grid[r][c] panics
		}
		grid[r][c] = '0' // mark visited by changing the grid itself
		sink(r+1, c)
		sink(r-1, c)
		sink(r, c+1)
		sink(r, c-1)
	}
	count := 0
	for r := range grid {
		for c := range grid[r] {
			if grid[r][c] == '1' {
				count++
				sink(r, c)
			}
		}
	}
	return count
}

func parse(lines ...string) [][]byte {
	g := make([][]byte, len(lines))
	for i, l := range lines {
		g[i] = []byte(l)
	}
	return g
}

func main() {
	fmt.Println(numIslands(parse(
		"11000",
		"11000",
		"00100",
		"00011",
	))) // 3
	fmt.Println(numIslands(parse("111", "010", "111"))) // 1
}
`

const INTERVALS = `package main

import (
	"fmt"
	"sort"
)

// merge combines overlapping [start, end] intervals.
// Sort by start, then each interval either extends the last one or starts a new one.
func merge(in [][2]int) [][2]int {
	if len(in) == 0 {
		return nil
	}
	s := append([][2]int(nil), in...) // copy: do not reorder the caller's slice
	sort.Slice(s, func(i, j int) bool { return s[i][0] < s[j][0] })

	out := [][2]int{s[0]}
	for _, cur := range s[1:] {
		last := &out[len(out)-1] // pointer, so we can grow it in place
		if cur[0] <= last[1] {
			last[1] = max(last[1], cur[1])
		} else {
			out = append(out, cur)
		}
	}
	return out
}

func main() {
	fmt.Println(merge([][2]int{{8, 10}, {1, 3}, {2, 6}, {15, 18}})) // [[1 6] [8 10] [15 18]]
	fmt.Println(merge([][2]int{{1, 4}, {4, 5}}))                    // [[1 5]]
	fmt.Println(merge([][2]int{{1, 10}, {2, 3}}))                   // [[1 10]]
}
`

const WINDOW = `package main

import "fmt"

// longestUnique returns the length, in characters, of the longest substring
// with no repeated character. It works on runes, so "héllo" counts é once.
func longestUnique(s string) int {
	last := make(map[rune]int) // rune -> index of its most recent position
	best, start := 0, 0
	for i, r := range []rune(s) {
		if j, ok := last[r]; ok && j >= start {
			start = j + 1 // jump the left edge past the earlier copy
		}
		last[r] = i
		best = max(best, i-start+1)
	}
	return best
}

func main() {
	fmt.Println(longestUnique("abcabcbb")) // 3 (abc)
	fmt.Println(longestUnique("bbbbb"))    // 1
	fmt.Println(longestUnique("pwwkew"))   // 3 (wke)
	fmt.Println(longestUnique("héllo"))    // 3 (hél)
	fmt.Println(longestUnique(""))         // 0
}
`

export const DSA: LangLesson[] = [
  {
    slug: 'dsa-fast-io',
    title: 'Fast input and output for online judges',
    navTitle: 'Fast input/output',
    oneLine: 'How to read the input HackerRank, CodeChef and company OAs send on stdin, and print the answer fast enough to pass the time limit.',
    objectives: [
      'Read T test cases of "n, then n numbers" with `bufio.NewReader` and `fmt.Fscan`.',
      'Print answers through `bufio.NewWriter` and explain why `defer Flush()` is needed.',
      'Read very long lines with `bufio.Scanner` and `Buffer`, and words with `ScanWords`.',
    ],
    blocks: [
      {
        heading: 'Why this comes first',
        body: [
          'On LeetCode you write a function and the site calls it. On HackerRank, CodeChef, Codeforces and most company online assessments (OAs), you write a whole program. The judge sends the input on **standard input** (stdin) and reads your answer from **standard output** (stdout).',
          'A correct solution can still fail with "Time Limit Exceeded" only because it reads and prints slowly. In Go the fix is two lines, and it is the same every time.',
        ],
      },
      {
        heading: 'Why plain fmt.Scan is slow',
        bullets: [
          '`fmt.Scan(&x)` reads straight from `os.Stdin`, which is not buffered. To find where one number ends it asks the operating system for **one byte at a time**. Each ask is a system call, and 1,000,000 numbers means millions of them.',
          '`fmt.Println` has the same problem in reverse: every call is a separate write to the terminal or pipe.',
          '`bufio.NewReader(os.Stdin)` asks for 4096 bytes at once and hands them out from memory. `bufio.NewWriter(os.Stdout)` collects your output and writes it in big chunks. Same `fmt` functions, just with an `F` in front: `fmt.Fscan(in, &x)`, `fmt.Fprintln(out, x)`.',
        ],
      },
      {
        heading: 'The template: T cases, each "n then n numbers"',
        body: [
          'This is the most common input shape. The first number is `T`, the number of test cases. Each case starts with `n`, followed by `n` numbers. `fmt.Fscan` skips spaces and newlines alike, so it does not matter how the numbers are split across lines.',
          'Writing the logic as `solve(r io.Reader, w io.Writer)` lets you test it with `strings.NewReader` (a string that behaves like stdin) instead of typing input by hand. On the judge, `main` just calls `solve(os.Stdin, os.Stdout)`.',
        ],
        code: { label: 'fast_io.go', src: FAST_IO, run: FAST_IO },
      },
      {
        callout: {
          tone: 'warn',
          text: '**Forgetting `Flush` prints nothing.** A `bufio.Writer` keeps up to 4096 bytes in memory. If the program ends before you flush, that output is lost and the judge sees an empty answer: "Wrong Answer" on a correct solution. Put `defer out.Flush()` on the line right after you create it.',
        },
      },
      {
        heading: 'Whole lines and very long lines: bufio.Scanner',
        body: [
          'When the input is text lines (names, sentences, a grid of characters), `bufio.Scanner` reads one line per `Scan()`. Two things to know: its default line limit is **64 KB**, and when a line is longer it just stops, with the error only in `sc.Err()`. `sc.Buffer(buf, max)` raises the limit. `sc.Split(bufio.ScanWords)` makes it return one word at a time instead of one line.',
        ],
        code: { label: 'scanner.go', src: FAST_IO_LINES, run: FAST_IO_LINES },
      },
      {
        heading: 'Which one to use',
        table: {
          headers: ['input looks like', 'use'],
          rows: [
            ['numbers separated by spaces or newlines', '`bufio.NewReader` + `fmt.Fscan`'],
            ['whole lines of text', '`bufio.Scanner` (+ `Buffer` if a line can pass 64 KB)'],
            ['millions of numbers, tight time limit', '`bufio.Scanner` with `ScanWords` + `strconv.Atoi`, the fastest of the three'],
            ['any output', '`bufio.NewWriter` + `defer Flush()`'],
          ],
        },
      },
    ],
    keyPoints: [
      'Online judges send input on stdin and read your answer from stdout.',
      '`fmt.Scan` on bare stdin reads one byte per system call. Wrap stdin in `bufio.NewReader` and use `fmt.Fscan`.',
      'Wrap stdout in `bufio.NewWriter` and `defer out.Flush()`, or the output is lost.',
      '`bufio.Scanner` stops silently on a line over 64 KB unless you call `Buffer`.',
      'Put the logic in `solve(r io.Reader, w io.Writer)` so you can test it with `strings.NewReader`.',
    ],
    remember: 'Buffered in, buffered out, and Flush before you leave.',
    task: 'Write a program for this input: `T`, then for each case a line with `n`, then `n` numbers. Print the largest number of each case. Test it with `strings.NewReader` first, then with real stdin: `go run . < input.txt`.',
    exercises: [
      { task: 'Delete the `defer out.Flush()` line from the example and run it. What is printed?', answer: 'Nothing. The answers sit in the writer\'s memory buffer and are thrown away when the program ends.' },
      { task: 'The input is one line with `n` and then `n` names on the next line. Which reader do you pick, and why?', answer: '`bufio.NewReader` + `fmt.Fscan` works: `Fscan` into a `string` reads one word. A `bufio.Scanner` with `ScanWords` works too.' },
      { task: 'A problem gives 1,000,000 numbers on a single line and your `bufio.Scanner` loop reads none of them. What went wrong and what is the fix?', answer: 'The line is longer than the 64 KB default, so `Scan()` returned false at once. Call `sc.Buffer(make([]byte, 1<<20), 1<<24)` before scanning, or use `ScanWords`.' },
      { task: 'Why does the example take `io.Reader` and `io.Writer` instead of using `os.Stdin` and `os.Stdout` directly?', answer: 'So the same function can read from a `strings.Reader` in a test and from stdin on the judge, and write to a `bytes.Buffer` or to stdout.' },
    ],
    challenge: {"prompt":"Write `Solve(r io.Reader, w io.Writer)`. The input is `T`, then `T` test cases; each case is `n` followed by `n` integers (spaces and newlines may be mixed freely). Print the sum of each case on its own line. Read through `bufio.NewReader` and write through `bufio.NewWriter` with `defer Flush()`: the hidden tests count your Read and Write calls on a big input. Example: `\"2\\n3\\n1 2 3\\n2\\n-5 5\\n\"` → `\"6\\n0\\n\"`.","starter":"package main\n\nimport (\n\t\"fmt\"\n\t\"io\"\n)\n\n// Solve reads T cases of \"n, then n ints\" from r and prints each sum to w.\nfunc Solve(r io.Reader, w io.Writer) {\n\tvar t int\n\tfmt.Fscan(r, &t)\n\tfmt.Fprintln(w, t) // your code here\n}\n","test":"package main\n\nimport (\n\t\"bytes\"\n\t\"fmt\"\n\t\"io\"\n\t\"strings\"\n\t\"testing\"\n)\n\n// slowReader hides the fast paths of strings.Reader and counts Read calls.\ntype slowReader struct {\n\tsrc   io.Reader\n\treads int\n}\n\nfunc (s *slowReader) Read(p []byte) (int, error) { s.reads++; return s.src.Read(p) }\n\ntype countWriter struct {\n\tbuf    bytes.Buffer\n\twrites int\n}\n\nfunc (c *countWriter) Write(p []byte) (int, error) { c.writes++; return c.buf.Write(p) }\n\nfunc TestSolve(t *testing.T) {\n\ttests := []struct{ in, want string }{\n\t\t{\"1\\n3\\n1 2 3\\n\", \"6\\n\"},\n\t\t{\"3\\n2\\n-5 5\\n0\\n1\\n1000000000000\\n\", \"0\\n0\\n1000000000000\\n\"},\n\t\t{\"2\\n4\\n7 7 7 7\\n3\\n-1 -2 -3\\n\", \"28\\n-6\\n\"},\n\t\t{\"2 3 1 2 3 2 10 20\", \"6\\n30\\n\"},\n\t\t{\"0\\n\", \"\"},\n\t}\n\tfor _, tc := range tests {\n\t\tvar out bytes.Buffer\n\t\tSolve(strings.NewReader(tc.in), &out)\n\t\tif got := out.String(); got != tc.want {\n\t\t\tt.Errorf(\"Solve(%q) = %q, want %q\", tc.in, got, tc.want)\n\t\t}\n\t}\n}\n\nfunc TestSolveBuffered(t *testing.T) {\n\tvar in, want strings.Builder\n\tconst cases = 2000\n\tfmt.Fprintln(&in, cases)\n\tfor i := 0; i < cases; i++ {\n\t\tfmt.Fprintln(&in, 5)\n\t\tfmt.Fprintln(&in, i, i, i, i, -i)\n\t\tfmt.Fprintln(&want, 3*i)\n\t}\n\tr := &slowReader{src: strings.NewReader(in.String())}\n\tw := &countWriter{}\n\tSolve(r, w)\n\tif got := w.buf.String(); got != want.String() {\n\t\tt.Errorf(\"Solve(%v cases) printed %v bytes, want %v\", cases, len(got), want.Len())\n\t}\n\tif r.reads > 100 {\n\t\tt.Errorf(\"Solve(%v cases) made %v Read calls, want at most %v (wrap r in bufio.NewReader)\", cases, r.reads, 100)\n\t}\n\tif w.writes > 20 {\n\t\tt.Errorf(\"Solve(%v cases) made %v Write calls, want at most %v (wrap w in bufio.NewWriter and Flush)\", cases, w.writes, 20)\n\t}\n}\n","solution":"package main\n\nimport (\n\t\"bufio\"\n\t\"fmt\"\n\t\"io\"\n)\n\nfunc Solve(r io.Reader, w io.Writer) {\n\tin := bufio.NewReader(r)\n\tout := bufio.NewWriter(w)\n\tdefer out.Flush()\n\n\tvar t int\n\tfmt.Fscan(in, &t)\n\tfor ; t > 0; t-- {\n\t\tvar n int\n\t\tfmt.Fscan(in, &n)\n\t\tsum := 0\n\t\tfor i := 0; i < n; i++ {\n\t\t\tvar x int\n\t\t\tfmt.Fscan(in, &x)\n\t\t\tsum += x\n\t\t}\n\t\tfmt.Fprintln(out, sum)\n\t}\n}\n"},
    refs: [
      { label: 'bufio package', href: 'https://pkg.go.dev/bufio' },
      { label: 'fmt.Fscan', href: 'https://pkg.go.dev/fmt#Fscan' },
    ],
  },
  {
    slug: 'dsa-two-sum',
    title: 'Two sum with a map',
    navTitle: 'Two sum',
    oneLine: 'The most-asked warm-up in any coding round, and the cleanest demonstration of why a map beats a nested loop.',
    objectives: ["Write a one-pass two sum with a map and state its O(n) time and space.", "Explain why comma-ok is needed when 0 is a valid index.", "Predict what goes wrong if you insert before you look up."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Given a slice of integers and a target, return the indices of the two numbers that add up to the target. Assume at most one answer, and you may not use the same element twice.',
        ],
      },
      {"heading": "Tools you'll use here", "bullets": ["`slices.Sort(s)` sorts a slice of numbers or strings in place, smallest first.", "`slices.SortFunc(s, func(a, b T) int { return cmp.Compare(a.x, b.x) })` sorts by your own rule; `cmp.Compare` returns -1, 0 or 1 for you.", "Why `slices.Sort` works on any number or string type (generics, `cmp.Ordered`) is explained later in **Generics**, and `container/heap` in **The standard library**. Where a lesson uses a heap, it is an optional extra."]},
      {"heading": "Brute force first", "body": ["Check every pair with two nested loops: for each `i`, try every `j > i` and see if `nums[i] + nums[j] == target`.", "**O(n²) time, O(1) space.** Fine for 100 numbers, far too slow for 1 million."]},
      {
        heading: 'The approach',
        body: [
          'The brute force checks every pair: O(n²). Say it first, so they know you know it, then improve it.',
          'For each number `n`, the partner you need is `target - n`. Keep a map from value to index of everything you have already walked past. If the partner is in the map, you are done. One pass, **O(n) time and O(n) space**.',
        ],
      },
      { code: { label: 'two_sum.go', src: TWO_SUM, run: TWO_SUM } },
      {"heading": "Dry run", "body": ["`nums = [2 7 11 15]`, `target = 9`, using the map solution:"], "table": {"headers": ["i", "n", "need (target - n)", "seen before this step", "action"], "rows": [["0", "2", "7", "{}", "7 not seen, store 2→0"], ["1", "7", "2", "{2:0}", "2 found at index 0, return (0, 1)"]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**Use comma-ok.** `seen[x]` returns `0` when `x` is missing, and `0` is also a valid index. `if j, ok := seen[x]; ok` is the only correct test.',
          '**Check before you insert.** Inserting first means `[3]` with target `6` would pair the element with itself.',
          '**Pre-size the map** with `make(map[int]int, len(nums))`. It saves rehashing while it grows, and a reviewer notices.',
          '**Returning multiple values** is more idiomatic than returning a `[]int{i, j}` or `-1, -1`. The `bool` says "not found" without a magic number.',
        ],
      },
    ],
    keyPoints: [
      'Say the O(n²) brute force, then trade space for time with a map: O(n).',
      'Comma-ok, always, when zero is a meaningful value.',
      'Look up the partner before inserting the current element.',
    ],
    remember: 'When the question is "have I seen X before?", the answer is a map.',
    task: 'Count the pairs in a slice that sum to `k` (each pair once, duplicates allowed in the input) with one map and one pass. State the complexity before you run it.',
    challenge: {"prompt": "Write `twoSum(nums []int, target int) (int, int, bool)` that returns the indices `i < j` of the two numbers adding up to `target`, and `true`. If no pair exists, return `0, 0, false`. Example: `[2 7 11 15]`, target 9 → `0, 1, true`.", "starter": "package main\n\nfunc twoSum(nums []int, target int) (int, int, bool) {\n\t// your code here\n\treturn 0, 0, false\n}\n", "test": "package main\n\nimport \"testing\"\n\nfunc TestTwoSum(t *testing.T) {\n\ttests := []struct {\n\t\tnums   []int\n\t\ttarget int\n\t\ti, j   int\n\t\tok     bool\n\t}{\n\t\t{[]int{2, 7, 11, 15}, 9, 0, 1, true},\n\t\t{[]int{3, 2, 4}, 6, 1, 2, true},\n\t\t{[]int{3, 3}, 6, 0, 1, true},\n\t\t{[]int{1, 2}, 7, 0, 0, false},\n\t\t{nil, 0, 0, 0, false},\n\t}\n\tfor _, tc := range tests {\n\t\ti, j, ok := twoSum(tc.nums, tc.target)\n\t\tif i != tc.i || j != tc.j || ok != tc.ok {\n\t\t\tt.Errorf(\"twoSum(%v, %v) = %v, %v, %v, want %v, %v, %v\", tc.nums, tc.target, i, j, ok, tc.i, tc.j, tc.ok)\n\t\t}\n\t}\n}\n", "solution": "package main\n\nfunc twoSum(nums []int, target int) (int, int, bool) {\n\tseen := make(map[int]int, len(nums))\n\tfor j, n := range nums {\n\t\tif i, ok := seen[target-n]; ok {\n\t\t\treturn i, j, true\n\t\t}\n\t\tseen[n] = j\n\t}\n\treturn 0, 0, false\n}\n"},
    refs: [{ label: 'Go spec: index expressions (comma-ok)', href: 'https://go.dev/ref/spec#Index_expressions' }],
  },
  {
    slug: 'dsa-reverse-rotate',
    title: 'Reverse and rotate a slice in place',
    navTitle: 'Reverse and rotate',
    oneLine: 'Two pointers, the three-reversal trick, and the slice aliasing that makes "in place" mean what it says.',
    objectives: ["Write in-place reverse and rotate with two pointers and three reversals.", "Predict how reversing a sub-slice changes the original slice.", "Fix the divide-by-zero panic on an empty slice."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Reverse a slice in place. Then rotate it right by `k` positions — `[1 2 3 4 5 6 7]` rotated by 3 is `[5 6 7 1 2 3 4]` — using O(1) extra space.',
        ],
      },
      {"heading": "Brute force first", "body": ["Rotate right by 1, `k` times: save the last element, shift everything one place right, put the saved one at the front. Or copy into a new slice at `(i+k) % n`.", "Shifting is **O(n·k) time, O(1) space**. The copy is **O(n) time but O(n) extra space**, which breaks the \"in place\" rule."]},
      {
        heading: 'The approach',
        body: [
          'Reverse: two indices, one from each end, swap and move inwards. Go’s tuple assignment `s[i], s[j] = s[j], s[i]` needs no temporary.',
          'Rotate: reverse the whole slice, then reverse the first `k`, then the rest. Each element moves a constant number of times: **O(n) time, O(1) space**. Taking `k %= len(s)` first handles `k` bigger than the length.',
        ],
      },
      { code: { label: 'rotate.go', src: REVERSE_ROTATE, run: REVERSE_ROTATE } },
      {"heading": "Dry run", "body": ["Rotate `[1 2 3 4 5 6 7]` right by `k = 3` with three reversals:"], "table": {"headers": ["step", "what you reverse", "slice after"], "rows": [["0", "(start)", "[1 2 3 4 5 6 7]"], ["1", "whole slice", "[7 6 5 4 3 2 1]"], ["2", "first k = 3", "[5 6 7 4 3 2 1]"], ["3", "the rest (index 3 onwards)", "[5 6 7 1 2 3 4]"]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**A slice is a view, not a copy.** `reverse(s[:k])` changes the caller’s array, which is exactly why the three-reversal trick works without returning anything. It is also why passing a sub-slice to a function you did not write can surprise you.',
          '**Need a copy?** `slices.Clone(s)`. Assigning `t := s` copies only the header.',
          '**Strings are immutable.** To reverse one, convert to `[]rune`, not `[]byte`. Reversing bytes splits multi-byte UTF-8 characters and prints garbage.',
          '**Guard the empty slice** before `k %= len(s)`, or you divide by zero and panic.',
        ],
      },
    ],
    keyPoints: [
      'Two pointers from the ends for reverse; three reversals for rotate.',
      'Sub-slices share the backing array, so in-place really is in place.',
      '`slices.Reverse` exists — use it unless they ask you to write it.',
    ],
    remember: 'A slice header is three words. Copying it never copies the elements.',
    task: 'Rotate left by `k` with the same trick, and write a table test with k = 0, k = len, and k > len.',
    challenge: {"prompt":"Write `rotateRight(s []int, k int)` that rotates `s` right by `k` positions **in place**, with no extra slice (the hidden tests check that it allocates nothing). `k` may be 0 or bigger than `len(s)`, and `s` may be empty. Example: `[1 2 3 4 5 6 7]`, k = 3 → `[5 6 7 1 2 3 4]`.","starter":"package main\n\n// rotateRight rotates s right by k positions, in place.\nfunc rotateRight(s []int, k int) {\n\t// your code here\n}\n","test":"package main\n\nimport (\n\t\"slices\"\n\t\"testing\"\n)\n\nfunc TestRotateRight(t *testing.T) {\n\ttests := []struct {\n\t\tin   []int\n\t\tk    int\n\t\twant []int\n\t}{\n\t\t{[]int{1, 2, 3, 4, 5, 6, 7}, 3, []int{5, 6, 7, 1, 2, 3, 4}},\n\t\t{[]int{1, 2, 3}, 0, []int{1, 2, 3}},\n\t\t{[]int{1, 2, 3}, 3, []int{1, 2, 3}},\n\t\t{[]int{1, 2, 3}, 4, []int{3, 1, 2}},\n\t\t{[]int{-1, -100, 3, 99}, 2, []int{3, 99, -1, -100}},\n\t\t{[]int{7, 7, 8}, 1, []int{8, 7, 7}},\n\t\t{[]int{1, 2}, 1000000001, []int{2, 1}},\n\t\t{[]int{}, 5, []int{}},\n\t\t{nil, 2, nil},\n\t}\n\tfor _, tc := range tests {\n\t\tgot := slices.Clone(tc.in)\n\t\trotateRight(got, tc.k)\n\t\tif !slices.Equal(got, tc.want) {\n\t\t\tt.Errorf(\"rotateRight(%v, %v) = %v, want %v\", tc.in, tc.k, got, tc.want)\n\t\t}\n\t}\n}\n\nfunc TestRotateRightNoAlloc(t *testing.T) {\n\tbig := make([]int, 1000)\n\tfor i := range big {\n\t\tbig[i] = i\n\t}\n\tif n := testing.AllocsPerRun(10, func() { rotateRight(big, 123) }); n != 0 {\n\t\tt.Errorf(\"rotateRight(1000 ints, 123) allocations = %v, want %v (use three reversals, not a copy)\", n, 0)\n\t}\n}\n","solution":"package main\n\nfunc rev(s []int) {\n\tfor i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {\n\t\ts[i], s[j] = s[j], s[i]\n\t}\n}\n\nfunc rotateRight(s []int, k int) {\n\tif len(s) == 0 {\n\t\treturn\n\t}\n\tk %= len(s)\n\trev(s)\n\trev(s[:k])\n\trev(s[k:])\n}\n"},
    refs: [{ label: 'Go blog: slices intro', href: 'https://go.dev/blog/slices-intro' }],
  },
  {
    slug: 'dsa-frequency-top-k',
    title: 'Frequency count and top K',
    navTitle: 'Top K frequent',
    oneLine: 'Count with a map, rank with a sort or a heap, and never let map order leak into your answer.',
    objectives: ["Write a top-k word counter with a map and slices.SortFunc.", "Explain why a tie-break is needed for deterministic output.", "Predict the output order when two words tie on count."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Given some text, return the `k` most frequent words with their counts. Ties are broken alphabetically.',
        ],
      },
      {"heading": "Brute force first", "body": ["For each word, count it by scanning the whole text again. Then repeat `k` times: pick the word with the highest count, print it, remove it.", "Counting that way is **O(n²)**, and picking is O(k·m). The map does the counting in one pass."]},
      {
        heading: 'The approach',
        body: [
          'Count with a `map[string]int`. Maps have no order, so move the pairs into a slice and sort by count descending, then word ascending: **O(n + m log m)** for `m` distinct words.',
          'This is the answer to give first. Most interviewers are happy with it; a faster heap version is at the end of the lesson, as an optional extra.',
        ],
      },
      { code: { label: 'top_k.go', src: TOP_K, run: TOP_K } },
      {"heading": "Dry run", "body": ["`\"the cat and the dog and the bird\"`, `k = 2`:", "1. Count: `the 3, and 2, cat 1, dog 1, bird 1` (in random map order).", "2. Sort by count desc, then word asc: `the 3, and 2, bird 1, cat 1, dog 1`.", "3. Take `list[:min(2, 5)]`: `[{the 3} {and 2}]`."]},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**Map iteration order is randomised on purpose.** Without a tie-break in the comparator, two runs can print different answers and the judge marks you wrong.',
          '**`slices.SortFunc` wants an `int` comparator** (negative, zero, positive). `cmp.Compare` writes it for you. The older `sort.Slice` takes a `less` bool and still works.',
          '**`min` and `max` are built-ins** since Go 1.21. `list[:min(k, len(list))]` stops a panic when `k` is bigger than the list.',
        ],
      },
      {"heading": "Faster for big n (optional)", "body": ["Skip this on a first read. If `k` is small (say 10) and there are hundreds of thousands of distinct words, sorting all of them is wasted work. Keep only the best `k` in a min-heap from `container/heap`: push each word, and pop the weakest when the heap grows past `k`. That is **O(n + m log k)**.", "**`any`** is just another name for `interface{}`: a box that can hold a value of any type. `container/heap` was written before generics, so `Push` and `Pop` use it.", "**`x.(T)`** is a type assertion: \"I know the box `x` holds a `T`, give me the `T`\". If it holds something else, the program panics.", "`container/heap` needs you to write `Len`, `Less`, `Swap`, `Push` and `Pop`, then call `heap.Push(h, x)`, never `h.Push(x)` directly, or the heap order is not restored."]},
      { code: { label: "top_k_heap.go", src: TOP_K_HEAP, run: TOP_K_HEAP } },
    ],
    keyPoints: [
      'Map to count, slice to order. Maps never give you order.',
      'Always tie-break, so the output is deterministic.',
      'Heap of size k when k is much smaller than the number of distinct items.',
    ],
    remember: 'If the output depends on map order, it is a bug that only fails sometimes.',
    task: 'Return the top K most frequent **characters** in a string. Decide whether you count bytes or runes, and say why.',
    challenge: {"prompt":"Write `topK(words []string, k int) []string` that returns the `k` most frequent words, most frequent first. Break ties by putting the word that sorts first (alphabetically) first, so the answer never depends on map order. If there are fewer than `k` distinct words, return them all. Example: `[go is fun go is go]`, k = 2 → `[go is]`.","starter":"package main\n\nfunc topK(words []string, k int) []string {\n\t// your code here\n\treturn words\n}\n","test":"package main\n\nimport (\n\t\"slices\"\n\t\"strings\"\n\t\"testing\"\n)\n\nfunc TestTopK(t *testing.T) {\n\ttests := []struct {\n\t\twords []string\n\t\tk     int\n\t\twant  []string\n\t}{\n\t\t{strings.Fields(\"go is fun go is go\"), 2, []string{\"go\", \"is\"}},\n\t\t{strings.Fields(\"b a c b a c\"), 2, []string{\"a\", \"b\"}},\n\t\t{strings.Fields(\"z y x w v u t s r q p o n m l k j i h g f e d c b a\"), 3, []string{\"a\", \"b\", \"c\"}},\n\t\t{strings.Fields(\"x x x\"), 5, []string{\"x\"}},\n\t\t{strings.Fields(\"a b\"), 0, []string{}},\n\t\t{nil, 3, []string{}},\n\t\t{strings.Fields(\"Go go GO go\"), 2, []string{\"go\", \"GO\"}},\n\t}\n\tfor _, tc := range tests {\n\t\tif got := topK(slices.Clone(tc.words), tc.k); !slices.Equal(got, tc.want) {\n\t\t\tt.Errorf(\"topK(%v, %v) = %v, want %v\", tc.words, tc.k, got, tc.want)\n\t\t}\n\t}\n}\n","solution":"package main\n\nimport (\n\t\"cmp\"\n\t\"slices\"\n)\n\nfunc topK(words []string, k int) []string {\n\tcounts := map[string]int{}\n\tfor _, w := range words {\n\t\tcounts[w]++\n\t}\n\tkeys := make([]string, 0, len(counts))\n\tfor w := range counts {\n\t\tkeys = append(keys, w)\n\t}\n\tslices.SortFunc(keys, func(a, b string) int {\n\t\tif c := cmp.Compare(counts[b], counts[a]); c != 0 {\n\t\t\treturn c\n\t\t}\n\t\treturn cmp.Compare(a, b)\n\t})\n\treturn keys[:min(k, len(keys))]\n}\n"},
    refs: [
      { label: 'slices.SortFunc', href: 'https://pkg.go.dev/slices#SortFunc' },
      { label: 'container/heap', href: 'https://pkg.go.dev/container/heap' },
    ],
  },
  {
    slug: 'dsa-valid-parentheses',
    title: 'Valid parentheses with a slice as a stack',
    navTitle: 'Valid parentheses',
    oneLine: 'Go has no stack type, because a slice already is one. Push with append, pop by re-slicing.',
    objectives: ["Write a bracket checker that uses a slice as a stack.", "Fix the out-of-range panic when a closer arrives on an empty stack.", "Explain why counting brackets alone is not enough."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Given a string of brackets `()[]{}`, decide whether every opener is closed by the right closer, in the right order. Other characters are ignored.',
        ],
      },
      {"heading": "Brute force first", "body": ["Keep deleting `\"()\"`, `\"[]\"` and `\"{}\"` from the string with `strings.ReplaceAll` until nothing changes. If the string ends up empty, it was valid.", "Each pass is O(n) and you may need n/2 passes: **O(n²) time, O(n) space** for the new strings."]},
      {
        heading: 'The approach',
        body: [
          'Push each opener. On a closer, the top of the stack must be its matching opener; pop it. At the end the stack must be empty. **O(n) time, O(n) space.**',
        ],
      },
      { code: { label: 'parens.go', src: PARENS, run: PARENS } },
      {"heading": "Dry run", "body": ["`s = \"{[]()}\"` with the stack solution:"], "table": {"headers": ["char", "action", "stack after"], "rows": [["{", "opener, push", "{"], ["[", "opener, push", "{["], ["]", "top is [, matches, pop", "{"], ["(", "opener, push", "{("], [")", "top is (, matches, pop", "{"], ["}", "top is {, matches, pop", "(empty)"], ["end", "stack empty", "valid: true"]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**Check `len(stack) == 0` before peeking.** `stack[len(stack)-1]` on an empty slice is an index-out-of-range panic, and a closer with nothing open is the classic edge case.',
          '**`range` over a string yields runes** at byte offsets. Indexing `s[i]` gives a `byte`. Mixing the two is the commonest type error in string problems.',
          '**Popping does not free memory.** `stack[:len(stack)-1]` keeps the backing array. Fine here; for a stack of pointers that lives a long time, set the popped slot to `nil` first so the GC can collect it.',
          '**A `switch` with several values per `case`** reads better than a chain of `if r == ... || r == ...`.',
        ],
      },
    ],
    keyPoints: [
      'Slice as stack: `append` to push, `s[:len(s)-1]` to pop, `s[len(s)-1]` to peek.',
      'Guard the empty stack before every peek.',
      'Leftover openers at the end mean invalid.',
    ],
    remember: 'Any "matching pairs, most recent first" problem is a stack.',
    task: 'Solve "evaluate reverse Polish notation" (`["2","1","+","3","*"]` → 9) with a `[]int` stack and `strconv.Atoi`.',
    challenge: {"prompt": "Write `valid(s string) bool` that reports whether every `(`, `[` and `{` is closed by the right bracket in the right order. Ignore other characters. Example: `\"{[]()}\"` → true, `\"([)]\"` → false.", "starter": "package main\n\nfunc valid(s string) bool {\n\t// your code here\n\treturn false\n}\n", "test": "package main\n\nimport \"testing\"\n\nfunc TestValid(t *testing.T) {\n\ttests := []struct {\n\t\tin   string\n\t\twant bool\n\t}{\n\t\t{\"\", true},\n\t\t{\"()[]{}\", true},\n\t\t{\"{[]()}\", true},\n\t\t{\"a(b)c\", true},\n\t\t{\"([)]\", false},\n\t\t{\")\", false},\n\t\t{\"((\", false},\n\t}\n\tfor _, tc := range tests {\n\t\tif got := valid(tc.in); got != tc.want {\n\t\t\tt.Errorf(\"valid(%q) = %v, want %v\", tc.in, got, tc.want)\n\t\t}\n\t}\n}\n", "solution": "package main\n\nfunc valid(s string) bool {\n\tpair := map[rune]rune{')': '(', ']': '[', '}': '{'}\n\tvar stack []rune\n\tfor _, r := range s {\n\t\tswitch r {\n\t\tcase '(', '[', '{':\n\t\t\tstack = append(stack, r)\n\t\tcase ')', ']', '}':\n\t\t\tif len(stack) == 0 || stack[len(stack)-1] != pair[r] {\n\t\t\t\treturn false\n\t\t\t}\n\t\t\tstack = stack[:len(stack)-1]\n\t\t}\n\t}\n\treturn len(stack) == 0\n}\n"},
    refs: [{ label: 'Go wiki: SliceTricks', href: 'https://go.dev/wiki/SliceTricks' }],
  },
  {
    slug: 'dsa-binary-search',
    title: 'Binary search, by hand and from the stdlib',
    navTitle: 'Binary search',
    oneLine: 'Write it once without an off-by-one, then know when `slices.BinarySearch` and `sort.Search` do it for you.',
    objectives: ["Write an off-by-one-free binary search over an inclusive range.", "Predict the lo, hi and mid values at each step for a small input.", "Explain when sort.Search returns n and how to guard it."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Given a sorted slice and a target, return its index or -1. Follow-ups: "first element ≥ x", and "smallest k for which some condition holds" — binary search on the answer.',
        ],
      },
      {"heading": "Brute force first", "body": ["Linear scan: walk the slice from the left and return the first index where `s[i] == target`.", "**O(n) time, O(1) space.** It works even on unsorted data, which is the only reason to keep it in mind."]},
      {
        heading: 'The approach',
        body: [
          'Keep `lo` and `hi` as an inclusive range. Look at the middle; discard the half that cannot contain the target. **O(log n) time, O(1) space.** The input must be sorted — say so, and ask if it is.',
          'For "first index where a condition becomes true", use `sort.Search(n, f)`. It requires `f` to be false then true across the range, and returns `n` if it is never true.',
        ],
      },
      { code: { label: 'bsearch.go', src: BSEARCH, run: BSEARCH } },
      {"heading": "Dry run", "body": ["`s = [1 3 5 7 9 11]`, `target = 9`:"], "table": {"headers": ["lo", "hi", "mid", "s[mid]", "decision"], "rows": [["0", "5", "2", "5", "5 < 9, so lo = 3"], ["3", "5", "4", "9", "found, return 4"]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**`lo + (hi-lo)/2`**, not `(lo+hi)/2`. `lo+hi` only overflows realistically when `int` is 32-bit (some ARM and WebAssembly targets) or the indices are huge. On 64-bit `int` it is rare, but the safe form costs nothing and interviewers look for it.',
          '**`slices.BinarySearch` returns `(index, found)`.** When not found, the index is the insertion point, which is often what the follow-up wants.',
          '**`sort.Search` can return `n`.** Check `i < len(s)` before you read `s[i]`, or you panic on "not found".',
          '**Generic since Go 1.21.** `slices.BinarySearch` works on any `cmp.Ordered` element type; use `slices.BinarySearchFunc` for structs.',
        ],
      },
    ],
    keyPoints: [
      'Inclusive `lo..hi`, loop while `lo <= hi`, mid as `lo + (hi-lo)/2`.',
      '`slices.BinarySearch` for exact lookups; `sort.Search` for lower bound and search-on-answer.',
      'Always guard the "returned n" case.',
    ],
    remember: 'Binary search works on any monotonic yes/no question, not only on sorted slices.',
    task: 'Find the first and last position of a target in a sorted slice with duplicates, using two `sort.Search` calls.',
    challenge: {"prompt": "Write `search(s []int, target int) int` that returns the index of `target` in the sorted slice `s`, or -1, in O(log n). Example: `[1 3 5 7 9 11]`, 9 → 4.", "starter": "package main\n\nfunc search(s []int, target int) int {\n\t// your code here\n\treturn -1\n}\n", "test": "package main\n\nimport \"testing\"\n\nfunc TestSearch(t *testing.T) {\n\ttests := []struct {\n\t\ts      []int\n\t\ttarget int\n\t\twant   int\n\t}{\n\t\t{[]int{1, 3, 5, 7, 9, 11}, 9, 4},\n\t\t{[]int{1, 3, 5, 7, 9, 11}, 1, 0},\n\t\t{[]int{1, 3, 5, 7, 9, 11}, 11, 5},\n\t\t{[]int{1, 3, 5, 7, 9, 11}, 4, -1},\n\t\t{[]int{5}, 5, 0},\n\t\t{nil, 5, -1},\n\t}\n\tfor _, tc := range tests {\n\t\tif got := search(tc.s, tc.target); got != tc.want {\n\t\t\tt.Errorf(\"search(%v, %v) = %v, want %v\", tc.s, tc.target, got, tc.want)\n\t\t}\n\t}\n}\n", "solution": "package main\n\nfunc search(s []int, target int) int {\n\tlo, hi := 0, len(s)-1\n\tfor lo <= hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tswitch {\n\t\tcase s[mid] == target:\n\t\t\treturn mid\n\t\tcase s[mid] < target:\n\t\t\tlo = mid + 1\n\t\tdefault:\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn -1\n}\n"},
    refs: [
      { label: 'slices.BinarySearch', href: 'https://pkg.go.dev/slices#BinarySearch' },
      { label: 'sort.Search', href: 'https://pkg.go.dev/sort#Search' },
    ],
  },
  {
    slug: 'dsa-lru-cache',
    title: 'LRU cache with container/list and a map',
    navTitle: 'LRU cache',
    oneLine: 'The design question disguised as a coding question: two structures, each covering what the other cannot.',
    objectives: ["Write an LRU cache with O(1) Get and Put using a map and container/list.", "Explain why the list entry must store its key.", "Predict which key is evicted after a sequence of calls."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Build a cache with a fixed capacity. `Get(key)` and `Put(key, val)` must both be O(1). When it is full, `Put` evicts the least recently used key.',
        ],
      },
      {"heading": "Brute force first", "body": ["Keep a plain slice of `{key, val}` pairs, most recent at the front. `Get` scans for the key, removes it and puts it at the front. `Put` does the same, and drops the last pair when the slice is full.", "Every operation scans and shifts: **O(capacity) time per call, O(capacity) space.** Correct, but the question asks for O(1)."]},
      {
        heading: 'The approach',
        body: [
          'A map alone gives O(1) lookup but no order. A list alone gives order but O(n) lookup. Together: the map points at list nodes, and the doubly linked list keeps them in recency order. Move a node to the front on every use; evict from the back. **O(1) for both operations, O(capacity) space.**',
          'Go’s `container/list` is that doubly linked list, so you do not write one in the interview unless asked.',
        ],
      },
      { code: { label: 'lru.go', src: LRU, run: LRU } },
      {"heading": "Dry run", "body": ["Capacity 2, following the `main` in the program. The list is shown front (most recent) to back:"], "table": {"headers": ["call", "result", "list after", "map keys"], "rows": [["Put(1, 1)", "-", "1", "{1}"], ["Put(2, 2)", "-", "2, 1", "{1, 2}"], ["Get(1)", "1 true", "1, 2", "{1, 2}"], ["Put(3, 3)", "full, evict back = 2", "3, 1", "{1, 3}"], ["Get(2)", "0 false", "3, 1", "{1, 3}"], ["Put(4, 4)", "full, evict back = 1", "4, 3", "{3, 4}"]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**Store the key inside the list entry.** On eviction you only have the list node, and you need the key to `delete` it from the map.',
          '**`list.Element.Value` is `any`.** The type assertion `el.Value.(*entry)` is the price of a pre-generics package. Storing a pointer lets you update the value in place.',
          '**Not safe for concurrent use.** Even `Get` mutates (it moves the node), so a `sync.RWMutex` read lock is not enough — use a plain `sync.Mutex`. Ask whether they want it thread-safe before adding one.',
          '**A `map` of pointers keeps nodes alive.** Forgetting the `delete` on eviction is a memory leak that no test of `Get` will catch.',
        ],
      },
    ],
    keyPoints: [
      'Map for O(1) find, doubly linked list for O(1) reorder and evict.',
      'Every `Get` hit is a use: move to front.',
      'The entry stores its key so eviction can clean up the map.',
    ],
    remember: 'When one data structure cannot do both jobs in O(1), use two that point at each other.',
    task: 'Add a `Peek(key)` method that returns the value without making it most recent. Show with a test that a peeked key can still be evicted.',
    challenge: {"prompt":"Finish the `LRU` cache: `NewLRU(capacity)`, `Get(key) (int, bool)` and `Put(key, val)`. Both `Get` and `Put` make a key the most recently used; updating an existing key changes its value and refreshes it. When a `Put` adds a new key to a full cache, evict the least recently used key. Example with capacity 2: Put(1,1) Put(2,2) Get(1) Put(3,3) evicts 2.","starter":"package main\n\ntype LRU struct {\n\tcapacity int\n\t// your fields here\n}\n\nfunc NewLRU(capacity int) *LRU {\n\treturn &LRU{capacity: capacity}\n}\n\nfunc (c *LRU) Get(key int) (int, bool) {\n\treturn 0, false // your code here\n}\n\nfunc (c *LRU) Put(key, val int) {\n\t// your code here\n}\n","test":"package main\n\nimport \"testing\"\n\n// a step is a Put when put is true, otherwise a Get that must return want, ok.\ntype lruStep struct {\n\tput       bool\n\tkey, want int\n\tok        bool\n}\n\nfunc TestLRU(t *testing.T) {\n\tscripts := []struct {\n\t\tcapacity int\n\t\tsteps    []lruStep\n\t}{\n\t\t{2, []lruStep{{true, 1, 1, false}, {true, 2, 2, false}, {false, 1, 1, true}, {true, 3, 3, false},\n\t\t\t{false, 2, 0, false}, {true, 4, 4, false}, {false, 1, 0, false}, {false, 3, 3, true}, {false, 4, 4, true}}},\n\t\t{2, []lruStep{{true, 1, 1, false}, {true, 2, 2, false}, {true, 1, 10, false}, {true, 3, 3, false},\n\t\t\t{false, 1, 10, true}, {false, 2, 0, false}}},\n\t\t{1, []lruStep{{true, -5, -50, false}, {false, -5, -50, true}, {true, 6, 6, false}, {false, -5, 0, false}, {false, 6, 6, true}}},\n\t\t{3, []lruStep{{false, 9, 0, false}, {true, 0, 0, false}, {false, 0, 0, true}}},\n\t}\n\tfor n, s := range scripts {\n\t\tc := NewLRU(s.capacity)\n\t\tfor i, st := range s.steps {\n\t\t\tif st.put {\n\t\t\t\tc.Put(st.key, st.want)\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tif v, ok := c.Get(st.key); v != st.want || ok != st.ok {\n\t\t\t\tt.Errorf(\"script %v step %v: Get(%v) = %v, %v, want %v, %v\", n, i, st.key, v, ok, st.want, st.ok)\n\t\t\t}\n\t\t}\n\t}\n}\n","solution":"package main\n\nimport \"container/list\"\n\ntype lruEntry struct{ key, val int }\n\ntype LRU struct {\n\tcapacity int\n\tll       *list.List\n\titems    map[int]*list.Element\n}\n\nfunc NewLRU(capacity int) *LRU {\n\treturn &LRU{capacity: capacity, ll: list.New(), items: map[int]*list.Element{}}\n}\n\nfunc (c *LRU) Get(key int) (int, bool) {\n\tel, ok := c.items[key]\n\tif !ok {\n\t\treturn 0, false\n\t}\n\tc.ll.MoveToFront(el)\n\treturn el.Value.(*lruEntry).val, true\n}\n\nfunc (c *LRU) Put(key, val int) {\n\tif el, ok := c.items[key]; ok {\n\t\tel.Value.(*lruEntry).val = val\n\t\tc.ll.MoveToFront(el)\n\t\treturn\n\t}\n\tc.items[key] = c.ll.PushFront(&lruEntry{key, val})\n\tif c.ll.Len() > c.capacity {\n\t\told := c.ll.Back()\n\t\tc.ll.Remove(old)\n\t\tdelete(c.items, old.Value.(*lruEntry).key)\n\t}\n}\n"},
    refs: [{ label: 'container/list', href: 'https://pkg.go.dev/container/list' }],
  },
  {
    slug: 'dsa-reverse-linked-list',
    title: 'Reverse a linked list',
    navTitle: 'Reverse linked list',
    oneLine: 'Three pointers and one saved link. The question that checks you can move pointers without losing the rest of the list.',
    objectives: ["Write an iterative linked-list reversal with O(1) extra space.", "Predict prev, cur and next at each step of a dry run.", "Fix the bug of overwriting Next before saving it."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Given the head of a singly linked list, reverse it and return the new head. `1 → 2 → 3` becomes `3 → 2 → 1`.',
        ],
      },
      {"heading": "Brute force first", "body": ["Walk the list and copy every value into a slice. Walk it again and write the values back from the end of the slice.", "**O(n) time, O(n) extra space.** It also only swaps values, not nodes, which some interviewers will not accept."]},
      {
        heading: 'The approach',
        body: [
          'Walk the list once. For each node, save its `Next`, point it back at the previous node, then step forward. When you fall off the end, `prev` is the new head. **O(n) time, O(1) space.**',
          'A recursive version exists, but it uses O(n) stack. Offer it only if asked.',
        ],
      },
      { code: { label: 'reverse_list.go', src: LIST_REVERSE, run: LIST_REVERSE } },
      {"heading": "Dry run", "body": ["`1 → 2 → 3`. Each row is one loop iteration:"], "table": {"headers": ["step", "next (saved)", "cur.Next set to", "prev after", "cur after"], "rows": [["start", "-", "-", "nil", "1"], ["1", "2", "nil", "1", "2"], ["2", "3", "1", "2", "3"], ["3", "nil", "2", "3", "nil"], ["end", "cur is nil, return prev", "", "3 → 2 → 1", ""]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**Save `Next` before you overwrite it.** Once `cur.Next = prev` runs, the rest of the list is gone unless you kept a pointer to it.',
          '**A nil `*Node` is a valid empty list.** `var prev *Node` starts as nil, and the loop simply does not run for a nil head. No special case needed.',
          '**Tuple assignment** `prev, cur = cur, next` evaluates the right side first, so the order is safe.',
          'Go has `container/list`, but interviewers want your own `Node` type for this one.',
        ],
      },
    ],
    keyPoints: [
      'Three pointers: `prev`, `cur`, and the saved `next`.',
      'Save the link before you break it.',
      'Return `prev`, not `cur`. `cur` is nil at the end.',
    ],
    remember: 'Draw three boxes and the arrows before you write a line. Pointer bugs are drawing bugs.',
    task: 'Reverse only the nodes between positions `m` and `n` (1-based) and leave the rest in place.',
    challenge: {"prompt":"Write `reverseList(head *Node) *Node` that reverses a singly linked list **by relinking the existing nodes** (no new nodes) and returns the new head. Example: `1 → 2 → 3` → `3 → 2 → 1`. An empty list stays `nil`.","starter":"package main\n\ntype Node struct {\n\tVal  int\n\tNext *Node\n}\n\nfunc reverseList(head *Node) *Node {\n\treturn head // your code here\n}\n","test":"package main\n\nimport (\n\t\"slices\"\n\t\"testing\"\n)\n\nfunc fromSlice(vals []int) (*Node, []*Node) {\n\tvar head *Node\n\tnodes := make([]*Node, len(vals))\n\tfor i := len(vals) - 1; i >= 0; i-- {\n\t\thead = &Node{Val: vals[i], Next: head}\n\t\tnodes[i] = head\n\t}\n\treturn head, nodes\n}\n\nfunc toSlice(n *Node) []int {\n\tvar out []int\n\tfor ; n != nil && len(out) < 10000; n = n.Next {\n\t\tout = append(out, n.Val)\n\t}\n\treturn out\n}\n\nfunc TestReverseList(t *testing.T) {\n\ttests := [][]int{nil, {1}, {1, 2}, {1, 2, 3, 4, 5}, {-3, 0, -3}, {1000000000, -1000000000}}\n\tfor _, vals := range tests {\n\t\thead, nodes := fromSlice(vals)\n\t\tgot := reverseList(head)\n\t\twant := slices.Clone(vals)\n\t\tslices.Reverse(want)\n\t\tif !slices.Equal(toSlice(got), want) {\n\t\t\tt.Errorf(\"reverseList(%v) = %v, want %v\", vals, toSlice(got), want)\n\t\t\tcontinue\n\t\t}\n\t\tfor i, n := 0, got; n != nil; i, n = i+1, n.Next {\n\t\t\tif n != nodes[len(nodes)-1-i] {\n\t\t\t\tt.Errorf(\"reverseList(%v) node %v is a new node, want %v (relink the old nodes)\", vals, i, \"an original node\")\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t}\n}\n","solution":"package main\n\ntype Node struct {\n\tVal  int\n\tNext *Node\n}\n\nfunc reverseList(head *Node) *Node {\n\tvar prev *Node\n\tfor head != nil {\n\t\thead.Next, prev, head = prev, head, head.Next\n\t}\n\treturn prev\n}\n"},
    refs: [
      { label: 'Go spec: pointer types', href: 'https://go.dev/ref/spec#Pointer_types' },
    ],
  },
  {
    slug: 'dsa-detect-cycle',
    title: 'Detect a cycle with two pointers',
    navTitle: 'Detect a cycle',
    oneLine: 'Floyd\'s tortoise and hare: find a loop in a linked list with no extra memory.',
    objectives: ["Write Floyd's cycle check with slow and fast pointers.", "Explain why both fast and fast.Next must be checked for nil.", "Predict where slow and fast meet on a small cyclic list."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Given the head of a linked list, return `true` if some node\'s `Next` points back to an earlier node, so walking it would never end.',
        ],
      },
      {"heading": "Brute force first", "body": ["Remember every node you visit in a `map[*Node]bool`. If you reach a node already in the map, there is a cycle; if you reach nil, there is not.", "**O(n) time, O(n) space.** Correct and easy to explain; the follow-up is always \"now do it in O(1) space\"."]},
      {
        heading: 'The approach',
        body: [
          'The easy answer is a `map[*Node]bool` of visited nodes: O(n) time, O(n) space. Say it first.',
          'Then the better one. Move `slow` one step and `fast` two steps. With no loop, `fast` reaches nil. With a loop, `fast` gains one node per step on `slow` and must land on it. **O(n) time, O(1) space.**',
        ],
      },
      { code: { label: 'cycle.go', src: LIST_CYCLE, run: LIST_CYCLE } },
      {"heading": "Dry run", "body": ["`1 → 2 → 3 → 4`, and 4 points back to 2. Slow moves 1, fast moves 2:"], "table": {"headers": ["step", "slow", "fast", "same node?"], "rows": [["start", "1", "1", "(not checked)"], ["1", "2", "3", "no"], ["2", "3", "2 (3 → 4 → 2)", "no"], ["3", "4", "4 (2 → 3 → 4)", "yes, return true"]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**Check `fast != nil && fast.Next != nil`** before `fast.Next.Next`. Both are needed, or you get a nil pointer panic on even-length lists.',
          '**`slow == fast` compares pointers,** which means "the same node". Comparing `slow.Val == fast.Val` is a bug when values repeat.',
          '**Pointers are valid map keys,** so `map[*Node]bool` works for the simple version.',
        ],
      },
    ],
    keyPoints: [
      'Map of visited nodes first, then two pointers for O(1) space.',
      'Guard both `fast` and `fast.Next`.',
      'Compare nodes, not values.',
    ],
    remember: 'Two runners on a circular track always meet. On a straight one, the fast one just finishes.',
    task: 'Return the node where the cycle starts. Hint: after they meet, move one pointer back to the head and step both by one.',
    challenge: {"prompt":"Write `hasCycle(head *Node) bool` that reports whether the list loops back on itself, using Floyd's slow and fast pointers in O(1) extra space (the hidden tests check that it allocates nothing, so no \"visited\" map). Example: `1 → 2 → 3 → back to 2` → true.","starter":"package main\n\ntype Node struct {\n\tVal  int\n\tNext *Node\n}\n\nfunc hasCycle(head *Node) bool {\n\treturn false // your code here\n}\n","test":"package main\n\nimport \"testing\"\n\n// makeList builds n nodes; the last one points back to node pos, or to nil when pos is -1.\nfunc makeList(n, pos int) *Node {\n\tnodes := make([]*Node, n)\n\tfor i := range nodes {\n\t\tnodes[i] = &Node{Val: i % 3}\n\t}\n\tfor i := 0; i+1 < n; i++ {\n\t\tnodes[i].Next = nodes[i+1]\n\t}\n\tif n > 0 && pos >= 0 {\n\t\tnodes[n-1].Next = nodes[pos]\n\t}\n\tif n == 0 {\n\t\treturn nil\n\t}\n\treturn nodes[0]\n}\n\nfunc TestHasCycle(t *testing.T) {\n\ttests := []struct {\n\t\tn, pos int\n\t\twant   bool\n\t}{\n\t\t{0, -1, false},\n\t\t{1, -1, false},\n\t\t{1, 0, true},\n\t\t{2, 0, true},\n\t\t{2, -1, false},\n\t\t{3, 1, true},\n\t\t{1000, 500, true},\n\t\t{1000, 999, true},\n\t\t{1001, -1, false},\n\t}\n\tfor _, tc := range tests {\n\t\tif got := hasCycle(makeList(tc.n, tc.pos)); got != tc.want {\n\t\t\tt.Errorf(\"hasCycle(%v nodes, tail to %v) = %v, want %v\", tc.n, tc.pos, got, tc.want)\n\t\t}\n\t}\n}\n\nfunc TestHasCycleNoAlloc(t *testing.T) {\n\thead := makeList(2000, 1000)\n\tif n := testing.AllocsPerRun(5, func() { hasCycle(head) }); n != 0 {\n\t\tt.Errorf(\"hasCycle(2000 nodes) allocations = %v, want %v (use slow and fast pointers)\", n, 0)\n\t}\n}\n","solution":"package main\n\ntype Node struct {\n\tVal  int\n\tNext *Node\n}\n\nfunc hasCycle(head *Node) bool {\n\tslow, fast := head, head\n\tfor fast != nil && fast.Next != nil {\n\t\tslow, fast = slow.Next, fast.Next.Next\n\t\tif slow == fast {\n\t\t\treturn true\n\t\t}\n\t}\n\treturn false\n}\n"},
    refs: [
      { label: 'Go spec: comparison operators', href: 'https://go.dev/ref/spec#Comparison_operators' },
    ],
  },
  {
    slug: 'dsa-merge-sorted-lists',
    title: 'Merge two sorted lists',
    navTitle: 'Merge sorted lists',
    oneLine: 'A dummy head node removes every special case, and the leftover tail is attached in one line.',
    objectives: ["Write a merge of two sorted lists using a dummy head.", "Explain why <= keeps the merge stable.", "Predict the result when one list is nil."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Given two sorted linked lists, merge them into one sorted list by relinking their nodes.',
        ],
      },
      {"heading": "Brute force first", "body": ["Copy every value from both lists into one slice, `slices.Sort` it, and build a brand-new list from the result.", "**O((n+m) log(n+m)) time, O(n+m) space.** It ignores that the inputs are already sorted, which is the whole hint."]},
      {
        heading: 'The approach',
        body: [
          'Keep a `tail` pointer. Compare the two heads, attach the smaller one, step that list forward. When one list runs out, attach the rest of the other in one go. **O(n + m) time, O(1) extra space.**',
        ],
      },
      { code: { label: 'merge_lists.go', src: LIST_MERGE, run: LIST_MERGE } },
      {"heading": "Dry run", "body": ["`a = 1 → 3 → 5`, `b = 2 → 4`:"], "table": {"headers": ["compare", "attach", "result so far"], "rows": [["1 vs 2", "1 (from a)", "1"], ["3 vs 2", "2 (from b)", "1 2"], ["3 vs 4", "3 (from a)", "1 2 3"], ["5 vs 4", "4 (from b)", "1 2 3 4"], ["b is empty", "rest of a (5)", "1 2 3 4 5"]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**A dummy node on the stack** (`var dummy Node`) means the first node is not a special case. Return `dummy.Next`.',
          '**`<=` rather than `<`** keeps equal values in their original order. That is called a stable merge.',
          '**Do not copy nodes** unless asked. Relinking is the point, and it avoids allocating.',
          'The same merge step is the heart of merge sort. Say so; it shows you see the connection.',
        ],
      },
    ],
    keyPoints: [
      'Dummy head, tail pointer, compare and attach.',
      'Attach the leftover list in one assignment.',
      'O(n + m) time, no new nodes.',
    ],
    remember: 'When the first item of a result is a special case, add a dummy in front of it.',
    task: 'Merge `k` sorted lists. First do it pairwise, then with a min-heap from `container/heap`, and compare the complexity.',
    challenge: {"prompt":"Write `mergeLists(a, b *Node) *Node` that merges two sorted linked lists into one sorted list **by splicing the existing nodes** (no new nodes) and returns its head. Equal values may come in either order. Example: `1 → 3 → 5` and `2 → 4` → `1 → 2 → 3 → 4 → 5`.","starter":"package main\n\ntype Node struct {\n\tVal  int\n\tNext *Node\n}\n\nfunc mergeLists(a, b *Node) *Node {\n\treturn a // your code here\n}\n","test":"package main\n\nimport (\n\t\"slices\"\n\t\"testing\"\n)\n\nfunc fromSlice(vals []int) (*Node, []*Node) {\n\tvar head *Node\n\tnodes := make([]*Node, len(vals))\n\tfor i := len(vals) - 1; i >= 0; i-- {\n\t\thead = &Node{Val: vals[i], Next: head}\n\t\tnodes[i] = head\n\t}\n\treturn head, nodes\n}\n\nfunc toSlice(n *Node) []int {\n\tvar out []int\n\tfor ; n != nil && len(out) < 10000; n = n.Next {\n\t\tout = append(out, n.Val)\n\t}\n\treturn out\n}\n\nfunc TestMergeLists(t *testing.T) {\n\ttests := []struct{ a, b []int }{\n\t\t{nil, nil},\n\t\t{[]int{1, 3, 5}, []int{2, 4, 6}},\n\t\t{nil, []int{0}},\n\t\t{[]int{1, 2, 3}, nil},\n\t\t{[]int{1, 1, 2}, []int{1, 3}},\n\t\t{[]int{-10, -3}, []int{-5, 100}},\n\t\t{[]int{5, 6, 7}, []int{1, 2}},\n\t}\n\tfor _, tc := range tests {\n\t\tha, na := fromSlice(tc.a)\n\t\thb, nb := fromSlice(tc.b)\n\t\town := map[*Node]bool{}\n\t\tfor _, n := range append(na, nb...) {\n\t\t\town[n] = true\n\t\t}\n\t\twant := slices.Sorted(slices.Values(append(slices.Clone(tc.a), tc.b...)))\n\t\tgot := mergeLists(ha, hb)\n\t\tif !slices.Equal(toSlice(got), want) {\n\t\t\tt.Errorf(\"mergeLists(%v, %v) = %v, want %v\", tc.a, tc.b, toSlice(got), want)\n\t\t\tcontinue\n\t\t}\n\t\tfor n := got; n != nil; n = n.Next {\n\t\t\tif !own[n] {\n\t\t\t\tt.Errorf(\"mergeLists(%v, %v) made a new node %v, want %v\", tc.a, tc.b, n.Val, \"only the original nodes\")\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t}\n}\n","solution":"package main\n\ntype Node struct {\n\tVal  int\n\tNext *Node\n}\n\nfunc mergeLists(a, b *Node) *Node {\n\tvar dummy Node\n\ttail := &dummy\n\tfor a != nil && b != nil {\n\t\tif a.Val <= b.Val {\n\t\t\ttail.Next, a = a, a.Next\n\t\t} else {\n\t\t\ttail.Next, b = b, b.Next\n\t\t}\n\t\ttail = tail.Next\n\t}\n\tif a != nil {\n\t\ttail.Next = a\n\t} else {\n\t\ttail.Next = b\n\t}\n\treturn dummy.Next\n}\n"},
    refs: [
      { label: 'container/heap', href: 'https://pkg.go.dev/container/heap' },
    ],
  },
  {
    slug: 'dsa-binary-tree',
    title: 'Binary tree depth and level order',
    navTitle: 'Tree depth and BFS',
    oneLine: 'Recursion for depth, a slice as a queue for level order. The two shapes every tree question uses.',
    objectives: ["Write maxDepth with recursion and level order with a slice queue.", "Explain why len(queue) is read before each level's loop.", "Predict the queue contents after each round of BFS."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Given a binary tree, return its maximum depth (the number of nodes on the longest path from the root down), and its values level by level from top to bottom.',
        ],
      },
      {"heading": "Brute force first", "body": ["For level order without a queue: find the height, then for each level `d` walk the whole tree recursively and collect the nodes at depth `d`.", "Each walk is O(n) and there are `h` levels: **O(n·h) time**, O(n²) for a tree that is one long line. The queue does it in one pass."]},
      {
        heading: 'The approach',
        body: [
          '**Depth** is recursion: a nil tree has depth 0, any other is `1 + max(left, right)`. **O(n) time, O(h) stack** where `h` is the height.',
          '**Level order** is breadth-first search. Put the root in a queue. Each round, take everything currently in the queue as one level and add their children to the back. **O(n) time, O(width) space.**',
        ],
      },
      { code: { label: 'tree.go', src: TREE, run: TREE } },
      {"heading": "Dry run", "body": ["The tree `3`, children `9` and `20`, and `20` has children `15` and `7`. Level order:"], "table": {"headers": ["round", "n = len(queue)", "level taken", "queue after"], "rows": [["1", "1", "[3]", "[9 20]"], ["2", "2", "[9 20]", "[15 7]"], ["3", "2", "[15 7]", "[]"]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**A slice is a fine queue.** `append` to the back, `queue = queue[n:]` to drop the front. The backing array is reused or reallocated by `append`, so this stays O(n) overall. One catch: `queue = queue[1:]` (or `[n:]`) keeps the old front of the backing array alive until `append` reallocates. For a long-lived or very long queue, keep an index `head` and read `queue[head]`, or copy the live part into a new slice now and then.',
          '**Read `len(queue)` before the inner loop.** The loop appends children, and you only want the nodes that were there when the level started.',
          '**A nil `*Tree` is a valid empty tree,** so `maxDepth(nil)` returns 0 with no special case.',
          '`max` is a built-in since Go 1.21. You do not need `math.Max`, which works on `float64` anyway.',
        ],
      },
    ],
    keyPoints: [
      'Depth: recursion, nil is 0.',
      'Level order: BFS with a slice queue, one level per round.',
      'Snapshot the queue length before you start a level.',
    ],
    remember: 'Depth-first is a stack (or recursion). Breadth-first is a queue. Most tree problems are one of the two.',
    task: 'Return the right side view of a tree: the last value of each level. Reuse the level-order code.',
    challenge: {"prompt":"Write `levels(root *Tree) [][]int` that returns the values level by level, left to right (breadth-first search). An empty tree returns an empty result. Example: `3` with children `9` and `20`, and `20` with children `15` and `7` → `[[3] [9 20] [15 7]]`.","starter":"package main\n\ntype Tree struct {\n\tVal         int\n\tLeft, Right *Tree\n}\n\nfunc levels(root *Tree) [][]int {\n\treturn nil // your code here\n}\n","test":"package main\n\nimport (\n\t\"fmt\"\n\t\"testing\"\n)\n\nfunc leaf(v int) *Tree { return &Tree{Val: v} }\n\nfunc TestLevels(t *testing.T) {\n\ttests := []struct {\n\t\tname string\n\t\troot *Tree\n\t\twant [][]int\n\t}{\n\t\t{\"empty\", nil, nil},\n\t\t{\"single\", leaf(1), [][]int{{1}}},\n\t\t{\"classic\", &Tree{3, leaf(9), &Tree{20, leaf(15), leaf(7)}}, [][]int{{3}, {9, 20}, {15, 7}}},\n\t\t{\"left chain\", &Tree{-1, &Tree{-2, leaf(-3), nil}, nil}, [][]int{{-1}, {-2}, {-3}}},\n\t\t{\"gaps\", &Tree{1, &Tree{2, nil, leaf(4)}, &Tree{3, nil, leaf(5)}}, [][]int{{1}, {2, 3}, {4, 5}}},\n\t\t{\"duplicates\", &Tree{5, leaf(5), leaf(5)}, [][]int{{5}, {5, 5}}},\n\t}\n\tfor _, tc := range tests {\n\t\tif got := levels(tc.root); fmt.Sprint(got) != fmt.Sprint(tc.want) {\n\t\t\tt.Errorf(\"levels(%v) = %v, want %v\", tc.name, got, tc.want)\n\t\t}\n\t}\n}\n","solution":"package main\n\ntype Tree struct {\n\tVal         int\n\tLeft, Right *Tree\n}\n\nfunc levels(root *Tree) [][]int {\n\tvar out [][]int\n\tif root == nil {\n\t\treturn out\n\t}\n\tqueue := []*Tree{root}\n\tfor len(queue) > 0 {\n\t\tvar row []int\n\t\tvar next []*Tree\n\t\tfor _, n := range queue {\n\t\t\trow = append(row, n.Val)\n\t\t\tif n.Left != nil {\n\t\t\t\tnext = append(next, n.Left)\n\t\t\t}\n\t\t\tif n.Right != nil {\n\t\t\t\tnext = append(next, n.Right)\n\t\t\t}\n\t\t}\n\t\tout = append(out, row)\n\t\tqueue = next\n\t}\n\treturn out\n}\n"},
    refs: [
      { label: 'Go spec: slice expressions', href: 'https://go.dev/ref/spec#Slice_expressions' },
    ],
  },
  {
    slug: 'dsa-subsets-permutations',
    title: 'Subsets and permutations with backtracking',
    navTitle: 'Subsets and permutations',
    oneLine: 'Choose, recurse, undo. And the one-line copy that stops every answer turning into the same slice.',
    objectives: ["Write subsets and permutations with choose, recurse, undo.", "Fix the bug where every saved answer is the same slice.", "Explain why the output size sets the complexity."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Given distinct integers, return every subset (`[1 2 3]` has 8), and separately every permutation (it has 6).',
        ],
      },
      {"heading": "Brute force first", "body": ["For permutations: generate every length-n sequence of the numbers with repeats allowed (nⁿ of them) and keep only the ones with no repeated number.", "**O(n · nⁿ) time.** For n = 8 that is 16.7 million sequences to make 40,320 permutations. Backtracking only builds the ones that can work."]},
      {
        heading: 'The approach',
        body: [
          '**Backtracking:** at each step make a choice, recurse, then undo the choice so the next branch starts clean.',
          'Subsets: for each element, "leave it out" then "take it". Permutations: swap each remaining element into position `i`, recurse, swap it back. Subsets are **O(n · 2ⁿ)**, permutations **O(n · n!)**, because that is how big the output is.',
        ],
      },
      { code: { label: 'backtrack.go', src: BACKTRACK, run: BACKTRACK } },
      {"heading": "Dry run", "body": ["`subsets([1 2])`. Each call either skips or takes `nums[i]`; the program skips first:"], "table": {"headers": ["call", "cur", "what happens"], "rows": [["walk(0)", "[]", "skip 1, call walk(1)"], ["walk(1)", "[]", "skip 2, call walk(2)"], ["walk(2)", "[]", "end, save []"], ["walk(1)", "[2]", "took 2, call walk(2), save [2], undo"], ["walk(0)", "[1]", "took 1, call walk(1)"], ["walk(1)", "[1]", "skip 2, walk(2) saves [1]"], ["walk(1)", "[1 2]", "took 2, walk(2) saves [1 2], undo, undo"]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**Copy before you save.** `out = append(out, cur)` stores the same backing array every time, so later changes overwrite earlier answers. `append([]int(nil), cur...)` (or `slices.Clone(cur)`) saves a snapshot.',
          '**Undo exactly what you did.** `cur = cur[:len(cur)-1]` after an `append`, and the second swap after the first.',
          '**A recursive closure must be declared first:** `var walk func(int)`, then `walk = func...`. Otherwise it cannot call itself.',
        ],
      },
    ],
    keyPoints: [
      'Choose, recurse, undo.',
      'Copy the current slice when you save it as an answer.',
      'Output size sets the complexity: 2ⁿ subsets, n! permutations.',
    ],
    remember: 'If every answer in your output looks the same, you saved the slice, not a copy of it.',
    task: 'Generate all combinations of `k` numbers out of `1..n`. Stop a branch early when there are not enough numbers left to fill it.',
    challenge: {"prompt":"Write `subsets(nums []int) [][]int` that returns every subset of `nums` (the numbers are distinct), including the empty one, in any order. Watch the backtracking trap: copy the current path before you save it, or later appends overwrite subsets you already returned. Example: `[1 2]` → `[] [1] [2] [1 2]`.","starter":"package main\n\nfunc subsets(nums []int) [][]int {\n\treturn [][]int{{}} // your code here\n}\n","test":"package main\n\nimport (\n\t\"fmt\"\n\t\"slices\"\n\t\"testing\"\n)\n\n// canon sorts each subset and then the list, so any order of answers compares equal.\nfunc canon(all [][]int) [][]int {\n\tout := make([][]int, len(all))\n\tfor i, s := range all {\n\t\tout[i] = slices.Sorted(slices.Values(s))\n\t}\n\tslices.SortFunc(out, slices.Compare)\n\treturn out\n}\n\nfunc byMask(nums []int) [][]int {\n\tvar out [][]int\n\tfor m := 0; m < 1<<len(nums); m++ {\n\t\ts := []int{}\n\t\tfor i, n := range nums {\n\t\t\tif m>>i&1 == 1 {\n\t\t\t\ts = append(s, n)\n\t\t\t}\n\t\t}\n\t\tout = append(out, s)\n\t}\n\treturn out\n}\n\nfunc TestSubsets(t *testing.T) {\n\ttests := [][]int{{}, {1}, {1, 2}, {1, 2, 3}, {5, -1, 3, 0}, {1, 2, 3, 4, 5, 6}, {-7, 1000000, 2, 9, 4}}\n\tfor _, nums := range tests {\n\t\tgot := subsets(slices.Clone(nums))\n\t\tif g, w := canon(got), canon(byMask(nums)); fmt.Sprint(g) != fmt.Sprint(w) {\n\t\t\tt.Errorf(\"subsets(%v) = %v, want %v\", nums, got, w)\n\t\t}\n\t}\n}\n","solution":"package main\n\nfunc subsets(nums []int) [][]int {\n\tvar out [][]int\n\tvar path []int\n\tvar walk func(i int)\n\twalk = func(i int) {\n\t\tout = append(out, append([]int{}, path...)) // copy, never the shared path\n\t\tfor j := i; j < len(nums); j++ {\n\t\t\tpath = append(path, nums[j])\n\t\t\twalk(j + 1)\n\t\t\tpath = path[:len(path)-1]\n\t\t}\n\t}\n\twalk(0)\n\treturn out\n}\n"},
    refs: [
      { label: 'slices.Clone', href: 'https://pkg.go.dev/slices#Clone' },
    ],
  },
  {
    slug: 'dsa-dynamic-programming',
    title: 'Dynamic programming: stairs, coins, LCS',
    navTitle: 'Dynamic programming',
    oneLine: 'Write the answer for a small case in terms of smaller ones, then fill a table from the bottom up.',
    objectives: ["Write the recurrence for stairs, coin change and LCS before coding.", "Fill a small DP table by hand and check it against the program.", "Explain why plain recursion is exponential and DP is not."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Three classics. **Climbing stairs:** how many ways to climb `n` steps taking 1 or 2 at a time. **Coin change:** the fewest coins that make an amount, or -1. **Longest common subsequence:** the length of the longest sequence of characters that appears, in order, in both strings.',
        ],
      },
      {"heading": "Brute force first", "body": ["Plain recursion straight from the recurrence. For stairs: `ways(n) = ways(n-1) + ways(n-2)`. It is correct, but `ways(3)` is recomputed again and again: **O(2ⁿ) time**, O(n) stack. Coin change and LCS blow up the same way.", "DP is this same recursion with each answer stored once and filled from small to large."]},
      {
        heading: 'The approach',
        body: [
          'Find the recurrence first. Stairs: `ways(n) = ways(n-1) + ways(n-2)`. Coins: `best(x) = 1 + min(best(x-c))` over each coin `c`. LCS: if the last characters match, `1 + lcs(shorter both)`, else the larger of dropping one from either side.',
          'Then fill the answers from small to large so each one is ready when you need it. Stairs is **O(n) time, O(1) space**. Coins is **O(amount · coins)**. LCS is **O(n · m)** time and space.',
        ],
      },
      { code: { label: "stairs_recursive.go", src: DP_RECURSIVE, run: DP_RECURSIVE } },
      {"heading": "Problem 1: climbing stairs", "body": ["**Recurrence:** `ways(n) = ways(n-1) + ways(n-2)`, with `ways(0) = ways(1) = 1`. To stand on step `n`, your last move came from step `n-1` (a 1-step) or `n-2` (a 2-step).", "**Table trace** for `n = 5`, filled left to right:"], "table": {"headers": ["step i", "0", "1", "2", "3", "4", "5"], "rows": [["ways(i)", "1", "1", "2", "3", "5", "8"]]}},
      { code: { label: "stairs.go", src: DP_STAIRS, run: DP_STAIRS } },
      {"heading": "Problem 2: coin change", "body": ["**Recurrence:** `best(0) = 0`, and `best(x) = 1 + min(best(x - c))` over every coin `c <= x`. If nothing works, it stays \"infinity\" and the answer is -1.", "**Table trace** for coins `[1 2 5]`, amount 6:"], "table": {"headers": ["amount x", "0", "1", "2", "3", "4", "5", "6"], "rows": [["best(x)", "0", "1", "1", "2", "2", "1", "2"], ["from", "-", "0+1", "0+2", "1+2", "2+2", "0+5", "1+5"]]}},
      { code: { label: "coins.go", src: DP_COINS, run: DP_COINS } },
      {"heading": "Problem 3: longest common subsequence", "body": ["**Recurrence:** `dp[i][j]` is the LCS of the first `i` characters of `a` and the first `j` of `b`. If `a[i-1] == b[j-1]`, `dp[i][j] = dp[i-1][j-1] + 1`; otherwise `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`. Row 0 and column 0 are 0.", "**Table trace** for `a = \"abcde\"`, `b = \"ace\"`. The answer is the bottom-right cell:"], "table": {"headers": ["", "\"\"", "a", "c", "e"], "rows": [["\"\"", "0", "0", "0", "0"], ["a", "0", "1", "1", "1"], ["b", "0", "1", "1", "1"], ["c", "0", "1", "2", "2"], ["d", "0", "1", "2", "2"], ["e", "0", "1", "2", "3"]]}},
      { code: { label: "lcs.go", src: DP_LCS, run: DP_LCS } },
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**A 2-D table needs a `make` per row.** `make([][]int, n)` gives you `n` nil rows; writing to `dp[i][j]` then panics.',
          '**Pick a safe "infinity".** `1 << 30` plus one cannot overflow. `math.MaxInt + 1` wraps to a negative number and silently wins every `min`.',
          '**Use runes for strings** if the input can contain non-ASCII text. `a[i]` is a byte, and comparing bytes of a multi-byte character gives wrong answers.',
          'When only the last one or two rows matter, keep just those. Stairs needs two variables, not a slice.',
        ],
      },
    ],
    keyPoints: [
      'Recurrence first, code second.',
      'Fill from the smallest case up.',
      'One `make` per row of a 2-D slice.',
    ],
    remember: 'If plain recursion recomputes the same small cases again and again, store them. That is all DP is.',
    task: 'Solve "house robber": the most money from a row of houses when you cannot rob two next to each other. Write the recurrence before the code.',
    challenge: {"prompt":"Online-assessment style coin change. Write `Solve(r io.Reader, w io.Writer)`. The input is `T`, then `T` cases; each case is `n amount` followed by `n` coin values. For each case print the fewest coins that make `amount` (unlimited coins of each value), or `-1` if it cannot be made. Amounts go up to 10,000, so plain recursion is too slow: build the table bottom-up. Example: `\"1\\n3 11\\n1 2 5\\n\"` → `\"3\\n\"`.","starter":"package main\n\nimport (\n\t\"fmt\"\n\t\"io\"\n)\n\nfunc Solve(r io.Reader, w io.Writer) {\n\tvar t int\n\tfmt.Fscan(r, &t)\n\tfmt.Fprintln(w, -1) // your code here\n}\n","test":"package main\n\nimport (\n\t\"bytes\"\n\t\"strings\"\n\t\"testing\"\n\t\"time\"\n)\n\nfunc TestSolveCoins(t *testing.T) {\n\ttests := []struct{ in, want string }{\n\t\t{\"1\\n3 11\\n1 2 5\\n\", \"3\\n\"},\n\t\t{\"1\\n1 3\\n2\\n\", \"-1\\n\"},\n\t\t{\"1\\n2 0\\n1 2\\n\", \"0\\n\"},\n\t\t{\"2\\n3 6\\n1 3 4\\n2 7\\n2 2\\n\", \"2\\n-1\\n\"},\n\t\t{\"1\\n3 10000\\n1 2 5\\n\", \"2000\\n\"},\n\t\t{\"1\\n4 6249\\n186 419 83 408\\n\", \"20\\n\"},\n\t\t{\"0\\n\", \"\"},\n\t}\n\tfor _, tc := range tests {\n\t\tdone := make(chan string, 1)\n\t\tgo func() {\n\t\t\tvar out bytes.Buffer\n\t\t\tSolve(strings.NewReader(tc.in), &out)\n\t\t\tdone <- out.String()\n\t\t}()\n\t\tselect {\n\t\tcase got := <-done:\n\t\t\tif got != tc.want {\n\t\t\t\tt.Errorf(\"Solve(%q) = %q, want %q\", tc.in, got, tc.want)\n\t\t\t}\n\t\tcase <-time.After(3 * time.Second):\n\t\t\tt.Errorf(\"Solve(%q) = %v, want %q\", tc.in, \"timeout after 3s (use a bottom-up table)\", tc.want)\n\t\t}\n\t}\n}\n","solution":"package main\n\nimport (\n\t\"bufio\"\n\t\"fmt\"\n\t\"io\"\n)\n\nfunc Solve(r io.Reader, w io.Writer) {\n\tin := bufio.NewReader(r)\n\tout := bufio.NewWriter(w)\n\tdefer out.Flush()\n\n\tvar t int\n\tfmt.Fscan(in, &t)\n\tfor ; t > 0; t-- {\n\t\tvar n, amount int\n\t\tfmt.Fscan(in, &n, &amount)\n\t\tcoins := make([]int, n)\n\t\tfor i := range coins {\n\t\t\tfmt.Fscan(in, &coins[i])\n\t\t}\n\t\tconst inf = 1 << 30\n\t\tbest := make([]int, amount+1)\n\t\tfor x := 1; x <= amount; x++ {\n\t\t\tbest[x] = inf\n\t\t\tfor _, c := range coins {\n\t\t\t\tif c <= x && best[x-c]+1 < best[x] {\n\t\t\t\t\tbest[x] = best[x-c] + 1\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tif best[amount] >= inf {\n\t\t\tfmt.Fprintln(out, -1)\n\t\t} else {\n\t\t\tfmt.Fprintln(out, best[amount])\n\t\t}\n\t}\n}\n"},
    refs: [
      { label: 'Go spec: making slices', href: 'https://go.dev/ref/spec#Making_slices_maps_and_channels' },
    ],
  },
  {
    slug: 'dsa-number-of-islands',
    title: 'Number of islands: DFS on a grid',
    navTitle: 'Number of islands',
    oneLine: 'A grid is a graph in disguise. Find unvisited land, flood it, count one.',
    objectives: ["Write a flood fill that counts islands in a grid.", "Fix out-of-range panics by bounds-checking before indexing.", "Predict the island count for a small grid."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Given a grid of `\'1\'` (land) and `\'0\'` (water), count the islands. An island is land cells joined up, down, left or right.',
        ],
      },
      {"heading": "Brute force first", "body": ["Without marking cells: for every land cell, check whether it already belongs to an island you have found (by scanning a list of stored islands). If not, collect its whole island and store it.", "Each check scans everything found so far: **O((rows·cols)²) time, O(rows·cols) space.** Marking cells as you sink them removes that repeated search."]},
      {
        heading: 'The approach',
        body: [
          'Scan every cell. When you find land, count one island and flood-fill it: visit it, mark it, then visit its four neighbours. Marked cells are never counted again. **O(rows · cols) time**, and O(rows · cols) stack in the worst case.',
          'For a huge grid, swap the recursion for a slice queue (BFS) so you cannot run out of stack. The counting logic does not change.',
        ],
      },
      { code: { label: 'islands.go', src: ISLANDS, run: ISLANDS } },
      {"heading": "Dry run", "body": ["The grid from the program, scanning row by row:"], "table": {"headers": ["cell found", "count", "sink marks"], "rows": [["(0,0) land", "1", "(0,0) (0,1) (1,0) (1,1)"], ["(0,1) (1,0) (1,1)", "1", "already 0, skipped"], ["(2,2) land", "2", "(2,2)"], ["(3,3) land", "3", "(3,3) (3,4)"], ["end of scan", "3", "answer: 3"]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**Bounds check before you index.** `grid[r][c]` with `r = -1` panics. Put all four bound checks first in the same `if`.',
          '**Mark visited cells,** here by writing `\'0\'` into the grid. If you must not change the input, use a separate `[][]bool`. Ask which they want.',
          '**`\'1\'` is a byte (rune literal), `"1"` is a string.** Comparing a `byte` cell with `"1"` does not compile.',
          'Go stacks grow, so deep recursion rarely crashes. It is still slower than a loop for very large grids.',
        ],
      },
    ],
    keyPoints: [
      'Each cell is a node; its four neighbours are its edges.',
      'Count when you find unvisited land, then flood it.',
      'Bounds check first, then mark visited.',
    ],
    remember: 'Any "count the connected groups" question is a flood fill.',
    task: 'Return the area of the largest island instead of the count. Make `sink` return how many cells it covered.',
    challenge: {"prompt":"Online-assessment style islands. Write `Solve(r io.Reader, w io.Writer)`. The input is `T`, then `T` grids; each grid is `rows cols` followed by `rows` lines of `0` and `1` (no spaces inside a line). For each grid print how many islands of `1`s it has, where cells join only up, down, left and right (not diagonally). Example: `\"1\\n2 2\\n10\\n01\\n\"` → `\"2\\n\"`.","starter":"package main\n\nimport (\n\t\"fmt\"\n\t\"io\"\n)\n\nfunc Solve(r io.Reader, w io.Writer) {\n\tvar t int\n\tfmt.Fscan(r, &t)\n\tfmt.Fprintln(w, t) // your code here\n}\n","test":"package main\n\nimport (\n\t\"bytes\"\n\t\"fmt\"\n\t\"strings\"\n\t\"testing\"\n)\n\nfunc TestSolveIslands(t *testing.T) {\n\tvar big strings.Builder\n\tfmt.Fprintln(&big, \"1\\n200 200\")\n\tfor i := 0; i < 200; i++ {\n\t\tfmt.Fprintln(&big, strings.Repeat(\"1\", 200))\n\t}\n\ttests := []struct{ in, want string }{\n\t\t{\"1\\n1 1\\n0\\n\", \"0\\n\"},\n\t\t{\"1\\n1 1\\n1\\n\", \"1\\n\"},\n\t\t{\"1\\n2 2\\n10\\n01\\n\", \"2\\n\"},\n\t\t{\"1\\n4 5\\n11000\\n11000\\n00100\\n00011\\n\", \"3\\n\"},\n\t\t{\"2\\n3 3\\n111\\n101\\n111\\n3 3\\n101\\n010\\n101\\n\", \"1\\n5\\n\"},\n\t\t{\"1\\n2 3\\n000\\n000\\n\", \"0\\n\"},\n\t\t{big.String(), \"1\\n\"},\n\t}\n\tfor _, tc := range tests {\n\t\tvar out bytes.Buffer\n\t\tSolve(strings.NewReader(tc.in), &out)\n\t\tif got := out.String(); got != tc.want {\n\t\t\tin := tc.in\n\t\t\tif len(in) > 40 {\n\t\t\t\tin = in[:40] + \"...\"\n\t\t\t}\n\t\t\tt.Errorf(\"Solve(%q) = %q, want %q\", in, got, tc.want)\n\t\t}\n\t}\n}\n","solution":"package main\n\nimport (\n\t\"bufio\"\n\t\"fmt\"\n\t\"io\"\n)\n\nfunc Solve(r io.Reader, w io.Writer) {\n\tin := bufio.NewReader(r)\n\tout := bufio.NewWriter(w)\n\tdefer out.Flush()\n\n\tvar t int\n\tfmt.Fscan(in, &t)\n\tfor ; t > 0; t-- {\n\t\tvar rows, cols int\n\t\tfmt.Fscan(in, &rows, &cols)\n\t\tgrid := make([][]byte, rows)\n\t\tfor i := range grid {\n\t\t\tvar line string\n\t\t\tfmt.Fscan(in, &line)\n\t\t\tgrid[i] = []byte(line)\n\t\t}\n\t\tvar sink func(i, j int)\n\t\tsink = func(i, j int) {\n\t\t\tif i < 0 || j < 0 || i >= rows || j >= cols || grid[i][j] != '1' {\n\t\t\t\treturn\n\t\t\t}\n\t\t\tgrid[i][j] = '0'\n\t\t\tsink(i+1, j)\n\t\t\tsink(i-1, j)\n\t\t\tsink(i, j+1)\n\t\t\tsink(i, j-1)\n\t\t}\n\t\tcount := 0\n\t\tfor i := range grid {\n\t\t\tfor j := range grid[i] {\n\t\t\t\tif grid[i][j] == '1' {\n\t\t\t\t\tcount++\n\t\t\t\t\tsink(i, j)\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tfmt.Fprintln(out, count)\n\t}\n}\n"},
    refs: [
      { label: 'Go spec: rune literals', href: 'https://go.dev/ref/spec#Rune_literals' },
    ],
  },
  {
    slug: 'dsa-merge-intervals',
    title: 'Merge overlapping intervals',
    navTitle: 'Merge intervals',
    oneLine: 'Sort by start, then one pass. The sort does the hard part.',
    objectives: ["Write interval merging with one sort and one pass.", "Explain why updating a copy of the last interval does nothing.", "Predict the merged output for a small input."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Given intervals like `[1,3] [2,6] [8,10]`, merge the ones that overlap: `[1,6] [8,10]`.',
        ],
      },
      {"heading": "Brute force first", "body": ["Without sorting: keep comparing every pair of intervals. When two overlap, replace them with their union and start the scan again. Stop when a full pass merges nothing.", "Each pass is O(n²) pairs and you may need n passes: **O(n³) time** worst case, O(n) space. Sorting turns it into one pass."]},
      {
        heading: 'The approach',
        body: [
          'Sort by start time. Now an interval either overlaps the last merged one (its start is not after that end), so you extend it, or it starts a new merged interval. **O(n log n) time** for the sort, O(n) for the output.',
        ],
      },
      { code: { label: 'intervals.go', src: INTERVALS, run: INTERVALS } },
      {"heading": "Dry run", "body": ["`[1,3] [2,6] [8,10] [15,18]`, already sorted by start:"], "table": {"headers": ["interval", "last in out", "overlap?", "out after"], "rows": [["[1,3]", "(none)", "-", "[1,3]"], ["[2,6]", "[1,3]", "2 <= 3, yes, end = max(3,6)", "[1,6]"], ["[8,10]", "[1,6]", "8 > 6, no", "[1,6] [8,10]"], ["[15,18]", "[8,10]", "15 > 10, no", "[1,6] [8,10] [15,18]"]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**`sort.Slice` sorts in place.** Copy first if the caller\'s slice must not change. `slices.SortFunc` with `cmp.Compare` is the newer way and also fine.',
          '**Take a pointer to the last element** (`&out[len(out)-1]`) to update it. `last := out[len(out)-1]` is a copy, so changing it does nothing.',
          '**`[2]int` is an array, a value type.** It is copied on assignment, which is exactly why the pointer above is needed.',
          'Decide whether touching intervals (`[1,4]` and `[4,5]`) merge. Here they do, because of `<=`. Ask.',
        ],
      },
    ],
    keyPoints: [
      'Sort by start, then one pass.',
      'Extend the last interval or start a new one.',
      'Update through a pointer or index, not a copy.',
    ],
    remember: 'Most interval problems become easy once they are sorted by start.',
    task: 'Insert a new interval into an already sorted, non-overlapping list and merge as needed, in O(n) without sorting again.',
    challenge: {"prompt": "Write `merge(in [][2]int) [][2]int` that merges overlapping intervals (touching ones like `[1,4] [4,5]` merge too) and returns them sorted by start. Example: `[1,3] [8,10] [2,6]` → `[1,6] [8,10]`.", "starter": "package main\n\nfunc merge(in [][2]int) [][2]int {\n\t// your code here\n\treturn nil\n}\n", "test": "package main\n\nimport (\n\t\"slices\"\n\t\"testing\"\n)\n\nfunc TestMerge(t *testing.T) {\n\ttests := []struct {\n\t\tin, want [][2]int\n\t}{\n\t\t{[][2]int{{1, 3}, {8, 10}, {2, 6}}, [][2]int{{1, 6}, {8, 10}}},\n\t\t{[][2]int{{1, 4}, {4, 5}}, [][2]int{{1, 5}}},\n\t\t{[][2]int{{1, 4}, {2, 3}}, [][2]int{{1, 4}}},\n\t\t{[][2]int{{5, 6}}, [][2]int{{5, 6}}},\n\t\t{nil, nil},\n\t}\n\tfor _, tc := range tests {\n\t\tif got := merge(slices.Clone(tc.in)); !slices.Equal(got, tc.want) {\n\t\t\tt.Errorf(\"merge(%v) = %v, want %v\", tc.in, got, tc.want)\n\t\t}\n\t}\n}\n", "solution": "package main\n\nimport \"sort\"\n\nfunc merge(in [][2]int) [][2]int {\n\tsort.Slice(in, func(i, j int) bool { return in[i][0] < in[j][0] })\n\tvar out [][2]int\n\tfor _, iv := range in {\n\t\tif len(out) > 0 && iv[0] <= out[len(out)-1][1] {\n\t\t\tlast := &out[len(out)-1]\n\t\t\tlast[1] = max(last[1], iv[1])\n\t\t\tcontinue\n\t\t}\n\t\tout = append(out, iv)\n\t}\n\treturn out\n}\n"},
    refs: [
      { label: 'sort.Slice', href: 'https://pkg.go.dev/sort#Slice' },
      { label: 'slices.SortFunc', href: 'https://pkg.go.dev/slices#SortFunc' },
    ],
  },
  {
    slug: 'dsa-sliding-window',
    title: 'Longest substring without repeating characters',
    navTitle: 'Sliding window',
    oneLine: 'A window with two edges and a map of where each character was last seen. Rune-aware, so it counts characters, not bytes.',
    objectives: ["Write a rune-aware sliding window for the longest unique substring.", "Explain why the j >= start check is needed.", "Predict start and best at each step for a small string."],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'Given a string, return the length of the longest substring with no repeated character. `"abcabcbb"` gives 3 (`"abc"`).',
        ],
      },
      {"heading": "Brute force first", "body": ["Try every start `i`. Extend `j` to the right with a fresh `map[rune]bool`, and stop at the first repeat. Track the longest.", "**O(n²) time** (O(n³) if you recheck each substring from scratch), O(k) space. The window never throws away work it has already done."]},
      {
        heading: 'The approach',
        body: [
          'Keep a window `[start, i]` with no repeats. Move `i` forward one character at a time. If that character was last seen inside the window, move `start` just past it. The window only ever moves right, so this is **O(n) time**, and O(k) space for `k` distinct characters.',
        ],
      },
      { code: { label: 'window.go', src: WINDOW, run: WINDOW } },
      {"heading": "Dry run", "body": ["`\"abcabcbb\"`, window `[start, i]`:"], "table": {"headers": ["i", "char", "last seen", "start", "window", "best"], "rows": [["0", "a", "-", "0", "a", "1"], ["1", "b", "-", "0", "ab", "2"], ["2", "c", "-", "0", "abc", "3"], ["3", "a", "0 (in window)", "1", "bca", "3"], ["4", "b", "1 (in window)", "2", "cab", "3"], ["5", "c", "2 (in window)", "3", "abc", "3"], ["6", "b", "4 (in window)", "5", "cb", "3"], ["7", "b", "6 (in window)", "7", "b", "3"]]}},
      {
        heading: 'Go-specific gotchas',
        bullets: [
          '**`range` over a string gives byte offsets.** `for i, r := range s` jumps `i` by 2 for `é`. Here we range over `[]rune(s)` so `i` counts characters, which makes `i-start+1` a length in characters.',
          '**Check `j >= start`,** not just that the rune was seen. A copy from before the window must not move `start` backwards.',
          '**Comma-ok again.** Index 0 is a real position, so `last[r] == 0` cannot mean "not seen".',
          'For ASCII-only input, a `[128]int` array is faster than a map. Say it as an optimisation, after it works.',
        ],
      },
    ],
    keyPoints: [
      'Two edges; the right one always moves, the left one only jumps forward.',
      'Map from character to last index.',
      'Ranging over a string gives byte offsets; convert to `[]rune` when you need character positions.',
    ],
    remember: 'If the question says "longest/shortest contiguous ... such that", think sliding window.',
    task: 'Find the length of the longest substring with at most two distinct characters. Shrink the window from the left when a third one arrives.',
    challenge: {"prompt": "Write `longestUnique(s string) int` that returns the length, in characters, of the longest substring with no repeated character. Example: `\"abcabcbb\"` → 3, `\"héllo\"` → 3.", "starter": "package main\n\nfunc longestUnique(s string) int {\n\t// your code here\n\treturn 0\n}\n", "test": "package main\n\nimport \"testing\"\n\nfunc TestLongestUnique(t *testing.T) {\n\ttests := []struct {\n\t\tin   string\n\t\twant int\n\t}{\n\t\t{\"abcabcbb\", 3},\n\t\t{\"bbbbb\", 1},\n\t\t{\"pwwkew\", 3},\n\t\t{\"abba\", 2},\n\t\t{\"héllo\", 3},\n\t\t{\"\", 0},\n\t}\n\tfor _, tc := range tests {\n\t\tif got := longestUnique(tc.in); got != tc.want {\n\t\t\tt.Errorf(\"longestUnique(%q) = %v, want %v\", tc.in, got, tc.want)\n\t\t}\n\t}\n}\n", "solution": "package main\n\nfunc longestUnique(s string) int {\n\tlast := map[rune]int{}\n\tstart, best := 0, 0\n\tfor i, r := range []rune(s) {\n\t\tif j, ok := last[r]; ok && j >= start {\n\t\t\tstart = j + 1\n\t\t}\n\t\tlast[r] = i\n\t\tbest = max(best, i-start+1)\n\t}\n\treturn best\n}\n"},
    refs: [
      { label: 'Go blog: strings, bytes, runes and characters', href: 'https://go.dev/blog/strings' },
    ],
  },
]
