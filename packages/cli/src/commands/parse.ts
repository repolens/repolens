import { Command } from 'commander'
import fs from 'fs/promises'
import path from 'path'

export function createParseCommand() {
  const command = new Command('parse')
    .description('Parse a single file with specified parser')
    .argument('<file>', 'File path to parse')
    .option('-p, --parser <type>', 'Parser type to use', 'default')
    .option('-o, --output <path>', 'Output file path')
    .action(async (file, options) => {
      try {
        const filePath = path.resolve(process.cwd(), file)
        const content = await fs.readFile(filePath, 'utf-8')

        let parsedContent
        switch (options.parser) {
          case 'json':
            parsedContent = JSON.stringify(JSON.parse(content), null, 2)
            break
          // Add more parser cases here
          default:
            parsedContent = content
        }

        if (options.output) {
          const outputPath = path.resolve(process.cwd(), options.output)
          await fs.writeFile(outputPath, parsedContent)
          console.log(`Successfully parsed and wrote to ${outputPath}`)
        } else {
          console.log(parsedContent)
        }
      } catch (error) {
        console.error('Error:', (error as Error).message)
        process.exit(1)
      }
    })

  return command
}
