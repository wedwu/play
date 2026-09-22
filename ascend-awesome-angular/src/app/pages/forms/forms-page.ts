import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { inject } from '@angular/core';
import { DemoSection } from '../../shared/demo-section/demo-section';
import { PageHeader } from '../../shared/page-header/page-header';
import { WaValueAccessorDirective } from '../../shared/wa-value-accessor.directive';

/**
 * Form controls page.
 *
 * Demonstrates every Web Awesome input primitive and — more importantly — how
 * they bind to Angular's reactive forms through
 * {@link WaValueAccessorDirective}. The submitted value is echoed back so the
 * binding can be verified visually rather than taken on trust.
 */
@Component({
  selector: 'aa-forms-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [ReactiveFormsModule, WaValueAccessorDirective, DemoSection, PageHeader],
  templateUrl: './forms-page.html',
  styleUrl: './forms-page.scss',
})
export class FormsPage {
  private readonly formBuilder = inject(FormBuilder);

  /** Reactive form backing the "Bound to Angular forms" section. */
  protected readonly profileForm = this.formBuilder.nonNullable.group({
    fullName: ['Ada Lovelace', [Validators.required, Validators.minLength(2)]],
    email: ['ada@example.com', [Validators.required, Validators.email]],
    plan: ['standard'],
    seats: [5],
    satisfaction: [4],
    contactMethod: ['email'],
    newsletter: [true],
    notes: [''],
  });

  /** Most recent submitted payload, rendered as JSON for verification. */
  protected readonly submitted = signal<string | null>(null);

  /** Serialises the current form value so the bindings can be inspected. */
  protected handleSubmit(): void {
    this.profileForm.markAllAsTouched();

    if (this.profileForm.invalid) {
      this.submitted.set(null);
      return;
    }

    this.submitted.set(JSON.stringify(this.profileForm.getRawValue(), null, 2));
  }

  /** Restores the form to its initial values and clears the echoed payload. */
  protected handleReset(): void {
    this.profileForm.reset();
    this.submitted.set(null);
  }
}
