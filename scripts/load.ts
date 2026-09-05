/**
 * Loading service entries.
 *
 * Kept separate from the validator so other scripts can import it without
 * triggering a validation run.
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Service } from './types.js'

export const DATA_DIR = 'data/services'

export async function listEntryFiles(dir = DATA_DIR): Promise<string[]> {
  const files = await readdir(dir)
  return files.filter((f) => f.endsWith('.json')).sort()
}

export async function loadServices(dir = DATA_DIR): Promise<Service[]> {
  const files = await listEntryFiles(dir)

  const services: Service[] = []
  for (const file of files) {
    const text = await readFile(join(dir, file), 'utf-8')
    services.push(JSON.parse(text) as Service)
  }

  return services
}
