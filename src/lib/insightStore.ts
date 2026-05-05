import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
// For edge/serverless functions, we want to ensure we use the service role key to bypass RLS if needed,
// but the frontend (which imports this file) might only have NEXT_PUBLIC_SUPABASE_URL.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

class InsightStore {
  // Upload a video clip to Supabase Storage
  async uploadVideo(conversationId: string, videoUrl: string): Promise<string | null> {
    if (!supabase) return videoUrl; // fallback to original if supabase not ready

    try {
      const videoRes = await fetch(videoUrl);
      const videoArrayBuffer = await videoRes.arrayBuffer();
      const fileName = `${conversationId}.mp4`;
      
      const { error: uploadError } = await supabase.storage
        .from('video-clips')
        .upload(fileName, videoArrayBuffer, {
          contentType: 'video/mp4',
          upsert: true
        });
        
      if (!uploadError) {
        const { data } = supabase.storage.from('video-clips').getPublicUrl(fileName);
        return data.publicUrl;
      } else {
        console.error('Supabase storage upload error:', uploadError);
        return videoUrl;
      }
    } catch (err) {
      console.error('Failed to upload video to Supabase:', err);
      return videoUrl;
    }
  }

  // Add a new insight to the Supabase table
  async addInsight(conversationId: string, insight: any) {
    if (!supabase) {
      console.warn("Supabase client not initialized. Dropping insight:", insight);
      return;
    }

    try {
      const { error } = await supabase
        .from('insights')
        .insert([
          { 
            conversation_id: conversationId, 
            type: insight.type || 'unknown',
            data: insight 
          }
        ]);

      if (error) {
        console.error('Error inserting insight into Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to add insight:', err);
    }
  }

  // Get all insights for a specific conversation
  async getInsights(conversationId: string) {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('insights')
        .select('data')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching insights from Supabase:', error);
        return [];
      }

      return data ? data.map((row) => row.data) : [];
    } catch (err) {
      console.error('Failed to get insights:', err);
      return [];
    }
  }

  // Helper method for setting metadata (which just adds a special insight type)
  async setMetadata(conversationId: string, key: string, value: any) {
    await this.addInsight(conversationId, { type: 'metadata', key, value });
  }

  // Get a specific metadata value
  async getMetadata(conversationId: string, key: string) {
    const insights = await this.getInsights(conversationId);
    const meta = insights.find((i: any) => i.type === 'metadata' && i.key === key);
    return meta ? meta.value : null;
  }
}

export const insightStore = new InsightStore();
