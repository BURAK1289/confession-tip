import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const alt = 'Confession';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch confession
  const { data: confession } = await supabase
    .from('confessions')
    .select('text, category')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  const text = confession?.text || 'Anonymous Confession';
  const category = confession?.category || 'random';
  const truncatedText = text.length > 200 ? text.slice(0, 200) + '...' : text;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            padding: '60px',
            maxWidth: '900px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#667eea',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            {category}
          </div>
          <div
            style={{
              fontSize: '42px',
              lineHeight: '1.4',
              color: '#1a1a1a',
              fontWeight: '500',
            }}
          >
            {truncatedText}
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#666',
              marginTop: '20px',
            }}
          >
            🤫 Confession Tip - Share anonymously
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
