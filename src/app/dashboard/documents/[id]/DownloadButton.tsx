'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface DownloadButtonProps {
  documentId: string
}

export default function DownloadButton({ documentId }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(`/api/document-preview/${documentId}?download=true`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const contentDisposition = res.headers.get('Content-Disposition') ?? ''
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
      const filename = filenameMatch?.[1] ?? `document-${documentId}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 38, padding: '0 16px', borderRadius: 10,
        background: 'var(--navy)', color: 'white',
        border: 'none', fontSize: 14, fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {loading ? 'Downloading…' : 'Download'}
    </button>
  )
}
