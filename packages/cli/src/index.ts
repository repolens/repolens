import { Command } from 'commander'
import { runGithubLens } from './commands/githubLens.js'
import { parseFile } from './commands/parseFile.js'

const program = new Command()

program
  .name('codelens')
  .description('CLI tools for code analysis and parsing')
  .version('0.1.0')

program
  .command('lens')
  .description('Run GithubLens and get code chunks')
  .option('-o, --output <file>', 'Output JSON file path')
  .action(async (options) => {
    const chunks = await runGithubLens()

    // Summary information
    console.log(`\nTotal chunks: ${chunks.length}`)

    // Output to JSON file if specified
    if (options.output) {
      const fs = await import('node:fs/promises')
      try {
        await fs.writeFile(
          options.output,
          JSON.stringify(chunks, null, 2),
          'utf8'
        )
        console.log(`\nComplete data written to ${options.output}`)
      } catch (error: any) {
        console.error(`Error writing to file: ${error.message}`)
      }
    }
  })

program
  .command('parse')
  .description('Parse a file with specified parser')
  .argument('<file>', 'File to parse')
  .option('-p, --parser <type>', 'Parser to use')
  .option('-o, --output <file>', 'Output file name')
  .action(parseFile)

program.parse()
