import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, Sidebar, Header],
  templateUrl: './dashboard-layout.html',
})
export class DashboardLayout {}
