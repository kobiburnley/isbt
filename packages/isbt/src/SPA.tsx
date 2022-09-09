import React from 'react'

export function SPA({ src }: { src: string }) {
  return (
    <html>
      <head title="SPA" />
      <body>
        <div id="root" />
        <script src={src} />
      </body>
    </html>
  )
}
