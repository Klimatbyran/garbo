export const cleanCollectionName = (name: string) =>
  name
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-63)
