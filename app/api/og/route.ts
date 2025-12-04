import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const confessionId = searchParams.get('id');

  if (!confessionId) {
    return NextResponse.json(
      { error: 'Confession ID required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerClient();
    
    const { data: confession, error } = await supabase
      .from('confessions')
      .select('*')
      .eq('id', confessionId)
      .single();

    if (error || !confession) {
      return NextResponse.json(
        { error: 'Confession not found' },
        { status: 404 }
      );
    }

    // Truncate text for OG description
    const truncatedText = confession.text.length > 200
      ? confession.text.slice(0, 200) + '...'
      : confession.text;

    const metadata = {
      title: `Anonymous Confession - ${confession.category}`,
      description: truncatedText,
      image: `${process.env.NEXT_PUBLIC_URL || request.nextUrl.origin}/hero.png`,
      url: `${process.env.NEXT_PUBLIC_URL || request.nextUrl.origin}?confession=${confessionId}`,
      category: confession.category,
      tips: confession.total_tips,
      tipCount: confession.tip_count,
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('OG metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to generate metadata' },
      { status: 500 }
    );
  }
}
