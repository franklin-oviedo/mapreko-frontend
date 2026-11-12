import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { AbstractControl } from '@angular/forms';
import { AuthClient } from '../auth/auth-client';
import { routeApplication } from '../auth/auth.models';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, NgOptimizedImage],
  template: `
    <span class="eyebrow-dark">TU CUENTA</span>
    <h1 tabindex="-1">Mi perfil</h1>
    <p class="muted page-intro">Lo esencial sobre ti, siempre actualizado.</p>
    <section class="panel profile-heading" aria-label="Identidad de Google">
      @if (session()?.user?.avatarUrl; as avatar) {
        @if (!imageFailed()) {
          <img
            [ngSrc]="avatar"
            width="64"
            height="64"
            alt="Foto de perfil de Google"
            referrerpolicy="no-referrer"
            (error)="imageFailed.set(true)"
          />
        } @else {
          <span class="avatar" role="img" aria-label="Sin foto de perfil">{{ initials() }}</span>
        }
      } @else {
        <span class="avatar" role="img" aria-label="Sin foto de perfil">{{ initials() }}</span>
      }
      <div>
        <h2>{{ name() }}</h2>
        <p class="muted small">{{ session()?.user?.email }}</p>
        <span class="badge">GOOGLE VERIFICADO</span>
      </div>
    </section>
    <form class="panel profile-form section-title" [formGroup]="form" (ngSubmit)="save()">
      <h2>Informacion personal</h2>
      <p class="muted small">
        El correo y la identidad de Google no se modifican desde MAPREKO. Los demas campos son
        opcionales.
      </p>
      <div class="form-grid">
        <div class="field">
          <label for="givenName">Nombre</label
          ><input
            id="givenName"
            formControlName="givenName"
            autocomplete="given-name"
            maxlength="80"
          />
        </div>
        <div class="field">
          <label for="familyName">Apellidos</label
          ><input
            id="familyName"
            formControlName="familyName"
            autocomplete="family-name"
            maxlength="80"
          />
        </div>
        <div class="field">
          <label for="displayName">Como quieres que te llamemos</label
          ><input
            id="displayName"
            formControlName="displayName"
            autocomplete="nickname"
            maxlength="120"
          />
        </div>
        <div class="field">
          <label for="phone">Telefono</label
          ><input
            id="phone"
            formControlName="phone"
            type="tel"
            autocomplete="tel"
            aria-describedby="phone-help"
            [attr.aria-invalid]="form.controls.phone.touched && form.controls.phone.invalid"
          />
          <small
            id="phone-help"
            [class.field-error]="form.controls.phone.touched && form.controls.phone.invalid"
            >Usa entre 7 y 15 digitos. Puedes agregar +, espacios, parentesis o guiones.</small
          >
        </div>
        <div class="field">
          <label for="locale">Idioma de preferencia</label
          ><select id="locale" formControlName="locale">
            <option value="es">Espanol</option>
            <option value="en">Ingles</option>
          </select>
        </div>
        <div class="field">
          <label for="timeZone">Zona horaria</label
          ><input
            id="timeZone"
            formControlName="timeZone"
            aria-describedby="zone-help"
            [attr.aria-invalid]="form.controls.timeZone.touched && form.controls.timeZone.invalid"
          />
          <small
            id="zone-help"
            [class.field-error]="form.controls.timeZone.touched && form.controls.timeZone.invalid"
            >Por ejemplo: America/Santo_Domingo o UTC.</small
          >
        </div>
      </div>
      @if (error()) {
        <p class="notice" role="alert">{{ error() }}</p>
      }
      @if (saved()) {
        <p class="success" role="status">Tu perfil se ha actualizado.</p>
      }
      <div class="form-actions">
        <button class="button primary" type="submit" [disabled]="busy()">
          {{ busy() ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly auth = inject(AuthClient);
  readonly application = routeApplication(inject(ActivatedRoute).snapshot);
  readonly session = computed(() => this.auth.sessions()[this.application]);
  readonly name = computed(
    () => this.session()?.user.displayName || this.session()?.user.givenName || 'Mi cuenta',
  );
  readonly initials = computed(() => this.name().slice(0, 1).toUpperCase());
  readonly imageFailed = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly saved = signal(false);
  private readonly user = this.session()?.user;
  readonly form = inject(FormBuilder).nonNullable.group({
    givenName: [this.user?.givenName ?? '', Validators.maxLength(80)],
    familyName: [this.user?.familyName ?? '', Validators.maxLength(80)],
    displayName: [this.user?.displayName ?? '', Validators.maxLength(120)],
    phone: [
      this.user?.phone ?? '',
      Validators.pattern(/^(?=(?:\D*\d){7,15}\D*$)\+?[0-9 ()-]{7,25}$/),
    ],
    locale: [this.user?.locale ?? 'es'],
    timeZone: [
      this.user?.timeZone ?? 'UTC',
      [
        Validators.required,
        (control: AbstractControl<unknown>) => {
          try {
            new Intl.DateTimeFormat('es', { timeZone: String(control.value) });
            return null;
          } catch (error) {
            if (error instanceof RangeError) return { timeZone: true };
            throw error;
          }
        },
      ],
    ],
  });

  async save(): Promise<void> {
    this.saved.set(false);
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los campos del formulario antes de guardar.');
      return;
    }
    this.busy.set(true);
    const value = this.form.getRawValue();
    try {
      await this.auth.updateProfile(this.application, {
        ...value,
        givenName: value.givenName.trim() || null,
        familyName: value.familyName.trim() || null,
        displayName: value.displayName.trim() || null,
        phone: value.phone.trim() || null,
      });
      this.saved.set(true);
      this.form.markAsPristine();
    } catch (error) {
      this.error.set(this.auth.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
