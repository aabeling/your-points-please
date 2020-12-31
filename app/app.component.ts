import { Component, NgZone } from "@angular/core";
import { SpeechRecognition, SpeechRecognitionOptions, SpeechRecognitionTranscription } from "nativescript-speech-recognition";
var sound = require("nativescript-sound");

const TRIGGER = "schreib auf";

@Component({
  selector: "my-app",
  template: `
    <ActionBar title="Game Counter" class="action-bar"></ActionBar>
    <StackLayout>
      <Label text="Das Keyword ist 'Schreib auf'"></Label>
      <Button text="Lauschen" (tap)="triggerListening()"></Button>
      <Button text="Weghören" (tap)="stopListening()"></Button>
      <Label [text]="labelText"></Label>
      <Label [text]="recognizedText" textWrap="true"></Label>
    </StackLayout>
  `
})
export class AppComponent {
  
  options: SpeechRecognitionOptions;
  labelText: string = "Ich höre höflich weg.";
  isInCommandMode : boolean = false;
  recognizedText : string = "";
  sounds: { "ding": any, "dong": any };
  
  constructor(
    private speechRecognition : SpeechRecognition,
    private zone: NgZone) {

    this.options = {
      returnPartialResults: false,
      onResult: (transcription : SpeechRecognitionTranscription) => {
        this.onTranscriptionResult(transcription);        
      },
      onError: (error: string | number) => {
        console.error(`onError: ${error}`);
        if (error == 7 || error == 6) {
          if (this.isInCommandMode) {
            this.zone.run(() => {
              if (this.isInCommandMode) {
                this.playStoppedListeningForCommand();
              }
              this.isInCommandMode = false;
              this.setLabelForListening();
            });
          }
          this.startListening();
        }                
      }
    }

    this.sounds = {
      "ding": sound.create("~/sounds/ding.mp3"),
      "dong": sound.create("~/sounds/dong.mp3")
    }
  }

  public triggerListening() {
    this.speechRecognition.available().then((available:boolean) => {
      console.log("speech recognition availability: " + available);
      if (available) {
        this.startListening();
      }
    }, (error) => {
      console.error("failed to detect availability");
      console.error(error);      
    });
  }

  startListening() {
    this.speechRecognition.startListening(this.options).then(() => {
      console.log("started listening");
      this.zone.run(() => {
        this.setLabelForListening();
      });
    }, error => {
      console.error("failed to listen");
      console.error(error);
      this.zone.run(() => {
        this.isInCommandMode = false;
        this.setLabelForListening();        
      });
      this.startListening();
    });
  }

  stopListening() {
    this.speechRecognition.stopListening().then(
      () => { 
        console.log(`stopped listening`);
        this.zone.run(() => {
          this.labelText = "ich höre höflich weg.";
        });
      },
      (errorMessage: string) => { console.log(`Stop error: ${errorMessage}`); }
    );
  }

  onTranscriptionResult(transcription : SpeechRecognitionTranscription) {

    console.log(`user said: ${transcription.text}`);
    console.log(`user finished?: ${transcription.finished}`);
    this.zone.run(() => {
      this.recognizedText = transcription.text + "\n" + this.recognizedText;
    });

    if (this.isInCommandMode) {
      this.handleCommand(transcription.text);
    }

    if (transcription.text.includes(TRIGGER)) {
      this.zone.run(() => {
        this.isInCommandMode = true;
        this.setLabelForListening();
        this.playReadyToListenForCommand();      
      });
    }
    this.startListening();
  }

  playReadyToListenForCommand() {
    console.log("ready to listen for command");
    this.sounds['ding'].play();
  }

  playStoppedListeningForCommand() {  
    this.sounds['dong'].play();
  }

  handleCommand(command :string) {

    let changePlayerNameExp = new RegExp('^spiele.* (.+) heißt (.+)$','i');

    let match = command.match(changePlayerNameExp);
    if (match) {
      let playerNo = this.understandAsNumber(match[1]);
      if (playerNo) {
        this.changePlayerName(playerNo, match[2]);
      } // TODO else play failbuzzer
    }
  }

  setLabelForListening() {
    if (this.isInCommandMode) {
      this.labelText = "Ja? Was denn?"      
    } else {
      this.labelText = "Ich höre..."
    }
  }

  changePlayerName(playerNo : number, name : string) {
    console.log(`change player: no: ${playerNo} new name: ${name}`);
    // TODO
  }

  understandAsNumber(text : string) {
    if (text.match(/\d+/)) {
      return parseInt(text);
    } else if (text.match(/eins/i)) {
      return 1;
    } else if (text.match(/zwei/i)) {
      return 2;
    } else {
      return undefined;
    }
  }
}
