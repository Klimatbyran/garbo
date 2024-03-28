export const cleanCollectionName = (name: string) =>
  name
    .slice(-63)
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '_')
