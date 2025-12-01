/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/workflow/nodes/LocalAINode.ts
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';

export class LocalAINode extends BaseNode {
  validate(config: any): void {
    if (!config.text) {
      throw new Error('Text is required');
    }
    
    if (!config.mode) {
      throw new Error('Mode is required');
    }
    
    if (!['summary', 'keywords', 'feedback'].includes(config.mode)) {
      throw new Error('Invalid mode. Must be summary, keywords, or feedback');
    }
  }
  
  async execute(_: NodeExecutionContext): Promise<any> {
    const { text, mode, maxLength = 100 } = this.config;
    
    try {
      switch (mode) {
        case 'summary':
          return this.generateSummary(text, maxLength);
        case 'keywords':
          return this.extractKeywords(text);
        case 'feedback':
          return this.generateFeedback(text);
        default:
          throw new Error(`Unknown mode: ${mode}`);
      }
    } catch (error) {
      throw new Error(`Local AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private generateSummary(text: string, maxLength: number): any {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join('. ').substring(0, maxLength);
    
    return {
      mode: 'summary',
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      sentenceCount: sentences.length,
    };
  }
  
  private extractKeywords(text: string): any {
    // Simple keyword extraction - remove common words and get unique words
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
    
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    const keywords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    return {
      mode: 'keywords',
      keywords,
      totalWords: words.length,
      uniqueWords: Object.keys(wordCount).length,
      wordFrequency: wordCount,
    };
  }
  
  private generateFeedback(text: string): any {
    const wordCount = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = Math.round(wordCount / sentences);
    
    let feedback = '';
    let score = 50;
    
    if (wordCount < 50) {
      feedback += 'Consider adding more detail to your response. ';
      score -= 10;
    } else if (wordCount > 500) {
      feedback += 'Your response is quite lengthy. Consider being more concise. ';
      score -= 5;
    }
    
    if (avgWordsPerSentence > 25) {
      feedback += 'Some sentences are very long. Consider breaking them up for better readability. ';
      score -= 10;
    } else if (avgWordsPerSentence < 10) {
      feedback += 'Your sentences are quite short. Consider combining some ideas. ';
      score -= 5;
    }
    
    if (!feedback) {
      feedback = 'Good structure and length. Consider reviewing for clarity and grammar. ';
      score = 85;
    }
    
    return {
      mode: 'feedback',
      feedback,
      score: Math.max(0, Math.min(100, score)),
      metrics: {
        wordCount,
        sentenceCount: sentences,
        avgWordsPerSentence,
      },
    };
  }
}