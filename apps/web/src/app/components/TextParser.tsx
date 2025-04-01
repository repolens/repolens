'use client'

import { useState } from 'react'
import type { RepoLensChunk } from '@repolens/types/repolens'
import { isDefaultChunk, isTypeScriptChunk } from '@repolens/types/parser'

export function TextParser() {
  const [input, setInput] = useState('')
  const [parser, setParser] = useState('default')
  const [output, setOutput] = useState<RepoLensChunk[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleParse = () => {
    setIsLoading(true)

    fetch('/api/parse', {
      method: 'POST',
      body: JSON.stringify({
        content: input,
        extension: parser,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setOutput(data)
      })
      .catch((error) => {
        console.error('Error parsing text:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="parser" className="block text-sm font-medium mb-1">
              Select Parser
            </label>
            <select
              id="parser"
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
              defaultValue="default"
              onChange={(e) => setParser(e.target.value)}
            >
              <option value="default">Default Parser</option>
              <option value="ts">TypeScript Parser</option>
            </select>
          </div>

          <div>
            <label htmlFor="input" className="block text-sm font-medium mb-1">
              Input Text
            </label>
            <textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-[400px] p-4 border rounded-md font-mono text-sm bg-white dark:bg-gray-800"
              placeholder="Paste your text here..."
            />
          </div>

          <button
            onClick={handleParse}
            disabled={isLoading || !input.trim()}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Parsing...' : 'Parse Text'}
          </button>
        </div>

        <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
          <h2 className="text-lg font-medium mb-4">Parsed Output</h2>
          <div className="space-y-4">
            {output.length === 0 ? (
              <div className="p-4 border rounded bg-white dark:bg-gray-800">
                <p className="text-sm font-mono">
                  Parsed chunks will appear here...
                </p>
              </div>
            ) : (
              output.map((chunk, index) => {
                if (isTypeScriptChunk(chunk.metadata)) {
                  return (
                    <div
                      key={index}
                      className="p-4 border rounded bg-white dark:bg-gray-800"
                    >
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-500">
                          {chunk.metadata.type} - {chunk.metadata.name}
                        </span>
                      </div>
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {chunk.content}
                      </pre>
                    </div>
                  )
                }

                if (isDefaultChunk(chunk.metadata)) {
                  return (
                    <div
                      key={index}
                      className="p-4 border rounded bg-white dark:bg-gray-800"
                    >
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {chunk.content}
                      </pre>
                    </div>
                  )
                }

                return null
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
