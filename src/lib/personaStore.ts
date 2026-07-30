import { insightStore, getSupabase } from './insightStore';

export class PersonaStore {
  // Check distributed Supabase cache for an existing Tavus persona_id matching configHash
  async getCachedPersonaId(configHash: string): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('insights')
        .select('data')
        .eq('conversation_id', 'global_persona_cache')
        .eq('type', 'persona_mapping')
        .limit(50);

      if (error || !data) return null;

      const match = data.find((row) => {
        const d = row.data as { configHash?: string; key?: string };
        return d.configHash === configHash || d.key === configHash;
      });

      if (match) {
        const val = match.data as { personaId?: string; value?: string };
        return val.personaId || (val.value as string) || null;
      }

      return null;
    } catch {
      return null;
    }
  }

  // Persist a newly created persona_id globally so all serverless lambdas reuse it
  async setCachedPersonaId(configHash: string, personaId: string): Promise<void> {
    await insightStore.addInsight('global_persona_cache', {
      type: 'persona_mapping',
      key: configHash,
      value: personaId,
      configHash,
      personaId,
      timestamp: new Date().toISOString()
    });
  }
}

export const personaStore = new PersonaStore();
