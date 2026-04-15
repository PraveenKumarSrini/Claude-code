// Tests for utils.js — written against CURRENT behavior (quirks included).
// Do NOT change these tests to match a refactored version without first
// verifying the refactored code produces the same outputs.

var utils = require('../utils')

// ---------------------------------------------------------------------------
// countWords
// ---------------------------------------------------------------------------

describe('countWords', () => {
  test('counts simple words', () => {
    var result = utils.countWords('hello world hello')
    expect(result).toEqual({ hello: 2, world: 1 })
  })

  test('is case-insensitive — lowercases all input', () => {
    var result = utils.countWords('Hello HELLO hello')
    expect(result).toEqual({ hello: 3 })
  })

  test('strips punctuation', () => {
    var result = utils.countWords('hello, world! hello.')
    expect(result).toEqual({ hello: 2, world: 1 })
  })

  test('handles multiple spaces and newlines between words', () => {
    var result = utils.countWords('foo   bar\nbaz')
    expect(result).toEqual({ foo: 1, bar: 1, baz: 1 })
  })

  test('returns empty object for empty string', () => {
    var result = utils.countWords('')
    expect(result).toEqual({})
  })

  test('returns empty object for whitespace-only string', () => {
    var result = utils.countWords('   \n\t  ')
    expect(result).toEqual({})
  })

  // QUIRK: numbers are NOT stripped — [^a-z0-9\s] keeps digits
  test('quirk — keeps numbers as words', () => {
    var result = utils.countWords('test 42 test 42 100')
    expect(result).toEqual({ test: 2, '42': 2, '100': 1 })
  })

  // QUIRK: mixed alphanumeric tokens survive as a single "word"
  test('quirk — alphanumeric tokens count as one word', () => {
    var result = utils.countWords('node12 node12')
    expect(result).toEqual({ node12: 2 })
  })

  test('handles a single word', () => {
    var result = utils.countWords('only')
    expect(result).toEqual({ only: 1 })
  })

  test('strips hyphens (they are non-alphanumeric)', () => {
    // "well-known" becomes "wellknown" after strip? No —
    // the regex removes the hyphen leaving "well" + "known" joined? Let's
    // trace: replace removes '-', giving "well known", then split gives ["well","known"]
    var result = utils.countWords('well-known')
    expect(result).toEqual({ wellknown: 1 })
  })
})

// ---------------------------------------------------------------------------
// sortByCount
// ---------------------------------------------------------------------------

describe('sortByCount', () => {
  test('sorts descending by count', () => {
    var result = utils.sortByCount({ apple: 3, banana: 1, cherry: 2 })
    expect(result).toEqual([['apple', 3], ['cherry', 2], ['banana', 1]])
  })

  test('returns empty array for empty object', () => {
    var result = utils.sortByCount({})
    expect(result).toEqual([])
  })

  test('single entry is returned as single-element array', () => {
    var result = utils.sortByCount({ only: 5 })
    expect(result).toEqual([['only', 5]])
  })

  test('returns array of [word, count] pairs', () => {
    var result = utils.sortByCount({ a: 1 })
    expect(Array.isArray(result)).toBe(true)
    expect(Array.isArray(result[0])).toBe(true)
    expect(result[0].length).toBe(2)
  })

  test('words with the same count preserve some order (stable sort not guaranteed, just both present)', () => {
    var result = utils.sortByCount({ a: 2, b: 2 })
    expect(result.length).toBe(2)
    expect(result.map(e => e[1])).toEqual([2, 2])
    // both words must be present
    var words = result.map(e => e[0])
    expect(words).toContain('a')
    expect(words).toContain('b')
  })

  test('does not mutate the input object', () => {
    var input = { x: 3, y: 1 }
    utils.sortByCount(input)
    expect(input).toEqual({ x: 3, y: 1 })
  })
})

// ---------------------------------------------------------------------------
// formatResults
// ---------------------------------------------------------------------------

describe('formatResults', () => {
  var top3 = [['the', 10], ['a', 8], ['is', 5]]

  test('formats each entry as "N. word (count)\\n"', () => {
    var result = utils.formatResults(top3, 3)
    expect(result).toBe('1. the (10)\n2. a (8)\n3. is (5)\n')
  })

  test('respects the limit parameter', () => {
    var result = utils.formatResults(top3, 2)
    expect(result).toBe('1. the (10)\n2. a (8)\n')
  })

  test('limit larger than array length returns all entries', () => {
    var result = utils.formatResults(top3, 100)
    expect(result).toBe('1. the (10)\n2. a (8)\n3. is (5)\n')
  })

  // QUIRK: limit=0 is falsy, so `limit || 10` treats it as 10 — NOT an empty result
  test('quirk — limit of 0 is falsy and falls back to 10, returning all 3 entries', () => {
    var result = utils.formatResults(top3, 0)
    expect(result).toBe('1. the (10)\n2. a (8)\n3. is (5)\n')
  })

  test('empty array returns empty string regardless of limit', () => {
    var result = utils.formatResults([], 10)
    expect(result).toBe('')
  })

  test('single entry is formatted correctly', () => {
    var result = utils.formatResults([['hello', 7]], 10)
    expect(result).toBe('1. hello (7)\n')
  })

  // QUIRK: limit=undefined/falsy falls back to 10 inside formatResults
  test('quirk — falsy limit defaults to 10 internally', () => {
    var many = Array.from({ length: 15 }, (_, i) => ['word' + i, 15 - i])
    var result = utils.formatResults(many, undefined)
    var lines = result.trim().split('\n')
    expect(lines.length).toBe(10)
  })
})
