import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: confession, error } = await supabase
      .from('confessions')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !confession) {
      return NextResponse.json(
        { error: 'Confession not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      confession: {
        id: confession.id,
        text: confession.text,
        category: confession.category,
        author_address: confession.author_address,
        total_tips: parseFloat(confession.total_tips || '0'),
        tip_count: confession.tip_count || 0,
        created_at: confession.created_at,
        updated_at: confession.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching confession:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
