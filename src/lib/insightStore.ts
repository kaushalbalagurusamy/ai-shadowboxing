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
}

export const insightStore = new InsightStore();
