export interface PhotoValidationResult {
  valid: boolean
  issues: string[]
  warnings: string[]
  dimensions: { width: number; height: number }
  fileSizeKb: number
}

export const validatePhoto = async (file: File): Promise<PhotoValidationResult> => {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const issues: string[] = []
      const warnings: string[] = []

      const ratio = img.width / img.height
      if (ratio < 0.95 || ratio > 1.05) {
        issues.push(`Photo must be square (equal width and height). Yours is ${img.width}x${img.height}px.`)
      }

      if (img.width < 200 || img.height < 200) {
        issues.push(`Photo too small. Minimum 200x200px. Yours is ${img.width}x${img.height}px.`)
      }

      if (img.width > 900 || img.height > 900) {
        warnings.push(`Photo is large (${img.width}x${img.height}px). Recommended maximum is 900x900px.`)
      }

      const fileSizeKb = Math.round(file.size / 1024)
      if (fileSizeKb > 200) {
        issues.push(`File size ${fileSizeKb}kb exceeds 200kb maximum. Please compress the photo.`)
      }

      if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
        issues.push(`Photo must be JPEG format. Current format: ${file.type}`)
      }

      URL.revokeObjectURL(url)
      resolve({
        valid: issues.length === 0,
        issues,
        warnings,
        dimensions: { width: img.width, height: img.height },
        fileSizeKb,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({
        valid: false,
        issues: ['Could not read image file. Please try a different file.'],
        warnings: [],
        dimensions: { width: 0, height: 0 },
        fileSizeKb: 0,
      })
    }

    img.src = url
  })
}
