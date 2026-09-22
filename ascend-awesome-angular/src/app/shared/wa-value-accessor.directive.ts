import { Directive, ElementRef, HostListener, inject, Renderer2, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Element shape shared by Web Awesome form controls.
 *
 * Value-style controls (`wa-input`, `wa-select`, `wa-slider`, …) expose
 * `value`; boolean controls (`wa-checkbox`, `wa-switch`) expose `checked`.
 */
interface WaFormControlElement extends HTMLElement {
  value?: string | number | string[];
  checked?: boolean;
  disabled?: boolean;
}

/**
 * Bridges Web Awesome form controls into Angular's forms API.
 *
 * Angular's built-in accessors only recognise native `input`, `select` and
 * `textarea` elements, so `[(ngModel)]` and `formControlName` are inert on a
 * `<wa-input>` without this directive. Attaching it registers a
 * {@link ControlValueAccessor} that reads and writes the custom element's
 * `value` (or `checked`) property and listens for its `input`/`change` events.
 *
 * Boolean controls are detected by the presence of a `checked` property on the
 * element, so the same directive serves both shapes.
 *
 * @example
 * ```html
 * <wa-input label="Full name" [(ngModel)]="name" name="name"></wa-input>
 * <wa-switch [(ngModel)]="notifications" name="notifications">Notify me</wa-switch>
 * ```
 */
@Directive({
  selector:
    'wa-input[ngModel], wa-input[formControl], wa-input[formControlName],' +
    'wa-textarea[ngModel], wa-textarea[formControl], wa-textarea[formControlName],' +
    'wa-select[ngModel], wa-select[formControl], wa-select[formControlName],' +
    'wa-checkbox[ngModel], wa-checkbox[formControl], wa-checkbox[formControlName],' +
    'wa-switch[ngModel], wa-switch[formControl], wa-switch[formControlName],' +
    'wa-slider[ngModel], wa-slider[formControl], wa-slider[formControlName],' +
    'wa-rating[ngModel], wa-rating[formControl], wa-rating[formControlName],' +
    'wa-radio-group[ngModel], wa-radio-group[formControl], wa-radio-group[formControlName],' +
    'wa-number-input[ngModel], wa-number-input[formControl], wa-number-input[formControlName],' +
    'wa-color-picker[ngModel], wa-color-picker[formControl], wa-color-picker[formControlName]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WaValueAccessorDirective),
      multi: true,
    },
  ],
})
export class WaValueAccessorDirective implements ControlValueAccessor {
  private readonly elementRef = inject<ElementRef<WaFormControlElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  private onChange: (value: unknown) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /** True when the host element is a boolean control such as a checkbox or switch. */
  private get isBooleanControl(): boolean {
    return 'checked' in this.elementRef.nativeElement;
  }

  /**
   * Pushes a model value onto the custom element.
   *
   * @param value - Value supplied by the Angular form control.
   */
  writeValue(value: unknown): void {
    const element = this.elementRef.nativeElement;

    if (this.isBooleanControl) {
      this.renderer.setProperty(element, 'checked', Boolean(value));
      return;
    }

    this.renderer.setProperty(element, 'value', value ?? '');
  }

  /**
   * Registers Angular's change callback.
   *
   * @param fn - Callback invoked whenever the element reports a new value.
   */
  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  /**
   * Registers Angular's touched callback.
   *
   * @param fn - Callback invoked when the element loses focus.
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Reflects Angular's disabled state onto the element.
   *
   * @param isDisabled - Whether the control should be disabled.
   */
  setDisabledState(isDisabled: boolean): void {
    this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', isDisabled);
  }

  /** Reads the element's current value and forwards it to Angular. */
  @HostListener('input')
  @HostListener('change')
  protected handleValueChange(): void {
    const element = this.elementRef.nativeElement;
    this.onChange(this.isBooleanControl ? Boolean(element.checked) : element.value);
  }

  /** Marks the control as touched when focus leaves the element. */
  @HostListener('blur')
  @HostListener('wa-blur')
  protected handleBlur(): void {
    this.onTouched();
  }
}
