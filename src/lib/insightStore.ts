// Global singleton to hold session insights during development
// In a production app, this would be a database or Redis
class InsightStore {
  private insights: Record<string, any[]> = {};

  addInsight(conversationId: string, insight: any) {
    if (!this.insights[conversationId]) {
      this.insights[conversationId] = [];
    }
    this.insights[conversationId].push(insight);
  }

  getInsights(conversationId: string) {
    return this.insights[conversationId] || [];
  }

  setMetadata(conversationId: string, key: string, value: any) {
    if (!this.insights[conversationId]) {
      this.insights[conversationId] = [];
    }
    // Store metadata as a special type or in a separate map. 
    // For simplicity in this dev singleton, we'll push it as a special object.
    this.addInsight(conversationId, { type: 'metadata', key, value });
  }

  getMetadata(conversationId: string, key: string) {
    const insights = this.getInsights(conversationId);
    const meta = insights.find(i => i.type === 'metadata' && i.key === key);
    return meta ? meta.value : null;
  }
}

export const insightStore = new InsightStore();
