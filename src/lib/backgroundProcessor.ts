// Background processing for file operations and system tray functionality

import { ThoughtSummary } from '@/lib/types';
import { fileSystemManager } from '@/lib/fileSystem';

export interface BackgroundTask {
  id: string;
  type: 'save_summary' | 'cleanup' | 'notification';
  data: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export class BackgroundProcessor {
  private static instance: BackgroundProcessor | null = null;
  private taskQueue: BackgroundTask[] = [];
  private processing = false;
  private worker: Worker | null = null;

  private constructor() {
    this.initializeWorker();
    this.startProcessing();
  }

  static getInstance(): BackgroundProcessor {
    if (!this.instance) {
      this.instance = new BackgroundProcessor();
    }
    return this.instance;
  }

  // Initialize web worker for background processing
  private async initializeWorker() {
    if (typeof window === 'undefined') return;

    try {
      // Create a simple worker for background tasks
      const workerCode = `
        self.onmessage = function(e) {
          const { type, data } = e.data;
          
          switch (type) {
            case 'process_task':
              // Simulate background processing
              setTimeout(() => {
                self.postMessage({ 
                  type: 'task_completed', 
                  taskId: data.id,
                  result: 'success'
                });
              }, 100);
              break;
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));

      this.worker.onmessage = (e) => {
        const { type, taskId, result } = e.data;
        if (type === 'task_completed') {
          this.handleTaskCompletion(taskId, result);
        }
      };
    } catch (error) {
      console.log('Web Worker not available, using main thread processing');
    }
  }

  // Add task to background queue
  addTask(type: BackgroundTask['type'], data: any): string {
    const task: BackgroundTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.taskQueue.push(task);
    this.notifyTaskAdded(task);
    
    return task.id;
  }

  // Process tasks in the background
  private async startProcessing() {
    if (this.processing) return;
    
    this.processing = true;
    
    while (true) {
      const pendingTasks = this.taskQueue.filter(task => task.status === 'pending');
      
      if (pendingTasks.length > 0) {
        const task = pendingTasks[0];
        await this.processTask(task);
      } else {
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Process individual task
  private async processTask(task: BackgroundTask) {
    task.status = 'processing';
    
    try {
      switch (task.type) {
        case 'save_summary':
          await this.saveSummaryInBackground(task.data as ThoughtSummary);
          break;
        case 'cleanup':
          await this.performCleanup();
          break;
        case 'notification':
          await this.showNotification(task.data.title, task.data.message);
          break;
      }
      
      task.status = 'completed';
    } catch (error) {
      console.error('Background task failed:', error);
      task.status = 'failed';
    }
  }

  // Save summary in background
  private async saveSummaryInBackground(summary: ThoughtSummary) {
    try {
      // Save to localStorage for web mode
      const savedSummaries = JSON.parse(localStorage.getItem('backgroundSummaries') || '[]');
      savedSummaries.push(summary);
      localStorage.setItem('backgroundSummaries', JSON.stringify(savedSummaries));
      console.log(`Background save completed for summary ${summary.id}`);
    } catch (error) {
      console.error('Background save failed:', error);
      throw error;
    }
  }

  // Perform cleanup tasks
  private async performCleanup() {
    try {
      // Clean up old completed tasks
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      this.taskQueue = this.taskQueue.filter(task => {
        return task.status !== 'completed' || (now - task.timestamp < maxAge);
      });
      
      console.log('Background cleanup completed');
    } catch (error) {
      console.error('Background cleanup failed:', error);
      throw error;
    }
  }

  // Show system notification
  private async showNotification(title: string, message: string) {
    try {
      // Use web notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
      } else if ('Notification' in window) {
        // Request permission if not granted
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body: message });
        }
      }
    } catch (error) {
      console.error('Notification failed:', error);
      throw error;
    }
  }

  // Handle task completion from worker
  private handleTaskCompletion(taskId: string, result: string) {
    const task = this.taskQueue.find(t => t.id === taskId);
    if (task) {
      task.status = result === 'success' ? 'completed' : 'failed';
    }
  }

  // Notify about new task
  private async notifyTaskAdded(task: BackgroundTask) {
    if (task.type === 'save_summary') {
      console.log(`Background task queued: Save summary ${task.data.id}`);
    }
  }

  // Get queue status
  getQueueStatus() {
    const status = {
      pending: this.taskQueue.filter(t => t.status === 'pending').length,
      processing: this.taskQueue.filter(t => t.status === 'processing').length,
      completed: this.taskQueue.filter(t => t.status === 'completed').length,
      failed: this.taskQueue.filter(t => t.status === 'failed').length,
    };
    
    return status;
  }

  // Schedule automatic save for summary
  scheduleSummaryAutoSave(summary: ThoughtSummary) {
    return this.addTask('save_summary', summary);
  }

  // Schedule cleanup
  scheduleCleanup() {
    return this.addTask('cleanup', {});
  }

  // Send notification
  sendNotification(title: string, message: string) {
    return this.addTask('notification', { title, message });
  }

  // Cleanup and shutdown
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.processing = false;
  }
}

// Initialize background processor when module loads
export const backgroundProcessor = BackgroundProcessor.getInstance();