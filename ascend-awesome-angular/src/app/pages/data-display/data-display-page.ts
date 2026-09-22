import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { DemoSection } from '../../shared/demo-section/demo-section';
import { PageHeader } from '../../shared/page-header/page-header';

/** A row in the sample team table. */
export interface TeamMember {
  /** Display name. */
  readonly name: string;
  /** Job title. */
  readonly role: string;
  /** Initials rendered in the avatar fallback. */
  readonly initials: string;
  /** Account state, mapped to a badge variant. */
  readonly status: 'active' | 'invited' | 'suspended';
  /** Storage consumed, in bytes — formatted by `wa-format-bytes`. */
  readonly usageBytes: number;
  /** Last sign-in, formatted by `wa-relative-time`. */
  readonly lastSeen: Date;
}

/**
 * Data display page.
 *
 * Covers presentational components — cards, badges, avatars, progress
 * indicators, skeletons, trees — plus Web Awesome's formatting primitives,
 * which localise dates, numbers and byte sizes without any Angular pipes.
 */
@Component({
  selector: 'aa-data-display-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [DemoSection, PageHeader],
  templateUrl: './data-display-page.html',
  styleUrl: './data-display-page.scss',
})
export class DataDisplayPage {
  /** Sample rows for the table example. */
  protected readonly team: readonly TeamMember[] = [
    {
      name: 'Ada Lovelace',
      role: 'Principal Engineer',
      initials: 'AL',
      status: 'active',
      usageBytes: 4_823_193_600,
      lastSeen: new Date(Date.now() - 1000 * 60 * 12),
    },
    {
      name: 'Grace Hopper',
      role: 'Staff Engineer',
      initials: 'GH',
      status: 'active',
      usageBytes: 1_288_490_188,
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
      name: 'Alan Turing',
      role: 'Research Lead',
      initials: 'AT',
      status: 'invited',
      usageBytes: 0,
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      name: 'Katherine Johnson',
      role: 'Data Scientist',
      initials: 'KJ',
      status: 'suspended',
      usageBytes: 734_003_200,
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
    },
  ];

  /** Toggles the skeleton example between loading and loaded states. */
  protected readonly loading = signal(true);

  /** Progress value driving the bar and ring examples. */
  protected readonly progress = signal(68);

  /** Flips the skeleton demo's loading state. */
  protected toggleLoading(): void {
    this.loading.update((value) => !value);
  }

  /**
   * Maps an account status onto a Web Awesome badge variant.
   *
   * @param status - Account status from {@link TeamMember}.
   * @returns The matching badge variant name.
   */
  protected badgeVariant(status: TeamMember['status']): string {
    switch (status) {
      case 'active':
        return 'success';
      case 'invited':
        return 'neutral';
      case 'suspended':
        return 'danger';
    }
  }
}
