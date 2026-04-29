import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { firstValueFrom } from 'rxjs';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NotificationService] });
    service = TestBed.inject(NotificationService);
  });

  // ── Emission ──────────────────────────────────

  describe('success', () => {
    it('emits a notification with type "success"', async () => {
      const notification = firstValueFrom(service.notifications$);
      service.success('Saved', 'All changes saved');
      const n = await notification;
      expect(n.type).toBe('success');
      expect(n.title).toBe('Saved');
      expect(n.message).toBe('All changes saved');
    });
  });

  describe('error', () => {
    it('emits a notification with type "error" and longer duration', async () => {
      const notification = firstValueFrom(service.notifications$);
      service.error('Failed');
      const n = await notification;
      expect(n.type).toBe('error');
      expect(n.duration).toBe(6000);
    });
  });

  describe('warn', () => {
    it('emits a notification with type "warn"', async () => {
      const notification = firstValueFrom(service.notifications$);
      service.warn('Attention');
      const n = await notification;
      expect(n.type).toBe('warn');
    });
  });

  describe('info', () => {
    it('emits a notification with type "info"', async () => {
      const notification = firstValueFrom(service.notifications$);
      service.info('FYI');
      const n = await notification;
      expect(n.type).toBe('info');
    });
  });

  // ── History ───────────────────────────────────

  describe('history', () => {
    it('records emitted notifications', () => {
      service.success('A');
      service.error('B');
      expect(service.history).toHaveLength(2);
    });

    it('stores most recent first', () => {
      service.success('First');
      service.error('Second');
      expect(service.history[0].title).toBe('Second');
    });

    it('caps history at 50 entries', () => {
      for (let i = 0; i < 55; i++) service.info(`n${i}`);
      expect(service.history.length).toBeLessThanOrEqual(50);
    });
  });

  describe('unreadCount', () => {
    it('counts unread notifications', () => {
      service.success('A');
      service.success('B');
      expect(service.unreadCount).toBe(2);
    });

    it('decreases after markRead', () => {
      service.success('A');
      const id = service.history[0].id;
      service.markRead(id);
      expect(service.unreadCount).toBe(0);
    });
  });

  // ── Mark read ─────────────────────────────────

  describe('markRead', () => {
    it('marks a single notification as read', () => {
      service.success('A');
      const id = service.history[0].id;
      service.markRead(id);
      expect(service.history[0].read).toBe(true);
    });

    it('no-ops for unknown id', () => {
      service.success('A');
      expect(() => service.markRead('unknown-id')).not.toThrow();
    });
  });

  describe('markAllRead', () => {
    it('marks all notifications as read', () => {
      service.success('A'); service.error('B');
      service.markAllRead();
      expect(service.history.every(n => n.read)).toBe(true);
    });
  });

  // ── clearHistory ──────────────────────────────

  describe('clearHistory', () => {
    it('empties the history array', () => {
      service.success('A'); service.error('B');
      service.clearHistory();
      expect(service.history).toHaveLength(0);
    });
  });
});
