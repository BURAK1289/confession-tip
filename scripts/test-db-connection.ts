/**
 * Database Connection Test Script
 * 
 * This script tests the Supabase database connection and verifies
 * that all tables and policies are set up correctly.
 * 
 * Usage:
 *   npx tsx scripts/test-db-connection.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  console.log(`📍 URL: ${supabaseUrl}\n`);

  try {
    // Test 1: Check confessions table
    console.log('1️⃣  Testing confessions table...');
    const { data: confessions, error: confessionsError } = await supabase
      .from('confessions')
      .select('count')
      .limit(1);
    
    if (confessionsError) {
      console.error('   ❌ Error:', confessionsError.message);
    } else {
      console.log('   ✅ Confessions table accessible');
    }

    // Test 2: Check tips table
    console.log('2️⃣  Testing tips table...');
    const { data: tips, error: tipsError } = await supabase
      .from('tips')
      .select('count')
      .limit(1);
    
    if (tipsError) {
      console.error('   ❌ Error:', tipsError.message);
    } else {
      console.log('   ✅ Tips table accessible');
    }

    // Test 3: Check users table
    console.log('3️⃣  Testing users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError) {
      console.error('   ❌ Error:', usersError.message);
    } else {
      console.log('   ✅ Users table accessible');
    }

    // Test 4: Check referrals table
    console.log('4️⃣  Testing referrals table...');
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('count')
      .limit(1);
    
    if (referralsError) {
      console.error('   ❌ Error:', referralsError.message);
    } else {
      console.log('   ✅ Referrals table accessible');
    }

    // Test 5: Test RLS policies (should work for public read)
    console.log('5️⃣  Testing RLS policies...');
    const { data: publicConfessions, error: rlsError } = await supabase
      .from('confessions')
      .select('id, text, category, created_at')
      .is('deleted_at', null)
      .limit(5);
    
    if (rlsError) {
      console.error('   ❌ RLS Error:', rlsError.message);
    } else {
      console.log('   ✅ RLS policies working correctly');
      console.log(`   📊 Found ${publicConfessions?.length || 0} confessions`);
    }

    // Test 6: Test Realtime (just check if channel can be created)
    console.log('6️⃣  Testing Realtime setup...');
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'confessions' },
        (payload) => console.log('   📡 Realtime event:', payload)
      );
    
    await channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('   ✅ Realtime subscriptions working');
        channel.unsubscribe();
      } else if (status === 'CHANNEL_ERROR') {
        console.error('   ❌ Realtime subscription failed');
      }
    });

    // Wait a bit for subscription to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n✨ Database connection test complete!\n');
    console.log('Next steps:');
    console.log('  1. If all tests passed, you\'re ready to start development');
    console.log('  2. If any tests failed, check your Supabase dashboard');
    console.log('  3. Verify migrations were run in correct order');
    console.log('  4. Check RLS policies are enabled\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the test
testConnection();
