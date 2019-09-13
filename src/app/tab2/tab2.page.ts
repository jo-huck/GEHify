import { Component } from '@angular/core';

import { ImagePicker } from '@ionic-native/image-picker/ngx';
import watermark from 'watermarkjs';
import { Base64ToGallery } from '@ionic-native/base64-to-gallery/ngx';
import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  imageResponse: any;
  imageProcessed = [];
  processed = false;
  options: any;
  constructor(
    private file: File,
    private imagePicker: ImagePicker,
    private base64ToGallery: Base64ToGallery
  ) {}
  b64toBlob(b64Data, contentType, sliceSize: any = '') {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  /**
   * Create a Image file according to its database64 content only.
   *
   * @param folderpath {String} The folder where the file will be created
   * @param filename {String} The name of the file that will be created
   * @param content {Base64 String} Important : The content can't contain the following string 
   * (data:image/png[or any other format];base64,). Only the base64 string is expected.
   * 
   */
  savebase64AsImageFile(folderpath, filename, content, contentType) {
    // Convert the base64 string in a Blob
    var DataBlob = this.b64toBlob(content, contentType);

    console.log('Starting to write the file :3');

    this.file.resolveLocalFilesystemUrl(folderpath).then(dir => {
      dir.getDirectory("DCIM", { create: true }, (subDir) => {
        subDir.getDirectory("GEHify", { create: true }, (ownDir) => {
          console.log('Access to the directory granted succesfully');
          ownDir.getFile(filename, { create: true }, file => {
            console.log('File created succesfully.');
            file.createWriter(
              fileWriter => {
                console.log('Writing content to file');
                fileWriter.write(DataBlob);
              },
              () => {
                alert('Unable to save file in path ' + folderpath);
              }
            );
          });

        });
      });
    });
  }
  save(){
    this.imageProcessed.forEach(img => {
      /** Process the type1 base64 string **/
      var myBaseString = img;

      // Split the base64 string in data and contentType
      var block = myBaseString.split(';');
      // Get the content type
      var dataType = block[0].split(':')[1]; // In this case 'image/png'
      // get the real base64 content of the file
      var realData = block[1].split(',')[1]; // In this case 'iVBORw0KGg....'

      // The path where the file will be created
      var folderpath = 'file:///storage/emulated/0/';
      // The name of your file, note that you need to know if is .png,.jpeg etc
      var filename = 'geh_' + Math.floor(Math.random()*999999999999) + '.png';

      this.savebase64AsImageFile(folderpath, filename, realData, dataType);
    });
  }
  calcPx(imageLenght, percent) {
    return (imageLenght * (percent / 100));
  }
  getSmallSize(image) {
    if (image.height < image.width) {
      return image.height;
    }else {
      return image.width;
    }
  }
  addLogo() {
    const logoSize = 30;
    for (var image of this.imageResponse) {
      watermark([image, '/assets/icon/watermark.svg'], {
        height: '2px'
      })
        .image((image, watermarkImage) => {
          let context = image.getContext('2d');
          context.save();

          // context.globalAlpha = alpha;
          context.drawImage(
            watermarkImage,
            image.width -
              ((watermarkImage.width / watermarkImage.width) *
                this.calcPx(this.getSmallSize(image), logoSize) +
                10),

            image.height - ((watermarkImage.height / watermarkImage.width) *
              this.calcPx(this.getSmallSize(image), logoSize) + 10),

            (watermarkImage.width / watermarkImage.width) *
              this.calcPx(this.getSmallSize(image), logoSize),

            (watermarkImage.height / watermarkImage.width) *
              this.calcPx(this.getSmallSize(image), logoSize)
          );
          context.restore();
          return image;
        })
        // .image(watermark.image.lowerRight())
        .then(img => {
          this.imageProcessed.push(img.getAttribute('src'));
        });
    }
    this.processed = true;
    this.imageResponse = null;
  }
  getImages() {
    this.options = {
      // Android only. Max images to be selected, defaults to 15. If this is set to 1, upon
      // selection of a single image, the plugin will return it.
      //maximumImagesCount: 3,

      // max width and height to allow the images to be.  Will keep aspect
      // ratio no matter what.  So if both are 800, the returned image
      // will be at most 800 pixels wide and 800 pixels tall.  If the width is
      // 800 and height 0 the image will be 800 pixels wide if the source
      // is at least that wide.
      //width: 10000,
      //height: 200,

      // quality of resized image, defaults to 100
      quality: 100,

      // output type, defaults to FILE_URIs.
      // available options are
      // window.imagePicker.OutputType.FILE_URI (0) or
      // window.imagePicker.OutputType.BASE64_STRING (1)
      outputType: 1
    };
    this.imageResponse = [];
    this.imagePicker.getPictures(this.options).then(
      results => {
        for (var i = 0; i < results.length; i++) {
          this.imageResponse.push('data:image/jpeg;base64,' + results[i]);
        }
      },
      err => {
        alert(err);
      }
    );
  }
}
