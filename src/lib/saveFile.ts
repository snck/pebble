/**
 * Saves a file for the user. On touch devices that can share files this opens
 * the share sheet (Save to Files, Drive, AirDrop…), which is how phones keep
 * files; elsewhere it downloads.
 */
export async function saveFile(file: File): Promise<void> {
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name })
      return
    } catch (e) {
      // Closing the share sheet isn't an error; anything else falls back to a download.
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
