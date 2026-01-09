// Test Supabase import to verify Metro bundling works
import { supabase } from './lib/supabase';

console.log('Supabase client imported successfully:', !!supabase);

// Test basic Supabase functionality
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test auth functionality
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase auth error:', error);
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}

export default testSupabaseConnection;
