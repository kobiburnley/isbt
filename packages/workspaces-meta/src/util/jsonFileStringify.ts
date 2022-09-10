export async function jsonFileStringify(value: any) {
  try {
    const { format } = await import('prettier')
    return format(value)
  } catch {
    return JSON.stringify(value, null, 2)
  }
}
