import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, ReplaySubject} from 'rxjs';
import {ILogin} from '../interfaces/login-response';
import {catchError, map, tap} from 'rxjs/operators';
import {Router} from '@angular/router';

@Injectable()
export class AuthService {
  logged = new ReplaySubject<boolean>(1);
  isRefresh = false;

  authData: ILogin;

  constructor(private http: HttpClient, private router: Router) {
    this.logged.next(false);
  }

  login(login: string, password: string): Observable<ILogin> {
    const basic = btoa(`${login}:${password}`);
    const url = '/auth/oauth2/v2/token';
    const body = {grant_type: 'client_credentials'};
    const headers = new HttpHeaders().set('Authorization', `Basic ${basic}`);
    const options = {headers};

    return this.http.post(url, body, options).pipe(
      map<any, ILogin>(res => {
        if (!res.status) {
          return res;
        } else {
          throw new Error(res.status.message);
        }
      }),
      tap(res => {
        this.logged.next(true);
        this.authData = res;
        localStorage.setItem('userData', JSON.stringify(res));
        this.router.navigate(['/protected']);
      })
    );
  }

  revoke(login, password, accessToken: string): Observable<any> {
    const url = '/auth/oauth2/revoke';
    const body = {access_token: accessToken};
    const headers = new HttpHeaders().set('Authorization', `client_id: ${login}, client_secret:${password}`);
    const options = {headers};
    return this.http.post(url, body, options).pipe(
      tap(() => {
        this.authData = null;
        this.router.navigate(['/auth']);
      })
    );
  }

  refresh(accessToken: string, refreshToken: string): Observable<ILogin> {
    const url = '/auth/oauth2/v2/token';
    const body = {
      grant_type: 'refresh_token',
      access_token: accessToken,
      refresh_token: refreshToken
    };
    return this.http.post(url, body).pipe(
      map<any, ILogin>(res => res),
      tap(res => {
        console.log(res);
        this.authData = res;
        localStorage.setItem('userData', JSON.stringify(res));
        this.isRefresh = false;
        this.logged.next(true);
      }),
      catchError(err => {
        this.router.navigate(['/']);
        this.logged.next(false);
        this.authData = null;
        this.isRefresh = false;
        localStorage.removeItem('userData');
        throw err;
      })
    );
  }

  getUsers(): Observable<any> {
    const url = '/api/1/users';
    return this.http.get(url);
  }
}
