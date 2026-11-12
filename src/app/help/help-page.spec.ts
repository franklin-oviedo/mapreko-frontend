import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { HelpPage } from './help-page';
import { LegalPage } from '../legal/legal-page';

describe('HelpPage accessibility', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HelpPage],
      providers: [provideRouter([])],
    }),
  );
  it('has no axe violations', async () => {
    const fixture = TestBed.createComponent(HelpPage);
    fixture.detectChanges();

    const results = await axe.run(fixture.nativeElement);

    expect(results.violations).toEqual([]);
    fixture.destroy();
  });
});

describe('LegalPage accessibility', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [LegalPage],
      providers: [provideRouter([])],
    }),
  );
  it('has no axe violations', async () => {
    const fixture = TestBed.createComponent(LegalPage);
    fixture.detectChanges();

    const results = await axe.run(fixture.nativeElement);

    expect(results.violations).toEqual([]);
    fixture.destroy();
  });
});
