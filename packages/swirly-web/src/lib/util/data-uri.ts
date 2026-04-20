export const buildDataUri = (
  contentType: string,
  charset: string,
  data: string
) => {
  const bytes = new TextEncoder().encode(data)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return `data:${contentType};charset=${charset};base64,${btoa(binary)}`
}
