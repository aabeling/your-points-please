import { Component, NgZone } from "@angular/core";
import { SpeechRecognition, SpeechRecognitionOptions, SpeechRecognitionTranscription } from "nativescript-speech-recognition";
import { TNSPlayer } from 'nativescript-audio';

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
  sounds: { "ding": any };
  private player: TNSPlayer;

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
              this.isInCommandMode = false;
              this.setLabelForListening();
            });
          }
          this.startListening();
        }                
      }
    }

    this.player = new TNSPlayer();
    // You can pass a duration hint to control the behavior of other application that may
    // be holding audio focus.
    // For example: new  TNSPlayer(AudioFocusDurationHint.AUDIOFOCUS_GAIN_TRANSIENT);
    // Then when you play a song, the previous owner of the
    // audio focus will stop. When your song stops
    // the previous holder will resume.
    this.player.debug = true; // set true to enable TNSPlayer console logs for debugging.
    this.player
      .initFromFile({
        audioFile: '~/sounds/ding.mp3', // ~ = app directory
        loop: false,
        completeCallback: function() {},
        errorCallback: function() {}
      })
      .then(() => {
        this.player.getAudioTrackDuration().then(duration => {
          // iOS: duration is in seconds
          // Android: duration is in milliseconds
          console.log(`song duration:`, duration);
        });
      });
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
      });
    }
    this.startListening();
  }

  handleCommand(command :string) {

  }

  setLabelForListening() {
    if (this.isInCommandMode) {
      this.labelText = "Ja? Was denn?"
      this.player.play();
    } else {
      this.labelText = "Ich höre..."
    }
  }
}
