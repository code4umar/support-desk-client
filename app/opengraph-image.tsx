import { ImageResponse } from 'next/og';

// Preview picture shown when the Deskly link is shared (WhatsApp, LinkedIn, Slack...).
export const alt = 'Deskly: every request, resolved';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 90px',
          background: 'linear-gradient(135deg, #10245a 0%, #0a1433 55%, #060b1f 100%)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="170" height="119" viewBox="0 0 661 462">
            <path fill="#f1f5fb" d="M294,92 L49,138 L6,242 L157,444 L201,358 L103,223 L269,181Z M508,18 L462,103 L560,237 L392,281 L368,369 L614,323 L655,216Z" />
            <path fill="#2ee6d6" d="M456,6 L376,11 L207,456 L291,447Z" />
          </svg>
          <div style={{ display: 'flex', fontSize: 110, fontWeight: 800, marginLeft: 40 }}>
            <span>Desk</span><span style={{ color: '#2ee6d6', marginLeft: -8 }}>ly</span>
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 42, marginTop: 30, color: '#9fb0c8' }}>
          Every request, resolved.
        </div>
      </div>
    ),
    { ...size },
  );
}
