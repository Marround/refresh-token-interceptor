import {Component, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {range, zip} from 'rxjs';
import {concatMap, delay} from 'rxjs/operators';

@Component({
  selector: 'app-protected',
  templateUrl: './protected.component.html',
  styleUrls: ['./protected.component.sass']
})
export class ProtectedComponent implements OnInit {
  responses = [];

  constructor(private authService: AuthService) {
  }

  ngOnInit() {
    range(0, 2).pipe(
      concatMap(i => {
        const arr = Array(3).fill(this.authService.getUsers());
        return zip(...arr).pipe(
          delay(2000)
        );
      })
    ).subscribe(res => {
        this.responses.unshift(res);
      },
      err => {
        console.warn(err);
      },
      () => {
        console.log('END');
      });
  }

}
