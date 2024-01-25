export const cleanCollectionName = (name: string) =>
  name.replace(/[^a-zA-Z0-9]/g, '_').slice(-63)
