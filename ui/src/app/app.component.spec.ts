import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { TokenStorageService } from './features/auth/services/token-storage.service';
import { BehaviorSubject, of } from 'rxjs';

describe('AppComponent', () => {
  beforeEach(async () => {
    const tokenStorageSpy = jasmine.createSpyObj('TokenStorageService', [
      'getToken', 
      'getTokenObservable', 
      'isAuthenticated'
    ]);
    tokenStorageSpy.getToken.and.returnValue(null);
    tokenStorageSpy.getTokenObservable.and.returnValue(of(null));
    tokenStorageSpy.isAuthenticated.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        AppComponent
      ],
      providers: [
        { provide: TokenStorageService, useValue: tokenStorageSpy }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the correct title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Angular App');
  });

  it('should render router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
