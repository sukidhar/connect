import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { SocketIoModule } from 'ngx-socket-io';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SocketIoModule.forRoot({
      url:'https://963e0888cbf1.ngrok.io',
      options : {transports: ['websocket', 'polling', 'flashsocket']},
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
