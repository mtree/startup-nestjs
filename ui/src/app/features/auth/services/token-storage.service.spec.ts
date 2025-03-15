import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;
  const testToken = 'test-jwt-token';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenStorageService]
    });
    service = TestBed.inject(TokenStorageService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('token management', () => {
    it('should store and retrieve token', () => {
      service.setToken(testToken);
      expect(service.getToken()).toBe(testToken);
      expect(localStorage.getItem('auth_token')).toBe(testToken);
    });

    it('should remove token when set to null', () => {
      service.setToken(testToken);
      service.setToken(null);
      expect(service.getToken()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should emit token changes through observable', (done) => {
      const expectedEmissions = [null, testToken, null, 'new-token'];
      let emissionCount = 0;

      service.getTokenObservable().subscribe(token => {
        expect(token).toBe(expectedEmissions[emissionCount]);
        emissionCount++;
        if (emissionCount === expectedEmissions.length) {
          done();
        }
      });

      // Skip first emission as it's the initial null value
      service.setToken(testToken);
      service.setToken(null);
      service.setToken('new-token');
    });

    it('should clear tokens', () => {
      service.setToken(testToken);
      service.clearTokens();
      expect(service.getToken()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('authentication state', () => {
    it('should return true when authenticated', () => {
      service.setToken(testToken);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when not authenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false after clearing tokens', () => {
      service.setToken(testToken);
      service.clearTokens();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('localStorage integration', () => {
    it('should initialize with existing token from localStorage', () => {
      localStorage.setItem('auth_token', testToken);
      // Create a new instance to test initialization
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [TokenStorageService]
      });
      const newService = TestBed.inject(TokenStorageService);
      expect(newService.getToken()).toBe(testToken);
    });

    it('should persist token changes to localStorage', () => {
      service.setToken(testToken);
      const newService = TestBed.inject(TokenStorageService);
      expect(newService.getToken()).toBe(testToken);
    });
  });
}); 