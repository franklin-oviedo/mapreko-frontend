import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';
import { AuthClient } from '../auth/auth-client';
import { testSession } from '../auth/auth.test-fixtures';
import { ProfilePage } from './profile-page';

describe('ProfilePage', () => {
  const updateProfile = vi.fn().mockResolvedValue(undefined);
  beforeEach(() => {
    updateProfile.mockClear();
    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { application: 'user' } } } },
        {
          provide: AuthClient,
          useValue: {
            sessions: signal({ user: testSession, admin: null }),
            updateProfile,
            errorMessage: () => 'No pudimos guardar.',
          },
        },
      ],
    });
  });

  it('shows invalid input feedback without submitting it', async () => {
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.componentInstance.form.controls.phone.setValue('invalid-phone');
    await fixture.componentInstance.save();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(updateProfile).not.toHaveBeenCalled();
    expect(element.querySelector('#phone')?.getAttribute('aria-invalid')).toBe('true');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Revisa');
  });

  it('saves only editable profile fields and announces success', async () => {
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.componentInstance.form.controls.displayName.setValue(' Anita ');
    await fixture.componentInstance.save();
    fixture.detectChanges();
    expect(updateProfile).toHaveBeenCalledWith('user', {
      givenName: 'Ana',
      familyName: null,
      displayName: 'Anita',
      phone: null,
      locale: 'es',
      timeZone: 'UTC',
    });
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent,
    ).toContain('actualizado');
  });
});
