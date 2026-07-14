import React, { useEffect, useState } from 'react'
// @ts-ignore
import QRCode from 'qrcode'

interface QRCodeProps {
  text: string
  size?: number
}

/**
 * React Component to render standard, scannable QR Code as SVG using React.createElement
 * to keep the file format as standard .ts instead of requiring .tsx compilation overrides.
 */
export function QRCodeSVG({ text, size = 256 }: QRCodeProps) {
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((svgString: string) => {
        setSvg(svgString)
      })
      .catch((err: any) => {
        console.error('Error generating QR code:', err)
      })
  }, [text, size])

  if (!svg) {
    return React.createElement('div', {
      style: {
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-sm)'
      }
    })
  }

  return React.createElement('div', {
    style: {
      width: `${size}px`,
      height: `${size}px`
    },
    dangerouslySetInnerHTML: { __html: svg }
  })
}
