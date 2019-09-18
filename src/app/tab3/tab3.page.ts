import { Component } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { File } from '@ionic-native/file/ngx';
import { DomController } from '@ionic/angular';
@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {
  constructor(private file: File, private camera: Camera) {}
  selectVid() {
    const options: CameraOptions = {
      quality: 50,
      destinationType: this.camera.DestinationType.FILE_URI,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      mediaType: this.camera.MediaType.VIDEO
    };
    this.camera.getPicture(options).then(imageData => {
      console.log('selected ' + imageData);
      const fullPath: string = imageData.toString();
      const filename = fullPath.substring(fullPath.lastIndexOf('/') + 1);
      const path = fullPath.substring(0, fullPath.lastIndexOf('/') + 1);
      console.log(path + ' \n' + filename);
      this.file.resolveLocalFilesystemUrl('file://' + path).then(dir => {
        console.log('resolved filesystem url');
        dir.getFile(filename, { create: false }, fileEntry => {
          console.log('got file');
          fileEntry.file(file => {
            console.log('load file...');
            let fileReader = new FileReader();
            fileReader.readAsArrayBuffer(file);
            fileReader.onloadend = state => {
              console.log('Successful file read: ' + fileReader.result);
              let req = new XMLHttpRequest();
              req.open('GET', '/assets/icon/icon.jpg',true);
              req.responseType = 'arraybuffer';
              req.onload = () => {
                console.log('watermark load response: ' + req.response);
                const worker = new Worker('./ffmpeg/worker.js');
                const outputElement = document.querySelector('#terminal');
                worker.onmessage = (event) => {
                  let message = event.data;
                  if (message.type == 'ready') {
                    outputElement.textContent = 'Loaded';
                    worker.postMessage({
                      type: 'command',
                      arguments: ['-help'],
                      files: [{data: new Uint8Array(fileReader.result)}, {name: 'input.mp4', data: new Uint8Array(req.response)}]
                    });
                  } else if (message.type == 'stdout') {
                    outputElement.textContent += message.data + '\n';
                    console.log(message.data + '\n');
                  } else if (message.type == 'start') {
                    outputElement.textContent = 'Worker has received command\n';
                  }
                }
              };
              req.send(null);
                //   arguments: [
                //     '-i',
                //     'input.mp4',
                //     '-i',
                //     'watermark.jpg',
                //     '-rtbufsize',
                //     '50M',
                //     '-filter_complex',
                //     'overlay=W-w-5:H-h-5',
                //     'output.mp4'
                //   ],
            };
          });
        });
      });
    });
  }
}
