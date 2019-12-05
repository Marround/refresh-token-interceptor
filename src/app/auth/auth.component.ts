import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../services/auth.service';
import {ILogin} from '../interfaces/login-response';
import {Router} from '@angular/router';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  form = new FormGroup({
    login: new FormControl('7286bf85a6f744617be40bd879c8141664ad07248334417163ccdd8a8839314a', Validators.required),
    password: new FormControl('d0cb5f5f7b31ae2d61e069eb3d9eb02e05c19cb90155f8c3522a6b305c750e2c', Validators.required)
  });
  errMessage: string;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    let userData: ILogin;
    try {
      userData = JSON.parse(localStorage.getItem('userData'));
    } catch (e) { }

    if (userData && userData.access_token) {
      this.authService.authData = userData;
      this.authService.logged.next(true);
      this.router.navigate(['/protected']);
    }
  }

  login() {
    this.authService.login(this.form.value.login, this.form.value.password).subscribe(null, err => {
      this.errMessage = err.message;
    });
  }
}
