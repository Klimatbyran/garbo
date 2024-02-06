export const cleanCollectionName = (name: string) => {
  return name
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(-63)
    .replace(/^_+|_+$/g, '')
}
