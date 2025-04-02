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
  .action(async () => {
    const chunks = await runGithubLens()
    console.table(chunks)
  })

program
  .command('parse')
  .description('Parse a file with specified parser')
  .argument('<file>', 'File to parse')
  .option('-p, --parser <type>', 'Parser to use')
  .option('-o, --output <file>', 'Output file name')
  .action(parseFile)

program.parse()
