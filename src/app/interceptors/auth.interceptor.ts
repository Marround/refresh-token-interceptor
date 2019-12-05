import {HttpErrorResponse, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {concat, Observable, of, range, timer, zip} from 'rxjs';
import {AuthService} from '../services/auth.service';
import {catchError, concatMap, filter, map, retryWhen, scan, shareReplay, switchMap, takeWhile, tap} from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let clone: HttpRequest<any>;
    let headers = new HttpHeaders()
      .set('Cache-Control', 'no-store, no-cache, must-revalidate')
      .append('Content-Type', 'application/json');

    if (this.authService.authData && this.authService.authData.access_token && !this.isRefresh(req.body)) {
      headers = new HttpHeaders()
        .set('Cache-Control', 'no-store, no-cache, must-revalidate')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'bearer:' + this.authService.authData.access_token);

      clone = req.clone({headers});
      return next.handle(clone).pipe(
        retryWhen(error => {
          const replayError = error.pipe(shareReplay(1));

          const observableForRetries =
            zip(range(1, 5), replayError)
              .pipe(
                takeWhile(([index, res]) => {
                  if (res instanceof HttpErrorResponse) {
                    return res.status === 0;
                  } else {
                    return false;
                  }
                }),
                switchMap(i => this.authService.refresh(this.authService.authData.access_token, this.authService.authData.refresh_token))
              );
          const observableForFailure = replayError.pipe(
            map(err => {
              throw err;
            })
          );
          return concat(observableForRetries, observableForFailure);
        })
      );
    }
    return next.handle(req);
  }

  private isRefresh(body: any): boolean {
    return !!(body && body.grant_type);
  }
}
