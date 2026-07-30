import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create two clients: one for the browser (respects RLS) and one for the server (bypasses RLS)
export const supabaseClient: SupabaseClient | null = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
export const supabaseAdmin: SupabaseClient | null = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Use the appropriate client based on context
export const getSupabase = (): SupabaseClient | null => {
  if (typeof window === 'undefined' && supabaseAdmin) {
    return supabaseAdmin;
  }
  return supabaseClient;
};

export interface SessionInsight {
  type: string;
  role?: string;
  text?: string;
  category?: string;
  signalType?: string;
  reason?: string;
  timestamp?: string;
  imageFrame?: string;
  analysis?: Record<string, unknown>;
  recordingUrl?: string | null;
  key?: string;
  value?: unknown;
  configHash?: string;
  personaId?: string;
}

class InsightStore {
  // Upload a video clip to Supabase Storage using zero-byte RAM buffer stream transfer
  async uploadVideo(conversationId: string, videoUrl: string): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return videoUrl;

    try {
      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) {
        console.error(`Failed to fetch source video from ${videoUrl}: HTTP ${videoRes.status}`);
        return videoUrl;
      }

      const contentType = videoRes.headers.get('content-type') || 'video/mp4';
      const videoBlob = await videoRes.blob();
      const fileName = `${conversationId}.mp4`;
      
      const { error: uploadError } = await supabase.storage
        .from('video-clips')
        .upload(fileName, videoBlob, {
          contentType,
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
  async addInsight(conversationId: string, insight: SessionInsight): Promise<void> {
    const supabase = getSupabase();
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

  // Add multiple insights to Supabase in a single bulk INSERT operation (L11 Bulk API Principle)
  async addInsightsMany(conversationId: string, insights: SessionInsight[]): Promise<void> {
    if (insights.length === 0) return;
    const supabase = getSupabase();
    if (!supabase) {
      console.warn(`Supabase client not initialized. Dropping ${insights.length} insights.`);
      return;
    }

    try {
      const rows = insights.map((insight) => ({
        conversation_id: conversationId,
        type: insight.type || 'unknown',
        data: insight,
      }));

      const { error } = await supabase
        .from('insights')
        .insert(rows);

      if (error) {
        console.error('Error bulk inserting insights into Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to bulk add insights:', err);
    }
  }

  // Get all insights for a specific conversation
  async getInsights(conversationId: string): Promise<SessionInsight[]> {
    const supabase = getSupabase();
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

      return data ? data.map((row) => row.data as SessionInsight) : [];
    } catch (err) {
      console.error('Failed to get insights:', err);
      return [];
    }
  }

  // Helper method for setting metadata
  async setMetadata(conversationId: string, key: string, value: unknown): Promise<void> {
    await this.addInsight(conversationId, { type: 'metadata', key, value });
  }

  // Get a specific metadata value via indexed SQL query filter (L11 Payload & Memory Optimization)
  async getMetadata<T = unknown>(conversationId: string, key: string): Promise<T | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('insights')
        .select('data')
        .eq('conversation_id', conversationId)
        .eq('type', 'metadata')
        .limit(10);

      if (error) {
        console.error('Error fetching metadata from Supabase:', error);
        return null;
      }

      if (data && data.length > 0) {
        const match = data.find((r) => (r.data as SessionInsight)?.key === key);
        if (match) {
          return ((match.data as SessionInsight).value as T) ?? null;
        }
      }

      return null;
    } catch (err) {
      console.error('Failed to get metadata:', err);
      return null;
    }
  }

  // Subscribe to real-time insights for a specific conversation using Supabase Realtime WebSocket
  subscribeToInsights(conversationId: string, onInsight: (insight: SessionInsight) => void): () => void {
    const supabase = supabaseClient;
    if (!supabase || !conversationId) return () => {};

    const channelName = `realtime:insights:${conversationId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'insights',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          if (payload.new && payload.new.data) {
            onInsight(payload.new.data as SessionInsight);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn(`Supabase Realtime subscription warning for ${conversationId}:`, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const insightStore = new InsightStore();

