// analyzer.js — analyzes text files for word frequency

const utils = require('./utils')

async function analyzeFile(filepath) {
  const content = await utils.readFileContent(filepath)
  const words = utils.countWords(content)
  const sorted = utils.sortByCount(words)

  let totalWords = 0
  for (const word in words) {
    totalWords += words[word]
  }

  return {
    totalWords,
    uniqueWords: Object.keys(words).length,
    topWords: sorted.slice(0, 10),
    filepath
  }
}

async function analyzeMultiple(filepaths) {
  if (filepaths.length === 0) return []
  return Promise.all(filepaths.map(fp => analyzeFile(fp)))
}

module.exports = {
  analyzeFile,
  analyzeMultiple
}
