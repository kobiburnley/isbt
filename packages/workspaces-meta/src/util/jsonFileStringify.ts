export async function jsonFileStringify(value: any) {
  const text = JSON.stringify(value, null, 2)

  try {
    const { format } = await import('prettier')
    return format(text, {
      parser: 'json',
    })
  } catch {
    return text
  }
}
