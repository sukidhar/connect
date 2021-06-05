import { Component, OnInit, NgZone } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import { Socket } from "ngx-socket-io";
import { v4 as uuidv4 }  from 'uuid';


interface VideoElement{
  muted : boolean;
  srcObject : MediaStream;
  userId : String;
  userName : String;
};

declare global{
  interface Window{
    homeComponent : any
  }
}

declare const Peer:any;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})



export class HomeComponent implements OnInit {
  videos : VideoElement[] = [];
  mainVideo = {} as VideoElement;
  myStream = {} as MediaStream;
  peer = {} as any;
  username = "";


  constructor(private route : ActivatedRoute,private socket : Socket,private zone : NgZone) { 
    window['homeComponent'] = {
      zone : this.zone,
      toggleVideoStream : (value:any)=> this.exposedToggleVideoStream(value),
      toggleAudioStream : (value:any)=> this.exposedToggleAudioStream(value),
    };
  }
  exposedToggleAudioStream(value: any) {
    this.myStream.getAudioTracks()[0].enabled = value == "true";
  }
  exposedToggleVideoStream(value: any) {
    this.myStream.getVideoTracks()[0].enabled = value == "true";
  }

  
  

  ngOnInit(): void {
    this.peer = new Peer(uuidv4(),{
      host: "mad-project-android.herokuapp.com",
      port : 443,
      secure : true,
    })

    
    console.log(this.peer.id);
    this.route.params.subscribe((params)=>{
      console.log(params);

      this.peer.on('open', (userId:any)=> {
        this.socket.emit('join-meeting', {
          roomId : params.room,
          id: userId,
        });
      });
    })

    navigator.mediaDevices.getUserMedia({
      audio:true,
      video:true
    })
    .catch((err) => {
      console.error('[Error] Not able to retrieve user media:', err);
      return null;
    })
    .then((stream : MediaStream | null)=>{
      if(stream){
        this.mainVideo.srcObject = stream;
        this.mainVideo.muted = true;
        this.myStream = stream;
        this.addUserToVideoQueue("username","testerId",stream);
      }

      this.peer.on('call', (call : any) => {
        console.log('receiving call...', call);
        call.answer(stream);
      

        call.on('stream', (callerStream: MediaStream) => {
          console.log('receiving other stream', callerStream);
          this.addUserToVideoQueue("joiner",call.metadata.userId, callerStream);
        });

        call.on('error', (err:any) => {
          console.error(err);
        })

      });

        this.socket.on('user-joined',(data:any)=>{
          console.log(`calling user with userid ${data.userId}`)

          //todo copy this into start call methods
          setTimeout(() => {
            const call = this.peer.call(data.userId, stream, {
              metadata: { userId: this.peer.id },
            });
            call.on('stream', (otherUserVideoStream: MediaStream) => {
              console.log('receiving other user stream after his connection');
              this.addUserToVideoQueue("tester",data.userId, otherUserVideoStream);
            });

            call.on('close', () => {
              this.videos = this.videos.filter((video) => video.userId !== data.userId);
            });
          }, 1000);
          
        })

        //end call
        this.socket.on('user-disconnected', (userId:String) => {
          console.log(`receiving user-disconnected event from ${userId}`)
          this.videos = this.videos.filter(video => video.userId !== userId);
        });

    })
  }

  onClick(videoElement : VideoElement){
    this.mainVideo = videoElement
  }

  onLoadedMetadata(event: Event) {
    (event.target as HTMLVideoElement).play();
  }
  
  addUserToVideoQueue(username : String, userId : String, videoStream : MediaStream ){
    const alreadyInCall = this.videos.some(video=>video.userId == userId);
    if (alreadyInCall){
      console.log("already in call");
      return;
    }
    this.videos.push({
      muted:false,
      srcObject : videoStream,
      userId : userId,
      userName : username
    })
  }
}
